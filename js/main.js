/* PELEJA — laço principal, gerenciador de cenas, transições e fluxo do jogo */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Art = G.Art;
  const Inp = G.Input;
  const Au = G.Audio;
  const C = G.C;

  // ==================================================================
  // Gerenciador de cenas + transições
  // ==================================================================
  const SM = (G.SM = {
    stack: [],
    tr: null,
    top() {
      return this.stack[this.stack.length - 1];
    },
    _push(s) {
      this.stack.push(s);
      if (s.enter) s.enter();
    },
    _pop() {
      const s = this.stack.pop();
      if (s && s.exit) s.exit();
      return s;
    },
    set(scene, type = 'fade') {
      this.transition(type, () => {
        while (this.stack.length) this._pop();
        this._push(scene);
      });
    },
    replace(scene, type = 'fade') {
      this.transition(type, () => {
        this._pop();
        this._push(scene);
      });
    },
    push(scene, type = 'none') {
      this.transition(type, () => this._push(scene));
    },
    pop(type = 'none') {
      this.transition(type, () => this._pop());
    },
    transition(type, swap) {
      if (type === 'none' || !type) {
        swap();
        return;
      }
      if (this.tr && this.tr.phase === 'out') {
        // encadeia: troca imediatamente a anterior
        const old = this.tr.swap;
        this.tr.swap = () => {
          old();
          swap();
        };
        return;
      }
      const snap = type === 'page' || type === 'tear' ? snapshot() : null;
      const dur = { fade: 0.35, ink: 0.45, page: 0.9, tear: 1.1, slow: 1.1 }[type] || 0.4;
      this.tr = { type, t: 0, dur, phase: snap ? 'in' : 'out', swap, snap };
      if (snap) {
        swap();
        if (type === 'page') Au.sfx('page');
        if (type === 'tear') Au.sfx('tear');
      } else if (type === 'ink') Au.sfx('splat', { vol: 0.5 });
      Inp.block(dur * 2);
    },
    update(dt) {
      const tr = this.tr;
      if (tr) {
        tr.t += dt;
        if (tr.phase === 'out' && tr.t >= tr.dur) {
          tr.swap();
          tr.phase = 'in';
          tr.t = 0;
        } else if (tr.phase === 'in' && tr.t >= tr.dur) {
          this.tr = null;
        }
        if (tr.phase === 'out') return;
      }
      const s = this.top();
      if (s) s.update(dt);
    },
    draw(ctx) {
      if (!this.stack.length) {
        ctx.fillStyle = C.night;
        ctx.fillRect(0, 0, G.W, G.H);
        if (this.tr) drawTransition(ctx, this.tr);
        return;
      }
      let i = this.stack.length - 1;
      while (i > 0 && !this.stack[i].opaque) i--;
      for (; i < this.stack.length; i++) this.stack[i].draw(ctx);
      if (this.tr) drawTransition(ctx, this.tr);
    },
  });

  let snapCv = null;
  function snapshot() {
    const cv = G.canvas;
    if (!snapCv || snapCv.width !== cv.width || snapCv.height !== cv.height) {
      snapCv = document.createElement('canvas');
      snapCv.width = cv.width;
      snapCv.height = cv.height;
    }
    const x = snapCv.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, snapCv.width, snapCv.height);
    x.drawImage(cv, 0, 0);
    return snapCv;
  }

  function drawTransition(ctx, tr) {
    const k = U.clamp(tr.t / tr.dur, 0, 1);
    const cover = tr.phase === 'out' ? k : 1 - k;
    const W = G.W, H = G.H;
    ctx.save();
    if (tr.type === 'fade' || tr.type === 'slow') {
      ctx.globalAlpha = U.ease.inOut(cover);
      ctx.fillStyle = C.night;
      ctx.fillRect(0, 0, W, H);
    } else if (tr.type === 'ink') {
      const e = U.ease.inOut(cover);
      const R = Math.hypot(W, H) * 0.62 * e;
      ctx.fillStyle = C.ink;
      if (R > 1) {
        Art.blob(ctx, W / 2, H / 2, R, R, 11, 0.16, 7 + Math.floor(tr.t * 12));
        ctx.fill();
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * U.TAU + 0.3;
          const d = R * (1.05 + U.hash(i, 5) * 0.2);
          ctx.beginPath();
          ctx.arc(W / 2 + Math.cos(a) * d, H / 2 + Math.sin(a) * d, R * 0.05 * (0.5 + U.hash(i, 8)), 0, U.TAU);
          ctx.fill();
        }
      }
    } else if (tr.type === 'page' && tr.snap) {
      const e = U.ease.inOut(k);
      const fold = W * (1 - e) - 60 * e;
      if (fold > -40) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.max(0, fold), 0);
        ctx.lineTo(Math.max(0, fold - 50 * (1 - e)), H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(tr.snap, 0, 0, W, H);
        ctx.restore();
        // verso da página dobrando
        const bw = Math.min(160, (W - fold) * 0.35);
        const g = ctx.createLinearGradient(fold, 0, fold + bw, 0);
        g.addColorStop(0, '#d6c39c');
        g.addColorStop(0.4, '#f3e8cf');
        g.addColorStop(1, 'rgba(243,232,207,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(fold, 0);
        ctx.lineTo(fold + bw, 0);
        ctx.lineTo(fold + bw - 50 * (1 - e), H);
        ctx.lineTo(fold - 50 * (1 - e), H);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(fold - 12, 0, 12, H);
      }
    } else if (tr.type === 'tear' && tr.snap) {
      const e = U.ease.inCubic(k);
      const off = e * W * 0.6;
      const r = U.rng(3);
      const pts = [];
      for (let i = 0; i <= 14; i++) pts.push([W / 2 + (r() - 0.5) * 60, (i / 14) * H]);
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side * off, e * 40);
        ctx.rotate(side * e * 0.12);
        ctx.beginPath();
        if (side < 0) {
          ctx.moveTo(0, 0);
          for (const p of pts) ctx.lineTo(p[0], p[1]);
          ctx.lineTo(0, H);
        } else {
          ctx.moveTo(W, 0);
          for (const p of pts) ctx.lineTo(p[0], p[1]);
          ctx.lineTo(W, H);
        }
        ctx.closePath();
        ctx.save();
        ctx.clip();
        ctx.drawImage(tr.snap, 0, 0, W, H);
        ctx.restore();
        ctx.strokeStyle = '#f3e8cf';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // ==================================================================
  // Fluxo do jogo
  // ==================================================================
  const ORDER = ['prologo', 'cap1', 'cap2', 'cap3', 'final'];
  let snapState = null;

  const Game = (G.Game = {
    ORDER,
    newState() {
      return {
        v: 1, chapter: 'prologo', map: 'vila', x: null, y: null,
        hp: 10, maxHp: 10, ink: 100, maxInk: 100, rimas: 0,
        abil: { stamp: false, throw: false },
        up: { heart: 0, ink: 0, whip: 0, dmg: 0, dodge: 0 },
        flags: {}, time: 0, chStart: 0,
        stats: { kills: 0, hits: 0, deaths: 0, rimas: 0, bosses: 0 },
        explored: {}, bought: {},
      };
    },
    baseline(ch) {
      const s = this.newState();
      const i = ORDER.indexOf(ch);
      s.chapter = ch;
      s.map = G.Story.CH[ch].map;
      if (i >= 1) {
        s.abil.stamp = true;
        Object.assign(s.flags, { nanquim: true, introVila: true, tarefaCordao: true, cordao_oeste: true, cordao_igreja: true, cordao_leste: true, pelejaSabia: true, solComido: true, borroesOk: true, fugaComecou: true, fugaFim: true });
      }
      if (i >= 2) {
        s.abil.throw = true;
        s.maxHp = 12;
        Object.assign(s.flags, { boss1: true, serraAberta: true, cap1Intro: true });
      }
      if (i >= 3) {
        s.maxHp = 14;
        s.up.whip = 1;
        Object.assign(s.flags, { boss2: true, cap2Intro: true });
      }
      if (i >= 4) {
        s.maxHp = 16;
        Object.assign(s.flags, { boss3: true, cap3Intro: true, margemAberta: true, tipografiaAberta: true });
      }
      s.hp = s.maxHp;
      s.rimas = 30 * i;
      return s;
    },
    newGame() {
      G.state = this.newState();
      snapState = null;
      G.Save.clearGame();
      SM.set(new G.IntroScene(), 'fade');
    },
    startFromIntro() {
      G.state.chStart = 0;
      SM.set(new G.World({ map: 'vila', fresh: true, fadeIn: true }), 'fade');
    },
    continueGame() {
      const s = G.Save.loadGame();
      if (!s) return this.newGame();
      G.state = Object.assign(this.newState(), s);
      snapState = U.copy(G.state);
      SM.set(new G.World({ map: G.state.map, x: G.state.x, y: G.state.y, fadeIn: true }), 'ink');
    },
    startChapter(ch) {
      G.state = this.baseline(ch);
      snapState = null;
      SM.set(new G.World({ map: G.state.map, fresh: true, fadeIn: true }), 'page');
    },
    goMap(id, x, y, o = {}) {
      const S = G.state;
      S.map = id;
      S.x = x;
      S.y = y;
      const w = new G.World({ map: id, x: x == null ? undefined : x, y: y == null ? undefined : y, dir: o.dir, fadeIn: o.transition === 'none' });
      SM.replace(w, o.transition || 'ink');
    },
    checkpoint() {
      const S = G.state;
      S.hp = Math.max(S.hp, 1);
      snapState = U.copy(S);
      G.Save.saveGame(snapState);
    },
    world() {
      for (let i = SM.stack.length - 1; i >= 0; i--) if (SM.stack[i] instanceof G.World) return SM.stack[i];
      return null;
    },
    pause(scene, fromPeleja) {
      Au.sfx('menuBack');
      SM.push(new G.PauseScene(scene, fromPeleja));
    },
    journal(tab) {
      Au.sfx('page');
      SM.push(new G.JournalScene({ tab, inGame: true }));
    },
    shop(done) {
      SM.push(new G.ShopScene(done));
    },
    showVerse(n, isNew, done) {
      SM.push(new G.VerseScene(n, isNew, done));
    },
    peleja(id, cb) {
      Au.sfx('boom', { vol: 0.5 });
      SM.push(new G.PelejaScene(id, cb), 'ink');
    },
    endPeleja(scene, won) {
      const cb = scene.onWin;
      SM.pop('ink');
      const w = this.world();
      if (w) {
        const mus = w.chapter.music ? w.chapter.music(G.state, w.mapId) : null;
        if (mus) Au.play(mus);
        else Au.stop(0.3);
        const amb = w.chapter.amb ? w.chapter.amb(G.state, w.mapId) : null;
        Au.ambient(amb);
      }
      if (won && cb) setTimeout(cb, 0);
    },
    gameOver() {
      SM.push(new G.GameOverScene(), 'tear');
    },
    retry() {
      const base = snapState ? U.copy(snapState) : this.baseline(G.state.chapter);
      base.stats = G.state.stats;
      base.time = G.state.time;
      base.hp = base.maxHp;
      base.ink = base.maxInk;
      G.state = base;
      SM.set(new G.World({ map: base.map, x: base.x == null ? undefined : base.x, y: base.y == null ? undefined : base.y, fadeIn: true }), 'ink');
    },
    toMenu() {
      Au.stop(0.6);
      Au.ambient(null);
      SM.set(new G.MainMenu(), 'fade');
    },
    chapterComplete(id) {
      const S = G.state;
      const info = G.Story.CH[id];
      const next = info.next;
      const stats = {
        time: S.time - (S.chStart || 0), rimas: S.rimas, hits: S.stats.hits, kills: S.stats.kills,
        verses: G.Save.meta.verses.length,
      };
      if (next) {
        G.Save.unlockChapter(next);
        S.chapter = next;
        S.map = G.Story.CH[next].map;
        S.x = S.y = null;
        S.hp = S.maxHp;
        S.ink = S.maxInk;
        S.chStart = S.time;
        this.checkpoint();
      }
      SM.set(new G.ChapterCompleteScene(id, stats, next), 'page');
    },
    startNextChapter(next) {
      SM.set(new G.World({ map: G.Story.CH[next].map, fresh: true, fadeIn: true }), 'page');
    },
    ending(kind) {
      G.Save.addEnding(kind);
      SM.set(new G.EndingScene(kind), 'slow');
    },
    credits(kind) {
      SM.set(new G.CreditsScene(kind), 'fade');
    },
  });

  // ==================================================================
  // Laço principal
  // ==================================================================
  function applyQuality() {
    const q = G.Save.settings.quality;
    const dpr = window.devicePixelRatio || 1;
    let rs = 1;
    if (q === 'alta') rs = 2;
    else if (q === 'auto') rs = Math.min(2, Math.max(1, Math.round(dpr * Math.min(window.innerWidth / G.W, window.innerHeight / G.H) * 0.75 * 2) / 2));
    if (rs !== G.RS) {
      G.RS = rs;
      G.canvas.width = G.W * rs;
      G.canvas.height = G.H * rs;
      G.Cache.clear();
    }
  }
  G.applyQuality = applyQuality;

  function resize() {
    const cv = G.canvas;
    const box = document.getElementById('wrap');
    const bw = (box && box.clientWidth) || window.innerWidth;
    const bh = (box && box.clientHeight) || window.innerHeight;
    const s = Math.min(bw / G.W, bh / G.H);
    cv.style.width = Math.floor(G.W * s) + 'px';
    cv.style.height = Math.floor(G.H * s) + 'px';
    applyQuality();
  }

  let last = 0;
  let acc = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000));
    last = ts;
    acc += dt;
    G.time += dt;
    G.boil = Math.floor(G.time * 7) % 3;
    Inp.update(dt);
    try {
      SM.update(dt);
    } catch (e) {
      console.error(e);
      G.lastError = e;
    }
    const ctx = G.ctx;
    ctx.setTransform(G.RS, 0, 0, G.RS, 0, 0);
    ctx.imageSmoothingEnabled = true;
    try {
      SM.draw(ctx);
    } catch (e) {
      console.error(e);
      G.lastError = e;
    }
    Inp.drawTouch(ctx);
    if (G.DEBUG) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(G.W - 90, G.H - 22, 90, 22);
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(Math.round(1 / Math.max(dt, 0.001)) + ' fps', G.W - 84, G.H - 7);
    }
    Inp.endFrame();
  }

  function boot() {
    G.canvas = document.getElementById('game');
    G.ctx = G.canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    G.state = Game.newState();
    const start = () => {
      document.getElementById('boot').classList.add('hide');
      SM.set(new G.TitleScene(), 'fade');
      last = performance.now();
      requestAnimationFrame(frame);
      window.GAME_READY = true;
    };
    const fonts = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('20px "Rye"'), document.fonts.load('20px "IM Fell English"'), document.fonts.load('italic 20px "IM Fell English"')]) : Promise.resolve();
    let started = false;
    const go = () => {
      if (started) return;
      started = true;
      G.Cache.clear();
      start();
    };
    fonts.then(go, go);
    setTimeout(go, 2500);
  }

  G.onBlur = function () {
    const s = SM.top();
    if (s instanceof G.World && !s.locked() && !(SM.tr)) Game.pause(s);
  };

  window.addEventListener('load', boot);
})();
