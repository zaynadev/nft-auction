// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT2 is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("NFT2", "N2") {}

    function _minToken(
        address _to,
        string calldata _uri
    ) public returns (uint) {
        _tokenIds.increment();
        uint id = _tokenIds.current();
        _safeMint(_to, id);
        _setTokenURI(id, _uri);
        return id;
    }
}
