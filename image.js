// サーバーで絵を描いて PNG にする（Canvas がない環境用の小さな実装）
import { renderRoom, SPR } from './render.js';

// ---- 色のよみとり（#rgb / #rrggbb / rgb() / rgba() / hsl()）
const cache = new Map();
function hsl2rgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
export function parseColor(v) {
  if (cache.has(v)) return cache.get(v);
  let c = [0, 0, 0, 1], m;
  const s = String(v).trim();
  if (s[0] === '#') {
    const h = s.length === 4 ? s.slice(1).split('').map(x => x + x).join('') : s.slice(1, 7);
    c = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  } else if ((m = /^rgba?\(([^)]+)\)/.exec(s))) {
    const p = m[1].split(',').map(x => parseFloat(x));
    c = [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  } else if ((m = /^hsl\(([^)]+)\)/.exec(s))) {
    const p = m[1].split(',').map(x => parseFloat(x));
    c = [...hsl2rgb(p[0], p[1], p[2]), 1];
  }
  cache.set(v, c);
  return c;
}

// ---- 1色ずつ塗れる 画面（canvas の fillRect だけをまねる）
export class Surface {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Float32Array(w * h * 3); this.c = [0, 0, 0, 1]; }
  set fillStyle(v) { this.c = parseColor(v); }
  get fillStyle() { return ''; }
  clearRect() {}
  fillRect(x, y, w, h) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const [r, g, b, a] = this.c, d = this.d;
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++)
      for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) {
        const k = (j * this.w + i) * 3;
        if (a >= 1) { d[k] = r; d[k + 1] = g; d[k + 2] = b; }
        else { d[k] = d[k] * (1 - a) + r * a; d[k + 1] = d[k + 1] * (1 - a) + g * a; d[k + 2] = d[k + 2] * (1 - a) + b * a; }
      }
  }
}

// ---- PNG（パレット形式：色が256色以下なら小さく・速くなる）
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const out = new Uint8Array(12 + data.length), dv = new DataView(out.buffer);
  dv.setUint32(0, data.length); for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8); dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}
async function deflate(raw) {
  const cs = new CompressionStream('deflate');
  const stream = new Blob([raw]).stream().pipeThrough(cs);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
export async function encodePNG(w, h, rgb) {  // rgb: Uint8Array (w*h*3)
  const pal = new Map(), idx = new Uint8Array(w * h);
  let indexed = true;
  for (let p = 0; p < w * h && indexed; p++) {
    const key = (rgb[p * 3] << 16) | (rgb[p * 3 + 1] << 8) | rgb[p * 3 + 2];
    let n = pal.get(key);
    if (n === undefined) { n = pal.size; if (n >= 256) { indexed = false; break; } pal.set(key, n); }
    idx[p] = n;
  }
  const bpp = indexed ? 1 : 3, raw = new Uint8Array(h * (w * bpp + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * bpp + 1)] = 0;
    if (indexed) raw.set(idx.subarray(y * w, (y + 1) * w), y * (w + 1) + 1);
    else raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (w * 3 + 1) + 1);
  }
  const ihdr = new Uint8Array(13), dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w); dv.setUint32(4, h); ihdr[8] = 8; ihdr[9] = indexed ? 3 : 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr)];
  if (indexed) { const plte = new Uint8Array(pal.size * 3); for (const [k, n] of pal) { plte[n * 3] = k >> 16; plte[n * 3 + 1] = (k >> 8) & 255; plte[n * 3 + 2] = k & 255; } parts.push(chunk('PLTE', plte)); }
  parts.push(chunk('IDAT', await deflate(raw)), chunk('IEND', new Uint8Array(0)));
  const total = parts.reduce((a, p) => a + p.length, 0), out = new Uint8Array(total);
  let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

// ---- X（Twitter）用カード画像 800x420：へやの絵を6倍にして、まわりを その子の色で かざる
export async function renderCard(snap) {
  const room = new Surface(64, 64);
  const G = renderRoom(snap, room);
  const W = 800, H = 420, SC = 6, ox = 208, oy = 18;
  const out = new Uint8Array(W * H * 3);
  const put = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const k = (y * W + x) * 3; out[k] = c[0]; out[k + 1] = c[1]; out[k + 2] = c[2]; };
  const rect = (x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(i, j, c); };
  const bg = parseColor(`hsl(${G.hue},55%,90%)`).map(Math.round), dot = parseColor(`hsl(${G.hue},55%,82%)`).map(Math.round);
  const ink = parseColor('#3a2b3f'), shadow = parseColor(`hsl(${G.hue},35%,72%)`).map(Math.round);
  rect(0, 0, W, H, bg);
  for (let y = 10; y < H; y += 36) for (let x = ((y / 36) % 2) * 18 + 10; x < W; x += 36) rect(x, y, 6, 6, dot);
  rect(ox - 6 + 10, oy - 6 + 10, 64 * SC + 12, 64 * SC + 12, shadow);
  rect(ox - 6, oy - 6, 64 * SC + 12, 64 * SC + 12, ink);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const k = (y * 64 + x) * 3, c = [room.d[k] | 0, room.d[k + 1] | 0, room.d[k + 2] | 0];
    rect(ox + x * SC, oy + y * SC, SC, SC, c);
  }
  // ハートの かざり
  const heart = SPR.heart, hc = parseColor('#ff6f9a'), hc2 = parseColor(`hsl(${G.ahue},70%,70%)`).map(Math.round);
  [[60, 70, 8, hc], [110, 300, 6, hc2], [650, 90, 7, hc2], [690, 290, 9, hc]].forEach(([x, y, s, c]) =>
    heart.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') rect(x + i * s, y + j * s, s, s, c); })));
  return encodePNG(W, H, out);
}
