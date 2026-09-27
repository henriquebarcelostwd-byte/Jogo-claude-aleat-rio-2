/* PELEJA — a cena de jogo: mapa, câmera, colisão, combate, luz, HUD e ganchos da história */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Art = G.Art;
  const SP = G.Sprites;
  const Inp = G.Input;
  const Au = G.Audio;
  const C = G.C;
  const T = G.TILE;
  const E = G.Ent;

  let darkCv = null;
  let hatchPat = null;
  function hatchTile() {
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const x = c.getContext('2d');
    x.strokeStyle = 'rgba(0,0,0,1)';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(-4, 20);
    x.lineTo(20, -4);
    x.moveTo(-4, 4);
    x.lineTo(4, -4);
    x.moveTo(12, 20);
    x.lineTo(20, 12);
    x.stroke();
    return c;
  }

  class World {
    constructor(o = {}) {
      this.opts = o;
      this.mapId = o.map;
      this.ents = [];
      this.fx = new G.FX();
      this.dlg = new G.DialogueBox();
      this.cam = { x: 0, y: 0, zoom: 1, mode: 'follow', tw: null, sx: 0, sy: 0 };
      this.shakeA = 0;
      this.shakeT = 0;
      this.hitstopT = 0;
      this.time = 0;
      this.scripts = [];
      this.bars = false;
      this.barK = 0;
      this.fadeK = o.fadeIn ? 1 : 0;
      this.fadeTarget = 0;
      this.fadeSpeed = 1.5;
      this.fadeColor = C.night;
      this.flashT = 0;
      this.lightsFrame = [];
      this.toasts = [];
      this.hint = null;
      this.titleCard = null;
      this.popup = null;
      this.panel = null;
      this.objFlash = 0;
      this.zoneName = null;
      this.zoneT = 0;
      this.curZone = null;
      this.speedMul = 1;
      this.voidY = null;
      this.boss = null;
      this.puddles = [];
      this.eaten = [];
      this.inTriggers = new Set();
      this.exitWarn = 0;
      this.opaque = true;
      this.darkness = 0;
    }

    // ------------------------------------------------------------------
    // Ciclo de vida
    // ------------------------------------------------------------------
    enter() {
      const S = G.state;
      this.map = G.Maps.build(this.mapId, S);
      this.chapter = G.Story.chapters[this.map.chapter] || {};
      S.map = this.mapId;
      S.chapter = this.map.chapter;
      G.setTheme(this.map.theme);
      this.arena = this.map.arena;
      // sólidos estáticos (props)
      this.solids = [];
      this.buckets = new Map();
      for (const p of this.map.props) {
        const d = G.Props[p.kind];
        if (!d) continue;
        const feet = d.feet || (d.foot ? [d.foot] : []);
        for (const f of feet) {
          const r = { x: p.x + f[0], y: p.y + f[1], w: f[2] - f[0], h: f[3] - f[1], shot: d.shot };
          this.solids.push(r);
          const bx0 = Math.floor(r.x / (T * 4)), bx1 = Math.floor((r.x + r.w) / (T * 4));
          const by0 = Math.floor(r.y / (T * 4)), by1 = Math.floor((r.y + r.h) / (T * 4));
          for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) {
            const k = bx + ',' + by;
            if (!this.buckets.has(k)) this.buckets.set(k, []);
            this.buckets.get(k).push(r);
          }
        }
      }
      // entidades do mapa (respeitando o que já aconteceu)
      for (const sp of this.map.spawns) {
        if (sp.if && !sp.if(S)) continue;
        if (E.Enemy && G.Enemies.classes[sp.kind] && S.flags['limpo_' + this.mapId]) continue;
        const e = E.create(sp);
        if (!e) continue;
        if (e.kind === 'breakable' && e.broken) continue;
        this.ents.push(e);
        if (e.boss) this.boss = e;
      }
      // pontes já erguidas
      for (const e of this.ents) if (e.kind === 'bell' && e.rung) this.raiseBridge(e, true);
      // jogadora
      const px = this.opts.x != null ? this.opts.x : (this.map.pts.start || { x: T * 5 }).x;
      const py = this.opts.y != null ? this.opts.y : (this.map.pts.start || { y: T * 5 }).y;
      this.player = new E.Player({ x: px, y: py, dir: this.opts.dir || 'up' });
      this.ents.push(this.player);
      if (S.flags.nanquim) {
        this.nan = new E.Nanquim({ x: px - 26, y: py + 6 });
        this.ents.push(this.nan);
      }
      this.cam.x = px;
      this.cam.y = py - 30;
      this.clampCam(true);
      // música e ambiente
      const mus = typeof this.map.music === 'function' ? this.map.music(S) : this.chapter.music ? this.chapter.music(S, this.mapId) : null;
      if (mus) Au.play(mus);
      const amb = this.chapter.amb ? this.chapter.amb(S, this.mapId) : null;
      Au.ambient(amb || null);
      this.darkness = this.targetDark();
      G.Input.touch.layout = 'game';
      if (this.chapter.onMapEnter) this.chapter.onMapEnter(this, this.mapId, !!this.opts.fresh);
      this.refreshObjective(false);
    }
    exit() {}

    // ------------------------------------------------------------------
    // Utilidades de mapa e colisão
    // ------------------------------------------------------------------
    tileAt(tx, ty) {
      return this.map.get(tx, ty);
    }
    tileAtPx(x, y) {
      return this.map.get(Math.floor(x / T), Math.floor(y / T));
    }
    walkTile(tx, ty) {
      return G.tileWalk(this.map.get(tx, ty));
    }
    solidAt(x, y) {
      if (!this.walkTile(Math.floor(x / T), Math.floor(y / T))) return true;
      for (const r of this.solidsNear({ x, y, w: 1, h: 1 })) if (U.inRect(x, y, r)) return true;
      return false;
    }
    shotBlocked(x, y) {
      if (x < 0 || y < 0 || x >= this.map.w * T || y >= this.map.h * T) return true;
      if (!G.tileShot(this.tileAtPx(x, y))) return true;
      for (const r of this.solidsNear({ x, y, w: 1, h: 1 })) if (r.shot && U.inRect(x, y, r)) return true;
      return false;
    }
    solidsNear(b) {
      const out = [];
      const bx0 = Math.floor(b.x / (T * 4)), bx1 = Math.floor((b.x + b.w) / (T * 4));
      const by0 = Math.floor(b.y / (T * 4)), by1 = Math.floor((b.y + b.h) / (T * 4));
      for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) {
        const l = this.buckets.get(bx + ',' + by);
        if (l) for (const r of l) out.push(r);
      }
      return out;
    }
    boxFree(e, x, y) {
      const b = e.box(x, y);
      if (b.x < 0 || b.y < 0 || b.x + b.w > this.map.w * T || b.y + b.h > this.map.h * T) return false;
      if (e.flying) return true;
      const tx0 = Math.floor(b.x / T), tx1 = Math.floor((b.x + b.w - 0.01) / T);
      const ty0 = Math.floor(b.y / T), ty1 = Math.floor((b.y + b.h - 0.01) / T);
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
        const ch = this.map.get(tx, ty);
        if (!G.tileWalk(ch)) {
          if (ch === 'h' || (e === this.player && this.player.state === 'dodge' && (ch === 'h'))) continue;
          return false;
        }
      }
      for (const r of this.solidsNear(b)) if (U.rectsOverlap(b, r)) return false;
      for (const o of this.ents) {
        if (o === e || !o.solid || o.dead) continue;
        if (e.kind === 'enemy' && o.kind === 'npc') continue;
        if (U.rectsOverlap(b, o.box())) return false;
      }
      return true;
    }
    moveEnt(e, dx, dy) {
      let ok = true;
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 6));
      const sx = dx / steps, sy = dy / steps;
      let bx = false, by = false;
      for (let i = 0; i < steps; i++) {
        if (sx && !bx) {
          if (this.boxFree(e, e.x + sx, e.y)) e.x += sx;
          else {
            bx = true;
            ok = false;
            // deslize para contornar quinas (só a jogadora)
            if (e === this.player && !sy) {
              for (const n of [4, -4, 8, -8, 12, -12]) {
                if (this.boxFree(e, e.x, e.y + n) && this.boxFree(e, e.x + sx, e.y + n)) {
                  e.y += Math.sign(n) * Math.min(Math.abs(n), 2.5);
                  break;
                }
              }
            }
          }
        }
        if (sy && !by) {
          if (this.boxFree(e, e.x, e.y + sy)) e.y += sy;
          else {
            by = true;
            ok = false;
            if (e === this.player && !sx) {
              for (const n of [4, -4, 8, -8, 12, -12]) {
                if (this.boxFree(e, e.x + n, e.y) && this.boxFree(e, e.x + n, e.y + sy)) {
                  e.x += Math.sign(n) * Math.min(Math.abs(n), 2.5);
                  break;
                }
              }
            }
          }
        }
      }
      return ok;
    }

    // ------------------------------------------------------------------
    // Entidades
    // ------------------------------------------------------------------
    add(e) {
      if (e) this.ents.push(e);
      return e;
    }
    find(id) {
      if (id === 'zab' || id === 'player') return this.player;
      if (id === 'nan') return this.nan;
      if (id === 'boss') return this.boss;
      for (const e of this.ents) if (e.id === id && !e.dead) return e;
      return null;
    }
    spawn(spec) {
      const s = Object.assign({}, spec);
      if (s.tile) {
        s.x = s.tile[0] * T + T / 2;
        s.y = s.tile[1] * T + T * 0.75;
      }
      if (s.pt) {
        const p = this.map.pts[s.pt];
        s.x = p.x + (s.dx || 0);
        s.y = p.y + (s.dy || 0);
      }
      if (s.kind === 'nanquim') {
        if (this.nan) {
          this.nan.x = s.x;
          this.nan.y = s.y;
          return this.nan;
        }
        this.nan = new E.Nanquim(s);
        this.nan.follow = s.follow !== false;
        return this.add(this.nan);
      }
      const e = E.create(s);
      if (e && e.boss) this.boss = e;
      return this.add(e);
    }
    locked() {
      return this.scripts.length > 0 || !!this.titleCard || !!this.popup || !!this.panel || this.dlg.active;
    }

    // ------------------------------------------------------------------
    // Roteiro
    // ------------------------------------------------------------------
    runScript(steps, onDone) {
      const cs = new G.Cutscene(this, steps, () => {
        const i = this.scripts.indexOf(cs);
        if (i >= 0) this.scripts.splice(i, 1);
        if (!this.scripts.length) {
          this.dlg.close();
          if (this.player) this.player.talking = false;
        }
        if (onDone) onDone();
        this.refreshObjective(false);
      });
      this.scripts.push(cs);
      return cs;
    }
    talkTo(npc) {
      const steps = G.Story.talk(npc.talk, this, npc);
      if (steps && steps.length) {
        const pdir = this.player.dir;
        this.runScript(steps, () => {
          if (npc.baseDir) npc.dir = npc.baseDir;
          void pdir;
        });
      }
    }

    // ------------------------------------------------------------------
    // Câmera e efeitos de tela
    // ------------------------------------------------------------------
    camTo(x, y, dur = 1, zoom, ease = 'inOut') {
      this.cam.mode = 'script';
      this.cam.tw = { x0: this.cam.x, y0: this.cam.y, x1: x, y1: y, z0: this.cam.zoom, z1: zoom != null ? zoom : this.cam.zoom, t: 0, dur: Math.max(0.001, dur), ease };
      if (dur <= 0) {
        this.cam.x = x;
        this.cam.y = y;
        if (zoom != null) this.cam.zoom = zoom;
        this.cam.tw = null;
      }
    }
    camFollow(dur = 0.8) {
      const p = this.player;
      this.camTo(p.x, p.y - 30, dur, 1);
      this.cam.returning = true;
    }
    clampCam(force) {
      const vw = G.W / this.cam.zoom, vh = G.H / this.cam.zoom;
      const mw = this.map.w * T, mh = this.map.h * T;
      if (mw <= vw) this.cam.x = mw / 2;
      else this.cam.x = U.clamp(this.cam.x, vw / 2, mw - vw / 2);
      if (mh <= vh) this.cam.y = mh / 2;
      else this.cam.y = U.clamp(this.cam.y, vh / 2, mh - vh / 2);
      void force;
    }
    updateCam(dt) {
      const c = this.cam;
      if (c.mode === 'script' && c.tw) {
        const tw = c.tw;
        tw.t += dt;
        const k = U.ease[tw.ease || 'inOut'](Math.min(1, tw.t / tw.dur));
        c.x = U.lerp(tw.x0, tw.x1, k);
        c.y = U.lerp(tw.y0, tw.y1, k);
        c.zoom = U.lerp(tw.z0, tw.z1, k);
        if (tw.t >= tw.dur) {
          c.tw = null;
          if (c.returning) {
            c.returning = false;
            c.mode = 'follow';
          }
        }
      } else if (c.mode === 'follow' && this.player) {
        const p = this.player;
        const ax = Inp.axis();
        const lead = this.locked() ? 0 : 40;
        let tx = p.x + ax.x * lead, ty = p.y - 30 + ax.y * lead * 0.7;
        const b = this.boss;
        if (b && b.active && !b.defeated) {
          // enquadra a jogadora e o chefe
          const bx = b.cx != null && b.stage === 'coronel' ? b.cx : b.x, by = (b.stage === 'coronel' ? b.cy : b.y) - (b.hy || 40) * 0.5;
          const d = U.dist(p.x, p.y, bx, by);
          const k = d < 800 ? 0.45 : 0.15;
          tx = U.lerp(tx, bx, k);
          ty = U.lerp(ty, by, k);
          c.zoom = U.approach(c.zoom, 0.86, dt * 0.3);
        } else if (c.zoom !== 1 && !c.tw) {
          c.zoom = U.approach(c.zoom, 1, dt * 0.5);
        }
        const k = 1 - Math.pow(0.004, dt);
        c.x += (tx - c.x) * k;
        c.y += (ty - c.y) * k;
      } else if (c.mode === 'chase') {
        // controlado pelo modo de fuga
      }
      if (c.mode !== 'script') this.clampCam();
      else if (!this.freeCam) this.clampCam();
      // tremor
      if (this.shakeT > 0) {
        this.shakeT -= dt;
        const a = G.Save.settings.shake ? this.shakeA * Math.min(1, this.shakeT * 4) : 0;
        c.sx = (Math.random() - 0.5) * a * 2;
        c.sy = (Math.random() - 0.5) * a * 2;
      } else {
        c.sx = c.sy = 0;
      }
    }
    shake(a, t) {
      if (a >= this.shakeA || this.shakeT <= 0) {
        this.shakeA = a;
        this.shakeT = t;
      }
    }
    hitstop(t) {
      this.hitstopT = Math.max(this.hitstopT, t);
    }
    flash(color, t) {
      this.flashC = color;
      this.flashT = t;
      this.flashMax = t;
    }
    fadeTo(k, t = 0.6, color) {
      this.fadeTarget = k;
      this.fadeSpeed = 1 / Math.max(0.01, t);
      if (color) this.fadeColor = color;
    }
    light(x, y, r, a = 1) {
      this.lightsFrame.push({ x, y, r, a });
    }
    toast(text, t = 2.2) {
      if (this.toasts.some((o) => o.text === text)) return;
      this.toasts.push({ text, t, max: t });
      if (this.toasts.length > 3) this.toasts.shift();
    }
    showHint(text, keys, t = 5) {
      if (!G.Save.settings.hints) return;
      this.hint = { text, keys: keys || [], t, max: t };
    }
    showTitle(title, sub, dur = 3.6) {
      this.titleCard = { title, sub, t: 0, dur };
      Au.sfx('page');
    }
    showPanel(name, dur, o = {}) {
      this.panel = { name, t: 0, dur, o, fn: G.Panels[name] };
      if (o.music) Au.play(o.music);
    }
    giveAbility(a) {
      const info = G.Story.abilities[a];
      G.state.abil[a] = true;
      this.popup = { type: 'ability', a, info, t: 0 };
      Au.jingle('verse');
    }

    // ------------------------------------------------------------------
    // Objetivos
    // ------------------------------------------------------------------
    refreshObjective(flash = true) {
      const txt = this.chapter.objective ? this.chapter.objective(G.state, this) : '';
      if (txt !== this.objective) {
        const had = this.objective;
        this.objective = txt;
        if (had != null && flash !== false && txt) {
          this.objFlash = 3.2;
          Au.sfx('fanfare', { vol: 0.5 });
        }
      } else if (flash === true && txt) this.objFlash = 3.2;
    }

    // ------------------------------------------------------------------
    // Interação
    // ------------------------------------------------------------------
    nearestInteractive() {
      const p = this.player;
      if (!p) return null;
      const v = U.dirVec(p.dir);
      const fx = p.x + v.x * 18, fy = p.y - 8 + v.y * 18;
      let best = null, bd = 1e9;
      for (const e of this.ents) {
        if (e === p || e.dead || !e.interactive) continue;
        const range = e.kind === 'cordao' ? 70 : e.kind === 'npc' ? 60 : 56;
        const d = Math.min(U.dist(fx, fy, e.x, e.y - 8), U.dist(p.x, p.y, e.x, e.y) + 10);
        if (d < range && d < bd) {
          bd = d;
          best = e;
        }
      }
      return best;
    }
    tryInteract() {
      const e = this.nearestInteractive();
      if (e) {
        if (e.kind === 'npc' || e.kind === 'critter') this.player.dir = U.dirName(e.x - this.player.x, e.y - this.player.y);
        e.interact(this);
        Inp.consume('interact');
      }
    }
    openChest(ch) {
      const c = ch.content || {};
      const S = G.state;
      const steps = [];
      if (c.verse) {
        const isNew = G.Save.addVerse(c.verse);
        S.flags['verso_' + c.verse] = true;
        steps.push({ do: () => Au.jingle('verse') });
        steps.push({ run: (W, done) => G.Game.showVerse(c.verse, isNew, done) });
        if (this.chapter.onVerse) steps.push({ do: (W) => this.chapter.onVerse(W, c.verse) });
      }
      if (c.rimas) {
        this.dropLoot(ch.x, ch.y + 10, { rimas: c.rimas });
        steps.push({ toast: 'Você achou ' + c.rimas + ' rimas!' });
      }
      if (c.heart) {
        S.maxHp += 2;
        S.hp = S.maxHp;
        steps.push({ do: () => Au.jingle('verse') });
        steps.push('narr|Você encontrou um *Remendo de Coração*! Seu fôlego aumentou.');
      }
      if (steps.length) this.runScript(steps);
    }
    dropLoot(x, y, spec) {
      const n = spec.rimas || 0;
      let big = Math.floor(n / 5);
      let small = n - big * 5;
      const mk = (v) => {
        const a = Math.random() * U.TAU;
        this.add(new E.Pickup({ x, y, type: 'rima', value: v, vx: Math.cos(a) * 90, vy: Math.sin(a) * 60, vz: 180 + Math.random() * 80 }));
      };
      while (big-- > 0) mk(5);
      while (small-- > 0) mk(1);
      if (spec.heart) this.add(new E.Pickup({ x, y, type: 'heart', vz: 200 }));
      if (spec.ink) this.add(new E.Pickup({ x, y, type: 'ink', vz: 200 }));
    }
    onLampLit(lamp) {
      this.checkpoint({ x: lamp.x, y: lamp.y + 40 });
      if (this.chapter.onLampLit) this.chapter.onLampLit(this, lamp);
      this.refreshObjective();
    }
    restAt(lamp) {
      const S = G.state;
      S.hp = S.maxHp;
      S.ink = S.maxInk;
      Au.sfx('heal');
      this.checkpoint({ x: lamp.x, y: lamp.y + 40 });
      this.fx.burst(this.player.x, this.player.y - 30, 10, { type: 'glow', color: '#ffcf6a', size: 6, speed: 60, grav: 0, life: 0.8 });
      this.toast('Fôlego recuperado. Progresso salvo.', 2.2);
    }
    onCordao(c) {
      if (this.chapter.onCordao) this.chapter.onCordao(this, c);
      this.refreshObjective();
    }
    onBellRung(bell) {
      this.raiseBridge(bell);
      if (this.chapter.onBellRung) this.chapter.onBellRung(this, bell);
      this.refreshObjective();
    }
    raiseBridge(bell, instant) {
      if (!bell.bridge) return;
      const [x, y, w, h] = bell.bridge;
      const cells = [];
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.map.get(i, j) === 'l') cells.push([i, j]);
      if (instant) {
        for (const [i, j] of cells) this.map.set(i, j, 'L');
        return;
      }
      // tece a ponte aos poucos
      cells.sort((a, b) => U.dist(a[0], a[1], bell.x / T, bell.y / T) - U.dist(b[0], b[1], bell.x / T, bell.y / T));
      let k = 0;
      this.weave = { cells, k, t: 0 };
    }
    gotItem(item) {
      if (this.chapter.onItem) this.chapter.onItem(this, item);
      this.refreshObjective();
    }
    playMemory(eco) {
      if (this.chapter.onEco) this.chapter.onEco(this, eco);
    }
    blockCanMove(b, tx, ty) {
      if (!this.walkTile(tx, ty)) return false;
      const px = tx * T + T / 2, py = ty * T + T - 8;
      const test = { x: px - 20, y: py - 26, w: 40, h: 24 };
      for (const r of this.solidsNear(test)) if (U.rectsOverlap(test, r)) return false;
      for (const o of this.ents) {
        if (o === b || o.dead || o === this.player) continue;
        if ((o.solid || o.kind === 'block') && U.rectsOverlap(test, o.box())) return false;
      }
      return true;
    }
    onBlockMoved() {
      if (this.chapter.onBlockMoved) this.chapter.onBlockMoved(this);
    }
    resetPuzzle() {
      for (const b of this.ents) {
        if (b.kind === 'block' && b.home && !G.state.flags.portaoSol) {
          b.x = b.home[0] * T + T / 2;
          b.y = b.home[1] * T + T - 8;
          b.onSlot = false;
          this.fx.dust(b.x, b.y, 4);
        }
      }
      for (const s of this.ents) if (s.kind === 'slot') s.filled = false;
      this.toast('As pedras voltaram para o lugar.', 1.8);
    }
    addPuddle(x, y) {
      const tx = Math.floor(x / T), ty = Math.floor(y / T);
      const ch = this.map.get(tx, ty);
      if (ch === '.' || ch === ',' || ch === ':' || ch === 'L' || ch === 'p') {
        this.map.set(tx, ty, 'o');
        this.puddles.push({ tx, ty, ch, t: 7 });
      }
    }
    // a Traça come o chão
    eatFloor(x, y, r) {
      const cx = Math.floor(x / T), cy = Math.floor(y / T);
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
        if (Math.hypot(i, j * 1.2) > r + 0.3) continue;
        const tx = cx + i, ty = cy + j;
        const ch = this.map.get(tx, ty);
        if (ch === 'p' || ch === ',' || ch === 'o') {
          this.map.set(tx, ty, '%');
          this.eaten.push({ tx, ty, ch: 'p', t: 9 + Math.random() * 3 });
          this.fx.burst(tx * T + T / 2, ty * T + T / 2, 3, { type: 'paper', size: 4, speed: 80, grav: 200, life: 0.7 });
        }
      }
      this.shake(3, 0.2);
    }

    // ------------------------------------------------------------------
    // Combate
    // ------------------------------------------------------------------
    inArc(p, atk, x, y, r) {
      const ox = p.x, oy = p.y - 22;
      const d = U.dist(ox, oy, x, y);
      if (d > atk.reach + r) return false;
      if (d < r + 8) return true;
      const a = Math.atan2(y - oy, x - ox);
      return Math.abs(U.angDiff(p.fa, a)) <= atk.arc + Math.atan2(r, d);
    }
    playerAttackHits(p, atk) {
      for (const e of this.ents) {
        if (e.dead || atk.hits.has(e) || e === p) continue;
        if (e.kind === 'enemy') {
          if (e.boss) {
            if (e.hitShield && !atk.hits.has('shield')) {
              let hitAny = false;
              for (const b of e.shield) {
                if (b.hp <= 0) continue;
                const bx = e.x + Math.cos(b.a) * 78, by = e.y - 40 + Math.sin(b.a) * 44;
                if (this.inArc(p, atk, bx, by, 14)) {
                  e.hitShield(this, bx, by, 1);
                  hitAny = true;
                  break;
                }
              }
              if (hitAny) {
                atk.hits.add('shield');
                continue;
              }
            }
            if (e.hitValves) {
              for (let i = 0; i < 3; i++) {
                const v = e.valvePos(i);
                if (e.valves[i] > 0 && this.inArc(p, atk, v.x, v.y, 18)) {
                  e.hitValves(this, v.x, v.y, atk.dmg, 'whip');
                  atk.hits.add(e);
                  this.hitstop(0.05);
                  break;
                }
              }
              if (e.stage === 'coronel' && this.inArc(p, atk, e.cx, e.cy - 30, 18)) {
                e.hitCoronel(this, e.cx, e.cy - 30, atk.dmg);
                atk.hits.add(e);
              }
              continue;
            }
          }
          if (!e.canBeHit()) {
            if (this.inArc(p, atk, e.x, e.y - e.hy, e.hr) && e.boss && e.state !== 'defeated') {
              atk.hits.add(e);
              Au.sfx('shield', { vol: 0.4 });
            }
            continue;
          }
          if (this.inArc(p, atk, e.x, e.y - e.hy, e.hr)) {
            atk.hits.add(e);
            if (e.hurt(this, atk.dmg, p.x, p.y, atk.kb)) {
              this.hitstop(atk.combo === 3 ? 0.09 : 0.045);
              this.shake(atk.combo === 3 ? 5 : 2.5, 0.15);
              G.state.ink = Math.min(G.state.maxInk, G.state.ink + 4);
              if (atk.combo === 3) this.fx.text(e.x, e.y - e.hy - 30, U.pick(G.ONO.big), { size: 24 });
              else if (Math.random() < 0.25) this.fx.text(e.x, e.y - e.hy - 26, U.pick(G.ONO.hit), { size: 18 });
            }
          }
        } else if (e.kind === 'breakable') {
          if (this.inArc(p, atk, e.x, e.y - e.hy, e.hr)) {
            atk.hits.add(e);
            e.hit(this, 'whip');
          }
        } else if (e.kind === 'bell') {
          if (this.inArc(p, atk, e.x, e.y - e.hy, e.hr)) {
            atk.hits.add(e);
            e.ring(this);
          }
        } else if (e.kind === 'prensaObj') {
          if (e.canHit && e.canHit() && this.inArc(p, atk, e.x, e.y - 50, 26)) {
            atk.hits.add(e);
            e.hitValve(this, atk.dmg, 'whip');
          }
        }
      }
    }
    playerStamp(p) {
      const R = 112;
      const x = p.x + Math.cos(p.fa) * 10, y = p.y + Math.sin(p.fa) * 6;
      Au.sfx('stamp');
      this.shake(7, 0.3);
      this.hitstop(0.05);
      this.fx.ring(x, y, R, { lw: 8, life: 0.4 });
      this.fx.ring(x, y, R * 0.6, { lw: 4, life: 0.3, color: C.red });
      this.fx.stampMark(x, y, U.pick(G.ONO.stamp), { size: 24, life: 2.2 });
      this.fx.dust(x, y, 10, { size: 7 });
      for (const e of this.ents) {
        if (e.dead) continue;
        const d = U.dist(x, y, e.x, e.y);
        if (e.kind === 'enemy') {
          if (e.hitShield) {
            for (const b of e.shield) {
              if (b.hp <= 0) continue;
              const bx = e.x + Math.cos(b.a) * 78, by = e.y - 40 + Math.sin(b.a) * 44;
              if (U.dist(x, y, bx, by) < R) e.hitShield(this, bx, by, 1);
            }
          }
          if (e.hitValves) {
            for (let i = 0; i < 3; i++) {
              const v = e.valvePos(i);
              if (e.valves[i] > 0 && U.dist(x, y, v.x, v.y + 40) < R + 20) {
                e.hitValves(this, v.x, v.y, 3, 'stamp');
                break;
              }
            }
            if (e.stage === 'coronel' && U.dist(x, y, e.cx, e.cy) < R) e.hitCoronel(this, e.cx, e.cy - 30, 3);
            continue;
          }
          if (d < R + e.hr && e.canBeHit()) {
            e.hurt(this, 3, x, y, 340);
            if (!e.boss) e.stun = Math.max(e.stun, 1.2);
          }
        } else if (e.kind === 'breakable' && d < R + 20) e.hit(this, 'stamp');
        else if (e.kind === 'prensaObj' && e.canHit && e.canHit() && U.dist(x, y, e.x, e.y) < R + 50) e.hitValve(this, 3, 'stamp');
        else if (e.kind === 'proj' && !e.friendly && d < R) {
          e.dead = true;
          this.fx.burst(e.x, e.y - e.z, 3, { type: 'spark', size: 4, speed: 60, grav: 0 });
        }
      }
      if (this.chapter.onStamp) this.chapter.onStamp(this, x, y);
    }
    projHitsEnemies(pr) {
      for (const e of this.ents) {
        if (e.dead || pr.dead || pr.hitSet.has(e)) continue;
        if (e.kind === 'enemy') {
          if (e.hitShield) {
            for (const b of e.shield) {
              if (b.hp <= 0) continue;
              const bx = e.x + Math.cos(b.a) * 78, by = e.y - 40 + Math.sin(b.a) * 44;
              if (U.dist(pr.x, pr.y - pr.z * 0.5, bx, by) < 22) {
                e.hitShield(this, bx, by, 1);
                pr.dead = true;
                return;
              }
            }
          }
          if (e.hitValves) {
            for (let i = 0; i < 3; i++) {
              const v = e.valvePos(i);
              if (e.valves[i] > 0 && U.dist(pr.x, pr.y - pr.z * 0.5, v.x, v.y) < 26) {
                e.hitValves(this, v.x, v.y, 1, 'throw');
                pr.dead = true;
                return;
              }
            }
            if (e.stage === 'coronel' && U.dist(pr.x, pr.y, e.cx, e.cy) < 30) {
              e.hitCoronel(this, pr.x, pr.y, 1);
              pr.dead = true;
            }
            continue;
          }
          const hit = U.dist(pr.x, pr.y - pr.z, e.x, e.y - e.hy) < e.hr + 10 || U.dist(pr.x, pr.y, e.x, e.y) < e.hr + 4;
          if (hit && e.canBeHit()) {
            pr.hitSet.add(e);
            e.hurt(this, pr.dmg, pr.x - pr.vx * 0.05, pr.y - pr.vy * 0.05, 110);
            pr.dead = true;
            return;
          }
        } else if (e.kind === 'bell') {
          if (U.dist(pr.x, pr.y - pr.z, e.x, e.y - e.hy) < 30 || U.dist(pr.x, pr.y, e.x, e.y) < 24) {
            e.ring(this);
            pr.dead = true;
            this.fx.burst(pr.x, pr.y - pr.z, 5, { type: 'spark', size: 5, speed: 90, grav: 0 });
            return;
          }
        } else if (e.kind === 'breakable' && e.by === 'any') {
          if (U.dist(pr.x, pr.y, e.x, e.y - 10) < 30) {
            e.hit(this, 'any');
            pr.dead = true;
            return;
          }
        } else if (e.kind === 'prensaObj' && e.canHit && e.canHit()) {
          if (U.dist(pr.x, pr.y, e.x, e.y - 20) < 50) {
            e.hitValve(this, 1, 'throw');
            pr.dead = true;
            return;
          }
        }
      }
    }
    hurtPlayer(dmg, x, y) {
      if (this.locked() || !this.player) return false;
      const units = Math.max(1, Math.round(dmg * G.diff().dmgTaken));
      return this.player.hurtBy(this, units, x, y);
    }
    onEnemyKilled(e) {
      const S = G.state;
      S.stats.kills++;
      G.Save.seeEnemy(e.type);
      const [a, b] = e.lootR || [1, 3];
      const n = U.randi(a, b);
      this.dropLoot(e.x, e.y, {
        rimas: n,
        heart: S.hp < S.maxHp && Math.random() < 0.13,
        ink: S.abil.stamp && S.ink < S.maxInk * 0.7 && Math.random() < 0.15,
      });
      if (this.chapter.onEnemyKilled) this.chapter.onEnemyKilled(this, e);
    }
    stageBoss(dist = 130) {
      const b = this.boss;
      const p = this.player;
      if (!b || !p) return;
      const bx = b.stage === 'coronel' ? b.cx : b.x, by = b.stage === 'coronel' ? b.cy : b.y;
      const cands = [[0, dist], [-dist, dist * 0.4], [dist, dist * 0.4], [0, -dist]];
      for (const [dx, dy] of cands) {
        if (!this.solidAt(bx + dx, by + dy) && !this.solidAt(bx + dx + 30, by + dy)) {
          p.x = bx + dx;
          p.y = by + dy;
          break;
        }
      }
      p.dir = U.dirName(bx - p.x, by - p.y);
      p.state = 'normal';
      p.kx = p.ky = 0;
      if (this.nan) {
        this.nan.x = p.x - 40;
        this.nan.y = p.y + 10;
      }
    }
    onBossDefeated(b) {
      this.scripts.length = 0;
      for (const e of this.ents) if (e.kind === 'proj' || e.kind === 'hazard' || e.kind === 'pilar' || (e.kind === 'enemy' && !e.boss)) e.dead = true;
      G.state.stats.bosses = (G.state.stats.bosses || 0) + 1;
      if (this.chapter.onBossDefeated) this.chapter.onBossDefeated(this, b);
    }
    onPlayerDeath() {
      G.state.stats.deaths++;
      this.scripts.length = 0;
      this.dlg.close();
      Au.stop(0.5);
      Au.sfx('tear');
      this.deathT = 1.4;
    }
    checkpoint(pos) {
      const S = G.state;
      const p = pos || { x: this.player.x, y: this.player.y };
      S.map = this.mapId;
      S.x = p.x;
      S.y = p.y;
      G.Game.checkpoint();
    }
    startPeleja(id, cb) {
      G.Game.peleja(id, cb);
    }

    // ------------------------------------------------------------------
    // Atualização
    // ------------------------------------------------------------------
    targetDark() {
      return this.chapter.darkness ? this.chapter.darkness(G.state, this.mapId, this) : 0;
    }
    update(dt) {
      const S = G.state;
      if (this.deathT != null) {
        this.deathT -= dt;
        this.player.update(dt, this);
        this.fx.update(dt);
        if (this.deathT <= 0 && !this.deathShown) {
          this.deathShown = true;
          G.Game.gameOver();
        }
        return;
      }
      // pausa e caderno
      if (Inp.pressed('pause') && !this.titleCard) {
        Inp.consume('pause');
        G.Game.pause(this);
        return;
      }
      if (Inp.pressed('journal') && !this.locked()) {
        G.Game.journal();
        return;
      }
      S.time += dt;
      if (this.hitstopT > 0) {
        this.hitstopT -= dt;
        this.updateCam(dt);
        return;
      }
      this.time += dt;
      this.lightsFrame.length = 0;
      // cartões e popups
      if (this.titleCard) {
        this.titleCard.t += dt;
        if (this.titleCard.t > this.titleCard.dur || (this.titleCard.t > 1.2 && (Inp.pressed('confirm') || Inp.mouse.clicked))) this.titleCard = null;
      }
      if (this.popup) {
        this.popup.t += dt;
        if (this.popup.t > 0.8 && (Inp.pressed('confirm') || Inp.pressed('interact') || Inp.mouse.clicked)) {
          this.popup = null;
          Au.sfx('menuSelect');
        }
      }
      if (this.panel) {
        this.panel.t += dt;
        const skip = this.panel.o.skip !== false && this.panel.t > 1 && (Inp.pressed('confirm') || Inp.mouse.clicked);
        if (this.panel.t >= this.panel.dur || skip) this.panel = null;
      }
      // roteiros
      for (const s of this.scripts.slice()) s.update(dt);
      this.dlg.update(dt);
      // entidades
      for (const e of this.ents) if (!e.dead) e.update(dt, this);
      this.ents = this.ents.filter((e) => !e.dead);
      if (this.boss && this.boss.dead) this.boss = null;
      // ponte sendo tecida
      if (this.weave) {
        this.weave.t += dt;
        while (this.weave.k < this.weave.cells.length && this.weave.t > this.weave.k * 0.06) {
          const [i, j] = this.weave.cells[this.weave.k++];
          this.map.set(i, j, 'L');
          this.fx.burst(i * T + T / 2, j * T + T / 2, 2, { type: 'spark', size: 4, speed: 40, grav: 0, life: 0.4 });
        }
        if (this.weave.k >= this.weave.cells.length) this.weave = null;
      }
      // poças e chão comido voltando
      for (let i = this.puddles.length - 1; i >= 0; i--) {
        const pd = this.puddles[i];
        pd.t -= dt;
        if (pd.t <= 0) {
          if (this.map.get(pd.tx, pd.ty) === 'o') this.map.set(pd.tx, pd.ty, pd.ch);
          this.puddles.splice(i, 1);
        }
      }
      for (let i = this.eaten.length - 1; i >= 0; i--) {
        const ea = this.eaten[i];
        ea.t -= dt;
        if (ea.t <= 0) {
          this.map.set(ea.tx, ea.ty, ea.ch);
          this.eaten.splice(i, 1);
          this.fx.burst(ea.tx * T + T / 2, ea.ty * T + T / 2, 2, { type: 'spark', size: 5, speed: 30, grav: 0, life: 0.5 });
        }
      }
      // queda no vazio (Margem)
      const p = this.player;
      if (p && p.state !== 'dead') {
        const ch = this.tileAtPx(p.x, p.y - 4);
        if ((ch === '%' || ch === 'h') && p.state !== 'dodge') {
          if (!p.safe) p.safe = this.map.pts.start || { x: p.x, y: p.y };
          this.fx.burst(p.x, p.y - 10, 10, { type: ch === 'h' ? 'paper' : 'ink', size: 4, speed: 120 });
          Au.sfx('drip');
          p.x = p.safe.x;
          p.y = p.safe.y;
          if (!this.locked()) this.hurtPlayer(ch === 'h' ? 0.5 : 1, p.x, p.y + 1);
          this.toast(ch === 'h' ? 'Cuidado com os buracos! (Esquive para pular.)' : 'O vazio devolveu você.', 1.6);
        } else if (ch !== '%' && ch !== 'h' && p.state === 'normal') {
          if (!p.safe || U.dist(p.safe.x, p.safe.y, p.x, p.y) > 24) p.safe = { x: p.x, y: p.y };
        }
      }
      // luz da jogadora (tinteiro fosforescente)
      if (p) this.light(p.x, p.y - 26, S.flags.nanquim ? 185 : 150, 1);
      for (const l of this.map.lights) this.light(l.x, l.y, l.r, 1);
      for (const pr of this.map.props) {
        const d = G.Props[pr.kind];
        if (d && d.light) this.light(pr.x, pr.y - 60, d.light, 0.9);
      }
      // gatilhos, zonas, saídas
      if (p && !this.locked()) {
        for (const tr of this.map.triggers) {
          const inside = U.inRect(p.x, p.y, tr);
          if (inside && !this.inTriggers.has(tr.id)) {
            this.inTriggers.add(tr.id);
            if (this.chapter.onTrigger) this.chapter.onTrigger(this, tr.id);
          } else if (!inside) this.inTriggers.delete(tr.id);
        }
        for (const ex of this.map.exits) {
          if (U.inRect(p.x, p.y, ex)) {
            if (ex.need && !S.flags[ex.need]) {
              if (this.exitWarn <= 0) {
                this.toast(ex.msg || 'O caminho ainda está fechado.', 1.8);
                this.exitWarn = 2;
              }
            } else if (!this.leaving) {
              this.leaving = true;
              G.Game.goMap(ex.to, ex.sx * T + T / 2, ex.sy * T + T * 0.75, { dir: 'up' });
            }
          }
        }
        this.exitWarn -= dt;
        this.zoneCheckT = (this.zoneCheckT || 0) - dt;
        if (this.zoneCheckT <= 0) {
          this.zoneCheckT = 0.3;
          const z = this.map.zones.find((zz) => U.inRect(p.x, p.y, zz));
          const zn = z ? z.name : null;
          if (zn && zn !== this.curZone) {
            this.zoneName = zn;
            this.zoneT = 2.8;
            S.flags['zona_' + zn] = true;
          }
          this.curZone = zn;
        }
      }
      if (this.zoneT > 0) this.zoneT -= dt;
      // gancho do capítulo
      if (this.chapter.update) this.chapter.update(this, dt);
      this.fx.update(dt);
      this.updateCam(dt);
      // escuridão
      const td = this.targetDark();
      this.darkness = U.approach(this.darkness, td, dt * 0.25);
      // tela
      this.barK = U.approach(this.barK, this.bars ? 1 : 0, dt * 3);
      this.fadeK = U.approach(this.fadeK, this.fadeTarget, dt * this.fadeSpeed);
      if (this.flashT > 0) this.flashT -= dt;
      for (const t of this.toasts) t.t -= dt;
      this.toasts = this.toasts.filter((t) => t.t > 0);
      if (this.hint) {
        this.hint.t -= dt;
        if (this.hint.t <= 0) this.hint = null;
      }
      if (this.objFlash > 0) this.objFlash -= dt;
      // explorado (para o mapa do caderno)
      if (p) {
        const key = 'exp_' + this.mapId;
        const ex = (S.explored[key] = S.explored[key] || {});
        const tx = Math.floor(p.x / T / 4), ty = Math.floor(p.y / T / 4);
        for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) ex[tx + i + ',' + (ty + j)] = 1;
      }
    }

    // ------------------------------------------------------------------
    // Desenho
    // ------------------------------------------------------------------
    draw(ctx) {
      const cam = this.cam;
      const z = cam.zoom;
      const vx0 = cam.x - G.W / 2 / z, vy0 = cam.y - G.H / 2 / z;
      const vw = G.W / z, vh = G.H / z;
      // fundo
      const th = G.THEMES[this.map.theme];
      if (th.bg) {
        ctx.fillStyle = th.bg;
        ctx.fillRect(0, 0, G.W, G.H);
        this.drawVoidBG(ctx);
      } else {
        Art.fillPaper(ctx, 0, 0, G.W, G.H, th.paper, -(vx0 * z) % 512, -(vy0 * z) % 512);
      }
      ctx.save();
      ctx.translate(G.W / 2 + cam.sx, G.H / 2 + cam.sy);
      ctx.scale(z, z);
      ctx.translate(-cam.x, -cam.y);
      const tx0 = Math.floor(vx0 / T) - 1, ty0 = Math.floor(vy0 / T) - 1;
      const tx1 = Math.ceil((vx0 + vw) / T) + 1, ty1 = Math.ceil((vy0 + vh) / T) + 1;
      G.Tiles.drawGround(ctx, this.map, tx0, ty0, tx1, ty1, this.time);
      this.fx.drawDecals(ctx);
      // objetos ordenados por profundidade
      const list = [];
      for (const pr of this.map.props) {
        const d = G.Props[pr.kind];
        if (!d) continue;
        if (pr.x + d.w < vx0 || pr.x - d.w > vx0 + vw || pr.y - d.h - 40 > vy0 + vh || pr.y + 40 < vy0) continue;
        list.push({ y: pr.y, p: pr });
      }
      for (const e of this.ents) {
        if (e.kind !== 'over' && (e.x < vx0 - 300 || e.x > vx0 + vw + 300 || e.y < vy0 - 100 || e.y > vy0 + vh + 400)) continue;
        list.push({ y: e.sortY(), e });
      }
      list.sort((a, b) => a.y - b.y);
      for (const it of list) {
        if (it.p) G.Props.draw(ctx, it.p, this.time);
        else it.e.draw(ctx, this);
      }
      this.fx.draw(ctx);
      if (this.voidY != null) this.drawEatenPage(ctx, vx0, vw, vy0, vh);
      // indicador de interação
      if (!this.locked() && this.player && this.player.state === 'normal') {
        const it = this.nearestInteractive();
        if (it) {
          const y = it.y - (it.eh || 64) - 6 + Math.sin(this.time * 5) * 2;
          const w = Art.keycap(ctx, Inp.keyLabel('interact'), it.x - 30, y, { size: 13 });
          ctx.save();
          ctx.font = G.font(16, 'body', 'italic');
          const vt = it.verb();
          const tw = ctx.measureText(vt).width;
          ctx.fillStyle = 'rgba(248,240,220,0.9)';
          ctx.fillRect(it.x - 30 + w / 2 + 4, y - 11, tw + 10, 22);
          ctx.fillStyle = C.ink;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(vt, it.x - 30 + w / 2 + 9, y + 1);
          ctx.restore();
        }
      }
      ctx.restore();
      // escuridão hachurada
      if (this.darkness > 0.01) this.drawDarkness(ctx, vx0, vy0, z);
      if (this.chapter.drawOver) this.chapter.drawOver(this, ctx);
      Art.vignette(ctx, this.map.theme === 'margem' ? 0.6 : 1);
      // HUD e interfaces
      if (!this.panel) {
        if (this.barK < 0.5 && !this.hideHUD) this.drawHUD(ctx);
        Art.letterbox(ctx, U.ease.inOut(this.barK));
        this.dlg.draw(ctx);
        this.drawToasts(ctx);
      }
      if (this.popup) this.drawPopup(ctx);
      if (this.titleCard) this.drawTitleCard(ctx);
      if (this.panel && this.panel.fn) {
        this.panel.fn(ctx, this.panel.t, this.panel.dur, this.panel.o, this);
        if (this.dlg.active) this.dlg.draw(ctx);
      }
      if (this.flashT > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.flashT / this.flashMax);
        ctx.fillStyle = this.flashC;
        ctx.fillRect(0, 0, G.W, G.H);
        ctx.restore();
      }
      if (this.fadeK > 0.001) {
        ctx.save();
        ctx.globalAlpha = this.fadeK;
        ctx.fillStyle = this.fadeColor;
        ctx.fillRect(0, 0, G.W, G.H);
        ctx.restore();
      }
    }

    drawVoidBG(ctx) {
      // letras soltas à deriva no vazio
      ctx.save();
      const t = this.time;
      ctx.font = G.font(22, 'title');
      ctx.textAlign = 'center';
      for (let i = 0; i < 46; i++) {
        const sp = 6 + U.hash(i, 1) * 18;
        const x = ((U.hash(i, 2) * 1400 - this.cam.x * 0.2 + t * sp) % 1100) - 70;
        const y = ((U.hash(i, 3) * 800 - this.cam.y * 0.2 - t * sp * 0.4) % 640 + 640) % 640 - 50;
        ctx.globalAlpha = 0.08 + U.hash(i, 4) * 0.16;
        ctx.fillStyle = i % 7 === 0 ? C.red : '#efe6d0';
        ctx.save();
        ctx.translate(x < -50 ? x + 1100 : x, y);
        ctx.rotate(t * 0.2 + i);
        ctx.fillText('ABCDEFGHIJLMNOPQRSTUVXZÇ'[i % 24], 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    drawEatenPage(ctx, vx0, vw, vy0, vh) {
      const y0 = this.voidY;
      if (y0 > vy0 + vh + 40) return;
      const t = this.time;
      ctx.save();
      // papel em branco (nada escrito)
      ctx.fillStyle = '#fbf8ef';
      ctx.beginPath();
      ctx.moveTo(vx0 - 20, vy0 + vh + 40);
      const step = 36;
      for (let x = vx0 - 20; x <= vx0 + vw + 40; x += step) {
        const bite = Math.sin(x * 0.07 + t * 5) * 8 + Math.sin(x * 0.023 - t * 3) * 10;
        ctx.lineTo(x, y0 + bite);
        ctx.quadraticCurveTo(x + step / 2, y0 + bite - 22 - Math.sin(t * 8 + x) * 4, x + step, y0 + Math.sin((x + step) * 0.07 + t * 5) * 8 + Math.sin((x + step) * 0.023 - t * 3) * 10);
      }
      ctx.lineTo(vx0 + vw + 40, vy0 + vh + 40);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 3;
      ctx.stroke();
      // sombra da borda mastigada
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 14;
      ctx.strokeStyle = C.ink;
      ctx.stroke();
      ctx.restore();
      // farelos de papel
      if (Math.random() < 0.5) {
        const x = vx0 + Math.random() * vw;
        this.fx.add({ type: 'paper', x, y: y0 - 10, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 40, z: 0, vz: 60, grav: 120, life: 0.9, size: 3 + Math.random() * 3 });
      }
    }

    drawDarkness(ctx, vx0, vy0, z) {
      const W = G.W, H = G.H;
      if (!darkCv || darkCv.rs !== G.RS) {
        darkCv = G.makeCanvas(W, H);
        darkCv.rs = G.RS;
        hatchPat = null;
      }
      const d = darkCv.getContext('2d');
      d.setTransform(G.RS, 0, 0, G.RS, 0, 0);
      d.globalCompositeOperation = 'source-over';
      d.clearRect(0, 0, W, H);
      const th = G.THEMES[this.map.theme];
      const k = this.darkness;
      d.fillStyle = th.hatch;
      d.globalAlpha = k * 0.62;
      d.fillRect(0, 0, W, H);
      if (!hatchPat) hatchPat = d.createPattern(hatchTile(), 'repeat');
      d.globalAlpha = Math.min(1, k * 0.7);
      d.fillStyle = hatchPat;
      d.save();
      d.translate((-vx0 * z) % 16, (-vy0 * z) % 16);
      d.fillRect(-16, -16, W + 32, H + 32);
      d.restore();
      d.globalAlpha = 1;
      d.globalCompositeOperation = 'destination-out';
      const cam = this.cam;
      for (const l of this.lightsFrame) {
        const sx = (l.x - cam.x) * z + W / 2 + cam.sx;
        const sy = (l.y - cam.y) * z + H / 2 + cam.sy;
        const r = l.r * z * (1 + Math.sin(this.time * 9 + l.x) * 0.015);
        if (sx < -r || sx > W + r || sy < -r || sy > H + r) continue;
        const g = d.createRadialGradient(sx, sy, r * 0.15, sx, sy, r);
        g.addColorStop(0, 'rgba(0,0,0,' + l.a + ')');
        g.addColorStop(0.55, 'rgba(0,0,0,' + l.a * 0.75 + ')');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        d.fillStyle = g;
        d.fillRect(sx - r, sy - r, r * 2, r * 2);
      }
      ctx.drawImage(darkCv, 0, 0, W, H);
      // brilho quente
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      for (const l of this.lightsFrame) {
        const sx = (l.x - cam.x) * z + W / 2, sy = (l.y - cam.y) * z + H / 2;
        const r = l.r * z * 0.8;
        if (sx < -r || sx > W + r || sy < -r || sy > H + r) continue;
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
        g.addColorStop(0, 'rgba(255,190,90,' + 0.35 * k + ')');
        g.addColorStop(1, 'rgba(255,190,90,0)');
        ctx.fillStyle = g;
        ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
      }
      ctx.restore();
    }

    // ------------------------------------------------------------------
    // HUD
    // ------------------------------------------------------------------
    drawHUD(ctx) {
      const S = G.state;
      // corações
      const n = Math.ceil(S.maxHp / 2);
      for (let i = 0; i < n; i++) {
        const v = U.clamp(S.hp - i * 2, 0, 2) / 2;
        const pulse = S.hp <= 2 && v > 0 ? 1 + Math.sin(this.time * 10) * 0.08 : 1;
        Art.heart(ctx, 30 + i * 30, 30, 26 * pulse, v, {});
      }
      // tinta
      if (S.abil.stamp) {
        const w = 120 * (S.maxInk / 100);
        const x = 44, y = 52;
        ctx.save();
        ctx.fillStyle = 'rgba(248,240,220,0.85)';
        ctx.fillRect(x, y, w, 12);
        ctx.fillStyle = C.ink;
        ctx.fillRect(x, y, w * (S.ink / S.maxInk), 12);
        ctx.fillStyle = S.ink >= 30 ? C.paperLight : C.red;
        ctx.globalAlpha = 0.6;
        Art.gouge(ctx, x + Math.min(w * (S.ink / S.maxInk) - 10, w * 0.4), y + 4, 18, 0, 1.4);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, 12);
        // marcas de custo do carimbo
        ctx.fillStyle = C.red;
        for (let k = 30; k < S.maxInk; k += 30) ctx.fillRect(x + w * (k / S.maxInk) - 0.5, y - 2, 1.5, 16);
        ctx.restore();
        G.Creatures.nanquim(ctx, { x: 26, y: 70, t: this.time, float: 0, scale: 0.62, level: S.ink / S.maxInk * 0.7 + 0.1 });
      }
      // rimas
      ctx.save();
      const rx = G.W - 30;
      ctx.font = G.font(22, 'title');
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const txt = String(S.rimas);
      const tw = ctx.measureText(txt).width;
      ctx.fillStyle = 'rgba(248,240,220,0.85)';
      ctx.fillRect(rx - tw - 46, 16, tw + 56, 32);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(rx - tw - 46, 16, tw + 56, 32);
      ctx.fillStyle = C.ink;
      ctx.fillText(txt, rx, 33);
      ctx.fillStyle = C.paperLight;
      ctx.fillRect(rx - tw - 38, 22, 16, 20);
      ctx.strokeRect(rx - tw - 38, 22, 16, 20);
      ctx.fillStyle = C.red;
      ctx.font = G.font(14, 'title');
      ctx.textAlign = 'center';
      ctx.fillText('R', rx - tw - 30, 33);
      ctx.restore();
      // objetivo
      if (this.objective) {
        ctx.save();
        const big = this.objFlash > 0;
        ctx.font = G.font(big ? 20 : 17, 'body', 'italic');
        const w = ctx.measureText(this.objective).width + 60;
        const x = G.W / 2 - w / 2, y = big ? 16 : 12;
        const a = big ? 1 : 0.85;
        ctx.globalAlpha = a;
        ctx.fillStyle = big ? C.paperLight : 'rgba(248,240,220,0.82)';
        ctx.fillRect(x, y, w, big ? 34 : 28);
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = big ? 2.5 : 1.5;
        ctx.strokeRect(x, y, w, big ? 34 : 28);
        ctx.fillStyle = C.red;
        ctx.beginPath();
        ctx.moveTo(x - 12, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + (big ? 34 : 28));
        ctx.lineTo(x - 12, y + (big ? 34 : 28));
        ctx.lineTo(x - 5, y + (big ? 17 : 14));
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + w + 12, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + (big ? 34 : 28));
        ctx.lineTo(x + w + 12, y + (big ? 34 : 28));
        ctx.lineTo(x + w + 5, y + (big ? 17 : 14));
        ctx.closePath();
        ctx.fill();
        Art.hand(ctx, x + 22, y + (big ? 17 : 14), 0.8, C.red);
        ctx.fillStyle = C.ink;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.objective, x + 40, y + (big ? 18 : 15));
        if (big) {
          ctx.font = G.font(12, 'title');
          ctx.fillStyle = C.red;
          ctx.textAlign = 'center';
          ctx.fillText('NOVO OBJETIVO', G.W / 2, y + 44);
        }
        ctx.restore();
      }
      // habilidades
      const ab = [
        { a: 'attack', label: 'Chicote', on: true },
        { a: 'dodge', label: 'Esquiva', on: true, cd: this.player ? this.player.dodgeCD / 0.55 : 0 },
        { a: 'stamp', label: 'Carimbo', on: S.abil.stamp, dim: S.ink < 30 },
        { a: 'throw', label: 'Pregador', on: S.abil.throw, cd: this.player ? this.player.throwCD / 0.45 : 0 },
      ];
      if (!Inp.touch.enabled) {
        let x = G.W - 20;
        for (let i = ab.length - 1; i >= 0; i--) {
          const b = ab[i];
          if (!b.on) continue;
          ctx.save();
          ctx.font = G.font(13, 'body', 'italic');
          const lw = Math.max(ctx.measureText(b.label).width + 12, 44);
          x -= lw;
          ctx.globalAlpha = b.dim ? 0.45 : 0.9;
          ctx.fillStyle = 'rgba(248,240,220,0.8)';
          ctx.fillRect(x, G.H - 46, lw, 32);
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x, G.H - 46, lw, 32);
          if (b.cd > 0) {
            ctx.fillStyle = 'rgba(29,23,18,0.3)';
            ctx.fillRect(x, G.H - 46, lw * Math.min(1, b.cd), 32);
          }
          ctx.fillStyle = C.ink;
          ctx.textAlign = 'center';
          ctx.fillText(b.label, x + lw / 2, G.H - 20);
          ctx.restore();
          Art.keycap(ctx, Inp.keyLabel(b.a), x + lw / 2, G.H - 48, { size: 12, h: 18, minW: 20 });
          x -= 8;
        }
      }
      // chefe
      const boss = this.boss;
      if (boss && boss.active && !boss.defeated) {
        const w = 460, x = G.W / 2 - w / 2, y = G.H - 44;
        ctx.save();
        ctx.fillStyle = 'rgba(29,23,18,0.85)';
        ctx.fillRect(x - 6, y - 26, w + 12, 42);
        ctx.fillStyle = C.paperLight;
        ctx.font = G.font(15, 'title');
        ctx.textAlign = 'center';
        ctx.fillText(boss.name, G.W / 2, y - 8);
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(x, y, w, 10);
        ctx.fillStyle = C.red;
        ctx.fillRect(x, y, w * boss.hpFrac, 10);
        ctx.fillStyle = 'rgba(255,240,220,0.5)';
        ctx.fillRect(x, y, w * boss.hpFrac, 3);
        ctx.strokeStyle = C.paperLight;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, 10);
        ctx.restore();
      }
      // nome da área
      if (this.zoneT > 0 && this.zoneName) {
        const k = Math.min(1, this.zoneT / 0.4, (2.8 - this.zoneT) / 0.3);
        ctx.save();
        ctx.globalAlpha = k;
        const y = 168;
        ctx.font = G.font(26, 'title');
        const w = ctx.measureText(this.zoneName).width + 80;
        ctx.fillStyle = 'rgba(29,23,18,0.8)';
        ctx.fillRect(G.W / 2 - w / 2, y - 22, w, 44);
        Art.vinheta(ctx, G.W / 2, y - 30, w - 20, C.paperLight);
        Art.vinheta(ctx, G.W / 2, y + 30, w - 20, C.paperLight);
        ctx.fillStyle = C.paperLight;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.zoneName, G.W / 2, y + 2);
        ctx.restore();
      }
      // dica
      if (this.hint) {
        const h = this.hint;
        const k = Math.min(1, h.t / 0.4, (h.max - h.t) / 0.3);
        ctx.save();
        ctx.globalAlpha = k;
        ctx.font = G.font(18, 'body');
        let w = ctx.measureText(h.text).width + 40;
        const keys = h.keys.map((a) => Inp.keyLabel(a));
        for (const kk of keys) w += 36 + kk.length * 6;
        const x = 20, y = 92;
        Art.panel(ctx, x, y, w, 44, { fill: C.paperLight, shadow: true });
        let cx = x + 18;
        for (const kk of keys) cx += Art.keycap(ctx, kk, cx, y + 22, { align: 'left', size: 13 }) + 8;
        ctx.fillStyle = C.ink;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(h.text, cx + 4, y + 23);
        ctx.restore();
      }
    }
    drawToasts(ctx) {
      let y = G.H - (this.dlg.active ? 190 : 100);
      for (const t of this.toasts) {
        const k = Math.min(1, t.t / 0.3, (t.max - t.t) / 0.2);
        ctx.save();
        ctx.globalAlpha = k;
        ctx.font = G.font(19, 'body', 'italic');
        const w = ctx.measureText(t.text).width + 40;
        ctx.fillStyle = 'rgba(29,23,18,0.82)';
        ctx.fillRect(G.W / 2 - w / 2, y - 18, w, 34);
        ctx.fillStyle = C.paperLight;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.text, G.W / 2, y);
        ctx.restore();
        y -= 40;
      }
    }
    drawPopup(ctx) {
      const p = this.popup;
      const k = U.ease.outBack(Math.min(1, p.t / 0.4));
      ctx.save();
      ctx.fillStyle = 'rgba(15,10,6,' + 0.55 * Math.min(1, p.t * 3) + ')';
      ctx.fillRect(0, 0, G.W, G.H);
      ctx.translate(G.W / 2, G.H / 2);
      ctx.scale(k, k);
      const w = 560, h = 260;
      Art.panel(ctx, -w / 2, -h / 2, w, h, { fill: C.paper, teeth: true });
      ctx.textAlign = 'center';
      ctx.fillStyle = C.red;
      ctx.font = G.font(16, 'title');
      ctx.fillText('NOVA HABILIDADE', 0, -h / 2 + 44);
      Art.drawWood(ctx, p.info.name.toUpperCase(), 0, -h / 2 + 88, 36, C.ink, { red: C.red });
      ctx.font = G.font(20, 'body');
      ctx.fillStyle = C.ink;
      const lines = U.wrap(ctx, p.info.desc, w - 80);
      lines.forEach((l, i) => ctx.fillText(l, 0, -h / 2 + 140 + i * 26));
      Art.keycap(ctx, Inp.keyLabel(p.info.key), 0, h / 2 - 34, { size: 16, h: 26, minW: 34 });
      ctx.restore();
    }
    drawTitleCard(ctx) {
      const c = this.titleCard;
      const inK = Math.min(1, c.t / 0.6);
      const outK = Math.min(1, (c.dur - c.t) / 0.6);
      const a = Math.min(inK, outK);
      ctx.save();
      ctx.globalAlpha = a;
      Art.fillPaper(ctx, 0, 0, G.W, G.H, G.THEMES[this.map.theme].bg ? '#e9e0cb' : G.THEMES[this.map.theme].paper);
      Art.pageFrame(ctx, C.ink);
      const s = 0.9 + 0.1 * U.ease.outCubic(inK);
      ctx.translate(G.W / 2, G.H / 2);
      ctx.scale(s, s);
      Art.vinheta(ctx, 0, -88, 360, C.ink);
      ctx.fillStyle = C.red;
      ctx.font = G.font(24, 'title');
      ctx.textAlign = 'center';
      ctx.fillText(c.title, 0, -48);
      if (c.sub) Art.drawWood(ctx, c.sub, 0, 12, c.sub.length > 22 ? 40 : 50, C.ink, { red: C.red });
      Art.vinheta(ctx, 0, 70, 360, C.ink);
      ctx.restore();
    }
  }
  G.World = World;

  // ==================================================================
  // Objetivo especial da Cidade: a prensa a sabotar
  // ==================================================================
  class PrensaObj extends E.Ent {
    constructor(o) {
      super(o);
      this.kind = 'prensaObj';
      this.solid = true;
      this.cw = 110;
      this.ch = 44;
      this.eh = 150;
      this.stage = this.done ? 'done' : 'idle';
      this.hpV = 3;
    }
    get done() {
      return !!G.state.flags['prensa_' + this.fid];
    }
    canHit() {
      return this.stage === 'exposed';
    }
    hitValve(W, dmg, how) {
      this.hpV -= how === 'stamp' ? 3 : dmg;
      this.flash = 0.2;
      Au.sfx('bossHit');
      W.fx.burst(this.x, this.y - 50, 8, { type: 'ink', color: C.red, speed: 150, size: 4 });
      if (this.hpV <= 0) this.explode(W);
    }
    explode(W) {
      this.stage = 'done';
      G.state.flags['prensa_' + this.fid] = true;
      Au.sfx('boom');
      W.shake(10, 0.6);
      for (let i = 0; i < 40; i++) {
        W.fx.add({ type: 'confetti', x: this.x + (Math.random() - 0.5) * 100, y: this.y - 60, vx: (Math.random() - 0.5) * 300, vy: -Math.random() * 100, z: 40, vz: 200 + Math.random() * 200, grav: 300, life: 2, size: 4, color: U.pick([C.red, C.yellow, C.blue, C.paperLight]) });
      }
      W.fx.text(this.x, this.y - 120, 'CATAPLÁ!', { size: 30 });
      this.lock(W, false);
      if (W.chapter.onPrensa) W.chapter.onPrensa(W, this);
      W.refreshObjective();
    }
    lock(W, on) {
      for (const d of this.doors || []) {
        const [x, y, w, h] = d;
        for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) W.map.set(i, j, on ? 'F' : '.');
      }
      this.locked = on;
    }
    update(dt, W) {
      this.baseUpdate(dt);
      if (this.done && this.stage !== 'done') this.stage = 'done';
      if (this.stage === 'done') return;
      const p = W.player;
      const [ax, ay, aw, ah] = this.area;
      const inside = p && p.x > ax * T + 20 && p.x < (ax + aw) * T - 20 && p.y > ay * T + 20 && p.y < (ay + ah) * T;
      if (this.stage === 'idle' && inside && !W.locked()) {
        this.stage = 'waves';
        this.wave = 0;
        this.lock(W, true);
        Au.sfx('clank');
        W.shake(4, 0.3);
        W.toast('Os portões fecharam! Derrote os guardas!', 2.2);
        Au.play('boss');
        this.spawnWave(W);
      } else if (this.stage === 'waves') {
        const alive = W.ents.filter((e) => e.kind === 'enemy' && e.fromPrensa === this.fid && !e.dead).length;
        if (alive === 0) {
          this.wave++;
          if (this.wave >= 2) {
            this.stage = 'exposed';
            Au.sfx('charge', { dur: 0.6 });
            W.toast('A válvula da prensa está exposta! Carimbe-a!', 2.4);
          } else this.spawnWave(W);
        }
      }
      // estampando no ritmo
      this.pk = (this.pk || 0) + dt;
      if (this.pk > 1.2) {
        this.pk = 0;
        if (U.dist(this.x, this.y, p.x, p.y) < 500) Au.sfx('clank', { vol: 0.25 });
      }
    }
    spawnWave(W) {
      const [ax, ay, aw, ah] = this.area;
      const kinds = this.wave === 0 ? ['carimbo', 'jagunco', 'carimbo'] : ['jagunco', 'carimbo', 'jagunco', 'borrao', 'borrao'];
      kinds.forEach((k, i) => {
        const x = (ax + 1 + ((i * 3.7) % (aw - 2))) * T + T / 2;
        const y = (ay + 1 + (i % 2) * (ah - 3)) * T + T / 2;
        const e = G.Enemies.create({ kind: k, x, y, spawnT: 0.6 + i * 0.15, aggro: 700 });
        e.fromPrensa = this.fid;
        W.add(e);
      });
    }
    draw(ctx, W) {
      const ink = G.Pal.ink;
      const t = this.t;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = 'rgba(20,12,6,0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 60, 14, 0, 0, U.TAU);
      ctx.fill();
      const done = this.stage === 'done';
      const k = done ? 0 : Math.max(0, Math.sin(t * 5.2));
      // estrutura
      ctx.fillStyle = done ? '#4a4038' : ink;
      ctx.fillRect(-52, -110, 12, 110);
      ctx.fillRect(40, -110, 12, 110);
      ctx.fillRect(-58, -118, 116, 16);
      // prato
      ctx.fillStyle = G.Pal.mid;
      ctx.fillRect(-40, -100 + k * 50, 80, 20);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(-40, -100 + k * 50, 80, 20);
      // mesa com papel
      ctx.fillStyle = ink;
      ctx.fillRect(-46, -30, 92, 30);
      ctx.fillStyle = '#f7f1e3';
      ctx.fillRect(-36, -40, 72, 12);
      ctx.fillStyle = C.red;
      ctx.font = G.font(8, 'title');
      ctx.textAlign = 'center';
      ctx.fillText('E O CORONEL FOI DONO DE TUDO. FIM.', 0, -31);
      // válvula
      if (!done) {
        const exp = this.stage === 'exposed';
        const glow = exp ? 0.5 + Math.sin(t * 10) * 0.5 : 0;
        SP.dot(ctx, 0, -60, 12 + glow * 3, exp ? C.red : '#6a5a4a', ink, 2.5);
        ctx.strokeStyle = G.Pal.paper;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-7, -60);
        ctx.lineTo(7, -60);
        ctx.moveTo(0, -67);
        ctx.lineTo(0, -53);
        ctx.stroke();
        if (exp) {
          ctx.strokeStyle = C.red;
          ctx.globalAlpha = glow;
          ctx.beginPath();
          ctx.arc(0, -60, 24, 0, U.TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      } else {
        ctx.fillStyle = ink;
        Art.blob(ctx, 0, -60, 14, 10, 5, 0.4, 5);
        ctx.fill();
        for (let i = 0; i < 2; i++) {
          const kk = (t * 0.5 + i / 2) % 1;
          ctx.globalAlpha = 1 - kk;
          SP.dot(ctx, Math.sin(kk * 5) * 8, -70 - kk * 50, 6 + kk * 10, '#8a8070');
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      void W;
    }
  }
  E.extra.prensaObj = PrensaObj;
})();
