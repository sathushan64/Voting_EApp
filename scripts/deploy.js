const hre = require("hardhat");
const fs = require('fs');

async function main() {
    const [deployer] = await hre.ethers.getSigners();

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

    // Automatically update the frontend constants.js file
    const constantsPath = './context/constants.js';
    if (fs.existsSync(constantsPath)) {
        let constants = fs.readFileSync(constantsPath, 'utf8');
        constants = constants.replace(
            /(export const VotingAddress = ")[^"]*(";)/,
            `$1${voting.address}$2`
        );
        fs.writeFileSync(constantsPath, constants);
        console.log("Automatically updated context/constants.js with new address.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
