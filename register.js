import { json, cleanId, readJson } from '../_lib/util.js';
// たまごが かえるとき：その すがた（look）が まだ だれにも いなければ 登録
export async function onRequestPost({ request, env }) {
  let b; try { b = await readJson(request, 2000); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  const id = cleanId(b.id), look = String(b.look || '');
  if (!id || !/^[0-9a-z._-]{10,200}$/.test(look)) return json({ ok: false, error: 'bad_request' }, 400);
  if (await env.PETS.get('look:' + look)) return json({ ok: false, reason: 'look_taken' });
  if (await env.PETS.get('id:' + id)) return json({ ok: false, reason: 'id_taken' });
  await env.PETS.put('look:' + look, id);
  await env.PETS.put('id:' + id, look);
  return json({ ok: true });
}
