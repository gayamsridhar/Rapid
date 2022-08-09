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
    mapping(bytes32 => uint) public fiatTokenBalance;
    mapping(bytes32 => uint) public poolTokenBalance;

    constructor(string memory name, string memory symbol) ERC20(name,symbol) {
        admin = msg.sender;
    }

    function addFiatToken(bytes32 symbol, address tokenAddress) public onlyAdmin{
        fiatTokens[symbol] = Token(symbol, tokenAddress);
        fiatTokenList.push(symbol);
    } // token Registry

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

    function addLPToken(bytes32 symbol, address tokenAddress) public onlyAdmin{
        lpTokens[symbol] = Token(symbol, tokenAddress);
        lpTokenList.push(symbol);
    } // token Registry

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

    function addLiquidity(uint amount, address to, bytes32 fromSymbol, bytes32 toSymbol, uint ratio) public fiatTokenExist(fromSymbol) lpTokenExist(toSymbol) onlyAdmin {
     ERC20(lpTokens[toSymbol].tokenAddress).transfer(to, amount*ratio);
    }  

    function withdrawLiquidity(uint amount, address to, bytes32 fromSymbol, bytes32 toSymbol, uint count) public lpTokenExist(fromSymbol) fiatTokenExist(toSymbol) checkRequestTimeStamp(count)onlyAdmin {
     ERC20(fiatTokens[toSymbol].tokenAddress).transfer(to, amount);
    }  

    function withdrawRequest(uint amount, address to, bytes32 toSymbol) public lpTokenExist(toSymbol) onlyAdmin {
        requestCounter++;
       // withdrawRequests[requestCounter]= [amount, to, toSymbol, block.timestamp];
        withdrawRequests[requestCounter].timestamp = block.timestamp;
        withdrawRequests[requestCounter].amount = amount;
        withdrawRequests[requestCounter].to = to;
        withdrawRequests[requestCounter].tokenSymbol = toSymbol;
    } 

    function getRequestTimeStamp(uint count) public view returns (uint timeStamp) {
       return withdrawRequests[count].timestamp;
    }
    function getRequestTokenSymbol(uint count) public view returns (bytes32 to) {
       return withdrawRequests[count].tokenSymbol;
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
            withdrawRequests[count].timestamp <= block.timestamp-4, "Wait for reuqest to process"
        );
        _;
    }
}

     