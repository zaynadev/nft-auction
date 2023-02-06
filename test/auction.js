const { expect } = require("chai");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("Auction", () => {
  let auction, nft1, nft2;
  let owner, addr1, addr2, addr3, addr4;
  let tokenId1_1, tokenId1_2, tokenId2_1, tokenId2_2;
  before(async () => {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const Auction = await ethers.getContractFactory("Auction");
    auction = await Auction.deploy();
    const NFT1 = await ethers.getContractFactory("NFT1");
    nft1 = await NFT1.deploy();
    const NFT2 = await ethers.getContractFactory("NFT2");
    nft2 = await NFT2.deploy();

    // tokenId1_1 = tokenId1_2 = await nft1._minToken(addr2.address, "");
    // tokenId2_1 = (await nft2._minToken(addr1.address, "")).value.toString();
    // tokenId2_2 = (await nft2._minToken(addr2.address, "")).value.toString();
  });

  describe("Mint tokens for NFT1", () => {
    it("should mint token 1", async () => {
      await nft1._minToken(addr1.address, "");
      const tokenOwner = await nft1.ownerOf(1);
      expect(tokenOwner).to.equal(addr1.address);
    });
    it("should mint token 2", async () => {
      await nft1._minToken(addr2.address, "");
      const tokenOwner = await nft1.ownerOf(2);
      expect(tokenOwner).to.equal(addr2.address);
    });
    it("should approve token 1 for auction contract", async () => {
      await nft1.connect(addr1).approve(auction.address, 1);
      const approved = await nft1.getApproved(1);
      expect(approved).to.equal(auction.address);
    });
  });

  describe("Mint tokens for NFT2", () => {
    it("should mint token 1", async () => {
      await nft2._minToken(addr1.address, "");
      const tokenOwner = await nft2.ownerOf(1);
      expect(tokenOwner).to.equal(addr1.address);
    });
    it("should mint token 2", async () => {
      await nft2._minToken(addr2.address, "");
      const tokenOwner = await nft2.ownerOf(2);
      expect(tokenOwner).to.equal(addr2.address);
    });
    it("should approve token 1 for auction contract", async () => {
      await nft2.connect(addr1).approve(auction.address, 1);
      const approved = await nft2.getApproved(1);
      expect(approved).to.equal(auction.address);
    });
    it("should approve token 2 for auction contract", async () => {
      await nft2.connect(addr2).approve(auction.address, 2);
      const approved = await nft2.getApproved(2);
      expect(approved).to.equal(auction.address);
    });
  });

  describe("Listing", () => {
    it("cannot create listing for non owner of token", async () => {
      await expect(auction.list(nft1.address, 1, 1000, 2)).to.be.revertedWith(
        "You are not the owner of this token!"
      );
    });
    it("cannot create listing for non approved of token", async () => {
      await expect(auction.connect(addr2).list(nft1.address, 2, 1000, 2)).to.be.revertedWith(
        "Token id need approval"
      );
    });
    it("should list nft1 token 1", async () => {
      await auction.connect(addr1).list(nft1.address, 1, 1000, 2);
      const listing = await auction.getListing(1);
      expect(listing["nft"]).to.equal(nft1.address);
      expect(listing["tokenId"]).to.equal(1);
      expect(listing["owner"]).to.equal(addr1.address);
    });
    it("should list nft2 token 2", async () => {
      await auction.connect(addr2).list(nft2.address, 2, 1000, 2);
      const listing = await auction.getListing(2);

      expect(listing["nft"]).to.equal(nft2.address);
      expect(listing["tokenId"]).to.equal(2);
      expect(listing["owner"]).to.equal(addr2.address);
    });
  });

  describe("Bid", () => {
    it("cannot bid, require min price", async () => {
      await expect(auction.bid(1, { value: 10 })).to.be.revertedWith("require min price");
    });
    it("cannot bid, listing id  does not exist", async () => {
      await expect(auction.bid(10, { value: 10 })).to.be.revertedWith("listing does not exist");
    });

    it("owner can bid", async () => {
      await time.latest();
      await auction.bid(1, { value: 1002 });
      const listing = await auction.getListing(1);
      await expect(listing["highestBid"]).to.equal(1002);
      await expect(listing["highestBider"]).to.equal(owner.address);
    });

    it("address 2 cannot bid, request highest amount than the last bider", async () => {
      await time.latest();
      await expect(auction.connect(addr2).bid(1, { value: 1001 })).to.revertedWith(
        "require value higher than the highestBid"
      );
    });

    it("cannot bid, auction ended", async () => {
      await time.increase(2 * 60 * 60);
      //   await ethers.provider.send("evm_mine", [(await time.latest()) + 2 * 60 * 60]);
      await expect(auction.bid(1, { value: 1003 })).to.be.revertedWith("auction ended");
    });
  });

  describe("End auction", () => {
    it("should transfer token to highest bider", async () => {
      await expect(auction.end(1)).to.changeTokenBalances(
        nft1,
        [auction.address, owner.address],
        [-1, 1]
      );
    });
  });

  describe("WithdrawFunds", () => {
    it("should withdraw funds", async () => {
      await expect(auction.connect(addr1).withdrawFunds()).to.changeEtherBalances(
        [auction.address, addr1.address],
        [-1002, 1002]
      );
    });
  });
});
