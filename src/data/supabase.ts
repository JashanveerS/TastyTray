import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xndknyhedznqxhraomtq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZGtueWhlZHpucXhocmFvbXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTYyODksImV4cCI6MjA2ODg3MjI4OX0.zqkFk0Sz9vF5jQJNanuFRWDdlCtpmh10xYhyYhju6Y0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
