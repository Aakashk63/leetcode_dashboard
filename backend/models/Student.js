import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    leetcodeUrl: { type: String, required: true },
    leetcodeUsername: { type: String, required: true, unique: true },
    mentorEmail: { type: String },
    batch: { type: String, required: true },
    totalSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    dailyStats: {
        type: [
            {
                date: { type: String },
                solved: { type: Number }
            }
        ],
        default: []
    },
    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const Student = mongoose.model('Student', StudentSchema);

export default Student;
