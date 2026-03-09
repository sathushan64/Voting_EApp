import hre from "hardhat";
import fs from 'fs';
const VOTING_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const votingDTO = JSON.parse(fs.readFileSync(new URL("../artifacts/contracts/Voting.sol/Voting.json", import.meta.url)));
async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.attach(VOTING_ADDRESS);

    console.log(`Interacting with contract at: ${VOTING_ADDRESS}`);

    // Add a Candidate with a VALID Image URL
    console.log("Adding a new candidate with a valid image...");
    try {
        // Using a random portrait from Unsplash
        const validImageUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80";

        const tx = await voting.setCandidate(
            "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Using the second hardhat account as candidate
            "25",
            "John Doe (Valid Image)",
            validImageUrl,
            "https://example.com/ipfs-hash"
        );
        await tx.wait();
        console.log("Candidate 'John Doe' added successfully with valid image!");
    } catch (error) {
        console.log("Error adding candidate:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
