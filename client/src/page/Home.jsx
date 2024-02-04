import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalContext } from "../context";
import { PageHOC, CustomInput, CustomButton } from "../components";

const Home = () => {
  // We pass the contract, the address and object that shows alerts from the context "index.js" file
  // This allows us to access the information from any page (in this case in the Home page)
  const { contract, walletAddress, setShowAlert } = useGlobalContext();
  const [playerName, setPlayerName] = useState("");
  const navigate = useNavigate();

  const handleClick = async () => {
    try {
      const playerExists = await contract.isPlayer(walletAddress);
      console.log(playerExists);
      if (!playerExists) {
        await contract.registerPlayer(playerName, { gasPrice: 0 });
        setShowAlert({
          status: true,
          type: "info",
          message: `${playerName} has been created`,
        });

        setTimeout(() => navigate("/create-game"), 8000);
      }
    } catch (error) {
      setShowAlert({
        status: true,
        type: "failure",
        message: "Something went wrong!",
      });
      alert(error);
    }
  };

  useEffect(() => {
    const checkForPlayerToken = async () => {
      const playerExists = await contract.isPlayer(walletAddress);

      console.log({ playerExists });

      if (playerExists) {
        navigate("/create-game");
      }
    };
    if (contract) checkForPlayerToken();
  }, [contract]);

  return (
    <div className="flex flex-col">
      <CustomInput
        label="Name"
        placeholder="Enter your player name"
        value={playerName}
        handleValueChange={setPlayerName}
      />
      <CustomButton
        title="Register"
        handleClick={handleClick}
        restStyles="mt-6"
      />
    </div>
  );
};

export default PageHOC(
  Home,
  <>
    Welcome to Cards Against Entropy <br /> a Web3 NFT Card Game
  </>,
  <>
    Connect your wallet to start playing <br /> the ultimate Cards Against
    Humanity Game
  </>
);
