const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Decks", function () {
  async function deployDecksContract() {
    const Decks = await ethers.getContractFactory("Decks");
    const decks = await Decks.deploy();
    await decks.waitForDeployment();
    return decks;
  }

  it("Should return the correct questions deck", async function () {
    const decks = await loadFixture(deployDecksContract);
    const questions = await decks.getQuestionsDeck();
    expect(questions.length).to.equal(20); // Assuming there are 20 predefined questions
    expect(questions[0]).to.equal(
      "What's the next big reality TV show? '_________ Wars.'"
    );
    // Add more checks as necessary
  });

  it("Should return the correct answers deck", async function () {
    const decks = await loadFixture(deployDecksContract);
    const answers = await decks.getAnswersDeck();
    expect(answers.length).to.equal(20); // Assuming there are 20 predefined answers
    expect(answers[0]).to.equal("A bucket of fried chicken.");
    // Add more checks as necessary
  });

  it("Should correctly fetch an entry from the questions or answers deck", async function () {
    const decks = await loadFixture(deployDecksContract);
    const questionIndex = 1;
    const answerIndex = 1;
    const questionEntry = await decks.getEntry(questionIndex, true);
    const answerEntry = await decks.getEntry(answerIndex, false);

    expect(questionEntry).to.equal(
      "In my autobiography, the title of the first chapter will be 'My Love Affair with ________.'"
    );
    expect(answerEntry).to.equal("Uncontrollable flatulence.");
  });

  it("Should correctly fetch an entry from the questions or answers deck", async function () {
    const decks = await loadFixture(deployDecksContract);

    const questionIndex = 3;
    const answerIndex = 3;

    const questionEntry = await decks.getEntry(questionIndex, true);
    const answerEntry = await decks.getEntry(answerIndex, false);

    expect(questionEntry).to.equal(
      "The latest scientific discovery: ____________ causes global warming."
    );

    expect(answerEntry).to.equal("A sassy black woman.");

    // Test boundary conditions and modulus behavior

    const outOfBoundsIndex = questionIndex + 20 * 3;
    const outOfBoundsQuestion = await decks.getEntry(outOfBoundsIndex, true);
    expect(outOfBoundsQuestion).to.equal(questionEntry); // Assuming modulus brings it back to the same entry
  });
});
