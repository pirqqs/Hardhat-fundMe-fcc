const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
require("dotenv").config()
//Hardhat deploy is going to call a function that we specify in this script

// function deployFunc() {
//     console.log("Hi")
// }
// module.exports.default = deployFunc

//setting the function and variables we want to deploy
module.exports = async ({ getNamedAccounts, deployments }) => {
    //we want only this two variables from hre getNamedAccounts, deployments
    //we define what those paramters will do
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    //we are gong to grap that deployer account from our named Account
    const { chainId } = network.config.chainId

    //if chainId is X use address A
    //if chainId is Y use addres B
    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    // Script to flip between a local development chain and a test net, a mainnet chain or whatever
    //chain without changing any of our solidity
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        //if we arent in a development chain, if we didnt deploy a mock
        ethUsdPriceFeedAddress = networkConfig[11155111]["ethUsdPriceFeed"]
    }

    //if the contract doesn't exist, we deploy a minimal version of it
    //for our local testing

    //what happens when we want to change chains
    //when going for localhost or hardhat network we want to use a mock
    const args = [ethUsdPriceFeedAddress]
    const FundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress], //put priceFeed in here
        log: true,
        waitCoinfirmations: network.config.blockConfirmations || 1, //if no block confirmations is given in our hardhat.conifg, just wait for 1 block
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(FundMe.address, args)
    }
    log("----------------------------------------")
}
module.exports.tags = ["all", "fundme"]
