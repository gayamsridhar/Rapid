// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PriceFeeder.sol";

contract RapidProtocol is ERC20, PriceFeeder{
    
    struct Token {
        bytes32 symbol;
        address tokenAddress;
    }

    uint requestCounter;

    ERC20 public token;
    address public admin;
    mapping(bytes32 => Token) public fiatTokens;
    mapping(bytes32 => Token) public lpTokens;
    bytes32[] public fiatTokenList;
    bytes32[] public lpTokenList;

    mapping(bytes32 => uint) internal equilibriumFee; // 20 basis points(1/100 percent) which means 0.2%(20/100)
    mapping(bytes32 => uint) public liquidityFactor;
    uint256 private BASE_DIVISOR = 1000000;
    uint256 private FEE_DIVISOR = 10000;
    uint256 private BASE_FACTOR = 10**18;

    mapping(bytes32 => uint) public suppliedLiquidity;
    mapping(bytes32 => uint) public lpFeePool;
    mapping(bytes32 => uint) public ipFeePool;


    mapping(address => mapping(bytes32 => uint)) public liquidityProvider;
    mapping(address => mapping(bytes32 => uint)) public lpFee2Withdraw;

    event AddLiquidity(uint amount, address to, bytes32 fiatSymbol, bytes32 lpSymbol);
    event WithdrawLiquidity(uint amount, address to, bytes32 fiatSymbol);
    event TransferFiat(uint amount, address to, bytes32 destinationFiatSymbol);

    constructor(string memory name, string memory symbol, address INR2USDfeedAddress, address EURO2USDfeedAddress) ERC20(name,symbol) PriceFeeder(INR2USDfeedAddress,EURO2USDfeedAddress) {
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
    // 1. user will send his fiat tokens to contract (tokensnised FIat : Transfer function ) - AMount
    // 2. addLiquidity by admin to transfer LP tokens from Contract to USER

    function addLiquidity(uint amount, address to, bytes32 fiatSymbol, bytes32 lpSymbol, uint ratio) public fiatTokenExist(fiatSymbol) lpTokenExist(lpSymbol){
        uint allowanceAmount = ERC20(fiatTokens[fiatSymbol].tokenAddress).allowance(to, address(this));
        require(allowanceAmount>=amount, "amount is greater than allowance amount");
        ERC20(fiatTokens[fiatSymbol].tokenAddress).transferFrom(to,address(this),amount*ratio);
        ERC20(lpTokens[lpSymbol].tokenAddress).transfer(to, amount*ratio);
        suppliedLiquidity[fiatSymbol] += amount;  
        liquidityProvider[to][fiatSymbol]+= amount;

        emit AddLiquidity(amount,to,fiatSymbol,lpSymbol);   
    }  

    // trnasfer fiat tokens from Rapid Pool Contract to recipient

    function transferFiat(address to, uint destinationAmount, bytes32 destinationFiatSymbol, uint sourceAmount, bytes32 sourceFiatSymbol) public fiatTokenExist(destinationFiatSymbol) onlyAdmin {
            uint equiFee ;

            if (equilibriumFee[destinationFiatSymbol] < 20)
                equiFee = 20;
            else            
		        equiFee = equilibriumFee[destinationFiatSymbol];
                
        uint cashBack = cashbackIPFees(sourceAmount,sourceFiatSymbol);
        uint transactionFee = calculateFee(destinationAmount,destinationFiatSymbol);
        uint ipFee = transactionFee-equiFee;

     ipFeePool[sourceFiatSymbol] -= cashBack;

     lpFeePool[destinationFiatSymbol] +=(equiFee*destinationAmount)/10000;

     ipFeePool[destinationFiatSymbol] += (ipFee*destinationAmount)/10000;
     

     ERC20(fiatTokens[destinationFiatSymbol].tokenAddress).transfer(to, destinationAmount);

      emit TransferFiat(destinationAmount, to, destinationFiatSymbol);
    } 

    // withdraw liquidity from recipient - trnasfer fiat tokens from Rapid Pool Contract to recipient

    function withdrawLiquidity(uint amount, address to, bytes32 fiatSymbol, bytes32 lpSymbol) public fiatTokenExist(fiatSymbol) {
        uint allowanceLpAmount = ERC20(lpTokens[lpSymbol].tokenAddress).allowance(to, address(this));
        require(allowanceLpAmount>=amount, "withdrawl amount is greater than allowance amount");
        ERC20(lpTokens[lpSymbol].tokenAddress).transferFrom(to,address(this),amount);
        require(liquidityProvider[to][fiatSymbol] >= amount , "Withdrawal amount requested is more than supplied liquidity");
        ERC20(fiatTokens[fiatSymbol].tokenAddress).transfer(to, amount);
        withdrawLiquidityFee(to,fiatSymbol);
        suppliedLiquidity[fiatSymbol] -= amount;
        liquidityProvider[to][fiatSymbol]-= amount;
        emit WithdrawLiquidity(amount,to,fiatSymbol); 
    }  

    function withdrawLiquidityFee(address to, bytes32 fiatSymbol) internal fiatTokenExist(fiatSymbol) {
     uint feeAccruced;
     uint share;
     (feeAccruced, share)= getLiquidityFeeAccruced(to,fiatSymbol);
     require(feeAccruced >= 0 , "reward amount is too low to withdraw at this momemnt");
     ERC20(fiatTokens[fiatSymbol].tokenAddress).transfer(to, feeAccruced);
    }

    function getLiquidityFeeAccruced(address to, bytes32 fiatSymbol) public fiatTokenExist(fiatSymbol) view returns(uint feeEarned, uint shareEarned) {
       require(suppliedLiquidity[fiatSymbol]>0 , "supplied liquidity is zero");
       uint feeAccrued = (liquidityProvider[to][fiatSymbol]*lpFeePool[fiatSymbol])/(suppliedLiquidity[fiatSymbol]);
       uint share = (liquidityProvider[to][fiatSymbol]*BASE_FACTOR)/(suppliedLiquidity[fiatSymbol]);
       return (feeAccrued,share);
    } 

    // Transfer fee calculations

    function calculateFee(uint destinationAmount, bytes32 destinationSymbol) public onlyAdmin view returns(uint totalFee) {
        require(fiatTokens[destinationSymbol].tokenAddress != address(0), "token does not exist");
        
        uint currentLiquidity;
        uint equiFee ;

            if (equilibriumFee[destinationSymbol] < 20)
                equiFee = 20;
            else            
		        equiFee = equilibriumFee[destinationSymbol];


        currentLiquidity = ERC20(fiatTokens[destinationSymbol].tokenAddress).balanceOf(address(this)) - destinationAmount;
        
        if (currentLiquidity >= suppliedLiquidity[destinationSymbol])
            return (equiFee);
        else {
            uint r;
            if (liquidityFactor[destinationSymbol] < 2)
                r =2;
            else            
                r = liquidityFactor[destinationSymbol];

            uint x = ((suppliedLiquidity[destinationSymbol] - currentLiquidity)*BASE_DIVISOR)/suppliedLiquidity[destinationSymbol];
            uint feesInBasisPoints = equiFee*((1000+((x*1000)/BASE_DIVISOR))**r)/(BASE_DIVISOR*(1000**(r-2)));
            return (feesInBasisPoints);
        }
        
    } 

    function calculateFeeAndCashback(uint sourceAmount, bytes32 sourceSymbol, uint destinationAmount, bytes32 destinationSymbol) public onlyAdmin view returns(uint totalFee, uint cashback) {
        uint cashBack = cashbackIPFees(sourceAmount,sourceSymbol);
        uint transactionFee = calculateFee(destinationAmount,destinationSymbol);
        return (transactionFee,cashBack);
    } 

    function cashbackIPFees(uint sourceAmount, bytes32 sourceSymbol) public onlyAdmin view returns(uint cashback) {
        uint currentLiquidity;
        uint sLcLdiff;
        uint cashbackFee;
        require(fiatTokens[sourceSymbol].tokenAddress != address(0), "token does not exist");
        currentLiquidity = ERC20(fiatTokens[sourceSymbol].tokenAddress).balanceOf(address(this));
		
        if (suppliedLiquidity[sourceSymbol] > currentLiquidity)
        {
		  sLcLdiff = suppliedLiquidity[sourceSymbol]-currentLiquidity;        
            if (sourceAmount > sLcLdiff)
                return ipFeePool[sourceSymbol];
            else {
                cashbackFee = (sourceAmount*ipFeePool[sourceSymbol])/sLcLdiff;
            }
        }
        return cashbackFee;
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

    function getSuppliedLiquidity(bytes32 toSymbol) public view returns (uint count) {
       return suppliedLiquidity[toSymbol];
    }   

    function getLiquidity(address user, bytes32 symbol) public view returns (uint count) {
       return liquidityProvider[user][symbol];
    }  

    function setBaseDivisor(uint bd) public onlyAdmin {
       BASE_DIVISOR = bd;
    }

    function setLiquidityFactor(bytes32 fiatSymbol, uint factor) public onlyAdmin {
       liquidityFactor[fiatSymbol] = factor;
    }

    function setEquilibriumFee(bytes32 fiatSymbol, uint fee) public onlyAdmin {
        equilibriumFee[fiatSymbol] = fee;
    }

    function getEquilibriumFee(bytes32 fiatSymbol) public view returns (uint fee) {
        if(equilibriumFee[fiatSymbol] < 20)
          return 20;
        else
          return equilibriumFee[fiatSymbol];
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

}

     