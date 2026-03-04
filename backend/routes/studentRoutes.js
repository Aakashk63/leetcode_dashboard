import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import readExcel from '../readExcel.js';
import { addStudent, getStudent, deleteStudent, triggerUpdate, getStudentProfile } from '../controllers/studentController.js';
import Student from '../models/Student.js';

import { fetchLeetCodeStats } from '../services/leetcodeService.js';

const router = express.Router();

// Leaderboard Route - Reads directly from Excel files based on Mentor Email
router.get('/leaderboard', requireAuth, async (req, res) => {
    try {
        const { email, role } = req.user;
        console.log(`[Leaderboard] Request from ${email} (Role: ${role})`);
        let fileName = '';

        if (role === 'super_admin') {
            const students = await Student.findAll({ order: [['totalSolved', 'DESC']] });
            return res.json(students);
        }

        fileName = req.user.sheet;
        if (!fileName) return res.status(404).json({ error: 'No roster found.' });

        const roster = readExcel(fileName);

        // Fetch Real-time data for the roster
        const students = await Promise.all(roster.map(async (st) => {
            if (!st.leetcodeUsername) return st;
            try {
                const live = await fetchLeetCodeStats(st.leetcodeUsername);
                if (live) return { ...st, ...live };
            } catch (e) { }
            return st;
        }));

        students.sort((a, b) => (b.totalSolved || 0) - (a.totalSolved || 0));
        res.json(students);
    } catch (error) {
        console.error('Leaderboard Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

router.post('/student', addStudent);
router.get('/student/:id', getStudent);
router.get('/profile/:username', getStudentProfile);
router.delete('/student/:id', deleteStudent);
router.post('/update-all', triggerUpdate);

export default router;
