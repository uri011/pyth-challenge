const hre = require("hardhat");
const { Web3 } = require("web3");
const ContractJSON = require("./artifacts/contracts/CardsAgainstEntropyV6.sol/CardsAgainstEntropyV6.json");
const axios = require("axios");

const fortunaUrl = "https://fortuna-staging.pyth.network";
const chainName = "lightlink-pegasus";
const contractAddress = "0xb4D56c158DCaF0c9bc6B6Be2285Db964651376bF";
const rpcURL = "https://replicator.pegasus.lightlink.io/rpc/v1";
const privateKey =
  "acae0b4f77ece4801429c9435509691d2a494b0e12d4c97ff30ca5d4a55aaf96";
//key account 1: "acae0b4f77ece4801429c9435509691d2a494b0e12d4c97ff30ca5d4a55aaf96"
//key account 2: "e1f063203b7a2418fb2a863dd4925314ff6203d49338d3a807a35025464482a5"
//key account 3: "ef271ad31a87f154cd7b1fb91dd7ae0bc79dcb7dc744b23d2cf49fe507cdc2eb"

const deck_answers = [
  "A bucket of fried chicken.",
  "Uncontrollable flatulence.",
  "The inevitable heat death of the universe.",
  "A sassy black woman.",
  "Puppies!",
  "Ruthless mockery.",
  "Grandma's secret moonshine recipe.",
  "A lifetime supply of bacon.",
  "Inappropriate yodeling.",
  "A magical unicorn with a dark secret.",
  "The force.",
  "A monkey smoking a cigar.",
  "My browser history.",
  "A robot uprising.",
  "Nuclear fallout.",
  "Vegan options at an all-you-can-eat BBQ.",
  "A flaming bag of dog poop.",
  "The ghost of Elvis.",
  "An awkward family photo.",
  "The sweet release of death.",
];

const deck_questions = [
  "What's the next big reality TV show? '_________ Wars.'",
  "In my autobiography, the title of the first chapter will be 'My Love Affair with ________.'",
  "Instead of solving world hunger, I've decided to focus my efforts on ____________.",
  "The latest scientific discovery: ____________ causes global warming.",
  "What's the secret ingredient in my award-winning recipe for ____________?",
  "The government has declared ____________ a public health hazard.",
  "When I'm feeling down, I cheer myself up by thinking about ____________.",
  "The new self-help book that's sweeping the nation: 'Unlocking the Power of ____________.'",
  "What's the most inappropriate time to play the Macarena?",
  "My therapist says my issues stem from my unhealthy obsession with ____________.",
  "Forget diamonds, ____________ is a girl's best friend.",
  "The school talent show was won by a stunning performance of ____________.",
  "If I could bring one historical figure back to life, it would be ____________.",
  "Instead of a handshake, I greet people with ____________.",
  "The best way to ruin a family dinner is to bring up ____________.",
  "I like my coffee like I like my relationships: filled with ____________.",
  "What's the latest fashion trend? ____________-inspired accessories.",
  "If I could have any superpower, it would be the ability to control ____________.",
  "My autobiography will be titled 'The Chronicles of ____________.'",
  "The secret to a long and happy life is a daily dose of ____________.",
];

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

  const contract = new web3.eth.Contract(ContractJSON.abi, contractAddress);

  const gasPrice = await web3.eth.getGasPrice();

  // delete this function, but make sure cards are initialized before joining players
  async function startGame() {
    const numPlayers = await contract.methods.getPlayerCount().call();
    const decksInitialized = await contract.methods
      .areDecksInitialized()
      .call();
    const gameStarted = await contract.methods.isGameStarted().call();
    if (numPlayers >= 3 && decksInitialized && !gameStarted) {
      console.log("Contract address: ", contractAddress);
      console.log("Starting the game...");
      await contract.methods
        .startGame()
        .send({ from: account.address, gasPrice: gasPrice });
      console.log("Game started.");
    } else if (gameStarted) {
      console.log(`The game has already started.`);
    } else if (numPlayers < 3) {
      console.log(
        "Not enough players have joined the lobby to start the game."
      );
    } else {
      console.log("The decks have not been initialized yet.");
    }
  }

  // Only for development and testing
  async function restartGame() {
    await contract.methods
      .restartGame()
      .send({ from: account.address, gasPrice: gasPrice });
    console.log("The game has been reset");
  }

  async function joinGame() {
    const playerJoined = await contract.methods
      .hasPlayerJoined(account.address)
      .call();
    const gameStarted = await contract.methods.isGameStarted().call();
    const decksInitialized = await contract.methods
      .areDecksInitialized()
      .call();
    if (!playerJoined && !gameStarted && decksInitialized) {
      console.log("Joining the game...");
      await contract.methods
        .joinGame()
        .send({ from: account.address, gasPrice: gasPrice });
      console.log(`The user ${account.address} joined the game.`);
      const numPlayers = await contract.methods.getPlayerCount().call();
      if (numPlayers == 3) {
        console.log("Game started.");
      }
    } else if (gameStarted) {
      console.log(
        `You can't join the game at this moment. The game has already started.`
      );
    } else if (!decksInitialized) {
      console.log(
        "Cards should be initialized before the players join the game."
      );
    } else {
      console.log(`The player ${account.address} has already joined the game.`);
    }
  }

  async function initializeDecks() {
    // Check if the game has started
    const gameStarted = await contract.methods.isGameStarted().call();
    const decksInitialized = await contract.methods
      .areDecksInitialized()
      .call();
    if (!gameStarted && !decksInitialized) {
      console.log("Game has not started yet. Initializing decks...");

      // Initialize answer cards deck
      await contract.methods
        .initializeDeck(deck_answers, 1)
        .send({ from: account.address, gasPrice: gasPrice });
      console.log("Answer cards deck initialized.");

      // Initialize question cards deck
      await contract.methods
        .initializeDeck(deck_questions, 0)
        .send({ from: account.address, gasPrice: gasPrice });
      console.log("Question cards deck initialized.");
    } else {
      console.log("Decks already initialized.");
    }
  }

  async function dealCards() {
    const cardsDealt = await contract.methods.areCardsDealt().call();
    const gameStarted = await contract.methods.isGameStarted().call();
    if (gameStarted && !cardsDealt) {
      console.log(`Running RNG protocol.`);

      // STEP 1 - Commit to a random number
      console.log("1. Generating user's random number...");
      const randomNumber = web3.utils.randomHex(32);
      const commitment = web3.utils.keccak256(randomNumber);
      console.log(`   number    : ${randomNumber}`);
      console.log(`   commitment: ${commitment}`);

      // STEP 2 - Request a number from Entropy
      console.log("2. Requesting number from Entropy...");
      const flipFee = await contract.methods.getFlipFee().call();
      console.log(`   fee       : ${flipFee} wei`);
      // const gasPrice = await web3.eth.getGasPrice();
      const receipt = await contract.methods
        .requestFlip(commitment)
        .send({ value: flipFee, from: account.address, gasPrice: gasPrice });
      console.log(`   tx        : ${receipt.transactionHash}`);
      const sequenceNumber =
        receipt.events.FlipRequest.returnValues.sequenceNumber;
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
      console.log("4. Revealing the random number...");
      const receipt2 = await contract.methods
        .revealFlip(sequenceNumber, randomNumber, providerRandom)
        .send({ from: account.address, gasPrice: gasPrice });
      console.log(`   tx        : ${receipt2.transactionHash}`);
      const randomNumberAnswersProvider =
        receipt2.events.FlipResultAnswers.returnValues.randomNumber;
      console.log(` Answers Num : ${randomNumberAnswersProvider} \n`);

      await contract.methods
        .dealCards(randomNumberAnswersProvider, 1)
        .send({ from: account.address, gasPrice: gasPrice });
      console.log("Cards dealt to players.");
    } else if (!gameStarted) {
      console.log("Game has not started yet. Can't deal cards at the moment.");
    } else {
      console.log("Cards already dealt.");
    }
  }

  async function playCard(cardIndex) {
    const gameStarted = await contract.methods.isGameStarted().call();
    const numPlayers = await contract.methods.getPlayerCount().call();
    const playerAlreadyPlayedRound = await contract.methods
      .hasPlayerPlayedCard(account.address)
      .call();
    const judge = await contract.methods.getCurrentJudge().call();
    const turn = await contract.methods.getCurrentTurn().call();
    const activePlayer = await contract.methods.getActivePlayer().call();
    const playersCardsLeft = await contract.methods.playersCardsLeft().call();
    if (
      gameStarted &&
      turn < numPlayers &&
      account.address != judge &&
      !playerAlreadyPlayedRound &&
      account.address == activePlayer
    ) {
      console.log("Playing a card...");
      const playCard = await contract.methods
        .playCard(1, cardIndex)
        .send({ from: account.address, gasPrice: gasPrice });
      const question = playCard.events.QuestionCard.returnValues.question;
      console.log("Question: ", question);
      const cardPlayed = playCard.events.CardPlayed.returnValues.cardText;
      console.log(`Answer: ${cardPlayed}`);
    } else if (!gameStarted) {
      console.log("Can't play cards at the moment. Game has not started yet. ");
    } else if (turn == numPlayers) {
      console.log("Can't play cards at the moment. It's voting time.");
    } else if (account.address == judge) {
      console.log("Judge can't play an answer card.");
    } else if (playerAlreadyPlayedRound) {
      console.log("Player has already played a card in this round.");
    } else if (account.address != activePlayer) {
      console.log(`It is not your turn to play the card`);
    }
  }

  async function playJudgeCard() {
    const cardIndex = 0; // Replace with the desired card index
    await contract.methods
      .playJudgeCard(cardIndex)
      .send({ from: account.address, gasPrice: gasPrice });
    console.log("Judge played a card.");
  }

  async function vote(cardIndex) {
    const gameStarted = await contract.methods.isGameStarted().call();
    const numPlayers = Number(await contract.methods.getPlayerCount().call());
    const votedPlayer = await contract.methods.getPlayer(cardIndex).call();
    const judge = await contract.methods.getCurrentJudge().call();
    const turn = Number(await contract.methods.getCurrentTurn().call());
    if (
      gameStarted &&
      turn == numPlayers - 1 &&
      account.address == judge &&
      votedPlayer != judge
    ) {
      const end = await contract.methods
        .vote(cardIndex)
        .send({ from: account.address, gasPrice: gasPrice });
      console.log("The winning combination is: ");
      const question = end.events.QuestionCard.returnValues.question;
      console.log("Question: ", question);
      const cardPlayed = end.events.CardPlayed.returnValues.cardText;
      console.log(`Answer: ${cardPlayed}`);
      const playersCardsLeft = await contract.methods.playersCardsLeft().call();
      console.log("Cards left?", playersCardsLeft);
      if (playersCardsLeft) {
        console.log("Judge voted.");
      } else {
        const winner = end.events.GameEnded.returnValues.winner;
        if (winner === "0x0000000000000000000000000000000000000000") {
          console.log("Judge voted.");
          console.log("Game ended. There has been a tie.");
        } else {
          console.log("Judge voted.");
          console.log(`Game ended. The winner is ${winner}.`);
        }
      }
    } else if (!gameStarted) {
      console.log("Can't vote at the moment. Game has not started yet. ");
    } else if (account.address != judge) {
      console.log("You are not this round's judge, you can't vote.");
    } else if (turn < numPlayers - 1) {
      console.log(
        "The voting phase hasn't started. There are still cards to play."
      );
    } else if (votedPlayer == judge) {
      console.log("Judge cannot vote itself");
    }
  }

  async function playersCardsLeft() {
    const playersCardsLeft = await contract.methods.playersCardsLeft().call();
    console.log(
      "Have the players run out of cards:",
      playersCardsLeft ? "Yes" : "No"
    );
  }

  async function getPlayerScores() {
    const playerScores = await contract.methods.getPlayerScores().call();
    console.log("Player scores:", playerScores);
  }

  async function getGameState() {
    const gameState = await contract.methods.getGameState().call();
    console.log("Game state:", gameState);
  }

  async function getCurentJudge() {
    const judge = await contract.methods.getCurrentJudge().call();
    console.log("Current judge:", judge);
  }

  async function getCurentTurn() {
    const turn = await contract.methods.getCurrentTurn().call();
    console.log("Current turn:", turn);
  }

  async function getCurrentRound() {
    const round = await contract.methods.getCurrentRound().call();
    console.log("Current round:", round);
  }

  async function getGameWinner() {
    const winner = await contract.methods.getGameWinner().call();
    console.log("Current winner:", winner);
  }

  async function getActivePlayer() {
    const activePlayer = await contract.methods.getActivePlayer().call();
    console.log("Current active player:", activePlayer);
  }

  async function getNumPlayers() {
    const numPlayers = await contract.methods.getPlayerCount().call();
    console.log("Number of players in the game:", numPlayers);
  }

  // 1. initializeDecks();
  // 2. startGame();
  // 3. dealCards();

  await restartGame();
  await initializeDecks();
  await joinGame();
  await playCard(0);

  /*
  await playCard(0);
  await getCurentJudge();
  await getCurentTurn();
  await getCurrentRound();
  await getActivePlayer();
  await vote(1);
  await getPlayerScores();*/
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
