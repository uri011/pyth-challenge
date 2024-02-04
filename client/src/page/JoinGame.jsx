import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useGlobalContext } from "../context";
import { CustomButton, PageHOC, GameLoad } from "../components";
import styles from "../styles";

const JoinGame = () => {
  const { contract, gameData, setShowAlert, setGameName, walletAddress } =
    useGlobalContext();
  const navigate = useNavigate();

  const [waitGame2, setWaitGame2] = useState(false);

  // check if needed for the user to be able to reload the page and still be in GameLoad
  useEffect(() => {
    if (gameData?.activeGame?.gameStatus === 0) {
      setWaitGame2(true);
    }
  }, [gameData]);

  const handleClick = async (gameName) => {
    setGameName(gameName);

    try {
      await contract.joinGame(gameName, { gasPrice: 0 }); //, { gasLimit: 500000 });
      setWaitGame2(true);

      setShowAlert({
        status: true,
        type: "success",
        message: `Joining ${gameName}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {waitGame2 && <GameLoad />}

      <h2 className={styles.joinHeadText}>Available Games:</h2>

      <div className={styles.joinContainer}>
        {gameData.pendingGames.length ? (
          gameData.pendingGames
            .filter((game) => !game.players.includes(walletAddress))
            .map((game, index) => (
              <div key={game.name + index} className={styles.flexBetween}>
                <p className={styles.joinBattleTitle}>
                  {index + 1}. {game.name}
                </p>
                <CustomButton
                  title="Join"
                  handleClick={() => handleClick(game.name)}
                />
              </div>
            ))
        ) : (
          <p className={styles.joinLoading}>
            Reload the page to see new games.
          </p>
        )}
      </div>

      <p className={styles.infoText} onClick={() => navigate("/create-game")}>
        Or create a new game
      </p>
    </>
  );
};

export default PageHOC(
  JoinGame,
  <>
    Join <br /> a Game
  </>,
  <>Join already existing games</>
);
