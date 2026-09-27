/* PELEJA — construtor de mapas e todos os lugares do Sertão de Papel */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const T = G.TILE;

  class MB {
    constructor(id, w, h, fill = '#') {
      this.id = id;
      this.w = w;
      this.h = h;
      this.t = [];
      for (let y = 0; y < h; y++) this.t.push(new Array(w).fill(fill));
      this.props = [];
      this.spawns = [];
      this.triggers = [];
      this.zones = [];
      this.exits = [];
      this.lights = [];
      this.pts = {};
      this.r = U.rng(U.strHash(id) + 7);
    }
    in(x, y) {
      return x >= 0 && y >= 0 && x < this.w && y < this.h;
    }
    get(x, y) {
      return this.in(x, y) ? this.t[y][x] : '#';
    }
    set(x, y, c) {
      if (this.in(x, y)) this.t[y][x] = c;
    }
    fill(c) {
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.t[y][x] = c;
    }
    rect(x, y, w, h, c) {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
    }
    border(n, c, rough = 0.35) {
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        const d = Math.min(x, y, this.w - 1 - x, this.h - 1 - y);
        if (d < n || (d === n && U.hash(x, y, 91) < rough)) this.t[y][x] = c;
      }
    }
    ellipse(cx, cy, rx, ry, c, rough = 0.12, only = null) {
      for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) {
        for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
          const a = Math.atan2(y - cy, x - cx);
          const k = 1 + (U.noise1(((a + Math.PI) / U.TAU) * 9, U.strHash(this.id) % 97 + cx) - 0.5) * 2 * rough;
          const d = Math.hypot((x - cx) / (rx * k), (y - cy) / (ry * k));
          if (d <= 1 && (!only || only.includes(this.get(x, y)))) this.set(x, y, c);
        }
      }
    }
    disc(cx, cy, r, c, rough) {
      this.ellipse(cx, cy, r, r, c, rough);
    }
    path(pts, w, c, only = null) {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[i + 1];
        const L = Math.hypot(x1 - x0, y1 - y0);
        const n = Math.ceil(L * 3);
        for (let k = 0; k <= n; k++) {
          const px = U.lerp(x0, x1, k / n), py = U.lerp(y0, y1, k / n);
          for (let y = Math.floor(py - w); y <= Math.ceil(py + w); y++) {
            for (let x = Math.floor(px - w); x <= Math.ceil(px + w); x++) {
              if (Math.hypot(x - px, y - py) <= w && (!only || only.includes(this.get(x, y)))) this.set(x, y, c);
            }
          }
        }
      }
    }
    bridge(x, y, w, h) {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.get(i, j) === '~') this.set(i, j, 'l');
    }
    sprinkle(c, prob, on = '.', seed = 1) {
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        if (this.t[y][x] === on && U.hash(x, y, seed * 13) < prob) this.t[y][x] = c;
      }
    }
    stamp(x, y, rows, legend = {}) {
      rows.forEach((row, j) => {
        for (let i = 0; i < row.length; i++) {
          const ch = row[i];
          if (ch === '?') continue;
          const L = legend[ch];
          if (typeof L === 'function') L(x + i, y + j);
          else if (L !== undefined) this.set(x + i, y + j, L);
          else this.set(x + i, y + j, ch);
        }
      });
    }
    px(tx) {
      return tx * T + T / 2;
    }
    py(ty) {
      return ty * T + T * 0.75;
    }
    prop(kind, tx, ty, o = {}) {
      const p = Object.assign({ kind, x: tx * T + T / 2 + (o.dx || 0), y: (ty + 1) * T + (o.dy || 0) }, o);
      this.props.push(p);
      return p;
    }
    ent(kind, tx, ty, o = {}) {
      const e = Object.assign({ kind, x: tx * T + T / 2 + (o.dx || 0), y: ty * T + T * 0.75 + (o.dy || 0) }, o);
      this.spawns.push(e);
      return e;
    }
    npc(char, id, tx, ty, o = {}) {
      return this.ent('npc', tx, ty, Object.assign({ char, id, talk: id }, o));
    }
    enemy(kind, tx, ty, o = {}) {
      return this.ent(kind, tx, ty, o);
    }
    pt(name, tx, ty) {
      this.pts[name] = { x: tx * T + T / 2, y: ty * T + T * 0.75 };
    }
    zone(name, x, y, w, h) {
      this.zones.push({ name, x: x * T, y: y * T, w: w * T, h: h * T });
    }
    trigger(id, x, y, w, h, o = {}) {
      this.triggers.push(Object.assign({ id, x: x * T, y: y * T, w: w * T, h: h * T }, o));
    }
    exit(x, y, w, h, to, sx, sy, o = {}) {
      this.exits.push(Object.assign({ x: x * T, y: y * T, w: w * T, h: h * T, to, sx, sy }, o));
    }
    light(tx, ty, r) {
      this.lights.push({ x: tx * T + T / 2, y: ty * T + T / 2, r });
    }
    // espalha props em chão livre, longe de trilhas e de outras coisas
    scatter(kind, n, x0, y0, w, h, o = {}) {
      const r = this.r;
      let placed = 0, tries = 0;
      const on = o.on || '.,';
      while (placed < n && tries < n * 40) {
        tries++;
        const tx = x0 + Math.floor(r() * w), ty = y0 + Math.floor(r() * h);
        if (!on.includes(this.get(tx, ty))) continue;
        if (o.clear !== false) {
          let bad = false;
          for (let j = -1; j <= 1 && !bad; j++) for (let i = -1; i <= 1; i++) {
            const c = this.get(tx + i, ty + j);
            if (c === ':' || c === 'l' || c === 'L' || c === '=' || c === 's') bad = true;
          }
          if (bad) continue;
        }
        const px = tx * T + T / 2, py = (ty + 1) * T;
        const minD = o.minD || 70;
        if (this.props.some((p) => U.dist(p.x, p.y, px, py) < minD)) continue;
        if (this.spawns.some((p) => U.dist(p.x, p.y, px, py) < 72)) continue;
        if (Object.values(this.pts).some((p) => U.dist(p.x, p.y, px, py) < 110)) continue;
        if ((this.noScatter || []).some((r) => tx >= r[0] && ty >= r[1] && tx < r[0] + r[2] && ty < r[1] + r[3])) continue;
        this.prop(kind, tx, ty, { v: Math.floor(r() * 4), dx: (r() - 0.5) * 16, dy: (r() - 0.5) * 8, flower: o.flower && r() < 0.2 });
        placed++;
      }
    }
    build(meta) {
      const self = this;
      return Object.assign(
        {
          id: this.id, w: this.w, h: this.h, tiles: this.t, props: this.props, spawns: this.spawns, triggers: this.triggers,
          zones: this.zones, exits: this.exits, lights: this.lights, pts: this.pts,
          get(x, y) {
            return x >= 0 && y >= 0 && x < self.w && y < self.h ? self.t[y][x] : '#';
          },
          set(x, y, c) {
            if (x >= 0 && y >= 0 && x < self.w && y < self.h) self.t[y][x] = c;
          },
        },
        meta
      );
    }
  }
  G.MB = MB;

  const DEFS = {};
  function def(id, d) {
    DEFS[id] = d;
  }

  G.Maps = {
    defs: DEFS,
    build(id, S) {
      const d = DEFS[id];
      if (!d) throw new Error('mapa desconhecido: ' + id);
      const B = new MB(id, d.w, d.h, d.fill || '#');
      d.build(B, S || G.state);
      const m = B.build({
        name: d.name, theme: d.theme, music: d.music, amb: d.amb, def: d, chapter: d.chapter, arena: B.arena || null,
      });
      return m;
    },
  };

  // ==================================================================
  // PRÓLOGO — VILA RIMA
  // ==================================================================
  def('vila', {
    name: 'Vila Rima', theme: 'vila', chapter: 'prologo', w: 44, h: 34, fill: '.',
    build(B) {
      B.border(2, '#', 0.4);
      B.disc(22, 18, 8.6, ':', 0.1);
      B.path([[22, 26], [22, 32]], 1.3, ':');
      B.path([[22, 9], [22, 12]], 1.1, ':');
      B.path([[13, 18], [4, 18]], 1, ':');
      B.path([[31, 18], [38, 18]], 1, ':');
      B.sprinkle(',', 0.1, '.', 3);
      // construções
      B.prop('igreja', 22, 8);
      B.prop('casa', 8, 8, { v: 0 });
      B.prop('casa', 14, 8, { v: 1 });
      B.prop('casa', 30, 8, { v: 2 });
      B.prop('casa', 36, 8, { v: 3 });
      B.prop('casa', 7, 29, { v: 2 });
      B.prop('casa', 13, 30, { v: 0 });
      B.prop('casa', 31, 30, { v: 1 });
      B.prop('casa', 37, 29, { v: 3 });
      B.prop('barraca', 16, 14, { v: 0 });
      B.prop('barraca', 28, 14, { v: 1 });
      B.prop('barraca', 16, 23, { v: 2 });
      B.prop('barraca', 28, 23, { v: 3 });
      B.prop('barraca', 6, 16, { v: 2 });
      B.prop('palanque', 38, 16);
      B.prop('poco', 22, 18);
      B.prop('arvore', 4, 12, { fruit: true });
      B.prop('arvore', 40, 11, { v: 1 });
      B.prop('arvore', 4, 24, { v: 2 });
      B.prop('arvore', 40, 24, { v: 3, fruit: true });
      B.prop('arvore', 29, 4, { v: 4 });
      B.prop('potes', 19, 14);
      B.prop('potes', 25, 23);
      B.prop('banco', 10, 24);
      B.prop('banco', 34, 12);
      B.prop('carroca', 34, 25);
      B.prop('cerca', 3, 27);
      B.prop('cerca', 41, 20, {});
      B.ent('over', 0, 0, { type: 'bunting', x1: 13 * T, y1: 11 * T, x2: 31 * T, y2: 11 * T, n: 16, sag: 34 });
      B.ent('over', 0, 0, { type: 'bunting', x1: 13 * T, y1: 25.5 * T, x2: 31 * T, y2: 25.5 * T, n: 16, sag: 30 });
      B.ent('over', 0, 0, { type: 'bunting', x1: 36 * T, y1: 13 * T, x2: 41 * T, y2: 20 * T, n: 8, sag: 18 });
      // cordões de folheto
      B.ent('cordao', 11, 13, { fid: 'oeste' });
      B.ent('cordao', 22, 12, { fid: 'igreja' });
      B.ent('cordao', 33, 13, { fid: 'leste' });
      // baú escondido ao lado da igreja
      B.ent('chest', 27, 4, { fid: 'vila1', content: { verse: 1 } });
      B.ent('sign', 24, 30, { text: 'VILA RIMA — Feira aos domingos. Terra de cantador, de rendeira e de gente que não tem medo de verso.' });
      // gente
      B.npc('filo', 'filo', 6, 18, { dir: 'down' });
      B.npc('sabia', 'sab', 38, 18, { dir: 'down' });
      B.npc('candinha', 'can', 11, 24, { dir: 'down' });
      B.npc('virgula', 'vir', 34, 31, { dir: 'left' });
      B.npc('ze', 'ze', 27, 27, { dir: 'down' });
      B.npc('moca', 'moca1', 18, 17, { wander: 40 });
      B.npc('vendedor', 'vend1', 28, 15, { dir: 'down', lookAt: true });
      B.npc('menino', 'meni1', 25, 20, { wander: 60 });
      B.npc('vendedor', 'vend2', 16, 15, { dir: 'down' });
      B.npc('moca', 'moca2', 20, 11, { dir: 'down' });
      B.ent('critter', 4, 20, { char: 'lorota', id: 'lor', talk: 'lor', dir: 'right', speed: 0, wanderless: true });
      B.ent('critter', 9, 14, { char: 'galinha', skittish: true });
      B.ent('critter', 35, 22, { char: 'galinha', skittish: true });
      B.ent('critter', 30, 27, { char: 'galinha', skittish: true });
      B.pt('start', 19, 21);
      B.pt('palanque', 38, 18);
      B.pt('praca', 22, 20);
      B.pt('sul', 22, 31);
      B.pt('norte', 22, 12);
      B.zone('Praça da Feira', 13, 10, 18, 17);
    },
  });

  // ==================================================================
  // PRÓLOGO — A FUGA DA FEIRA
  // ==================================================================
  def('fuga', {
    name: 'A Fuga da Feira', theme: 'vila', chapter: 'prologo', w: 22, h: 100, fill: '.',
    build(B) {
      B.rect(0, 0, 3, B.h, '#');
      B.rect(19, 0, 3, B.h, '#');
      for (let y = 0; y < B.h; y++) {
        if (U.hash(1, y, 4) < 0.35) B.set(3, y, '#');
        if (U.hash(2, y, 4) < 0.35) B.set(18, y, '#');
      }
      B.rect(0, 0, B.w, 2, '#');
      B.path([[11, 99], [11, 2]], 2.2, ':');
      B.sprinkle(',', 0.08, '.', 5);
      const rows = [
        [91, 'ffff....ffffffff'],
        [85, '.b.....hh....b..'],
        [79, '....c......r....'],
        [74, 'oooo..ffff..oooo'],
        [69, '..p..b.....b..p.'],
        [64, 'hhh.......hhhhhh'],
        [59, '....f.f.f.f.f...'],
        [54, '.c.......c......'],
        [49, 'ffffff....ffffff'],
        [44, '..r..hh..r..hh..'],
        [39, '.b....ooo....b..'],
        [34, 'hhhhhhh....hhhhh'],
        [29, '..f..f..f..f..f.'],
        [23, '...c.......c....'],
        [17, 'oooooo....oooooo'],
        [11, 'ffff........ffff'],
      ];
      for (const [y, row] of rows) {
        for (let i = 0; i < row.length; i++) {
          const x = 3 + i;
          const c = row[i];
          if (c === 'h') B.set(x, y, 'h');
          else if (c === 'o') B.set(x, y, 'o');
          else if (c === 'f') B.prop('cerca', x, y);
          else if (c === 'b') B.prop('barraca', x, y, { v: (x + y) % 4 });
          else if (c === 'c') B.prop('carroca', x, y);
          else if (c === 'p') B.prop('potes', x, y);
          else if (c === 'r') B.prop('pedra', x, y, { v: y % 4 });
        }
      }
      B.prop('porteira', 11, 5);
      B.pt('start', 11, 96);
      B.pt('porteira', 11, 7);
      B.trigger('fimFuga', 3, 3, 16, 5);
    },
  });

  // ==================================================================
  // CAPÍTULO I — SERTÃO DAS LETRAS SOLTAS
  // ==================================================================
  def('sertao', {
    name: 'Sertão das Letras Soltas', theme: 'sertao', chapter: 'cap1', w: 64, h: 60,
    build(B) {
      // Pouso do Vaqueiro
      B.ellipse(32, 50, 8.5, 6, '.');
      B.path([[32, 55], [32, 58]], 1.6, '.');
      // Lajedo dos Calangos (oeste)
      B.ellipse(13, 38, 9, 7.5, '.', 0.2);
      B.path([[27, 49], [21, 45], [15, 40]], 1.7, ':');
      B.ellipse(7, 31, 4.5, 3.2, '.', 0.15);
      B.path([[10, 36], [8, 32]], 1.3, ':');
      // nicho secreto atrás da rocha rachada
      B.rect(4, 39, 1, 7, '#');
      B.rect(1, 41, 3, 3, '.');
      B.rect(4, 42, 3, 1, '.');
      // Vale dos Ossos (leste)
      B.ellipse(51, 37, 10, 8.5, '.', 0.2);
      B.path([[38, 48], [45, 43], [49, 39]], 1.7, ':');
      B.ellipse(57, 29.5, 4.5, 3.4, '.', 0.15);
      B.path([[54, 33], [57, 30]], 1.3, ':');
      B.ellipse(59, 43, 2.6, 2, '.', 0.1);
      // corredor norte e Portão das Letras
      B.path([[32, 44], [32, 25]], 1.6, ':');
      B.rect(27, 15, 11, 9, '.');
      B.rect(31, 24, 3, 2, '.');
      B.set(32, 14, '.');
      B.rect(29, 9, 7, 5, '.');
      // trilha da Serra do Chapéu (nordeste)
      B.path([[50, 31], [52, 23], [54, 17]], 1.6, ':');
      B.ellipse(54, 10, 5.5, 5.5, '.', 0.15);
      B.path([[54, 6], [54, 2]], 1.2, ':');
      B.sprinkle(',', 0.08, '.', 11);

      // candeeiros
      B.ent('candeeiro', 32, 47, { fid: 'pouso', alwaysLit: true, checkpoint: true });
      B.ent('candeeiro', 7, 30, { fid: 'oeste', checkpoint: true, count: true });
      B.ent('candeeiro', 58, 29, { fid: 'leste', checkpoint: true, count: true });
      B.ent('candeeiro', 32, 10, { fid: 'norte', checkpoint: true, count: true });
      // Pouso
      B.prop('casa', 38, 45, { v: 3 });
      B.prop('fogueira', 29, 51);
      B.light(29, 50, 220);
      B.prop('banco', 29, 53);
      B.npc('filo', 'filo', 25, 50, { dir: 'right' });
      B.ent('critter', 24, 52, { char: 'lorota', id: 'lor', talk: 'lor', dir: 'right', speed: 0 });
      B.npc('tiao', 'tiao', 35, 49, { dir: 'down' });
      B.npc('ze', 'ze', 27, 54, { dir: 'up' });
      B.npc('virgula', 'vir', 37, 54, { dir: 'left' });
      B.ent('sign', 33, 56, { text: 'POUSO DO VAQUEIRO. Oeste: Lajedo dos Calangos. Leste: Vale dos Ossos. Norte: Portão das Letras. Nordeste: Serra do Chapéu.' });
      // Lajedo
      B.ent('breakable', 4, 42, { fid: 'lajedo', by: 'stamp', style: 'rocha' });
      B.ent('chest', 2, 42, { fid: 'sertao1', content: { verse: 2 } });
      B.enemy('calango', 12, 36);
      B.enemy('calango', 17, 41);
      B.enemy('calango', 9, 40);
      B.enemy('borrao', 14, 33);
      B.enemy('borrao', 20, 38);
      B.enemy('mandacaruzinho', 5, 33);
      B.ent('sign', 22, 44, { text: 'LAJEDO DOS CALANGOS — Cuidado: calango de chumbo só anda em linha reta. Não fique na frente dele!' });
      // Vale dos Ossos
      B.enemy('urubu', 50, 34);
      B.enemy('urubu', 54, 40);
      B.enemy('borrao', 47, 38);
      B.enemy('borrao', 55, 35);
      B.enemy('mandacaruzinho', 51, 31);
      B.enemy('mandacaruzinho', 45, 36);
      B.ent('critter', 59, 43, { char: 'bodinha', id: 'bod', talk: 'bod', dir: 'left', speed: 30 });
      for (const [x, y] of [[57, 41], [61, 42], [58, 45], [61, 45]]) B.prop('xique', x, y, { v: x });
      for (let i = 0; i < 8; i++) B.prop(i % 2 ? 'caveira' : 'ossos', 44 + ((i * 7) % 15), 32 + ((i * 5) % 11), { v: i });
      // Portão das Letras
      B.ent('slot', 30, 15, { letter: 'S' });
      B.ent('slot', 32, 15, { letter: 'O' });
      B.ent('slot', 34, 15, { letter: 'L' });
      B.ent('block', 28, 19, { letter: 'S', home: [28, 19] });
      B.ent('block', 32, 20, { letter: 'O', home: [32, 20] });
      B.ent('block', 36, 21, { letter: 'L', home: [36, 21] });
      B.ent('lever', 28, 23, { puzzle: 'sol' });
      B.ent('gate', 32, 14, { flag: 'portaoSol', style: 'letras', dy: 12 });
      B.ent('chest', 34, 10, { fid: 'sertao2', content: { verse: 3 } });
      B.ent('sign', 30, 24, { text: 'PORTÃO DAS LETRAS — "Diga o nome do que foi comido e a porta se abre." (Empurre as pedras. A alavanca recomeça.)' });
      B.enemy('borrao', 29, 21);
      B.enemy('borrao', 36, 18);
      B.enemy('borrao', 32, 34);
      B.enemy('calango', 32, 29);
      // Serra do Chapéu
      B.ent('gate', 54, 17, { flag: 'serraAberta', style: 'pedra', wt: 3, cw: 150, ch: 40 });
      B.prop('chapeuPedra', 54, 7);
      // decoração
      B.pt('start', 32, 57);
      B.pt('pouso', 32, 50);
      B.noScatter = [[24, 45, 17, 12], [26, 8, 13, 17]];
      B.scatter('mandacaru', 30, 1, 1, 62, 58, { flower: true });
      B.scatter('xique', 26, 1, 1, 62, 58);
      B.scatter('pedra', 14, 1, 1, 62, 58);
      B.scatter('galho', 7, 1, 1, 62, 58);
      B.scatter('caveira', 5, 40, 26, 22, 22);
      B.scatter('ossos', 6, 1, 1, 62, 58);
      B.pt('start', 32, 57);
      B.pt('pouso', 32, 50);
      B.pt('serra', 54, 14);
      B.pt('serraCam', 54, 12);
      B.pt('portao', 32, 18);
      B.exit(52, 1, 5, 2, 'serra', 13, 19, { need: 'serraAberta' });
      B.zone('Pouso do Vaqueiro', 23, 44, 18, 13);
      B.zone('Lajedo dos Calangos', 2, 28, 20, 18);
      B.zone('Vale dos Ossos', 41, 26, 22, 21);
      B.zone('Portão das Letras', 26, 8, 13, 17);
      B.zone('Serra do Chapéu', 47, 3, 14, 14);
    },
  });

  def('serra', {
    name: 'Serra do Chapéu', theme: 'sertao', chapter: 'cap1', w: 26, h: 22,
    build(B) {
      B.ellipse(13, 10.5, 10.5, 8.5, '.', 0.12);
      B.path([[13, 18], [13, 21]], 1.3, ':');
      B.sprinkle(',', 0.1, '.', 17);
      for (const [x, y] of [[4, 5], [22, 6], [3, 14], [23, 14], [6, 18], [20, 18]]) B.prop('mandacaru', x, y, { v: x });
      for (const [x, y] of [[8, 3], [18, 3], [2, 10], [24, 10]]) B.prop('pedrao', x, y, { v: y });
      B.ent('mandacaru', 13, 6, { id: 'man' });
      B.pt('start', 13, 19);
      B.pt('boss', 13, 6);
      B.pt('centro', 13, 11);
      B.arena = { x: 13 * T + T / 2, y: 11 * T, r: 9 * T };
    },
  });

  // ==================================================================
  // CAPÍTULO II — AÇUDE DAS RENDAS
  // ==================================================================
  def('acude', {
    name: 'Açude das Rendas', theme: 'acude', chapter: 'cap2', w: 64, h: 56, fill: '~',
    build(B) {
      B.border(2, '#', 0.4);
      // margem sul
      B.ellipse(32, 50, 20, 5.5, '.', 0.08);
      B.rect(12, 50, 40, 4, '.');
      // ilha central
      B.ellipse(32, 33, 8.5, 5.2, '.', 0.12);
      // ponte A (margem -> ilha central) — só depois das terras
      // ilhota do sino A
      B.ellipse(21, 41.5, 1.6, 1.3, '.', 0);
      // ilha oeste (labirinto de teias)
      B.ellipse(12, 25, 8.2, 7.2, '.', 0.15);
      B.ellipse(22, 35.5, 1.4, 1.2, '.', 0);
      // teias e juncos na ilha oeste
      B.stamp(6, 20, [
        '..w.#..w..',
        '.#..#.##..',
        '.#w....w#.',
        '.##.ww.#..',
        '..w..#....',
        '.#..w#.ww.',
        '....##..#.',
      ]);
      B.ellipse(19.5, 15.5, 1.4, 1.2, '.', 0);
      // terra do norte
      B.ellipse(32, 9.5, 11, 6.5, '.', 0.12);
      B.path([[32, 4], [32, 2]], 1.2, '.');
      // ilha leste + píer fixo
      B.ellipse(51, 30, 7.5, 6, '.', 0.12);
      B.rect(46, 35, 2, 12, '=');
      // pontes de renda (água que vira renda quando o sino toca)
      B.bridge(31, 38, 2, 8);
      B.bridge(17, 30, 8, 2);
      B.bridge(31, 15, 2, 14);
      B.sprinkle(',', 0.1, '.', 23);
      // gente na margem
      B.ent('candeeiro', 32, 47, { fid: 'margem', alwaysLit: true, checkpoint: true });
      B.prop('palafita', 22, 47, { v: 0 });
      B.prop('palafita', 41, 47, { v: 1 });
      B.prop('varal', 36, 52);
      B.prop('almofadaDeco', 27, 51);
      B.npc('tete', 'tete', 26, 49, { dir: 'down' });
      B.npc('lala', 'lala', 28, 50, { dir: 'down' });
      B.npc('anzol', 'anz', 44, 50, { dir: 'left' });
      B.npc('filo', 'filo', 16, 51, { dir: 'right' });
      B.ent('critter', 14, 52, { char: 'lorota', id: 'lor', talk: 'lor', dir: 'right', speed: 0 });
      B.npc('virgula', 'vir', 50, 51, { dir: 'left' });
      B.ent('sign', 30, 53, { text: 'AÇUDE DAS RENDAS — Aqui a água é mansa e a linha é braba. Pontes só se erguem ao som dos sinos de bilro.' });
      // sinos
      B.ent('bell', 21, 41, { fid: 'A', bridge: [31, 38, 2, 8] });
      B.ent('bell', 22, 35, { fid: 'B', bridge: [17, 30, 8, 2] });
      B.ent('bell', 19, 15, { fid: 'C', bridge: [31, 15, 2, 14] });
      // ilha oeste
      B.ent('chest', 6, 21, { fid: 'acude1', content: { verse: 4 } });
      B.enemy('novelo', 10, 27);
      B.enemy('novelo', 15, 22);
      B.enemy('agulheira', 12, 19);
      // ilha central
      B.prop('arvore', 36, 31, { v: 2 });
      B.enemy('agulheira', 28, 31);
      B.ent('breakable', 25, 34, { fid: 'no1', by: 'stamp', style: 'no', drop: { rimas: 25 } });
      // ilha leste
      B.prop('jangada', 55, 34, { v: 1 });
      B.ent('item', 54, 27, { item: 'bilroOuro' });
      B.enemy('novelo', 49, 29);
      B.enemy('novelo', 53, 32);
      B.enemy('agulheira', 51, 26);
      // peixes
      for (const [x, y] of [[27, 42], [36, 41], [43, 40], [50, 39], [28, 22], [35, 21], [18, 36], [8, 34]]) B.enemy('peixe', x, y);
      // norte
      B.ent('candeeiro', 27, 11, { fid: 'norteAcude', checkpoint: true });
      B.enemy('agulheira', 36, 8);
      B.enemy('borrao', 30, 7);
      B.enemy('borrao', 35, 11);
      // decoração
      for (const [x, y] of [[14, 48], [48, 47], [23, 38], [41, 36], [18, 28], [44, 31], [25, 12], [40, 13], [6, 29], [57, 27]]) B.prop('junco', x, y, { v: x });
      B.prop('jangada', 40, 41, { v: 0 });
      B.prop('jangada', 12, 38, { v: 2 });
      B.prop('almofadaDeco', 36, 8);
      B.pt('start', 32, 53);
      B.pt('margem', 32, 49);
      B.pt('ponteA', 31.5, 42);
      B.pt('norte', 32, 8);
      B.exit(30, 1, 5, 2, 'almofada', 14, 19);
      B.zone('Margem das Rendeiras', 12, 44, 40, 11);
      B.zone('Ilha do Juazeiro', 23, 28, 18, 11);
      B.zone('Ilha das Teias', 3, 17, 18, 16);
      B.zone('Ilha do Barco Afundado', 43, 23, 17, 13);
      B.zone('Beira da Almofada Grande', 20, 3, 24, 13);
    },
  });

  def('almofada', {
    name: 'A Almofada Grande', theme: 'acude', chapter: 'cap2', w: 28, h: 22, fill: '~',
    build(B) {
      B.border(1, '#', 0.3);
      B.ellipse(14, 10.5, 11.5, 8.2, 'L', 0.05);
      B.path([[14, 18], [14, 21]], 1.2, 'L');
      for (const [x, y] of [[2, 3], [25, 3], [1, 18], [26, 18]]) B.prop('junco', x, y, { v: x });
      B.ent('renda', 14, 5, { id: 'ren' });
      B.pt('start', 14, 19);
      B.pt('boss', 14, 5);
      B.arena = { x: 14 * T + T / 2, y: 11 * T, r: 10.5 * T };
    },
  });

  // ==================================================================
  // CAPÍTULO III — CIDADE DE PAPELÃO
  // ==================================================================
  def('cidade', {
    name: 'Cidade de Papelão', theme: 'cidade', chapter: 'cap3', w: 64, h: 56, fill: 'B',
    build(B) {
      // avenidas
      B.rect(2, 46, 60, 4, 's');
      B.rect(2, 27, 60, 4, 's');
      B.rect(10, 10, 44, 3, 's');
      // ruas
      B.rect(4, 12, 3, 38, 's');
      B.rect(30, 10, 4, 46, 's');
      B.rect(57, 12, 3, 38, 's');
      B.rect(4, 10, 7, 3, 's');
      B.rect(53, 10, 7, 3, 's');
      // praça do beco (hub)
      B.rect(23, 37, 18, 9, '.');
      // pátios das prensas
      B.rect(8, 15, 13, 10, '.');
      B.rect(7, 19, 1, 3, '.');
      B.rect(44, 15, 12, 10, '.');
      B.rect(56, 19, 1, 3, '.');
      B.rect(42, 34, 13, 10, '.');
      B.rect(47, 44, 3, 2, '.');
      // tipografia
      B.rect(25, 2, 14, 7, 'x');
      B.rect(31, 9, 2, 1, 's');
      // beco das caixas + arquivo
      B.rect(12, 38, 7, 5, '.');
      B.rect(19, 40, 4, 2, '.');
      B.rect(60, 32, 3, 5, '.');
      B.set(60, 34, '.');
      B.sprinkle(',', 0.06, '.', 31);
      // hub
      B.ent('candeeiro', 32, 39, { fid: 'beco', alwaysLit: true, checkpoint: true });
      B.prop('banca', 37, 38);
      B.npc('biu', 'biu', 26, 40, { dir: 'right' });
      B.npc('juca', 'juca', 36, 40, { dir: 'down' });
      B.npc('zefinha', 'zef', 25, 44, { dir: 'right' });
      B.npc('filo', 'filo', 39, 44, { dir: 'left' });
      B.ent('critter', 40, 42, { char: 'lorota', id: 'lor', talk: 'lor', dir: 'left', speed: 0 });
      B.npc('virgula', 'vir', 29, 43, { dir: 'right' });
      B.ent('sign', 34, 51, { text: 'CIDADE DE PAPELÃO — "Aqui tudo tem dono. E o dono é o Coronel." (Alguém rabiscou embaixo: "por enquanto.")' });
      // prensas (objetivos)
      B.ent('prensaObj', 14, 18, { fid: 'oeste', area: [8, 15, 13, 10], doors: [[7, 19, 1, 3]] });
      B.ent('prensaObj', 50, 18, { fid: 'leste', area: [44, 15, 12, 10], doors: [[56, 19, 1, 3]] });
      B.ent('prensaObj', 48, 37, { fid: 'sul', area: [42, 34, 13, 10], doors: [[47, 44, 3, 1]] });
      // portão da tipografia
      B.ent('gate', 32, 9, { flag: 'tipografiaAberta', wt: 2, cw: 96, dx: -24, dy: 10 });
      // esmagadores
      B.ent('crusher', 31, 34, { dx: 24, period: 2.2, offset: 0, w: 176, h: 56 });
      B.ent('crusher', 31, 20, { dx: 24, period: 2.2, offset: 1.1, w: 176, h: 56 });
      B.ent('crusher', 16, 28, { dy: 24, period: 2.4, offset: 0.5, w: 60, h: 176 });
      B.ent('crusher', 45, 28, { dy: 24, period: 2.4, offset: 1.6, w: 60, h: 176 });
      // beco das caixas
      B.ent('breakable', 20, 40, { fid: 'cx1', by: 'any', style: 'caixa', hp: 2 });
      B.ent('breakable', 20, 41, { fid: 'cx2', by: 'any', style: 'caixa', hp: 2 });
      B.ent('chest', 13, 39, { fid: 'cidade1', content: { verse: 6 } });
      B.enemy('carimbo', 15, 41);
      // arquivo
      B.ent('breakable', 60, 34, { fid: 'cx3', by: 'any', style: 'caixa', hp: 2 });
      B.ent('chest', 61, 33, { fid: 'cidade2', content: { verse: 7 } });
      // contrato do Biu
      B.ent('item', 55, 16, { item: 'contrato' });
      // patrulhas
      B.enemy('carimbo', 5, 30);
      B.enemy('carimbo', 58, 40);
      B.enemy('jagunco', 15, 47);
      B.enemy('jagunco', 48, 47);
      B.enemy('jagunco', 40, 28);
      B.enemy('carimbo', 22, 11);
      B.enemy('jagunco', 44, 11);
      B.enemy('carimbo', 5, 20);
      // decoração
      for (const [x, y] of [[8, 45], [20, 45], [44, 45], [56, 45], [8, 26], [24, 26], [38, 26], [54, 26], [14, 9], [26, 9], [38, 9], [50, 9], [29, 35], [34, 22]]) {
        B.prop('poste', x, y);
      }
      for (const [x, y, v] of [[12, 45, 0], [26, 45, 1], [50, 45, 2], [18, 26, 0], [46, 26, 1], [20, 9, 2], [44, 9, 0]]) B.prop('cartaz', x, y, { v });
      for (const [x, y] of [[23, 38], [40, 37], [9, 16], [55, 24], [43, 43], [26, 7], [37, 3]]) B.prop('barril', x, y);
      B.prop('engrenagem', 28, 3, { v: 0 });
      B.prop('engrenagem', 36, 6, { v: 1 });
      B.pt('start', 31.5, 54);
      B.pt('beco', 32, 42);
      B.pt('tipografia', 32, 6);
      B.exit(29, 3, 6, 4, 'tipografia', 14.5, 19, { need: 'tipografiaAberta' });
      B.zone('Beco do Jornal', 23, 37, 18, 9);
      B.zone('Pátio da Prensa Oeste', 8, 15, 13, 10);
      B.zone('Pátio da Prensa Leste', 44, 15, 13, 10);
      B.zone('Pátio da Prensa Sul', 42, 34, 13, 10);
      B.zone('Avenida do Coronel', 2, 27, 60, 4);
    },
  });

  def('tipografia', {
    name: 'A Tipografia', theme: 'cidade', chapter: 'cap3', w: 30, h: 22,
    build(B) {
      B.rect(2, 2, 26, 18, 'x');
      B.rect(14, 20, 2, 2, 'x');
      for (const [x, y, v] of [[4, 3, 0], [25, 3, 1], [4, 17, 1], [25, 17, 0]]) B.prop('engrenagem', x, y, { v });
      for (const [x, y] of [[3, 8], [26, 8], [3, 13], [26, 13]]) B.prop('barril', x, y);
      B.ent('prensa', 14, 7, { id: 'cor', dx: 24 });
      B.pt('start', 14.5, 18);
      B.pt('boss', 14.5, 7);
      B.pt('centro', 14.5, 11);
      B.pt('mesa', 14.5, 3);
      B.arena = { x: 15 * T, y: 11 * T, r: 11.5 * T };
    },
  });

  // ==================================================================
  // CAPÍTULO FINAL — A MARGEM
  // ==================================================================
  def('margem', {
    name: 'A Margem', theme: 'margem', chapter: 'final', w: 50, h: 64, fill: '%',
    build(B) {
      B.rect(20, 56, 10, 6, 'p');
      B.rect(23, 48, 4, 9, 'p');
      B.rect(14, 40, 17, 8, 'p');
      B.rect(27, 32, 3, 9, 'p');
      B.rect(26, 24, 17, 8, 'p');
      B.rect(43, 27, 2, 2, 'p');
      B.rect(44, 26, 5, 4, 'p');
      B.rect(30, 16, 3, 9, 'p');
      B.rect(16, 8, 19, 8, 'p');
      B.rect(12, 11, 4, 2, 'p');
      B.rect(6, 10, 6, 4, 'p');
      B.rect(24, 1, 3, 8, 'p');
      B.sprinkle(',', 0.12, 'p', 41);
      B.ent('eco', 18, 43, { fid: 1 });
      B.ent('eco', 39, 27, { fid: 2 });
      B.ent('eco', 20, 11, { fid: 3 });
      B.ent('eco', 25, 4, { fid: 4 });
      B.ent('chest', 47, 27, { fid: 'margem1', content: { verse: 8 } });
      B.ent('chest', 7, 11, { fid: 'margem2', content: { verse: 9 } });
      B.prop('penaG', 28, 45);
      B.prop('tinteiroG', 31, 28);
      B.prop('letraG', 16, 46, { ch: 'L' });
      B.prop('letraG', 41, 25, { ch: 'U' });
      B.prop('letraG', 33, 13, { ch: 'Z' });
      B.prop('letraG', 17, 14, { ch: 'A' });
      B.enemy('rascunho', 24, 44);
      B.enemy('rascunho', 28, 42);
      B.enemy('letra', 20, 41);
      B.enemy('rascunho', 33, 28);
      B.enemy('rascunho', 36, 26);
      B.enemy('letra', 46, 28);
      B.enemy('letra', 45, 27);
      B.enemy('rascunho', 22, 10);
      B.enemy('rascunho', 28, 12);
      B.enemy('rascunho', 9, 12);
      B.enemy('letra', 8, 11);
      B.ent('candeeiro', 22, 58, { fid: 'margemIni', alwaysLit: true, checkpoint: true });
      B.ent('candeeiro', 29, 10, { fid: 'margemFim', checkpoint: true });
      B.pt('start', 25, 60);
      B.pt('topo', 25, 3);
      B.exit(23, 1, 5, 2, 'ultima', 13.5, 20);
      B.zone('A Margem', 18, 54, 14, 9);
      B.zone('Página da Janela', 14, 40, 17, 8);
      B.zone('Página da Varanda', 26, 24, 17, 8);
      B.zone('Página do Último São João', 16, 8, 19, 8);
    },
  });

  def('ultima', {
    name: 'A Última Página', theme: 'margem', chapter: 'final', w: 28, h: 24, fill: '%',
    build(B) {
      B.rect(3, 3, 22, 18, 'p');
      B.rect(13, 21, 2, 3, 'p');
      B.sprinkle(',', 0.18, 'p', 43);
      B.ent('traca', 14, 7, { id: 'tra' });
      B.pt('start', 13.5, 20);
      B.pt('boss', 14, 7);
      B.pt('centro', 14, 12);
      B.arena = { x: 14 * T, y: 12 * T, r: 10 * T };
    },
  });
})();
