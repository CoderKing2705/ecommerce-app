import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Database Configuration Debug');
console.log('================================');

const dbConfig = {
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD ? '***' : 'NOT SET',
};

Object.entries(dbConfig).forEach(([key, value]) => {
    const status = value && value !== 'NOT SET' ? '✅' : '❌';
    console.log(`${status} ${key}: ${value}`);
});

console.log('\n📝 Environment file:', process.env.NODE_ENV);
console.log('🔧 Node version:', process.version);

// Test if password is a string
if (process.env.DB_PASSWORD) {
    console.log('🔒 Password type:', typeof process.env.DB_PASSWORD);
    console.log('🔒 Password length:', process.env.DB_PASSWORD.length);
} else {
    console.log('❌ DB_PASSWORD is not set!');
}

console.log('\n💡 Troubleshooting tips:');
console.log('1. Check if .env file exists in backend folder');
console.log('2. Verify DB_PASSWORD is set in .env file');
console.log('3. Make sure PostgreSQL is running');
console.log('4. Check if database "ecommerce_db" exists');