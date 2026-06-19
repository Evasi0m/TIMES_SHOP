import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export function createPosServiceClient(): SupabaseClient | null {
  const url = Deno.env.get('POS_SUPABASE_URL') || 'https://pxenybeudcsddsnkduaj.supabase.co';
  const key = Deno.env.get('POS_SERVICE_ROLE_KEY') || '';
  if (!key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function posNotConfiguredResponse() {
  return {
    ok: false as const,
    error: 'bridge_not_configured',
    message: 'ยังไม่ได้ตั้งค่า POS_SERVICE_ROLE_KEY บน Shop project',
  };
}
