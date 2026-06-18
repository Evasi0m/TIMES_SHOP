import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAdmin } from '../_shared/auth.ts';
import {
  toAdminAnnouncementItem,
  validateAnnouncementItem,
  type AnnouncementItemInput,
  type AnnouncementItemRow,
} from '../_shared/announcement.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const body = await readJson<{ enabled?: boolean; items?: AnnouncementItemInput[] }>(req);
  const enabled = Boolean(body.enabled);
  const rawItems = Array.isArray(body.items) ? body.items : [];

  const validated = [];
  for (let i = 0; i < rawItems.length; i++) {
    const result = validateAnnouncementItem(rawItems[i], i);
    if (!result.ok) return jsonResponse({ ok: false, error: 'validation_failed', message: result.message });
    validated.push(result);
  }

  const db = createServiceClient();

  const { error: settingsErr } = await db
    .from('shop_settings')
    .update({ announcement_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('id', 1);
  if (settingsErr) return jsonResponse({ ok: false, error: 'db_error', message: settingsErr.message });

  const { data: existing, error: listErr } = await db.from('shop_announcement_items').select('id');
  if (listErr) return jsonResponse({ ok: false, error: 'db_error', message: listErr.message });

  const existingIds = new Set((existing ?? []).map((r) => r.id));
  const keepIds = new Set<string>();
  const savedRows: AnnouncementItemRow[] = [];

  for (const item of validated) {
    const row = {
      text: item.text,
      link_url: item.link_url,
      sort_order: item.sort_order,
      is_active: item.is_active,
      updated_at: new Date().toISOString(),
    };

    if (item.id && existingIds.has(item.id)) {
      const { data, error } = await db
        .from('shop_announcement_items')
        .update(row)
        .eq('id', item.id)
        .select('id, text, link_url, sort_order, is_active')
        .single();
      if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
      keepIds.add(data.id);
      savedRows.push(data as AnnouncementItemRow);
      continue;
    }

    const { data, error } = await db
      .from('shop_announcement_items')
      .insert(row)
      .select('id, text, link_url, sort_order, is_active')
      .single();
    if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
    keepIds.add(data.id);
    savedRows.push(data as AnnouncementItemRow);
  }

  const deleteIds = (existing ?? []).map((r) => r.id).filter((id) => !keepIds.has(id));
  if (deleteIds.length) {
    const { error: delErr } = await db.from('shop_announcement_items').delete().in('id', deleteIds);
    if (delErr) return jsonResponse({ ok: false, error: 'db_error', message: delErr.message });
  }

  savedRows.sort((a, b) => a.sort_order - b.sort_order || a.text.localeCompare(b.text));

  return jsonResponse({
    ok: true,
    enabled,
    items: savedRows.map(toAdminAnnouncementItem),
  });
});
