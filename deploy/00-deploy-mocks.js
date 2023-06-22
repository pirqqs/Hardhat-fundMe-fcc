//Contract that we can use to deploy a fake price feed to a blockchain
const { network } = require("hardhat")
// const { DEBUG_FILE_FORMAT_VERSION } = require("hardhat/internal/constants")
const { networkConfig } = require("../helper-hardhat-config")
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true, //is deploying, what transaction is doing and where it is deployed with how much gas
            args: [DECIMALS, INITIAL_ANSWER],
        })
        log("Mocks deployed")
        log("-----------------------------------------------------------")
    }

    //We don't want to deploy this mock contract to a test net that actually has price feed
}

module.exports.tags = ["all", "mocks"]
