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

    uint equilibriumFee = 20; // 20 basis points which means 0.2%
    uint liquidityFactor = 2;
    uint256 private constant BASE_DIVISOR = 1000;

    mapping(bytes32 => uint) public suppliedLiquidity;
    mapping(bytes32 => uint) public lpFeePool;
    uint lpFeeConst = 1000000;

    event AddLiquidity(uint amount, address to, bytes32 fromSymbol, bytes32 toSymbol);
    event WithdrawLiquidity(uint amount, address to, bytes32 fromSymbol, bytes32 toSymbol);
    event TransferFiat(uint amount, address to, bytes32 toSymbol);

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

    function addLiquidity(uint amount, address to, bytes32 fromSymbol, bytes32 toSymbol, uint ratio) public fiatTokenExist(fromSymbol) lpTokenExist(toSymbol) onlyAdmin {
        ERC20(lpTokens[toSymbol].tokenAddress).transfer(to, amount*ratio);
        suppliedLiquidity[fromSymbol] += amount;  

        emit AddLiquidity(amount,to,fromSymbol,toSymbol);      
    }  

    // trnasfer fiat tokens from Rapid Pool Contract to recipient

    function transferFiat(uint amount, address to, bytes32 toSymbol, uint fee) public fiatTokenExist(toSymbol) onlyAdmin {
     ERC20(fiatTokens[toSymbol].tokenAddress).transfer(to, amount);
     lpFeePool[toSymbol] += fee*lpFeeConst;

      emit TransferFiat(amount, to, toSymbol);
    } 

    // withdraw liquidity from recipient - trnasfer fiat tokens from Rapid Pool Contract to recipient

    function withdrawLiquidity(uint amount, address to, bytes32 fromSymbol, bytes32 toSymbol, uint count) public lpTokenExist(fromSymbol) fiatTokenExist(toSymbol) checkRequestTimeStamp(count) onlyAdmin {
     ERC20(fiatTokens[toSymbol].tokenAddress).transfer(to, amount);
     suppliedLiquidity[toSymbol] -= amount;

     emit WithdrawLiquidity(amount,to,fromSymbol,toSymbol); 
    }  

    // Transfer fee calculations

    function calculateFee(uint amount, bytes32 toSymbol) public fiatTokenExist(toSymbol) onlyAdmin view returns(uint totalFee) {
     uint currentLiquidity = ERC20(fiatTokens[toSymbol].tokenAddress).balanceOf(address(this)) - amount;
     if (currentLiquidity >= suppliedLiquidity[toSymbol])
        return equilibriumFee;
     else {
        uint x = ((suppliedLiquidity[toSymbol] - currentLiquidity)*BASE_DIVISOR)/suppliedLiquidity[toSymbol];
        //uint x = (suppliedLiquidity[toSymbol] - currentLiquidity);
        uint TF = equilibriumFee*((1+x)**liquidityFactor);
        return TF;
     }
    } 

    // storing the withdraw requests

    function withdrawRequest(uint amount, address to, bytes32 toSymbol) public lpTokenExist(toSymbol) onlyAdmin {
        requestCounter++;
        withdrawRequests[requestCounter].timestamp = block.timestamp;
        withdrawRequests[requestCounter].amount = amount;
        withdrawRequests[requestCounter].to = to;
        withdrawRequests[requestCounter].tokenSymbol = toSymbol;      
    } 

    function updateEquilibriumFee(uint to) public onlyAdmin(){
        equilibriumFee = to;
    }

    function getSuppliedLiquidity(bytes32 toSymbol) public view returns (uint count) {
       return suppliedLiquidity[toSymbol];
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

     