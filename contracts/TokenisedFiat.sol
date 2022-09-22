// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenisedFiat is ERC20{

  address public faitTokenAdmin;
    
  constructor(string memory name, string memory symbol,  uint adminSupply) ERC20(name,symbol) {
    faitTokenAdmin = msg.sender;
    _mint(msg.sender,adminSupply);
  }


  function fMint(address to, uint amount) external onlyAdmin {
    _mint(to, amount);
  }

  function fBurn(address to, uint amount) external {
       _burn(to, amount);
  }

  modifier onlyAdmin() {
    require(msg.sender == faitTokenAdmin, "only admin");
    _;
  }

}