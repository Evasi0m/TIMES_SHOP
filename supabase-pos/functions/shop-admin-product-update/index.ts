import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const supa = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const body = await req.json().catch(() => ({}));
    const skuId = String(body.tiktok_sku_id || '');
    if (!skuId) {
      return json({ ok: false, error: 'validation_failed', message: 'ไม่พบ SKU' });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.is_published != null) patch.is_published = Boolean(body.is_published);
    if (body.soft_delete === true) patch.deleted_at = new Date().toISOString();
    if (body.restore === true) patch.deleted_at = null;

    const { data, error } = await supa
      .from('storefront_products')
      .update(patch)
      .eq('tiktok_sku_id', skuId)
      .select('tiktok_sku_id, is_published, deleted_at')
      .single();

    if (error) return json({ ok: false, error: 'db_error', message: error.message });
    return json({ ok: true, product: data });
  } catch (e) {
    return json({ ok: false, error: 'server_error', message: e instanceof Error ? e.message : 'update failed' });
  }
});
