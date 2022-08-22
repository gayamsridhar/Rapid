const { expect } = require("chai");
const { parseBytes32String } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

const utils = ethers.utils;

let adminUser, Merchant, Traveller, inrBank, euroBank;
let euro, euroToken;
let inr,inrToken;
let euroLP, euroLPToken;
let inrLP,inrLPToken;
let rapid, rapidContract
const euroFiat32 =  utils.formatBytes32String("EUFT");
const inrFiat32 = utils.formatBytes32String("INRFT");
const euroLP32 = utils.formatBytes32String("EULP");
const inrLP32 = utils.formatBytes32String("INRLP");


describe("Rapid Protocol", function () {
  beforeEach(async function () {
    [adminUser,  Merchant, Traveller, inrBank, euroBank] = await ethers.getSigners();

    rapid = await ethers.getContractFactory("RapidProtocol");
    rapidContract = await rapid.deploy("Rapid Governance Token","RGT");
    await rapidContract.deployed();

    const repidContractAddr = rapidContract.address;

    euro = await ethers.getContractFactory("TokenisedFiat");
    euroToken = await euro.deploy("Euro Fiat Token","EUFT");
    await euroToken.deployed();

    inr = await ethers.getContractFactory("TokenisedFiat");
    inrToken = await inr.deploy("Rupee Fiat Token","INRFT");
    await inrToken.deployed();

    euroLP = await ethers.getContractFactory("LPTokens");
    euroLPToken = await euroLP.deploy("Euro Liquidity Pool Token","EULP");
    await euroLPToken.deployed();

    inrLP = await ethers.getContractFactory("LPTokens");
    inrLPToken = await inrLP.deploy("Rupee Liquidity Pool Token","INRLP");
    await inrLPToken.deployed();



    // add LP tokesn to pool registry 

    await rapidContract.addFiatToken(euroFiat32, euroToken.address);
    await rapidContract.addFiatToken(inrFiat32, inrToken.address);

    await rapidContract.addLPToken(euroLP32, euroLPToken.address);
    await rapidContract.addLPToken(inrLP32, inrLPToken.address);

  }); 

  it("buy fiat tokens", async function () {
    console.log("--------------------------");

    console.log("euroFiat32:", euroFiat32);

    const adminBalanceEUROFiat = await euroToken.balanceOf(adminUser.address);
    console.log("balance of Admin User (Euro Fiat Tokens)",  adminBalanceEUROFiat.toNumber());

    const adminBalanceINRFiat = await inrToken.balanceOf(adminUser.address);
    console.log("balance of Admin User (INR Fiat Tokens)",  adminBalanceINRFiat.toNumber());

    // after trnafering the fiat currency from Bank to Rapid account, Fiat tokens tranfered to Banks
    // these are the seeded liquidity from Banks

    const inrLiquidity = 10000;
    const euroLiquidity = 100;

    await euroToken.transfer(euroBank.address,euroLiquidity);
    await inrToken.transfer(inrBank.address,inrLiquidity);
    const adminBalanceEUROFiat1 = await euroToken.balanceOf(adminUser.address);
    console.log("balance of Admin User (Euro Fiat Tokens), after transfer",  adminBalanceEUROFiat1.toNumber());

    const adminBalanceEUROFiat2 = await inrToken.balanceOf(adminUser.address);
    console.log("balance of Admin User (INR Fiat Tokens), after transfer",  adminBalanceEUROFiat2.toNumber());
    
    const balanceOne = await euroToken.balanceOf(euroBank.address);
    console.log("balance of EURO-LP(Euro Fiat Tokens), after buy",  balanceOne.toNumber());

    const balanceTwo = await inrToken.balanceOf(inrBank.address);
    console.log("balance of INR-LP (Rupee Fiat Tokens), after buy",  balanceTwo.toNumber());

    console.log("--------------------------");
  }); 

  it("Add Liquidity", async function () {
    console.log("--------------------------");

    // after trnafering the fiat currency from Bank to Rapid account, Fiat tokens tranfered to Banks
    // these are the seeded liquidity from Banks

    const inrLiquidity = 10000;
    const euroLiquidity = 100;

    await euroToken.transfer(euroBank.address,euroLiquidity);
    await inrToken.transfer(inrBank.address,inrLiquidity);

    // Add LP tokens to Rapid contract
       await euroLPToken.transfer(rapidContract.address, 1000);
       await inrLPToken.transfer(rapidContract.address, 100000);

    await inrToken.connect(inrBank).transfer(rapidContract.address, inrLiquidity);
    await euroToken.connect(euroBank).transfer(rapidContract.address, euroLiquidity);

      const balanceOne = await euroToken.balanceOf(rapidContract.address);
      console.log("balance of rapidContract(Euro Fiat Tokens), after transfer ",  balanceOne.toNumber());

      const balanceTwo = await inrToken.balanceOf(rapidContract.address);
      console.log("balance of rapidContract (Rupee Fiat Tokens), after transfer",  balanceTwo.toNumber());

    await rapidContract.addLiquidity(inrLiquidity,inrBank.address,inrFiat32, inrLP32,1);
    await rapidContract.addLiquidity(euroLiquidity,euroBank.address,euroFiat32, euroLP32,1); 
    
      const balance3 = await euroLPToken.balanceOf(euroBank.address);
      console.log("balance of EURO-LP(Euro LP Tokens), after add-liquidity",  balance3.toNumber());

      const balance4 = await inrLPToken.balanceOf(inrBank.address);
      console.log("balance of INR-LP (Rupee LP Tokens), after add-liquidity",  balance4.toNumber());

    const suppliedINRLiquidityAfterTransfer = await rapidContract.getSuppliedLiquidity(inrFiat32);
    const suppliedEUROLiquidityAfterTransfer = await rapidContract.getSuppliedLiquidity(euroFiat32);
      console.log("supplied INR Liquidity", suppliedINRLiquidityAfterTransfer.toNumber());
      console.log("supplied EURO Liquidity", suppliedEUROLiquidityAfterTransfer.toNumber());  
      
    const currentINRLiquidityAfterTransfer = await euroToken.balanceOf(rapidContract.address);
    const currentEUROLiquidityAfterTransfer = await inrToken.balanceOf(rapidContract.address);
      console.log("current INR Liquidity", currentINRLiquidityAfterTransfer.toNumber());
      console.log("current EURO Liquidity", currentEUROLiquidityAfterTransfer.toNumber()); 

    console.log("--------------------------");
  }); 

  it("Traveller Use Case", async function () {
    console.log("--------------------------");

    // after trnafering the fiat currency from Bank to Rapid account, Fiat tokens tranfered to Banks
    // these are the seeded liquidity from Banks

    const inrLiquidity = 10000;
    const euroLiquidity = 100;

    console.log("--Add Liquidity Starts--");

    await euroToken.transfer(euroBank.address,euroLiquidity);
    await inrToken.transfer(inrBank.address,inrLiquidity);

    // Add LP tokens to Rapid contract
       await euroLPToken.transfer(rapidContract.address, 1000);
       await inrLPToken.transfer(rapidContract.address, 100000);

    await inrToken.connect(inrBank).transfer(rapidContract.address, inrLiquidity);
    await euroToken.connect(euroBank).transfer(rapidContract.address, euroLiquidity);

    await rapidContract.addLiquidity(inrLiquidity,inrBank.address,inrFiat32, inrLP32,1);
    await rapidContract.addLiquidity(euroLiquidity,euroBank.address,euroFiat32, euroLP32,1);     
   
    const currentINRLiquidityAfterTransfer = await inrToken.balanceOf(rapidContract.address);
    const currentEUROLiquidityAfterTransfer = await euroToken.balanceOf(rapidContract.address);
      console.log("current INR Liquidity", currentINRLiquidityAfterTransfer.toNumber());
      console.log("current EURO Liquidity", currentEUROLiquidityAfterTransfer.toNumber()); 
    
    const suppliedINRLiquidityAfterTransfer = await rapidContract.getSuppliedLiquidity(inrFiat32);
    const suppliedEUROLiquidityAfterTransfer = await rapidContract.getSuppliedLiquidity(euroFiat32);
      console.log("supplied INR Liquidity", suppliedINRLiquidityAfterTransfer.toNumber());
      console.log("supplied EURO Liquidity", suppliedEUROLiquidityAfterTransfer.toNumber()); 

    console.log("--Add Liquidity Ends--");
    console.log("");
    console.log("--Traveller Transaction Starts--");

    // Iandian Traveller paying 10 Euros(802 INR) to Europian Merchant
    // 1. Travller transfers fiat money to Rapid Org

    // 2. transfer of 802 INR Fiat Token to Rapid Contract
    await inrToken.transfer(rapidContract.address, 802);
    const currentINRLiquidityAfterTransfer1 = await inrToken.balanceOf(rapidContract.address);
    console.log("current INR Liquidity", currentINRLiquidityAfterTransfer1.toNumber());

    // 3. Transfer of 10 Euros from Rapid Contract(Pool Address) to Merchant Address
    await rapidContract.transferFiat(10,Merchant.address,euroFiat32,20); 
    const currentEUROLiquidityAfterTransfer1 = await euroToken.balanceOf(rapidContract.address);
    console.log("current EURO Liquidity", currentEUROLiquidityAfterTransfer1.toNumber()); 

    const suppliedINRLiquidityAfterTransfer1 = await rapidContract.getSuppliedLiquidity(inrFiat32);
    const suppliedEUROLiquidityAfterTransfer1 = await rapidContract.getSuppliedLiquidity(euroFiat32);
      console.log("supplied INR Liquidity", suppliedINRLiquidityAfterTransfer1.toNumber());
      console.log("supplied EURO Liquidity", suppliedEUROLiquidityAfterTransfer1.toNumber()); 

    console.log("--Traveller Transaction Ends--");
    console.log("--------------------------");
  }); 

  it("Traveller Use Case with Fee calculations", async function () {
    console.log("--------------------------");

    // after trnafering the fiat currency from Bank to Rapid account, Fiat tokens tranfered to Banks
    // these are the seeded liquidity from Banks

    const inrLiquidity = 10000;
    const euroLiquidity = 100;


    await euroToken.transfer(euroBank.address,euroLiquidity);
    await inrToken.transfer(inrBank.address,inrLiquidity);

    // Add LP tokens to Rapid contract
       await euroLPToken.transfer(rapidContract.address, 1000);
       await inrLPToken.transfer(rapidContract.address, 100000);

    await inrToken.connect(inrBank).transfer(rapidContract.address, inrLiquidity);
    await euroToken.connect(euroBank).transfer(rapidContract.address, euroLiquidity);

    // added extra fiat to increase the current pool balance by 100
    await euroToken.transfer(rapidContract.address, 100);

    await rapidContract.addLiquidity(inrLiquidity,inrBank.address,inrFiat32, inrLP32,1);
    await rapidContract.addLiquidity(euroLiquidity,euroBank.address,euroFiat32, euroLP32,1);     

    console.log("--Traveller Transaction Starts--");

    // Iandian Traveller paying 10 Euros(802 INR) to Europian Merchant
    // 1. Travller transfers fiat money to Rapid Org

    // 2. transfer of 802 INR Fiat Token to Rapid Contract
    await inrToken.transfer(rapidContract.address, 802);
    const currentINRLiquidityAfterTransfer1 = await inrToken.balanceOf(rapidContract.address);
    console.log("current INR Liquidity", currentINRLiquidityAfterTransfer1.toNumber());


    // ** Fee Calculations**
    const fee = await rapidContract.calculateFee(10,euroFiat32);
    console.log("Fee to be paid: ", fee.toNumber());

    // 3. Transfer of 10 Euros from Rapid Contract(Pool Address) to Merchant Address
    await rapidContract.transferFiat(10,Merchant.address,euroFiat32,20); 
    const currentEUROLiquidityAfterTransfer1 = await euroToken.balanceOf(rapidContract.address);
    console.log("current EURO Liquidity", currentEUROLiquidityAfterTransfer1.toNumber()); 

    const suppliedINRLiquidityAfterTransfer1 = await rapidContract.getSuppliedLiquidity(inrFiat32);
    const suppliedEUROLiquidityAfterTransfer1 = await rapidContract.getSuppliedLiquidity(euroFiat32);
      console.log("supplied INR Liquidity", suppliedINRLiquidityAfterTransfer1.toNumber());
      console.log("supplied EURO Liquidity", suppliedEUROLiquidityAfterTransfer1.toNumber()); 

    console.log("--Traveller Transaction Ends--");
    console.log("--------------------------");
  }); 

});
