// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract Auction {
    struct Listing {
        IERC721 nft;
        uint tokenId;
        address owner;
        uint minPrice;
        uint highestBid;
        address highestBider;
        uint endTime;
    }
    uint listingId;
    mapping(uint => Listing) listings;
    mapping(address => uint) balances;

    event List(
        address indexed lister,
        address indexed nft,
        uint indexed tokenId,
        uint listingid,
        uint minPrice,
        uint endTime,
        uint timestamp
    );
    event Bid(
        address indexed bidder,
        uint indexed listingid,
        uint amount,
        uint timestamp
    );

    modifier listingIdExists(uint id) {
        require(listings[id].owner != address(0), "listing does not exist");
        _;
    }

    function list(
        address _nft,
        uint _tokenId,
        uint _minPrice,
        uint numhours
    ) external returns (uint) {
        require(
            IERC721(_nft).ownerOf(_tokenId) == msg.sender,
            "You are not the owner of this token!"
        );
        require(
            IERC721(_nft).getApproved(_tokenId) == address(this),
            "Token id need approval"
        );
        listingId++;
        IERC721(_nft).safeTransferFrom(msg.sender, address(this), _tokenId);
        uint endTime = block.timestamp + (numhours * 1 hours);
        listings[listingId] = Listing(
            IERC721(_nft),
            _tokenId,
            msg.sender,
            _minPrice,
            0,
            msg.sender,
            endTime
        );
        emit List(
            msg.sender,
            _nft,
            _tokenId,
            listingId,
            _minPrice,
            endTime,
            block.timestamp
        );
        return listingId;
    }

    function bid(uint _listingId) external payable listingIdExists(_listingId) {
        Listing storage listing = listings[_listingId];
        require(msg.value >= listing.minPrice, "require min price");
        require(
            msg.value > listing.highestBid,
            "require value higer than the highestBid"
        );
        require(listing.endTime > block.timestamp, "auction ended");
        balances[listing.highestBider] += listing.highestBid;
        listing.highestBid = msg.value;
        listing.highestBider = msg.sender;

        emit Bid(msg.sender, _listingId, msg.value, block.timestamp);
    }

    function end(uint _listingId) external listingIdExists(_listingId) {
        Listing storage listing = listings[_listingId];
        require(listing.endTime <= block.timestamp);
        balances[listing.owner] = listing.highestBid;
        listing.nft.safeTransferFrom(
            address(this),
            listing.highestBider,
            listing.tokenId
        );
        delete listings[_listingId];
    }

    function withdrawFunds() external {
        require(balances[msg.sender] > 0, "balance 0");
        uint balance = balances[msg.sender];
        balances[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "transfer failed!");
    }

    function getListing(
        uint _listingId
    ) external view listingIdExists(_listingId) returns (Listing memory) {
        return listings[listingId];
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
