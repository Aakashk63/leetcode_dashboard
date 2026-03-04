import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import studentRoutes from './routes/studentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { setupCronJobs } from './cron/jobs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Setup Cron Jobs
setupCronJobs();

// Secure & Dynamic CORS Configuration
const allowedOrigins = [
    'http://localhost:5173', // Local Vite
    'http://localhost:3000', // Alternative Local Server
    process.env.FRONTEND_URL // Production Internet Vercel URL
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin) return callback(null, true);

        // Allow Vercel, localhost, or local IPv4 networks
        const isLocalHost = origin.startsWith('http://localhost:');
        const isLocalNetwork = origin.match(/^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/);
        const isVercel = origin.endsWith('.vercel.app');

        if (allowedOrigins.includes(origin) || isLocalHost || isLocalNetwork || isVercel) {
            return callback(null, true);
        } else {
            console.warn(`Blocked by CORS: ${origin}`);
            return callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', studentRoutes);

// Run Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
