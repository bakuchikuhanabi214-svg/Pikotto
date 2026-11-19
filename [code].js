import { json } from '../../_lib/util.js';
// ひきつぎコードで セーブデータを うけとる
export async function onRequestGet({ params, env }) {
  const code = String(params.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 12) return json({ ok: false, error: 'bad_code' }, 400);
  const data = await env.PETS.get('bk:' + code);
  if (!data) return json({ ok: false, error: 'not_found' }, 404);
  return json({ ok: true, data });
}
