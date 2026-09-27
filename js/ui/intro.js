/* PELEJA — rolo de quadros narrados (abertura) */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Art = G.Art;
  const Inp = G.Input;
  const Au = G.Audio;
  const C = G.C;
  const P = G.Panels;

  // ------------------------------------------------------------------
  // Base: sequência de quadros com versos de cordel
  // ------------------------------------------------------------------
  class Reel {
    constructor(panels) {
      this.panels = panels;
      this.i = 0;
      this.t = 0;
      this.opaque = true;
      this.hold = 0;
      this.flip = null;
      this.done = false;
    }
    enter() {
      Inp.touch.layout = 'menu';
    }
    get cur() {
      return this.panels[this.i];
    }
    next() {
      if (this.i >= this.panels.length - 1) {
        if (!this.done) {
          this.done = true;
          this.finish();
        }
        return;
      }
      // guarda o quadro atual para virar a página
      const cv = G.canvas;
      if (!this.snap) this.snap = document.createElement('canvas');
      this.snap.width = cv.width;
      this.snap.height = cv.height;
      this.snap.getContext('2d').drawImage(cv, 0, 0);
      this.flip = 0;
      this.i++;
      this.t = 0;
      Au.sfx('page');
    }
    finish() {}
    update(dt) {
      this.t += dt;
      if (this.flip != null) {
        this.flip += dt / 0.9;
        if (this.flip >= 1) this.flip = null;
      }
      const p = this.cur;
      if (p.onUpdate) p.onUpdate(this.t, this);
      // segurar para pular tudo
      if (Inp.down('skip') || Inp.down('cancel')) {
        this.hold += dt;
        if (this.hold > 1.1 && !this.done) {
          this.done = true;
          this.skipAll();
        }
      } else this.hold = 0;
      const lines = p.verse ? p.verse.length : 0;
      const textEnd = (p.textStart || 1) + lines * (p.lineT || 1.05);
      if (this.t > p.dur) this.next();
      else if (Inp.pressed('confirm') || Inp.mouse.clicked) {
        if (this.t < textEnd) this.t = textEnd;
        else this.next();
      }
    }
    skipAll() {
      this.finish();
    }
    draw(ctx) {
      const p = this.cur;
      p.draw(ctx, this.t, p.dur, p);
      this.drawVerse(ctx, p);
      if (this.flip != null && this.snap) {
        const e = U.ease.inOut(this.flip);
        const W = G.W, H = G.H;
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
          ctx.drawImage(this.snap, 0, 0, W, H);
          ctx.restore();
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
        }
      }
      if (this.hold > 0.05) {
        ctx.save();
        ctx.strokeStyle = C.paperLight;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(G.W - 40, 40, 16, -Math.PI / 2, -Math.PI / 2 + U.TAU * Math.min(1, this.hold / 1.1));
        ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      ctx.font = G.font(13, 'body', 'italic');
      ctx.fillStyle = 'rgba(248,240,220,0.7)';
      ctx.textAlign = 'right';
      ctx.fillText('segure ' + Inp.keyLabel('cancel') + ' para pular', G.W - 66, 45);
      ctx.restore();
    }
    drawVerse(ctx, p) {
      if (!p.verse) return;
      const t0 = p.textStart || 1;
      const lt = p.lineT || 1.05;
      if (this.t < t0 - 0.3) return;
      const x = p.verseX || G.W / 2;
      const h = p.verse.length * 28 + 34;
      const y = p.verseY || G.H - h - 26;
      const k = Math.min(1, (this.t - t0 + 0.3) / 0.4, (p.dur - this.t) / 0.4);
      ctx.save();
      ctx.globalAlpha = Math.max(0, k);
      const w = p.verseW || 480;
      ctx.fillStyle = p.dark ? 'rgba(15,10,6,0.78)' : 'rgba(248,240,220,0.9)';
      ctx.fillRect(x - w / 2, y, w, h);
      ctx.strokeStyle = p.dark ? C.paperDark : C.ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - w / 2, y, w, h);
      ctx.font = G.font(21, 'body', 'italic');
      ctx.textAlign = 'center';
      p.verse.forEach((l, i) => {
        const kk = U.clamp((this.t - t0 - i * lt) / 0.5, 0, 1);
        ctx.globalAlpha = Math.max(0, k) * kk;
        const last = i % 2 === 1;
        ctx.fillStyle = last ? C.red : p.dark ? C.paperLight : C.ink;
        ctx.fillText(l, x, y + 30 + i * 28 - (1 - kk) * 6);
      });
      ctx.restore();
    }
  }
  G.Reel = Reel;

  // ------------------------------------------------------------------
  // Quadros da abertura
  // ------------------------------------------------------------------
  function capa(ctx, t, dur) {
    const z = 1 + U.ease.inOut(Math.min(1, t / dur)) * 0.55;
    Art.fillPaper(ctx, 0, 0, G.W, G.H, '#e9cf8c');
    ctx.save();
    ctx.translate(G.W / 2, 120);
    ctx.scale(z, z);
    ctx.translate(-G.W / 2, -120);
    // cordão
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-40, 90);
    ctx.quadraticCurveTo(G.W / 2, 150, G.W + 40, 90);
    ctx.stroke();
    const covers = ['#8fb3d9', '#e39a9a', '#c23a22', '#e6c14f', '#b8d49a'];
    for (let i = 0; i < 5; i++) {
      const x = 110 + i * 185;
      const y = 104 + Math.sin((x / G.W) * Math.PI) * 40;
      const main = i === 2;
      const w = main ? 190 : 120, h = main ? 260 : 170;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * 1.4 + i) * 0.04);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-w / 2 + 7, 12, w, h);
      ctx.fillStyle = covers[i];
      ctx.fillRect(-w / 2, 6, w, h);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-w / 2, 6, w, h);
      ctx.lineWidth = 1;
      ctx.strokeRect(-w / 2 + 6, 12, w - 12, h - 12);
      if (main) {
        // capa do folheto: Zabelê diante da Traça
        ctx.fillStyle = '#f1dc9c';
        ctx.fillRect(-w / 2 + 14, 70, w - 28, 140);
        ctx.save();
        ctx.beginPath();
        ctx.rect(-w / 2 + 14, 70, w - 28, 140);
        ctx.clip();
        G.Creatures.traca(ctx, { x: 30, y: 170, t, alt: 30, scale: 0.42, pose: 'fly' });
        G.Sprites.humanoid(ctx, 'zabele', { x: -40, y: 206, dir: 'right', t, scale: 1.6 });
        ctx.restore();
        ctx.strokeStyle = C.ink;
        ctx.strokeRect(-w / 2 + 14, 70, w - 28, 140);
        ctx.fillStyle = C.paperLight;
        ctx.font = G.font(12, 'title');
        ctx.textAlign = 'center';
        ctx.fillText('A PELEJA DE ZABELÊ', 0, 34);
        ctx.font = G.font(9, 'title');
        ctx.fillText('COM A TRAÇA QUE COMEU O SOL', 0, 52);
        ctx.font = G.font(9, 'body', 'italic');
        ctx.fillText('Mestre Firmino Pena-Branca', 0, 236);
        ctx.fillText('Vila Rima · 16 páginas', 0, 250);
      } else {
        ctx.fillStyle = C.ink;
        ctx.fillRect(-w / 2 + 14, 50, w - 28, 80);
        ctx.fillRect(-w / 2 + 14, 24, w - 28, 8);
        ctx.fillRect(-w / 2 + 24, 140, w - 48, 4);
      }
      ctx.fillStyle = C.red;
      ctx.fillRect(-4, -2, 8, 14);
      ctx.restore();
    }
    ctx.restore();
    P.frame(ctx);
    P.fadeIn(ctx, t, dur, 1, 0.1);
  }

  function vila(ctx, t, dur) {
    Art.fillPaper(ctx, 0, 0, G.W, G.H, '#f1dc9c');
    const pan = t * 10;
    Art.sun(ctx, 720 - pan * 0.2, 170 - Math.min(40, t * 6), 80, t * 0.08, { face: true });
    P.carcara(ctx, 200 + t * 50, 110 + Math.sin(t) * 10, 0.8, t);
    P.hills(ctx, 330, 60, '#b99058', 1, 0.009);
    P.hills(ctx, 390, 40, '#8a6a3c', 4, 0.013);
    // Vila Rima ao longe
    ctx.save();
    ctx.translate(-pan * 0.5, 0);
    for (let i = 0; i < 9; i++) {
      const x = 80 + i * 110;
      ctx.fillStyle = C.ink;
      ctx.fillRect(x - 32, 360, 64, 50);
      ctx.beginPath();
      ctx.moveTo(x - 40, 364);
      ctx.lineTo(x, 334);
      ctx.lineTo(x + 40, 364);
      ctx.fill();
      ctx.fillStyle = '#f1dc9c';
      ctx.fillRect(x - 8, 380, 16, 30);
      if (i === 4) {
        ctx.fillStyle = C.ink;
        ctx.fillRect(x - 14, 290, 28, 50);
        ctx.beginPath();
        ctx.moveTo(x - 18, 292);
        ctx.lineTo(x, 268);
        ctx.lineTo(x + 18, 292);
        ctx.fill();
        ctx.fillRect(x - 2, 252, 4, 18);
        ctx.fillRect(x - 7, 258, 14, 4);
      }
    }
    Art.bunting(ctx, 0, 330, 1000, 330, 24, t, 30);
    ctx.restore();
    P.hills(ctx, 470, 20, C.ink, 7, 0.02);
    // Zabelê entra em cena
    const k = U.ease.outCubic(Math.min(1, t / 2.5));
    const zx = U.lerp(-80, 250, k);
    const moving = t < 2.5;
    G.Sprites.humanoid(ctx, 'zabele', { x: zx, y: 520, dir: moving ? 'right' : t < 3.6 ? 'right' : 'down', t, moving, phase: t * 10, scale: 4.2, face: t > 3.6 ? 'happy' : null, pose: t > 5 && t < 6.2 ? 'cheer' : null });
    P.frame(ctx);
  }

  function poeta(ctx, t, dur, p) {
    const lampOut = t > 6.2;
    const flick = lampOut ? 0 : 1 - Math.max(0, (t - 5) / 1.2) * (Math.sin(t * 40) * 0.5 + 0.5);
    ctx.fillStyle = '#16100b';
    ctx.fillRect(0, 0, G.W, G.H);
    // parede de papel iluminada
    ctx.save();
    const g = ctx.createRadialGradient(560, 250, 20, 560, 250, 520 * Math.max(0.1, flick));
    g.addColorStop(0, 'rgba(240,210,150,' + 0.95 * flick + ')');
    g.addColorStop(1, 'rgba(240,210,150,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, G.W, G.H);
    ctx.restore();
    // escrivaninha
    ctx.fillStyle = C.ink;
    ctx.fillRect(250, 360, 520, 30);
    ctx.fillRect(270, 390, 20, 150);
    ctx.fillRect(730, 390, 20, 150);
    // lamparina
    ctx.fillStyle = '#6b5a45';
    ctx.fillRect(640, 318, 34, 42);
    if (!lampOut) G.Art.flame(ctx, 657, 318, 0.9 * flick, t);
    // folhas e pena
    ctx.fillStyle = '#f3ead6';
    ctx.fillRect(420, 346, 110, 16);
    // o poeta de costas
    const writing = t < 3.4;
    G.Sprites.humanoid(ctx, 'firmino', { x: 470, y: 470, dir: 'up', t, scale: 3.6, pose: writing ? (Math.sin(t * 9) > 0 ? 'point' : 'idle') : t < 5 ? 'sad' : 'hands' });
    // bolinhas de papel amassado
    const nBalls = Math.min(9, Math.floor(Math.max(0, t - 3) * 3));
    for (let i = 0; i < nBalls; i++) {
      const x = 200 + (i % 5) * 26 + (i > 4 ? 12 : 0), y = 520 - (i > 4 ? 22 : 0);
      ctx.save();
      ctx.fillStyle = '#e8dcc0';
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.5;
      Art.blob(ctx, x, y, 14, 12, 6, 0.35, i + 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // no escuro, uma bolinha se mexe
    if (lampOut) {
      const k = Math.min(1, (t - 6.2) / 1.5);
      const x = 226, y = 498;
      ctx.save();
      ctx.translate(Math.sin(t * 20) * k * 2, 0);
      ctx.strokeStyle = '#efe6d0';
      ctx.lineWidth = 2;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x + s * 4, y - 8);
        ctx.quadraticCurveTo(x + s * 20, y - 20 - 30 * k, x + s * 10, y - 30 - 50 * k);
        ctx.stroke();
      }
      if (t > 7.4) {
        const open = Math.min(1, (t - 7.4) * 2);
        ctx.fillStyle = '#efe6d0';
        ctx.beginPath();
        ctx.ellipse(x, y - 2, 10, 6 * open, 0, 0, U.TAU);
        ctx.fill();
        ctx.fillStyle = C.red;
        ctx.beginPath();
        ctx.arc(x, y - 2, 3 * open, 0, U.TAU);
        ctx.fill();
        P.once(p, 'e', () => Au.sfx('heartbeat'));
      }
      ctx.restore();
    }
    P.frame(ctx);
  }

  function traca(ctx, t, dur, p) {
    Art.fillPaper(ctx, 0, 0, G.W, G.H, '#e8c27a');
    ctx.save();
    ctx.fillStyle = 'rgba(40,20,10,' + Math.min(0.45, t * 0.06) + ')';
    ctx.fillRect(0, 0, G.W, G.H);
    ctx.restore();
    Art.sun(ctx, 720, 160, 80, t * 0.08, { face: true });
    P.hills(ctx, 380, 60, '#8a6a3c', 2, 0.01);
    P.hills(ctx, 450, 30, C.ink, 5, 0.018);
    // sombra enorme passando no chão
    const k = t / dur;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(U.lerp(-200, 900, k), 470, 260, 40, 0, 0, U.TAU);
    ctx.fill();
    ctx.restore();
    const x = U.lerp(-260, 560, U.ease.outCubic(Math.min(1, t / 6)));
    G.Creatures.traca(ctx, { x, y: 300, t, alt: 60, scale: 1.4, pose: 'fly', lookX: t > 6 ? 3 : 0 });
    P.once(p, 'w', () => Au.sfx('wings', { dur: 3 }));
    if (t > 6.5) P.once(p, 'r', () => Au.sfx('roar', { p: 0.7 }));
    P.frame(ctx);
  }

  function titulo(ctx, t, dur, p) {
    ctx.fillStyle = C.night;
    ctx.fillRect(0, 0, G.W, G.H);
    if (t > 0.6) {
      P.once(p, 's', () => {
        Au.sfx('stamp');
        Au.sfx('boom', { vol: 0.5 });
      });
      const k = Math.min(1, (t - 0.6) / 0.18);
      const s = U.lerp(2.2, 1, U.ease.outCubic(k));
      ctx.save();
      if (t < 0.9) ctx.translate((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12);
      Art.inkBlot(ctx, G.W / 2, G.H / 2 - 20, 260 * Math.min(1, k * 1.2), 8, '#241a12', 14);
      ctx.translate(G.W / 2, G.H / 2 - 20);
      ctx.scale(s, s);
      G.titleLogo(ctx, 0, 0, 1, t);
      ctx.restore();
    }
    if (t > 2.2) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (t - 2.2) * 1.5);
      ctx.font = G.font(20, 'body', 'italic');
      ctx.fillStyle = C.paperLight;
      ctx.textAlign = 'center';
      ctx.fillText('um folheto em cinco capítulos', G.W / 2, G.H - 90);
      ctx.restore();
    }
    P.fadeIn(ctx, t, dur, 0.01, 0.8);
  }

  class IntroScene extends Reel {
    constructor() {
      super([
        { draw: capa, dur: 9, textStart: 1.2, verseY: 336, verseW: 440, verse: ['Peço licença, leitor,', 'pra contar o que se deu', 'num sertão feito de folha', 'que um poeta escreveu,', 'onde o sol era carimbo', 'e a chuva nunca choveu.'] },
        { draw: vila, dur: 9.5, textStart: 1.2, verseY: 30, verse: ['Em Vila Rima morava,', 'no meio da cantoria,', 'Zabelê, moça ligeira,', 'que folheto vendia:', 'sabia de cor e salteado', 'cada verso que existia.'] },
        { draw: poeta, dur: 9.5, textStart: 0.8, dark: true, verseY: 30, verse: ['Mas o velho que escrevia', 'este mundo de papel', 'um dia largou a pena,', 'perdeu o gosto do mel,', 'e dos rascunhos amassados', 'nasceu um bicho cruel...'] },
        { draw: traca, dur: 9.5, textStart: 1, verseY: 30, verse: ['Uma traça de asa larga,', 'faminta de claridão,', 'que come verso e come rima,', 'come a feira, come o chão...', 'e um dia, de sobremesa,', 'quis comer o sol do sertão.'] },
        { draw: titulo, dur: 4.6 },
      ]);
    }
    enter() {
      super.enter();
      Au.play('menu', { restart: true, fadeIn: 1 });
      G.setTheme('vila');
    }
    finish() {
      Au.stop(1);
      G.Game.startFromIntro();
    }
  }
  G.IntroScene = IntroScene;
})();
