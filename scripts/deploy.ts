// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// npx hardhat console --network rinkeby
const { ethers } = require("hardhat");

async function main() {

  const euro = await ethers.getContractFactory("TokenisedFiat");
  const euroToken = await euro.deploy("Euro Fiat Token","EUTF");
  await euroToken.deployed();

  console.log("euroToken deployed to:", euroToken.address);

  const inr = await ethers.getContractFactory("TokenisedFiat");
  const inrToken = await euro.deploy("Rupee Fiat Token","INRTF");
  await inrToken.deployed();

  console.log("rupeeToken deployed to:", inrToken.address);

  const euroLP = await ethers.getContractFactory("LPTokens");
  const euroLPToken = await euro.deploy("Euro Liquidity Pool Token","EULP");
  await euroLPToken.deployed();

  console.log("euro LP Token deployed to:", euroLPToken.address);

  const inrLP = await ethers.getContractFactory("TokenisedFiat");
  const inrLPToken = await euro.deploy("Rupee Liquidity Pool Token","INRLP");
  await inrLPToken.deployed();

  console.log("rupee LP Token deployed to:", inrLPToken.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
