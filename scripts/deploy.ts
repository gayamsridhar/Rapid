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

 const euroFiat32 =  utils.formatBytes32String("tEURO");
 const inrFiat32 = utils.formatBytes32String("tINR");
 const usdFiat32 = utils.formatBytes32String("tUSD");
 const euroLP32 = utils.formatBytes32String("tEUROLP");
 const inrLP32 = utils.formatBytes32String("tINRLP");
 const usdLP32 = utils.formatBytes32String("tUSDLP");


const inrFiatSupply = "1000000000000000000000000";
const euroFiatSupply = "1000000000000000000000000";
const usdFiatSupply = "1000000000000000000000000";
const inrLPSupply = "1000000000000000000000000";
const euroLPSupply = "1000000000000000000000000";
const usdLPSupply = "1000000000000000000000000";

 console.log("euroFiat32(bytes32): ", euroFiat32);
 console.log("inrFiat32(bytes32): ", inrFiat32);
 console.log("usdFiat32(bytes32): ", usdFiat32);
 console.log("euroLP32(bytes32): ", euroLP32);
 console.log("inrLP32(bytes32): ", inrLP32);
 console.log("usdLP32(bytes32): ", usdLP32);

  const euro = await ethers.getContractFactory("TokenisedFiat");
  const euroToken = await euro.deploy("EURO Token","tEURO",euroFiatSupply);
  await euroToken.deployed();  

  console.log("euro Fiat Token deployed to:", euroToken.address);

  const inr = await ethers.getContractFactory("TokenisedFiat");
  const inrToken = await inr.deploy("INR Token","tINR",inrFiatSupply);
  await inrToken.deployed();

  console.log("rupee Fiat Token deployed to:", inrToken.address);

  const usd = await ethers.getContractFactory("TokenisedFiat");
  const usdToken = await usd.deploy("USD Token","tUSD",usdFiatSupply);
  await usdToken.deployed();

  console.log("usd Fiat Token deployed to:", usdToken.address);

  const euroLP = await ethers.getContractFactory("LPTokens");
  const euroLPToken = await euroLP.deploy("Euro Liquidity Pool Token","tEUROLP",euroLPSupply);
  await euroLPToken.deployed();

  console.log("euro LP Token deployed to:", euroLPToken.address);

  const inrLP = await ethers.getContractFactory("LPTokens");
  const inrLPToken = await inrLP.deploy("Rupee Liquidity Pool Token","tINRLP",inrLPSupply);
  await inrLPToken.deployed();

  console.log("rupee LP Token deployed to:", inrLPToken.address);

  const usdLP = await ethers.getContractFactory("LPTokens");
  const usdLPToken = await usdLP.deploy("US Dollar Liquidity Pool Token","tUSDLP",usdLPSupply);
  await usdLPToken.deployed();

  console.log("usd LP Token deployed to:", usdLPToken.address);

  const rapid = await ethers.getContractFactory("RapidProtocol");
  const rapidContract = await rapid.deploy("RapidX Governance Token","RGT");
  await rapidContract.deployed();

  console.log("Rapid Contract deployed to:", rapidContract.address);

      // add LP tokens to pool registry 
      
      await rapidContract.addFiatToken(euroFiat32, euroToken.address);
      await rapidContract.addFiatToken(inrFiat32, inrToken.address);
      await rapidContract.addFiatToken(usdFiat32, usdToken.address);
  
      await rapidContract.addLPToken(euroLP32, euroLPToken.address);
      await rapidContract.addLPToken(inrLP32, inrLPToken.address);
      await rapidContract.addLPToken(usdLP32, usdLPToken.address);
      

      // send LP tokens to Rapid Contract 

      await euroLPToken.transfer(rapidContract.address,euroLPSupply);
      await inrLPToken.transfer(rapidContract.address,inrLPSupply);
      await usdLPToken.transfer(rapidContract.address,usdLPSupply);

      const inrLPBal = await inrLPToken.balanceOf(rapidContract.address);
      const euroLPBal = await euroLPToken.balanceOf(rapidContract.address);
      const usdLPBal = await usdLPToken.balanceOf(rapidContract.address);

      console.log("inr-LP balance of Rapid Contract:", inrLPBal);
      console.log("euro-LP balance of Rapid Contract:", euroLPBal);
      console.log("usd-LP balance of Rapid Contract:", usdLPBal);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
