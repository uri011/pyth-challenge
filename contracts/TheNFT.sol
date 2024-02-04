// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TheNFT is ERC721, Ownable {
    mapping(address => bool) public whitelist;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) Ownable(msg.sender) {}

    // Add an address to the whitelist
    function addToWhitelist(address _address) external onlyOwner {
        whitelist[_address] = true;
    }

    // Remove an address from the whitelist
    function removeFromWhitelist(address _address) internal {
        whitelist[_address] = false;
    }

    // Modified mint function with whitelist check
    function mint(address to, uint256 tokenId) public {
        require(whitelist[to], "Address not whitelisted or already minted");
        _mint(to, tokenId);
        removeFromWhitelist(to);
    }
}
