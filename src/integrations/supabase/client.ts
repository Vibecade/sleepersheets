import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ohftphodcrmbazhbvtbt.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oZnRwaG9kY3JtYmF6aGJ2dGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0Njc0MDMsImV4cCI6MjA4MjA0MzQwM30.3ba6kozb4udsGA__D7oyI_gvFef8cQFvwd0kAdY6Mug';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);