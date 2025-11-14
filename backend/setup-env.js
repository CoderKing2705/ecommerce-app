import fs from 'fs';
import readline from 'readline';
import crypto from 'crypto';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🎯 E-commerce Backend Setup');
console.log('===========================\n');

const questions = [
    {
        name: 'DB_PASSWORD',
        question: 'Enter your PostgreSQL password: ',
        default: 'postgres'
    },
    {
        name: 'DB_HOST',
        question: 'PostgreSQL host (default: localhost): ',
        default: 'localhost'
    },
    {
        name: 'DB_PORT',
        question: 'PostgreSQL port (default: 5432): ',
        default: '5432'
    },
    {
        name: 'DB_NAME',
        question: 'Database name (default: ecommerce_db): ',
        default: 'ecommerce_db'
    },
    {
        name: 'DB_USER',
        question: 'PostgreSQL username (default: postgres): ',
        default: 'postgres'
    }
];

const answers = {};

function askQuestion(index) {
    if (index >= questions.length) {
        // Generate JWT secret
        const jwtSecret = crypto.randomBytes(64).toString('hex');

        // Create .env content
        const envContent = `PORT=5000
NODE_ENV=development

DB_HOST=${answers.DB_HOST}
DB_PORT=${answers.DB_PORT}
DB_NAME=${answers.DB_NAME}
DB_USER=${answers.DB_USER}
DB_PASSWORD=${answers.DB_PASSWORD}

JWT_SECRET=${jwtSecret}

GOOGLE_CLIENT_ID=not_configured
GOOGLE_CLIENT_SECRET=not_configured

CLIENT_URL=http://localhost:3000
`;

        // Write to .env file
        fs.writeFileSync('.env', envContent);

        console.log('\n✅ .env file created successfully!');
        console.log('🔐 JWT Secret has been generated automatically');
        console.log('\n📝 Next steps:');
        console.log('1. Make sure PostgreSQL is running');
        console.log('2. Create the database with: createdb ecommerce_db');
        console.log('3. Run the SQL setup file');
        console.log('4. Start your backend with: npm run dev');

        rl.close();
        return;
    }

    const currentQuestion = questions[index];

    rl.question(currentQuestion.question, (answer) => {
        answers[currentQuestion.name] = answer || currentQuestion.default;
        askQuestion(index + 1);
    });
}

// Check if .env already exists
if (fs.existsSync('.env')) {
    rl.question('.env file already exists. Overwrite? (y/N): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
            askQuestion(0);
        } else {
            console.log('Setup cancelled.');
            rl.close();
        }
    });
} else {
    askQuestion(0);
}