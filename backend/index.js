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

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', studentRoutes);

// Run Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
