const hre = require("hardhat");

const VOTING_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

async function main() {
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.attach(VOTING_ADDRESS);

    console.log(`Checking voters at contract: ${VOTING_ADDRESS}`);

    try {
        const voterLength = await voting.getVoterLength();
        console.log(`Voter Count: ${voterLength}`);

        const voters = await voting.getVoterList();
        console.log("Voter List:", voters);

    } catch (error) {
        console.error("Error fetching voters:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
