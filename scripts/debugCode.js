// debugCode.js
const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
    const address = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
    const code = await provider.getCode(address);
    console.log("Code is:", code);
}
main().catch(console.error);
