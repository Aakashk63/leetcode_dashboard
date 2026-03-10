import Student from '../models/Student.js';
import { fetchLeetCodeStats, extractUsername, fetchRecentAcSubmissions, getDailySolved } from '../services/leetcodeService.js';
import * as xlsx from 'xlsx';
import fs from 'fs';
import { Op } from 'sequelize';

import readExcel from '../readExcel.js';

// Get all students for leaderboard
export const getLeaderboard = async (req, res) => {
    try {
        const { email, role, sheet: fileName } = req.user;
        console.log(`[Leaderboard] Request from ${email} (Role: ${role})`);

        if (role === 'super_admin') {
            const students = await Student.findAll({ order: [['totalSolved', 'DESC']] });
            return res.json(students);
        }

        if (!fileName) return res.status(404).json({ error: 'No roster found.' });

        const roster = readExcel(fileName);

        const usernames = roster.map(s => s.leetcodeUsername).filter(Boolean);
        const dbStudents = await Student.findAll({
            where: { leetcodeUsername: { [Op.in]: usernames } }
        });

        const currentDay = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        const leaderboard = roster.map(student => {
            if (!student.leetcodeUsername) return student;

            const dbRef = dbStudents.find(db => db.leetcodeUsername === student.leetcodeUsername);
            if (dbRef) {
                const todayStat = dbRef.dailyStats && Array.isArray(dbRef.dailyStats)
                    ? dbRef.dailyStats.find(d => d.date === currentDay)
                    : null;

                return {
                    ...student,
                    totalSolved: dbRef.totalSolved || 0,
                    easySolved: dbRef.easySolved || 0,
                    mediumSolved: dbRef.mediumSolved || 0,
                    hardSolved: dbRef.hardSolved || 0,
                    dailyStats: dbRef.dailyStats || [],
                    todaySolved: todayStat ? todayStat.solved : 0
                };
            }
            return student;
        });

        leaderboard.sort((a, b) => (b.totalSolved || 0) - (a.totalSolved || 0));
        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard Controller Error:', error);
        res.status(500).json({ error: "Failed to generate leaderboard" });
    }
};

// Get daily activity for logic/graphs
export const getDailyActivity = async (req, res) => {
    try {
        const { date } = req.query;
        const { sheet: fileName, role } = req.user;

        if (!date) return res.status(400).json({ error: "Date parameter is required" });
        if (!fileName && role !== 'super_admin') return res.status(404).json({ error: "No roster mapped" });

        let roster = [];
        if (role === 'super_admin') {
            const students = await Student.findAll();
            roster = students.map(s => ({
                name: s.name,
                leetcodeUsername: s.leetcodeUsername
            }));
        } else {
            roster = readExcel(fileName);
        }

        const usernames = roster.map(s => s.leetcodeUsername).filter(Boolean);
        const dbStudents = await Student.findAll({
            where: { leetcodeUsername: { [Op.in]: usernames } }
        });

        const results = roster.map((student) => {
            if (!student.leetcodeUsername) return { name: student.name, username: '', solvedToday: 0 };

            const dbRef = dbStudents.find(db => db.leetcodeUsername === student.leetcodeUsername);
            let solvedToday = 0;
            if (dbRef && dbRef.dailyStats && Array.isArray(dbRef.dailyStats)) {
                const stat = dbRef.dailyStats.find(d => d.date === date);
                if (stat) {
                    solvedToday = stat.solved;
                }
            }

            return {
                name: student.name,
                username: student.leetcodeUsername,
                solvedToday,
                batch: student.batch || 'Mentor Assigned'
            };
        });

        res.json(results);
    } catch (error) {
        console.error('Daily Activity Controller Error:', error);
        res.status(500).json({ error: "Activity fetch failed" });
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
        const student = await Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const studentObj = student.get({ plain: true });

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

// Get live student profile from LeetCode
export const getStudentProfile = async (req, res) => {
    try {
        const username = req.params.username;
        const stats = await fetchLeetCodeStats(username);

        if (!stats) {
            return res.status(404).json({ error: "Student not found on LeetCode" });
        }

        // Try to fetch name/batch from database by username
        let dbStudent = await Student.findOne({ where: { leetcodeUsername: username } });
        let studentName = username;
        let studentBatch = 'Mentor Assigned';

        if (dbStudent) {
            studentName = dbStudent.name;
            studentBatch = dbStudent.batch;
        } else if (req.user && req.user.sheet) {
            // Fallback: Check the Excel roster for this mentor
            try {
                const roster = readExcel(req.user.sheet);
                const excelStudent = roster.find(s => s.leetcodeUsername === username);
                if (excelStudent) {
                    studentName = excelStudent.name;
                    studentBatch = excelStudent.batch;
                }
            } catch (e) {
                console.error("Excel lookup failed in profile", e);
            }
        }

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

        if (stats.recentAc) {
            stats.recentAc.forEach(sub => {
                const dateStr = new Date(parseInt(sub.timestamp) * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
                if (distinctSolvedPerDay[dateStr]) {
                    distinctSolvedPerDay[dateStr].add(sub.title);
                }
            });
        }

        const recentActivityDetailed = last7Days.map(dateStr => ({
            date: dateStr,
            solved: distinctSolvedPerDay[dateStr].size,
            solvedProblems: Array.from(distinctSolvedPerDay[dateStr])
        })).reverse();

        res.json({
            username,
            leetcodeUsername: username,
            name: studentName,
            batch: studentBatch,
            totalSolved: stats.totalSolved,
            easySolved: stats.easySolved,
            mediumSolved: stats.mediumSolved,
            hardSolved: stats.hardSolved,
            todaySolved: stats.todaySolved,
            recentActivityDetailed
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch LeetCode stats" });
    }
};

// Delete a student
export const deleteStudent = async (req, res) => {
    try {
        await Student.destroy({ where: { _id: req.params.id } });
        res.json({ message: 'Student deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

let isGlobalUpdating = false;

// Internal logic for updating all students
export const updateAllStudents = async () => {
    if (isGlobalUpdating) return 0;

    try {
        isGlobalUpdating = true;
        const students = await Student.findAll();
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
    } finally {
        isGlobalUpdating = false;
    }
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
