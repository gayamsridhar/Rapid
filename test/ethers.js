//npm init; npm i ethers
// node ethers.js

const { ethers } = require("ethers"); 


//const { TokenisedFiatArtifact } = require("./TokenisedFiat.json");
const tokenAddress = "0xf814BcaE957260d7Da613875694b47bdFbaE439F";
const provider = new ethers.providers.JsonRpcProvider("https://rinkeby.infura.io/v3/c8a852c307f8436b9e35a7e7a8c30507");
//console.log("abi: ",TokenisedFiatArtifact);
//const tokenContract = new ethers.Contract(tokenAddress,TokenisedFiat, provider);
const GS2Address = "0xc6Fe3BFe24674F3f2B1c87304B2FCAced2fD066F";
const GS3Address = "0x38805F72EbcAfB924e8b5cED9F8D575Fe8039E0e";

const MY_PRIVATE_KEY = '7dd020d26d829e60186b33746c3b851b4536e891c4c64f9ce617dd96d44107d4';

async function main(){
    abi = [
        'function faucet(address to, uint amount) external',
        'function burn(address to, uint amount) external',
        'function name() public view returns (string memory)',
        'function symbol() public view returns (string memory)'
    ]
    const tokenContract = new ethers.Contract(tokenAddress,abi, provider);

 
        const tokenName = await tokenContract.name();
        console.log("name of Euro Liquidity Pool Token contract: ", tokenName);
    
        const tokenSymbol = await tokenContract.symbol();
        console.log("name of Euro Liquidity Pool Token contract: ", tokenSymbol);

        const itx = new ethers.providers.InfuraProvider(
            'rinkeby',
            'c8a852c307f8436b9e35a7e7a8c30507'
          )

        const signer = new ethers.Wallet(MY_PRIVATE_KEY, itx);
       // const daiWithSigner = contract.connect(signer);


/*         const tokenContractWrite = new ethers.Contract(tokenAddress,abi,signer);

        const tx = await tokenContractWrite.faucet(GS2Address,1000);
        web3.eth.sendTransaction(tx);  */       
}

main();

