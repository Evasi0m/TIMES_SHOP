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
    const page = Math.max(1, Number(body.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(body.page_size) || 50));
    const q = String(body.q || '').trim();
    const offset = (page - 1) * pageSize;

    let query = supa
      .from('storefront_products')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (q) {
      query = query.or(`product_name.ilike.%${q}%,sku_name.ilike.%${q}%,seller_sku.ilike.%${q}%`);
    }

    const { data, error, count } = await query;
    if (error) return json({ ok: false, error: 'db_error', message: error.message });

    return json({
      ok: true,
      items: (data || []).map((r) => ({
        tiktok_sku_id: r.tiktok_sku_id,
        tiktok_product_id: r.tiktok_product_id,
        product_name: r.product_name,
        sku_name: r.sku_name,
        unit_price: Number(r.unit_price),
        stock_available: Number(r.stock_available),
        is_published: r.is_published,
        deleted_at: r.deleted_at,
        units_sold: Number(r.units_sold) || 0,
      })),
      total: count ?? 0,
      page,
      page_size: pageSize,
    });
  } catch (e) {
    return json({ ok: false, error: 'server_error', message: e instanceof Error ? e.message : 'list failed' });
  }
});
