// ぴこっと 重複チェック用 Cloudflare Worker
// KV ネームスペースを「PETS」という名前でバインドしてください。
// POST /register {id, look} → そのすがた(look)がまだ誰にもいなければ登録して {ok:true}
//                              すでにいれば {ok:false}（ゲーム側で自動的に引き直し）
export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(req.url);
    if (req.method !== 'POST' || url.pathname !== '/register') return new Response('not found', { status: 404, headers: cors });
    let body;
    try { body = await req.json(); } catch { return new Response('bad json', { status: 400, headers: cors }); }
    const { id, look } = body || {};
    if (!/^[0-9a-f]{12}$/.test(id || '') || !/^[0-9a-z._-]{10,200}$/.test(look || '')) {
      return new Response('bad request', { status: 400, headers: cors });
    }
    const json = o => new Response(JSON.stringify(o), { headers: { ...cors, 'Content-Type': 'application/json' } });
    if (await env.PETS.get('look:' + look)) return json({ ok: false, reason: 'look_taken' });
    if (await env.PETS.get('id:' + id)) return json({ ok: false, reason: 'id_taken' });
    await env.PETS.put('look:' + look, id);
    await env.PETS.put('id:' + id, look);
    return json({ ok: true });
  },
};
