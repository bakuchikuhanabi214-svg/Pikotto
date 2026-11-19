import { CLOTHES, STAGES, SHAPEN, PATN, EYEN, EARN, TAILN, ACCN } from './render.js';
export const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
export const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
export const cleanId = raw => { const s = String(raw || '').toLowerCase().replace(/[^0-9a-f]/g, ''); return /^[0-9a-f]{12}$/.test(s) ? s : null; };
export const fmtId = id => id.toUpperCase().match(/.{4}/g).join('-');
export const clip = (s, n) => [...String(s == null ? '' : s)].filter(c => c >= ' ').slice(0, n).join('');
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export async function sha256(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
export async function readJson(req, max = 20000) {
  const t = await req.text(); if (t.length > max) throw new Error('too_big');
  return JSON.parse(t);
}
export async function getPet(env, id) { const v = await env.PETS.get('pet:' + id); return v ? JSON.parse(v) : null; }

const inSet = (v, obj) => (typeof v === 'string' && Object.prototype.hasOwnProperty.call(obj, v)) ? v : undefined;
const num = (v, a, b) => (typeof v === 'number' && isFinite(v) && v >= a && v <= b) ? v : undefined;
const FURN = ['poster', 'cushion', 'lamp', 'rug'];
const MOUTHS = { small: 1, cat: 1, fang: 1, beak: 1 }, CHEEKS = { ff8fa8: 1, ffa66b: 1, '9fd6ff': 1, n: 1 };
// クライアントから来た情報を、ゆるされた形だけに整える
export function cleanSnap(b) {
  const wear = {};
  for (const slot of ['head', 'face', 'neck']) { const w = b.wear && b.wear[slot]; wear[slot] = (w && CLOTHES[w] && CLOTHES[w].slot === slot) ? w : null; }
  const furn = {}; for (const k of FURN) if (b.furn && b.furn[k] === true) furn[k] = true;
  let ov = null;
  if (b.ov && typeof b.ov === 'object') {
    const o = b.ov, c = {
      hue: num(o.hue, 0, 359), sat: num(o.sat, 30, 100), lig: num(o.lig, 40, 90), ahue: num(o.ahue, 0, 359),
      shape: inSet(o.shape, SHAPEN), ear: inSet(o.ear, EARN), eye: inSet(o.eye, EYEN), eyeGap: num(o.eyeGap, .2, .5),
      mouth: inSet(o.mouth, MOUTHS), pattern: inSet(o.pattern, PATN), stripeV: typeof o.stripeV === 'boolean' ? o.stripeV : undefined,
      cheek: inSet(o.cheek, CHEEKS), tail: inSet(o.tail, TAILN), acc: inSet(o.acc, ACCN),
    };
    ov = {}; for (const k in c) if (c[k] !== undefined) ov[k] = c[k];
  }
  return {
    name: clip(b.name, 8) || '？？？', stage: STAGES[b.stage] ? b.stage : 'baby', wear, furn, ov,
    gen: Math.min(999, Math.max(1, b.gen | 0)), days: Math.min(100000, Math.max(0, b.days | 0)),
    words: (Array.isArray(b.words) ? b.words : []).slice(-30).map(w => clip(w, 10)).filter(Boolean),
  };
}
