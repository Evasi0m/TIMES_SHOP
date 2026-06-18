import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAdmin } from '../_shared/auth.ts';
import {
  toAdminBlock,
  validateBlock,
  type HomepageBlockInput,
  type HomepageBlockRow,
} from '../_shared/homepage.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const body = await readJson<{ blocks?: HomepageBlockInput[] }>(req);
  const rawBlocks = Array.isArray(body.blocks) ? body.blocks : [];

  const validated = [];
  for (let i = 0; i < rawBlocks.length; i++) {
    const result = validateBlock(rawBlocks[i], i);
    if (!result.ok) return jsonResponse({ ok: false, error: 'validation_failed', message: result.message });
    validated.push(result);
  }

  const db = createServiceClient();
  const { data: existing, error: listErr } = await db.from('shop_homepage_blocks').select('id');
  if (listErr) return jsonResponse({ ok: false, error: 'db_error', message: listErr.message });

  const existingIds = new Set((existing ?? []).map((r) => r.id));
  const keepIds = new Set<string>();
  const savedRows: HomepageBlockRow[] = [];

  for (const block of validated) {
    const row = {
      kind: block.kind,
      title: block.title,
      config: block.config,
      sort_order: block.sort_order,
      is_active: block.is_active,
      updated_at: new Date().toISOString(),
    };

    if (block.id && existingIds.has(block.id)) {
      const { data, error } = await db
        .from('shop_homepage_blocks')
        .update(row)
        .eq('id', block.id)
        .select('id, kind, title, config, sort_order, is_active')
        .single();
      if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
      keepIds.add(data.id);
      savedRows.push(data as HomepageBlockRow);
      continue;
    }

    const { data, error } = await db
      .from('shop_homepage_blocks')
      .insert(row)
      .select('id, kind, title, config, sort_order, is_active')
      .single();
    if (error) return jsonResponse({ ok: false, error: 'db_error', message: error.message });
    keepIds.add(data.id);
    savedRows.push(data as HomepageBlockRow);
  }

  const deleteIds = (existing ?? []).map((r) => r.id).filter((id) => !keepIds.has(id));
  if (deleteIds.length) {
    const { error: delErr } = await db.from('shop_homepage_blocks').delete().in('id', deleteIds);
    if (delErr) return jsonResponse({ ok: false, error: 'db_error', message: delErr.message });
  }

  savedRows.sort((a, b) => a.sort_order - b.sort_order);

  return jsonResponse({
    ok: true,
    blocks: savedRows.map(toAdminBlock),
  });
});
