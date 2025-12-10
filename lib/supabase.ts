import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only create client if we have valid credentials
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

// Server-side client with service role for admin operations
// IMPORTANT: Reads env vars at runtime for serverless compatibility
export function createServerSupabaseClient() {
  // Read env vars INSIDE the function to ensure they're available in serverless
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceKey) {
    console.error('Supabase env vars missing:', {
      hasUrl: !!url,
      hasServiceKey: !!serviceKey,
      url: url ? url.substring(0, 30) + '...' : 'undefined'
    });
    return null;
  }
  
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}
