const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    // REPLACE THIS WITH YOUR METAMASK ADDRESS
    const userAddress = "0x258A0471c9081fCB4D9860f57F5bE2fFcCc8E4c7";

    console.log("Sending ETH to:", userAddress);

    const tx = await deployer.sendTransaction({
        to: userAddress,
        value: hre.ethers.utils.parseEther("100.0") // Send 100 Fake ETH
    });

    await tx.wait();
    console.log("Transferred 100 ETH successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
