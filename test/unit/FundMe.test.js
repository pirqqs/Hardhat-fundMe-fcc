const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

//deployments object has a function called fixture
//It allows us to run our entire deploy folder with as many tags as we want
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let mockV3Aggregator
          let deployer
          const sendValue = ethers.utils.parseEther("0.1")

          beforeEach(async () => {
              // const accounts = await ethers.getSigners()
              // deployer = accounts[0]
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          //Test for our constructor
          describe("contructor", () => {
              it("sets the aggregator address correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", () => {
              it("Fails if you don't send enough ETH", async function () {
                  expect(fundMe.getFunders.length.toString()).to.equal("0")
              })
              it("Updates the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("Adds funder to the array of getFunders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunders(0)
                  assert.equal(funder, deployer)
              })

              describe("withdraw", () => {
                  //We want the contract to already have some funds before testing the witdhraw function
                  beforeEach(async () => {
                      await fundMe.fund({ value: sendValue })
                  })

                  it("withdraw ETH from a signle founder", async () => {
                      //Arrange:
                      //we are going to get the starting balance of
                      //the fundMe contract and of the deployer
                      //So that we can test later on how much these numbers have changed based off
                      //of what happens when we call the withdraw function
                      const startingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const startingDeployerBalance =
                          await fundMe.provider.getBalance(deployer)
                      //Act:
                      //run the withdraw function
                      const transactionResponse = await fundMe.cheaperWithdraw()
                      const transactionReceipt =
                          await transactionResponse.wait()
                      const { gasUsed, effectiveGasPrice } = transactionReceipt
                      const gasCost = gasUsed.mul(effectiveGasPrice)

                      const endingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const endingDeployerBalance =
                          await fundMe.provider.getBalance(deployer)
                      //Assert
                      assert.equal(endingFundMeBalance, 0)
                      assert.equal(
                          startingFundMeBalance
                              .add(startingDeployerBalance)
                              .toString(),
                          endingDeployerBalance.add(gasCost).toString()
                      )
                  })

                  it("cheaperWithdraw testing...", async function () {
                      //Arrange
                      const accounts = await ethers.getSigners()
                      for (let i = 1 /*0=deployer account*/; i < 6; i++) {
                          //We nned to call this connect function bc our fundMe contract is connected
                          //to our deployer account and everytime we call a transaction with
                          //FundMe the deployer is the account that is calling that transactipon
                          //We need to create new objects to connect to all of these different accounts
                          const fundMeConnectedContract = await fundMe.connect(
                              accounts[i]
                          )
                          await fundMeConnectedContract.fund({
                              value: sendValue,
                          })
                      }
                      //
                      const startingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)

                      const startingDeployerBalance =
                          await fundMe.provider.getBalance(deployer)
                      //Act
                      const transactionResponse = await fundMe.cheaperWithdraw()
                      const transactionReceipt =
                          await transactionResponse.wait()
                      const { gasUsed, effectiveGasPrice } = transactionReceipt
                      const gasCost = effectiveGasPrice.mul(gasUsed)

                      const endingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const endingDeployerBalance =
                          await fundMe.provider.getBalance(deployer)
                      //Assert
                      assert.equal(endingFundMeBalance, 0)
                      assert.equal(
                          startingFundMeBalance
                              .add(startingDeployerBalance)
                              .toString(),
                          endingDeployerBalance.add(gasCost).toString()
                      )

                      //Make sure that the s_getFunders are reset properly
                      await expect(fundMe.getFunders(0)).to.be.reverted
                      for (i = 1; i < 6; i++) {
                          assert.equal(
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].address
                              ),
                              0
                          )
                      }
                  })
                  it("Only allows the owner to withdraw", async function () {
                      const accounts = await ethers.getSigners()
                      const attacker = accounts[1]
                      const attackerConnnectedContract = await fundMe.connect(
                          attacker
                      )
                      await expect(
                          attackerConnnectedContract.cheaperWithdraw()
                      ).to.be.revertedWith("FundMe__NotOwner")
                  })
              })
          })
      })
