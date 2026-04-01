import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const otpFilePath = path.join(process.cwd(), 'data', 'otp.json');

    // Make sure directory exists
    if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
        fs.mkdirSync(path.join(process.cwd(), 'data'));
    }
    
    // Ensure file exists
    if (!fs.existsSync(otpFilePath)) {
        fs.writeFileSync(otpFilePath, JSON.stringify({}));
    }

    const fileData = fs.readFileSync(otpFilePath);
    let otps = {};
    try {
        otps = JSON.parse(fileData);
    } catch(e) {
        otps = {};
    }

    const { action, target, code } = req.body || {};

    console.log("DEBUG: Incoming OTP API Request:", { action, target, code });

    if (!target) {
        console.log("DEBUG: Error - Missing target", req.body);
        return res.status(400).json({ error: "Target (email or phone) is required." });
    }

    if (action === 'send') {
        // Generate a 6 digit mock code
        const secureCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Cache it securely targeting this specific phone/email
        otps[target] = {
            code: secureCode,
            expires: Date.now() + 5 * 60 * 1000 // 5 minutes 
        };
        
        fs.writeFileSync(otpFilePath, JSON.stringify(otps, null, 2));

        // For development, print it to the terminal screen prominently
        console.log(`\n======================================`);
        console.log(`✉️ SENSITIVE MOCK OTP DISPATCHED!`);
        console.log(`Target: ${target}`);
        console.log(`Your Verification Code is: ${secureCode}`);
        console.log(`======================================\n`);

        return res.status(200).json({ 
            success: true, 
            message: "OTP Generated.",
            code: secureCode // EXPOSE TO FRONTEND FOR DEV MODE TESTING!
        });
    }
    
    if (action === 'verify') {
        if (!code) {
             return res.status(400).json({ error: "OTP code is required." });
        }

        const storedOtp = otps[target];

        if (!storedOtp) {
            return res.status(400).json({ error: "No OTP was requested for this address/number." });
        }

        if (Date.now() > storedOtp.expires) {
            delete otps[target];
            fs.writeFileSync(otpFilePath, JSON.stringify(otps, null, 2));
            return res.status(400).json({ error: "OTP has expired. Request a new one." });
        }

        if (storedOtp.code === code.trim()) {
            // Securely clean up the verified code
            delete otps[target];
            fs.writeFileSync(otpFilePath, JSON.stringify(otps, null, 2));
            return res.status(200).json({ success: true, message: "Target validated securely!" });
        } else {
            return res.status(400).json({ error: "Invalid OTP code. Please try again." });
        }
    }

    return res.status(400).json({ error: "Invalid action." });
}
