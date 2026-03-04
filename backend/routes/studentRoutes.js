import express from 'express';
import Student from '../models/Student.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { addStudent, getStudent, deleteStudent, triggerUpdate } from '../controllers/studentController.js';

const router = express.Router();

// Main Leaderboard Route - Returns only students assigned to this mentor
router.get('/leaderboard', requireAuth, async (req, res) => {
    try {
        const mentorEmail = req.user.email;
        const role = req.user.role;

        let query = {};
        if (role === 'mentor') {
            query = { mentorEmail: mentorEmail };
        }

        const students = await Student.find(query).sort({ totalSolved: -1 }).lean();
        res.json(students);
    } catch (error) {
        console.error('Leaderboard Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

router.post('/student', addStudent);
router.get('/student/:id', getStudent);
router.delete('/student/:id', deleteStudent);
router.post('/update-all', triggerUpdate);

export default router;
