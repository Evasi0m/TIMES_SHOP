import { createClient } from '@supabase/supabase-js';
import { POS_SUPABASE_ANON_KEY, POS_SUPABASE_URL } from './config.js';

// POS anon client — catalog Edge Functions only. No auth session (SECURITY.md S2).
export const posSupabase = createClient(
  POS_SUPABASE_URL || 'http://localhost',
  POS_SUPABASE_ANON_KEY || 'pos-anon-placeholder',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);
