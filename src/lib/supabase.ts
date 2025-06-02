import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

console.log(supabaseUrl, supabaseAnonKey)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? localStorage : undefined,
  },
  global: {
    headers: { 'x-application-owner': 'your-app-name' },
  },
  realtime: {
    params: {
      eventsPerSecond: 100, // Increase event throughput
    },
  },
});