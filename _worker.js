// functions/_lib/render.js
var ctx = null;
var S = {};
var G = null;
var anim = null;
var mg = null;
var trip = null;
var reunion = null;
var visit = null;
var previewing = true;
var drawingFriend = false;
var extraDX = 0;
var particles = [];
var nextBlink = 1e15;
var awakeUntil = 0;
var eatFood = "onigiri";
var petBox = {};
var friendBox = {};
var now = () => Date.now();
var hour = () => 14;
var isNight = () => false;
function rng32(a) {
  return function() {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var SHAPEN = { round: "\u307E\u3093\u307E\u308B", tall: "\u306E\u3063\u307D", wide: "\u305A\u3093\u3050\u308A", pear: "\u3057\u305A\u304F", bean: "\u304A\u307E\u3081" };
var PATN = { none: "\u3080\u3058", spots: "\u3076\u3061", stripes: "\u3057\u307E\u3057\u307E", belly: "\u304A\u306A\u304B\u3057\u308D", patch: "\u304B\u305F\u3081\u3076\u3061", socks: "\u304F\u3064\u3057\u305F", stars: "\u307B\u3057\u3082\u3088\u3046" };
var EYEN = { dot: "\u3064\u3076\u3089\u306A\u76EE", tall: "\u305F\u3066\u9577\u306E\u76EE", big: "\u304A\u304A\u304D\u306A\u76EE", sleepy: "\u306D\u3080\u305D\u3046\u306A\u76EE", sparkle: "\u304D\u3089\u304D\u3089\u306E\u76EE" };
var EARN = { cat: "\u306D\u3053\u307F\u307F", bunny: "\u3046\u3055\u307F\u307F", round: "\u307E\u308B\u3044\u307F\u307F", horn: "\u30C4\u30CE", antenna: "\u3057\u3087\u3063\u304B\u304F", leaf: "\u306F\u3063\u3071" };
var TAILN = { none: "\u306A\u3057", curl: "\u304F\u308B\u304F\u308B\u3057\u3063\u307D", spike: "\u3068\u3052\u3068\u3052\u3057\u3063\u307D", fluff: "\u3075\u308F\u3075\u308F\u3057\u3063\u307D" };
var ACCN = { sprout: "\u3042\u305F\u307E\u306E\u82BD", crown: "\u3061\u3044\u3055\u306A\u304B\u3093\u3080\u308A", flower: "\u304A\u82B1", halo: "\u3066\u3093\u3057\u306E\u308F\u3063\u304B", bow: "\u30EA\u30DC\u30F3", star: "\u3046\u304B\u3076\u304A\u307B\u3057\u3055\u307E" };
var OVK = ["hue", "sat", "lig", "ahue", "shape", "ear", "eye", "eyeGap", "mouth", "pattern", "stripeV", "cheek", "tail", "acc"];
function makeGenes(seed, ov) {
  const r = rng32((parseInt(seed.slice(0, 8), 16) ^ Math.imul(parseInt(seed.slice(8), 16) + 1, 2654435761)) >>> 0);
  const ri = (n2) => Math.floor(r() * n2), pk = (a) => a[ri(a.length)];
  const hue = ri(72) * 5, sat = 55 + ri(4) * 10, lig = 62 + ri(3) * 6;
  const ahue = (hue + pk([30, 60, 150, 180, 210, 300])) % 360;
  const g = {
    hue,
    sat,
    lig,
    ahue,
    shape: pk(Object.keys(SHAPEN)),
    ear: pk(Object.keys(EARN)),
    eye: pk(Object.keys(EYEN)),
    eyeGap: 0.3 + ri(4) * 0.05,
    mouth: pk(["small", "cat", "fang", "beak"]),
    pattern: pk(Object.keys(PATN)),
    stripeV: r() < 0.5,
    cheek: pk(["ff8fa8", "ffa66b", "9fd6ff", "n"]),
    tail: pk(Object.keys(TAILN)),
    acc: pk(Object.keys(ACCN)),
    voice: 520 + ri(10) * 40,
    spots: []
  };
  const n = 3 + ri(4);
  for (let i = 0; i < n; i++) g.spots.push([r() * 1.6 - 0.8, r() * 1.6 - 0.8, 0.14 + r() * 0.16]);
  if (ov) {
    for (const k of OVK) if (ov[k] != null) g[k] = ov[k];
  }
  const H = g.hue, Sa = g.sat, L = g.lig, AH = g.ahue;
  g.pal = {
    b: `hsl(${H},${Sa}%,${L}%)`,
    s: `hsl(${H},${Sa}%,${L - 14}%)`,
    l: `hsl(${H},${Sa - 10}%,${Math.min(92, L + 16)}%)`,
    o: `hsl(${H},45%,22%)`,
    a: `hsl(${AH},${Sa}%,${L - 8}%)`,
    ao: `hsl(${AH},45%,25%)`
  };
  g.look = [
    H,
    Sa,
    L,
    AH,
    g.shape,
    g.ear,
    g.eye,
    Math.round(g.eyeGap * 100),
    g.mouth,
    g.pattern,
    g.stripeV ? 1 : 0,
    g.cheek,
    g.tail,
    g.acc,
    g.spots.map((s) => s.map((v) => Math.round(v * 5)).join(".")).join("_")
  ].join("-");
  return g;
}
var CLOTHES = {
  straw: { slot: "head", name: "\u3080\u304E\u308F\u3089\u307C\u3046\u3057", price: 40, spr: ["...DDDDD...", "..DYYYYYD..", "..RRRRRRR..", "DYYYYYYYYYD"], map: { D: "#c9a54a", Y: "#f2d17a", R: "#e05a5a" } },
  knit: { slot: "head", name: "\u30CB\u30C3\u30C8\u307C\u3046", price: 30, spr: ["....W....", "..CCCCC..", ".CCcCcCC.", ".CCCCCCC.", "WWWWWWWWW"], map: { C: "#5a8de0", c: "#9fc2ff", W: "#ffffff" } },
  witch: { slot: "head", name: "\u307E\u3058\u3087\u306E\u307C\u3046\u3057", price: 70, spr: ["......KK...", ".....KKK...", "....KKKK...", "...KKKKKK..", "...PPPPPP..", "KKKKKKKKKKK"], map: { K: "#3b2a5c", P: "#ffcc33" } },
  silk: { slot: "head", name: "\u30B7\u30EB\u30AF\u30CF\u30C3\u30C8", price: 60, spr: ["..KKKKK..", "..KKKKK..", "..KKKKK..", "..KKKKK..", "..RRRRR..", "KKKKKKKKK"], map: { K: "#2b2b33", R: "#ff4d6d" } },
  tiara: { slot: "head", name: "\u30C6\u30A3\u30A2\u30E9", price: 80, spr: ["...B...", ".Y.Y.Y.", "YYYYYYY"], map: { B: "#5ab4ff", Y: "#ffd84d" } },
  phones: { slot: "head", name: "\u30D8\u30C3\u30C9\u30DB\u30F3", price: 50, icon: [".KKKKKK.", "K......K", "K......K", "RR....RR", "RR....RR"], imap: { K: "#3a3a48", R: "#ff5a7a" } },
  band: { slot: "head", name: "\u306F\u3061\u307E\u304D", price: 20, icon: ["RRRRRRRR", "RRRRRRRR", "......RR", ".......R"], imap: { R: "#ff4d4d" } },
  fcrown: { slot: "head", name: "\u306F\u306A\u304B\u3093\u3080\u308A", rare: "park", spr: ["P.Y.P.Y.P", "GPGYGPGYG"], map: { P: "#ff8fc0", Y: "#ffe066", G: "#5fae55" } },
  shellpin: { slot: "head", name: "\u304B\u3044\u304C\u3089\u306E\u304B\u307F\u304B\u3056\u308A", rare: "beach", spr: [".SSS.", "SsSsS", ".SSS."], map: { S: "#ffc9b5", s: "#ff9e80" } },
  starpin: { slot: "head", name: "\u307B\u3057\u306E\u304B\u307F\u304B\u3056\u308A", rare: "hill", spr: ["..Y..", ".YYY.", "YYYYY", ".Y.Y."], map: { Y: "#ffe066" } },
  santa: { slot: "head", name: "\u30B5\u30F3\u30BF\u307C\u3046\u3057", limited: "\u30AF\u30EA\u30B9\u30DE\u30B9\u306E\u30D7\u30EC\u30BC\u30F3\u30C8", spr: ["......WW.", ".....RRW.", "....RRR..", "...RRRR..", "..RRRRR..", "WWWWWWWWW"], map: { R: "#e8323c", W: "#ffffff" } },
  pumpkin: { slot: "head", name: "\u304B\u307C\u3061\u3083\u307C\u3046\u3057", limited: "\u30CF\u30ED\u30A6\u30A3\u30F3\u306E\u30D7\u30EC\u30BC\u30F3\u30C8", spr: ["....G....", "..OOOOO..", ".OOKOKOO.", ".OOOOOOO.", "..OKKKO.."], map: { G: "#4f9a47", O: "#ff9a2e", K: "#5a2a00" } },
  kohaku: { slot: "head", name: "\u3053\u3046\u306F\u304F\u30CF\u30C1\u30DE\u30AD", limited: "\u304A\u3057\u3087\u3046\u304C\u3064\u306E\u30D7\u30EC\u30BC\u30F3\u30C8", icon: ["RWRWRWRW", "RWRWRWRW", "......RW", ".......R"], imap: { R: "#e8323c", W: "#ffffff" } },
  roundg: { slot: "face", name: "\u307E\u308B\u30E1\u30AC\u30CD", price: 30, icon: [".GGG..GGG.", "G...GG...G", "G...G.G..G", ".GGG..GGG."], imap: { G: "#c99a2e" } },
  sun: { slot: "face", name: "\u30B5\u30F3\u30B0\u30E9\u30B9", price: 40, icon: ["KKKKKKKKKK", "KWKKKKWKKK", ".KKK..KKK."], imap: { K: "#1d1b22", W: "#8a8aa0" } },
  heartg: { slot: "face", name: "\u30CF\u30FC\u30C8\u30E1\u30AC\u30CD", price: 50, icon: [".P.P..P.P.", "PPPPPPPPPP", ".PPP..PPP.", "..P....P.."], imap: { P: "#ff5c86" } },
  r100: { slot: "neck", name: "\u304D\u306D\u3093\u306E\u30EA\u30DC\u30F3", limited: "\u3046\u307E\u308C\u3066100\u65E5\u306E\u8A18\u5FF5", spr: ["YY.YY", "YYRYY", "YY.YY"], map: { Y: "#ffcc33", R: "#ff4d6d" } },
  bowtie: { slot: "neck", name: "\u3061\u3087\u3046\u30CD\u30AF\u30BF\u30A4", price: 25, spr: ["RR.RR", "RRYRR", "RR.RR"], map: { R: "#ff4d6d", Y: "#ffb3c1" } },
  scarf: { slot: "neck", name: "\u30B9\u30AB\u30FC\u30D5", price: 30, icon: ["BBBBBBBB", "BBBBBBBB", ".....BB.", ".....BB."], imap: { B: "#5ab4ff" } },
  bell: { slot: "neck", name: "\u3059\u305A", price: 35, icon: ["RRRRRRRR", "...YY...", "..YYYY..", "..YKKY.."], imap: { R: "#e04848", Y: "#ffd84d", K: "#7a5a00" } },
  muffler: { slot: "neck", name: "\u3057\u307E\u3057\u307E\u30DE\u30D5\u30E9\u30FC", price: 45, icon: ["RWRWRWRW", "RWRWRWRW", "..RW....", "..WR...."], imap: { R: "#ff6b6b", W: "#fff3e0" } }
};
var STAGES = { baby: { rx: 8, ry: 7, ears: 0, label: "\u3042\u304B\u3061\u3083\u3093" }, child: { rx: 10, ry: 9, ears: 1, label: "\u3053\u3069\u3082" }, adult: { rx: 12, ry: 10, ears: 2, label: "\u304A\u3068\u306A" } };
var P = (x, y, c) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
};
var R = (x, y, w, h, c) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
};
function sprite(rows, x, y, map, c2) {
  const g = c2 || ctx;
  rows.forEach((r, j) => {
    for (let i = 0; i < r.length; i++) {
      const col = map[r[i]];
      if (col) {
        g.fillStyle = col;
        g.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1);
      }
    }
  });
}
var SPR = {
  heart: [".X.X.", "XXXXX", ".XXX.", "..X.."],
  q: ["XXX", "..X", ".XX", "...", ".X."],
  ex: ["X", "X", "X", ".", "X"],
  z: ["XXX", ".X.", "XXX"],
  note: [".XX", ".X.", "XX."],
  spark: [".X.", "XXX", ".X."],
  fruit: [".G.", "CCC", "CCC"],
  star: [".Y.", "YYY", ".Y."],
  rock: [".KK.", "KGGK", "KGGK", ".KK."],
  tail: {
    curl: ["..OO.", ".OBBO", "OB.BO", "OBBO.", ".OO.."],
    spike: ["OO...", "OBOO.", "OBBBO", "OBOO.", "OO..."],
    fluff: [".OOO.", "OLLLO", "OLLLO", "OLLLO", ".OOO."]
  }
};
var FOODS = {
  onigiri: { name: "\u304A\u306B\u304E\u308A", price: 0, h: 35, m: 5, a: 1, note: "\u3044\u3064\u3067\u3082\u30BF\u30C0", spr: ["..K..", ".KWK.", "KWWWK", "KWWWK", "KBBBK", ".KKK."], map: { K: "#2b2b2b", W: "#fff", B: "#1f3b2a" } },
  apple: { name: "\u308A\u3093\u3054", price: 8, h: 20, m: 12, a: 1, note: "\u3054\u304D\u3052\u3093\u5C11\u3057\u30A2\u30C3\u30D7", spr: ["..G..", ".RRR.", "RRWRR", "RRRRR", ".RRR."], map: { G: "#4f9a47", R: "#ff4d4d", W: "#ffc0c0" } },
  pudding: { name: "\u30D7\u30EA\u30F3", price: 15, h: 15, m: 25, a: 2, note: "\u3054\u304D\u3052\u3093\u5927\u304D\u304F\u30A2\u30C3\u30D7", spr: [".CCC.", ".YYY.", "YYYYY", "YYYYY", "PPPPP"], map: { C: "#8a4b1f", Y: "#ffe07a", P: "#c9c9d6" } },
  cake: { name: "\u30B1\u30FC\u30AD", price: 30, h: 30, m: 35, a: 4, note: "\u306A\u304B\u3088\u3057\u3082\u30A2\u30C3\u30D7", spr: ["..R..", "WWWWW", "SSSSS", "WWWWW", "SSSSS"], map: { R: "#ff3d5a", W: "#fffaf0", S: "#ffd98a" } },
  choco: { name: "\u30CF\u30FC\u30C8\u306E\u30C1\u30E7\u30B3", price: -1, h: 10, m: 30, a: 5, note: "\u30D0\u30EC\u30F3\u30BF\u30A4\u30F3\u306E\u30D7\u30EC\u30BC\u30F3\u30C8", spr: [".K.K.", "KKKKK", "KPKKK", ".KKK.", "..K.."], map: { K: "#6b3a1f", P: "#ffb3c8" } }
};
var GROUND = 54;
var EVENTS = [
  { id: "xmas", name: "\u30AF\u30EA\u30B9\u30DE\u30B9", on: (m, d) => m === 12 && d <= 25, gift: (m, d) => m === 12 && d >= 24, item: "santa", coins: 30, msg: "\u30B5\u30F3\u30BF\u3055\u3093\u304B\u3089\u306E \u30D7\u30EC\u30BC\u30F3\u30C8\uFF01", hello: "\uFF08\u3078\u3084\u304C \u30AF\u30EA\u30B9\u30DE\u30B9\u306E\u304B\u3056\u308A\u3067 \u3044\u3063\u3071\u3044\uFF01\uFF09" },
  { id: "newyear", name: "\u304A\u3057\u3087\u3046\u304C\u3064", on: (m, d) => m === 1 && d <= 7, gift: () => true, item: "kohaku", coins: 50, msg: "\u304A\u3068\u3057\u3060\u307E\uFF01", hello: "\uFF08\u3042\u3051\u307E\u3057\u3066 \u304A\u3081\u3067\u3068\u3046\uFF01 \u3053\u3068\u3057\u3082 \u3088\u308D\u3057\u304F\u306D\uFF09" },
  { id: "valentine", name: "\u30D0\u30EC\u30F3\u30BF\u30A4\u30F3", on: (m, d) => m === 2 && d >= 10 && d <= 14, gift: (m, d) => d === 14, food: "choco", n: 3, msg: "\u30CF\u30FC\u30C8\u306E\u30C1\u30E7\u30B3\u3092 \u3082\u3089\u3063\u305F\uFF01", hello: "\uFF08\u306A\u3093\u3060\u304B \u305D\u308F\u305D\u308F\u3057\u3066\u3044\u308B\u2026\uFF09" },
  { id: "halloween", name: "\u30CF\u30ED\u30A6\u30A3\u30F3", on: (m, d) => m === 10 && d >= 20, gift: (m, d) => d === 31, item: "pumpkin", coins: 20, msg: "\u30C8\u30EA\u30C3\u30AF\u30FB\u30AA\u30A2\u30FB\u30C8\u30EA\u30FC\u30C8\uFF01", hello: "\uFF08\u304B\u307C\u3061\u3083\u304C \u3044\u3063\u3071\u3044\uFF01\uFF09" }
];
function activeEvents() {
  const d = new Date(now());
  const m = d.getMonth() + 1, dd = d.getDate();
  return EVENTS.filter((e) => e.on(m, dd));
}
function evOn(id) {
  return activeEvents().some((e) => e.id === id);
}
function giftKey(e) {
  return e.id + new Date(now()).getFullYear();
}
function pendingGift() {
  if (!S || S.stage === "egg" || !S.player) return null;
  const d = new Date(now()), m = d.getMonth() + 1, dd = d.getDate();
  return activeEvents().find((e) => e.gift(m, dd) && !(S.gifts || {})[giftKey(e)]) || null;
}
function skyColor() {
  const h = hour();
  return isNight() ? "#141a33" : h >= 17 ? "#ff9e6b" : h < 9 ? "#bfe6ff" : "#8fd0ff";
}
function drawRoom(t) {
  const h = hour(), night = isNight(), eve = h >= 17 && h < 22;
  const wall = night ? "#2d3557" : eve ? "#f0c89a" : "#f3e3c3", wall2 = night ? "#262d4b" : eve ? "#e4b685" : "#e9d5ae";
  R(0, 0, 64, 44, wall);
  for (let x = 0; x < 64; x += 8) R(x, 0, 1, 44, wall2);
  const sky = skyColor();
  R(6, 8, 18, 14, "#6b4a33");
  R(7, 9, 16, 12, sky);
  if (night) {
    P(10, 11, "#fff");
    P(19, 13, "#fff");
    P(14, 17, "#cfd8ff");
    R(17, 10, 3, 3, "#fff6c4");
    P(17, 10, sky);
  } else if (eve) R(10, 16, 4, 3, "#ffdd8a");
  else {
    R(18, 11, 3, 3, "#fff3a0");
    R(9, 15, 5, 2, "#fff");
    R(10, 14, 3, 1, "#fff");
  }
  R(15, 9, 1, 12, "#6b4a33");
  R(7, 15, 16, 1, "#6b4a33");
  if (S.furn.poster) {
    R(29, 7, 11, 12, "#5a4a3f");
    R(30, 8, 9, 10, "#fffaf0");
    sprite([".BBB.", "BBBBB", "BOBOB", "BBBBB", ".BBB."], 32, 10, { B: G.pal.b, O: G.pal.o });
  }
  R(50, 36, 6, 6, "#c0643f");
  R(49, 35, 8, 2, "#d9774f");
  R(52, 30, 2, 5, "#4f9a47");
  R(50, 30, 2, 2, "#62b35a");
  R(54, 28, 2, 3, "#62b35a");
  drawEventWall(t, night);
  const floor = night ? "#4b3f57" : "#c98d55", floor2 = night ? "#3f354a" : "#b67b46";
  R(0, 44, 64, 20, floor);
  for (let y = 47; y < 64; y += 4) R(0, y, 64, 1, floor2);
  R(0, 44, 64, 1, night ? "#2a2236" : "#8d5c33");
  const blue = S.furn.rug;
  for (let x = 14; x < 50; x++) for (let y = 50; y < 60; y++) {
    const dx = (x + 0.5 - 32) / 18, dy = (y + 0.5 - 55) / 5, d = dx * dx + dy * dy;
    if (d > 1) continue;
    let c = blue ? x % 4 < 2 ? "#9fd0ff" : "#e6f4ff" : "#f0a0a0";
    if (d > 0.7) c = blue ? "#4f86c6" : "#e07a7a";
    if (night) c = d > 0.7 ? "#6a4f6e" : "#5b4560";
    P(x, y, c);
  }
  if (S.furn.cushion) sprite([".CCCCCC.", "CCDCCDCC", "CCCCCCCC", ".DDDDDD."], 2, 46, { C: G.pal.a, D: G.pal.ao });
  if (S.furn.lamp) {
    R(44, 0, 1, 6, "#3a2b3f");
    if (night) {
      ctx.fillStyle = "rgba(255,230,120,.18)";
      ctx.fillRect(38, 2, 13, 13);
      ctx.fillRect(40, 0, 9, 17);
    }
    sprite(["..Y..", ".YYY.", "YYYYY", ".YYY.", ".Y.Y."], 42, 6, { Y: night ? "#fff1a0" : "#ffd84d" });
  }
  drawEventFloor(t);
  if (!previewing) {
    if (pendingGift()) {
      const b = Math.floor(t / 400) % 2;
      sprite(["..YY..", "RRYYRR", "RRYYRR", "RRYYRR", "RRYYRR"], 4, 51 - b, { R: "#ff4d6d", Y: "#ffd84d" });
    }
    if (S.egg) drawFamilyEgg(55, 46, S.egg, t);
  }
}
function drawFamilyEgg(x, y, egg, t) {
  const h = egg.ov && egg.ov.hue != null ? egg.ov.hue : 40, wob = Math.round(Math.sin(t / 500) * 0.6);
  sprite([".KKK.", "KWWWK", "KWBWK", "KBWBK", "KWWWK", "KWWWK", ".KKK."], x + wob, y, { K: "#5a4a3f", W: "#fffaf0", B: `hsl(${h},65%,68%)` });
}
function drawEventWall(t, night) {
  if (evOn("xmas")) {
    for (let x = 0; x < 64; x++) {
      const y = 2 + Math.round(Math.sin(x / 5) * 1.2 + 1);
      P(x, y, "#2f8a3f");
      if (x % 5 === 2) P(x, y + 1, ["#ff4d4d", "#ffd84d", "#5ab4ff"][(Math.floor(t / 500) + x) % 3]);
    }
    for (let i = 0; i < 10; i++) {
      const sx = 7 + (i * 37 + Math.floor(t / 120)) % 16, sy = 9 + (i * 13 + Math.floor(t / 90)) % 12;
      P(sx, sy, "#ffffff");
    }
    for (let i = 0; i < 16; i++) {
      const w = 1 + Math.floor(i % 6 * 0.8) + Math.floor(i / 6) * 2;
      R(53 - w, 26 + i, w * 2 + 1, 1, i % 6 === 5 ? "#2a7a38" : "#3f9a4a");
    }
    R(52, 42, 3, 2, "#8a5a3a");
    sprite([".Y.", "YYY", ".Y."], 52, 23, { Y: "#ffe066" });
    [[51, 30], [55, 33], [50, 36], [56, 39], [53, 38], [48, 40]].forEach(([x, y], i) => P(x, y, ["#ff4d4d", "#ffd84d", "#5ab4ff", "#ff8fc0"][(i + Math.floor(t / 600)) % 4]));
  }
  if (evOn("newyear")) {
    for (const [bx, hgt] of [[50, 13], [53, 16], [56, 11]]) {
      R(bx, 42 - hgt, 2, hgt, "#4fae55");
      P(bx, 42 - hgt, "#8fd88a");
      R(bx, 38, 2, 1, "#2f7a3a");
    }
    R(48, 40, 11, 3, "#d9b46a");
    R(48, 41, 11, 1, "#b08a40");
    sprite(["R.R.R", "RRRRR"], 30, 3, { R: "#e8323c" });
    sprite(["W.W.W", "WWWWW"], 35, 3, { W: "#ffffff" });
  }
  if (evOn("halloween")) {
    const b = Math.floor(t / 300) % 2;
    [[34, 6], [44, 10], [27, 12]].forEach(([x, y]) => sprite(b ? ["K.K.K", ".KKK."] : [".K.K.", "KKKKK"], x, y, { K: night ? "#000000" : "#3a2b3f" }));
  }
  if (evOn("valentine")) {
    [[30, 6], [38, 10], [44, 5], [34, 14]].forEach(([x, y], i) => sprite(["X.X", "XXX", ".X."], x, y + Math.floor(t / 600 + i) % 2, { X: i % 2 ? "#ff8fc0" : "#ff5c86" }));
  }
}
function drawEventFloor(t) {
  if (evOn("newyear")) sprite(["...O...", "..WWW..", ".WWWWW.", "WWWWWWW", "RRRRRRR", ".R...R."], 2, 40, { O: "#ff9a2e", W: "#fffaf0", R: "#e8323c" });
  if (evOn("halloween")) sprite(["...G...", ".OOOOO.", "OOYOYOO", "OOOOOOO", "OYYYYYO", ".OOOOO."], 2, 41, { G: "#4f9a47", O: "#ff9a2e", Y: Math.floor(t / 400) % 2 ? "#ffe066" : "#ffb000" });
}
function drawPet(t) {
  const pal = G.pal, st = STAGES[S.stage];
  const p = anim ? (t - anim.start) / anim.dur : 0;
  const asleep = !previewing && !drawingFriend && !visit && !mg && !trip && !reunion && isNight() && Date.now() > awakeUntil;
  let squash = Math.sin(t / (asleep ? 900 : 320)) * (asleep ? 0.04 : 0.06);
  let jump = 0, dx = 0, face = null, mouth = null, tear = false, sparkleFace = false;
  if (anim && !previewing) {
    if (anim.type === "jump") {
      jump = Math.sin(p * Math.PI) * 5;
      squash = -0.08 * Math.sin(p * Math.PI);
      face = "happy";
      mouth = "open";
    }
    if (anim.type === "eat") {
      face = p < 0.85 ? "normal" : "happy";
      mouth = Math.floor(t / 160) % 2 ? "open" : "line";
    }
    if (anim.type === "listen") {
      dx = Math.sin(p * Math.PI * 2);
      face = "normal";
      mouth = "line";
    }
    if (anim.type === "grow") {
      squash = Math.sin(p * Math.PI * 8) * 0.12;
      face = "happy";
      mouth = "open";
    }
    if (anim.type === "proud") {
      jump = Math.abs(Math.sin(p * Math.PI * 2)) * 3;
      face = "happy";
      mouth = "smile";
    }
  }
  if (mg && !drawingFriend) {
    dx = mg.x - 32;
    if (t < mg.stun) {
      face = "sad";
      mouth = "frown";
      dx += Math.sin(t / 30);
    } else if (t < mg.happy) {
      face = "happy";
      mouth = "open";
      jump = 2;
    }
  }
  if (trip && !drawingFriend) {
    dx = trip.x - 32;
    if (trip.digUntil > t) {
      squash = Math.sin(t / 60) * 0.1;
      face = "happy";
      mouth = "line";
    } else if (trip.moving) jump = Math.abs(Math.sin(t / 110)) * 1.6;
    if (trip.happy > t) {
      face = "happy";
      mouth = "open";
      jump = Math.max(jump, 3);
    }
  }
  if (reunion && !previewing && !drawingFriend) {
    const rt = t - reunion.start;
    if (reunion.phase === "sad") {
      face = "sad";
      mouth = "frown";
      squash = 0.09;
      tear = true;
    } else if (reunion.phase === "notice") {
      face = "normal";
      mouth = "open";
      jump = Math.min(1, rt / 150) * 2;
    } else {
      face = "super";
      mouth = "big";
      const ph = Math.abs(Math.sin(rt / 1e3 * Math.PI * 2.4));
      jump = ph * 8;
      squash = -0.07 * ph + (ph < 0.15 ? 0.08 : 0);
      sparkleFace = true;
    }
  }
  dx += extraDX;
  let rx = st.rx * (1 + squash), ry = st.ry * (1 - squash);
  if (G.shape === "tall") {
    rx *= 0.85;
    ry *= 1.12;
  }
  if (G.shape === "wide") {
    rx *= 1.15;
    ry *= 0.88;
  }
  const cx = 32 + dx, cy = GROUND - ry - jump, top = cy - ry;
  const inBody = (x, y) => {
    let ex = (x + 0.5 - cx) / rx;
    const ey2 = (y + 0.5 - cy) / ry;
    if (G.shape === "pear") ex /= 0.78 + 0.2 * (ey2 + 1);
    if (G.shape === "bean") return Math.abs(ex) ** 2.6 + Math.abs(ey2) ** 2.6 <= 1;
    return ex * ex + ey2 * ey2 <= 1;
  };
  const inEar = (x, y) => {
    if (!st.ears) return 0;
    const X = x + 0.5, Y = y + 0.5;
    for (const s of [-1, 1]) {
      if (G.ear === "cat") {
        const exc = cx + s * rx * 0.55, h = 3 + st.ears, yy = Y - (top - h + 2);
        if (yy >= 0 && yy <= h && Math.abs(X - exc) <= yy * 0.55 + 0.3) return Math.abs(X - exc) < yy * 0.28 && yy > 1.5 ? 3 : 2;
      } else if (G.ear === "bunny") {
        const exc = cx + s * rx * 0.32, h = 4 + st.ears * 2, yy = Y - (top - h + 2);
        if (yy >= 0 && yy <= h && Math.abs(X - exc) <= 1.4) return Math.abs(X - exc) < 0.7 && yy > 1.2 && yy < h - 1 ? 3 : 2;
      } else if (G.ear === "round") {
        const exc = cx + s * rx * 0.62, rr = 1.8 + st.ears * 0.5, ddx = X - exc, ddy = Y - (top + 1);
        if (ddx * ddx + ddy * ddy <= rr * rr) return 2;
      }
    }
    return 0;
  };
  const inside = (x, y) => inBody(x, y) ? 1 : inEar(x, y);
  for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (Math.abs(x + 0.5 - cx) / rx < 0.9) P(x, GROUND + 1, "rgba(0,0,0,.18)");
  if (st.ears && G.tail !== "none") sprite(SPR.tail[G.tail], cx + rx - 2, cy - 1 + Math.sin(t / 250) * 0.6, { O: pal.o, B: pal.b, L: pal.l });
  const footC = G.pattern === "socks" ? pal.ao : pal.o;
  R(Math.round(cx - rx * 0.5) - 1, GROUND - 1, 3, 2, footC);
  R(Math.round(cx + rx * 0.5) - 1, GROUND - 1, 3, 2, footC);
  const earH = 4 + st.ears * 2;
  const x0 = Math.floor(cx - rx - 3), x1 = Math.ceil(cx + rx + 3), y0 = Math.floor(top - earH - 2), y1 = Math.ceil(cy + ry + 1);
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
    const v = inside(x, y);
    if (!v) continue;
    const edge = !inside(x + 1, y) || !inside(x - 1, y) || !inside(x, y + 1) || !inside(x, y - 1);
    let c = pal.b;
    if (edge) c = pal.o;
    else if (v === 3) c = "#ff9fb4";
    else if (v === 1) {
      const ex = (x + 0.5 - cx) / rx, ey2 = (y + 0.5 - cy) / ry;
      switch (G.pattern) {
        case "spots":
          for (const s of G.spots) if ((ex - s[0]) ** 2 + (ey2 - s[1]) ** 2 < s[2] ** 2) c = pal.a;
          break;
        case "stripes":
          if (G.stripeV ? Math.floor((ex + 1) * 4) % 2 === 0 && ey2 < 0.2 : Math.floor((ey2 + 1) * 4.5) % 2 === 0 && ey2 < 0.1) c = pal.a;
          break;
        case "belly":
          if ((ex / 0.55) ** 2 + ((ey2 - 0.42) / 0.5) ** 2 < 1) c = "#fff6e6";
          break;
        case "patch":
          if ((ex + 0.36) ** 2 + (ey2 + 0.1) ** 2 < 0.1) c = pal.a;
          break;
        case "socks":
          if (ey2 > 0.62) c = pal.a;
          break;
      }
      if (c === pal.b) {
        if (ex * 0.8 + ey2 > 0.78) c = pal.s;
        else if (ex < -0.25 && ey2 < -0.35 && ex * ex + ey2 * ey2 < 0.62) c = pal.l;
      }
    }
    P(x, y, c);
  }
  if (G.pattern === "stars") for (const s of G.spots) {
    const sx = Math.round(cx + s[0] * rx * 0.8), sy = Math.round(cy + s[1] * ry * 0.8);
    if (inBody(sx, sy)) {
      P(sx, sy, "#fff8b0");
      if (s[2] > 0.22) {
        P(sx - 1, sy, "#fff8b0");
        P(sx + 1, sy, "#fff8b0");
        P(sx, sy - 1, "#fff8b0");
        P(sx, sy + 1, "#fff8b0");
      }
    }
  }
  if (st.ears) {
    if (G.ear === "horn") for (const s of [-1, 1]) {
      const hx = Math.round(cx + s * rx * 0.4);
      sprite(st.ears > 1 ? [".O.", "OAO", "OAO", "OAO"] : [".O.", "OAO", "OAO"], hx - 1, Math.round(top) - 1 - st.ears - 2, { O: pal.ao, A: pal.a });
    }
    if (G.ear === "antenna") for (const s of [-1, 1]) {
      const hx = Math.round(cx + s * 2.5), h = 2 + st.ears;
      R(hx, Math.round(top) - h, 1, h + 1, pal.o);
      R(hx - (s < 0 ? 1 : 0), Math.round(top) - h - 2, 2, 2, pal.a);
    }
    if (G.ear === "leaf") {
      const tx = Math.round(cx);
      R(tx, Math.round(top) - 2, 1, 3, "#3f7a39");
      sprite(st.ears > 1 ? [".GGG", "GGLG", "GG.."] : [".GG", "GLG"], tx, Math.round(top) - 4 - st.ears, { G: "#5fae55", L: "#9ee08f" });
    }
  }
  const hatOn = !!S.wear.head;
  if (S.stage === "adult") {
    const tx = Math.round(cx), ty = Math.round(top);
    if (G.acc === "sprout" && !hatOn) {
      R(tx, ty - 3, 1, 3, "#3f7a39");
      R(tx - 2, ty - 4, 2, 2, "#62b35a");
      R(tx + 1, ty - 5, 2, 2, "#7fcc6f");
    }
    if (G.acc === "crown" && !hatOn) sprite(["Y.Y.Y", "YYYYY", "YRYBY"], tx - 2, ty - 2, { Y: "#ffcc33", R: "#ff4d6d", B: "#5ab4ff" });
    if (G.acc === "flower") sprite([".P.", "PYP", ".P."], Math.round(cx + rx * 0.5), ty + 1, { P: pal.a, Y: "#ffe066" });
    if (G.acc === "halo") sprite([".YYYYY.", "Y.....Y", ".YYYYY."], tx - 3, ty - 9 + Math.round(Math.sin(t / 400)), { Y: "#ffe066" });
    if (G.acc === "bow") sprite(["R...R", "RRYRR", "R...R"], Math.round(cx - rx * 0.6) - 2, ty + 1, { R: "#ff4d6d", Y: "#ffd0da" });
    if (G.acc === "star") sprite(["..Y..", ".YYY.", "YYYYY", ".Y.Y."], tx + Math.round(rx * 0.6), ty - 8 + Math.round(Math.sin(t / 350) * 1.5), { Y: "#ffe066" });
  }
  if (!face) face = asleep ? "sleep" : S.hunger < 25 || S.mood < 25 ? "sad" : "normal";
  if (face === "normal" && t > nextBlink && !previewing) {
    face = "blink";
    if (t > nextBlink + 130) nextBlink = t + 2200 + Math.random() * 2500;
  }
  if (!mouth) mouth = face === "sad" ? "frown" : face === "sleep" ? "line" : S.mood > 70 ? "smile" : "line";
  const o = pal.o, ew = G.eye === "big" ? 3 : 2;
  const exL = Math.round(cx - rx * G.eyeGap) - 1 - (ew - 2), exR = Math.round(cx + rx * G.eyeGap), ey = Math.round(cy - 1);
  for (const ex of [exL, exR]) {
    if (face === "normal" || face === "sad") {
      if (G.eye === "dot") R(ex, ey + 1, 2, 2, o);
      else if (G.eye === "big") {
        R(ex, ey, 3, 3, o);
        P(ex, ey, "#fff");
      } else if (G.eye === "sleepy") {
        R(ex, ey + 1, 2, 2, o);
        R(ex, ey + 1, 2, 1, pal.s);
      } else if (G.eye === "sparkle") {
        R(ex, ey, 2, 3, o);
        P(ex, ey, "#fff");
        P(ex + 1, ey + 2, "#fff");
      } else {
        R(ex, ey, 2, 3, o);
        P(ex, ey, "#fff");
      }
    } else if (face === "blink" || face === "sleep") R(ex, ey + 2, ew, 1, o);
    else if (face === "happy") {
      P(ex, ey + 1, o);
      P(ex + 1, ey, o);
      P(ex + 2, ey + 1, o);
    } else if (face === "super") {
      P(ex - 1, ey + 2, o);
      P(ex, ey + 1, o);
      P(ex + 1, ey, o);
      P(ex + 2, ey + 1, o);
      P(ex + 3, ey + 2, o);
    }
  }
  if (face === "sad" && Math.floor(t / 600) % 2 || tear) {
    P(exL, ey + 3, "#5ab4ff");
    P(exL, ey + 4 + Math.floor(t / 300) % 2, "#5ab4ff");
    if (tear) P(exR + 1, ey + 4, "#5ab4ff");
  }
  if (G.cheek !== "n" || face === "super") {
    const ck = face === "super" ? "#ff6f9a" : "#" + G.cheek;
    R(exL - 2, ey + 3, 2, 1, ck);
    R(exR + ew, ey + 3, 2, 1, ck);
    if (face === "super") {
      R(exL - 2, ey + 4, 2, 1, ck);
      R(exR + ew, ey + 4, 2, 1, ck);
    }
  }
  const mx = Math.round((exL + ew + exR) / 2) - 1, my = ey + 4;
  if (mouth === "big") {
    R(mx - 1, my, 4, 3, o);
    R(mx, my + 1, 2, 2, "#ff6f8f");
    P(mx - 1, my, o);
  } else if (G.mouth === "beak") {
    R(mx, my, 2, 1, "#ffa040");
    if (mouth === "open") {
      P(mx, my + 1, "#ff6f8f");
      P(mx + 1, my + 1, "#ff6f8f");
      R(mx, my + 2, 2, 1, "#e07a20");
    } else R(mx, my + 1, 2, 1, "#e07a20");
  } else if (mouth === "open") {
    R(mx, my, 2, 2, o);
    P(mx, my + 1, "#ff6f8f");
    P(mx + 1, my + 1, "#ff6f8f");
  } else if (mouth === "frown") {
    P(mx - 1, my + 1, o);
    R(mx, my, 2, 1, o);
    P(mx + 2, my + 1, o);
  } else if (G.mouth === "cat") {
    P(mx - 1, my, o);
    P(mx, my + 1, o);
    P(mx + 1, my + 1, o);
    P(mx + 2, my, o);
  } else if (G.mouth === "fang") {
    R(mx, my, 2, 1, o);
    P(mx + 1, my + 1, "#fff");
  } else if (mouth === "smile") {
    P(mx - 1, my, o);
    R(mx, my + 1, 2, 1, o);
    P(mx + 2, my, o);
  } else R(mx, my, 2, 1, o);
  drawWear(t, { cx, cy, rx, ry, top, exL, exR, ew, ey, inBody, st });
  if (sparkleFace && Math.random() < 0.25) particles.push({ k: "spark", x: cx + (Math.random() - 0.5) * rx * 3, y: top - 2 + Math.random() * ry, vx: 0, vy: -0.01, life: 400, born: t });
  if (anim && anim.type === "eat") {
    const f = FOODS[eatFood], k = Math.max(0, Math.ceil(f.spr.length * (1 - p * 1.1)));
    sprite(f.spr.slice(f.spr.length - k), cx + rx + 2, GROUND - k, f.map);
  }
  if (anim && anim.type === "listen") sprite(SPR.q, cx + rx - 1, top - 6, { X: "#3a2b3f" });
  if (reunion && reunion.phase === "notice") sprite(SPR.ex, cx + rx, top - 7, { X: "#ff4d4d" });
  if (asleep && !anim && Math.random() < 0.012) particles.push({ k: "z", x: cx + rx - 2, y: top - 2, vx: 0.05, vy: -0.06, life: 1600, born: t });
  const box = { x0: cx - rx - 3, x1: cx + rx + 3, y0: top - (st.ears ? 4 : 2), y1: GROUND + 2 };
  if (drawingFriend) friendBox = box;
  else if (!previewing) petBox = box;
}
function drawWear(t, g) {
  const { cx, cy, rx, ry, top, exL, exR, ew, ey, inBody } = g;
  const W = S.wear, X = Math.round(cx), T = Math.round(top);
  const ny = Math.round(cy + ry * 0.6) + 1;
  if (W.neck === "bowtie" || W.neck === "r100") sprite(CLOTHES[W.neck].spr, X - 2, ny - 1, CLOTHES[W.neck].map);
  if (W.neck === "scarf" || W.neck === "bell" || W.neck === "muffler") {
    const rows = W.neck === "bell" ? 1 : 2;
    for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) for (let r = 0; r < rows; r++) if (inBody(x, ny + r))
      P(x, ny + r, W.neck === "scarf" ? r ? "#3f8ad0" : "#5ab4ff" : W.neck === "bell" ? "#e04848" : x % 2 ? "#ff6b6b" : "#fff3e0");
    if (W.neck === "scarf") {
      R(X + 2, ny + 2, 2, 3, "#3f8ad0");
    }
    if (W.neck === "muffler") {
      R(X - 4, ny + 2, 2, 3, "#ff6b6b");
      P(X - 4, ny + 3, "#fff3e0");
    }
    if (W.neck === "bell") sprite([".Y.", "YYY", "YKY"], X - 1, ny + 1, { Y: "#ffd84d", K: "#7a5a00" });
  }
  if (W.face === "roundg") {
    const c = "#c99a2e";
    for (const ex of [exL, exR]) {
      R(ex - 1, ey - 1, ew + 2, 1, c);
      R(ex - 1, ey + 3, ew + 2, 1, c);
      R(ex - 1, ey - 1, 1, 5, c);
      R(ex + ew, ey - 1, 1, 5, c);
    }
    if (exR - 2 >= exL + ew + 1) R(exL + ew + 1, ey, exR - exL - ew - 2, 1, c);
  }
  if (W.face === "sun") {
    for (const ex of [exL, exR]) {
      R(ex - 1, ey, ew + 2, 3, "#1d1b22");
      P(ex, ey, "#8a8aa0");
    }
    R(exL + ew, ey, Math.max(1, exR - exL - ew), 1, "#1d1b22");
  }
  if (W.face === "heartg") {
    for (const ex of [exL, exR]) sprite([".X.X.", "XXXXX", ".XXX.", "..X.."], ex - 1 - (ew === 3 ? 0 : 0.5), ey - 1, { X: "#ff5c86" });
    R(exL + ew + 1, ey, Math.max(1, exR - exL - ew - 2), 1, "#ff5c86");
  }
  const h = W.head;
  if (!h) return;
  const C = CLOTHES[h];
  if (h === "straw") sprite(C.spr, X - 5, T - 2, C.map);
  else if (h === "knit") sprite(C.spr, X - 4, T - 2, C.map);
  else if (h === "witch") sprite(C.spr, X - 5, T - 4, C.map);
  else if (h === "silk") sprite(C.spr, X - 4, T - 4, C.map);
  else if (h === "tiara") sprite(C.spr, X - 3, T - 1, C.map);
  else if (h === "santa") sprite(C.spr, X - 4, T - 4, C.map);
  else if (h === "pumpkin") sprite(C.spr, X - 4, T - 3, C.map);
  else if (h === "fcrown") sprite(C.spr, X - 4, T, C.map);
  else if (h === "shellpin") sprite(C.spr, Math.round(cx + rx * 0.35), T + 1, C.map);
  else if (h === "starpin") {
    sprite(C.spr, Math.round(cx + rx * 0.3), T - 1, C.map);
    if (Math.floor(t / 500) % 2) P(Math.round(cx + rx * 0.3) + 5, T - 2, "#fff");
  } else if (h === "phones") {
    for (let x = Math.ceil(cx - rx + 1); x <= cx + rx - 1; x++) {
      let y = Math.floor(top - 2);
      while (y < cy && !inBody(x, y)) y++;
      P(x, y - 1, "#3a3a48");
    }
    R(Math.round(cx - rx) - 1, Math.round(cy - ry * 0.45), 2, 4, "#ff5a7a");
    R(Math.round(cx + rx) - 1, Math.round(cy - ry * 0.45), 2, 4, "#ff5a7a");
  } else if (h === "band" || h === "kohaku") {
    const hy = ey - 2;
    for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) if (inBody(x, hy)) P(x, hy, h === "kohaku" ? x % 2 ? "#ffffff" : "#e8323c" : "#ff4d4d");
    let ex = Math.ceil(cx + rx);
    while (ex > cx && !inBody(ex, hy)) ex--;
    P(ex + 1, hy, "#ff4d4d");
    P(ex + 2, hy + 1, "#ff4d4d");
    P(ex + 2, hy - 1, "#ff4d4d");
  }
}
function renderRoom(snap, surface) {
  ctx = surface;
  G = makeGenes(snap.id, snap.ov || null);
  S = {
    stage: STAGES[snap.stage] ? snap.stage : "adult",
    wear: Object.assign({ head: null, face: null, neck: null }, snap.wear || {}),
    furn: snap.furn || {},
    hunger: 90,
    mood: 95,
    gifts: {},
    egg: null,
    player: "x"
  };
  previewing = true;
  drawRoom(1e3);
  drawPet(1e3);
  return G;
}

// functions/_lib/util.js
var cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
var json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
var cleanId = (raw) => {
  const s = String(raw || "").toLowerCase().replace(/[^0-9a-f]/g, "");
  return /^[0-9a-f]{12}$/.test(s) ? s : null;
};
var fmtId = (id) => id.toUpperCase().match(/.{4}/g).join("-");
var clip = (s, n) => [...String(s == null ? "" : s)].filter((c) => c >= " ").slice(0, n).join("");
var esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
async function sha256(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
async function readJson(req, max = 2e4) {
  const t = await req.text();
  if (t.length > max) throw new Error("too_big");
  return JSON.parse(t);
}
async function getPet(env, id) {
  const v = await env.PETS.get("pet:" + id);
  return v ? JSON.parse(v) : null;
}
var inSet = (v, obj) => typeof v === "string" && Object.prototype.hasOwnProperty.call(obj, v) ? v : void 0;
var num = (v, a, b) => typeof v === "number" && isFinite(v) && v >= a && v <= b ? v : void 0;
var FURN = ["poster", "cushion", "lamp", "rug"];
var MOUTHS = { small: 1, cat: 1, fang: 1, beak: 1 };
var CHEEKS = { ff8fa8: 1, ffa66b: 1, "9fd6ff": 1, n: 1 };
function cleanSnap(b) {
  const wear = {};
  for (const slot of ["head", "face", "neck"]) {
    const w = b.wear && b.wear[slot];
    wear[slot] = w && CLOTHES[w] && CLOTHES[w].slot === slot ? w : null;
  }
  const furn = {};
  for (const k of FURN) if (b.furn && b.furn[k] === true) furn[k] = true;
  let ov = null;
  if (b.ov && typeof b.ov === "object") {
    const o = b.ov, c = {
      hue: num(o.hue, 0, 359),
      sat: num(o.sat, 30, 100),
      lig: num(o.lig, 40, 90),
      ahue: num(o.ahue, 0, 359),
      shape: inSet(o.shape, SHAPEN),
      ear: inSet(o.ear, EARN),
      eye: inSet(o.eye, EYEN),
      eyeGap: num(o.eyeGap, 0.2, 0.5),
      mouth: inSet(o.mouth, MOUTHS),
      pattern: inSet(o.pattern, PATN),
      stripeV: typeof o.stripeV === "boolean" ? o.stripeV : void 0,
      cheek: inSet(o.cheek, CHEEKS),
      tail: inSet(o.tail, TAILN),
      acc: inSet(o.acc, ACCN)
    };
    ov = {};
    for (const k in c) if (c[k] !== void 0) ov[k] = c[k];
  }
  return {
    name: clip(b.name, 8) || "\uFF1F\uFF1F\uFF1F",
    stage: STAGES[b.stage] ? b.stage : "baby",
    wear,
    furn,
    ov,
    gen: Math.min(999, Math.max(1, b.gen | 0)),
    days: Math.min(1e5, Math.max(0, b.days | 0)),
    words: (Array.isArray(b.words) ? b.words : []).slice(-30).map((w) => clip(w, 10)).filter(Boolean)
  };
}

// functions/api/register.js
async function onRequestPost({ request, env }) {
  let b;
  try {
    b = await readJson(request, 2e3);
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }
  const id = cleanId(b.id), look = String(b.look || "");
  if (!id || !/^[0-9a-z._-]{10,200}$/.test(look)) return json({ ok: false, error: "bad_request" }, 400);
  if (await env.PETS.get("look:" + look)) return json({ ok: false, reason: "look_taken" });
  if (await env.PETS.get("id:" + id)) return json({ ok: false, reason: "id_taken" });
  await env.PETS.put("look:" + look, id);
  await env.PETS.put("id:" + id, look);
  return json({ ok: true });
}

// functions/api/pet/[id].js
async function onRequestGet({ params, env }) {
  const id = cleanId(params.id);
  if (!id) return json({ ok: false, error: "bad_id" }, 400);
  const p = await getPet(env, id);
  if (!p) return json({ ok: false, error: "not_found" }, 404);
  const { tokenHash, ...pub } = p;
  return json({ ok: true, pet: pub });
}
async function onRequestPut({ params, request, env }) {
  const id = cleanId(params.id);
  if (!id) return json({ ok: false, error: "bad_id" }, 400);
  let b;
  try {
    b = await readJson(request, 2e4);
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }
  if (!/^[0-9a-f]{32}$/.test(b.token || "")) return json({ ok: false, error: "bad_token" }, 400);
  const tokenHash = await sha256(b.token);
  const old = await getPet(env, id);
  if (old && old.tokenHash !== tokenHash) return json({ ok: false, error: "forbidden" }, 403);
  const pet = { id, ...cleanSnap(b), tokenHash, updated: Date.now() };
  await env.PETS.put("pet:" + id, JSON.stringify(pet));
  return json({ ok: true });
}

// functions/api/backup/index.js
var ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var DAYS = 30;
async function onRequestPost2({ request, env }) {
  let b;
  try {
    b = await readJson(request, 4e5);
  } catch (e) {
    return json({ ok: false, error: e.message === "too_big" ? "too_big" : "bad_json" }, 400);
  }
  let data;
  try {
    data = JSON.parse(b.data);
  } catch {
    return json({ ok: false, error: "bad_data" }, 400);
  }
  if (!data || !/^[0-9a-f]{12}$/.test(data.seed || "")) return json({ ok: false, error: "bad_data" }, 400);
  const r = new Uint8Array(12);
  crypto.getRandomValues(r);
  const code = [...r].map((x) => ABC[x % ABC.length]).join("");
  await env.PETS.put("bk:" + code, b.data, { expirationTtl: DAYS * 86400 });
  return json({ ok: true, code: code.match(/.{4}/g).join("-"), days: DAYS });
}

// functions/api/backup/[code].js
async function onRequestGet2({ params, env }) {
  const code = String(params.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 12) return json({ ok: false, error: "bad_code" }, 400);
  const data = await env.PETS.get("bk:" + code);
  if (!data) return json({ ok: false, error: "not_found" }, 404);
  return json({ ok: true, data });
}

// functions/_lib/image.js
var cache = /* @__PURE__ */ new Map();
function hsl2rgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
function parseColor(v) {
  if (cache.has(v)) return cache.get(v);
  let c = [0, 0, 0, 1], m;
  const s = String(v).trim();
  if (s[0] === "#") {
    const h = s.length === 4 ? s.slice(1).split("").map((x) => x + x).join("") : s.slice(1, 7);
    c = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  } else if (m = /^rgba?\(([^)]+)\)/.exec(s)) {
    const p = m[1].split(",").map((x) => parseFloat(x));
    c = [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  } else if (m = /^hsl\(([^)]+)\)/.exec(s)) {
    const p = m[1].split(",").map((x) => parseFloat(x));
    c = [...hsl2rgb(p[0], p[1], p[2]), 1];
  }
  cache.set(v, c);
  return c;
}
var Surface = class {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Float32Array(w * h * 3);
    this.c = [0, 0, 0, 1];
  }
  set fillStyle(v) {
    this.c = parseColor(v);
  }
  get fillStyle() {
    return "";
  }
  clearRect() {
  }
  fillRect(x, y, w, h) {
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);
    const [r, g, b, a] = this.c, d = this.d;
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++)
      for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) {
        const k = (j * this.w + i) * 3;
        if (a >= 1) {
          d[k] = r;
          d[k + 1] = g;
          d[k + 2] = b;
        } else {
          d[k] = d[k] * (1 - a) + r * a;
          d[k + 1] = d[k + 1] * (1 - a) + g * a;
          d[k + 2] = d[k + 2] * (1 - a) + b * a;
        }
      }
  }
};
var CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 4294967295;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ c >>> 8;
  return (c ^ 4294967295) >>> 0;
}
function chunk(type, data) {
  const out = new Uint8Array(12 + data.length), dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}
async function deflate(raw) {
  const cs = new CompressionStream("deflate");
  const stream = new Blob([raw]).stream().pipeThrough(cs);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function encodePNG(w, h, rgb) {
  const pal = /* @__PURE__ */ new Map(), idx = new Uint8Array(w * h);
  let indexed = true;
  for (let p = 0; p < w * h && indexed; p++) {
    const key = rgb[p * 3] << 16 | rgb[p * 3 + 1] << 8 | rgb[p * 3 + 2];
    let n = pal.get(key);
    if (n === void 0) {
      n = pal.size;
      if (n >= 256) {
        indexed = false;
        break;
      }
      pal.set(key, n);
    }
    idx[p] = n;
  }
  const bpp = indexed ? 1 : 3, raw = new Uint8Array(h * (w * bpp + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * bpp + 1)] = 0;
    if (indexed) raw.set(idx.subarray(y * w, (y + 1) * w), y * (w + 1) + 1);
    else raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (w * 3 + 1) + 1);
  }
  const ihdr = new Uint8Array(13), dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w);
  dv.setUint32(4, h);
  ihdr[8] = 8;
  ihdr[9] = indexed ? 3 : 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr)];
  if (indexed) {
    const plte = new Uint8Array(pal.size * 3);
    for (const [k, n] of pal) {
      plte[n * 3] = k >> 16;
      plte[n * 3 + 1] = k >> 8 & 255;
      plte[n * 3 + 2] = k & 255;
    }
    parts.push(chunk("PLTE", plte));
  }
  parts.push(chunk("IDAT", await deflate(raw)), chunk("IEND", new Uint8Array(0)));
  const total = parts.reduce((a, p) => a + p.length, 0), out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
async function renderCard(snap) {
  const room = new Surface(64, 64);
  const G2 = renderRoom(snap, room);
  const W = 800, H = 420, SC = 6, ox = 208, oy = 18;
  const out = new Uint8Array(W * H * 3);
  const put = (x, y, c) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const k = (y * W + x) * 3;
    out[k] = c[0];
    out[k + 1] = c[1];
    out[k + 2] = c[2];
  };
  const rect = (x, y, w, h, c) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(i, j, c);
  };
  const bg = parseColor(`hsl(${G2.hue},55%,90%)`).map(Math.round), dot = parseColor(`hsl(${G2.hue},55%,82%)`).map(Math.round);
  const ink = parseColor("#3a2b3f"), shadow = parseColor(`hsl(${G2.hue},35%,72%)`).map(Math.round);
  rect(0, 0, W, H, bg);
  for (let y = 10; y < H; y += 36) for (let x = y / 36 % 2 * 18 + 10; x < W; x += 36) rect(x, y, 6, 6, dot);
  rect(ox - 6 + 10, oy - 6 + 10, 64 * SC + 12, 64 * SC + 12, shadow);
  rect(ox - 6, oy - 6, 64 * SC + 12, 64 * SC + 12, ink);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const k = (y * 64 + x) * 3, c = [room.d[k] | 0, room.d[k + 1] | 0, room.d[k + 2] | 0];
    rect(ox + x * SC, oy + y * SC, SC, SC, c);
  }
  const heart = SPR.heart, hc = parseColor("#ff6f9a"), hc2 = parseColor(`hsl(${G2.ahue},70%,70%)`).map(Math.round);
  [[60, 70, 8, hc], [110, 300, 6, hc2], [650, 90, 7, hc2], [690, 290, 9, hc]].forEach(([x, y, s, c]) => heart.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === "X") rect(x + i * s, y + j * s, s, s, c);
  })));
  return encodePNG(W, H, out);
}

// functions/og/[file].js
async function onRequestGet3(ctx2) {
  const { params, env, request } = ctx2;
  const id = cleanId(String(params.file || "").replace(/\.png$/i, ""));
  if (!id || !env.PETS) return new Response("not found", { status: 404 });
  const cache2 = caches.default, key = new Request(new URL(request.url).toString(), { method: "GET" });
  const hit = await cache2.match(key);
  if (hit) return hit;
  const pet = await getPet(env, id);
  if (!pet) return new Response("not found", { status: 404 });
  const png = await renderCard(pet);
  const res = new Response(png, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
  ctx2.waitUntil(cache2.put(key, res.clone()));
  return res;
}

// functions/p/[id].js
var STAGE = { baby: "\u3042\u304B\u3061\u3083\u3093", child: "\u3053\u3069\u3082", adult: "\u304A\u3068\u306A" };
async function onRequestGet4({ params, env, request }) {
  const id = cleanId(params.id);
  const pet = id && env.PETS ? await getPet(env, id) : null;
  if (!pet) return Response.redirect(new URL("/", request.url).toString(), 302);
  const url = new URL(request.url), v = (url.searchParams.get("v") || "").replace(/[^0-9a-z]/g, "").slice(0, 12);
  const origin = url.origin, img = `${origin}/og/${id}.png${v ? "?v=" + v : ""}`, page = `${origin}/p/${id}`;
  const name = esc(pet.name), no = fmtId(id);
  const title = `${name}\uFF08No.${no}\uFF09\uFF5C\u3074\u3053\u3063\u3068`;
  const desc = `\u305B\u304B\u3044\u306B1\u3074\u304D\u3060\u3051\u306E \u30C9\u30C3\u30C8\u306E\u3044\u304D\u3082\u306E\u300C${name}\u300D\u3002${STAGE[pet.stage] || ""}\u30FB${pet.gen > 1 ? pet.gen + "\u3060\u3044\u3081\u30FB" : ""}\u3044\u3063\u3057\u3087\u306B${pet.days}\u65E5\u3002\u3074\u3053\u3063\u3068\u3067 \u6BCE\u65E5\u305D\u3060\u3066\u3066\u3044\u307E\u3059\u3002`;
  const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="description" content="${desc}"><meta name="robots" content="noindex,follow">
<link rel="canonical" href="${page}">
<meta property="og:type" content="website"><meta property="og:site_name" content="\u3074\u3053\u3063\u3068\uFF5C\u5BB5\u5BAE\u30B2\u30FC\u30E0\u30BA"><meta property="og:url" content="${page}">
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
<p>${STAGE[pet.stage] || ""}${pet.gen > 1 ? "\u30FB" + pet.gen + "\u3060\u3044\u3081" : ""}\u30FB\u3044\u3063\u3057\u3087\u306B${pet.days}\u65E5</p>
<p>\u898B\u305F\u76EE\u304C \u5B8C\u5168\u30E9\u30F3\u30C0\u30E0\u306E\u300C\u305B\u304B\u3044\u306B1\u3074\u304D\u3060\u3051\u300D\u306E \u3044\u304D\u3082\u306E\u3002<br>\u6BCE\u65E5 \u4F1A\u3044\u306B\u3044\u304F\u3068\u3001\u3053\u3068\u3070\u3084 \u540D\u524D\u3092 \u899A\u3048\u3066\u3044\u304D\u307E\u3059\u3002</p>
<a class="b" href="/">\u25B6 \u3074\u3053\u3063\u3068\u3067 \u3058\u3076\u3093\u3060\u3051\u306E\u5B50\u3092 \u305D\u3060\u3066\u308B</a></div></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}

// tools/worker-entry.js
var worker_entry_default = {
  async fetch(request, env, ctx2) {
    const url = new URL(request.url), path = url.pathname, m = request.method;
    const c = (params) => ({ request, env, params, waitUntil: (p) => ctx2.waitUntil(p) });
    let r;
    if (path.startsWith("/api/")) {
      if (m === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      if (!env.PETS) return json({ ok: false, error: "kv_not_bound" }, 503);
      try {
        if (path === "/api/register" && m === "POST") return await onRequestPost(c({}));
        if (r = /^\/api\/pet\/([^/]+)$/.exec(path)) {
          if (m === "GET") return await onRequestGet(c({ id: r[1] }));
          if (m === "PUT") return await onRequestPut(c({ id: r[1] }));
        }
        if (path === "/api/backup" && m === "POST") return await onRequestPost2(c({}));
        if ((r = /^\/api\/backup\/([^/]+)$/.exec(path)) && m === "GET") return await onRequestGet2(c({ code: r[1] }));
        return json({ ok: false, error: "not_found" }, 404);
      } catch (e) {
        return json({ ok: false, error: e.message === "too_big" ? "too_big" : "server" }, e.message === "too_big" ? 413 : 500);
      }
    }
    if ((r = /^\/og\/([^/]+)$/.exec(path)) && m === "GET") return onRequestGet3(c({ file: r[1] }));
    if ((r = /^\/p\/([^/]+)$/.exec(path)) && m === "GET") return onRequestGet4(c({ id: r[1] }));
    return env.ASSETS.fetch(request);
  }
};
export {
  worker_entry_default as default
};
