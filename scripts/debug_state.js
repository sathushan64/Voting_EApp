const hre = require("hardhat");
const VotingAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";


async function main() {
    console.log("Checking contract at:", VotingAddress);
    const code = await hre.ethers.provider.getCode(VotingAddress);

    if (code === "0x") {
        console.log("ERROR: No contract found at this address!");
        console.log("The Hardhat Node might have been restarted.");
        return;
    }

    console.log("Contract exists! Fetching data...");
    const Voting = await hre.ethers.getContractFactory("Voting");
    const contract = Voting.attach(VotingAddress);

    const candidates = await contract.getCandidate();
    console.log("Current Candidates:", candidates);

    if (candidates.length === 0) {
        console.log("Attempting to register a test candidate...");
        const [signer] = await hre.ethers.getSigners();

        try {
            const tx = await contract.connect(signer).setCandidate(
                signer.address,
                "25",
                "Test Candidate",
                "http://image.url",
                "http://ipfs.url"
            );
            console.log("Transaction sent:", tx.hash);
            await tx.wait();
            console.log("Candidate Registered Successfully!");
        } catch (error) {
            console.error("Registration FAILED:", error.message);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
