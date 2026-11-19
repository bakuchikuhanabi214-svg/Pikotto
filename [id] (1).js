import { cleanId, getPet, esc, fmtId } from '../_lib/util.js';
const STAGE = { baby: 'あかちゃん', child: 'こども', adult: 'おとな' };
// /p/<ID> ：Xで シェアされる その子の ページ（カード画像つき）
export async function onRequestGet({ params, env, request }) {
  const id = cleanId(params.id);
  const pet = id && env.PETS ? await getPet(env, id) : null;
  if (!pet) return Response.redirect(new URL('/', request.url).toString(), 302);
  const url = new URL(request.url), v = (url.searchParams.get('v') || '').replace(/[^0-9a-z]/g, '').slice(0, 12);
  const origin = url.origin, img = `${origin}/og/${id}.png${v ? '?v=' + v : ''}`, page = `${origin}/p/${id}`;
  const name = esc(pet.name), no = fmtId(id);
  const title = `${name}（No.${no}）｜ぴこっと`;
  const desc = `せかいに1ぴきだけの ドットのいきもの「${name}」。${STAGE[pet.stage] || ''}・${pet.gen > 1 ? pet.gen + 'だいめ・' : ''}いっしょに${pet.days}日。ぴこっとで 毎日そだてています。`;
  const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="description" content="${desc}"><meta name="robots" content="noindex,follow">
<link rel="canonical" href="${page}">
<meta property="og:type" content="website"><meta property="og:site_name" content="ぴこっと｜宵宮ゲームズ"><meta property="og:url" content="${page}">
<meta property="og:title" content="${title}"><meta property="og:description" content="${desc}">
<meta property="og:image" content="${img}"><meta property="og:image:width" content="800"><meta property="og:image:height" content="420">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@EMOJICLASHoff"><meta name="twitter:image" content="${img}">
<link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet">
<style>body{margin:0;background:#2a2440;color:#3a2b3f;font-family:"DotGothic16",sans-serif;display:flex;justify-content:center;padding:20px 12px}
.c{width:min(100%,560px);background:#f6e7d0;border:4px solid #3a2b3f;border-radius:20px;padding:16px;box-shadow:0 8px 0 #15121f;text-align:center}
img{width:100%;border:3px solid #3a2b3f;border-radius:12px;image-rendering:pixelated;display:block}
h1{font-size:28px;margin:14px 0 2px;font-weight:normal}.no{display:inline-block;background:#3a2b3f;color:#ffd36e;border-radius:8px;padding:4px 10px;margin:6px 0}
p{font-size:14px;line-height:1.7;margin:8px 0}.b{display:block;margin:16px auto 4px;background:#ffd36e;border:3px solid #3a2b3f;border-radius:12px;padding:14px;font-size:18px;color:#3a2b3f;text-decoration:none;box-shadow:0 4px 0 #3a2b3f}</style>
</head><body><div class="c"><img src="${img}" alt="${name}"><h1>${name}</h1><div class="no">No.${no}</div>
<p>${STAGE[pet.stage] || ''}${pet.gen > 1 ? '・' + pet.gen + 'だいめ' : ''}・いっしょに${pet.days}日</p>
<p>見た目が 完全ランダムの「せかいに1ぴきだけ」の いきもの。<br>毎日 会いにいくと、ことばや 名前を 覚えていきます。</p>
<a class="b" href="/">▶ ぴこっとで じぶんだけの子を そだてる</a></div></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
