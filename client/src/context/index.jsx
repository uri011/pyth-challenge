import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { useNavigate, useRouteError } from "react-router-dom";

import { ABI, ADDRESS } from "../contract";
import { createEventListeners } from "./createEventListeners";

const GlobalContext = createContext();

export const GlobalContextProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [provider, setProvider] = useState("");
  const [contract, setContract] = useState("");
  const [showAlert, setShowAlert] = useState({
    status: false,
    type: "info",
    message: "",
  });
  const [gameName, setGameName] = useState("");
  const [gameData, setGameData] = useState({
    players: [],
    pendingGames: [],
    activeGame: null,
  });
  const [updateGameData, setUpdateGameData] = useState(0);
  const [battleGround, setBattleGround] = useState("bg-cardmat");

  const navigate = useNavigate();

  // Set the wallet address to the state
  const updateCurrentWalletAddress = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (accounts) setWalletAddress(accounts[0]);
  };

  useEffect(() => {
    updateCurrentWalletAddress();
    window.ethereum.on("accountsChanged", updateCurrentWalletAddress);
  }, []);

  // Set the smart contract and the provider to the state
  useEffect(() => {
    const setSmartcontractAndProvider = async () => {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const newProvider = new ethers.providers.Web3Provider(connection);
      const signer = newProvider.getSigner();
      const newContract = new ethers.Contract(ADDRESS, ABI, signer);
      setProvider(newProvider);
      setContract(newContract);
    };
    setSmartcontractAndProvider();
  }, []);

  useEffect(() => {
    if (contract) {
      createEventListeners({
        navigate,
        contract,
        provider,
        walletAddress,
        setShowAlert,
        setUpdateGameData,
      });
    }
  }, [contract]);

  // handle errors --> close the error alert in 5 seconds
  useEffect(() => {
    if (showAlert?.status) {
      const timer = setTimeout(() => {
        setShowAlert({ status: false, type: "info", message: "" });
      }, [5000]);

      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  // Set the game data to the state
  useEffect(() => {
    const fetchGameData = async () => {
      const fetchedGames = await contract.getAllGames();
      console.log("Games: ", fetchedGames);
      const pendingGames = fetchedGames.filter((game) => game.gameStatus === 0); // only pending games
      let activeGame = null;

      fetchedGames.forEach((game) => {
        if (
          game.players.find(
            (player) => player.toLowerCase() === walletAddress.toLowerCase()
          )
        ) {
          if (game.winner.startsWith("0x00")) {
            activeGame = game;
            console.log(game);
          }
        }
      });
      // This line shows the list of games that are waiting for more players to join
      // slice(0) for first version and slice(1) for video version
      setGameData({ pendingGames: pendingGames.slice(0), activeGame });
    };

    if (contract) fetchGameData();
  }, [contract, updateGameData]);

  return (
    <GlobalContext.Provider
      value={{
        contract,
        walletAddress,
        showAlert,
        setShowAlert,
        gameName,
        setGameName,
        gameData,
        setGameData,
        battleGround,
        setBattleGround,
        updateGameData,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
