const hre = require("hardhat");

async function main() {
  const entropy = "0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a";
  const entropyProvider = "0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344";

  const c = await hre.ethers.deployContract("Decks");

  await c.waitForDeployment();

  const contract = await hre.ethers.deployContract("CardsAgainstEntropy", [
    c.target,
    entropy,
    entropyProvider,
  ]);

  await contract.waitForDeployment();

  console.log(`Contract deployed to ${contract.target}`);
  console.log(contract);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
