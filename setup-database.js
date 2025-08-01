// Node.js script to check and setup Supabase database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndSetupDatabase() {
  console.log('🔍 Checking Supabase database setup...');
  
  try {
    // Test connection
    console.log('Testing connection...');
    const { data, error } = await supabase.from('favorites').select('count', { count: 'exact' });
    
    if (error) {
      console.log('❌ Database connection error:', error.message);
      
      if (error.message.includes('relation "public.favorites" does not exist')) {
        console.log('🔧 Tables don\'t exist. Please run the supabase-schema.sql file in your Supabase SQL editor.');
        console.log('📄 The schema file is: supabase-schema.sql');
        console.log('');
        console.log('Steps:');
        console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Copy and paste the contents of supabase-schema.sql');
        console.log('5. Run the SQL commands');
      }
      
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Check each table
    const tables = ['favorites', 'meal_plans', 'pantry_items', 'shopping_list'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count', { count: 'exact' });
        if (error) {
          console.log(`❌ Table ${table} error:`, error.message);
        } else {
          console.log(`✅ Table ${table} exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table ${table} check failed:`, err.message);
      }
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Setup check failed:', err.message);
    return false;
  }
}

checkAndSetupDatabase().then((success) => {
  if (success) {
    console.log('🎉 Database setup check completed successfully!');
  } else {
    console.log('❌ Database setup needs attention. See messages above.');
  }
  process.exit(success ? 0 : 1);
});
