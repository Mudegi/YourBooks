#!/usr/bin/env node

const { execSync } = require('child_process');

try {
  console.log('Running Prisma migration...');
  execSync('npx prisma migrate dev --name "add bank feeds documents projects crm"', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}
