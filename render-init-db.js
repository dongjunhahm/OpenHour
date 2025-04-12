/**
 * Render Database Initialization Script
 * 
 * This script runs migrations and seeds the database during deployment.
 * It runs in the background to not block the application startup.
 */

console.log('Starting database initialization...');

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function initializeDatabase() {
  try {
    // Run Prisma migrations
    console.log('Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Check if we need to seed the database
    // This could be determined by an environment variable or by checking the database
    const prisma = new PrismaClient();
    
    try {
      // Check if we have any users in the database
      const userCount = await prisma.user.count();
      
      if (userCount === 0) {
        console.log('No users found. Seeding the database...');
        // You can either call a separate seed script or include the seeding logic here
        execSync('npx prisma db seed', { stdio: 'inherit' });
      } else {
        console.log(`Database already has ${userCount} users. Skipping seed.`);
      }
    } finally {
      await prisma.$disconnect();
    }
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    // Don't exit the process with error code as this runs in the background
    // and we don't want to stop the application from starting
  }
}

// Run the initialization
initializeDatabase();
