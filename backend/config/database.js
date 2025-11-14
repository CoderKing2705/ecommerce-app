import pkg from 'pg';
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();
// Log environment variables for debugging (remove in production)
console.log('Database configuration:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ? '***' : 'MISSING', // Don't log actual password
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
    // Add connection timeout and other options
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 20,
});

export const connectDB = async () => {
    try {
        // Validate environment variables
        if (!process.env.DB_PASSWORD) {
            throw new Error('Database password is not set in environment variables');
        }

        if (typeof process.env.DB_PASSWORD !== 'string') {
            throw new Error('Database password must be a string');
        }

        const client = await pool.connect();
        console.log('✅ PostgreSQL connected successfully');
        client.release();
        return pool;
    } catch (error) {
        console.error('❌ Database connection error:', error.message);

        // More detailed error information
        if (error.code === '28P01') {
            console.error('💡 Authentication failed. Check your username and password.');
        } else if (error.code === '3D000') {
            console.error('💡 Database does not exist. Create it first.');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('💡 Cannot connect to PostgreSQL. Make sure it is running.');
        }

        process.exit(1);
    }
};

export { pool };