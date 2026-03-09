require("dotenv").config();

async function main() {
    console.log("--- DEBUGGING .ENV CONTENT ---");

    const apiKey = process.env.API_URL;
    const privateKey = process.env.PRIVATE_KEY;

    // Check API_URL
    if (!apiKey) {
        console.error("DEBUG: API_URL is undefined or empty.");
    } else {
        console.log(`DEBUG: API_URL found. Length: ${apiKey.length}`);
        console.log(`DEBUG: API_URL starts with: ${apiKey.substring(0, 10)}...`);
    }

    // Check PRIVATE_KEY
    if (!privateKey) {
        console.error("DEBUG: PRIVATE_KEY is undefined or empty.");
    } else {
        console.log(`DEBUG: PRIVATE_KEY found. Length: ${privateKey.length}`);
        // Show first 4 and last 4 chars for verification, hide the rest
        if (privateKey.length > 8) {
            console.log(`DEBUG: PRIVATE_KEY starts with: ${privateKey.substring(0, 4)}...`);
            console.log(`DEBUG: PRIVATE_KEY ends with: ...${privateKey.substring(privateKey.length - 4)}`);
        } else {
            console.log(`DEBUG: PRIVATE_KEY is too short to be valid.`);
        }

        // Specific checks for placeholders
        if (privateKey.includes("YOUR_METAMASK_PRIVATE_KEY")) {
            console.error("DEBUG FAILURE: Contains 'YOUR_METAMASK_PRIVATE_KEY'");
            process.exit(1);
        }
        if (privateKey.includes("YOUR_key_goes_here")) {
            console.error("DEBUG FAILURE: Contains 'YOUR_key_goes_here'");
            process.exit(1);
        }
    }

    console.log("--- CHECK COMPLETE ---");
    // If we got here, it's technically valid format-wise (no placeholders)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
