// ============================================================
//  自動生成ファイル（tools/build-render.py）。直接 編集しないでね。
//  ゲーム（www/index.html）と同じコードで キャラとへやを描きます。
// ============================================================
let ctx = null, S = {}, G = null, anim = null, mg = null, trip = null, reunion = null, visit = null;
let previewing = true, drawingFriend = false, extraDX = 0, particles = [], nextBlink = 1e15, awakeUntil = 0, eatFood = 'onigiri';
let petBox = {}, friendBox = {};
const now = () => Date.now();
const hour = () => 14;
const isNight = () => false;
function rng32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const SHAPEN = { round: 'まんまる', tall: 'のっぽ', wide: 'ずんぐり', pear: 'しずく', bean: 'おまめ' };
const PATN = { none: 'むじ', spots: 'ぶち', stripes: 'しましま', belly: 'おなかしろ', patch: 'かためぶち', socks: 'くつした', stars: 'ほしもよう' };
const EYEN = { dot: 'つぶらな目', tall: 'たて長の目', big: 'おおきな目', sleepy: 'ねむそうな目', sparkle: 'きらきらの目' };
const EARN = { cat: 'ねこみみ', bunny: 'うさみみ', round: 'まるいみみ', horn: 'ツノ', antenna: 'しょっかく', leaf: 'はっぱ' };
const TAILN = { none: 'なし', curl: 'くるくるしっぽ', spike: 'とげとげしっぽ', fluff: 'ふわふわしっぽ' };
const ACCN = { sprout: 'あたまの芽', crown: 'ちいさなかんむり', flower: 'お花', halo: 'てんしのわっか', bow: 'リボン', star: 'うかぶおほしさま' };
const OVK = ['hue', 'sat', 'lig', 'ahue', 'shape', 'ear', 'eye', 'eyeGap', 'mouth', 'pattern', 'stripeV', 'cheek', 'tail', 'acc'];
function makeGenes(seed, ov) {
  const r = rng32((parseInt(seed.slice(0, 8), 16) ^ Math.imul(parseInt(seed.slice(8), 16) + 1, 2654435761)) >>> 0);
  const ri = n => Math.floor(r() * n), pk = a => a[ri(a.length)];
  const hue = ri(72) * 5, sat = 55 + ri(4) * 10, lig = 62 + ri(3) * 6;
  const ahue = (hue + pk([30, 60, 150, 180, 210, 300])) % 360;
  const g = {
    hue, sat, lig, ahue,
    shape: pk(Object.keys(SHAPEN)), ear: pk(Object.keys(EARN)), eye: pk(Object.keys(EYEN)), eyeGap: 0.3 + ri(4) * 0.05,
    mouth: pk(['small', 'cat', 'fang', 'beak']), pattern: pk(Object.keys(PATN)), stripeV: r() < .5,
    cheek: pk(['ff8fa8', 'ffa66b', '9fd6ff', 'n']), tail: pk(Object.keys(TAILN)), acc: pk(Object.keys(ACCN)),
    voice: 520 + ri(10) * 40, spots: []
  };
  const n = 3 + ri(4);
  for (let i = 0; i < n; i++) g.spots.push([r() * 1.6 - .8, r() * 1.6 - .8, .14 + r() * .16]);
  if (ov) for (const k of OVK) if (ov[k] != null) g[k] = ov[k];   // 親から受けついだところ
  const H = g.hue, Sa = g.sat, L = g.lig, AH = g.ahue;
  g.pal = {
    b: `hsl(${H},${Sa}%,${L}%)`, s: `hsl(${H},${Sa}%,${L - 14}%)`, l: `hsl(${H},${Sa - 10}%,${Math.min(92, L + 16)}%)`,
    o: `hsl(${H},45%,22%)`, a: `hsl(${AH},${Sa}%,${L - 8}%)`, ao: `hsl(${AH},45%,25%)`
  };
  g.look = [H, Sa, L, AH, g.shape, g.ear, g.eye, Math.round(g.eyeGap * 100), g.mouth, g.pattern, g.stripeV ? 1 : 0, g.cheek, g.tail, g.acc,
    g.spots.map(s => s.map(v => Math.round(v * 5)).join('.')).join('_')].join('-');
  return g;
}
const CLOTHES = {
  straw:    { slot: 'head', name: 'むぎわらぼうし', price: 40, spr: ['...DDDDD...', '..DYYYYYD..', '..RRRRRRR..', 'DYYYYYYYYYD'], map: { D: '#c9a54a', Y: '#f2d17a', R: '#e05a5a' } },
  knit:     { slot: 'head', name: 'ニットぼう', price: 30, spr: ['....W....', '..CCCCC..', '.CCcCcCC.', '.CCCCCCC.', 'WWWWWWWWW'], map: { C: '#5a8de0', c: '#9fc2ff', W: '#ffffff' } },
  witch:    { slot: 'head', name: 'まじょのぼうし', price: 70, spr: ['......KK...', '.....KKK...', '....KKKK...', '...KKKKKK..', '...PPPPPP..', 'KKKKKKKKKKK'], map: { K: '#3b2a5c', P: '#ffcc33' } },
  silk:     { slot: 'head', name: 'シルクハット', price: 60, spr: ['..KKKKK..', '..KKKKK..', '..KKKKK..', '..KKKKK..', '..RRRRR..', 'KKKKKKKKK'], map: { K: '#2b2b33', R: '#ff4d6d' } },
  tiara:    { slot: 'head', name: 'ティアラ', price: 80, spr: ['...B...', '.Y.Y.Y.', 'YYYYYYY'], map: { B: '#5ab4ff', Y: '#ffd84d' } },
  phones:   { slot: 'head', name: 'ヘッドホン', price: 50, icon: ['.KKKKKK.', 'K......K', 'K......K', 'RR....RR', 'RR....RR'], imap: { K: '#3a3a48', R: '#ff5a7a' } },
  band:     { slot: 'head', name: 'はちまき', price: 20, icon: ['RRRRRRRR', 'RRRRRRRR', '......RR', '.......R'], imap: { R: '#ff4d4d' } },
  fcrown:   { slot: 'head', name: 'はなかんむり', rare: 'park', spr: ['P.Y.P.Y.P', 'GPGYGPGYG'], map: { P: '#ff8fc0', Y: '#ffe066', G: '#5fae55' } },
  shellpin: { slot: 'head', name: 'かいがらのかみかざり', rare: 'beach', spr: ['.SSS.', 'SsSsS', '.SSS.'], map: { S: '#ffc9b5', s: '#ff9e80' } },
  starpin:  { slot: 'head', name: 'ほしのかみかざり', rare: 'hill', spr: ['..Y..', '.YYY.', 'YYYYY', '.Y.Y.'], map: { Y: '#ffe066' } },
  santa:    { slot: 'head', name: 'サンタぼうし', limited: 'クリスマスのプレゼント', spr: ['......WW.', '.....RRW.', '....RRR..', '...RRRR..', '..RRRRR..', 'WWWWWWWWW'], map: { R: '#e8323c', W: '#ffffff' } },
  pumpkin:  { slot: 'head', name: 'かぼちゃぼうし', limited: 'ハロウィンのプレゼント', spr: ['....G....', '..OOOOO..', '.OOKOKOO.', '.OOOOOOO.', '..OKKKO..'], map: { G: '#4f9a47', O: '#ff9a2e', K: '#5a2a00' } },
  kohaku:   { slot: 'head', name: 'こうはくハチマキ', limited: 'おしょうがつのプレゼント', icon: ['RWRWRWRW', 'RWRWRWRW', '......RW', '.......R'], imap: { R: '#e8323c', W: '#ffffff' } },
  roundg:   { slot: 'face', name: 'まるメガネ', price: 30, icon: ['.GGG..GGG.', 'G...GG...G', 'G...G.G..G', '.GGG..GGG.'], imap: { G: '#c99a2e' } },
  sun:      { slot: 'face', name: 'サングラス', price: 40, icon: ['KKKKKKKKKK', 'KWKKKKWKKK', '.KKK..KKK.'], imap: { K: '#1d1b22', W: '#8a8aa0' } },
  heartg:   { slot: 'face', name: 'ハートメガネ', price: 50, icon: ['.P.P..P.P.', 'PPPPPPPPPP', '.PPP..PPP.', '..P....P..'], imap: { P: '#ff5c86' } },
  r100:     { slot: 'neck', name: 'きねんのリボン', limited: 'うまれて100日の記念', spr: ['YY.YY', 'YYRYY', 'YY.YY'], map: { Y: '#ffcc33', R: '#ff4d6d' } },
  bowtie:   { slot: 'neck', name: 'ちょうネクタイ', price: 25, spr: ['RR.RR', 'RRYRR', 'RR.RR'], map: { R: '#ff4d6d', Y: '#ffb3c1' } },
  scarf:    { slot: 'neck', name: 'スカーフ', price: 30, icon: ['BBBBBBBB', 'BBBBBBBB', '.....BB.', '.....BB.'], imap: { B: '#5ab4ff' } },
  bell:     { slot: 'neck', name: 'すず', price: 35, icon: ['RRRRRRRR', '...YY...', '..YYYY..', '..YKKY..'], imap: { R: '#e04848', Y: '#ffd84d', K: '#7a5a00' } },
  muffler:  { slot: 'neck', name: 'しましまマフラー', price: 45, icon: ['RWRWRWRW', 'RWRWRWRW', '..RW....', '..WR....'], imap: { R: '#ff6b6b', W: '#fff3e0' } },
};
const STAGES = { baby: { rx: 8, ry: 7, ears: 0, label: 'あかちゃん' }, child: { rx: 10, ry: 9, ears: 1, label: 'こども' }, adult: { rx: 12, ry: 10, ears: 2, label: 'おとな' } };
const P = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); };
const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
function sprite(rows, x, y, map, c2) {
  const g = c2 || ctx;
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const col = map[r[i]]; if (col) { g.fillStyle = col; g.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1); } } });
}
const SPR = {
  heart: ['.X.X.', 'XXXXX', '.XXX.', '..X..'],
  q: ['XXX', '..X', '.XX', '...', '.X.'],
  ex: ['X', 'X', 'X', '.', 'X'],
  z: ['XXX', '.X.', 'XXX'],
  note: ['.XX', '.X.', 'XX.'],
  spark: ['.X.', 'XXX', '.X.'],
  fruit: ['.G.', 'CCC', 'CCC'],
  star: ['.Y.', 'YYY', '.Y.'],
  rock: ['.KK.', 'KGGK', 'KGGK', '.KK.'],
  tail: {
    curl: ['..OO.', '.OBBO', 'OB.BO', 'OBBO.', '.OO..'],
    spike: ['OO...', 'OBOO.', 'OBBBO', 'OBOO.', 'OO...'],
    fluff: ['.OOO.', 'OLLLO', 'OLLLO', 'OLLLO', '.OOO.'],
  }
};
const FOODS = {
  onigiri: { name: 'おにぎり', price: 0, h: 35, m: 5, a: 1, note: 'いつでもタダ', spr: ['..K..', '.KWK.', 'KWWWK', 'KWWWK', 'KBBBK', '.KKK.'], map: { K: '#2b2b2b', W: '#fff', B: '#1f3b2a' } },
  apple:   { name: 'りんご', price: 8, h: 20, m: 12, a: 1, note: 'ごきげん少しアップ', spr: ['..G..', '.RRR.', 'RRWRR', 'RRRRR', '.RRR.'], map: { G: '#4f9a47', R: '#ff4d4d', W: '#ffc0c0' } },
  pudding: { name: 'プリン', price: 15, h: 15, m: 25, a: 2, note: 'ごきげん大きくアップ', spr: ['.CCC.', '.YYY.', 'YYYYY', 'YYYYY', 'PPPPP'], map: { C: '#8a4b1f', Y: '#ffe07a', P: '#c9c9d6' } },
  cake:    { name: 'ケーキ', price: 30, h: 30, m: 35, a: 4, note: 'なかよしもアップ', spr: ['..R..', 'WWWWW', 'SSSSS', 'WWWWW', 'SSSSS'], map: { R: '#ff3d5a', W: '#fffaf0', S: '#ffd98a' } },
  choco:   { name: 'ハートのチョコ', price: -1, h: 10, m: 30, a: 5, note: 'バレンタインのプレゼント', spr: ['.K.K.', 'KKKKK', 'KPKKK', '.KKK.', '..K..'], map: { K: '#6b3a1f', P: '#ffb3c8' } },
};
const GROUND = 54;
const EVENTS = [
  { id: 'xmas', name: 'クリスマス', on: (m, d) => m === 12 && d <= 25, gift: (m, d) => m === 12 && d >= 24, item: 'santa', coins: 30, msg: 'サンタさんからの プレゼント！', hello: '（へやが クリスマスのかざりで いっぱい！）' },
  { id: 'newyear', name: 'おしょうがつ', on: (m, d) => m === 1 && d <= 7, gift: () => true, item: 'kohaku', coins: 50, msg: 'おとしだま！', hello: '（あけまして おめでとう！ ことしも よろしくね）' },
  { id: 'valentine', name: 'バレンタイン', on: (m, d) => m === 2 && d >= 10 && d <= 14, gift: (m, d) => d === 14, food: 'choco', n: 3, msg: 'ハートのチョコを もらった！', hello: '（なんだか そわそわしている…）' },
  { id: 'halloween', name: 'ハロウィン', on: (m, d) => m === 10 && d >= 20, gift: (m, d) => d === 31, item: 'pumpkin', coins: 20, msg: 'トリック・オア・トリート！', hello: '（かぼちゃが いっぱい！）' },
];
function activeEvents() { const d = new Date(now()); const m = d.getMonth() + 1, dd = d.getDate(); return EVENTS.filter(e => e.on(m, dd)); }
function evOn(id) { return activeEvents().some(e => e.id === id); }
function giftKey(e) { return e.id + new Date(now()).getFullYear(); }
function pendingGift() {
  if (!S || S.stage === 'egg' || !S.player) return null;
  const d = new Date(now()), m = d.getMonth() + 1, dd = d.getDate();
  return activeEvents().find(e => e.gift(m, dd) && !(S.gifts || {})[giftKey(e)]) || null;
}
function skyColor() { const h = hour(); return isNight() ? '#141a33' : (h >= 17) ? '#ff9e6b' : (h < 9) ? '#bfe6ff' : '#8fd0ff'; }
function drawRoom(t) {
  const h = hour(), night = isNight(), eve = h >= 17 && h < 22;
  const wall = night ? '#2d3557' : eve ? '#f0c89a' : '#f3e3c3', wall2 = night ? '#262d4b' : eve ? '#e4b685' : '#e9d5ae';
  R(0, 0, 64, 44, wall);
  for (let x = 0; x < 64; x += 8) R(x, 0, 1, 44, wall2);
  const sky = skyColor();
  R(6, 8, 18, 14, '#6b4a33'); R(7, 9, 16, 12, sky);
  if (night) { P(10, 11, '#fff'); P(19, 13, '#fff'); P(14, 17, '#cfd8ff'); R(17, 10, 3, 3, '#fff6c4'); P(17, 10, sky); }
  else if (eve) R(10, 16, 4, 3, '#ffdd8a');
  else { R(18, 11, 3, 3, '#fff3a0'); R(9, 15, 5, 2, '#fff'); R(10, 14, 3, 1, '#fff'); }
  R(15, 9, 1, 12, '#6b4a33'); R(7, 15, 16, 1, '#6b4a33');
  if (S.furn.poster) { R(29, 7, 11, 12, '#5a4a3f'); R(30, 8, 9, 10, '#fffaf0'); sprite(['.BBB.', 'BBBBB', 'BOBOB', 'BBBBB', '.BBB.'], 32, 10, { B: G.pal.b, O: G.pal.o }); }
  R(50, 36, 6, 6, '#c0643f'); R(49, 35, 8, 2, '#d9774f');
  R(52, 30, 2, 5, '#4f9a47'); R(50, 30, 2, 2, '#62b35a'); R(54, 28, 2, 3, '#62b35a');
  drawEventWall(t, night);
  const floor = night ? '#4b3f57' : '#c98d55', floor2 = night ? '#3f354a' : '#b67b46';
  R(0, 44, 64, 20, floor);
  for (let y = 47; y < 64; y += 4) R(0, y, 64, 1, floor2);
  R(0, 44, 64, 1, night ? '#2a2236' : '#8d5c33');
  const blue = S.furn.rug;
  for (let x = 14; x < 50; x++) for (let y = 50; y < 60; y++) {
    const dx = (x + .5 - 32) / 18, dy = (y + .5 - 55) / 5, d = dx*dx + dy*dy;
    if (d > 1) continue;
    let c = blue ? ((x % 4 < 2) ? '#9fd0ff' : '#e6f4ff') : '#f0a0a0';
    if (d > .7) c = blue ? '#4f86c6' : '#e07a7a';
    if (night) c = d > .7 ? '#6a4f6e' : '#5b4560';
    P(x, y, c);
  }
  if (S.furn.cushion) sprite(['.CCCCCC.', 'CCDCCDCC', 'CCCCCCCC', '.DDDDDD.'], 2, 46, { C: G.pal.a, D: G.pal.ao });
  if (S.furn.lamp) {
    R(44, 0, 1, 6, '#3a2b3f');
    if (night) { ctx.fillStyle = 'rgba(255,230,120,.18)'; ctx.fillRect(38, 2, 13, 13); ctx.fillRect(40, 0, 9, 17); }
    sprite(['..Y..', '.YYY.', 'YYYYY', '.YYY.', '.Y.Y.'], 42, 6, { Y: night ? '#fff1a0' : '#ffd84d' });
  }
  drawEventFloor(t);
  if (!previewing) {
    if (pendingGift()) { const b = Math.floor(t / 400) % 2; sprite(['..YY..', 'RRYYRR', 'RRYYRR', 'RRYYRR', 'RRYYRR'], 4, 51 - b, { R: '#ff4d6d', Y: '#ffd84d' }); }
    if (S.egg) drawFamilyEgg(55, 46, S.egg, t);
  }
}
function drawFamilyEgg(x, y, egg, t) {
  const h = (egg.ov && egg.ov.hue != null) ? egg.ov.hue : 40, wob = Math.round(Math.sin(t / 500) * .6);
  sprite(['.KKK.', 'KWWWK', 'KWBWK', 'KBWBK', 'KWWWK', 'KWWWK', '.KKK.'], x + wob, y, { K: '#5a4a3f', W: '#fffaf0', B: `hsl(${h},65%,68%)` });
}
function drawEventWall(t, night) {
  if (evOn('xmas')) {
    for (let x = 0; x < 64; x++) { const y = 2 + Math.round(Math.sin(x / 5) * 1.2 + 1); P(x, y, '#2f8a3f'); if (x % 5 === 2) P(x, y + 1, ['#ff4d4d', '#ffd84d', '#5ab4ff'][(Math.floor(t / 500) + x) % 3]); }
    for (let i = 0; i < 10; i++) { const sx = 7 + ((i * 37 + Math.floor(t / 120)) % 16), sy = 9 + ((i * 13 + Math.floor(t / 90)) % 12); P(sx, sy, '#ffffff'); }
    // ツリー
    for (let i = 0; i < 16; i++) { const w = 1 + Math.floor((i % 6) * .8) + Math.floor(i / 6) * 2; R(53 - w, 26 + i, w * 2 + 1, 1, i % 6 === 5 ? '#2a7a38' : '#3f9a4a'); }
    R(52, 42, 3, 2, '#8a5a3a'); sprite(['.Y.', 'YYY', '.Y.'], 52, 23, { Y: '#ffe066' });
    [[51, 30], [55, 33], [50, 36], [56, 39], [53, 38], [48, 40]].forEach(([x, y], i) => P(x, y, ['#ff4d4d', '#ffd84d', '#5ab4ff', '#ff8fc0'][(i + Math.floor(t / 600)) % 4]));
  }
  if (evOn('newyear')) {
    for (const [bx, hgt] of [[50, 13], [53, 16], [56, 11]]) { R(bx, 42 - hgt, 2, hgt, '#4fae55'); P(bx, 42 - hgt, '#8fd88a'); R(bx, 38, 2, 1, '#2f7a3a'); }
    R(48, 40, 11, 3, '#d9b46a'); R(48, 41, 11, 1, '#b08a40');
    sprite(['R.R.R', 'RRRRR'], 30, 3, { R: '#e8323c' }); sprite(['W.W.W', 'WWWWW'], 35, 3, { W: '#ffffff' });
  }
  if (evOn('halloween')) {
    const b = Math.floor(t / 300) % 2;
    [[34, 6], [44, 10], [27, 12]].forEach(([x, y]) => sprite(b ? ['K.K.K', '.KKK.'] : ['.K.K.', 'KKKKK'], x, y, { K: night ? '#000000' : '#3a2b3f' }));
  }
  if (evOn('valentine')) {
    [[30, 6], [38, 10], [44, 5], [34, 14]].forEach(([x, y], i) => sprite(['X.X', 'XXX', '.X.'], x, y + (Math.floor(t / 600 + i) % 2), { X: i % 2 ? '#ff8fc0' : '#ff5c86' }));
  }
}
function drawEventFloor(t) {
  if (evOn('newyear')) sprite(['...O...', '..WWW..', '.WWWWW.', 'WWWWWWW', 'RRRRRRR', '.R...R.'], 2, 40, { O: '#ff9a2e', W: '#fffaf0', R: '#e8323c' });
  if (evOn('halloween')) sprite(['...G...', '.OOOOO.', 'OOYOYOO', 'OOOOOOO', 'OYYYYYO', '.OOOOO.'], 2, 41, { G: '#4f9a47', O: '#ff9a2e', Y: Math.floor(t / 400) % 2 ? '#ffe066' : '#ffb000' });
}
function drawPet(t) {
  const pal = G.pal, st = STAGES[S.stage];
  const p = anim ? (t - anim.start) / anim.dur : 0;
  const asleep = !previewing && !drawingFriend && !visit && !mg && !trip && !reunion && isNight() && Date.now() > awakeUntil;
  let squash = Math.sin(t / (asleep ? 900 : 320)) * (asleep ? .04 : .06);
  let jump = 0, dx = 0, face = null, mouth = null, tear = false, sparkleFace = false;
  if (anim && !previewing) {
    if (anim.type === 'jump') { jump = Math.sin(p * Math.PI) * 5; squash = -.08 * Math.sin(p * Math.PI); face = 'happy'; mouth = 'open'; }
    if (anim.type === 'eat') { face = p < .85 ? 'normal' : 'happy'; mouth = (Math.floor(t / 160) % 2) ? 'open' : 'line'; }
    if (anim.type === 'listen') { dx = Math.sin(p * Math.PI * 2); face = 'normal'; mouth = 'line'; }
    if (anim.type === 'grow') { squash = Math.sin(p * Math.PI * 8) * .12; face = 'happy'; mouth = 'open'; }
    if (anim.type === 'proud') { jump = Math.abs(Math.sin(p * Math.PI * 2)) * 3; face = 'happy'; mouth = 'smile'; }
  }
  if (mg && !drawingFriend) {
    dx = mg.x - 32;
    if (t < mg.stun) { face = 'sad'; mouth = 'frown'; dx += Math.sin(t / 30); }
    else if (t < mg.happy) { face = 'happy'; mouth = 'open'; jump = 2; }
  }
  if (trip && !drawingFriend) {
    dx = trip.x - 32;
    if (trip.digUntil > t) { squash = Math.sin(t / 60) * .1; face = 'happy'; mouth = 'line'; }
    else if (trip.moving) jump = Math.abs(Math.sin(t / 110)) * 1.6;
    if (trip.happy > t) { face = 'happy'; mouth = 'open'; jump = Math.max(jump, 3); }
  }
  if (reunion && !previewing && !drawingFriend) {
    const rt = t - reunion.start;
    if (reunion.phase === 'sad') { face = 'sad'; mouth = 'frown'; squash = .09; tear = true; }
    else if (reunion.phase === 'notice') { face = 'normal'; mouth = 'open'; jump = Math.min(1, rt / 150) * 2; }
    else { face = 'super'; mouth = 'big'; const ph = Math.abs(Math.sin(rt / 1000 * Math.PI * 2.4)); jump = ph * 8; squash = -.07 * ph + (ph < .15 ? .08 : 0); sparkleFace = true; }
  }
  dx += extraDX;
  let rx = st.rx * (1 + squash), ry = st.ry * (1 - squash);
  if (G.shape === 'tall') { rx *= .85; ry *= 1.12; }
  if (G.shape === 'wide') { rx *= 1.15; ry *= .88; }
  const cx = 32 + dx, cy = GROUND - ry - jump, top = cy - ry;

  const inBody = (x, y) => {
    let ex = (x + .5 - cx) / rx; const ey = (y + .5 - cy) / ry;
    if (G.shape === 'pear') ex /= (.78 + .2 * (ey + 1));
    if (G.shape === 'bean') return Math.abs(ex) ** 2.6 + Math.abs(ey) ** 2.6 <= 1;
    return ex*ex + ey*ey <= 1;
  };
  const inEar = (x, y) => {
    if (!st.ears) return 0;
    const X = x + .5, Y = y + .5;
    for (const s of [-1, 1]) {
      if (G.ear === 'cat') {
        const exc = cx + s * rx * .55, h = 3 + st.ears, yy = Y - (top - h + 2);
        if (yy >= 0 && yy <= h && Math.abs(X - exc) <= yy * .55 + .3) return (Math.abs(X - exc) < yy * .28 && yy > 1.5) ? 3 : 2;
      } else if (G.ear === 'bunny') {
        const exc = cx + s * rx * .32, h = 4 + st.ears * 2, yy = Y - (top - h + 2);
        if (yy >= 0 && yy <= h && Math.abs(X - exc) <= 1.4) return (Math.abs(X - exc) < .7 && yy > 1.2 && yy < h - 1) ? 3 : 2;
      } else if (G.ear === 'round') {
        const exc = cx + s * rx * .62, rr = 1.8 + st.ears * .5, ddx = X - exc, ddy = Y - (top + 1);
        if (ddx*ddx + ddy*ddy <= rr*rr) return 2;
      }
    }
    return 0;
  };
  const inside = (x, y) => inBody(x, y) ? 1 : inEar(x, y);

  for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (Math.abs(x + .5 - cx) / rx < .9) P(x, GROUND + 1, 'rgba(0,0,0,.18)');
  if (st.ears && G.tail !== 'none') sprite(SPR.tail[G.tail], cx + rx - 2, cy - 1 + Math.sin(t / 250) * .6, { O: pal.o, B: pal.b, L: pal.l });
  const footC = G.pattern === 'socks' ? pal.ao : pal.o;
  R(Math.round(cx - rx * .5) - 1, GROUND - 1, 3, 2, footC);
  R(Math.round(cx + rx * .5) - 1, GROUND - 1, 3, 2, footC);
  const earH = 4 + st.ears * 2;
  const x0 = Math.floor(cx - rx - 3), x1 = Math.ceil(cx + rx + 3), y0 = Math.floor(top - earH - 2), y1 = Math.ceil(cy + ry + 1);
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
    const v = inside(x, y); if (!v) continue;
    const edge = !inside(x+1, y) || !inside(x-1, y) || !inside(x, y+1) || !inside(x, y-1);
    let c = pal.b;
    if (edge) c = pal.o;
    else if (v === 3) c = '#ff9fb4';
    else if (v === 1) {
      const ex = (x + .5 - cx) / rx, ey = (y + .5 - cy) / ry;
      switch (G.pattern) {
        case 'spots': for (const s of G.spots) if ((ex - s[0]) ** 2 + (ey - s[1]) ** 2 < s[2] ** 2) c = pal.a; break;
        case 'stripes': if (G.stripeV ? (Math.floor((ex + 1) * 4) % 2 === 0 && ey < .2) : (Math.floor((ey + 1) * 4.5) % 2 === 0 && ey < .1)) c = pal.a; break;
        case 'belly': if ((ex / .55) ** 2 + ((ey - .42) / .5) ** 2 < 1) c = '#fff6e6'; break;
        case 'patch': if ((ex + .36) ** 2 + (ey + .1) ** 2 < .1) c = pal.a; break;
        case 'socks': if (ey > .62) c = pal.a; break;
      }
      if (c === pal.b) {
        if (ex * .8 + ey > .78) c = pal.s;
        else if (ex < -.25 && ey < -.35 && ex*ex + ey*ey < .62) c = pal.l;
      }
    }
    P(x, y, c);
  }
  if (G.pattern === 'stars') for (const s of G.spots) {
    const sx = Math.round(cx + s[0] * rx * .8), sy = Math.round(cy + s[1] * ry * .8);
    if (inBody(sx, sy)) { P(sx, sy, '#fff8b0'); if (s[2] > .22) { P(sx - 1, sy, '#fff8b0'); P(sx + 1, sy, '#fff8b0'); P(sx, sy - 1, '#fff8b0'); P(sx, sy + 1, '#fff8b0'); } }
  }
  if (st.ears) {
    if (G.ear === 'horn') for (const s of [-1, 1]) { const hx = Math.round(cx + s * rx * .4); sprite(st.ears > 1 ? ['.O.', 'OAO', 'OAO', 'OAO'] : ['.O.', 'OAO', 'OAO'], hx - 1, Math.round(top) - 1 - st.ears - 2, { O: pal.ao, A: pal.a }); }
    if (G.ear === 'antenna') for (const s of [-1, 1]) { const hx = Math.round(cx + s * 2.5), h = 2 + st.ears; R(hx, Math.round(top) - h, 1, h + 1, pal.o); R(hx - (s < 0 ? 1 : 0), Math.round(top) - h - 2, 2, 2, pal.a); }
    if (G.ear === 'leaf') { const tx = Math.round(cx); R(tx, Math.round(top) - 2, 1, 3, '#3f7a39'); sprite(st.ears > 1 ? ['.GGG', 'GGLG', 'GG..'] : ['.GG', 'GLG'], tx, Math.round(top) - 4 - st.ears, { G: '#5fae55', L: '#9ee08f' }); }
  }
  const hatOn = !!S.wear.head;
  if (S.stage === 'adult') {
    const tx = Math.round(cx), ty = Math.round(top);
    if (G.acc === 'sprout' && !hatOn) { R(tx, ty - 3, 1, 3, '#3f7a39'); R(tx - 2, ty - 4, 2, 2, '#62b35a'); R(tx + 1, ty - 5, 2, 2, '#7fcc6f'); }
    if (G.acc === 'crown' && !hatOn) sprite(['Y.Y.Y', 'YYYYY', 'YRYBY'], tx - 2, ty - 2, { Y: '#ffcc33', R: '#ff4d6d', B: '#5ab4ff' });
    if (G.acc === 'flower') sprite(['.P.', 'PYP', '.P.'], Math.round(cx + rx * .5), ty + 1, { P: pal.a, Y: '#ffe066' });
    if (G.acc === 'halo') sprite(['.YYYYY.', 'Y.....Y', '.YYYYY.'], tx - 3, ty - 9 + Math.round(Math.sin(t / 400)), { Y: '#ffe066' });
    if (G.acc === 'bow') sprite(['R...R', 'RRYRR', 'R...R'], Math.round(cx - rx * .6) - 2, ty + 1, { R: '#ff4d6d', Y: '#ffd0da' });
    if (G.acc === 'star') sprite(['..Y..', '.YYY.', 'YYYYY', '.Y.Y.'], tx + Math.round(rx * .6), ty - 8 + Math.round(Math.sin(t / 350) * 1.5), { Y: '#ffe066' });
  }
  // 顔
  if (!face) face = asleep ? 'sleep' : (S.hunger < 25 || S.mood < 25) ? 'sad' : 'normal';
  if (face === 'normal' && t > nextBlink && !previewing) { face = 'blink'; if (t > nextBlink + 130) nextBlink = t + 2200 + Math.random() * 2500; }
  if (!mouth) mouth = face === 'sad' ? 'frown' : face === 'sleep' ? 'line' : (S.mood > 70 ? 'smile' : 'line');
  const o = pal.o, ew = G.eye === 'big' ? 3 : 2;
  const exL = Math.round(cx - rx * G.eyeGap) - 1 - (ew - 2), exR = Math.round(cx + rx * G.eyeGap), ey = Math.round(cy - 1);
  for (const ex of [exL, exR]) {
    if (face === 'normal' || face === 'sad') {
      if (G.eye === 'dot') R(ex, ey + 1, 2, 2, o);
      else if (G.eye === 'big') { R(ex, ey, 3, 3, o); P(ex, ey, '#fff'); }
      else if (G.eye === 'sleepy') { R(ex, ey + 1, 2, 2, o); R(ex, ey + 1, 2, 1, pal.s); }
      else if (G.eye === 'sparkle') { R(ex, ey, 2, 3, o); P(ex, ey, '#fff'); P(ex + 1, ey + 2, '#fff'); }
      else { R(ex, ey, 2, 3, o); P(ex, ey, '#fff'); }
    } else if (face === 'blink' || face === 'sleep') R(ex, ey + 2, ew, 1, o);
    else if (face === 'happy') { P(ex, ey + 1, o); P(ex + 1, ey, o); P(ex + 2, ey + 1, o); }
    else if (face === 'super') { P(ex - 1, ey + 2, o); P(ex, ey + 1, o); P(ex + 1, ey, o); P(ex + 2, ey + 1, o); P(ex + 3, ey + 2, o); }
  }
  if ((face === 'sad' && Math.floor(t / 600) % 2) || tear) { P(exL, ey + 3, '#5ab4ff'); P(exL, ey + 4 + (Math.floor(t / 300) % 2), '#5ab4ff'); if (tear) P(exR + 1, ey + 4, '#5ab4ff'); }
  if (G.cheek !== 'n' || face === 'super') {
    const ck = face === 'super' ? '#ff6f9a' : '#' + G.cheek;
    R(exL - 2, ey + 3, 2, 1, ck); R(exR + ew, ey + 3, 2, 1, ck);
    if (face === 'super') { R(exL - 2, ey + 4, 2, 1, ck); R(exR + ew, ey + 4, 2, 1, ck); }
  }
  const mx = Math.round((exL + ew + exR) / 2) - 1, my = ey + 4;
  if (mouth === 'big') { R(mx - 1, my, 4, 3, o); R(mx, my + 1, 2, 2, '#ff6f8f'); P(mx - 1, my, o); }
  else if (G.mouth === 'beak') {
    R(mx, my, 2, 1, '#ffa040');
    if (mouth === 'open') { P(mx, my + 1, '#ff6f8f'); P(mx + 1, my + 1, '#ff6f8f'); R(mx, my + 2, 2, 1, '#e07a20'); } else R(mx, my + 1, 2, 1, '#e07a20');
  } else if (mouth === 'open') { R(mx, my, 2, 2, o); P(mx, my + 1, '#ff6f8f'); P(mx + 1, my + 1, '#ff6f8f'); }
  else if (mouth === 'frown') { P(mx - 1, my + 1, o); R(mx, my, 2, 1, o); P(mx + 2, my + 1, o); }
  else if (G.mouth === 'cat') { P(mx - 1, my, o); P(mx, my + 1, o); P(mx + 1, my + 1, o); P(mx + 2, my, o); }
  else if (G.mouth === 'fang') { R(mx, my, 2, 1, o); P(mx + 1, my + 1, '#fff'); }
  else if (mouth === 'smile') { P(mx - 1, my, o); R(mx, my + 1, 2, 1, o); P(mx + 2, my, o); }
  else R(mx, my, 2, 1, o);

  drawWear(t, { cx, cy, rx, ry, top, exL, exR, ew, ey, inBody, st });

  if (sparkleFace && Math.random() < .25) particles.push({ k: 'spark', x: cx + (Math.random() - .5) * rx * 3, y: top - 2 + Math.random() * ry, vx: 0, vy: -.01, life: 400, born: t });
  if (anim && anim.type === 'eat') {
    const f = FOODS[eatFood], k = Math.max(0, Math.ceil(f.spr.length * (1 - p * 1.1)));
    sprite(f.spr.slice(f.spr.length - k), cx + rx + 2, GROUND - k, f.map);
  }
  if (anim && anim.type === 'listen') sprite(SPR.q, cx + rx - 1, top - 6, { X: '#3a2b3f' });
  if (reunion && reunion.phase === 'notice') sprite(SPR.ex, cx + rx, top - 7, { X: '#ff4d4d' });
  if (asleep && !anim && Math.random() < .012) particles.push({ k: 'z', x: cx + rx - 2, y: top - 2, vx: .05, vy: -.06, life: 1600, born: t });
  const box = { x0: cx - rx - 3, x1: cx + rx + 3, y0: top - (st.ears ? 4 : 2), y1: GROUND + 2 };
  if (drawingFriend) friendBox = box; else if (!previewing) petBox = box;
}
function drawWear(t, g) {
  const { cx, cy, rx, ry, top, exL, exR, ew, ey, inBody } = g;
  const W = S.wear, X = Math.round(cx), T = Math.round(top);
  // くび
  const ny = Math.round(cy + ry * .6) + 1;
  if (W.neck === 'bowtie' || W.neck === 'r100') sprite(CLOTHES[W.neck].spr, X - 2, ny - 1, CLOTHES[W.neck].map);
  if (W.neck === 'scarf' || W.neck === 'bell' || W.neck === 'muffler') {
    const rows = W.neck === 'bell' ? 1 : 2;
    for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) for (let r = 0; r < rows; r++) if (inBody(x, ny + r))
      P(x, ny + r, W.neck === 'scarf' ? (r ? '#3f8ad0' : '#5ab4ff') : W.neck === 'bell' ? '#e04848' : (x % 2 ? '#ff6b6b' : '#fff3e0'));
    if (W.neck === 'scarf') { R(X + 2, ny + 2, 2, 3, '#3f8ad0'); }
    if (W.neck === 'muffler') { R(X - 4, ny + 2, 2, 3, '#ff6b6b'); P(X - 4, ny + 3, '#fff3e0'); }
    if (W.neck === 'bell') sprite(['.Y.', 'YYY', 'YKY'], X - 1, ny + 1, { Y: '#ffd84d', K: '#7a5a00' });
  }
  // かお
  if (W.face === 'roundg') {
    const c = '#c99a2e';
    for (const ex of [exL, exR]) { R(ex - 1, ey - 1, ew + 2, 1, c); R(ex - 1, ey + 3, ew + 2, 1, c); R(ex - 1, ey - 1, 1, 5, c); R(ex + ew, ey - 1, 1, 5, c); }
    if (exR - 2 >= exL + ew + 1) R(exL + ew + 1, ey, exR - exL - ew - 2, 1, c);
  }
  if (W.face === 'sun') {
    for (const ex of [exL, exR]) { R(ex - 1, ey, ew + 2, 3, '#1d1b22'); P(ex, ey, '#8a8aa0'); }
    R(exL + ew, ey, Math.max(1, exR - exL - ew), 1, '#1d1b22');
  }
  if (W.face === 'heartg') {
    for (const ex of [exL, exR]) sprite(['.X.X.', 'XXXXX', '.XXX.', '..X..'], ex - 1 - (ew === 3 ? 0 : .5), ey - 1, { X: '#ff5c86' });
    R(exL + ew + 1, ey, Math.max(1, exR - exL - ew - 2), 1, '#ff5c86');
  }
  // あたま
  const h = W.head; if (!h) return;
  const C = CLOTHES[h];
  if (h === 'straw') sprite(C.spr, X - 5, T - 2, C.map);
  else if (h === 'knit') sprite(C.spr, X - 4, T - 2, C.map);
  else if (h === 'witch') sprite(C.spr, X - 5, T - 4, C.map);
  else if (h === 'silk') sprite(C.spr, X - 4, T - 4, C.map);
  else if (h === 'tiara') sprite(C.spr, X - 3, T - 1, C.map);
  else if (h === 'santa') sprite(C.spr, X - 4, T - 4, C.map);
  else if (h === 'pumpkin') sprite(C.spr, X - 4, T - 3, C.map);
  else if (h === 'fcrown') sprite(C.spr, X - 4, T, C.map);
  else if (h === 'shellpin') sprite(C.spr, Math.round(cx + rx * .35), T + 1, C.map);
  else if (h === 'starpin') { sprite(C.spr, Math.round(cx + rx * .3), T - 1, C.map); if (Math.floor(t / 500) % 2) P(Math.round(cx + rx * .3) + 5, T - 2, '#fff'); }
  else if (h === 'phones') {
    for (let x = Math.ceil(cx - rx + 1); x <= cx + rx - 1; x++) { let y = Math.floor(top - 2); while (y < cy && !inBody(x, y)) y++; P(x, y - 1, '#3a3a48'); }
    R(Math.round(cx - rx) - 1, Math.round(cy - ry * .45), 2, 4, '#ff5a7a'); R(Math.round(cx + rx) - 1, Math.round(cy - ry * .45), 2, 4, '#ff5a7a');
  } else if (h === 'band' || h === 'kohaku') {
    const hy = ey - 2;
    for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) if (inBody(x, hy)) P(x, hy, h === 'kohaku' ? (x % 2 ? '#ffffff' : '#e8323c') : '#ff4d4d');
    let ex = Math.ceil(cx + rx); while (ex > cx && !inBody(ex, hy)) ex--;
    P(ex + 1, hy, '#ff4d4d'); P(ex + 2, hy + 1, '#ff4d4d'); P(ex + 2, hy - 1, '#ff4d4d');
  }
}
export { makeGenes, CLOTHES, STAGES, SHAPEN, PATN, EYEN, EARN, TAILN, ACCN, OVK, SPR };
// 64x64 の へや＋キャラ を描いて、色の配列（RGB）で返す
export function renderRoom(snap, surface) {
  ctx = surface;
  G = makeGenes(snap.id, snap.ov || null);
  S = { stage: STAGES[snap.stage] ? snap.stage : 'adult', wear: Object.assign({ head: null, face: null, neck: null }, snap.wear || {}),
        furn: snap.furn || {}, hunger: 90, mood: 95, gifts: {}, egg: null, player: 'x' };
  previewing = true;
  drawRoom(1000);
  drawPet(1000);
  return G;
}
