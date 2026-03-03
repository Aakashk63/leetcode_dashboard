import express from 'express';
import { getLeaderboard, addStudent, getStudent, deleteStudent, triggerUpdate } from '../controllers/studentController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/leaderboard', requireAuth, getLeaderboard);
router.post('/student', addStudent);
router.get('/student/:id', getStudent);
router.delete('/student/:id', deleteStudent);
router.post('/update-all', triggerUpdate);

export default router;
