import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://amjdravcumckikfadlwb.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtamRyYXZjdW1ja2lrZmFkbHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMzk3NTksImV4cCI6MjA2MzYxNTc1OX0.7eshJ6gAEQLwZAVuDed2Qg0zqUdYoLzN9Hmw2Gg2mIk';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);