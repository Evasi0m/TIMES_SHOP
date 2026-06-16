import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

export function createServiceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function createUserClient(authHeader: string | null): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  return createClient(url, anon, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const client = createUserClient(authHeader);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export function appRole(user: User | null): string {
  return (user?.app_metadata?.app_role as string) ?? '';
}

export function isShopAdmin(user: User | null): boolean {
  const role = appRole(user);
  return role === 'admin' || role === 'super_admin';
}

export function requireAuth(user: User | null) {
  if (!user) {
    return { ok: false as const, error: 'unauthorized', message: 'กรุณาเข้าสู่ระบบ' };
  }
  return null;
}

export function requireAdmin(user: User | null) {
  const authErr = requireAuth(user);
  if (authErr) return authErr;
  if (!isShopAdmin(user)) {
    return { ok: false as const, error: 'forbidden', message: 'ไม่มีสิทธิ์ admin' };
  }
  return null;
}
