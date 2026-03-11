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

        const currentDay = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        if (role === 'super_admin') {
            const Mentor = (await import('../models/Mentor.js')).default;
            const mentors = await Mentor.findAll();
            let allRosterStudents = [];
            const processedUsernames = new Set();

            for (const m of mentors) {
                if (m.sheet && m.role !== 'super_admin') {
                    try {
                        const mRoster = readExcel(m.sheet);
                        mRoster.forEach(s => {
                            s.mentorEmail = m.email;
                            s.mentorDisplay = m.display;
                            if (s.leetcodeUsername) processedUsernames.add(s.leetcodeUsername);
                        });
                        allRosterStudents.push(...mRoster);
                    } catch (e) { }
                }
            }

            const dbStudents = await Student.findAll();
            const leaderboard = allRosterStudents.map(student => {
                // Try matching by username first
                let dbRef = student.leetcodeUsername
                    ? dbStudents.find(db => db.leetcodeUsername === student.leetcodeUsername)
                    : null;

                // Fallback: match by name if username match fails
                if (!dbRef) {
                    dbRef = dbStudents.find(db => db.name.toLowerCase().trim() === student.name.toLowerCase().trim());
                }

                if (dbRef) {
                    const todayStat = dbRef.dailyStats && Array.isArray(dbRef.dailyStats)
                        ? dbRef.dailyStats.find(d => d.date === currentDay)
                        : null;

                    // Mark this username as processed so we don't add it as a standalone later
                    if (dbRef.leetcodeUsername) processedUsernames.add(dbRef.leetcodeUsername);

                    return {
                        ...student,
                        totalSolved: dbRef.totalSolved || 0,
                        easySolved: dbRef.easySolved || 0,
                        mediumSolved: dbRef.mediumSolved || 0,
                        hardSolved: dbRef.hardSolved || 0,
                        dailyStats: dbRef.dailyStats || [],
                        todaySolved: todayStat ? todayStat.solved : 0,
                        leetcodeUsername: dbRef.leetcodeUsername || student.leetcodeUsername,
                        leetcodeUrl: dbRef.leetcodeUrl || student.leetcodeUrl,
                        _id: dbRef._id // CRITICAL: Use the real DB ID
                    };
                }
                return student;
            });

            // Add standalone DB students (manually added via UI)
            for (const db of dbStudents) {
                if (db.leetcodeUsername && !processedUsernames.has(db.leetcodeUsername)) {
                    const todayStat = db.dailyStats && Array.isArray(db.dailyStats)
                        ? db.dailyStats.find(d => d.date === currentDay)
                        : null;
                    leaderboard.push({
                        _id: db._id,
                        name: db.name,
                        leetcodeUsername: db.leetcodeUsername,
                        batch: db.batch,
                        mentorEmail: db.mentorEmail,
                        totalSolved: db.totalSolved || 0,
                        easySolved: db.easySolved || 0,
                        mediumSolved: db.mediumSolved || 0,
                        hardSolved: db.hardSolved || 0,
                        dailyStats: db.dailyStats || [],
                        todaySolved: todayStat ? todayStat.solved : 0
                    });
                }
            }

            leaderboard.sort((a, b) => (b.totalSolved || 0) - (a.totalSolved || 0));
            return res.json(leaderboard);
        }

        if (!fileName) return res.status(404).json({ error: 'No roster found.' });

        const roster = readExcel(fileName);
        const usernames = roster.map(s => s.leetcodeUsername).filter(Boolean);
        const dbStudents = await Student.findAll({
            where: {
                [Op.or]: [
                    { leetcodeUsername: { [Op.in]: usernames } },
                    { mentorEmail: email }
                ]
            }
        });

        const leaderboard = roster.map(student => {
            // Match by username or fallback to name
            let dbRef = student.leetcodeUsername
                ? dbStudents.find(db => db.leetcodeUsername === student.leetcodeUsername)
                : null;

            if (!dbRef) {
                dbRef = dbStudents.find(db => db.name.toLowerCase().trim() === student.name.toLowerCase().trim());
            }

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
                    todaySolved: todayStat ? todayStat.solved : 0,
                    leetcodeUsername: dbRef.leetcodeUsername || student.leetcodeUsername,
                    leetcodeUrl: dbRef.leetcodeUrl || student.leetcodeUrl,
                    _id: dbRef._id
                };
            }
            return student;
        });

        // Add dynamically registered students belonging to this mentor missing from the excel file
        for (const db of dbStudents) {
            if (db.mentorEmail === email && db.leetcodeUsername && !usernames.includes(db.leetcodeUsername)) {
                const todayStat = db.dailyStats && Array.isArray(db.dailyStats)
                    ? db.dailyStats.find(d => d.date === currentDay)
                    : null;
                leaderboard.push({
                    _id: db._id,
                    name: db.name,
                    leetcodeUsername: db.leetcodeUsername,
                    batch: db.batch,
                    mentorEmail: db.mentorEmail,
                    totalSolved: db.totalSolved || 0,
                    easySolved: db.easySolved || 0,
                    mediumSolved: db.mediumSolved || 0,
                    hardSolved: db.hardSolved || 0,
                    dailyStats: db.dailyStats || [],
                    todaySolved: todayStat ? todayStat.solved : 0
                });
            }
        }

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
                leetcodeUsername: s.leetcodeUsername,
                mentorEmail: s.mentorEmail,
                batch: s.batch
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
                batch: student.batch || 'Mentor Assigned',
                mentorEmail: student.mentorEmail || (dbRef ? dbRef.mentorEmail : null)
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
        const { name, email, leetcodeUrl, batch, mentorEmail } = req.body;
        const username = extractUsername(leetcodeUrl) || leetcodeUrl.split('/').pop().replace(/\/$/, "");

        // Initial fetch to get baseline
        const stats = await fetchLeetCodeStats(username);
        const totalSolved = stats ? stats.totalSolved : 0;

        const student = await Student.create({
            name,
            email,
            leetcodeUrl,
            leetcodeUsername: username,
            batch,
            mentorEmail: (req.user.role === 'super_admin' && mentorEmail) ? mentorEmail : req.user.email,
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
        console.error('Add Student Error:', error);
        res.status(500).json({ error: 'Failed to add student. Ensure email/username are unique.' });
    }
};

// Update student
export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, leetcodeUrl, batch, mentorEmail } = req.body;

        // Try to find by PK first (UUID)
        let student = await Student.findByPk(id);

        // Fallback: If not found by PK, try finding by name or leetcode username provided in body
        if (!student) {
            const extracted = leetcodeUrl ? (extractUsername(leetcodeUrl) || leetcodeUrl.split('/').pop().replace(/\/$/, "")) : null;
            student = await Student.findOne({
                where: {
                    [Op.or]: [
                        { name: name },
                        ...(extracted ? [{ leetcodeUsername: extracted }] : [])
                    ]
                }
            });
        }

        // If STILL not found, we could either return 404 or CREATE it.
        // Given this is an "Update/Add" UI, let's treat it as an upsert if it's a super admin
        if (!student) {
            return res.status(404).json({ error: 'Student record could not be linked to database. Try adding as new student or ensure name matches.' });
        }

        if (name) student.name = name;
        if (email) student.email = email;
        if (batch) student.batch = batch;
        if (mentorEmail && req.user.role === 'super_admin') student.mentorEmail = mentorEmail;

        if (leetcodeUrl && leetcodeUrl !== student.leetcodeUrl) {
            const username = extractUsername(leetcodeUrl) || leetcodeUrl.split('/').pop().replace(/\/$/, "");
            student.leetcodeUrl = leetcodeUrl;
            student.leetcodeUsername = username;

            const stats = await fetchLeetCodeStats(username);
            if (stats) {
                student.totalSolved = stats.totalSolved;
                student.easySolved = stats.easySolved;
                student.mediumSolved = stats.mediumSolved;
                student.hardSolved = stats.hardSolved;
            }
        }

        await student.save();
        res.json(student);
    } catch (error) {
        console.error('Update Student Error:', error);
        res.status(500).json({ error: 'Update failed.' });
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
            console.log(`[Update] Processing ${student.leetcodeUsername} (${student.name})...`);
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
                newDailyStats.sort((a, b) => a.date.localeCompare(b.date)); // Sort string-wise for YYYY-MM-DD

                student.dailyStats = newDailyStats;
                student.totalSolved = stats.totalSolved;
                student.easySolved = stats.easySolved;
                student.mediumSolved = stats.mediumSolved;
                student.hardSolved = stats.hardSolved;
                student.lastUpdated = Date.now();

                // Explicitly mark as changed to ensure Sequelize saves the JSON field
                student.changed('dailyStats', true);
                await student.save();
                console.log(`[Update] Success for ${student.leetcodeUsername}: ${stats.totalSolved} total, ${newDailyStats.length} days of activity.`);
                updated++;
            } else {
                console.warn(`[Update] Skip ${student.leetcodeUsername}: Fetch failed.`);
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
