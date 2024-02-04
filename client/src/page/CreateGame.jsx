import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import styles from "../styles";
import { useGlobalContext } from "../context";
import { CustomButton, CustomInput, PageHOC, GameLoad } from "../components";

const CreateGame = () => {
  const { contract, walletAddress, gameName, setGameName, gameData } =
    useGlobalContext();
  const [waitGame, setWaitGame] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (gameData?.activeGame?.gameStatus === 0) {
      setWaitGame(true);
    }
  }, [gameData]);

  // checks if the player exists. If it doesn't, there's no need to try creating a game as it will crash
  useEffect(() => {
    const checkForPlayerToken = async () => {
      const playerExists = await contract.isPlayer(walletAddress);
      console.log({ playerExists });
    };
    if (contract) checkForPlayerToken();
  }, [contract]);

  const handleClick = async () => {
    if (!gameName || !gameName.trim()) return null;

    try {
      const player = await contract.isPlayer(walletAddress);
      console.log(player);
      await contract.createGame(gameName, deck_answers, 1, deck_questions, 0, {
        gasPrice: 0,
      });
      setWaitGame(true);
      console.log("Done");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <>
      {waitGame && <GameLoad />}

      <div className="flex flex-col mb-5">
        <CustomInput
          label="Start"
          placeholder="Enter game name"
          value={gameName}
          handleValueChange={setGameName}
        />
        <CustomButton
          title="Create Game"
          handleClick={handleClick}
          restStyles="mt-6"
        />
      </div>

      <p className={styles.infoText} onClick={() => navigate("/join-game")}>
        Or join already existing games
      </p>
    </>
  );
};

export default PageHOC(
  CreateGame,
  <>
    Create <br /> a new Game
  </>,
  <>Create your own game and wait for other players to join you</>
);
