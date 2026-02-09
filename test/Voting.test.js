const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
  let Voting;
  let voting;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get the ContractFactory and Signers
    Voting = await ethers.getContractFactory("Voting");
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy contract with initial candidates
    const candidates = ["Alice", "Bob", "Charlie"];
    voting = await Voting.deploy(candidates);
  });

  describe("Deployment", function () {
    it("Should set the right candidates count", async function () {
      expect(await voting.candidatesCount()).to.equal(3);
    });

    it("Should initialize candidates correctly", async function () {
      const candidate1 = await voting.candidates(1);
      expect(candidate1.name).to.equal("Alice");
      expect(candidate1.voteCount).to.equal(0);
    });
  });

  describe("Voting", function () {
    it("Should allow a user to vote", async function () {
      await voting.connect(addr1).vote(1);
      expect(await voting.voters(addr1.address)).to.be.true;
      
      const candidate1 = await voting.candidates(1);
      expect(candidate1.voteCount).to.equal(1);
    });

    it("Should prevent double voting", async function () {
      await voting.connect(addr1).vote(1);
      await expect(voting.connect(addr1).vote(2))
        .to.be.revertedWith("You have already voted.");
    });

    it("Should prevent invalid candidate voting", async function () {
      await expect(voting.connect(addr1).vote(0))
        .to.be.revertedWith("Invalid candidate.");
      
      await expect(voting.connect(addr1).vote(4))
        .to.be.revertedWith("Invalid candidate.");
    });
  });
});