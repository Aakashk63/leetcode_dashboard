import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { getLeaderboard, addStudent, getStudent, deleteStudent, triggerUpdate } from '../controllers/studentController.js';

const router = express.Router();

// Main Leaderboard Route - Returns only students assigned to this mentor
router.get('/leaderboard', requireAuth, getLeaderboard);

router.post('/student', addStudent);
router.get('/student/:id', getStudent);
router.delete('/student/:id', deleteStudent);
router.post('/update-all', triggerUpdate);

export default router;
