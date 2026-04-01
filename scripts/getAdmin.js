const hre = require("hardhat");

const VOTING_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

async function main() {
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.attach(VOTING_ADDRESS);

    try {
        const o = await voting.votingOrganizer();
        console.log("Current Admin Address is: " + o);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

main().catch(console.error);
