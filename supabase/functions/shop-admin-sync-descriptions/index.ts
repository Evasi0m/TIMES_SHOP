import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getUser, requireAdmin } from '../_shared/auth.ts';
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts';
import { backfillParsedSpecsBatch } from '../_shared/product-description.ts';
import { syncDescriptionBatch } from '../_shared/product-description-sync.ts';

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const user = await getUser(req);
  const denied = requireAdmin(user);
  if (denied) return jsonResponse(denied);

  const body = await readJson<{
    batch_size?: number;
    delay_ms?: number;
    backfill_parsed_specs?: boolean;
  }>(req);
  const db = createServiceClient();

  try {
    if (body.backfill_parsed_specs) {
      const result = await backfillParsedSpecsBatch(db, body.batch_size);
      return jsonResponse(result);
    }

    const result = await syncDescriptionBatch(db, {
      batchSize: body.batch_size,
      delayMs: body.delay_ms,
    });
    return jsonResponse(result);
  } catch (e) {
    return jsonResponse({
      ok: false,
      error: 'server_error',
      message: e instanceof Error ? e.message : 'sync failed',
    });
  }
});
