import { cors, json } from '../_lib/util.js';
// /api/* 共通：CORS（アプリ版から呼べるように）・KVの確認・エラー処理
export async function onRequest(ctx) {
  if (ctx.request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (!ctx.env.PETS) return json({ ok: false, error: 'kv_not_bound' }, 503);
  try { return await ctx.next(); }
  catch (e) { return json({ ok: false, error: e.message === 'too_big' ? 'too_big' : 'server' }, e.message === 'too_big' ? 413 : 500); }
}
