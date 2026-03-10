import connectDB, { sequelize } from './config/db.js';
import Student from './models/Student.js';
import readExcel from './readExcel.js';
import { fetchLeetCodeStats } from './services/leetcodeService.js';

const runImport = async () => {
    await connectDB();
    await sequelize.authenticate();

    console.log('Processing Mentor 4 (3).xlsx...');
    const students = readExcel('Mentor 4 (3).xlsx');

    let imported = 0;
    let failed = 0;

    for (const s of students) {
        if (!s.leetcodeUsername) continue;

        try {
            const existing = await Student.findOne({ where: { leetcodeUsername: s.leetcodeUsername } });
            if (existing) {
                if (existing.mentorEmail !== 'mentor4@admin.com') {
                    existing.mentorEmail = 'mentor4@admin.com';
                    await existing.save();
                    console.log(`Updated existing student ${s.leetcodeUsername} with mentor4 email`);
                } else {
                    console.log(`Student ${s.leetcodeUsername} already mapped to Mentor 4.`);
                }
                continue;
            }

            const stats = await fetchLeetCodeStats(s.leetcodeUsername);
            const totalSolved = stats ? stats.totalSolved : 0;

            await Student.create({
                name: s.name,
                email: `${s.leetcodeUsername}@placeholder.com`,
                mentorEmail: 'mentor4@admin.com',
                leetcodeUrl: s.leetcodeUrl.startsWith('http') ? s.leetcodeUrl : `https://leetcode.com/u/${s.leetcodeUsername}/`,
                leetcodeUsername: s.leetcodeUsername,
                batch: s.batch,
                totalSolved,
                easySolved: stats ? stats.easySolved : 0,
                mediumSolved: stats ? stats.mediumSolved : 0,
                hardSolved: stats ? stats.hardSolved : 0,
                dailyStats: [{
                    date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
                    solved: 0
                }]
            });
            console.log(`Imported newly found student: ${s.leetcodeUsername}`);
            imported++;
        } catch (error) {
            console.error(`Failed to import ${s.leetcodeUsername}:`, error.message);
            failed++;
        }
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`Import complete! Imported: ${imported}, Failed: ${failed}`);
    process.exit(0);
};

runImport();
