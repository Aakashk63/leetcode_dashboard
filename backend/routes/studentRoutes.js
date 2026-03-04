import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { getLeaderboard, addStudent, getStudent, deleteStudent, triggerUpdate, getStudentProfile } from '../controllers/studentController.js';

const router = express.Router();

router.get('/leaderboard', requireAuth, getLeaderboard);

router.post('/student', addStudent);
router.get('/student/:id', getStudent);
router.get('/profile/:username', getStudentProfile);
router.delete('/student/:id', deleteStudent);
router.post('/update-all', triggerUpdate);

export default router;
