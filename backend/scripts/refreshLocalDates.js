import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../models/Student.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const updateLocalTarget = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leetcode-leaderboard');
        const students = await Student.find({});
        console.log(`Checking ${students.length} students...`);

        const getLocalYYYYMMDD = () => {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        const localDate = getLocalYYYYMMDD();

        let fixed = 0;
        for (const student of students) {
            let changed = false;

            // Re-map UTC dates to local dates
            student.dailyStats = student.dailyStats.map(stat => {
                if (stat.date.includes('T')) stat.date = stat.date.split('T')[0];
                return stat;
            });

            // Check if there is an array for old UTC vs new Local date today
            const utcToday = new Date().toISOString().split('T')[0];

            if (utcToday !== localDate) {
                const utcIndex = student.dailyStats.findIndex(d => d.date === utcToday);
                const localIndex = student.dailyStats.findIndex(d => d.date === localDate);

                if (utcIndex > -1 && localIndex === -1) {
                    student.dailyStats[utcIndex].date = localDate;
                    changed = true;
                }
            }

            if (student.dailyStats.length > 0 && student.dailyStats[student.dailyStats.length - 1].date !== localDate) {
                student.dailyStats[student.dailyStats.length - 1].date = localDate;
                changed = true;
            }

            if (changed) {
                await student.save();
                fixed++;
            }
        }
        console.log(`Fixed dates for ${fixed} students.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateLocalTarget();
