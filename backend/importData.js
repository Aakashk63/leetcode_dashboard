import * as xlsx from 'xlsx';
import fs from 'fs';
import { extractUsername, fetchLeetCodeStats } from './services/leetcodeService.js';
import connectDB, { sequelize } from './config/db.js';
import Student from './models/Student.js';

const runImport = async () => {
    // 1. Connect to DB
    await connectDB();

    const files = [
        { path: '../Mentor 1.xlsx', email: 'mentor1@admin.com' },
        { path: '../Mentor 2.xlsx', email: 'mentor2@admin.com' },
        { path: '../Leetcode Platform .xlsx', email: 'mentor3@admin.com' },
        { path: '../mentor4.xlsx', email: 'mentor4@admin.com' }
    ];

    let imported = 0;
    let failed = 0;

    for (const fileObj of files) {
        if (!fs.existsSync(fileObj.path)) {
            console.log(`File ${fileObj.path} does not exist, skipping...`);
            continue;
        }

        console.log(`Processing ${fileObj.path}...`);

        const workbook = xlsx.read(fs.readFileSync(fileObj.path));
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        console.log(`Found ${data.length} records in ${fileObj.path}.`);

        for (const row of data) {
            try {
                const name = row['Name of the Mentee'] || row['Name'];
                const batch = row['Year'] || row['Mentor'] || row['Mentor 4'] || 'Unknown Batch';
                const rawLeetcode = row['Leetcode ID '] || row['Leetcode Url'] || row['Leetcode URL'] || row['Leetcode url'];

                if (!name || !rawLeetcode) {
                    continue;
                }

                // Extract username
                let username = extractUsername(rawLeetcode) || rawLeetcode.split('/').pop().trim();
                if (username.includes(' - ')) {
                    username = username.split(' - ')[0].trim();
                }

                // Check if already exists
                const existing = await Student.findOne({ where: { leetcodeUsername: username } });
                if (existing) {
                    if (existing.mentorEmail !== fileObj.email) {
                        existing.mentorEmail = fileObj.email;
                        await existing.save();
                        console.log(`Student ${username} updated with mentor email ${fileObj.email}`);
                    } else {
                        console.log(`Student ${username} already exists and mapped correctly, skipping...`);
                    }
                    continue;
                }

                // Initial fetch to get baseline
                const stats = await fetchLeetCodeStats(username);
                const totalSolved = stats ? stats.totalSolved : 0;

                await Student.create({
                    name,
                    email: `${username}@placeholder.com`, // fake email
                    mentorEmail: fileObj.email,
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
