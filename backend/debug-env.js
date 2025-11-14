import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Environment Variables Debug');
console.log('================================');

const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'JWT_SECRET',
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
];

requiredVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    const displayValue = value ?
        (varName.includes('SECRET') || varName.includes('PASSWORD') ?
            '*'.repeat(8) : value) : 'NOT SET';

    console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n📝 Next steps:');
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('1. Get Google OAuth credentials from: https://console.cloud.google.com/');
    console.log('2. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env file');
}
if (!process.env.JWT_SECRET) {
    console.log('3. Generate JWT secret with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
}
if (!process.env.DB_PASSWORD) {
    console.log('4. Set your PostgreSQL password in .env file');
}

console.log('\n💡 For development, you can use these temporary values:');
console.log('   GOOGLE_CLIENT_ID=test');
console.log('   GOOGLE_CLIENT_SECRET=test');
console.log('   (Google login won\'t work, but the server will start)');