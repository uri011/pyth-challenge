# Cards Against Entropy

This project is a web3 version of Cards Against Humanity where Pyth Network is used for RNG and LiteFlow is used for card combination NFT minting. The blockchain it is deployed on is the Pegasus testnet (LightLink's testnet). Finally, the dApp implements a gasless tranactions feature provided by LightLink's Enterprise Mode.

Cards Against Entropy is a decentralized implementation of a card game built on the LightLink Pegasus blockchain, utilizing smart contracts for game logic, randomness, NFT rewards, and secure coin flips. The game allows players to register, join games, and compete by playing cards in response to humorous or thought-provoking prompts. Winners are decided through player judgments and rewarded with unique NFTs. This README provides a high-level overview of the implementation and the roles of various contracts involved.

### Getting Started

Note that private keys to pay for testnet gas fees have been introduced in the same scripts for testing purposes.

This should be properly done in a .env file.

Install node_modules in the project root folder

```sh
npm i
```

Install node_modules in the project client folder

```sh
npm i
```

Test contract locally

```sh
npx hardhat test
```

Compile & Deploy Contracts

```sh
npx hardhat compile
npx hardhat run --network <network> scripts/<deploy_script>.js
```

Locally Run Frontend (execute command inside client folder)

```sh
npm run dev
```

To deploy the code, introduce the private key of a wallet address that has funds in the Pegasus testnet.

Get the Pegasus Testnet in your Metamask wallet (use this for the setup: https://docs.lightlink.io/lightlink-protocol/building-on-lightlink/live-networks). In the "hardhat.config.js" you have to introduce the private key of the wallet addresses that have funds in the testnet. You can import them to your Metamask.

If you deploy a new smart contract, copy its json file from "/scripts/artifacts/contracts/contractname/contractname.json" to "client/src/contract". Within the latter folder, modify the "index.js" file with the contract address and the new JSON name (if the contract name changed).

### Contracts

1. CardsAgainstEntropy
   Purpose:
   Main game contract that implements the game logic, including player registration, game creation, joining, starting, playing, and concluding games.
   Interacts with other contracts for decks of questions and answers, randomness for shuffling decks, and NFT rewards.

   Key Features:
   Registers players and stores their information.
   Manages game states, rounds, and player turns.
   Utilizes external contracts for randomness and NFT minting.

2. Decks
   Purpose:
   Provides predefined decks of questions and answers for the game.
   Allows fetching specific entries or entire decks for game rounds.

   Key Features:
   Stores arrays of strings for questions and answers.
   Supports modular access to deck entries to ensure valid array indexing.

3. TheNFT
   Purpose:
   Manages the minting of NFTs as rewards for game winners.
   Incorporates a whitelist mechanism to restrict minting to authorized addresses.

   Key Features:
   Inherits ERC721 standard for NFT functionality.
   Allows only the game contract or owner to add addresses to the whitelist for NFT minting.

4. CoinFlip
   Purpose:
   Provides a mechanism for players to flip a coin using secure and fair randomness from the Pyth Network's Entropy service.
   Adapted in the game to generate a random number.

   Key Features:
   Interacts with the Entropy service for random number generation.
   Implements a commit-reveal scheme to ensure fairness in coin flips.

### How They Are Related

CardsAgainstEntropy is the central contract that orchestrates the game. It calls Decks to fetch questions and answers for each round and uses randomness services (like those that could be provided by CoinFlip or similar) to shuffle decks and determine game dynamics. It also interacts with TheNFT contract to mint and award NFTs to game winners or participants based on game outcomes.
Decks serves as a static data provider to CardsAgainstEntropy, offering a variety of questions and answers that are essential for gameplay.
TheNFT contract is utilized by CardsAgainstEntropy to provide unique blockchain-based rewards, enhancing player engagement and offering tangible incentives for participation.
CoinFlip could be used by CardsAgainstEntropy or players directly for making decisions that require randomness, adding an element of chance to the game beyond the strategic play of cards.
Implementation Summary
This implementation showcases the power of smart contracts and blockchain technology in creating a decentralized, transparent, and fair gaming experience. By leveraging the Ethereum network, it ensures that game logic and outcomes are verifiable and tamper-proof. The use of NFTs as rewards adds a modern twist to incentivizing participation, while the integration with external randomness providers like the Pyth Network ensures that all elements of chance within the game are both secure and fair.

### Client

The client side has the following structure:

- Assets: contains some external files (such as images) that we use in the code.
- Components: they allow to split the UI into reusable pieces of code. The file "PageHOC" comes from "Page High Order Component", and it means that this page is the standard used to mantain the same format within the pages (logo on the top, image on the right, the component to be displayed on screen...).
- Context: As its name indicates, the "index.js" file provides the context when something changes.
  However, this is not going to be a regular context, but the context through which we connect our front-end application with out web3 smart contract.
  The "createEventListeners.js" file listens to the events of the smart contract.
- Contract: it has the smart contract's json (which contains the ABI) and the contract address.
- Page: These are the screens of the dApp. They use the components to make the code shorter and more organized. They also listen from context to use the required variables.
- main.js: contains the dApps routing logic (router-dom).


### BlockScout Challenge

Blockscout challenge was also done.

![Screenshot 2024-02-05 at 00 03 19](https://github.com/uri011/pyth-challenge/assets/62013927/27c379dd-ad17-471d-a0e6-7d8e54b1ff7e)

![Screenshot 2024-02-05 at 00 04 35](https://github.com/uri011/pyth-challenge/assets/62013927/256a4ee1-5c4f-401c-8936-6b1b4c8c7126)

### Captures of the Hardhat tests

![Screenshot 2024-02-04 at 22 18 05](https://github.com/uri011/pyth-challenge/assets/62013927/f7875877-e0d7-4d1d-872b-fa58d541a424)

![Screenshot 2024-02-04 at 22 18 20](https://github.com/uri011/pyth-challenge/assets/62013927/55cfa01d-b0eb-480f-ad42-0db68125b3fc)

![Screenshot 2024-02-04 at 23 56 54](https://github.com/uri011/pyth-challenge/assets/62013927/92d84d8c-b0c9-4e12-b8c7-00744933769b)

![Screenshot 2024-02-04 at 23 57 07](https://github.com/uri011/pyth-challenge/assets/62013927/61d51b45-1cd0-4d4d-87a7-d3eb5f7f728b)



