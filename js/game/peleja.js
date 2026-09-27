/* PELEJA — o duelo de repente: ritmo + rima */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Art = G.Art;
  const Inp = G.Input;
  const Au = G.Audio;
  const C = G.C;

  const LANES = ['left', 'down', 'up', 'right'];
  const ARROWS = ['←', '↓', '↑', '→'];
  const LANE_W = 128;
  const LX0 = G.W / 2 - LANE_W * 2;
  const HIT_Y = 452;
  const SPAWN_Y = 156;

  const STAGES = {
    feira: { paper: '#f1dc9c', sky: '#e7c46a', moon: false },
    serra: { paper: '#ecc987', sky: '#d9a860', moon: false },
    acude: { paper: '#c7dbe2', sky: '#9fbccb', moon: true },
    cidade: { paper: '#efc5bf', sky: '#dca39b', moon: true },
    margem: { paper: '#2a231c', sky: '#15110e', moon: true, dark: true },
  };

  // ------------------------------------------------------------------
  class PelejaScene {
    constructor(id, onWin, onQuit) {
      this.id = id;
      this.cfg = G.Story.pelejas[id];
      this.onWin = onWin;
      this.onQuit = onQuit;
      this.opaque = true;
      this.round = 0;
      this.meter = this.cfg.tutorial ? 15 : 0;
      this.shownMeter = this.meter;
      this.notes = [];
      this.fx = [];
      this.combo = 0;
      this.best = 0;
      this.stats = { perfect: 0, good: 0, wrong: 0, miss: 0 };
      this.phase = 'intro';
      this.t = 0;
      this.stage = STAGES[this.cfg.stage] || STAGES.feira;
      this.crowd = [];
      const r = U.rng(U.strHash(id));
      for (let i = 0; i < 26; i++) this.crowd.push({ x: (i / 25) * G.W + (r() - 0.5) * 30, row: i % 2, hat: Math.floor(r() * 4), s: 0.8 + r() * 0.4, ph: r() * 6 });
      this.pressFx = [0, 0, 0, 0];
      this.cheer = 0;
    }
    enter() {
      Inp.touch.layout = 'peleja';
      Au.stop(0.4);
      Au.ambient(null);
      this.phase = 'intro';
      this.t = 0;
    }
    exit() {
      Inp.touch.layout = 'game';
      Au.stop(0.5);
    }
    now() {
      return Au.now();
    }
    beatT(b) {
      return this.t0 + b * this.beat;
    }

    // --------------------------------------------------------------
    startRound() {
      const R = this.cfg.rounds[this.round];
      this.R = R;
      this.beat = 60 / R.bpm;
      this.playBeats = this.cfg.tutorial ? 16 : R.bpm >= 120 ? 24 : 20;
      this.t0 = Au.play('peleja', { bpm: R.bpm, restart: true, delay: 0.35, fadeOut: 0.2 });
      this.phase = 'round';
      this.notes = [];
      this.roundHits = 0;
      this.roundTotal = 0;
      this.roundWrong = 0;
      this.oppDone = false;
      this.respDone = false;
      this.buildChart(R);
      // o verso do adversário "canta" em notas
      this.sing(R.opp, 0, this.cfg.opp === 'tra' ? 'fiddle' : 'fiddle', 0.07, -1);
    }
    buildChart(R) {
      const words = G.Story.RIMAS[R.sound].slice();
      U.shuffle(words);
      const others = Object.keys(G.Story.RIMAS).filter((k) => k !== R.sound);
      const startB = 16;
      const slots = [];
      for (let b = 0; b < this.playBeats; b++) {
        slots.push(b);
        if (R.density > 0.95 && b % 2 === 1 && b < this.playBeats - 1) slots.push(b + 0.5);
      }
      const n = Math.round(slots.length * Math.min(1, R.density) * 0.82);
      U.shuffle(slots);
      const chosen = slots.slice(0, n).sort((a, b) => a - b);
      let wi = 0;
      let lastLane = -1;
      const used = new Set();
      chosen.forEach((b, i) => {
        const correct = Math.random() < R.correct || (i % 5 === 0);
        let word;
        if (correct) {
          word = words[wi++ % words.length];
        } else {
          let tries = 0;
          do {
            const k = U.pick(others);
            word = U.pick(G.Story.RIMAS[k]);
            tries++;
          } while (used.has(word) && tries < 10);
        }
        used.add(word);
        let lane = Math.floor(Math.random() * 4);
        if (lane === lastLane && Math.random() < 0.6) lane = (lane + 1 + Math.floor(Math.random() * 3)) % 4;
        lastLane = lane;
        this.notes.push({ b: startB + b, lane, word, correct, judged: false, res: null, jt: 0 });
        if (correct) this.roundTotal++;
      });
    }
    sing(lines, startBeat, inst, vol, side) {
      if (!Au.running()) return;
      const ch = [392, 440, 494, 523, 587, 659, 698, 784];
      const d = Au.musicBus;
      lines.forEach((line, i) => {
        const syl = Math.min(7, Math.max(4, Math.round(line.replace(/[^a-zA-ZÀ-ú]/g, '').length / 3)));
        for (let k = 0; k < syl; k++) {
          const tb = startBeat + i * 2 + (k * 1.6) / syl;
          const f = ch[(i * 3 + k * (side > 0 ? 2 : 3) + (k === syl - 1 ? 4 : 0)) % ch.length] * (side > 0 ? 1 : 0.5);
          const t = this.beatT(tb);
          if (t > Au.ctx.currentTime) Au.INS[inst](t, f, this.beat * 0.28, vol, d);
        }
      });
    }
    judgeWindow() {
      const w = G.diff().window * (this.cfg.tutorial ? 1.3 : 1);
      return { perfect: 0.075 * w, good: 0.155 * w };
    }
    press(lane) {
      this.pressFx[lane] = 1;
      const tNow = this.now() - (G.Save.settings.rhythmOffset || 0) / 1000;
      const W = this.judgeWindow();
      let best = null, bd = 1e9;
      for (const n of this.notes) {
        if (n.judged || n.lane !== lane) continue;
        const d = Math.abs(this.beatT(n.b) - tNow);
        if (d < bd) {
          bd = d;
          best = n;
        }
      }
      if (!best || bd > W.good) return;
      best.judged = true;
      best.jt = 0;
      const pen = G.diff().pelejaPenalty * (this.cfg.tutorial ? 0.5 : 1);
      if (best.correct) {
        const perfect = bd <= W.perfect;
        best.res = perfect ? 'perfect' : 'good';
        this.meter += perfect ? 7 : 4.5;
        this.combo++;
        this.best = Math.max(this.best, this.combo);
        this.roundHits++;
        this.stats[best.res]++;
        Au.sfx(perfect ? 'perfect' : 'good');
        this.pop(lane, perfect ? 'NA BATIDA!' : 'BOA!', perfect ? C.red : C.ink);
        this.cheer = Math.min(1, this.cheer + 0.2);
      } else {
        best.res = 'wrong';
        this.meter -= 7 * pen;
        this.combo = 0;
        this.roundWrong++;
        this.stats.wrong++;
        Au.sfx('wrong');
        this.pop(lane, 'RIMA POBRE!', '#6a5a4a');
        this.shake = 0.25;
      }
    }
    pop(lane, text, color) {
      this.fx.push({ x: LX0 + lane * LANE_W + LANE_W / 2, y: HIT_Y - 40, text, color, t: 0 });
    }

    // --------------------------------------------------------------
    update(dt) {
      this.t += dt;
      this.shownMeter += (this.meter - this.shownMeter) * Math.min(1, dt * 6);
      this.cheer = Math.max(0, this.cheer - dt * 0.4);
      if (this.shake > 0) this.shake -= dt;
      for (let i = 0; i < 4; i++) this.pressFx[i] = Math.max(0, this.pressFx[i] - dt * 5);
      for (const f of this.fx) f.t += dt;
      this.fx = this.fx.filter((f) => f.t < 0.8);
      if (Inp.pressed('pause')) {
        Inp.consume('pause');
        G.Game.pause(this, true);
        return;
      }
      if (this.phase === 'intro') {
        if (this.t > 2.4 || (this.t > 0.6 && Inp.pressed('confirm'))) this.startRound();
        return;
      }
      if (this.phase === 'end') {
        this.endT += dt;
        if (this.endT > 1.2) this.updateEnd();
        return;
      }
      if (this.phase !== 'round') return;
      const nowT = this.now() - (G.Save.settings.rhythmOffset || 0) / 1000;
      const beat = (nowT - this.t0) / this.beat;
      this.curBeat = beat;
      // o verso do adversário empurra a torcida
      if (!this.oppDone && beat >= 11) {
        this.oppDone = true;
        const push = (6 + this.round * 2) * (this.cfg.tutorial ? 0.4 : 1);
        this.meter -= push;
        Au.sfx('cheer', { dur: 1.2, vol: 0.6 });
      }
      // entradas
      for (let i = 0; i < 4; i++) if (Inp.pressed(LANES[i])) this.press(i);
      // perdidas
      const W = this.judgeWindow();
      const pen = G.diff().pelejaPenalty * (this.cfg.tutorial ? 0.5 : 1);
      for (const n of this.notes) {
        if (n.judged) {
          n.jt += dt;
          continue;
        }
        if (nowT > this.beatT(n.b) + W.good) {
          n.judged = true;
          n.jt = 0;
          if (n.correct) {
            n.res = 'miss';
            this.meter -= 5 * pen;
            this.combo = 0;
            this.stats.miss++;
            Au.sfx('miss');
            this.pop(n.lane, 'PERDEU O FIO!', '#6a5a4a');
          } else {
            n.res = 'skip';
            this.meter += 1;
          }
        }
      }
      const respStart = 16 + this.playBeats + 1;
      if (!this.respDone && beat >= respStart - 0.5) {
        this.respDone = true;
        const acc = this.roundTotal ? this.roundHits / this.roundTotal : 1;
        const bonus = Math.round(acc * 14 - this.roundWrong * 1.5);
        this.meter += bonus;
        this.respAcc = acc;
        this.sing(this.R.resp, respStart, 'fife', 0.06, 1);
        Au.sfx(acc > 0.5 ? 'cheer' : 'boo', { dur: 1.8, vol: 1 });
        if (acc > 0.5) this.cheer = 1;
      }
      this.meter = U.clamp(this.meter, -100, 100);
      if (beat >= respStart + 12 + 1) {
        this.round++;
        if (this.round >= this.cfg.rounds.length) this.finish();
        else this.startRound();
      }
    }
    finish() {
      this.phase = 'end';
      this.endT = 0;
      this.won = this.meter > 0 || this.cfg.tutorial;
      Au.stop(0.3);
      if (this.won) {
        Au.jingle('victory', null);
        Au.sfx('cheer', { dur: 2.5, vol: 1.2 });
      } else {
        Au.jingle('defeat', null);
        Au.sfx('boo');
      }
      this.sel = 0;
    }
    updateEnd() {
      if (this.won) {
        if (Inp.pressed('confirm') || Inp.pressed('interact') || Inp.mouse.clicked) {
          Au.sfx('menuSelect');
          G.Game.endPeleja(this, true);
        }
        return;
      }
      const opts = this.endOpts();
      if (Inp.repeat('up') || Inp.repeat('down')) {
        this.sel = (this.sel + 1) % opts.length;
        Au.sfx('menuMove');
      }
      if (this.endRects) {
        this.endRects.forEach((r, i) => {
          if (U.inRect(Inp.mouse.x, Inp.mouse.y, r)) {
            if (Inp.mouse.moved) this.sel = i;
            if (Inp.mouse.clicked) {
              this.sel = i;
              this.chooseEnd(opts[i]);
            }
          }
        });
      }
      if (Inp.pressed('confirm')) this.chooseEnd(opts[this.sel]);
    }
    endOpts() {
      return ['Pelejar de novo', 'Voltar ao menu principal'];
    }
    chooseEnd(o) {
      Au.sfx('menuSelect');
      if (o === 'Pelejar de novo') {
        const n = new PelejaScene(this.id, this.onWin, this.onQuit);
        G.SM.replace(n, 'ink');
      } else {
        G.Game.toMenu();
      }
    }

    // --------------------------------------------------------------
    draw(ctx) {
      const st = this.stage;
      const dark = !!st.dark;
      Art.fillPaper(ctx, 0, 0, G.W, G.H, st.paper, 0, 0);
      ctx.save();
      if (this.shake > 0 && G.Save.settings.shake) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6);
      // céu e astro
      ctx.fillStyle = st.sky;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(0, 0, G.W, 330);
      ctx.globalAlpha = 1;
      const pulse = this.curBeat != null ? 1 + Math.max(0, 1 - (this.curBeat % 1) * 4) * 0.04 : 1;
      if (this.cfg.final) {
        // o buraco do sol
        ctx.fillStyle = '#fbf8ef';
        Art.blob(ctx, G.W / 2, 120, 70 * pulse, 70 * pulse, 9, 0.12, 5);
        ctx.fill();
        ctx.strokeStyle = C.paperDark;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (st.moon) {
        SP_moon(ctx, G.W / 2, 118, 56 * pulse, dark);
      } else {
        Art.sun(ctx, G.W / 2, 118, 52 * pulse, this.t * 0.2, { face: true });
      }
      // bandeirinhas
      Art.bunting(ctx, 0, 36, G.W, 36, 22, this.t, 30);
      // plateia
      this.drawCrowd(ctx, dark);
      // retratos
      const zabTalk = this.phase === 'round' && this.curBeat >= 16 + this.playBeats + 1 && this.curBeat < 16 + this.playBeats + 13;
      const oppTalk = this.phase === 'round' && this.curBeat >= 0 && this.curBeat < 12;
      const oppExpr = this.phase === 'end' ? (this.won ? 'triste' : 'rindo') : this.meter > 20 ? 'assustado' : this.meter < -20 ? 'rindo' : 'determinado';
      const zabExpr = this.phase === 'end' ? (this.won ? 'feliz' : 'triste') : this.meter > 20 ? 'feliz' : this.meter < -20 ? 'assustado' : 'determinado';
      const bob = (k) => (this.curBeat != null ? Math.abs(Math.sin(this.curBeat * Math.PI)) * k : 0);
      Art.panel(ctx, 14, 196 - bob(4), 188, 188, { fill: C.ink });
      G.Portraits.draw(ctx, 'zab', zabExpr, 18, 200 - bob(4), 180, { talk: zabTalk });
      Art.panel(ctx, G.W - 202, 196 - bob(4), 188, 188, { fill: C.ink });
      G.Portraits.draw(ctx, this.cfg.opp, oppExpr, G.W - 198, 200 - bob(4), 180, { talk: oppTalk, flip: this.cfg.opp !== 'tra' });
      this.nameTag(ctx, 'ZABELÊ', 108, 394);
      this.nameTag(ctx, G.Story.speakers[this.cfg.opp].name.toUpperCase(), G.W - 108, 394);
      // medidor de aplauso (cabo de guerra)
      this.drawMeter(ctx);
      // pistas
      if (this.phase === 'round' || this.phase === 'end') this.drawLanes(ctx);
      // versos
      if (this.phase === 'round') this.drawVerse(ctx);
      if (this.phase === 'intro') this.drawIntro(ctx);
      if (this.phase === 'end') this.drawEnd(ctx);
      ctx.restore();
      Art.vignette(ctx, 0.9);
      Art.pageFrame(ctx, dark ? C.paperDark : C.ink, 4);
    }
    nameTag(ctx, text, x, y) {
      ctx.save();
      ctx.font = G.font(14, 'title');
      const w = Math.min(190, ctx.measureText(text).width + 20);
      ctx.fillStyle = C.red;
      ctx.fillRect(x - w / 2, y - 12, w, 24);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - w / 2, y - 12, w, 24);
      ctx.fillStyle = C.paperLight;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + 1, 180);
      ctx.restore();
    }
    drawCrowd(ctx, dark) {
      ctx.save();
      const t = this.t;
      const ink = dark ? '#0a0806' : C.ink;
      for (const c of this.crowd) {
        const jump = this.cheer > 0.3 ? Math.abs(Math.sin(t * 9 + c.ph)) * 10 * this.cheer : Math.sin(t * 2 + c.ph) * 1.5;
        const y = G.H - 18 - c.row * 22 - jump;
        const x = c.x;
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.ellipse(x, y, 20 * c.s, 26 * c.s, 0, Math.PI, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y - 30 * c.s, 11 * c.s, 0, U.TAU);
        ctx.fill();
        if (c.hat === 0) {
          ctx.beginPath();
          ctx.ellipse(x, y - 38 * c.s, 20 * c.s, 5 * c.s, 0, 0, U.TAU);
          ctx.fill();
        } else if (c.hat === 1) {
          ctx.beginPath();
          ctx.arc(x, y - 36 * c.s, 16 * c.s, Math.PI * 1.1, Math.PI * 1.9);
          ctx.lineTo(x, y - 34 * c.s);
          ctx.fill();
        }
        if (this.cheer > 0.5 && (c.ph * 10) % 3 < 1) {
          ctx.strokeStyle = ink;
          ctx.lineWidth = 5 * c.s;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x + 12 * c.s, y - 12 * c.s);
          ctx.lineTo(x + 20 * c.s, y - 44 * c.s - jump * 0.3);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    drawMeter(ctx) {
      const x0 = 230, x1 = G.W - 230, y = 30;
      const k = (this.shownMeter + 100) / 200;
      ctx.save();
      // corda
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const x = U.lerp(x0, x1, i / 40);
        const yy = y + Math.sin(i * 0.9 + this.t * 3) * 1.2;
        if (i === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      // meio
      ctx.fillStyle = C.ink;
      ctx.fillRect(G.W / 2 - 1.5, y - 14, 3, 28);
      // nó (posição da torcida) — perto de Zabelê é bom
      const kx = U.lerp(x1, x0, k);
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(kx, y, 12, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = C.paperLight;
      ctx.font = G.font(11, 'title');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♥', kx, y + 1);
      // bandeiras
      ctx.font = G.font(12, 'title');
      ctx.fillStyle = C.ink;
      ctx.fillText('ZABELÊ', x0 - 38, y);
      ctx.fillText('ADVERSÁRIO', x1 + 50, y);
      ctx.font = G.font(13, 'body', 'italic');
      ctx.fillText('aplauso do povo', G.W / 2, y + 24);
      ctx.restore();
    }
    drawLanes(ctx) {
      const tNow = this.now() - (G.Save.settings.rhythmOffset || 0) / 1000;
      const travel = Math.max(1.0, this.beat * (this.R && this.R.bpm < 110 ? 2.4 : 2.1));
      ctx.save();
      // fundo das pistas
      ctx.fillStyle = 'rgba(248,240,220,0.93)';
      ctx.fillRect(LX0, SPAWN_Y - 20, LANE_W * 4, HIT_Y - SPAWN_Y + 60);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(LX0, SPAWN_Y - 20, LANE_W * 4, HIT_Y - SPAWN_Y + 60);
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.setLineDash([4, 6]);
        ctx.moveTo(LX0 + i * LANE_W, SPAWN_Y - 20);
        ctx.lineTo(LX0 + i * LANE_W, HIT_Y + 40);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      // linhas de compasso
      if (this.curBeat != null) {
        ctx.strokeStyle = 'rgba(29,23,18,0.15)';
        ctx.lineWidth = 1;
        const bb = Math.floor(this.curBeat);
        for (let b = bb; b < bb + 4; b++) {
          const dtb = this.beatT(b) - tNow;
          const y = HIT_Y - (dtb / travel) * (HIT_Y - SPAWN_Y);
          if (y < SPAWN_Y - 20 || y > HIT_Y + 40) continue;
          ctx.beginPath();
          ctx.moveTo(LX0, y);
          ctx.lineTo(LX0 + LANE_W * 4, y);
          ctx.stroke();
        }
      }
      // linha de acerto
      ctx.fillStyle = C.ink;
      ctx.fillRect(LX0 - 6, HIT_Y - 2, LANE_W * 4 + 12, 4);
      for (let i = 0; i < 4; i++) {
        const cx = LX0 + i * LANE_W + LANE_W / 2;
        const p = this.pressFx[i];
        ctx.fillStyle = p > 0 ? 'rgba(194,58,34,' + (0.2 + p * 0.5) + ')' : 'rgba(248,240,220,0.9)';
        Art.rrect(ctx, cx - 52, HIT_Y - 22, 104, 44, 8);
        ctx.fill();
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = C.ink;
        ctx.font = G.font(22, 'title');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.35;
        ctx.fillText(ARROWS[i], cx, HIT_Y + 1);
        ctx.globalAlpha = 1;
        const kl = Inp.lastDevice === 'pad' ? ARROWS[i] : ['A', 'S', 'W', 'D'][i];
        ctx.font = G.font(11, 'title');
        ctx.fillText(ARROWS[i] + ' / ' + kl, cx, HIT_Y + 34);
      }
      // notas
      for (const n of this.notes) {
        const ht = this.beatT(n.b);
        const dtn = ht - tNow;
        if (dtn > travel || (n.judged && n.jt > 0.4)) continue;
        let y = HIT_Y - (dtn / travel) * (HIT_Y - SPAWN_Y);
        const cx = LX0 + n.lane * LANE_W + LANE_W / 2;
        ctx.save();
        let a = 1, s = 1;
        if (n.judged) {
          a = 1 - n.jt / 0.4;
          if (n.res === 'perfect' || n.res === 'good') {
            s = 1 + n.jt * 1.2;
            y = HIT_Y - n.jt * 60;
          } else if (n.res === 'wrong') {
            y = HIT_Y + n.jt * 40;
          }
        }
        if (y < SPAWN_Y - 10) a *= Math.max(0, 1 - (SPAWN_Y - 10 - y) / 20);
        ctx.globalAlpha = Math.max(0, a);
        ctx.translate(cx, y);
        ctx.scale(s, s);
        const w = 112, h = 38;
        const cover = ['#e6c14f', '#e39a9a', '#8fb3d9', '#f0e3c0'][(n.word.length + n.lane) % 4];
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
        ctx.fillStyle = n.res === 'wrong' ? '#9a8a78' : cover;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 2;
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        ctx.fillStyle = C.ink;
        ctx.fillRect(-w / 2, -h / 2, 6, h);
        ctx.font = G.font(n.word.length > 9 ? 15 : 18, 'body');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = C.ink;
        ctx.fillText(n.word, 3, 1, w - 14);
        if (n.res === 'wrong' || n.res === 'miss') {
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-w / 2 + 8, -h / 2 + 6);
          ctx.lineTo(w / 2 - 8, h / 2 - 6);
          ctx.stroke();
        }
        ctx.restore();
      }
      // julgamentos
      for (const f of this.fx) {
        ctx.save();
        ctx.globalAlpha = 1 - f.t / 0.8;
        ctx.translate(f.x, f.y - f.t * 40);
        const s = f.t < 0.1 ? 0.6 + f.t * 5 : 1.1;
        ctx.scale(s, s);
        ctx.font = G.font(17, 'title');
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = C.paperLight;
        ctx.strokeText(f.text, 0, 0);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, 0, 0);
        ctx.restore();
      }
      if (this.combo >= 3) {
        ctx.save();
        ctx.font = G.font(20, 'title');
        ctx.textAlign = 'right';
        ctx.fillStyle = C.red;
        ctx.fillText('x' + this.combo, LX0 + LANE_W * 4 - 6, SPAWN_Y - 30);
        ctx.restore();
      }
      ctx.restore();
    }
    drawVerse(ctx) {
      const b = this.curBeat != null ? this.curBeat : -1;
      const R = this.R;
      const respStart = 16 + this.playBeats + 1;
      let lines = null, who = null, startB = 0;
      if (b < 12) {
        lines = R.opp;
        who = 'opp';
        startB = 0;
      } else if (b >= respStart - 0.5) {
        lines = R.resp;
        who = 'zab';
        startB = respStart;
      }
      // alvo da rima
      if (b >= 12 && b < 16 + this.playBeats + 0.5) {
        ctx.save();
        const y = 96;
        ctx.fillStyle = 'rgba(29,23,18,0.88)';
        ctx.fillRect(G.W / 2 - 170, y - 34, 340, 68);
        ctx.fillStyle = C.paperLight;
        ctx.font = G.font(15, 'title');
        ctx.textAlign = 'center';
        ctx.fillText('RIMA COM', G.W / 2, y - 12);
        Art.drawWood(ctx, '–' + R.sound, G.W / 2, y + 16, 34, C.red, { red: C.paperDark });
        ctx.restore();
        if (b < 16) {
          const k = 16 - b;
          ctx.save();
          ctx.font = G.font(40, 'title');
          ctx.textAlign = 'center';
          ctx.fillStyle = C.ink;
          ctx.globalAlpha = 1 - (b % 1) * 0.6;
          const txt = b < 13 ? 'SUA VEZ!' : String(Math.ceil(k - 0.001));
          ctx.fillText(txt, G.W / 2, 310);
          ctx.font = G.font(17, 'body', 'italic');
          ctx.globalAlpha = 1;
          ctx.fillText('Acerte só as palavras que rimam. Deixe passar as outras!', G.W / 2, 346);
          ctx.restore();
        }
      }
      if (!lines) return;
      const x = G.W / 2, y0 = 84;
      ctx.save();
      const boxH = 6 * 27 + 26;
      if (b >= respStart - 0.5 || b < 12) {
        ctx.fillStyle = who === 'zab' ? 'rgba(248,240,220,0.94)' : 'rgba(29,23,18,0.9)';
        ctx.fillRect(x - 250, y0 - 30, 500, boxH);
        ctx.strokeStyle = who === 'zab' ? C.red : C.paperDark;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 250, y0 - 30, 500, boxH);
      }
      ctx.font = G.font(21, 'body', 'italic');
      ctx.textAlign = 'center';
      for (let i = 0; i < lines.length; i++) {
        const lb = startB + i * 2;
        if (b < lb - 0.2) continue;
        const k = U.clamp((b - lb + 0.2) / 0.5, 0, 1);
        ctx.globalAlpha = k;
        const line = lines[i];
        const words = line.split(' ');
        const last = words.pop();
        const head = words.join(' ') + ' ';
        const fullW = ctx.measureText(line).width;
        const hw = ctx.measureText(head).width;
        const lx = x - fullW / 2;
        const yy = y0 + i * 27;
        ctx.textAlign = 'left';
        ctx.fillStyle = who === 'zab' ? C.ink : C.paperLight;
        ctx.fillText(head, lx, yy);
        ctx.fillStyle = i % 2 === 1 ? C.red : who === 'zab' ? C.ink : C.paperLight;
        ctx.fillText(last, lx + hw, yy);
      }
      ctx.restore();
      if (who === 'zab' && this.respAcc != null && b > respStart + 11) {
        const txt = this.respAcc > 0.8 ? 'O povo foi ao delírio!' : this.respAcc > 0.5 ? 'O povo aplaudiu!' : 'O povo ficou em dúvida...';
        Art.text(ctx, txt, G.W / 2, 290, { size: 22, align: 'center', font: 'title', color: C.red, outline: C.paperLight });
      }
    }
    drawIntro(ctx) {
      const k = U.ease.outBack(Math.min(1, this.t / 0.5));
      ctx.save();
      ctx.translate(G.W / 2, 230);
      ctx.scale(k, k);
      ctx.fillStyle = 'rgba(29,23,18,0.9)';
      ctx.fillRect(-260, -80, 520, 190);
      Art.drawWood(ctx, 'PELEJA!', 0, -20, 64, C.paperLight, { red: C.red });
      ctx.fillStyle = C.paperLight;
      ctx.font = G.font(20, 'body', 'italic');
      ctx.textAlign = 'center';
      ctx.fillText(this.cfg.title, 0, 34);
      ctx.font = G.font(15, 'body');
      ctx.fillText(this.cfg.rounds.length + ' rodadas · aperte ← ↓ ↑ → no tempo da viola', 0, 64);
      ctx.fillText('só nas palavras que RIMAM', 0, 86);
      ctx.restore();
    }
    drawEnd(ctx) {
      const k = U.ease.outBack(Math.min(1, this.endT / 0.5));
      ctx.save();
      ctx.fillStyle = 'rgba(15,10,6,' + Math.min(0.6, this.endT) + ')';
      ctx.fillRect(0, 0, G.W, G.H);
      ctx.translate(G.W / 2, G.H / 2 - 10);
      ctx.scale(k, k);
      Art.panel(ctx, -280, -150, 560, 300, { fill: C.paper, teeth: true });
      Art.drawWood(ctx, this.won ? 'PELEJA VENCIDA!' : 'PERDEU A PELEJA...', 0, -86, this.won ? 44 : 38, this.won ? C.red : C.ink, { red: C.ink });
      ctx.font = G.font(18, 'body');
      ctx.fillStyle = C.ink;
      ctx.textAlign = 'center';
      const s = this.stats;
      ctx.fillText('Na batida: ' + s.perfect + '   ·   Boas: ' + s.good + '   ·   Rimas pobres: ' + s.wrong + '   ·   Perdidas: ' + s.miss, 0, -26);
      ctx.fillText('Maior sequência: ' + this.best, 0, 4);
      if (this.won) {
        ctx.font = G.font(20, 'body', 'italic');
        ctx.fillText(this.cfg.tutorial ? '"Tu tem o dom, menina."' : 'A tinta da Traça escorre, derrotada pela rima.', 0, 50);
        if (this.endT > 1.2) {
          ctx.globalAlpha = 0.6 + Math.sin(this.t * 5) * 0.4;
          ctx.font = G.font(16, 'title');
          ctx.fillText('[ ' + Inp.keyLabel('confirm') + ' ] continuar', 0, 110);
        }
      } else {
        ctx.font = G.font(18, 'body', 'italic');
        ctx.fillText('O povo aplaudiu o adversário. Mas peleja boa tem revanche!', 0, 42);
        const opts = this.endOpts();
        this.endRects = [];
        opts.forEach((o, i) => {
          const yy = 84 + i * 34;
          const sel = i === this.sel;
          ctx.font = G.font(20, 'title');
          ctx.fillStyle = sel ? C.red : C.ink;
          ctx.fillText(o, 0, yy);
          if (sel) Art.hand(ctx, -150, yy - 7, 1, C.red);
          this.endRects.push({ x: G.W / 2 - 160, y: G.H / 2 - 10 + yy - 22, w: 320, h: 30 });
        });
      }
      ctx.restore();
    }
  }

  function SP_moon(ctx, x, y, r, dark) {
    ctx.save();
    ctx.fillStyle = dark ? '#efe6d0' : '#f8f0dc';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(29,23,18,0.15)';
    for (const [dx, dy, rr] of [[-14, -10, 10], [16, 8, 14], [-6, 22, 7]]) {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, rr, 0, U.TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  G.PelejaScene = PelejaScene;
})();
