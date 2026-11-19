import { cleanId, getPet } from '../_lib/util.js';
import { renderCard } from '../_lib/image.js';
// /og/<ID>.png?v=… ：X のカードに出る その子の絵
export async function onRequestGet(ctx) {
  const { params, env, request } = ctx;
  const id = cleanId(String(params.file || '').replace(/\.png$/i, ''));
  if (!id || !env.PETS) return new Response('not found', { status: 404 });
  const cache = caches.default, key = new Request(new URL(request.url).toString(), { method: 'GET' });
  const hit = await cache.match(key); if (hit) return hit;
  const pet = await getPet(env, id);
  if (!pet) return new Response('not found', { status: 404 });
  const png = await renderCard(pet);
  const res = new Response(png, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' } });
  ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}
