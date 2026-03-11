import cron from 'node-cron';
import Student from '../models/Student.js';
import { fetchLeetCodeStats, fetchRecentAcSubmissions } from '../services/leetcodeService.js';

export const setupCronJobs = () => {
    // Run every day at MN (midnight)
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Starting daily update...');
        try {
            const students = await Student.findAll();
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

            for (const student of students) {
                console.log(`[CRON] Processing ${student.leetcodeUsername}...`);
                const stats = await fetchLeetCodeStats(student.leetcodeUsername);
                const recentSubmissions = await fetchRecentAcSubmissions(student.leetcodeUsername);

                if (stats && recentSubmissions) {
                    const distinctSolvedPerDay = {};

                    recentSubmissions.forEach(sub => {
                        const dateStr = new Date(parseInt(sub.timestamp) * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
                        if (!distinctSolvedPerDay[dateStr]) {
                            distinctSolvedPerDay[dateStr] = new Set();
                        }
                        distinctSolvedPerDay[dateStr].add(sub.title);
                    });

                    const dailyStatsMap = new Map();
                    if (student.dailyStats && Array.isArray(student.dailyStats)) {
                        student.dailyStats.forEach(d => {
                            dailyStatsMap.set(d.date, d.solved);
                        });
                    }

                    for (const [date, solvedSet] of Object.entries(distinctSolvedPerDay)) {
                        dailyStatsMap.set(date, solvedSet.size);
                    }

                    const newDailyStats = Array.from(dailyStatsMap, ([date, solved]) => ({ date, solved }));
                    newDailyStats.sort((a, b) => a.date.localeCompare(b.date));

                    student.dailyStats = newDailyStats;
                    student.totalSolved = stats.totalSolved;
                    student.easySolved = stats.easySolved;
                    student.mediumSolved = stats.mediumSolved;
                    student.hardSolved = stats.hardSolved;
                    student.lastUpdated = Date.now();

                    student.changed('dailyStats', true);
                    await student.save();
                    console.log(`[CRON] Updated ${student.leetcodeUsername}`);
                }
                // Wait 2 secs per student to avoid rate-limiting
                await new Promise(r => setTimeout(r, 2000));
            }

            console.log('[CRON] Daily update completed successfully.');
        } catch (error) {
            console.error('[CRON] Error during daily update:', error.message);
        }
    });
};
