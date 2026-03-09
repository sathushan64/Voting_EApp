const hre = require("hardhat");

async function main() {
    const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const balance = await hre.ethers.provider.getBalance(address);
    console.log(`Balance of ${address}: ${hre.ethers.utils.formatEther(balance)} ETH`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
