import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false,
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('SQLite connection successful.');
        await sequelize.sync();
    } catch (error) {
        console.error('SQLite connection error:', error);
        process.exit(1);
    }
};

export default connectDB;
