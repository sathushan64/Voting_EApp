import hre from "hardhat";
import fs from "fs";
const VOTING_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Updated to current address

async function main() {
    const votingDTO = JSON.parse(fs.readFileSync(new URL("../artifacts/contracts/Voting.sol/Voting.json", import.meta.url)));
    const Voting = await hre.ethers.getContractFactory("Voting"); // Must be string name
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
