import express from 'express';
import { login, addMentor, getMentors } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import multer from 'multer';

// Use memory storage so we can read the file data directly or disk storage to save it. 
// Let's use disk storage to easily process it later, we'll save it to the parent directory where other excel files are.
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../'); // save to root where other files are
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

const router = express.Router();

router.post('/login', login);
router.post('/mentor', requireAuth, upload.single('sheet'), addMentor);
router.get('/mentors', requireAuth, getMentors);

export default router;
