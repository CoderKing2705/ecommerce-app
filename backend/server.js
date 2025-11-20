import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables with explicit path
const envPath = path.resolve(__dirname, '.env');
console.log('📁 Looking for .env file at:', envPath);

// Check if .env file exists
if (fs.existsSync(envPath)) {
    console.log('✅ .env file found');
    dotenv.config({ path: envPath });
} else {
    console.log('❌ .env file NOT found at:', envPath);
    console.log('💡 Please create .env file in backend directory');
    process.exit(1);
}

// Debug: Log environment variables (without password)
console.log('🔧 Loaded environment variables:');
console.log('   PORT:', process.env.PORT);
console.log('   DB_HOST:', process.env.DB_HOST);
console.log('   DB_PORT:', process.env.DB_PORT);
console.log('   DB_NAME:', process.env.DB_NAME);
console.log('   DB_USER:', process.env.DB_USER);
console.log('   DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('   JWT_SECRET:', process.env.JWT_SECRET);

import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { connectDB } from './config/database.js';

// Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import wishlistRoutes from './routes/wishlist.js';
import adminRoutes from './routes/admin.js';
import orderRoutes from './routes/orders.js';
import orderOperations from './routes/orderOperations.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import reviewRouter from './routes/reviewRouter.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
console.log('🔄 Connecting to database...');
connectDB().then(() => {
    console.log('✅ Database connection established');
});

// Import passport config AFTER environment variables are loaded
import './config/passport.js';

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order-ops', orderOperations);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/products/:productId/reviews', reviewRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        message: 'E-commerce API is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Debug endpoint
app.get('/api/debug/env', (req, res) => {
    res.json({
        dbHost: process.env.DB_HOST,
        dbPort: process.env.DB_PORT,
        dbName: process.env.DB_NAME,
        dbUser: process.env.DB_USER,
        hasDbPassword: !!process.env.DB_PASSWORD,
        nodeEnv: process.env.NODE_ENV
    });
});

import { handleMulterError } from './config/multer.js';
app.use(handleMulterError);


app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Client URL: ${process.env.CLIENT_URL}`);
});