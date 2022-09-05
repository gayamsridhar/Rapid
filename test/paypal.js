const { expect } = require("chai");
const { parseBytes32String } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

const utils = ethers.utils;

let adminUser, Seller, Buyer, LiquidityProvider1, LiquidityProvider2, LiquidityProvider3;
let euro, euroToken;
let inr,inrToken;
let euroLP, euroLPToken;
let inrLP,inrLPToken;
let rapid, rapidContract

const euroFiat32 =  utils.formatBytes32String("EURO");
const inrFiat32 = utils.formatBytes32String("INR");
const euroLP32 = utils.formatBytes32String("EULP");
const inrLP32 = utils.formatBytes32String("INRLP");

const inrFiatSupply = 5000000000000000;
const euroFiatSupply = 6300000000000;
const inrLPSupply = 5000000000000000;
const euroLPSupply = 6300000000000;
const totalInrFiatSupply = 1000000000;
const totalEuroFiatSupply = 12584170;
const totalInrLPSupply = 1000000000;
const totalEuroLPSupply = 12584170;


describe("Rapid Protocol", function () {
  beforeEach(async function () {
    [adminUser,  Seller, Buyer, LiquidityProvider1, LiquidityProvider2, LiquidityProvider3] = await ethers.getSigners();

    rapid = await ethers.getContractFactory("RapidProtocol");
    rapidContract = await rapid.deploy("RapidX Governance Token","RAPIDX");
    await rapidContract.deployed();

    const repidContractAddr = rapidContract.address;

    euro = await ethers.getContractFactory("TokenisedFiat");
    euroToken = await euro.deploy("Euro Fiat Token","EURO", euroFiatSupply);
    await euroToken.deployed();

    inr = await ethers.getContractFactory("TokenisedFiat");
    inrToken = await inr.deploy("Rupee Fiat Token","INR", inrFiatSupply);
    await inrToken.deployed();

    euroLP = await ethers.getContractFactory("LPTokens");
    euroLPToken = await euroLP.deploy("Euro Liquidity Pool Token","EULP", euroLPSupply);
    await euroLPToken.deployed();

    inrLP = await ethers.getContractFactory("LPTokens");
    inrLPToken = await inrLP.deploy("Rupee Liquidity Pool Token","INRLP", inrLPSupply);
    await inrLPToken.deployed();



    // add LP tokesn to pool registry 

    await rapidContract.addFiatToken(euroFiat32, euroToken.address);
    await rapidContract.addFiatToken(inrFiat32, inrToken.address);

    await rapidContract.addLPToken(euroLP32, euroLPToken.address);
    await rapidContract.addLPToken(inrLP32, inrLPToken.address);

  }); 

  it("*** Add Liquidity ***", async function () {
    console.log("----------- Get Premint Admin Balance -----------");

    const adminUserInrTokenBalance = await inrToken.balanceOf(adminUser.address);
    const adminUserEuroTokenBalance = await euroToken.balanceOf(adminUser.address);
      console.log("Admin PreMint INR Liquidity: ", adminUserInrTokenBalance.toNumber());
      console.log("Admin PreMint EURO Liquidity: ", adminUserEuroTokenBalance.toNumber()); 
    // Add LP tokens to Rapid contract
    await euroLPToken.transfer(rapidContract.address, euroLPSupply);
    await inrLPToken.transfer(rapidContract.address, inrLPSupply);

    // after transferring the fiat currency from Liquidity Provider to Rapid Bank-Account, Fiat tokens transferred to Liquidity Providers Wallet
    
    const inrLiquidity = 10000000000000;  // 10K INR (decimals -9)
    const euroLiquidity = 126000000000; //  125 Euros (decimals -9)
    console.log("---after transfering the fiat currency from Liquidity Provider to Rapid Bank-Account, Fiat tokens tranfered to Liquidity Providers Wallet---");
    await euroToken.transfer(LiquidityProvider1.address,euroLiquidity);
    await inrToken.transfer(LiquidityProvider2.address,inrLiquidity);

    const adminUserInrTokenBalance1 = await inrToken.balanceOf(adminUser.address);
    const adminUserEuroTokenBalance1 = await euroToken.balanceOf(adminUser.address);
      console.log("Admin INR Liquidity, After Transfer: ", adminUserInrTokenBalance1.toNumber());
      console.log("Admin PreMint Liquidity, After Transfer: ", adminUserEuroTokenBalance1.toNumber());
      
    // Liqudity Providers click on Add Liquidty button : LP's trassfers their fiat tokens to RapidX Pool

    console.log("---Add Liquidty button : LP's transfers their fiat tokens to RapidX Pool--")

    await inrToken.connect(LiquidityProvider2).transfer(rapidContract.address, inrLiquidity);
    await euroToken.connect(LiquidityProvider1).transfer(rapidContract.address, euroLiquidity);

    const InrPoolBalance = await inrToken.balanceOf(rapidContract.address);
    const EuroPoolBalance = await euroToken.balanceOf(rapidContract.address);
      console.log("INR Pool Balance: ", InrPoolBalance.toNumber());
      console.log("EURO Pool Balance: ", EuroPoolBalance.toNumber());

      const LiquidityProvider2InrPoolBalance = await inrToken.balanceOf(LiquidityProvider2.address);
      const LiquidityProvider1EuroPoolBalance = await euroToken.balanceOf(LiquidityProvider1.address);
        console.log("LiquidityProvider2 - INR Balance: ", LiquidityProvider2InrPoolBalance.toNumber());
        console.log("LiquidityProvider1 - EURO  Balance: ", LiquidityProvider1EuroPoolBalance.toNumber());

    // In-Return, LP's recive the LP Tokens

    console.log("---In-Return, LP's receive the LP Tokens--")

    await rapidContract.addLiquidity(inrLiquidity,LiquidityProvider2.address,inrFiat32, inrLP32,1);
    await rapidContract.addLiquidity(euroLiquidity,LiquidityProvider1.address,euroFiat32, euroLP32,1); 
    
    const LiquidityProvider2LPTokenBalance = await inrLPToken.balanceOf(LiquidityProvider2.address);
    const LiquidityProvider1LPTokenBalance = await euroLPToken.balanceOf(LiquidityProvider1.address);
      console.log("Liquidity Provider-2 INR LP Token Balance: ", LiquidityProvider2LPTokenBalance.toNumber());
      console.log("Liquidity Provider-1 EURO LP Token Balance: ", LiquidityProvider1LPTokenBalance.toNumber());
   
      console.log("---supplied Liquidity : Read from RapidX contract--")
    const suppliedINRLiquidityAfterTransfer = await rapidContract.getSuppliedLiquidity(inrFiat32);
    const suppliedEUROLiquidityAfterTransfer = await rapidContract.getSuppliedLiquidity(euroFiat32);
      console.log("supplied INR Liquidity", suppliedINRLiquidityAfterTransfer.toNumber());
      console.log("supplied EURO Liquidity", suppliedEUROLiquidityAfterTransfer.toNumber()); 

      console.log("---Liquidity of Individual Users : Reading from RapidX Contract--")

    const LiquidityProvider2Liquidity = await rapidContract.getLiquidity(LiquidityProvider2.address,inrFiat32);
    const LiquidityProvider1Liquidity = await rapidContract.getLiquidity(LiquidityProvider1.address,euroFiat32);
      console.log("INR Liquidity Provider-2 Liquidity : Reading from RapidX Contract", LiquidityProvider2Liquidity.toNumber());
      console.log("EURO Liquidity Provider-1 Liquidity : Reading from RapidX Contract", LiquidityProvider1Liquidity.toNumber()); 

    console.log("----------- Add Liquidity Ends -----------");
  }); 

  it("*** PayPal UseCase ***", async function () {
     // Add LP tokens to Rapid contract
    await euroLPToken.transfer(rapidContract.address, euroLPSupply);
    await inrLPToken.transfer(rapidContract.address, inrLPSupply);

    // after transferring the fiat currency from Liquidity Provider to Rapid Bank-Account, Fiat tokens transferred to Liquidity Providers
    
    const inrLiquidity = 10000000000000;  // 10K INR (decimals -9)
    const euroLiquidity = 126000000000; //  126 Euros (decimals -9)
   
    await euroToken.transfer(LiquidityProvider1.address,euroLiquidity);
    await inrToken.transfer(LiquidityProvider2.address,inrLiquidity);
 
    // Liqudity Providers click on Add Liquidty button : LP's trassfers their fiat tokens to RapidX Pool


    await inrToken.connect(LiquidityProvider2).transfer(rapidContract.address, inrLiquidity);
    await euroToken.connect(LiquidityProvider1).transfer(rapidContract.address, euroLiquidity);

    // In-Return, LP's recive the LP Tokens

    await rapidContract.addLiquidity(inrLiquidity,LiquidityProvider2.address,inrFiat32, inrLP32,1);
    await rapidContract.addLiquidity(euroLiquidity,LiquidityProvider1.address,euroFiat32, euroLP32,1); 

    // to get the fee(in basis points and in amount) in destination currency

    console.log("Lets say Indian user need to transfer 10.5 Euros");
    console.log("after conversion into INR : 833.05");

   // 1. Manish will send currency-pair to receive exchange rate(either SC/some other external link)
   // e.g. 10.5 EU = 833.05 INR

    const amount2transferInEU = 10500000000;
    const amount2transferInINR = 833050000000; // = 10.5 EURO

  // 2) Manish will send the destination amount and destination currency(symbol) 
  //    to smart contract to get the fee(in basis points and in amount) in destination currency
  //    await rapidContract.calculateFee(destination-amount,destination-currency(symbol));
  //    await rapidContract.calculateFeeInAmount(source-amount,destination-amount,destination-currency(symbol));
  console.log("---- Get Fee In Amount & Basis Points ---");
    const totalFeesInBasisPoints = await rapidContract.calculateFee(amount2transferInEU,euroFiat32);
    console.log("Total Fee In Basis Points: From RapidX contract: ", totalFeesInBasisPoints.toNumber());
    const x = totalFeesInBasisPoints/10000;
    console.log("Total Fee In % - Outside the contact:  ", x);
    const amount2transferInINRwithFee = (1+x)*amount2transferInINR

    console.log("Total Fee In Amount - Outside the contact: ", amount2transferInINRwithFee/1000000000);
    

    const totalFeesInAmount = await rapidContract.calculateFeeInAmount(amount2transferInINR,amount2transferInEU,euroFiat32);

    console.log("Total Fees In Amount : From RapidX contract ", totalFeesInAmount.toNumber());
    console.log("Total Fees In Amount : From RapidX contract : after devision of 9 decimals: ", totalFeesInAmount.toNumber()/1000000000);

  // 3) Manish will display the total amount to transfer to buyer      
  // 4) buyer will do bank-transfer of total amount(834.97) rupees to Rapid Organsation
  // 5) Admin will transfer the same amount to Rapid INR pool
  console.log("---- buyer will do bank-transfer & Admin will transfer the same amount to Rapid INR pool ---");
   await inrToken.transfer(rapidContract.address, amount2transferInINRwithFee);
   const InrPoolBalance = await inrToken.balanceOf(rapidContract.address);
     console.log("INR Pool Balance: ", InrPoolBalance.toNumber());
  // 5) Rapid contract will send the eurofiat to Seller
  console.log("---- Rapid contract will send the corresponding eurofiat to Seller ---");
    await rapidContract.transferFiat(amount2transferInEU,Seller.address,euroFiat32); 
    const currentEUROLiquidityAfterTransfer1 = await euroToken.balanceOf(rapidContract.address);
    console.log("current EURO Liquidity", currentEUROLiquidityAfterTransfer1.toNumber());

    const toGetEuroShateAmount = 15500000000;

    // to get the LP share 
  
    // 1. LiquidityProvider3 banks trnasfers 15.5 euro to Rapid bank account
    // 2. Admin Transfers 15.5 Euro fiat tokens to LiquidityProvider3
    await euroToken.transfer(LiquidityProvider3.address,toGetEuroShateAmount);
    
    // 3. LiquidityProvider3 transfer the euro fiat tokens to Rapid euro pool
    await euroToken.connect(LiquidityProvider3).transfer(rapidContract.address,toGetEuroShateAmount);
    // 4. Rapid contract transfers the Euro LP tokesn to LiquidityProvider3
    await rapidContract.addLiquidity(toGetEuroShateAmount,LiquidityProvider3.address,euroFiat32, euroLP32,1);
    // get Liquidity Fee Share
    const share = await rapidContract.getLiquidityFeeAccruced(LiquidityProvider3.address,euroFiat32);
    console.log("Share: ", share.toNumber());

  }); 



});
