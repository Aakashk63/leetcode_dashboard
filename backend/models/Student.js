import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Student = sequelize.define('Student', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    leetcodeUrl: { type: DataTypes.STRING, allowNull: false },
    leetcodeUsername: { type: DataTypes.STRING, allowNull: false, unique: true },
    batch: { type: DataTypes.STRING, allowNull: false },
    totalSolved: { type: DataTypes.INTEGER, defaultValue: 0 },
    easySolved: { type: DataTypes.INTEGER, defaultValue: 0 },
    mediumSolved: { type: DataTypes.INTEGER, defaultValue: 0 },
    hardSolved: { type: DataTypes.INTEGER, defaultValue: 0 },
    dailyStats: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        get() {
            const rawValue = this.getDataValue('dailyStats');
            if (!rawValue) return [];
            try {
                return JSON.parse(rawValue);
            } catch (e) {
                return [];
            }
        },
        set(value) {
            this.setDataValue('dailyStats', JSON.stringify(value));
        }
    },
    lastUpdated: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
}, {
    timestamps: true
});

export default Student;
