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
        console.log(`[Leaderboard] Request from ${email} (Role: ${role})`);
        let fileName = '';

        if (role === 'super_admin') {
            // Super Admin sees all (from DB)
            const students = await Student.findAll({ order: [['totalSolved', 'DESC']] });
            return res.json(students);
        }

        // Use the sheet mapped in authController for this user
        fileName = req.user.sheet;

        if (!fileName) {
            console.log(`[Leaderboard] No sheet mapped in token for email: ${email}`);
            return res.status(404).json({ error: 'No roster found for this mentor.' });
        }

        // Get roster from Excel
        const roster = readExcel(fileName);
        console.log(`[Leaderboard] Roster for ${fileName}: ${roster.length} students found.`);
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
