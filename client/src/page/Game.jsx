import React from "react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../styles";
import { Alert } from "../components";
import { useGlobalContext } from "../context";
import {
  player01 as player01Icon,
  player02 as player02Icon,
  player03 as player03Icon,
} from "../assets";

const Game = () => {
  const {
    contract,
    gameData,
    walletAddress,
    showAlert,
    setShowAlert,
    battleGround,
  } = useGlobalContext();
  const { gameName } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const getPlayerInfo = async () => {
      try {
        let player01Address = null;
        let player02Address = null;
        let player03Address = null;

        if (
          gameData.activeGame.players[0].toLowerCase() ===
          walletAddress.toLowerCase()
        ) {
          player01Address = gameData.activeGame.players[0];
          player02Address = gameData.activeGame.players[1];
          player03Address = gameData.activeGame.players[2];
        } else if (
          gameData.activeGame.players[1].toLowerCase() ===
          walletAddress.toLowerCase()
        ) {
          player01Address = gameData.activeGame.players[1];
          player02Address = gameData.activeGame.players[2];
          player03Address = gameData.activeGame.players[0];
        } else {
          player01Address = gameData.activeGame.players[2];
          player02Address = gameData.activeGame.players[0];
          player03Address = gameData.activeGame.players[1];
        }
      } catch (error) {
        console.log(error.message);
      }
    };

    if (contract && gameData.activeGame) getPlayerInfo();
  }, [contract, gameData, gameName]);

  return (
    <div
      className={`${styles.flexBetween} ${styles.gameContainer} ${battleGround}`}
    >
      <h1 className="text1-xl"></h1>
    </div>
  );
};

export default Game;
