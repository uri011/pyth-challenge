const hre = require("hardhat");
const { Web3 } = require("web3");
const ContractJSON = require("./artifacts/contracts/CoinFlip.sol/CoinFlip.json");
const axios = require("axios");

const fortunaUrl = "https://fortuna-staging.pyth.network";
const chainName = "lightlink-pegasus";
const contractAdress = "0x75ECdfcF872F93e1dE542E740530672187D78C4d";
const rpcURL = "https://replicator.pegasus.lightlink.io/rpc/v1";
const privateKey =
  "acae0b4f77ece4801429c9435509691d2a494b0e12d4c97ff30ca5d4a55aaf96";

async function fetchWithRetry(url, maxRetries) {
  let retryCount = 0;

  async function doRequest() {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(doRequest, 1000);
      } else {
        console.error("Max retry attempts reached. Exiting.");
        throw error;
      }
    }
  }

  return await doRequest(); // Start the initial request
}

async function main() {
  const web3 = new Web3(rpcURL);

  const account = web3.eth.accounts.privateKeyToAccount("0x" + privateKey);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;
  console.log("Address: ", account.address);

  const contract = new web3.eth.Contract(ContractJSON.abi, contractAdress);

  console.log(`Running coin flip protocol.`);

  // STEP 1 - Commit to a random number
  console.log("1. Generating user's random number...");
  const randomNumber = web3.utils.randomHex(32);
  const commitment = web3.utils.keccak256(randomNumber);
  console.log(`   number    : ${randomNumber}`);
  console.log(`   commitment: ${commitment}`);

  // STEP 2 - Request a number from Entropy
  console.log("2. Requesting coin flip...");
  const flipFee = await contract.methods.getFlipFee().call();
  console.log(`   fee       : ${flipFee} wei`);
  const gasPrice = await web3.eth.getGasPrice();
  const receipt = await contract.methods
    .requestFlip(commitment)
    .send({ value: flipFee, from: account.address, gasPrice: gasPrice });
  console.log(`   tx        : ${receipt.transactionHash}`);
  const sequenceNumber = receipt.events.FlipRequest.returnValues.sequenceNumber;
  console.log(`   sequenceN : ${sequenceNumber}`);

  // STEP 3 - Fetch the provider's number
  console.log("3. Retrieving provider's random number...");
  const url = `${fortunaUrl}/v1/chains/${chainName}/revelations/${sequenceNumber}`;
  console.log(`   fetch url : ${url}`);
  // Note that there is a potential race condition here: the server may not have observed the request ^
  // before this HTTP response. Hence, we retry fetching the URL a couple of times.
  const response = await fetchWithRetry(url, 3);
  const providerRandom = `0x${response.value.data}`;
  console.log(`   number    : ${providerRandom}`);

  // STEP 4 - Reveal the number
  console.log("4. Revealing the result of the coin flip...");
  const receipt2 = await contract.methods
    .revealFlip(sequenceNumber, randomNumber, providerRandom)
    .send({ from: account.address, gasPrice: gasPrice });
  console.log(`   tx        : ${receipt2.transactionHash}`);
  const isHeads = receipt2.events.FlipResult.returnValues.isHeads;
  console.log(`   result    : ${isHeads ? "heads" : "tails"}`);
}

main();
