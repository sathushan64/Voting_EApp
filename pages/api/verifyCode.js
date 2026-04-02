import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'election.json');

export default function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { code } = req.body;
      
      if (!fs.existsSync(dataFilePath)) {
        return res.status(404).json({ valid: false, error: 'No active election found' });
      }

      const fileContent = fs.readFileSync(dataFilePath, 'utf8');
      const electionData = JSON.parse(fileContent);

      // Verify the code matches exactly (as strings)
      if (electionData.accessCode && electionData.accessCode.toString() === code.toString()) {
        return res.status(200).json({ valid: true, electionTitle: electionData.title });
      } else {
        return res.status(400).json({ valid: false, error: 'Invalid PIN Code' });
      }

    } catch (error) {
      console.error("Error verifying access code:", error);
      res.status(500).json({ valid: false, error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
