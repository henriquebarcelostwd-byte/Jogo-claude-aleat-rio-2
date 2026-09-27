/* PELEJA — utilidades gerais, paleta e constantes */
(function () {
  'use strict';
  const G = (window.G = window.G || {});

  G.W = 960;
  G.H = 540;
  G.TILE = 48;
  G.time = 0;      // tempo global em segundos
  G.RS = 1;        // escala de renderização (qualidade)
  G.boil = 0;      // índice do "traço vivo" (0..2)
  G.DEBUG = /[?&]debug/.test(location.search);

  const U = (G.U = {});

  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
  U.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  U.angle = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
  U.approach = (v, t, d) => (v < t ? Math.min(v + d, t) : Math.max(v - d, t));
  U.rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  U.randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  U.pick = (arr) => arr[(Math.random() * arr.length) | 0];
  U.chance = (p) => Math.random() < p;
  U.sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);
  U.TAU = Math.PI * 2;

  U.shuffle = function (arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  };

  // gerador pseudoaleatório determinístico (mulberry32)
  U.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // hash determinístico de números -> [0,1)
  U.hash = function (a, b = 0, c = 0) {
    let h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b);
    h = Math.imul(h ^ ((b | 0) + 0x632be5ab), 0xc2b2ae35);
    h = Math.imul(h ^ ((c | 0) + 0x27d4eb2f), 0x165667b1);
    h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  };

  U.strHash = function (s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  // ruído suave 1D
  U.noise1 = function (x, seed = 0) {
    const i = Math.floor(x);
    const f = x - i;
    const a = U.hash(i, seed);
    const b = U.hash(i + 1, seed);
    const s = f * f * (3 - 2 * f);
    return a + (b - a) * s;
  };

  U.ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: (t) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    outElastic: (t) => {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    },
    outBounce: (t) => {
      const n1 = 7.5625, d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
  };

  U.angDiff = function (a, b) {
    let d = b - a;
    while (d > Math.PI) d -= U.TAU;
    while (d < -Math.PI) d += U.TAU;
    return d;
  };

  U.dirName = function (dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
    return dy < 0 ? 'up' : 'down';
  };

  U.dirVec = function (dir) {
    switch (dir) {
      case 'up': return { x: 0, y: -1 };
      case 'down': return { x: 0, y: 1 };
      case 'left': return { x: -1, y: 0 };
      default: return { x: 1, y: 0 };
    }
  };

  U.dirAngle = function (dir) {
    switch (dir) {
      case 'up': return -Math.PI / 2;
      case 'down': return Math.PI / 2;
      case 'left': return Math.PI;
      default: return 0;
    }
  };

  U.rectsOverlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  U.inRect = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

  U.copy = (o) => JSON.parse(JSON.stringify(o));

  U.fmtTime = function (s) {
    s = Math.floor(s);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = (h > 0 && m < 10 ? '0' : '') + m;
    return (h > 0 ? h + ':' : '') + mm + ':' + (sec < 10 ? '0' : '') + sec;
  };

  // quebra de texto por largura (usa a fonte já setada no ctx)
  U.wrap = function (ctx, text, maxW) {
    const out = [];
    const paras = String(text).split('\n');
    for (const p of paras) {
      const words = p.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test.replace(/[*]/g, '')).width > maxW && line) {
          out.push(line);
          line = w;
        } else line = test;
      }
      out.push(line);
    }
    return out;
  };

  // ---------------------------------------------------------------
  // Paleta fixa (HUD e menus) e paleta de mundo (varia por capítulo)
  // ---------------------------------------------------------------
  G.C = {
    paper: '#efe2c4',
    paperLight: '#f8f0dc',
    paperDark: '#d6c39c',
    ink: '#1d1712',
    inkSoft: '#3b2f26',
    red: '#c23a22',
    redDark: '#8a2415',
    sepia: '#9a7152',
    skin: '#a87a55',
    skinDark: '#6f4a31',
    gold: '#d9a93a',
    blue: '#5f86aa',
    pink: '#d98b87',
    yellow: '#e6c14f',
    green: '#728c4c',
    white: '#fbf7ec',
    night: '#120e0b',
  };

  G.THEMES = {
    vila:   { paper: '#f1dc9c', paperDark: '#d8bd72', ink: '#1d1712', red: '#c23a22', mid: '#8a6a3c', skin: '#a87a55', hatch: '#2a1e14', negative: false, light: '#ffcf6a' },
    sertao: { paper: '#ecc987', paperDark: '#cfa45c', ink: '#1f1610', red: '#c23a22', mid: '#8c5f33', skin: '#a87a55', hatch: '#24170d', negative: false, light: '#ffc760' },
    acude:  { paper: '#c7dbe2', paperDark: '#98b6c3', ink: '#141a20', red: '#c23a22', mid: '#4f6b7c', skin: '#a87a55', hatch: '#0f1a24', negative: false, light: '#e9f1ff' },
    cidade: { paper: '#efc5bf', paperDark: '#d49d95', ink: '#21141a', red: '#b8281c', mid: '#8a5560', skin: '#a87a55', hatch: '#1f1016', negative: false, light: '#ffd9a0' },
    margem: { paper: '#efe6d0', paperDark: '#cfc2a4', ink: '#1d1712', red: '#c7402a', mid: '#8b6a4a', skin: '#a87a55', hatch: '#000000', negative: false, light: '#ffffff', bg: '#0f0c0a' },
    papel:  { paper: '#efe2c4', paperDark: '#d6c39c', ink: '#1d1712', red: '#c23a22', mid: '#8b6a4a', skin: '#a87a55', hatch: '#1d1712', negative: false, light: '#ffd27a' },
  };

  G.Pal = Object.assign({}, G.THEMES.papel);
  G.setTheme = function (name) {
    const th = G.THEMES[name] || G.THEMES.papel;
    Object.assign(G.Pal, th);
    G.Pal.name = name;
  };

  G.F = {
    title: '"Rye", "Georgia", serif',
    body: '"IM Fell English", "Georgia", serif',
  };
  G.font = function (size, which = 'body', style = '') {
    return (style ? style + ' ' : '') + size + 'px ' + (which === 'title' ? G.F.title : G.F.body);
  };

  // cache de canvases desenhados em escala de renderização
  const cache = new Map();
  G.Cache = {
    get(key, w, h, draw) {
      const k = key + '@' + G.RS;
      let c = cache.get(k);
      if (!c) {
        c = document.createElement('canvas');
        c.width = Math.max(1, Math.ceil(w * G.RS));
        c.height = Math.max(1, Math.ceil(h * G.RS));
        const x = c.getContext('2d');
        x.scale(G.RS, G.RS);
        draw(x, w, h);
        c.lw = w;
        c.lh = h;
        cache.set(k, c);
      }
      return c;
    },
    clear() { cache.clear(); },
    size() { return cache.size; },
  };

  G.makeCanvas = function (w, h, scaled = true) {
    const c = document.createElement('canvas');
    const s = scaled ? G.RS : 1;
    c.width = Math.max(1, Math.ceil(w * s));
    c.height = Math.max(1, Math.ceil(h * s));
    const x = c.getContext('2d');
    if (scaled) x.scale(s, s);
    c.lw = w;
    c.lh = h;
    return c;
  };
})();
