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

        console.log(`[readExcel] Read ${data.length} rows from ${fileName}`);
        if (data.length > 0) console.log(`[readExcel] Keys found: ${Object.keys(data[0]).join(', ')}`);

        // Clean up the data to match expected frontend format
        return data.map(row => {
            // Find the LeetCode column regardless of exact casing or trailing spaces
            const keys = Object.keys(row);
            const leetcodeKey = keys.find(k => k.toLowerCase().replace(/\s+/g, '').includes('leetcode'));

            const rawLeetcode = leetcodeKey ? row[leetcodeKey] : null;
            let username = '';

            if (rawLeetcode) {
                const trimmed = rawLeetcode.toString().trim();

                if (trimmed.includes('leetcode.com')) {
                    // Extract from URL
                    const segments = trimmed.split('/').map(s => s.trim()).filter(Boolean);

                    // Look for segment after 'u' or 'user'
                    const uIndex = segments.findIndex(s => s.toLowerCase() === 'u' || s.toLowerCase() === 'user');
                    if (uIndex !== -1 && segments[uIndex + 1]) {
                        username = segments[uIndex + 1];
                    } else {
                        // If no /u/, take the last segment that isn't the domain
                        const cleanSegments = segments.filter(s => !s.includes('leetcode.com'));
                        if (cleanSegments.length > 0) {
                            username = cleanSegments[cleanSegments.length - 1];
                        }
                    }
                } else {
                    username = trimmed;
                }

                // Handle suffixes like " (2024)" or " - 123"
                if (username.includes(' - ')) username = username.split(' - ')[0].trim();
                if (username.includes(' ')) username = username.split(' ')[0].trim();

                // Special case for LeetCode's weird /0/ suffix in some copied links
                if (username === '0' || !isNaN(username)) {
                    const segments = trimmed.split('/').map(s => s.trim()).filter(Boolean);
                    const uIndex = segments.findIndex(s => s.toLowerCase() === 'u' || s.toLowerCase() === 'user');
                    if (uIndex !== -1 && segments[uIndex + 1]) {
                        username = segments[uIndex + 1];
                    } else if (segments.length >= 2) {
                        // Fallback to second to last segment if last is a number
                        const lastTwo = segments.slice(-2);
                        if (!lastTwo[0].includes('leetcode.com')) username = lastTwo[0];
                    }
                }
            }

            const nameKey = keys.find(k => k.toLowerCase().includes('name')) || Object.keys(row)[1];
            const studentName = nameKey ? row[nameKey] : 'Unknown';

            console.log(`[readExcel] ${fileName} -> Student: ${studentName} | Raw: ${rawLeetcode} | Parsed: ${username}`);

            return {
                _id: username || Math.random().toString(36).substring(2, 9),
                name: studentName,
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
