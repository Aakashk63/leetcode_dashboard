import jwt from 'jsonwebtoken';
import Mentor from '../models/Mentor.js';

const INITIAL_MENTORS = [
    { email: 'mentor1@admin.com', password: 'password123', role: 'mentor', sheet: 'Mentor 1.xlsx', display: 'Mentor 1' },
    { email: 'mentor2@admin.com', password: 'password123', role: 'mentor', sheet: 'Mentor 2.xlsx', display: 'Mentor 2' },
    { email: 'mentor3@admin.com', password: 'password123', role: 'mentor', sheet: 'Leetcode Platform .xlsx', display: 'Mentor 3' },
    { email: 'mentor4@admin.com', password: 'password123', role: 'mentor', sheet: 'Mentor 4 (3).xlsx', display: 'Mentor 4' },
    { email: 'superadmin@admin.com', password: 'admin123', role: 'super_admin', display: 'Super Admin' }
];

const SECRET = process.env.JWT_SECRET || 'supersecretkey_for_champions_arena';

export const seedMentors = async () => {
    try {
        const count = await Mentor.count();
        if (count === 0) {
            await Mentor.bulkCreate(INITIAL_MENTORS);
            console.log('Seeded initial mentors.');
        }
    } catch (err) {
        console.error('Failed to seed mentors:', err);
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await Mentor.findOne({ where: { email } });
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials. Access Denied.' });
        }

        const payload = {
            email: user.email,
            role: user.role,
            sheet: user.sheet,
            display: user.display
        };

        const token = jwt.sign(payload, SECRET, { expiresIn: '12h' });

        res.json({ message: 'Login successful', token, user: payload });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

export const addMentor = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Only super admin can perform this action' });
        }

        const { email, password, display } = req.body;
        if (!email || !password || !display || !req.file) {
            return res.status(400).json({ error: 'All fields are required including the Excel sheet.' });
        }

        const existing = await Mentor.findOne({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'Mentor email already exists.' });
        }

        const sheetName = req.file.originalname;
        await Mentor.create({ email, password, display, sheet: sheetName, role: 'mentor' });

        // Spin up background task to add new mentor students efficiently
        import('../readExcel.js').then(async ({ default: readExcel }) => {
            const Student = (await import('../models/Student.js')).default;
            const leetcodeService = await import('../services/leetcodeService.js');
            const records = readExcel(sheetName);
            for (const s of records) {
                if (!s.leetcodeUsername) continue;
                const existingStudent = await Student.findOne({ where: { leetcodeUsername: s.leetcodeUsername } });

                if (!existingStudent) {
                    const stats = await leetcodeService.fetchLeetCodeStats(s.leetcodeUsername);
                    await Student.create({
                        name: s.name, email: `${s.leetcodeUsername}@placeholder.com`, mentorEmail: email,
                        leetcodeUrl: s.leetcodeUrl || `https://leetcode.com/u/${s.leetcodeUsername}/`,
                        leetcodeUsername: s.leetcodeUsername, batch: s.batch,
                        totalSolved: stats ? stats.totalSolved : 0, easySolved: stats ? stats.easySolved : 0,
                        mediumSolved: stats ? stats.mediumSolved : 0, hardSolved: stats ? stats.hardSolved : 0,
                        dailyStats: [{ date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }), solved: 0 }]
                    });
                } else if (!existingStudent.mentorEmail) {
                    existingStudent.mentorEmail = email;
                    await existingStudent.save();
                }
                await new Promise(r => setTimeout(r, 1000));
            }
        });

        res.status(201).json({ message: 'Mentor created successfully and sheet being processed.' });
    } catch (error) {
        console.error('Error adding mentor:', error);
        res.status(500).json({ error: 'Failed to create new mentor.' });
    }
};
export const getMentors = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Only super admin can view all mentors' });
        }
        const mentors = await Mentor.findAll({
            where: { role: 'mentor' }
        });
        res.json(mentors);
    } catch (error) {
        console.error('Error fetching mentors:', error);
        res.status(500).json({ error: 'Failed to fetch mentors.' });
    }
};
