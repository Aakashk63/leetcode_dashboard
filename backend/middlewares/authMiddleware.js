import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'supersecretkey_for_champions_arena';

export const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded; // Contains email, role, sheet, display
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
};
