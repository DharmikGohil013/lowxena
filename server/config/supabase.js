import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import memoryClient from './memoryDb.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let realSupabase = null;
let realAdmin = null;
let usingMemory = false;

if (supabaseUrl && supabaseAnonKey) {
  realSupabase = createClient(supabaseUrl, supabaseAnonKey);
  realAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : realSupabase;
}

// Exported references — will be swapped to memoryClient if Supabase is unreachable
export let supabase = realSupabase || memoryClient;
export let supabaseAdmin = realAdmin || memoryClient;

// Test connection and auto-fallback
export async function testConnection() {
  if (!realSupabase) {
    console.warn('⚠️  No Supabase credentials — using in-memory database');
    usingMemory = true;
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const { error } = await realSupabase.from('users').select('count').limit(1);
    clearTimeout(timeout);

    if (error) throw error;
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.warn('⚠️  Supabase unreachable:', error.message);
    console.warn('⚠️  Falling back to in-memory database (data will not persist across restarts)');
    supabase = memoryClient;
    supabaseAdmin = memoryClient;
    usingMemory = true;
    return false;
  }
}

export function isUsingMemory() {
  return usingMemory;
}

export default supabase;
