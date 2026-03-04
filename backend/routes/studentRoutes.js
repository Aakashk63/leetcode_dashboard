import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import readExcel from '../readExcel.js';
import { addStudent, getStudent, deleteStudent, triggerUpdate } from '../controllers/studentController.js';
import Student from '../models/Student.js';

const router = express.Router();

// Leaderboard Route - Reads directly from Excel files based on Mentor Email
router.get('/leaderboard', requireAuth, async (req, res) => {
    try {
        const { email, role } = req.user;
        let fileName = '';

        if (role === 'super_admin') {
            // Super Admin sees all (from DB)
            const students = await Student.findAll({ order: [['totalSolved', 'DESC']] });
            return res.json(students);
        }

        // Map Mentor Email to Excel File
        if (email === 'mentor1@admin.com') fileName = 'Mentor 1.xlsx';
        else if (email === 'mentor2@admin.com') fileName = 'Mentor 2.xlsx';
        else if (email === 'mentor3@admin.com') fileName = 'Leetcode Platform .xlsx';
        else if (email === 'mentor4@admin.com') fileName = 'mentor4.xlsx';

        if (!fileName) {
            return res.status(404).json({ error: 'No roster found for this mentor.' });
        }

        // Get roster from Excel
        const roster = readExcel(fileName);
        const usernames = roster.map(s => s.leetcodeUsername).filter(Boolean);

        // Fetch latest stats from DB for these students to ensure "Progress" works
        const students = await Student.findAll({
            where: {
                leetcodeUsername: usernames
            },
            order: [['totalSolved', 'DESC']]
        });

        // If DB is empty for these students, fallback to Excel data
        if (students.length === 0) {
            return res.json(roster);
        }

        res.json(students);
    } catch (error) {
        console.error('Leaderboard Error:', error);
        res.status(500).json({ error: 'Failed to load leaderboard' });
    }
});

router.post('/student', addStudent);
router.get('/student/:id', getStudent);
router.delete('/student/:id', deleteStudent);
router.post('/update-all', triggerUpdate);

export default router;
