const hre = require("hardhat");
const fs = require('fs');

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    // Send a dummy transaction to self to increase nonce
    // This changes the resulting contract address to avoid the "0x5Fb..." flag
    const tx = await deployer.sendTransaction({
        to: deployer.address,
        value: 0
    });
    await tx.wait();

    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.deploy();

    await voting.deployed();

    console.log("Voting contract deployed to:", voting.address);
    fs.writeFileSync('deployed_address.txt', voting.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
