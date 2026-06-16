import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { getUser, requireAdmin } from '../_shared/auth.ts';
import { createPosServiceClient, posNotConfiguredResponse } from '../_shared/pos-client.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const pos = createPosServiceClient();
  if (!pos) return jsonResponse(posNotConfiguredResponse());

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: orders, error } = await pos
    .from('sale_orders')
    .select('id, status, grand_total, payment_method, payment_slip_status, sale_date')
    .eq('channel', 'web')
    .gte('sale_date', since.toISOString());

  if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });

  const rows = orders || [];
  const pending = rows.filter((o) => o.status === 'pending').length;
  const active = rows.filter((o) => o.status === 'active').length;
  const revenue = rows
    .filter((o) => o.status !== 'voided')
    .reduce((s, o) => s + (Number(o.grand_total) || 0), 0);
  const slipsPending = rows.filter(
    (o) => o.payment_method === 'transfer' && o.payment_slip_status === 'pending_review',
  ).length;

  return jsonResponse({
    ok: true,
    stats: {
      orders_30d: rows.length,
      pending_orders: pending,
      active_orders: active,
      revenue_30d: revenue,
      slips_pending: slipsPending,
    },
  });
});
