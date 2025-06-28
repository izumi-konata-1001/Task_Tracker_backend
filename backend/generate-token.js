const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_PATH = path.resolve(__dirname, '.env');
const SECRET_KEY_NAME = 'JWT_SECRET';

const newSecret = crypto.randomBytes(32).toString('hex');

let envContent = '';
if (fs.existsSync(ENV_PATH)) {
  envContent = fs.readFileSync(ENV_PATH, 'utf-8');
}

const filteredLines = envContent
  .split('\n')
  .filter((line) => !line.startsWith(`${SECRET_KEY_NAME}=`));

filteredLines.push(`${SECRET_KEY_NAME}=${newSecret}`);

fs.writeFileSync(ENV_PATH, filteredLines.join('\n'), 'utf-8');

console.log(`New secret key written to .env as ${SECRET_KEY_NAME}`);
console.log(`${SECRET_KEY_NAME}=${newSecret}`);