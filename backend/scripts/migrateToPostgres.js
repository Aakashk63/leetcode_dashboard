import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Define schema matches our models/Student.js
const StudentSchema = {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    leetcodeUrl: { type: DataTypes.STRING, allowNull: false },
    leetcodeUsername: { type: DataTypes.STRING, allowNull: false, unique: true },
    mentorEmail: { type: DataTypes.STRING, allowNull: true },
    batch: { type: DataTypes.STRING, allowNull: false },
    totalSolved: { type: DataTypes.INTEGER, defaultValue: 0 },
    easySolved: { type: DataTypes.INTEGER, defaultValue: 0 },
    mediumSolved: { type: DataTypes.INTEGER, defaultValue: 0 },
    hardSolved: { type: DataTypes.INTEGER, defaultValue: 0 },
    dailyStats: {
        type: DataTypes.TEXT,
        defaultValue: '[]'
    },
    lastUpdated: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
};

const runMigration = async () => {
    // 1. Source: SQLite Database
    const sqliteDbPath = path.resolve(process.cwd(), 'database.sqlite');
    if (!fs.existsSync(sqliteDbPath)) {
        console.error('No database.sqlite found. Ensure you are running this in the backend folder.');
        process.exit(1);
    }

    console.log('Connecting to SQLite...');
    const sqliteSequelize = new Sequelize({
        dialect: 'sqlite',
        storage: sqliteDbPath,
        logging: false
    });

    // Using stringify / parsing for dailyStats because of custom getter/setter in the original model
    const SqliteStudent = sqliteSequelize.define('Student', StudentSchema, { timestamps: true });
    await sqliteSequelize.authenticate();

    // 2. Dest: PostgreSQL Database
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set in your .env file. Please add a valid Postgres connection string.');
        process.exit(1);
    }

    console.log('Connecting to Postgres...');
    const pgSequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    });

    const PgStudent = pgSequelize.define('Student', StudentSchema, { timestamps: true });
    await pgSequelize.authenticate();

    // CREATE Postgres Table if it doesn't exist
    await pgSequelize.sync({ alter: true });
    console.log('Postgres tables synchronized.');

    // MIGRATION PROCESS
    try {
        console.log('Fetching records from SQLite...');
        const oldStudents = await SqliteStudent.findAll();
        console.log(`Found ${oldStudents.length} students to migrate.`);

        for (const student of oldStudents) {
            // Check if already in Postgres
            const existing = await PgStudent.findOne({ where: { leetcodeUsername: student.leetcodeUsername } });
            if (!existing) {
                // Have to manually transfer the datavalues properly
                await PgStudent.create({
                    _id: student._id,
                    name: student.name,
                    email: student.email,
                    leetcodeUrl: student.leetcodeUrl,
                    leetcodeUsername: student.leetcodeUsername,
                    mentorEmail: student.mentorEmail,
                    batch: student.batch,
                    totalSolved: student.totalSolved,
                    easySolved: student.easySolved,
                    mediumSolved: student.mediumSolved,
                    hardSolved: student.hardSolved,
                    dailyStats: student.dailyStats, // Already a string format out of the DB layer
                    lastUpdated: student.lastUpdated,
                    createdAt: student.createdAt,
                    updatedAt: student.updatedAt
                });
                console.log(`Migrated: ${student.leetcodeUsername}`);
            } else {
                console.log(`Skipped (already exists): ${student.leetcodeUsername}`);
            }
        }
        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sqliteSequelize.close();
        await pgSequelize.close();
        process.exit();
    }
};

runMigration();
