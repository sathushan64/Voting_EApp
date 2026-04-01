import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const dataFilePath = path.join(process.cwd(), 'data', 'users.json');

    // Make sure directory exists, though we created the file initially
    if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
        fs.mkdirSync(path.join(process.cwd(), 'data'));
    }
    
    // Ensure file exists
    if (!fs.existsSync(dataFilePath)) {
        fs.writeFileSync(dataFilePath, JSON.stringify([]));
    }

    const fileData = fs.readFileSync(dataFilePath);
    let users = [];
    try {
        users = JSON.parse(fileData);
    } catch(e) {
        users = [];
    }

    if (req.method === 'GET') {
        const { address } = req.query;
        // If no address specified, return ALL users (for Admin Dashboard)
        if (!address) {
            return res.status(200).json({ success: true, users });
        }
        
        const user = users.find(u => u.address.toLowerCase() === address.toLowerCase());
        if (user) {
            return res.status(200).json({ success: true, onboarded: true, user });
        } else {
            return res.status(200).json({ success: true, onboarded: false });
        }
    } 
    
    else if (req.method === 'POST') {
        const userData = req.body;

        if (!userData || !userData.address) {
            return res.status(400).json({ error: "Invalid data or missing address" });
        }

        // Overwrite if same address exists, else append
        const existingIndex = users.findIndex(u => u.address.toLowerCase() === userData.address.toLowerCase());
        
        const completeUser = {
            ...userData,
            registeredAt: new Date().toISOString()
        };

        if (existingIndex > -1) {
            users[existingIndex] = completeUser;
        } else {
            users.push(completeUser);
        }

        fs.writeFileSync(dataFilePath, JSON.stringify(users, null, 2));

        return res.status(200).json({ success: true, message: "User registered successfully", user: completeUser });
    } 
    
    else {
        return res.status(405).json({ error: "Method not allowed" });
    }
}
