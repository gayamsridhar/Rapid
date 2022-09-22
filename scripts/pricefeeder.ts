// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// npx hardhat console --network rinkeby
const { parseBytes32String } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
const utils = ethers.utils;

async function main() {

 const INR2USD = "0xDA0F8Df6F5dB15b346f4B8D1156722027E194E60";
 const EUR2USD = "0x73366Fe0AA0Ded304479862808e02506FE556a98";

  const rapid = await ethers.getContractFactory("RapidProtocol");
  const rapidContract = await rapid.deploy("RapidX Governance Token","RGT", INR2USD, EUR2USD);
  await rapidContract.deployed();

  console.log("Rapid Contract deployed to:", rapidContract.address);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
