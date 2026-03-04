import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function readExcel(fileName) {
    try {
        // Look for file in the parent directory (root)
        const filePath = path.join(__dirname, '..', fileName);

        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return [];
        }

        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        // Clean up the data to match expected frontend format
        return data.map(row => {
            const rawLeetcode = row['Leetcode ID '] || row['Leetcode Url'] || row['Leetcode URL'] || row['Leetcode url'];
            let username = '';
            if (rawLeetcode) {
                username = rawLeetcode.split('/').pop().trim();
                if (username.includes(' - ')) username = username.split(' - ')[0].trim();
            }

            return {
                _id: username || Math.random().toString(36).substr(2, 9),
                name: row['Name of the Mentee'] || row['Name'] || 'Unknown',
                leetcodeUsername: username,
                batch: row['Year'] || row['Mentor'] || row['Mentor 4'] || 'Default',
                totalSolved: row['Total Solved'] || 0,
                leetcodeUrl: rawLeetcode || '',
                dailyStats: [] // Technical requirement for frontend rendering
            };
        });
    } catch (error) {
        console.error('Error reading Excel:', error);
        return [];
    }
}

export default readExcel;
