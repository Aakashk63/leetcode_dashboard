import mongoose from 'mongoose';
import xlsx from 'xlsx';
import dotenv from 'dotenv';
import Student from '../models/Student.js';
import { fetchLeetCodeStats, extractUsername as baseExtractUsername } from '../services/leetcodeService.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const extractUsername = (rawData) => {
    if (!rawData) return null;
    const str = String(rawData).trim();

    if (str.includes('leetcode.com')) {
        // try to match url format
        const match = str.match(/leetcode\.com\/(?:u\/)?([^\/]+)/);
        if (match) return match[1];
    }

    // Clean up " - LeetCode Profile"
    const cleanStr = str.replace(/ - LeetCode Profile/i, '').trim();
    // Assume it's just the username if it doesn't contain spaces

    return cleanStr;
};

const importData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leetcode-leaderboard');
        console.log('MongoDB connected.');

        const workbook = xlsx.readFile('d:\\Leetcode Platfor m\\Leetcode Platform .xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // try to extract hyperlinks as well, sometimes xlsx handles them via w or h properties, but let's stick to text for now
        const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

        console.log(`Found ${data.length} rows to import.`);

        let imported = 0;
        const today = new Date().toISOString().split('T')[0];

        for (const row of data) {
            const name = row['Name of the Mentee'] || 'Unknown';
            const year = row['Year'] || 'Unknown Batch';
            let rawLeetcodeId = row['Leetcode ID '];

            if (!rawLeetcodeId) {
                console.log(`Skipping row for ${name}, no Leetcode ID.`);
                continue;
            }

            const username = extractUsername(rawLeetcodeId);

            if (!username) {
                console.log(`Could not parse username from ${rawLeetcodeId} for ${name}`);
                continue;
            }

            try {
                const existing = await Student.findOne({ leetcodeUsername: username });
                if (existing) {
                    console.log(`User ${username} already exists. Skipping...`);
                    continue;
                }

                console.log(`Fetching stats for ${username}...`);
                const stats = await fetchLeetCodeStats(username);

                let total = 0, easy = 0, medium = 0, hard = 0;
                if (stats) {
                    total = stats.totalSolved;
                    easy = stats.easySolved;
                    medium = stats.mediumSolved;
                    hard = stats.hardSolved;
                } else {
                    console.log(`Warning: Stats could not be fetched for ${username}. Profile might be private/invalid.`);
                }

                const student = new Student({
                    name: name,
                    email: `${username.toLowerCase()}@leetcode.local`, // auto-generated
                    leetcodeUrl: strStartsWithHttp(rawLeetcodeId) ? rawLeetcodeId : `https://leetcode.com/${username}/`,
                    leetcodeUsername: username,
                    batch: year,
                    totalSolved: total,
                    easySolved: easy,
                    mediumSolved: medium,
                    hardSolved: hard,
                    dailyStats: [{
                        date: today,
                        solved: 0 // Baseline
                    }]
                });

                await student.save();
                imported++;
                console.log(`Successfully imported ${name} (${username}). Overall Solved: ${total}`);

                // Wait 1 sec to avoid Leetcode rate limits
                await new Promise(r => setTimeout(r, 1000));

            } catch (err) {
                console.error(`Error saving ${username}:`, err.message);
            }
        }

        console.log(`Import completed. Total imported: ${imported}`);
        process.exit(0);
    } catch (error) {
        console.error('Import error:', error);
        process.exit(1);
    }
};

function strStartsWithHttp(str) {
    return String(str).startsWith('http');
}

importData();
