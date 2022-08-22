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

 const euroFiat32 =  utils.formatBytes32String("EUFT");
 const inrFiat32 = utils.formatBytes32String("INRFT");
 const euroLP32 = utils.formatBytes32String("EULP");
 const inrLP32 = utils.formatBytes32String("INRLP");

  const euro = await ethers.getContractFactory("TokenisedFiat");
  const euroToken = await euro.deploy("Euro Fiat Token","EUTF");
  await euroToken.deployed();

  console.log("euroToken deployed to:", euroToken.address);

  const inr = await ethers.getContractFactory("TokenisedFiat");
  const inrToken = await inr.deploy("Rupee Fiat Token","INRTF");
  await inrToken.deployed();

  console.log("rupeeToken deployed to:", inrToken.address);

  const euroLP = await ethers.getContractFactory("LPTokens");
  const euroLPToken = await euroLP.deploy("Euro Liquidity Pool Token","EULP");
  await euroLPToken.deployed();

  console.log("euro LP Token deployed to:", euroLPToken.address);

  const inrLP = await ethers.getContractFactory("TokenisedFiat");
  const inrLPToken = await inrLP.deploy("Rupee Liquidity Pool Token","INRLP");
  await inrLPToken.deployed();

  console.log("rupee LP Token deployed to:", inrLPToken.address);

  const rapid = await ethers.getContractFactory("RapidProtocol");
  const rapidContract = await rapid.deploy("Rapid Governance Token","RGT");
  await rapidContract.deployed();

  console.log("Rapid Contract deployed to:", rapidContract.address);

      // add LP tokens to pool registry 

      await rapidContract.addFiatToken(euroFiat32, euroToken.address);
      await rapidContract.addFiatToken(inrFiat32, inrToken.address);
  
      await rapidContract.addLPToken(euroLP32, euroLPToken.address);
      await rapidContract.addLPToken(inrLP32, inrLPToken.address);

      // send some fiat tokens to Rapid Contract 

      const euroLiquidity = 1000;
      const inrLiquidity = 10000000;
  
      await euroToken.transfer(rapidContract.address,euroLiquidity);
      await inrToken.transfer(rapidContract.address,inrLiquidity);

      const inrFiatBal = await inrToken.balanceOf(rapidContract.address);
      const euroFiatBal = await euroToken.balanceOf(rapidContract.address);

      console.log("inr-fiat balance of Rapid Contract:", inrFiatBal);
      console.log("euro-fiat balance of Rapid Contract:", euroFiatBal);

      // send some LP tokens to Rapid Contract 

      await euroLPToken.transfer(rapidContract.address,euroLiquidity);
      await inrLPToken.transfer(rapidContract.address,inrLiquidity);

      const inrLPBal = await inrLPToken.balanceOf(rapidContract.address);
      const euroLPBal = await euroLPToken.balanceOf(rapidContract.address);

      console.log("inr-fiat balance of Rapid Contract:", inrLPBal);
      console.log("euro-fiat balance of Rapid Contract:", euroLPBal);

      // send some INR Fiat and LP tokens to Traveler
      const Traveller = '0x80585785B7BbABF20756f7C86714017e012CE5D9';
      await inrToken.transfer(Traveller,100000);
      await inrLPToken.transfer(Traveller,100000);

      // send some EURO Fiat and LP tokens to Merchant
      const Merchant = '0xcD3715F79d3E8ebc7301B73D2D709F62D751A7bc'
      await euroToken.transfer(Merchant,1000);
      await euroLPToken.transfer(Merchant,1000);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
