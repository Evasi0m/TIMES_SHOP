import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient } from '../_shared/auth.ts';
import { toClientAnnouncementItem, type AnnouncementItemRow } from '../_shared/announcement.ts';
import { handleOptions, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const db = createServiceClient();
  const { data: settings, error: sErr } = await db.from('shop_settings').select('*').eq('id', 1).single();
  if (sErr) return jsonResponse({ ok: false, error: 'db_error', message: sErr.message });

  const { data: banks } = await db
    .from('shop_bank_accounts')
    .select('id, bank_name, account_number, account_name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const enabled = Boolean(settings.announcement_enabled);
  let announcementItems: ReturnType<typeof toClientAnnouncementItem>[] = [];

  if (enabled) {
    const { data: items, error: iErr } = await db
      .from('shop_announcement_items')
      .select('id, text, link_url, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (iErr) return jsonResponse({ ok: false, error: 'db_error', message: iErr.message });
    announcementItems = ((items ?? []) as AnnouncementItemRow[]).map(toClientAnnouncementItem);
  }

  return jsonResponse({
    ok: true,
    shipping_fee: Number(settings.shipping_fee),
    shipping_label: settings.shipping_label,
    bank_accounts: banks ?? [],
    announcement: {
      enabled: enabled && announcementItems.length > 0,
      items: enabled ? announcementItems : [],
    },
    store: {
      profile_image_url: settings.profile_image_url ? String(settings.profile_image_url).trim() : null,
      cover_image_url: settings.cover_image_url ? String(settings.cover_image_url).trim() : null,
      units_sold_display:
        settings.units_sold_display != null ? Number(settings.units_sold_display) : null,
      name: 'TIMES STORE',
    },
  });
});
