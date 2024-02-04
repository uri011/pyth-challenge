const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("CardsAgainstEntropy", function () {
  async function deployContract() {
    const [deployer, p1, p2, p3] = await ethers.getSigners();

    const decksFactory = await ethers.getContractFactory("Decks");
    const decksContract = await decksFactory.connect(deployer).deploy();

    await decksContract.waitForDeployment();

    const caeFactory = await ethers.getContractFactory("CardsAgainstEntropy");
    const caeContract = await caeFactory
      .connect(deployer)
      .deploy(decksContract.target, decksContract.target, decksContract.target);

    await caeContract.waitForDeployment();

    return { caeContract, deployer, p1, p2, p3 };
  }

  async function deployContractWithPlayersRegistered() {
    const [deployer, p1, p2, p3] = await ethers.getSigners();

    const decksFactory = await ethers.getContractFactory("Decks");
    const decksContract = await decksFactory.connect(deployer).deploy();

    await decksContract.waitForDeployment();

    const caeFactory = await ethers.getContractFactory("CardsAgainstEntropy");
    const caeContract = await caeFactory
      .connect(deployer)
      .deploy(decksContract.target, decksContract.target, decksContract.target);

    await caeContract.waitForDeployment();

    await caeContract.connect(p1).registerPlayer("player1");
    await caeContract.connect(p2).registerPlayer("player2");
    await caeContract.connect(p3).registerPlayer("player3");

    return { caeContract, deployer, p1, p2, p3 };
  }

  // REGISTER PLAYERS
  it("should not allow a player to register with an empty username", async function () {
    const { caeContract, p1 } = await loadFixture(deployContract);

    await expect(caeContract.connect(p1).registerPlayer("")).to.be.revertedWith(
      "Username can't be an empty string"
    );
  });

  it("should allow a player to register with a username", async function () {
    const { caeContract, p1 } = await loadFixture(deployContract);

    await expect(caeContract.connect(p1).registerPlayer("player1"))
      .to.emit(caeContract, "PlayerRegistered")
      .withArgs(p1.address);
  });

  // CREATE GAME
  it("should allow a player to create a game", async function () {
    const { caeContract, p1 } = await loadFixture(
      deployContractWithPlayersRegistered
    );

    await expect(caeContract.connect(p1).createGame("game1"))
      .to.emit(caeContract, "GameCreated")
      .withArgs(1);
  });

  it("should not allow creating a game without providing a name", async function () {
    const { caeContract, p1 } = await loadFixture(
      deployContractWithPlayersRegistered
    );

    await expect(caeContract.connect(p1).createGame("")).to.be.revertedWith(
      "Not valid game name"
    );
  });

  // JOIN GAME
  it("should allow a player to join an existing active game", async function () {
    const { caeContract, p1, p2 } = await loadFixture(
      deployContractWithPlayersRegistered
    );

    await caeContract.connect(p1).createGame("game1");

    await expect(caeContract.connect(p2).joinGame(1))
      .to.emit(caeContract, "PlayerJoinedGame")
      .withArgs(p2.address);
  });

  it("should allow players to join game while not full", async function () {
    const { caeContract, p1, p2, p3, deployer } = await loadFixture(
      deployContractWithPlayersRegistered
    );

    await caeContract.connect(p1).createGame("game1");

    await caeContract.connect(p2).joinGame(1);
    await caeContract.connect(p3).joinGame(1);

    await expect(caeContract.connect(deployer).joinGame(1)).to.be.revertedWith(
      "Game already full"
    );
  });

  it("should NOT allow a player to join a non-existent game", async function () {
    const { caeContract, p1 } = await loadFixture(
      deployContractWithPlayersRegistered
    );

    await expect(caeContract.connect(p1).joinGame(1)).to.be.revertedWith(
      "Game does not exist"
    );
  });

  // START GAME
  it("should NOT allow a player to start a game they are not part of", async function () {
    const { caeContract, p1, p2 } = await loadFixture(
      deployContractWithPlayersRegistered
    );

    await caeContract.connect(p1).createGame("game1");

    await expect(
      caeContract.connect(p2).startGame(1, 123, 3)
    ).to.be.revertedWith("You are not part of this game");
  });

  it("should not allow starting a game that it is not full", async function () {
    const { caeContract, p1, p2 } = await loadFixture(
      deployContractWithPlayersRegistered
    );

    await caeContract.connect(p1).createGame("game1");
    await caeContract.connect(p2).joinGame(1);

    await expect(
      caeContract.connect(p1).startGame(1, 123, 3)
    ).to.be.revertedWith("Cannot start a game that is not full");
  });

  it("should allow starting a game successfully", async function () {
    const { caeContract, p1, p2, p3 } = await loadFixture(
      deployContractWithPlayersRegistered
    );

    await caeContract.connect(p1).createGame("game1");

    await caeContract.connect(p2).joinGame(1);
    await caeContract.connect(p3).joinGame(1);

    await expect(caeContract.connect(p1).startGame(1, 123, 3))
      .to.emit(caeContract, "GameStarted")
      .withArgs(1);
  });

  // PLAY CARD
  it("should allow player 2 play a card, and NOT allow player 1 & 3 - first player turn", async function () {
    const { caeContract, p1, p2, p3 } = await loadFixture(
      deployContractWithPlayersRegistered
    );

    await caeContract.connect(p1).createGame("game1");

    await caeContract.connect(p2).joinGame(1);
    await caeContract.connect(p3).joinGame(1);

    await caeContract.connect(p1).startGame(1, 123, 3);

    await expect(caeContract.connect(p1).playCard(1)).to.be.revertedWith(
      "Not this players turn"
    );

    await expect(caeContract.connect(p3).playCard(1)).to.be.revertedWith(
      "Not this players turn"
    );

    await expect(caeContract.connect(p2).playCard(1)).to.emit(
      caeContract,
      "CardPlayed"
    );
  });

  it("should allow player 3 play a card, and NOT allow player 1 & 2 - second player turn", async function () {
    const { caeContract, p1, p2, p3 } = await loadFixture(
      deployContractWithPlayersRegistered
    );

    await caeContract.connect(p1).createGame("game1");

    await caeContract.connect(p2).joinGame(1);
    await caeContract.connect(p3).joinGame(1);

    await caeContract.connect(p1).startGame(1, 123, 3);

    await caeContract.connect(p2).playCard(1);

    // Second player turn
    await expect(caeContract.connect(p1).playCard(1)).to.be.revertedWith(
      "Not this players turn"
    );

    await expect(caeContract.connect(p2).playCard(1)).to.be.revertedWith(
      "Not this players turn"
    );

    await expect(caeContract.connect(p3).playCard(1)).to.emit(
      caeContract,
      "CardPlayed"
    );
  });

  it("should not allow any player play - judge turn", async function () {
    const { caeContract, p1, p2, p3 } = await loadFixture(
      deployContractWithPlayersRegistered
    );

    await caeContract.connect(p1).createGame("game1");

    await caeContract.connect(p2).joinGame(1);
    await caeContract.connect(p3).joinGame(1);

    await caeContract.connect(p1).startGame(1, 123, 3);

    await caeContract.connect(p2).playCard(1);
    await caeContract.connect(p3).playCard(1);

    await expect(caeContract.connect(p1).playCard(1)).to.be.revertedWith(
      "Invalid game status"
    );

    await expect(caeContract.connect(p2).playCard(1)).to.be.revertedWith(
      "Invalid game status"
    );

    await expect(caeContract.connect(p3).playCard(1)).to.be.revertedWith(
      "Invalid game status"
    );
  });

  // JUDGE CARD
  it("should allow judge to vote - judge turn", async function () {
    const { caeContract, p1, p2, p3 } = await loadFixture(
      deployContractWithPlayersRegistered
    );

    await caeContract.connect(p1).createGame("game1");

    await caeContract.connect(p2).joinGame(1);
    await caeContract.connect(p3).joinGame(1);

    await caeContract.connect(p1).startGame(1, 123, 3);

    await caeContract.connect(p2).playCard(1);
    await caeContract.connect(p3).playCard(1);

    await expect(caeContract.connect(p1).judgeCard(0)).to.emit(
      caeContract,
      "CardJudged"
    );
  });

  // NOT ALLOWED TO PLAY ALREADY PLAYED CARDS
  it("should not allow a player to play an already played card", async function () {
    const { caeContract, p1, p2, p3 } = await loadFixture(
      deployContractWithPlayersRegistered
    );

    await caeContract.connect(p1).createGame("game1");

    await caeContract.connect(p2).joinGame(1);
    await caeContract.connect(p3).joinGame(1);

    await caeContract.connect(p1).startGame(1, 123, 3);

    await caeContract.connect(p2).playCard(1);
    await caeContract.connect(p3).playCard(1);

    await expect(caeContract.connect(p1).judgeCard(0)).to.emit(
      caeContract,
      "CardJudged"
    );

    await expect(caeContract.connect(p3).playCard(1)).to.be.revertedWith(
      "Card used in first round"
    );
  });

  // END GAME WITH DRAW
  it("should reach end of the game with a draw", async function () {
    const { caeContract, p1, p2, p3 } = await loadFixture(
      deployContractWithPlayersRegistered
    );

    await caeContract.connect(p1).createGame("game1");

    await caeContract.connect(p2).joinGame(1);
    await caeContract.connect(p3).joinGame(1);

    await caeContract.connect(p1).startGame(1, 123, 3);

    await caeContract.connect(p2).playCard(1);
    await caeContract.connect(p3).playCard(1);

    await expect(caeContract.connect(p1).judgeCard(0)).to.emit(
      caeContract,
      "CardJudged"
    );

    await caeContract.connect(p3).playCard(2);
    await caeContract.connect(p1).playCard(1);

    await expect(caeContract.connect(p2).judgeCard(0)).to.emit(
      caeContract,
      "CardJudged"
    );

    await caeContract.connect(p1).playCard(2);
    await caeContract.connect(p2).playCard(2);

    await expect(caeContract.connect(p3).judgeCard(0)).to.emit(
      caeContract,
      "CardJudged"
    );
  });

  // END GAME WITH P1 WINNING
  it("should reach end of the game with a victory for player 1 (player 0 in the contract)", async function () {
    const { caeContract, p1, p2, p3 } = await loadFixture(
      deployContractWithPlayersRegistered
    );

    await caeContract.connect(p1).createGame("game1");

    await caeContract.connect(p2).joinGame(1);
    await caeContract.connect(p3).joinGame(1);

    await caeContract.connect(p1).startGame(1, 123, 3);

    await caeContract.connect(p2).playCard(1);
    await caeContract.connect(p3).playCard(1);

    await expect(caeContract.connect(p1).judgeCard(0)).to.emit(
      caeContract,
      "CardJudged"
    );

    await caeContract.connect(p3).playCard(2);
    await caeContract.connect(p1).playCard(1);

    await expect(caeContract.connect(p2).judgeCard(1)).to.emit(
      caeContract,
      "CardJudged"
    );

    await caeContract.connect(p1).playCard(2);
    await caeContract.connect(p2).playCard(2);

    await expect(caeContract.connect(p3).judgeCard(0)).to.emit(
      caeContract,
      "CardJudged"
    );
  });
});
