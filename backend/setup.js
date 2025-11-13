import fs from 'fs';
import crypto from 'crypto';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🎯 E-commerce Backend Setup Wizard\n');

const questions = [
    'PostgreSQL Database Host (default: localhost): ',
    'PostgreSQL Database Port (default: 5432): ',
    'PostgreSQL Database Name (default: ecommerce_db): ',
    'PostgreSQL Username (default: postgres): ',
    'PostgreSQL Password: ',
    'Google Client ID: ',
    'Google Client Secret: '
];

const answers = [];

function askQuestion(i) {
    if (i >= questions.length) {
        // Generate JWT Secret
        const jwtSecret = crypto.randomBytes(64).toString('hex');

        // Create .env content
        const envContent = `# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=${answers[0] || 'localhost'}
DB_PORT=${answers[1] || '5432'}
DB_NAME=${answers[2] || 'ecommerce_db'}
DB_USER=${answers[3] || 'postgres'}
DB_PASSWORD=${answers[4]}

# JWT
JWT_SECRET=${jwtSecret}

# Google OAuth
GOOGLE_CLIENT_ID=${answers[5]}
GOOGLE_CLIENT_SECRET=${answers[6]}

# Client URL
CLIENT_URL=http://localhost:3000
`;

        // Write to .env file
        fs.writeFileSync('.env', envContent);

        console.log('\n✅ .env file created successfully!');
        console.log('🔐 Your JWT Secret has been generated automatically');
        console.log('\n📝 Next steps:');
        console.log('1. Run the SQL commands to set up your database');
        console.log('2. Start your backend with: npm run dev');
        console.log('3. Start your frontend with: npm run dev');

        rl.close();
        return;
    }

    rl.question(questions[i], (answer) => {
        answers.push(answer);
        askQuestion(i + 1);
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