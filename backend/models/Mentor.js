import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Mentor = sequelize.define('Mentor', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'mentor' },
    sheet: { type: DataTypes.STRING, allowNull: true },
    display: { type: DataTypes.STRING, allowNull: false }
}, {
    timestamps: true
});

export default Mentor;
