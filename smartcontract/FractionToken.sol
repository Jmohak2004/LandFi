// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC1155/ERC1155.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/Ownable.sol";

/// @title FractionToken - ERC1155 token for fractional properties
contract FractionToken is ERC1155, Ownable {
    string public name;
    string public symbol;

    mapping(uint256 => uint256) public totalSupply;

    constructor(string memory uri_, string memory _name, string memory _symbol) ERC1155(uri_) {
        name = _name;
        symbol = _symbol;
    }

    function mint(address to, uint256 id, uint256 amount, bytes memory data) external onlyOwner {
        _mint(to, id, amount, data);
        totalSupply[id] += amount;
    }

    function burn(address from, uint256 id, uint256 amount) external onlyOwner {
        _burn(from, id, amount);
        totalSupply[id] -= amount;
    }

    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }
}
