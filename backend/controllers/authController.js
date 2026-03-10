import jwt from 'jsonwebtoken';

const MENTORS = {
    'mentor1@admin.com': { password: 'password123', role: 'mentor', sheet: 'Mentor 1.xlsx', display: 'Mentor 1' },
    'mentor2@admin.com': { password: 'password123', role: 'mentor', sheet: 'Mentor 2.xlsx', display: 'Mentor 2' },
    'mentor3@admin.com': { password: 'password123', role: 'mentor', sheet: 'Leetcode Platform .xlsx', display: 'Mentor 3' },
    'mentor4@admin.com': { password: 'password123', role: 'mentor', sheet: 'Mentor 4 (3).xlsx', display: 'Mentor 4' },
    'superadmin@admin.com': { password: 'admin123', role: 'super_admin', display: 'Super Admin' }
};

const SECRET = process.env.JWT_SECRET || 'supersecretkey_for_champions_arena';

export const login = (req, res) => {
    const { email, password } = req.body;

    const user = MENTORS[email];
    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials. Access Denied.' });
    }

    const payload = {
        email,
        role: user.role,
        sheet: user.sheet,
        display: user.display
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: '12h' });

    res.json({ message: 'Login successful', token, user: payload });
};
