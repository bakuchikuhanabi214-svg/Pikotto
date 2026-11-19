import { json, readJson } from '../../_lib/util.js';
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', DAYS = 30;
// ひきつぎコードを つくる（セーブデータを 30日間 あずかる）
export async function onRequestPost({ request, env }) {
  let b; try { b = await readJson(request, 400000); } catch (e) { return json({ ok: false, error: e.message === 'too_big' ? 'too_big' : 'bad_json' }, 400); }
  let data; try { data = JSON.parse(b.data); } catch { return json({ ok: false, error: 'bad_data' }, 400); }
  if (!data || !/^[0-9a-f]{12}$/.test(data.seed || '')) return json({ ok: false, error: 'bad_data' }, 400);
  const r = new Uint8Array(12); crypto.getRandomValues(r);
  const code = [...r].map(x => ABC[x % ABC.length]).join('');
  await env.PETS.put('bk:' + code, b.data, { expirationTtl: DAYS * 86400 });
  return json({ ok: true, code: code.match(/.{4}/g).join('-'), days: DAYS });
}
