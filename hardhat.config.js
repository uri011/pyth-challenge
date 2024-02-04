require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  paths: {
    artifacts: "./scripts/artifacts",
  },
  networks: {
    "lightlink-testnet": {
      url: "https://replicator.pegasus.lightlink.io/rpc/v1",
      accounts: [
        "8997ba95cf87a5b0ec971de467ab6fc0f73ef2ab34490936926f0f21af850e7e",
      ],
      gasPrice: 1000000000,
    },
  },
};
