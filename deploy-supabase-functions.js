import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function deployFunctions() {
  try {
    console.log('Reading SQL functions file...');
    const sql = fs.readFileSync('./supabase-functions.sql', 'utf8');
    
    // Split the SQL file by functions
    const functions = sql.split('CREATE OR REPLACE FUNCTION');
    
    // Process the first part (extensions)
    if (functions[0].trim()) {
      console.log('Deploying extensions and setup...');
      const { error } = await supabase.rpc('execute_sql', { 
        query_text: functions[0] 
      });
      
      if (error) {
        console.error('Error deploying extensions:', error);
      } else {
        console.log('Extensions deployed successfully');
      }
    }
    
    // Process each function
    for (let i = 1; i < functions.length; i++) {
      const functionBody = 'CREATE OR REPLACE FUNCTION' + functions[i];
      const functionName = functionBody.match(/FUNCTION\s+([^\s(]+)/)[1];
      
      console.log(`Deploying function: ${functionName}...`);
      
      const { error } = await supabase.rpc('execute_sql', { 
        query_text: functionBody 
      });
      
      if (error) {
        console.error(`Error deploying function ${functionName}:`, error);
      } else {
        console.log(`Function ${functionName} deployed successfully`);
      }
    }
    
    console.log('All functions deployed!');
  } catch (error) {
    console.error('Deployment error:', error);
    process.exit(1);
  }
}

// Run the deployment
deployFunctions();
