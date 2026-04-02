import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'election.json');

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      if (fs.existsSync(dataFilePath)) {
        const fileContent = fs.readFileSync(dataFilePath, 'utf8');
        res.status(200).json(JSON.parse(fileContent));
      } else {
        res.status(200).json({ title: "", date: "", startTime: "", endTime: "", rules: "" });
      }
    } catch (error) {
      console.error("Error reading election data:", error);
      res.status(500).json({ error: 'Failed to read election data' });
    }
  } else if (req.method === 'POST') {
    try {
      const { title, date, startTime, endTime, rules, accessCode } = req.body;
      const data = { title, date, startTime, endTime, rules, accessCode };
      
      fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
      res.status(200).json({ message: 'Election data saved successfully' });
    } catch (error) {
      console.error("Error saving election data:", error);
      res.status(500).json({ error: 'Failed to save election data' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
