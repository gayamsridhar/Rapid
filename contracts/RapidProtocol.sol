// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TokenisedFiat.sol";


contract RapidProtocol is ERC20 {
    
    struct Token {
        bytes32 symbol;
        address tokenAddress;
    }

    struct WithdrawRequest {
        uint amount;
        address to;
        bytes32 tokenSymbol;
        uint timestamp;
    }

    mapping(uint => WithdrawRequest) public withdrawRequests;
    uint requestCounter;

    ERC20 public token;
    address public admin;
    mapping(bytes32 => Token) public fiatTokens;
    mapping(bytes32 => Token) public lpTokens;
    bytes32[] public fiatTokenList;
    bytes32[] public lpTokenList;

    uint public equilibriumFee = 20; // 20 basis points(1/100 percent) which means 0.2%(20/100)
    uint public liquidityFactor = 2;
    uint256 private BASE_DIVISOR = 1000000;
    uint256 private FEE_DIVISOR = 10000;

    mapping(bytes32 => uint) public suppliedLiquidity;
    mapping(bytes32 => uint) public lpFeePool;
    mapping(bytes32 => uint) public ipFeePool;

    uint public totalLPfee;
    uint public totalIPfee;

    mapping(address => mapping(bytes32 => uint)) public liquidityProvider;
    mapping(address => mapping(bytes32 => uint)) public lpFee2Withdraw;



    event AddLiquidity(uint amount, address to, bytes32 fiatSymbol, bytes32 lpSymbol);
    event WithdrawLiquidity(uint amount, address to, bytes32 fiatSymbol);
    event TransferFiat(uint amount, address to, bytes32 destinationFiatSymbol);

    constructor(string memory name, string memory symbol) ERC20(name,symbol) {
        admin = msg.sender;
    }

    // Add fiat token contract address to registry

    function addFiatToken(bytes32 symbol, address tokenAddress) public onlyAdmin{
        fiatTokens[symbol] = Token(symbol, tokenAddress);
        fiatTokenList.push(symbol);
    } 

    // get token contract address from registry

    function getFiatTokens() external view returns(Token[] memory) {
      Token[] memory _tokens = new Token[](fiatTokenList.length);
      for (uint i = 0; i < fiatTokenList.length; i++) {
        _tokens[i] = Token(
          fiatTokens[fiatTokenList[i]].symbol,
          fiatTokens[fiatTokenList[i]].tokenAddress
        );
      }
      return _tokens;
    }

    // Add LP token contract address to registry

    function addLPToken(bytes32 symbol, address tokenAddress) public onlyAdmin{
        lpTokens[symbol] = Token(symbol, tokenAddress);
        lpTokenList.push(symbol);
    } 

    // get LP token contract address from registry

    function getLPTokens() external view returns(Token[] memory) {
      Token[] memory _tokens = new Token[](lpTokenList.length);
      for (uint i = 0; i < fiatTokenList.length; i++) {
        _tokens[i] = Token(
          lpTokens[lpTokenList[i]].symbol,
          lpTokens[lpTokenList[i]].tokenAddress
        );
      }
      return _tokens;
    }

    // supply liquidity to Rapid Pool Contract

    function addLiquidity(uint amount, address to, bytes32 fiatSymbol, bytes32 lpSymbol, uint ratio) public fiatTokenExist(fiatSymbol) lpTokenExist(lpSymbol) onlyAdmin {
        ERC20(lpTokens[lpSymbol].tokenAddress).transfer(to, amount*ratio);
        suppliedLiquidity[fiatSymbol] += amount;  
        liquidityProvider[to][fiatSymbol]+= amount;

        emit AddLiquidity(amount,to,fiatSymbol,lpSymbol);      
    }  

    // trnasfer fiat tokens from Rapid Pool Contract to recipient

    function transferFiat(uint amount, address to, bytes32 destinationFiatSymbol) public fiatTokenExist(destinationFiatSymbol) onlyAdmin {
     uint totalFee = calculateFee(amount,destinationFiatSymbol);
     uint ipFee = totalFee-equilibriumFee;

     lpFeePool[destinationFiatSymbol] +=(equilibriumFee*amount)/10000;
     totalLPfee +=(equilibriumFee*amount)/10000;

     ipFeePool[destinationFiatSymbol] += (ipFee*amount)/10000;
     totalIPfee += (ipFee*amount)/10000;

     ERC20(fiatTokens[destinationFiatSymbol].tokenAddress).transfer(to, amount);

      emit TransferFiat(amount, to, destinationFiatSymbol);
    } 

    // withdraw liquidity from recipient - trnasfer fiat tokens from Rapid Pool Contract to recipient

    function withdrawLiquidity(uint amount, address to, bytes32 fiatSymbol) public fiatTokenExist(fiatSymbol) {
     require(liquidityProvider[to][fiatSymbol] >= amount , "Withdrawal amount requested is more than supplied liquidity");
     ERC20(fiatTokens[fiatSymbol].tokenAddress).transfer(to, amount);
     withdrawLiquidityFee(to,fiatSymbol);
     suppliedLiquidity[fiatSymbol] -= amount;
     liquidityProvider[to][fiatSymbol]-= amount;
     emit WithdrawLiquidity(amount,to,fiatSymbol); 
    }  

    function withdrawLiquidityFee(address to, bytes32 fiatSymbol) internal fiatTokenExist(fiatSymbol) {
    uint feeAccruced = getLiquidityFeeAccruced(to,fiatSymbol);
     require(feeAccruced >= 0 , "reward amount is too low to withdraw at this momemnt");
      ERC20(fiatTokens[fiatSymbol].tokenAddress).transfer(to, feeAccruced);
     totalLPfee -= feeAccruced
    }

    function getLiquidityFeeAccruced(address to, bytes32 fiatSymbol) public fiatTokenExist(fiatSymbol) view returns(uint share) {
       uint x = (liquidityProvider[to][fiatSymbol]*totalLPfee)/(suppliedLiquidity[fiatSymbol];
       return x;
    } 

    // Transfer fee calculations

    function calculateFee(uint destinationAmount, bytes32 destinationSymbol) public onlyAdmin view returns(uint totalFee) {
        uint currentLiquidity;
        if(fiatTokens[destinationSymbol].tokenAddress != address(0)){
             currentLiquidity = ERC20(fiatTokens[destinationSymbol].tokenAddress).balanceOf(address(this)) - destinationAmount;
        }else{
                require(currentLiquidity>0, "token symbol does not exist");
        }
        
        if (currentLiquidity >= suppliedLiquidity[destinationSymbol])
            return equilibriumFee;
        else {

            uint x = ((suppliedLiquidity[destinationSymbol] - currentLiquidity)*BASE_DIVISOR)/suppliedLiquidity[destinationSymbol];
        // uint y = 1000+((x*1000)/BASE_DIVISOR);
            uint feesInBasisPoints = equilibriumFee*((1000+((x*1000)/BASE_DIVISOR))**2)/BASE_DIVISOR;
            return feesInBasisPoints;
        }
    } 

    function calculateFeeInAmount(uint sourceAmount, uint destinationAmount, bytes32 destinationSymbol) public onlyAdmin view returns(uint totalFeeAmount) {
        uint totalFee = calculateFee(destinationAmount,destinationSymbol);
        return ((10000+totalFee)*sourceAmount)/10000;
    }

    function getLPFee(bytes32 symbol) public view returns(uint val){
        return lpFeePool[symbol];
    }


    function getIPFee(bytes32 symbol) public view returns(uint val){
        return ipFeePool[symbol];
    }

    // storing the withdraw requests

    function withdrawRequest(uint amount, address to, bytes32 toSymbol) public lpTokenExist(toSymbol) onlyAdmin {
        requestCounter++;
        withdrawRequests[requestCounter].timestamp = block.timestamp;
        withdrawRequests[requestCounter].amount = amount;
        withdrawRequests[requestCounter].to = to;
        withdrawRequests[requestCounter].tokenSymbol = toSymbol;      
    } 

    function getSuppliedLiquidity(bytes32 toSymbol) public view returns (uint count) {
       return suppliedLiquidity[toSymbol];
    }   

    function getLiquidity(address user, bytes32 symbol) public view returns (uint count) {
       return liquidityProvider[user][symbol];
    }  



    function setBaseDivisor(uint bd) public onlyAdmin {
       BASE_DIVISOR = bd;
    }

    function setEquilibriumFee(uint fee) public onlyAdmin {
        equilibriumFee = fee;
    }

    function setLiquidityFactor(uint lf) public onlyAdmin {
        liquidityFactor = lf;
    }

    
    modifier onlyAdmin() {
        require(msg.sender == admin, "only admin");
        _;
    }

    modifier fiatTokenExist(bytes32 symbol) {
        require(
            fiatTokens[symbol].tokenAddress != address(0), "fiat token does not exist"
        );
        _;
    }

    modifier lpTokenExist(bytes32 symbol) {
        require(
            lpTokens[symbol].tokenAddress != address(0), "LP token does not exist"
        );
        _;
    }

    modifier checkRequestTimeStamp(uint count) {
        require(
            withdrawRequests[count].timestamp <= block.timestamp-1, "Wait for reuqest to process"
        );
        _;
    }
}

     