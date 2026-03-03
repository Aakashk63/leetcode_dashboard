import * as xlsx from 'xlsx';
import fs from 'fs';
import { extractUsername, fetchLeetCodeStats } from './services/leetcodeService.js';
import connectDB, { sequelize } from './config/db.js';
import Student from './models/Student.js';

const runImport = async () => {
    // 1. Connect to DB
    await connectDB();

    const files = [
        '../Mentor 1.xlsx',
        '../Mentor 2.xlsx',
        '../Leetcode Platform .xlsx'
    ];

    let imported = 0;
    let failed = 0;

    for (const file of files) {
        if (!fs.existsSync(file)) {
            console.log(`File ${file} does not exist, skipping...`);
            continue;
        }

        console.log(`Processing ${file}...`);

        const workbook = xlsx.read(fs.readFileSync(file));
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        console.log(`Found ${data.length} records in ${file}.`);

        for (const row of data) {
            try {
                const name = row['Name of the Mentee'];
                const batch = row['Year'] || row['Mentor'] || 'Unknown Batch';
                const rawLeetcode = row['Leetcode ID '] || row['Leetcode Url'] || row['Leetcode URL'];

                if (!name || !rawLeetcode) {
                    // console.log('Skipping invalid row (missing name or url):', row);
                    continue;
                }

                // Extract username
                let username = extractUsername(rawLeetcode) || rawLeetcode.split('/').pop().trim();
                // Handle cases like "Gukan_M11 - LeetCode Profile"
                if (username.includes(' - ')) {
                    username = username.split(' - ')[0].trim();
                }

                // Check if already exists
                const existing = await Student.findOne({ where: { leetcodeUsername: username } });
                if (existing) {
                    console.log(`Student ${username} already exists, skipping...`);
                    continue;
                }

                // Initial fetch to get baseline
                const stats = await fetchLeetCodeStats(username);
                const totalSolved = stats ? stats.totalSolved : 0;

                await Student.create({
                    name,
                    email: `${username}@placeholder.com`, // fake email
                    leetcodeUrl: rawLeetcode.startsWith('http') ? rawLeetcode : `https://leetcode.com/u/${username}/`,
                    leetcodeUsername: username,
                    batch,
                    totalSolved,
                    easySolved: stats ? stats.easySolved : 0,
                    mediumSolved: stats ? stats.mediumSolved : 0,
                    hardSolved: stats ? stats.hardSolved : 0,
                    dailyStats: [{
                        date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
                        solved: 0 // Base day
                    }]
                });
                console.log(`Imported ${username}`);
                imported++;
            } catch (error) {
                console.error(`Failed to import row:`, error.message);
                failed++;
            }

            // delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.log(`Import complete! Total Imported: ${imported}, Failed: ${failed}`);
    process.exit(0);
};

runImport();
