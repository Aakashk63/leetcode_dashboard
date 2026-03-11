import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { getLeaderboard, addStudent, getStudent, deleteStudent, triggerUpdate, getStudentProfile, getDailyActivity, updateStudent } from '../controllers/studentController.js';

const router = express.Router();

router.get('/leaderboard', requireAuth, getLeaderboard);
router.get('/daily-activity', requireAuth, getDailyActivity);

router.post('/student', requireAuth, addStudent);
router.put('/student/:id', requireAuth, updateStudent);
router.get('/student/:id', getStudent);
router.get('/profile/:username', requireAuth, getStudentProfile);
router.delete('/student/:id', requireAuth, deleteStudent);
router.post('/update-all', triggerUpdate);

export default router;
