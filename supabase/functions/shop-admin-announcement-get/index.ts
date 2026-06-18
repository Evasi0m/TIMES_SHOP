import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAdmin } from '../_shared/auth.ts';
import { toAdminAnnouncementItem, type AnnouncementItemRow } from '../_shared/announcement.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const db = createServiceClient();
  const { data: settings, error: sErr } = await db
    .from('shop_settings')
    .select('announcement_enabled')
    .eq('id', 1)
    .single();
  if (sErr) return jsonResponse({ ok: false, error: 'db_error', message: sErr.message });

  const { data: items, error: iErr } = await db
    .from('shop_announcement_items')
    .select('id, text, link_url, sort_order, is_active')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (iErr) return jsonResponse({ ok: false, error: 'db_error', message: iErr.message });

  return jsonResponse({
    ok: true,
    enabled: Boolean(settings.announcement_enabled),
    items: ((items ?? []) as AnnouncementItemRow[]).map(toAdminAnnouncementItem),
  });
});
