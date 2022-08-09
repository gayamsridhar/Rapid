// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// npx hardhat console --network rinkeby
const { ethers } = require("hardhat");

async function main() {

  const euro = await ethers.getContractFactory("TokenisedFiat");
  const euroToken = await euro.deploy("Euro Liquidity Pool Token","ELP");
  await euroToken.deployed();

  console.log("euroToken deployed to:", euroToken.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
