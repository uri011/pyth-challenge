// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title A Decks Contract
/// @notice This contract provides functions to access predefined arrays of strings, which are card decks, for a card game.
/// @dev Stores two constant arrays for answers and questions and provides access via a public function.
contract Decks {

    /// @dev Array of predefined questions.
    string[] private questionsDeck = [
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
        "The secret to a long and happy life is a daily dose of ____________."
    ];

    /// @dev Array of predefined answers.
    string[] private answersDeck = [
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
        "The sweet release of death."
    ];

    function getQuestionsDeck() external view returns (string[] memory) {
        return questionsDeck;
    }

    function getAnswersDeck() external view returns (string[] memory) {
        return answersDeck;
    }

    /// @notice Fetches an entry from one of the two arrays.
    /// @dev Uses modulus to safely access array elements within bounds.
    /// @param index The array index to access, will be modded to fit the array size.
    /// @param isQuestion A boolean to choose between the question and answer array.
    /// @return A string from either the answers or questions array, based on the index and boolean flag.
    function getEntry(uint index, bool isQuestion) public view returns (string memory) {
        if(isQuestion) {
            return questionsDeck[index % questionsDeck.length];
        } else {
            return answersDeck[index % answersDeck.length];
        }
    }
}