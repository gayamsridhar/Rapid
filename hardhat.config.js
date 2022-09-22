require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@openzeppelin/hardhat-upgrades");
require('hardhat-deploy');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();//const account of accounts

  for (i=0;accounts[i];i++) {
    console.log("Account " + i + " is : " + accounts[i].address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const pvtkey = process.env.PRIVATE_KEY;
module.exports = {
  //solidity: "0.8.0",
  solidity: {
    compilers: [
      {
        version: "0.8.0",
      },
      {
        version: "0.8.4",
      },
      {
        version: "0.8.6",
        settings: {},
      },
    ],
  },
  //defaultNetwork: "rinkeby",
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0, // workaround from https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136 . Remove when that issue is closed.
    },
   /*hardhat: {
      forking: {
        url: "https://mainnet.infura.io/v3/df8c114388344492b9e198d0c68ec675",
      }
    }, */ // to fork a main network
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: 'https://rinkeby.infura.io/v3/c8a852c307f8436b9e35a7e7a8c30507',
      accounts: [pvtkey],
      live: true,
      saveDeployments: true,
      tags: ["staging"]
    },
    matic: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [pvtkey]
    },

    maticmain: {
      url: "https://polygon-rpc.com/",
      accounts: [pvtkey],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0,
      bpaas: pvtkey,
    },
  }
};
