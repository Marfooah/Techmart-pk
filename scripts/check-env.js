require('dotenv').config({ path: '.env' });
console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL);
console.log('TURSO_AUTH_TOKEN set:', !!process.env.TURSO_AUTH_TOKEN);
