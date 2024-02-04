import { ethers } from "ethers";

import { ABI } from "../contract";

const AddNewEvent = (eventFilter, provider, cb) => {
  provider.removeListener(eventFilter);

  provider.on(eventFilter, (logs) => {
    const parsedLog = new ethers.utils.Interface(ABI).parseLog(logs);

    cb(parsedLog);
  });
};

export const createEventListeners = ({
  navigate,
  contract,
  provider,
  walletAddress,
  setShowAlert,
  setUpdateGameData,
}) => {
  const NewPlayerEventFilter = contract.filters.NewPlayer();

  AddNewEvent(NewPlayerEventFilter, provider, ({ args }) => {
    console.log("New player registered!", args);

    if (walletAddress === args.owner) {
      setShowAlert({
        status: true,
        type: "success",
        message: "Player has been successfully registered.",
      });
    }
  });

  // event CardsInit (string [] questionCards, string [] answerCards);
  const CardsInitEventFilter = contract.filters.CardsInit();

  AddNewEvent(CardsInitEventFilter, provider, ({ args }) => {
    console.log("Cards Initialized!", args);

    console.log("Cards: ", args.cards);
  });

  const NewGameEventFilter = contract.filters.NewGame();

  AddNewEvent(NewGameEventFilter, provider, ({ args }) => {
    console.log("A player joined the game");

    if (
      args.gameStatus === 1 &&
      (walletAddress.toLowerCase() === args.player1.toLowerCase() ||
        walletAddress.toLowerCase() === args.player2.toLowerCase() ||
        walletAddress.toLowerCase() === args.player3.toLowerCase())
    ) {
      console.log("New game started", args);
      navigate(`/game/${args.gameName}`);
    }

    setUpdateGameData((prevUpdateGameData) => prevUpdateGameData + 1);
  });

  // event CardPlayedJudge(address player, CardType cardType, string cardText);
  const CardPlayedJudgeEventFilter = contract.filters.CardPlayedJudge();

  AddNewEvent(CardPlayedJudgeEventFilter, provider, ({ args }) => {
    console.log("The judge played a card!", args);

    console.log("Judge: ", args.judge);
    console.log("Card Played: ", args.cardText);
  });

  // event NewRoundStarted (string message);
  const NewRoundStartedEventFilter = contract.filters.NewRoundStarted();

  AddNewEvent(NewRoundStartedEventFilter, provider, ({ args }) => {
    console.log(args.message);
  });

  // event CardsDealt (bool cardsDealt);
  const CardsDealtEventFilter = contract.filters.CardsDealt();

  AddNewEvent(CardsDealtEventFilter, provider, ({ args }) => {
    console.log("Cards Dealt: ", args.cardsDealt);
  });
};
