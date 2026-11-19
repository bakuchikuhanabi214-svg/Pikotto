import { json, cleanId, readJson, sha256, cleanSnap, getPet } from '../../_lib/util.js';
// GET：ともだち用に その子の 情報を かえす（あいことば は かえさない）
export async function onRequestGet({ params, env }) {
  const id = cleanId(params.id); if (!id) return json({ ok: false, error: 'bad_id' }, 400);
  const p = await getPet(env, id); if (!p) return json({ ok: false, error: 'not_found' }, 404);
  const { tokenHash, ...pub } = p;
  return json({ ok: true, pet: pub });
}
// PUT：じぶんの子の 情報を ほぞん（はじめて ほぞんした人の あいことば と一致したときだけ 上書きできる）
export async function onRequestPut({ params, request, env }) {
  const id = cleanId(params.id); if (!id) return json({ ok: false, error: 'bad_id' }, 400);
  let b; try { b = await readJson(request, 20000); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  if (!/^[0-9a-f]{32}$/.test(b.token || '')) return json({ ok: false, error: 'bad_token' }, 400);
  const tokenHash = await sha256(b.token);
  const old = await getPet(env, id);
  if (old && old.tokenHash !== tokenHash) return json({ ok: false, error: 'forbidden' }, 403);
  const pet = { id, ...cleanSnap(b), tokenHash, updated: Date.now() };
  await env.PETS.put('pet:' + id, JSON.stringify(pet));
  return json({ ok: true });
}
