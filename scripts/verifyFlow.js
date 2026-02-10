const hre = require("hardhat");

const VOTING_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.attach(VOTING_ADDRESS);

    console.log(`Interacting with contract at: ${VOTING_ADDRESS}`);

    // 1. Add a Candidate
    console.log("Adding a new candidate...");
    try {
        const tx = await voting.setCandidate(
            deployer.address, // Use deployer address as candidate address for test
            "30",
            "Test Candidate",
            "https://example.com/image.png",
            "https://example.com/ipfs-hash"
        );
        await tx.wait();
        console.log("Candidate added successfully!");
    } catch (error) {
        console.log("Error adding candidate (might already exist):", error.message);
    }

    // 2. Fetch Candidates
    console.log("Fetching candidates...");
    const candidates = await voting.getCandidate();
    console.log("Candidate Count:", candidates.length);

    if (candidates.length > 0) {
        const data = await voting.getCandidateData(candidates[0]);
        console.log("First Candidate Name:", data[1]); // Index 1 is name
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
