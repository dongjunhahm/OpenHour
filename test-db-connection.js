// Test script to check database connection
import pkg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config({ path: '.env.local' });

async function testDatabaseConnection() {
  console.log('Testing direct connection to Supabase database...');
  
  // Get connection details from env
  const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
  const host = process.env.POSTGRES_HOST;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const database = process.env.POSTGRES_DATABASE;
  
  console.log(`Connection host: ${host}`);
  console.log(`Connection string: ${connectionString}`);
  
  try {
    // Try with CA certificate
    console.log('\nAttempt 1: With CA certificate');
    const pool1 = new Pool({
      host,
      user,
      password,
      database,
      port: 5432,
      ssl: {
        ca: fs.readFileSync('./supabase-ca.crt').toString(),
        rejectUnauthorized: true
      }
    });
    
    const client1 = await pool1.connect();
    console.log('✅ SUCCESS: Connected with CA certificate');
    const res1 = await client1.query('SELECT NOW()');
    console.log('Server time:', res1.rows[0].now);
    client1.release();
    await pool1.end();
  } catch (err1) {
    console.error('❌ FAILED: CA certificate connection failed:', err1.message);
    
    try {
      // Try with SSL disabled
      console.log('\nAttempt 2: With SSL disabled');
      const pool2 = new Pool({
        host,
        user,
        password,
        database,
        port: 5432,
        ssl: {
          rejectUnauthorized: false
        }
      });
      
      const client2 = await pool2.connect();
      console.log('✅ SUCCESS: Connected with SSL disabled');
      const res2 = await client2.query('SELECT NOW()');
      console.log('Server time:', res2.rows[0].now);
      client2.release();
      await pool2.end();
    } catch (err2) {
      console.error('❌ FAILED: SSL disabled connection failed:', err2.message);
      
      try {
        // Try direct with connection string
        console.log('\nAttempt 3: With connection string');
        const pool3 = new Pool({
          connectionString,
          ssl: {
            rejectUnauthorized: false
          }
        });
        
        const client3 = await pool3.connect();
        console.log('✅ SUCCESS: Connected with connection string');
        const res3 = await client3.query('SELECT NOW()');
        console.log('Server time:', res3.rows[0].now);
        client3.release();
        await pool3.end();
      } catch (err3) {
        console.error('❌ FAILED: Connection string connection failed:', err3.message);
        console.error('All connection attempts failed');
      }
    }
  }
}

testDatabaseConnection().catch(err => {
  console.error('Test failed with error:', err);
});
