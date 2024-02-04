// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@pythnetwork/entropy-sdk-solidity/IEntropy.sol";

import "./TheNFT.sol";

library CardsAgainstEntropyErrors {
    error IncorrectSender();
    error InsufficientFee();
}

/// @notice Interface for the Decks contract
/// @dev Provides with the Questions & Answers cards
interface IDecks {
    function getQuestionsDeck() external view returns (string[] memory);
    function getAnswersDeck() external view returns (string[] memory);
    function getEntry(uint index, bool isQuestion) external view returns (string memory);
}

import "hardhat/console.sol";

/// @notice CardsAgainstEntropy contract, the main contract of the game
/// @dev Implements the register, create, join and end game functionalities
/// @dev Implements the Game & Player state and calls functions from IDecks & IGameLogic to update the state of those
contract CardsAgainstEntropy {

    /**
     * 
     * INTERFACES
     * 
     */

    IDecks _decks;

    IEntropy private entropy;
    address private entropyProvider;
    mapping(uint64 => address) private requestedSeqNumbers;

    event FlipRequest(uint64 sequenceNumber);
    event FlipResultAnswers(uint256 randomNumber);
    event FlipResultQuestions(uint256 randomNumber);

    TheNFT theNFT;

    /**
     * 
     * DATA STRUCTURES
     * 
     */

    // DEFINITIONS

    /**
     * @notice Struct to store player information
     * @param username User username (can't be an empty string)
     * @param gameId Unique identifier of the game (no game, gameId is 0)
     * @param dealtCards answer cards dealt to the player (no game cards, dealtCards 3 empty strings)
     * @param indexCard Index of the selected answer card by the user (no card choosen, indexCard is 0) - to access selected card -> dealtCards[indexCard - 1]
     * @param score score of the players. The player gets one point if his card is selected by the judge.
     */
    struct Player {
        string username;
        uint256 gameId;
        string[3] dealtCards;
        uint256[3] cardIndexs;
        uint256 score;
    }

    /**
     * @notice Struct to store game state and data
     * @param name game name; set by player who creates game
     * @param status uint to indicate game status
     * 0: game not started 1: cards dealt - first player turn 2: second player turn 3: judge turn 4: game ended
     * @param questionCard text of the question card for the actual round
     * @param players address array representing players in this game
     * @param winner winner of the game address (no winner yet -> address(0))
     * @param round round the game is currently found (default state is 0)
     * @dev judge player will always be the player in index 0 on the players address array
     * @dev player 1 will be player in the index 1 on the players address array, leaving player 2 with index 2
     */
    struct Game {
        string name;
        uint256 status;
        string questionCard;
        address[3] players;
        address winner;
        uint256 round;
    }

    // DECLARATIONS

    /// @notice Target ID assigned to the next game
    /// @dev Increments by one after being assigned to a game
    uint256 private _targetGameId = 0;

    /// @notice Mapping with all games created
    /// @dev If game does not exist entry is empty Game struct
    mapping(uint256 gameId => Game) games;

    /// @notice Mapping with all players ever registered
    /// @dev If player does not exist entry is empty Player struct
    mapping(address playerAddress => Player) players;

    /**
     * 
     * EVENTS
     * 
     */

    /**
     * @notice Event notifiyng username modified
     * @param playerAddress Address of the player that modified its username
     */
    event PlayerRegistered(address indexed playerAddress);

    /**
     * @notice Event notifiyng game has been created
     * @param gameId Id of the game created
     */
    event GameCreated(uint256 indexed gameId);

    /**
     * @notice Notifies player has joined an active game
     * @param playerAddress Address of the player that joined the game
     */
    event PlayerJoinedGame(address indexed playerAddress);

    /**
     * @notice Notifies game has been filled up and therefore has started
     * @param gameId Id of the game started
     */
    event GameStarted(uint256 indexed gameId);

    /**
     * @notice Notifies game has been concluded
     * @param gameId Id of the game ended
     */
    event GameEnded(uint256 indexed gameId, address indexed winner);

    /**
     * @notice Notifies game cards have been dealt
     * @param gameId Id of the game ended
     */
    event CardsDealt(uint256 indexed gameId);

    /**
     * @notice Notifies the card that the player has selected for the round
     * @param cardPlayed card selected by the player for the round
     */
    event CardPlayed (string cardPlayed);

    /**
     * @notice Notifies the card that the player has selected for the round
     * @param cardJudged card selected by the player for the round
     */
    event CardJudged (string cardJudged);

    /**
     * 
     * CONSTRUCTOR
     * 
     */

    /// @notice Constructor to set the Decks contract address
    /// @param _decksAddress Address of the deployed Decks contract
    constructor(address _decksAddress, address _entropy, address _entropyProvider) {
        _decks = IDecks(_decksAddress);
        entropy = IEntropy(_entropy);
        entropyProvider = _entropyProvider;
        theNFT = new TheNFT("NFT", "NFT");
    }

    /**
     * 
     * EXTERNAL FUNCTIONS
     * 
     */

    /// READ FUNCTIONS

    /// @notice External implementation of _getPlayer
    function getPlayer(address _address) external view returns (Player memory) {
        return _getPlayer(_address);
    }

    /// @notice External implementation of _getGame
    function getGame(uint256 _id) external view returns (Game memory) {
        return _getGame(_id);
    }
    
    /// WRITE FUNCTIONS
    
    /**
     * @notice Register player name.
     * @param _username The username to assign to the player address.
     * @return Address of the targeted player
     * 
     * @dev Emit PlayerRegistered event
    */
     function registerPlayer(string memory _username) external returns (address){
        require(bytes(_username).length > 0, "Username can't be an empty string");

        players[msg.sender].username = _username;
        players[msg.sender].gameId = 0;
        emit PlayerRegistered(msg.sender);
        return msg.sender;
    }

    /**
     * @notice Creates a new game provided a game name
     * @param _name game name; set by player
     * @return ID of the new game created
     * 
     * @dev Emit GameCreated event
    */
    function createGame(string memory _name) external returns (uint256) {
        require(_existsPlayer(msg.sender), "Player does not exist");
        require(!_isPlayerActive(msg.sender), "Player already in a game");

        require(bytes(_name).length != 0, "Not valid game name");

        // Get New Game ID
        uint256 _newId = _generateId();

        // Update player game ID
        players[msg.sender].gameId = _newId;

        // Update game state
        games[_newId].name = _name;
        games[_newId].players[0] = msg.sender;

        // Emit event
        emit GameCreated(_newId);

        // Return game struct
        return _newId;
    }

    /**
     * @notice Join existing active game
     * @param _id The unique ID of the game to join.
     * @return ID of the game joined
     * 
     * @dev Emit PlayerJoinedGame event
    */
     function joinGame(uint256 _id) external returns (uint256) {
        require(!_isPlayerActive(msg.sender), "Player already in a game");

        require(_existsGame(_id), "Game does not exist");
        require(!(_isGameActive(_id)), "Game already active");

        // Update game state
        if (games[_id].players[1] == address(0)) {
            games[_id].players[1] = msg.sender;
        } else if (games[_id].players[2] == address(0)) {
            games[_id].players[2] = msg.sender;
        } else {
            revert('Game already full');
        }

        // Update player state
        players[msg.sender].gameId = _id;

        emit PlayerJoinedGame(msg.sender);

        return _id;
    }

    /**
     * @notice Starts a game that already has 3 players
     * @param _id The unique ID of the game to start
     * @param _randomNumber Randomly generated number off-chain
     * @param _cardsPerPlayer Number of cards dealt to each player
     * @dev Emit GameStarted event
    */
    function startGame(uint256 _id, uint256 _randomNumber, uint256 _cardsPerPlayer) external {
        require(_existsGame(_id),"There is no game assigned to this id");

        require(_isPlayerInGame(msg.sender, _id), "You are not part of this game");

        require(games[_id].players[2] != address(0), "Cannot start a game that is not full");

        // Ensure that the game is in the correct status to start
        require(games[_id].status == 0, "Game is not in the correct status to start");

        // Deal cards (you may want to call a function for this)
        _dealCards(_id, _randomNumber, _cardsPerPlayer);

        // Change game status to "started - first player turn"
        games[_id].status = 1;

        // Emit the GameStarted event
        emit GameStarted(_id);
    }

    
    /**
     * @notice Allows a player to play a card in the Cards Against Entropy game.
     * @dev Players can play a card during their turn in the game, provided they are not the judge.
     * @param _cardIndex The index of the card to be played (0, 1, or 2).
     * @dev Requires the player to have a valid card index, the game status to be either 2 (first player's turn) or 3 (second player's turn), and the player not being the judge.
     * @dev The played card is stored, removed from the player's hand, and the game turn is updated.
     * @dev Emits a `CardPlayed` event after a successful card play.
     */
    function playCard(uint256 _cardIndex) external {
        // Get player and game
        Player memory _player = players[msg.sender];
        Game memory _game = games[_player.gameId];

        console.log("PlayCard - Game ID: %s", _player.gameId);
        console.log("PlayCard - Game Status: %s", _game.status);
        console.log("PlayCard - Game Round: %s", _game.round);
        console.log("PlayCard - Function Caller: %s", msg.sender);
        console.log("PlayCard - Player Turn: %s", _game.players[(_game.status + _game.round) % 3]);

        // Check if game in state to play cards (status 1 or 2)
        require(_game.status == 1 || _game.status == 2, "Invalid game status");

        // Check it is this players turn
        require(_game.players[(_game.status + _game.round) % 3] == msg.sender, "Not this players turn");

        // Check card index is between 1 and 3
        require(_cardIndex > 0 || _cardIndex < 4, "Card index must be 1, 2, or 3");

        console.log("PlayCard - Card Played 1st Round: %s", _player.cardIndexs[0]);
        console.log("PlayCard - Card Played 2nd Round: %s", _player.cardIndexs[1]);

        // Check card not been previously used
        if (_game.round == 1) {
            require(_player.cardIndexs[0] != _cardIndex, "Card used in first round");
        } else if (_game.round == 2) {
            require(_player.cardIndexs[0] != _cardIndex && _player.cardIndexs[1] != _cardIndex, "Card used in previous round");
        }

        // Update player status
        players[msg.sender].cardIndexs[_game.round] = _cardIndex;

        // Update game state
        games[_player.gameId].status = games[_player.gameId].status + 1;

        console.log("Played Card: %s", _player.dealtCards[_cardIndex - 1]);

        emit CardPlayed(_player.dealtCards[_cardIndex - 1]);
    }

    /**
     * @notice Allows judge to judge the card, updates game players and game state.
     * @param _cardIndex The index of the card to be selected as winner.
     * @dev The cardIndex will be 0 to vote player 1 and 1 to vote player 2
     * @dev Emits a `CardJudged` event after a successful card play.
     * @dev Emits a `GameEnded` event with winner's address (if draw - address(0)).
     */
    function judgeCard(uint256 _cardIndex) external {
        // Get judge and game
        Player memory _judge = players[msg.sender];
        Game memory _game = games[_judge.gameId];

        console.log("JudgeCard - Game ID: %s", _judge.gameId);
        console.log("JudgeCard - Game Status: %s", _game.status);
        console.log("JudgeCard - Game Round: %s", _game.round);
        console.log("JudgeCard - Function Caller: %s", msg.sender);
        console.log("JudgeCard - Player Turn: %s", _game.players[(_game.status + _game.round) % 3]);

        // Check if game in state to judge cards (status 3)
        require(_game.status == 3, "Invalid game status");

        // Check it is funciton caller is judge
        require(_game.players[(_game.status + _game.round) % 3] == msg.sender, "This player is not the judge");

        // Check card index is correct
        require(_cardIndex < 2, "Card index must be 0 or 1");

        // Process vote
        address _winnerAddr = _game.players[(_game.status + _cardIndex + 1 + _game.round) % 3];
        string memory _winnerCard =  players[_winnerAddr].dealtCards[players[_winnerAddr].cardIndexs[_game.round] - 1];

        // Add 1 to the score of the winner
        players[_winnerAddr].score = players[_winnerAddr].score + 1;

        console.log("Winner Address: %s", _winnerAddr);
        console.log("Dealt Card Index: %s", players[_winnerAddr].cardIndexs[_game.round]);
        console.log("Judged Card: %s", _winnerCard);

        emit CardJudged(_winnerCard);

        if (_game.round < 2) {
            games[_judge.gameId].status = 1;
            games[_judge.gameId].round = games[_judge.gameId].round + 1;
        } else {
            games[_judge.gameId].status = 4;

            uint256 _gameWinnerIndx = 4;
            uint256 _topScore = 0;

            // Decide game winner
            // Set players to default values
            for (uint256 i = 0; i < 3; i++) {
                console.log("Decide Winner Player %s score is %s",i,players[_game.players[i]].score);
                if (players[_game.players[i]].score > _topScore) {
                    _gameWinnerIndx = i;
                    _topScore = players[_game.players[i]].score;
                } else if (players[_game.players[i]].score == _topScore) {
                    _gameWinnerIndx = 4;
                }

                players[_game.players[i]].gameId = 0;
                players[_game.players[i]].score = 0;
                for (uint256 k = 0; k < 3; k++) {
                    players[_game.players[i]].dealtCards[k] = "";
                    players[_game.players[i]].cardIndexs[k] = 0;
                }
            }

            players[_game.players[0]].dealtCards[0] = "";

            if (_gameWinnerIndx == 4) {
                console.log("Game Draw");
                // Draw
                emit GameEnded(_judge.gameId,address(0));
            } else {
                games[_judge.gameId].winner = games[_judge.gameId].players[_gameWinnerIndx];
                console.log("Game Winner: %s", games[_judge.gameId].winner);

                emit GameEnded(_judge.gameId, games[_judge.gameId].players[_gameWinnerIndx]);
                
                theNFT.addToWhitelist(games[_judge.gameId].winner);
            }
        }      
    }

    /**
     * 
     * INTERNAL FUNCTIONS
     * 
     */

    /// READ FUNCTIONS

    /**
     * @notice Internal function to get player struct for given address
     * @param _address Targeted address
     * @return The entry player struct
     */
    function _getPlayer(address _address) internal view returns (Player memory) {
        return players[_address];
    }

    /**
     * @notice Internal function to get an entry from the CardGame contract.
     * @param index The index of the entry to retrieve.
     * @param isQuestion Flag to determine if the entry is a question or an answer.
     * @return The string entry from the CardGame contract.
     * 
     * @dev Calls the getEntry function of the CardGame contract.
     */
    function _getDeckEntry(uint256 index, bool isQuestion) internal view returns (string memory) {
        return _decks.getEntry(index, isQuestion);
    }

    /**
     * @notice Internal function to know if player is registered
     * @param _address Address of the targeted player
     * @return Boolean notifying if user is registered or not
     */
    function _existsPlayer(address _address) internal view returns (bool) {
        return bytes(players[_address].username).length != 0;
    }

    /**
     * @notice Internal function to know if player has joined game
     * @param _address The index of the entry to retrieve
     * @return The boolena notifying if player has joined game
     */
    function _isPlayerActive(address _address) internal view returns (bool) {
        return players[_address].gameId != 0;
    }

    /**
     * @notice Internal function to get game struct for given id
     * @param _id Targeted id
     * @return The entry game struct
     */
    function _getGame(uint256 _id) internal view returns (Game memory) {
        return games[_id];
    }

    /**
     * @notice Internal function to know if game is registered
     * @param _id Identifier of the targeted game
     * @return Boolean notifying if game has been created or not
     */
    function _existsGame(uint256 _id) internal view returns (bool) {
        require(_id != 0, "Game ID Not Valid");
        return (_id <= _targetGameId);
    }

    /**
     * @notice Internal function to know if a game has started
     * @param _id Identifier of the targeted game
     * @return The boolean notifying if the game has started or not
     */
    function _isGameActive(uint256 _id) internal view returns (bool) {
        Game memory _game = _getGame(_id);
        if(_game.status == 0) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * @notice Internal function to check if a player is part of a specific game
     * @param _address The address of the player
     * @param _id The ID of the game
     * @return A boolean indicating whether the player is part of the game
     */
    function _isPlayerInGame(address _address, uint256 _id) internal view returns (bool) {
        return players[_address].gameId == _id;
    }

    /// WRITE FUNCTIONS

    /**
     * @notice Increments current game id and retunrs result
     * @return New generated game id ready to be assigned
     */
    function _generateId () internal returns (uint256) {
        _targetGameId = _targetGameId + 1;
        return _targetGameId;
    }

    function _dealCards(uint256 _id, uint256 _randomNumber, uint256 _cardsPerPlayer) internal {

        uint256 _numPlayers = games[_id].players.length;

        uint256 _totalCards = _numPlayers * _cardsPerPlayer;

        string[] memory _answerDeck = _decks.getAnswersDeck();
        string[] memory _questionsDeck = _decks.getQuestionsDeck();

        require(_answerDeck.length >= _totalCards, "Not enough answer cards in the deck");

        console.log("Num of Answer Cards: %s", _answerDeck.length);
        console.log("Num of Question Cards: %s", _questionsDeck.length);
        console.log("Num of Total Cards: %s", _totalCards);

        console.log("Pre Shuffle - First Answer Card: %s", _answerDeck[0]);
        console.log("Pre Shuffle - First Question Card: %s", _questionsDeck[0]);

        // Both gets get shuffled with the random number before dealing the cards
        FisherYatesShuffle(_randomNumber, _answerDeck);
        FisherYatesShuffle(_randomNumber, _questionsDeck);

        console.log("After Shuffle - First Answer Card: %s", _answerDeck[0]);
        console.log("After Shuffle - First Question Card: %s", _questionsDeck[0]);

        // Update game state
        games[_id].questionCard = _questionsDeck[games[_id].round];

        // Assign dealt cards to players
        for (uint256 i = 0; i < _numPlayers; i++) {
            for (uint256 k = 0; k < 3; k++) {
                players[games[_id].players[i]].dealtCards[k] = _answerDeck[i * 3 + k];
                console.log("Dealt Card: %s", players[games[_id].players[i]].dealtCards[k]);
            }
        }

        emit CardsDealt(_id);
    }

    /**
     * @notice Fisher-Yates Shuffle function to shuffle an array of strings
     * @dev This function shuffles the elements of the given string array using the Fisher-Yates algorithm.
     * @param randomSeed Random seed used to introduce randomness into the shuffle process.
     * @param deck The array of strings to be shuffled in place.
     * 
     * @dev This function modifies the input array in place, providing a shuffled version.
     * @dev The randomness is introduced through the `randomSeed` parameter.
     */
    function FisherYatesShuffle(uint256 randomSeed, string[] memory deck) pure internal {
        for (uint256 i = deck.length - 1; i > 0; i--) {
            uint256 j = (randomSeed + i) % (i + 1);
            string memory temp = deck[i];
            deck[i] = deck[j];
            deck[j] = temp;
        }
    }

    function getFlipFee(uint256 _gameId) public view returns (uint256 fee) {
        require(_existsGame(_gameId),"There is no game assigned to this id");
        require(_isPlayerInGame(msg.sender, _gameId), "You are not part of this game");

        fee = entropy.getFee(entropyProvider);
    }

    function requestFlip(bytes32 userCommitment, uint256 _gameId) external payable {
        require(_existsGame(_gameId),"There is no game assigned to this id");
        require(_isPlayerInGame(msg.sender, _gameId), "You are not part of this game");

        uint256 fee = entropy.getFee(entropyProvider);
        if (msg.value < fee) {
            revert CardsAgainstEntropyErrors.InsufficientFee();
        }

        uint64 sequenceNumber = entropy.request{value: fee}(
            entropyProvider,
            userCommitment,
            true
        );
        requestedSeqNumbers[sequenceNumber] = msg.sender;

        emit FlipRequest(sequenceNumber);
    }

    function revealFlip(
        uint64 sequenceNumber,
        bytes32 userRandom, // User's Random Number
        bytes32 providerRandom, // Provider's Random Number
        uint256 _gameId
    ) public {
        require(_existsGame(_gameId),"There is no game assigned to this id");
        require(_isPlayerInGame(msg.sender, _gameId), "You are not part of this game");
        
        if (requestedSeqNumbers[sequenceNumber] != msg.sender) {
            revert CardsAgainstEntropyErrors.IncorrectSender();
        }
        delete requestedSeqNumbers[sequenceNumber];

        bytes32 randomNumber = entropy.reveal(
            entropyProvider,
            sequenceNumber,
            userRandom,
            providerRandom
        );
        emit FlipResultAnswers(uint256(randomNumber) % _decks.getAnswersDeck().length);
        emit FlipResultQuestions(uint256(randomNumber) % _decks.getQuestionsDeck().length);
    }
}
