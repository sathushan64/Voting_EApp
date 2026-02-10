const hre = require("hardhat");

const VOTING_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

async function main() {
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.attach(VOTING_ADDRESS);

    console.log(`Checking candidates at contract: ${VOTING_ADDRESS}`);

    try {
        const candidateLength = await voting.getCandidateLength();
        console.log(`Candidate Count: ${candidateLength}`);

        const candidates = await voting.getCandidate();
        console.log("Candidate List:", candidates);

    } catch (error) {
        console.error("Error fetching candidates:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
