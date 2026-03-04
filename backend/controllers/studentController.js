import Student from '../models/Student.js';
import { fetchLeetCodeStats, extractUsername, fetchRecentAcSubmissions } from '../services/leetcodeService.js';
import * as xlsx from 'xlsx';
import fs from 'fs';


// Get all students for leaderboard
export const getLeaderboard = async (req, res) => {
    try {
        const { role, sheet } = req.user;
        let whereClause = {};

        if (role === 'mentor') {
            whereClause = {
                mentorEmail: req.user.email
            };
        }

        let students = await Student.find(whereClause).sort({ totalSolved: -1 }).lean();

        // Optional Super Admin feature: transparently append Mentor name to the existing 'batch' column
        if (role === 'super_admin') {
            const mentorMap = {
                'mentor1@admin.com': 'Mentor 1',
                'mentor2@admin.com': 'Mentor 2',
                'mentor3@admin.com': 'Mentor 3',
                'mentor4@admin.com': 'Mentor 4'
            };

            students = students.map(s => {
                const assignedMentor = mentorMap[s.mentorEmail];
                if (assignedMentor) {
                    s.batch = `${s.batch} (${assignedMentor})`;
                }
                return s;
            });
        }

        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add new student
export const addStudent = async (req, res) => {
    try {
        const { name, email, leetcodeUrl, batch } = req.body;
        const username = extractUsername(leetcodeUrl) || leetcodeUrl.split('/').pop();

        // Initial fetch to get baseline
        const stats = await fetchLeetCodeStats(username);
        const totalSolved = stats ? stats.totalSolved : 0;

        const student = await Student.create({
            name,
            email,
            leetcodeUrl,
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

        res.status(201).json(student);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add student. Ensure email/username are unique.' });
    }
};

// Get single student details
export const getStudent = async (req, res) => {
    try {
        const studentObj = await Student.findById(req.params.id).lean();
        if (!studentObj) return res.status(404).json({ error: 'Student not found' });

        const recentSubmissions = await fetchRecentAcSubmissions(studentObj.leetcodeUsername);

        let last7Days = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            last7Days.push(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
        }

        const distinctSolvedPerDay = {};
        last7Days.forEach(dateStr => {
            distinctSolvedPerDay[dateStr] = new Set();
        });

        recentSubmissions.forEach(sub => {
            const dateStr = new Date(parseInt(sub.timestamp) * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
            if (distinctSolvedPerDay[dateStr]) {
                distinctSolvedPerDay[dateStr].add(sub.title);
            }
        });

        studentObj.recentActivityDetailed = last7Days.map(dateStr => ({
            date: dateStr,
            solved: distinctSolvedPerDay[dateStr].size,
            solvedProblems: Array.from(distinctSolvedPerDay[dateStr])
        })).reverse();

        res.json(studentObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a student
export const deleteStudent = async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.json({ message: 'Student deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Internal logic for updating all students
export const updateAllStudents = async () => {
    const students = await Student.find();
    let updated = 0;

    for (const student of students) {
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
            student.dailyStats.forEach(d => {
                dailyStatsMap.set(d.date, d.solved);
            });

            for (const [date, solvedSet] of Object.entries(distinctSolvedPerDay)) {
                dailyStatsMap.set(date, solvedSet.size);
            }

            student.dailyStats = Array.from(dailyStatsMap, ([date, solved]) => ({ date, solved }));
            student.dailyStats.sort((a, b) => new Date(a.date) - new Date(b.date));

            student.totalSolved = stats.totalSolved;
            student.easySolved = stats.easySolved;
            student.mediumSolved = stats.mediumSolved;
            student.hardSolved = stats.hardSolved;
            student.lastUpdated = Date.now();
            await student.save();
            updated++;
        }
        // Delay to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));
    }
    return updated;
};

// Update all students manually (admin feature)
export const triggerUpdate = async (req, res) => {
    try {
        const updated = await updateAllStudents();

        res.json({ message: `Updated ${updated} students.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
