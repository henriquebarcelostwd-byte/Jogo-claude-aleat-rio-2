/* PELEJA — quadros ilustrados de tela cheia (cenas marcantes) */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Art = G.Art;
  const C = G.C;
  const P = (G.Panels = {});

  function once(o, key, fn) {
    if (!o['_' + key]) {
      o['_' + key] = true;
      fn();
    }
  }
  function sfx(n, opt) {
    G.Audio.sfx(n, opt || {});
  }
  P.once = once;

  // ------------------------------------------------------------------
  // Peças reutilizáveis
  // ------------------------------------------------------------------
  P.frame = function (ctx, k = 1) {
    ctx.save();
    ctx.globalAlpha = k;
    Art.pageFrame(ctx, C.ink, 8);
    ctx.restore();
  };
  P.fadeIn = function (ctx, t, dur, a = 0.6, b = 0.6) {
    const k = Math.min(1, t / a, Math.max(0, (dur - t) / b));
    if (k < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = C.night;
      ctx.fillRect(0, 0, G.W, G.H);
      ctx.restore();
    }
  };
  P.hills = function (ctx, y, amp, color, seed = 1, freq = 0.01) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, G.H);
    for (let x = 0; x <= G.W + 20; x += 20) ctx.lineTo(x, y - Math.abs(Math.sin(x * freq + seed)) * amp - Math.sin(x * freq * 3.1 + seed * 2) * amp * 0.2);
    ctx.lineTo(G.W, G.H);
    ctx.closePath();
    ctx.fill();
  };
  P.crowd = function (ctx, y, t, n = 18, color = C.ink, lookUp = true) {
    ctx.save();
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * (G.W / n) + Math.sin(i * 7) * 16;
      const s = 0.9 + U.hash(i, 3) * 0.5;
      const bob = Math.sin(t * 2 + i) * 2;
      ctx.beginPath();
      ctx.ellipse(x, y + bob, 30 * s, 40 * s, 0, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + (lookUp ? 2 : 0), y - 46 * s + bob, 17 * s, 0, U.TAU);
      ctx.fill();
      const hat = Math.floor(U.hash(i, 9) * 3);
      if (hat === 0) {
        ctx.beginPath();
        ctx.ellipse(x, y - 58 * s + bob, 30 * s, 7 * s, lookUp ? -0.2 : 0, 0, U.TAU);
        ctx.fill();
      } else if (hat === 1) {
        ctx.beginPath();
        ctx.arc(x, y - 52 * s + bob, 24 * s, Math.PI * 1.1, Math.PI * 1.9);
        ctx.lineTo(x, y - 50 * s + bob);
        ctx.fill();
      }
    }
    ctx.restore();
  };
  P.carcara = function (ctx, x, y, s, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const f = Math.sin(t * 6) * 0.4;
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-20, -18 - f * 20, -44, -6 - f * 26);
    ctx.quadraticCurveTo(-22, -4, 0, 4);
    ctx.quadraticCurveTo(22, -4, 44, -6 - f * 26);
    ctx.quadraticCurveTo(20, -18 - f * 20, 0, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 2, 6, 10, 0, 0, U.TAU);
    ctx.fill();
    ctx.restore();
  };

  // o sol com asas de traça (final verdadeiro)
  P.drawMothSun = function (ctx, x, y, r, t, k = 1) {
    ctx.save();
    ctx.translate(x, y);
    // raios comuns
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * U.TAU + t * 0.05;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = i % 2 ? C.red : C.ink;
      ctx.beginPath();
      ctx.moveTo(r * 1.05, -r * 0.12);
      ctx.lineTo(r * (1.55 + (i % 2) * 0.2), 0);
      ctx.lineTo(r * 1.05, r * 0.12);
      ctx.fill();
      ctx.restore();
    }
    // quatro asas-raio
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 4 + (i * Math.PI) / 2 + Math.sin(t * 1.6 + i) * 0.05;
      ctx.save();
      ctx.rotate(a);
      const L = r * (2.3 + 0.1 * Math.sin(t * 2 + i)) * k;
      ctx.fillStyle = '#f7eedb';
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = Math.max(2, r * 0.04);
      ctx.beginPath();
      ctx.moveTo(r * 0.8, 0);
      ctx.bezierCurveTo(r * 1.2, -r * 0.9, L * 0.8, -r * 0.8, L, -r * 0.1);
      ctx.bezierCurveTo(L * 0.9, r * 0.5, r * 1.4, r * 0.7, r * 0.8, 0);
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(29,23,18,0.35)';
      ctx.lineWidth = 1.2;
      for (let yy = -r; yy < r; yy += r * 0.12) {
        ctx.beginPath();
        ctx.moveTo(r, yy);
        ctx.lineTo(L, yy);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(L * 0.7, -r * 0.15, r * 0.16, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.stroke();
      ctx.restore();
    }
    // disco
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, U.TAU);
    ctx.fillStyle = C.red;
    ctx.fill();
    ctx.lineWidth = Math.max(3, r * 0.07);
    ctx.strokeStyle = C.ink;
    ctx.stroke();
    ctx.strokeStyle = '#f7eedb';
    ctx.lineWidth = Math.max(1, r * 0.03);
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (1 - i * 0.2), t * 0.3 + i, t * 0.3 + i + 4);
      ctx.stroke();
    }
    // o rosto da traça, em paz
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = Math.max(2, r * 0.05);
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(s * r * 0.34, -r * 0.08, r * 0.14, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, r * 0.25, r * 0.28, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
    // antenas de pena
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(s * r * 0.35, -r * 0.85);
      ctx.rotate(s * 0.4);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = Math.max(2, r * 0.03);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s * r * 0.2, -r * 0.5, s * r * 0.05, -r * 0.95);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  };

  // figuras em "tinta vermelha" (lembranças)
  function redFigure(ctx, id, st) {
    const old = G.Pal.ink;
    G.Pal.ink = '#b8321c';
    st._flash = '#f7dcd2';
    G.Sprites.draw(ctx, id, st);
    G.Pal.ink = old;
  }
  P.redFigure = redFigure;

  function memoryBase(ctx, t) {
    Art.fillPaper(ctx, 0, 0, G.W, G.H, '#f3d9cc');
    ctx.save();
    ctx.strokeStyle = 'rgba(184,50,28,0.25)';
    ctx.lineWidth = 1;
    Art.hatch(ctx, 0, 0, G.W, G.H, 9, -0.9, 1, 'rgba(184,50,28,0.12)');
    ctx.restore();
    void t;
  }
  function memoryFrame(ctx, title) {
    ctx.save();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 4;
    ctx.strokeRect(14, 14, G.W - 28, G.H - 28);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(22, 22, G.W - 44, G.H - 44);
    ctx.fillStyle = C.red;
    ctx.font = G.font(16, 'title');
    ctx.textAlign = 'center';
    ctx.fillText('— ' + title + ' —', G.W / 2, 50);
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // O SOL É COMIDO (prólogo)
  // ------------------------------------------------------------------
  P.solComido = function (ctx, t, dur, o) {
    const dark = U.clamp((t - 2) / 3, 0, 1) * 0.55 + U.clamp((t - 6.5) / 1.5, 0, 1) * 0.35;
    Art.fillPaper(ctx, 0, 0, G.W, G.H, '#f1dc9c');
    const sx = G.W / 2, sy = 200, sr = 92;
    // céu escurecendo
    ctx.save();
    ctx.fillStyle = 'rgba(20,14,8,' + dark + ')';
    ctx.fillRect(0, 0, G.W, G.H);
    ctx.restore();
    const skyCol = 'rgb(' + Math.round(U.lerp(241, 120, dark)) + ',' + Math.round(U.lerp(220, 104, dark)) + ',' + Math.round(U.lerp(156, 70, dark)) + ')';
    // o sol (ou o buraco)
    const bites = t < 4 ? 0 : Math.min(7, Math.floor((t - 4) / 0.34));
    if (t < 6.6) {
      Art.sun(ctx, sx, sy, sr, t * 0.1, { face: t < 4 });
      ctx.save();
      const bitePts = [[0.9, -0.3], [0.6, 0.6], [0.1, 0.85], [-0.5, 0.7], [-0.9, 0.1], [-0.6, -0.7], [0, -0.3]];
      for (let i = 0; i < bites; i++) {
        const [bx, by] = bitePts[i];
        ctx.fillStyle = skyCol;
        ctx.beginPath();
        ctx.arc(sx + bx * sr, sy + by * sr, sr * 0.62, 0, U.TAU);
        ctx.fill();
        ctx.strokeStyle = '#fbf8ef';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // buraco no papel do céu
      ctx.save();
      ctx.fillStyle = '#fbf8ef';
      Art.blob(ctx, sx, sy, sr * 1.15, sr * 1.1, 10, 0.2, 13);
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(29,23,18,0.25)';
      ctx.lineWidth = 10;
      ctx.stroke();
      // tinta pingando do buraco
      for (let i = 0; i < 7; i++) {
        const k = ((t - 6.6) * 0.5 + i * 0.37) % 1;
        const x = sx - sr * 0.8 + i * sr * 0.27;
        ctx.fillStyle = C.ink;
        ctx.beginPath();
        ctx.ellipse(x, sy + sr * 0.9 + k * 260, 5 + (i % 3) * 2, 8 + k * 6, 0, 0, U.TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    // a Traça
    if (t > 2.2 && t < 8.2) {
      let tx, ty, sc, pose;
      if (t < 4) {
        const k = U.ease.inOut((t - 2.2) / 1.8);
        tx = U.lerp(G.W + 260, sx + 40, k);
        ty = U.lerp(40, sy + 20, k);
        sc = 1.25;
        pose = 'fly';
      } else if (t < 6.6) {
        tx = sx + Math.sin(t * 8) * 4;
        ty = sy + 30;
        sc = 1.3;
        pose = 'eat';
      } else {
        const k = U.ease.inCubic((t - 6.6) / 1.6);
        tx = U.lerp(sx, -300, k);
        ty = U.lerp(sy + 30, 60, k);
        sc = 1.3 - k * 0.4;
        pose = 'fly';
      }
      G.Creatures.traca(ctx, { x: tx, y: ty + 60, t, alt: 60, pose, scale: sc });
      once(o, 'w', () => sfx('wings', { dur: 2.5 }));
      if (t > 4.1) once(o, 'c1', () => sfx('chomp'));
      if (t > 5) once(o, 'c2', () => sfx('chomp'));
      if (t > 5.9) once(o, 'c3', () => sfx('chomp'));
      if (t > 6.6) once(o, 'r', () => sfx('roar', { p: 0.8 }));
    }
    // carcará fugindo
    if (t < 4) P.carcara(ctx, 120 + t * 90, 120 - t * 10, 0.9, t);
    // bandeirinhas e povo olhando pra cima
    Art.bunting(ctx, 0, 330, G.W, 330, 20, t, 26);
    P.hills(ctx, 470, 30, dark > 0.3 ? '#1a130d' : C.ink, 2, 0.008);
    P.crowd(ctx, G.H + 10, t, 16, '#0f0b08');
    if (t > 4 && t < 7) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      Art.drawWood(ctx, 'NHAC!', sx + 200, sy - 80 + Math.sin(t * 20) * 4, 44, C.red, { red: C.ink });
      ctx.restore();
    }
    P.frame(ctx);
    P.fadeIn(ctx, t, dur, 0.5, 0.5);
  };

  // ------------------------------------------------------------------
  // A TRAÇA ARRANCA O TETO DA TIPOGRAFIA
  // ------------------------------------------------------------------
  P.tracaTeto = function (ctx, t, dur, o) {
    Art.fillPaper(ctx, 0, 0, G.W, G.H, '#efc5bf');
    const breakK = U.clamp((t - 1.2) / 0.8, 0, 1);
    // céu noturno pelo buraco
    ctx.save();
    ctx.fillStyle = '#1a1210';
    if (breakK > 0) {
      Art.blob(ctx, G.W / 2, 170, 300 * breakK, 170 * breakK, 11, 0.25, 4);
      ctx.fill();
      // a fenda branca no céu
      ctx.fillStyle = '#fbf8ef';
      ctx.beginPath();
      ctx.moveTo(G.W / 2 + 80, 20);
      ctx.lineTo(G.W / 2 + 96, 90);
      ctx.lineTo(G.W / 2 + 70, 130);
      ctx.lineTo(G.W / 2 + 88, 200 * breakK);
      ctx.lineTo(G.W / 2 + 62, 120);
      ctx.lineTo(G.W / 2 + 76, 80);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // vigas do teto
    ctx.save();
    ctx.strokeStyle = C.ink;
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 110;
      const bend = breakK * (Math.abs(x - G.W / 2) < 280 ? (x < G.W / 2 ? -1 : 1) * 60 : 0);
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + bend, 300 - Math.abs(bend));
      ctx.stroke();
    }
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(G.W, 300);
    ctx.stroke();
    ctx.restore();
    // a Traça entrando
    if (t > 1) {
      const k = U.ease.outCubic(Math.min(1, (t - 1) / 1.2));
      const exitK = U.clamp((t - 4) / 1.6, 0, 1);
      const x = G.W / 2 + exitK * 120, y = U.lerp(-100, 230, k) - exitK * 420;
      G.Creatures.traca(ctx, { x, y: y + 80, t, alt: 60, pose: t < 3.6 ? 'eat' : 'fly', scale: 1.6 - exitK * 0.5 });
      // a Última Página na boca
      if (t > 2.6) {
        ctx.save();
        ctx.translate(x, y + 80 - 60 * 1.6 + 30);
        ctx.rotate(Math.sin(t * 5) * 0.2);
        ctx.fillStyle = '#fbf8ef';
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 2;
        ctx.fillRect(-24, 0, 48, 64);
        ctx.strokeRect(-24, 0, 48, 64);
        ctx.fillStyle = C.red;
        ctx.font = G.font(9, 'title');
        ctx.textAlign = 'center';
        ctx.fillText('ÚLTIMA', 0, 20);
        ctx.fillText('PÁGINA', 0, 32);
        ctx.restore();
      }
      once(o, 'r', () => {
        sfx('roar', { p: 0.7, dur: 1.4 });
        sfx('boom');
      });
      if (t > 4) once(o, 'w', () => sfx('wings', { dur: 1.5 }));
    }
    // papéis voando
    for (let i = 0; i < 30; i++) {
      const k = (t * 0.4 + U.hash(i, 1)) % 1;
      if (t < 1.2) break;
      const x = (U.hash(i, 2) * G.W + Math.sin(t * 2 + i) * 30) % G.W;
      const y = 300 - k * 380 + U.hash(i, 3) * 200;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 3 + i);
      ctx.fillStyle = i % 5 === 0 ? C.red : '#f7f1e3';
      ctx.fillRect(-9, -6, 18, 12);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1;
      ctx.strokeRect(-9, -6, 18, 12);
      ctx.restore();
    }
    // Zabelê e o Poeta olhando pra cima (silhuetas)
    ctx.save();
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, G.H - 110, G.W, 110);
    ctx.restore();
    G.Sprites.humanoid(ctx, 'zabele', { x: 340, y: G.H - 30, dir: 'up', t, scale: 2.6 });
    G.Sprites.humanoid(ctx, 'firmino', { x: 600, y: G.H - 30, dir: 'up', t, scale: 2.6 });
    if (t > 1.2 && t < 3) Art.drawWood(ctx, 'CRAAAC!', G.W / 2 - 220, 140, 54, C.red, { red: C.ink });
    P.frame(ctx);
    P.fadeIn(ctx, t, dur, 0.3, 0.5);
  };

  // ------------------------------------------------------------------
  // A MARGEM SE ABRE (o último acorde do Sabiá)
  // ------------------------------------------------------------------
  P.margemAbre = function (ctx, t, dur, o) {
    ctx.fillStyle = '#1a1210';
    ctx.fillRect(0, 0, G.W, G.H);
    // estrelas-letra
    ctx.save();
    ctx.font = G.font(14, 'title');
    for (let i = 0; i < 60; i++) {
      ctx.globalAlpha = 0.2 + U.hash(i, 5) * 0.5;
      ctx.fillStyle = '#efe6d0';
      ctx.fillText('·ABCDEFGHIJLMNOPQRSTUVXZ'[i % 24], U.hash(i, 1) * G.W, U.hash(i, 2) * 300);
    }
    ctx.restore();
    // a fenda
    const k = U.ease.outCubic(U.clamp((t - 1) / 3, 0, 1));
    ctx.save();
    const cx = G.W / 2;
    const w = 12 + k * 140;
    const g = ctx.createRadialGradient(cx, 170, 10, cx, 170, 260);
    g.addColorStop(0, 'rgba(255,250,235,' + 0.6 * k + ')');
    g.addColorStop(1, 'rgba(255,250,235,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, G.W, G.H);
    ctx.fillStyle = '#fffaf0';
    ctx.beginPath();
    const pts = 10;
    for (let i = 0; i <= pts; i++) {
      const y = (i / pts) * 340;
      const ww = w * Math.sin((i / pts) * Math.PI) * (0.7 + U.hash(i, 1) * 0.5);
      if (i === 0) ctx.moveTo(cx, y);
      else ctx.lineTo(cx - ww + (U.hash(i, 2) - 0.5) * 20, y);
    }
    for (let i = pts; i >= 0; i--) {
      const y = (i / pts) * 340;
      const ww = w * Math.sin((i / pts) * Math.PI) * (0.7 + U.hash(i, 3) * 0.5);
      ctx.lineTo(cx + ww + (U.hash(i, 4) - 0.5) * 20, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
    // notas subindo da viola
    for (let i = 0; i < 14; i++) {
      const kk = (t * 0.35 + i / 14) % 1;
      ctx.save();
      ctx.globalAlpha = 1 - kk;
      ctx.fillStyle = i % 3 === 0 ? C.red : '#efe6d0';
      ctx.font = G.font(22, 'title');
      ctx.fillText(i % 2 ? '♪' : '♫', G.W / 2 - 80 + Math.sin(kk * 6 + i) * 120, 420 - kk * 300);
      ctx.restore();
    }
    // o cantador
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, G.H - 80, G.W, 80);
    const snap = t > dur - 1.8;
    G.Sprites.humanoid(ctx, 'sabia', { x: G.W / 2, y: G.H - 20, dir: 'down', t, scale: 3, pose: snap ? 'sad' : 'play' });
    if (snap) {
      once(o, 's', () => sfx('breakStrings'));
      ctx.save();
      ctx.strokeStyle = '#efe6d0';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.4;
        const L = 40 + (t - (dur - 1.8)) * 200;
        ctx.beginPath();
        ctx.moveTo(G.W / 2, G.H - 110);
        ctx.quadraticCurveTo(G.W / 2 + Math.cos(a) * L * 0.5 + 20, G.H - 110 + Math.sin(a) * L * 0.5, G.W / 2 + Math.cos(a) * L, G.H - 110 + Math.sin(a) * L);
        ctx.stroke();
      }
      ctx.restore();
    }
    P.frame(ctx);
    P.fadeIn(ctx, t, dur, 0.5, 0.6);
  };

  // ------------------------------------------------------------------
  // LEMBRANÇAS (tinta vermelha)
  // ------------------------------------------------------------------
  P.lembranca1 = function (ctx, t) {
    memoryBase(ctx, t);
    const red = C.red;
    // colinas e sol nascendo pela janela
    ctx.save();
    ctx.strokeStyle = red;
    ctx.lineWidth = 3;
    ctx.fillStyle = '#f7dcd2';
    ctx.fillRect(420, 90, 380, 300);
    ctx.save();
    ctx.beginPath();
    ctx.rect(420, 90, 380, 300);
    ctx.clip();
    Art.sun(ctx, 640, 300 - Math.min(80, t * 8), 60, t * 0.1, { fill: '#f0a890', ink: red, paper: '#f7dcd2', face: true });
    ctx.fillStyle = '#f3c9bc';
    P.hills(ctx, 360, 50, '#e8b4a4', 3, 0.012);
    ctx.restore();
    ctx.strokeRect(420, 90, 380, 300);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(610, 90);
    ctx.lineTo(610, 390);
    ctx.moveTo(420, 240);
    ctx.lineTo(800, 240);
    ctx.stroke();
    // cortina
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(420 + i * 10, 90);
      ctx.quadraticCurveTo(440 + i * 8 + Math.sin(t + i) * 6, 240, 424 + i * 6, 390);
      ctx.stroke();
    }
    ctx.restore();
    redFigure(ctx, 'luzia', { x: 560, y: 470, dir: 'right', t, scale: 3.2, face: 'happy' });
    redFigure(ctx, 'firmino', { x: 230, y: 480, dir: 'up', t, scale: 3, pose: 'hands' });
    // escrivaninha
    ctx.save();
    ctx.strokeStyle = red;
    ctx.lineWidth = 4;
    ctx.fillStyle = '#f7dcd2';
    ctx.fillRect(110, 420, 260, 30);
    ctx.strokeRect(110, 420, 260, 30);
    ctx.restore();
    memoryFrame(ctx, 'A JANELA');
  };

  P.lembranca2 = function (ctx, t) {
    memoryBase(ctx, t);
    const red = C.red;
    ctx.save();
    ctx.strokeStyle = red;
    ctx.lineWidth = 4;
    // varanda: telhado e colunas
    ctx.beginPath();
    ctx.moveTo(60, 140);
    ctx.lineTo(G.W - 60, 140);
    ctx.moveTo(100, 140);
    ctx.lineTo(100, 470);
    ctx.moveTo(G.W - 100, 140);
    ctx.lineTo(G.W - 100, 470);
    ctx.stroke();
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.arc(80 + i * 46, 140, 23, 0, Math.PI);
      ctx.stroke();
    }
    // o sol de papel pendurado
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(G.W / 2, 140);
    ctx.lineTo(G.W / 2, 200 + Math.sin(t * 1.5) * 4);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(G.W / 2, 250 + Math.sin(t * 1.5) * 4);
    ctx.rotate(Math.sin(t * 1.2) * 0.15);
    Art.sun(ctx, 0, 0, 44, 0, { fill: '#f7dcd2', ink: red, paper: '#f3d9cc', face: true, rays: 12 });
    ctx.restore();
    redFigure(ctx, 'luzia', { x: 360, y: 470, dir: 'right', t, scale: 3.2, pose: 'point', face: 'happy' });
    redFigure(ctx, 'firmino', { x: 620, y: 470, dir: 'left', t, scale: 3.1, face: 'happy' });
    // tesoura e recortes
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.translate(200 + i * 110, 500 + (i % 2) * 8);
      ctx.rotate(i);
      ctx.strokeStyle = red;
      ctx.lineWidth = 1.5;
      Art.star(ctx, 0, 0, 10, 4, 6);
      ctx.stroke();
      ctx.restore();
    }
    memoryFrame(ctx, 'A VARANDA');
  };

  P.lembranca3 = function (ctx, t) {
    memoryBase(ctx, t);
    const red = C.red;
    Art.bunting(ctx, 40, 90, G.W - 40, 90, 22, t, 40, ['#f7dcd2', C.red, '#f3c9bc']);
    Art.bunting(ctx, 40, 150, G.W - 40, 150, 22, t + 1, 30, [C.red, '#f7dcd2']);
    // fogueira
    ctx.save();
    ctx.translate(G.W / 2 + 150, 440);
    ctx.strokeStyle = red;
    ctx.lineWidth = 5;
    for (const a of [-0.4, 0.4, 0]) {
      ctx.save();
      ctx.rotate(a);
      ctx.strokeRect(-40, -6, 80, 12);
      ctx.restore();
    }
    ctx.restore();
    G.Art.flame(ctx, G.W / 2 + 150, 430, 3, t);
    // cadeira de balanço
    const rock = Math.sin(t * 1.3) * 0.06;
    ctx.save();
    ctx.translate(330, 470);
    ctx.rotate(rock);
    ctx.strokeStyle = red;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -300, 320, Math.PI * 0.42, Math.PI * 0.58);
    ctx.moveTo(-60, -90);
    ctx.lineTo(-60, 0);
    ctx.moveTo(60, -90);
    ctx.lineTo(60, 0);
    ctx.moveTo(-60, -60);
    ctx.lineTo(60, -60);
    ctx.moveTo(-60, -200);
    ctx.lineTo(-60, -90);
    ctx.stroke();
    ctx.restore();
    redFigure(ctx, 'luzia', { x: 330, y: 440, dir: 'right', t, scale: 3, pose: 'sit', face: 'sad' });
    redFigure(ctx, 'firmino', { x: 460, y: 470, dir: 'left', t, scale: 3, pose: 'give', face: 'sad' });
    memoryFrame(ctx, 'O ÚLTIMO SÃO JOÃO');
  };

  P.lembranca4 = function (ctx, t) {
    memoryBase(ctx, t);
    const red = C.red;
    // escrivaninha com gaveta aberta
    ctx.save();
    ctx.strokeStyle = red;
    ctx.fillStyle = '#f7dcd2';
    ctx.lineWidth = 4;
    ctx.fillRect(160, 300, 640, 40);
    ctx.strokeRect(160, 300, 640, 40);
    ctx.fillRect(380, 340, 260, 110);
    ctx.strokeRect(380, 340, 260, 110);
    // papéis amassados
    for (let i = 0; i < 12; i++) {
      const x = 400 + (i % 6) * 40, y = 380 + Math.floor(i / 6) * 40;
      ctx.lineWidth = 2;
      Art.blob(ctx, x, y, 18, 16, 6, 0.3, i + 3);
      ctx.fill();
      ctx.stroke();
    }
    // antenas saindo da gaveta
    if (t > 1.5) {
      const k = Math.min(1, (t - 1.5) / 2);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(510 + s * 10, 380);
        ctx.quadraticCurveTo(510 + s * 30, 380 - 40 * k, 510 + s * 20, 380 - 70 * k);
        ctx.stroke();
      }
      if (k > 0.8) {
        ctx.fillStyle = '#f7eedb';
        ctx.beginPath();
        ctx.ellipse(510, 392, 9, 5 * Math.min(1, (t - 3) * 2), 0, 0, U.TAU);
        ctx.fill();
        ctx.stroke();
        SPdot(ctx, 510, 392, 3, C.red);
      }
    }
    // lamparina apagando
    ctx.strokeStyle = red;
    ctx.lineWidth = 3;
    ctx.strokeRect(200, 250, 36, 50);
    ctx.restore();
    if (Math.sin(t * 13) > -0.3 && t < 2.5) G.Art.flame(ctx, 218, 262, 0.7 * Math.max(0, 1 - t / 2.5), t);
    redFigure(ctx, 'firmino', { x: 300, y: 470, dir: 'down', t, scale: 3.1, pose: 'sad', face: 'closed' });
    memoryFrame(ctx, 'A GAVETA');
  };
  function SPdot(ctx, x, y, r, c) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, U.TAU);
    ctx.fill();
  }
})();
