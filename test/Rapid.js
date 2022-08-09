const { expect } = require("chai");
const { parseBytes32String } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

const utils = ethers.utils;

let adminUser, userOne, userTwo;
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
    [adminUser,  userOne, userTwo] = await ethers.getSigners();

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

  it("Token Addresses", async function () {
    console.log("--------------------------");
    console.log("Owner of the the all contracts: ", adminUser.address);
    console.log("Address of the the Euro Fiat Token contract: ", euroToken.address);
    console.log("Address of the the Rupee Fiat Token contract: ", inrToken.address);
    console.log("Address of the the Euro Liquidity Pool Token contract: ", euroLPToken.address);
    console.log("Address of the the Rupee Liquidity Pool Token contract: ", inrLPToken.address);
    console.log("");

    const euroTokenName = await euroLPToken.name();
    console.log("name of Euro Liquidity Pool Token contract: ", euroTokenName);

    const euroTokenSymbol = await euroLPToken.symbol();
    console.log("symbol of Euro Liquidity Pool Token contract: ", euroTokenSymbol);

    console.log("");

    const inrTokenName = await inrLPToken.name();
    console.log("name of Rupee Liquidity Pool Token contract: ", inrTokenName);

    const inrTokenSymbol = await inrLPToken.symbol();
    console.log("symbol of Rupee Liquidity Pool Token contract: ", inrTokenSymbol);

    console.log("--------------------------");

    console.log("--------------------------");

    const registeredTokens = await rapidContract.getFiatTokens();
    // console.log("registered tokens with rapid protocol",  registeredTokens);

   for (let i = 0 ; i <  registeredTokens.length; i++) {
     console.log("registered fiat token address with rapid protocol # ", +i+1 + " : " +  registeredTokens[i].tokenAddress);
     let x = registeredTokens[i].sybmol;
     // console.log("b32 of euro",euroFiat32);
     console.log("registered fiat token symbol rapid protocol # ", +i+1 + " : " +  x);
    }
    console.log("--------------------------");

    console.log("--------------------------");

    const registeredLPTokens = await rapidContract.getLPTokens();
    // console.log("registered tokens with rapid protocol",  registeredTokens);

   for (let i = 0 ; i <  registeredLPTokens.length; i++) {
     console.log("registered LP token address with rapid protocol # ", +i+1 + " : " +  registeredLPTokens[i].tokenAddress);
     console.log("registered LP token symbol rapid protocol # ", +i+1 + " : " +  parseInt(registeredLPTokens[i].sybmol));
    }
    console.log("--------------------------");


  }); 


  it("buy fiat tokens", async function () {
    console.log("--------------------------");

    const adminBalanceEUROFiat = await euroToken.balanceOf(adminUser.address);
    console.log("balance of Admin User (Euro Fiat Tokens)",  adminBalanceEUROFiat.toNumber());

    const adminBalanceINRFiat = await inrToken.balanceOf(adminUser.address);
    console.log("balance of Admin User (INR Fiat Tokens)",  adminBalanceINRFiat.toNumber());

    await euroToken.transfer(userOne.address,1000);
    await inrToken.transfer(userTwo.address,10000);
    const adminBalanceEUROFiat1 = await euroToken.balanceOf(adminUser.address);
    console.log("balance of Admin User (Euro Fiat Tokens), after transfer",  adminBalanceEUROFiat1.toNumber());

    const adminBalanceEUROFiat2 = await inrToken.balanceOf(adminUser.address);
    console.log("balance of Admin User (INR Fiat Tokens), after transfer",  adminBalanceEUROFiat2.toNumber());
    // const rapidContractEUROFiat = await euroToken.balanceOf(rapidContract.address);
    // console.log("balance of Rapid Contract (Euro Fiat Tokens), after transfer",  rapidContractEUROFiat.toNumber());

    const balanceOne = await euroToken.balanceOf(userOne.address);
    console.log("balance of user one(Euro Fiat Tokens), after buy",  balanceOne.toNumber());

    const balanceTwo = await inrToken.balanceOf(userTwo.address);
    console.log("balance of user two(Rupee Fiat Tokens), after buy",  balanceTwo.toNumber());

    console.log("--------------------------");
  });

  it("Add Liquidity", async function () {
    console.log("--------------------------");

    const adminBalanceEUROFiat = await euroToken.balanceOf(adminUser.address);
    console.log("balance of Admin User (Euro Fiat Tokens)",  adminBalanceEUROFiat.toNumber());

    const adminBalanceINRFiat = await inrToken.balanceOf(adminUser.address);
    console.log("balance of Admin User (INR Fiat Tokens)",  adminBalanceINRFiat.toNumber());

    await euroToken.transfer(userOne.address,1000);
    await inrToken.transfer(userTwo.address,10000);

    const adminBalanceEUROFiat1 = await euroToken.balanceOf(adminUser.address);
    console.log("balance of Admin User (Euro Fiat Tokens), after transfer",  adminBalanceEUROFiat1.toNumber());

    const adminBalanceINRFiat1 = await inrToken.balanceOf(adminUser.address);
    console.log("balance of Admin User (INR Fiat Tokens), after transfer",  adminBalanceINRFiat1.toNumber());
  
    const balanceOne = await euroToken.balanceOf(userOne.address);
    console.log("balance of user-one(Euro Fiat Tokens), after buy",  balanceOne.toNumber());

    const balanceTwo = await inrToken.balanceOf(userTwo.address);
    console.log("balance of user-two(Rupee Fiat Tokens), after buy",  balanceTwo.toNumber());

    // Add EURO liquidity
    await euroLPToken.transfer(rapidContract.address, 1000000);
    await inrLPToken.transfer(rapidContract.address, 1000000);

    await euroToken.connect(userOne).transfer(rapidContract.address, 1000);

    const balanceOne1 = await euroToken.balanceOf(userOne.address);
    console.log("balance of user-one(Euro Fiat Tokens), after lp token intiatiation",  balanceOne1.toNumber());

    const rapidContractEUROFiat2 = await euroToken.balanceOf(rapidContract.address);
    console.log("balance of Rapid Contract (Euro Fiat Tokens), after lp token intiatiation",  rapidContractEUROFiat2.toNumber());

    await rapidContract.addLiquidity(1000,userOne.address,euroFiat32, euroLP32,1);
    const balanceOneLP1 = await euroLPToken.balanceOf(userOne.address);
    console.log("balance of user one(Euro LP Tokens), after lp intiatiation ",  balanceOneLP1.toNumber());

    const rapidContractEUROLP1 = await euroLPToken.balanceOf(rapidContract.address);
    console.log("balance of Rapid Contract (Euro LP Tokens), after lp intiatiation",  rapidContractEUROLP1.toNumber());
    
    console.log("--------------------------");
  });

  it("Withdraw Liquidity", async function () {
    console.log("--------------------------");

    const adminBalanceEUROFiat = await euroToken.balanceOf(adminUser.address);
    console.log("balance of Admin User (Euro Fiat Tokens)",  adminBalanceEUROFiat.toNumber());

    const adminBalanceINRFiat = await inrToken.balanceOf(adminUser.address);
    console.log("balance of Admin User (INR Fiat Tokens)",  adminBalanceINRFiat.toNumber());

    await euroToken.transfer(userOne.address,1000);
    await inrToken.transfer(userTwo.address,10000);

    const adminBalanceEUROFiat1 = await euroToken.balanceOf(adminUser.address);
    console.log("balance of Admin User (Euro Fiat Tokens), after transfer",  adminBalanceEUROFiat1.toNumber());

    const adminBalanceINRFiat1 = await inrToken.balanceOf(adminUser.address);
    console.log("balance of Admin User (INR Fiat Tokens), after transfer",  adminBalanceINRFiat1.toNumber());
  
    const balanceOne = await euroToken.balanceOf(userOne.address);
    console.log("balance of user-one(Euro Fiat Tokens), after buy",  balanceOne.toNumber());

    const balanceTwo = await inrToken.balanceOf(userTwo.address);
    console.log("balance of user-two(Rupee Fiat Tokens), after buy",  balanceTwo.toNumber());

    // Add EURO liquidity
    console.log("---- Add EURO liquidity ----");
    await euroLPToken.transfer(rapidContract.address, 1000000);
    await inrLPToken.transfer(rapidContract.address, 1000000);

    await euroToken.connect(userOne).transfer(rapidContract.address, 1000);

    const balanceOne1 = await euroToken.balanceOf(userOne.address);
    console.log("balance of user-one(Euro Fiat Tokens), after lp token intiatiation",  balanceOne1.toNumber());

    const rapidContractEUROFiat2 = await euroToken.balanceOf(rapidContract.address);
    console.log("balance of Rapid Contract (Euro Fiat Tokens), after lp token intiatiation",  rapidContractEUROFiat2.toNumber());

    await rapidContract.addLiquidity(1000,userOne.address,euroFiat32, euroLP32,1);
    const balanceOneLP1 = await euroLPToken.balanceOf(userOne.address);
    console.log("balance of user one(Euro LP Tokens), after lp intiatiation ",  balanceOneLP1.toNumber());

    const rapidContractEUROLP1 = await euroLPToken.balanceOf(rapidContract.address);
    console.log("balance of Rapid Contract (Euro LP Tokens), after lp intiatiation",  rapidContractEUROLP1.toNumber());

    // withdraw EURO liquidity
    console.log("---- Withdraw EURO liquidity ----");
    await euroLPToken.connect(userOne).transfer(rapidContract.address, 1000);

    const balanceLPOne1 = await euroLPToken.balanceOf(userOne.address);
    console.log("balance of user-one(Euro LP Tokens), after lp token withdraw",  balanceLPOne1.toNumber());

    const rapidContractEUROLP2 = await euroLPToken.balanceOf(rapidContract.address);
    console.log("balance of Rapid Contract (Euro LP Tokens), after lp token withdraw",  rapidContractEUROLP2.toNumber());

    await rapidContract.withdrawRequest(1000,userOne.address,euroLP32);

    const timestamp = await rapidContract.getRequestTimeStamp(1);
    console.log("withdrawRequest time-stamp : ",  timestamp.toNumber());

    // to have few trnasctions
    await euroLPToken.transfer(rapidContract.address, 1);
    await inrLPToken.transfer(rapidContract.address, 1);
    await euroLPToken.transfer(rapidContract.address, 1);
    await inrLPToken.transfer(rapidContract.address, 1);
    // to have few trnasctions

    await rapidContract.withdrawLiquidity(1000,userOne.address,euroLP32,euroFiat32,1);
    const balanceOneFiat1 = await euroToken.balanceOf(userOne.address);
    console.log("balance of user one(Euro Fiat Tokens), after lp withdraw ",  balanceOneFiat1.toNumber());

    const rapidContractFiat1 = await euroToken.balanceOf(rapidContract.address);
    console.log("balance of Rapid Contract (Euro Fiat Tokens), after lp withdraw",  rapidContractFiat1.toNumber());
    
    console.log("--------------------------");
  });


 

});
