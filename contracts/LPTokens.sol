// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LPTokens is ERC20{

  address public lpTokenAdmin ;

  constructor(string memory name, string memory symbol, uint adminSupply) ERC20(name,symbol) {
    lpTokenAdmin = msg.sender;
    _mint(msg.sender,adminSupply);
  }


  function lpMint(address to, uint amount) external onlyAdmin  {
    _mint(to, amount);
  }

  function lpBurn(address to, uint amount) external onlyAdmin  {
       _burn(to, amount);
  }
  
  modifier onlyAdmin() {
    require(msg.sender == lpTokenAdmin, "only admin");
    _;
  }

}
