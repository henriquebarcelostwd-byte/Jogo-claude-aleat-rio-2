/* PELEJA — criaturas, companheiro, animais, inimigos e chefes */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Art = G.Art;
  const SP = G.Sprites;
  const R = SP.R;
  const dot = SP.dot;
  const ell = SP.ell;
  const limb = SP.limb;
  const CR = (G.Creatures = {});

  function shadow(ctx, rx, ry, a = 0.22) {
    ctx.fillStyle = G.Pal.negative ? 'rgba(255,245,230,' + a * 0.5 + ')' : 'rgba(20,12,6,' + a + ')';
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, U.TAU);
    ctx.fill();
  }
  CR._shadow = shadow;

  function eyes(ctx, st, x, y, sep, r, look = 0, angry = false, pupil = true) {
    const pap = R('paper', st);
    const ink = R('ink', st);
    for (const s of [-1, 1]) {
      ell(ctx, x + s * sep, y, r, r * 1.2, pap, ink, 1);
      if (pupil) dot(ctx, x + s * sep + Math.cos(look) * r * 0.35, y + Math.sin(look) * r * 0.35 + 0.5, r * 0.5, ink);
    }
    if (angry) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.6;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x + s * (sep + r * 1.1), y - r * 1.5);
        ctx.lineTo(x + s * (sep - r * 0.9), y - r * 0.8);
        ctx.stroke();
      }
    }
  }

  // ------------------------------------------------------------------
  // SEU NANQUIM — o tinteiro
  // ------------------------------------------------------------------
  CR.nanquim = function (ctx, st) {
    const t = st.t || 0;
    const ink = R('ink', st);
    const pap = R('paper', st);
    const fl = st.float != null ? st.float : 16 + Math.sin(t * 3) * 3;
    ctx.save();
    ctx.translate(st.x, st.y);
    if (st.alpha != null) ctx.globalAlpha *= st.alpha;
    shadow(ctx, 9, 3, 0.18);
    const face = st.dir === 'left' ? -1 : 1;
    if (st.scale) ctx.scale(st.scale, st.scale);
    ctx.translate(0, -fl);
    if (st.tilt) ctx.rotate(st.tilt);
    ctx.scale(face, 1);
    // perninhas com polainas
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.2;
    for (const s of [-1, 1]) {
      const sw = Math.sin(t * 6 + s) * 2;
      ctx.beginPath();
      ctx.moveTo(s * 4, -1);
      ctx.lineTo(s * 4 + sw, 6);
      ctx.stroke();
      ell(ctx, s * 4 + sw + 1, 7, 2.6, 1.6, pap, ink, 0.9);
    }
    // vidro
    const bw = 12, bh = 10;
    ctx.fillStyle = G.Pal.negative ? R('paperDark', st) : R('white', st);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.8;
    Art.rrect(ctx, -bw, -bh * 2, bw * 2, bh * 2, 6);
    ctx.fill();
    // tinta dentro
    ctx.save();
    Art.rrect(ctx, -bw, -bh * 2, bw * 2, bh * 2, 6);
    ctx.clip();
    const level = st.level != null ? st.level : 0.62;
    const slosh = Math.sin(t * 4) * 1.5 + (st.slosh || 0);
    ctx.fillStyle = st._flash || R('ink', st);
    ctx.beginPath();
    const ly = -bh * 2 * level;
    ctx.moveTo(-bw - 2, ly + slosh);
    ctx.quadraticCurveTo(0, ly - slosh * 0.5, bw + 2, ly - slosh);
    ctx.lineTo(bw + 2, 2);
    ctx.lineTo(-bw - 2, 2);
    ctx.closePath();
    ctx.fill();
    // bigode entalhado na tinta
    ctx.fillStyle = pap;
    ctx.beginPath();
    const my = ly + 4;
    ctx.moveTo(0, my);
    ctx.quadraticCurveTo(-5, my - 2, -8, my + 1.5);
    ctx.quadraticCurveTo(-4, my + 0.5, 0, my + 2);
    ctx.quadraticCurveTo(4, my + 0.5, 8, my + 1.5);
    ctx.quadraticCurveTo(5, my - 2, 0, my);
    ctx.fill();
    if (st.talking && Math.floor(t * 10) % 2 === 0) ell(ctx, 0, my + 4.5, 2, 1.4, pap);
    ctx.restore();
    Art.rrect(ctx, -bw, -bh * 2, bw * 2, bh * 2, 6);
    ctx.stroke();
    // brilho do vidro
    ctx.strokeStyle = pap;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-bw + 3, -bh * 2 + 5);
    ctx.lineTo(-bw + 3, -bh * 2 + 9);
    ctx.stroke();
    // olhos
    const ey = -bh * 2 + 5.5;
    const expr = st.face || 'normal';
    const blink = t % 4.3 < 0.12;
    ctx.fillStyle = ink;
    for (const s of [-1, 1]) {
      if (blink || expr === 'happy') {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(s * 4 - 1.6, ey);
        ctx.lineTo(s * 4 + 1.6, ey);
        ctx.stroke();
      } else {
        const big = expr === 'surprised' ? 1.4 : 1;
        ell(ctx, s * 4, ey, 1.3 * big, 1.7 * big, ink);
      }
    }
    // monóculo
    ctx.strokeStyle = R('gold', st);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(4, ey, 3.2, 0, U.TAU);
    ctx.stroke();
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(7, ey + 1);
    ctx.quadraticCurveTo(10, ey + 6, 8, ey + 10);
    ctx.stroke();
    // sobrancelhas
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.6;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      if (expr === 'angry') {
        ctx.moveTo(s * 6.5, ey - 4.5);
        ctx.lineTo(s * 1.5, ey - 2.5);
      } else if (expr === 'sad') {
        ctx.moveTo(s * 6.5, ey - 2.5);
        ctx.lineTo(s * 1.5, ey - 4.5);
      } else {
        ctx.moveTo(s * 6.5, ey - 3.8);
        ctx.lineTo(s * 1.5, ey - 4);
      }
      ctx.stroke();
    }
    // gargalo e rolha
    ctx.fillStyle = G.Pal.negative ? R('paperDark', st) : R('white', st);
    ctx.lineWidth = 1.5;
    ctx.fillRect(-4.5, -bh * 2 - 4, 9, 4);
    ctx.strokeRect(-4.5, -bh * 2 - 4, 9, 4);
    ctx.fillStyle = R('mid', st);
    ctx.fillRect(-5.5, -bh * 2 - 8.5, 11, 5);
    ctx.strokeRect(-5.5, -bh * 2 - 8.5, 11, 5);
    // pena
    ctx.save();
    ctx.translate(-1, -bh * 2 - 8);
    ctx.rotate(-0.55 + Math.sin(t * 2) * 0.05);
    ctx.fillStyle = pap;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-6, -12, -2, -26);
    ctx.quadraticCurveTo(5, -14, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let i = 1; i < 7; i++) {
      const py = -i * 3.5;
      ctx.moveTo(-1 + i * 0.1, py);
      ctx.lineTo(-4, py - 2);
    }
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  };

  // ------------------------------------------------------------------
  // Animais
  // ------------------------------------------------------------------
  function quadruped(ctx, st, o) {
    const t = st.t || 0;
    const ink = R('ink', st);
    const moving = st.moving;
    const ph = st.phase || 0;
    ctx.save();
    ctx.translate(st.x, st.y);
    shadow(ctx, o.len * 0.6, 4);
    if (st.dir === 'left') ctx.scale(-1, 1);
    const body = R(o.body, st);
    const bob = moving ? Math.abs(Math.sin(ph)) * -1.5 : 0;
    // pernas
    for (const [lx, k] of [[-o.len * 0.35, 0], [-o.len * 0.2, 1], [o.len * 0.25, 1], [o.len * 0.38, 0]]) {
      const sw = moving ? Math.sin(ph + k * Math.PI) * 3 : 0;
      limb(ctx, lx, -o.legH, lx + sw, -1, body, 2.6, 2);
      ell(ctx, lx + sw, -0.5, 1.8, 1.2, ink);
    }
    ctx.translate(0, bob);
    // rabo
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-o.len * 0.48, -o.legH - o.h * 0.6);
    ctx.quadraticCurveTo(-o.len * 0.6, -o.legH - o.h * 0.2 + Math.sin(t * 4) * 3, -o.len * 0.56, -o.legH + 2);
    ctx.stroke();
    // corpo
    ell(ctx, 0, -o.legH - o.h / 2, o.len / 2, o.h / 2, body, ink, 1.6);
    if (o.patches) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, -o.legH - o.h / 2, o.len / 2, o.h / 2, 0, 0, U.TAU);
      ctx.clip();
      ctx.fillStyle = ink;
      Art.blob(ctx, -o.len * 0.15, -o.legH - o.h * 0.7, o.len * 0.18, o.h * 0.35, 5, 0.3, 4);
      ctx.fill();
      ctx.restore();
    }
    if (o.extra) o.extra(ctx, st, body, ink);
    // cabeça
    const hx = o.len * 0.5, hy = -o.legH - o.h * 0.95;
    limb(ctx, o.len * 0.35, -o.legH - o.h * 0.6, hx, hy, body, o.neck || 5, 2);
    ell(ctx, hx + 3, hy, o.head, o.head * 0.72, body, ink, 1.5, 0.3);
    dot(ctx, hx + 3, hy - 1.5, 1.2, ink);
    if (o.head2) o.head2(ctx, st, hx, hy, body, ink);
    ctx.restore();
  }

  CR.lorota = function (ctx, st) {
    quadruped(ctx, st, {
      len: 40, h: 18, legH: 13, head: 7.5, neck: 6, body: 'mid',
      extra(c, st2, body, ink) {
        // cestos com folhetos
        const cols = ['#e6c14f', '#e39a9a', '#8fb3d9', '#f0e3c0'];
        for (let i = 0; i < 4; i++) {
          c.fillStyle = G.Pal.negative ? R('paper', st2) : cols[i];
          c.fillRect(-12 + i * 5, -40, 4.5, 7);
          c.strokeStyle = ink;
          c.lineWidth = 0.7;
          c.strokeRect(-12 + i * 5, -40, 4.5, 7);
        }
        c.fillStyle = R('straw', st2);
        c.strokeStyle = ink;
        c.lineWidth = 1.2;
        c.fillRect(-14, -34, 22, 10);
        c.strokeRect(-14, -34, 22, 10);
        c.beginPath();
        for (let i = 0; i < 5; i++) {
          c.moveTo(-14 + i * 5, -34);
          c.lineTo(-11 + i * 5, -24);
        }
        c.stroke();
      },
      head2(c, st2, hx, hy, body, ink) {
        const t = st2.t || 0;
        // orelhonas
        for (const [dx, a] of [[-2, -2.1], [2, -1.7]]) {
          c.save();
          c.translate(hx + dx, hy - 4);
          c.rotate(a + Math.sin(t * 1.5 + dx) * 0.12);
          ell(c, 7, 0, 7.5, 2.4, body, ink, 1.2);
          c.restore();
        }
        // flor
        for (let k = 0; k < 5; k++) dot(c, hx - 3 + Math.cos((k * U.TAU) / 5) * 2, hy - 10 + Math.sin((k * U.TAU) / 5) * 2, 1.5, R('red', st2), ink, 0.5);
        ell(c, hx + 9, hy + 2, 3.5, 2.6, R('paperDark', st2), ink, 1);
        dot(c, hx + 10, hy + 1.5, 0.7, ink);
      },
    });
  };

  CR.bodinha = function (ctx, st) {
    quadruped(ctx, st, {
      len: 26, h: 12, legH: 10, head: 5.5, neck: 4, body: 'white', patches: true,
      head2(c, st2, hx, hy, body, ink) {
        c.strokeStyle = ink;
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(hx, hy - 4);
        c.quadraticCurveTo(hx - 4, hy - 10, hx - 7, hy - 8);
        c.moveTo(hx + 2, hy - 4);
        c.quadraticCurveTo(hx - 1, hy - 11, hx - 4, hy - 10);
        c.stroke();
        c.fillStyle = ink;
        c.beginPath();
        c.moveTo(hx + 5, hy + 3);
        c.lineTo(hx + 4, hy + 8);
        c.lineTo(hx + 7, hy + 3);
        c.fill();
        dot(c, hx - 2, hy + 6, 2, R('gold', st2), ink, 0.8);
      },
    });
  };

  CR.galinha = function (ctx, st) {
    const t = st.t || 0;
    const ink = R('ink', st);
    ctx.save();
    ctx.translate(st.x, st.y);
    shadow(ctx, 8, 3);
    if (st.dir === 'left') ctx.scale(-1, 1);
    const ph = st.phase || t * 10;
    for (const s of [-1, 1]) {
      ctx.strokeStyle = R('gold', st);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(s * 2, -7);
      ctx.lineTo(s * 2 + Math.sin(ph + s) * 2.5, 0);
      ctx.stroke();
    }
    ell(ctx, 0, -12, 8, 6.5, R('white', st), ink, 1.4);
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(-6, -14);
    ctx.lineTo(-12, -20);
    ctx.lineTo(-9, -12);
    ctx.fill();
    dot(ctx, 6, -18, 4, R('white', st), ink, 1.2);
    ctx.fillStyle = R('red', st);
    ctx.beginPath();
    ctx.arc(6, -22, 2, 0, U.TAU);
    ctx.arc(8, -21.5, 1.6, 0, U.TAU);
    ctx.fill();
    ctx.fillStyle = R('gold', st);
    ctx.beginPath();
    ctx.moveTo(9.5, -18.5);
    ctx.lineTo(13, -17.5);
    ctx.lineTo(9.5, -16.5);
    ctx.fill();
    dot(ctx, 7, -19, 0.8, ink);
    ctx.restore();
  };

  // ------------------------------------------------------------------
  // Inimigos
  // ------------------------------------------------------------------
  CR.borrao = function (ctx, st) {
    const t = st.t || 0;
    const hop = st.hop || 0;
    const sq = st.squash || 0;
    const ink = st._flash || R('ink', st);
    ctx.save();
    ctx.translate(st.x, st.y);
    shadow(ctx, 14 * (1 - hop * 0.4), 4.5 * (1 - hop * 0.4));
    const s = st.size || 1;
    ctx.scale(s, s);
    const by = -12 - hop * 26;
    ctx.fillStyle = ink;
    Art.blob(ctx, 0, by, 14 * (1 + sq), 13 * (1 - sq), 6, 0.2, (st.seed || 1) + G.boil);
    ctx.fill();
    // gotas escorrendo
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.9 + i / 3) % 1;
      dot(ctx, -8 + i * 8, by + 10 + k * 8, 2.2 * (1 - k), ink);
    }
    ctx.fillStyle = R('paper', st);
    Art.gouge(ctx, -6, by - 7, 7, -0.6, 1.6);
    eyes(ctx, st, 0, by - 1, 5, 3.2, st.look || Math.PI / 2, true);
    ctx.restore();
  };

  CR.calango = function (ctx, st) {
    const t = st.t || 0;
    const ink = st._flash || R('ink', st);
    const pap = R('paper', st);
    ctx.save();
    ctx.translate(st.x, st.y);
    shadow(ctx, 20, 6, 0.18);
    ctx.translate(0, -6);
    if (st.shake) ctx.translate(Math.sin(t * 60) * 1.5, 0);
    ctx.rotate(st.angle || 0);
    const ph = st.phase || 0;
    // cauda
    ctx.strokeStyle = ink;
    ctx.lineCap = 'round';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    const w = Math.sin(ph * 1.3) * 5;
    ctx.quadraticCurveTo(-24, w, -34, -w * 0.5);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-30, -w * 0.3);
    ctx.lineTo(-40, -w);
    ctx.stroke();
    // pernas
    ctx.lineWidth = 2.4;
    for (const [lx, s, k] of [[8, -1, 0], [8, 1, 1], [-8, -1, 1], [-8, 1, 0]]) {
      const sw = Math.sin(ph + k * Math.PI) * 4;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx + sw, s * 11);
      ctx.lineTo(lx + sw + 3, s * 13);
      ctx.stroke();
    }
    // corpo de tipos de chumbo
    const letters = st.letters || 'ABC';
    for (let i = 0; i < 3; i++) {
      const bx = 6 - i * 9;
      ctx.fillStyle = ink;
      ctx.fillRect(bx - 4.5, -5.5, 9, 11);
      ctx.strokeStyle = pap;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(bx - 3.5, -4.5, 7, 9);
      ctx.save();
      ctx.translate(bx, 0);
      ctx.rotate(Math.PI / 2);
      ctx.scale(-1, 1);
      ctx.fillStyle = pap;
      ctx.font = G.font(9, 'title');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letters[i] || 'A', 0, 1);
      ctx.restore();
    }
    // cabeça
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(10, -5);
    ctx.quadraticCurveTo(24, -4, 25, 0);
    ctx.quadraticCurveTo(24, 4, 10, 5);
    ctx.closePath();
    ctx.fill();
    dot(ctx, 17, -3.5, 1.8, pap);
    dot(ctx, 17, 3.5, 1.8, pap);
    dot(ctx, 17.5, -3.5, 0.8, ink);
    dot(ctx, 17.5, 3.5, 0.8, ink);
    if (Math.sin(t * 3) > 0.9) {
      ctx.strokeStyle = R('red', st);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.lineTo(31, 0);
      ctx.lineTo(33, -2);
      ctx.moveTo(31, 0);
      ctx.lineTo(33, 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  CR.urubu = function (ctx, st) {
    const t = st.t || 0;
    const ink = st._flash || R('ink', st);
    const pap = R('paper', st);
    const alt = st.alt != null ? st.alt : 60;
    ctx.save();
    ctx.translate(st.x, st.y);
    const ss = Math.max(0.35, 1 - alt / 200);
    shadow(ctx, 22 * ss, 7 * ss, 0.16);
    ctx.translate(0, -alt);
    ctx.rotate((st.angle || 0) + Math.PI / 2);
    const flap = st.flap != null ? st.flap : Math.sin(t * 7);
    // asas de dobradura
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.scale(s * (0.75 + 0.25 * Math.abs(flap)), 1);
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(2, -4);
      ctx.lineTo(30, -2 + flap * 4);
      ctx.lineTo(22, 6);
      ctx.lineTo(3, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = G.Pal.negative ? R('mid', st) : '#3a2e25';
      ctx.beginPath();
      ctx.moveTo(3, 8);
      ctx.lineTo(22, 6);
      ctx.lineTo(16, 13);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = pap;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(4, 2);
      ctx.lineTo(28, -1 + flap * 4);
      ctx.moveTo(10, 7);
      ctx.lineTo(20, 5);
      ctx.stroke();
      ctx.restore();
    }
    // corpo
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(6, 2);
    ctx.lineTo(0, 16);
    ctx.lineTo(-6, 2);
    ctx.closePath();
    ctx.fill();
    // cauda
    ctx.beginPath();
    ctx.moveTo(-4, 14);
    ctx.lineTo(0, 22);
    ctx.lineTo(4, 14);
    ctx.fill();
    // cabeça pelada
    dot(ctx, 0, -12, 4, R('red', st), ink, 1);
    ctx.fillStyle = pap;
    ctx.beginPath();
    ctx.moveTo(-1.5, -15);
    ctx.quadraticCurveTo(0, -21, 2, -19);
    ctx.lineTo(1.5, -15);
    ctx.fill();
    dot(ctx, -2, -12.5, 0.9, ink);
    dot(ctx, 2, -12.5, 0.9, ink);
    ctx.restore();
  };

  CR.mandacaruzinho = function (ctx, st) {
    const t = st.t || 0;
    const ink = st._flash || R('ink', st);
    const pap = R('paper', st);
    ctx.save();
    ctx.translate(st.x, st.y);
    shadow(ctx, 12, 4);
    const sq = st.squash || 0;
    ctx.scale(1 + sq, 1 - sq);
    // braços
    ctx.fillStyle = ink;
    Art.rrect(ctx, -16, -24, 7, 12, 3.5);
    ctx.fill();
    Art.rrect(ctx, -16, -16, 10, 5, 2.5);
    ctx.fill();
    Art.rrect(ctx, 9, -28, 7, 14, 3.5);
    ctx.fill();
    Art.rrect(ctx, 6, -18, 10, 5, 2.5);
    ctx.fill();
    // tronco
    Art.rrect(ctx, -8, -34, 16, 34, 7);
    ctx.fill();
    ctx.strokeStyle = pap;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (const x of [-4, 0, 4]) {
      ctx.moveTo(x, -31);
      ctx.lineTo(x, -3);
    }
    ctx.stroke();
    ctx.fillStyle = pap;
    for (let i = 0; i < 10; i++) {
      const px = -8 + (i % 2) * 16, py = -30 + i * 3;
      ctx.fillRect(px - (i % 2 ? 0 : 2), py, 2, 0.8);
    }
    eyes(ctx, st, 0, -24, 3.5, 2.4, st.look || Math.PI / 2, true);
    ctx.fillStyle = pap;
    ctx.fillRect(-3, -17, 6, 1.4);
    if (st.flower) {
      for (let k = 0; k < 6; k++) dot(ctx, Math.cos((k * U.TAU) / 6) * 3, -37 + Math.sin((k * U.TAU) / 6) * 3, 2, R('red', st), ink, 0.6);
      dot(ctx, 0, -37, 1.5, R('gold', st));
    }
    ctx.restore();
    void t;
  };

  CR.novelo = function (ctx, st) {
    const ink = st._flash || R('ink', st);
    const red = st._flash || R('red', st);
    ctx.save();
    ctx.translate(st.x, st.y);
    shadow(ctx, 12, 4);
    const r = 12 * (st.size || 1);
    // fio solto
    ctx.strokeStyle = red;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const ta = (st.moveAngle || 0) + Math.PI;
    ctx.moveTo(Math.cos(ta) * r * 0.8, -r + Math.sin(ta) * r * 0.8);
    ctx.quadraticCurveTo(Math.cos(ta) * r * 1.8, -r * 0.4 + Math.sin(ta) * r * 1.6 + Math.sin((st.t || 0) * 6) * 3, Math.cos(ta) * r * 2.6, -2 + Math.sin(ta) * r * 2);
    ctx.stroke();
    ctx.save();
    ctx.translate(0, -r);
    dot(ctx, 0, 0, r, red, ink, 1.6);
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, U.TAU);
    ctx.clip();
    ctx.rotate(st.rot || 0);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.9;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.ellipse(i * 3.5, 0, 4, r * 1.2, 0.3, 0, U.TAU);
      ctx.stroke();
    }
    ctx.restore();
    eyes(ctx, st, 0, -1, 4, 2.6, st.look || Math.PI / 2, true);
    ctx.restore();
    ctx.restore();
  };

  CR.agulheira = function (ctx, st) {
    const t = st.t || 0;
    const ink = st._flash || R('ink', st);
    const pap = R('paper', st);
    const alt = st.alt != null ? st.alt : 22;
    ctx.save();
    ctx.translate(st.x, st.y);
    shadow(ctx, 9, 3, 0.15);
    ctx.translate(0, -alt);
    ctx.rotate(st.angle || 0);
    // asas
    const f = 0.5 + 0.5 * Math.abs(Math.sin(t * 40));
    ctx.fillStyle = 'rgba(255,250,240,0.55)';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.8;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(1, s * 8 * f, 7, 4 * f, s * 0.4, 0, U.TAU);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-4, s * 6 * f, 5, 3 * f, s * 0.6, 0, U.TAU);
      ctx.fill();
      ctx.stroke();
    }
    // agulha
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-22, 0);
    ctx.stroke();
    ctx.strokeStyle = G.Pal.negative ? pap : '#d8d4c8';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // abdome listrado
    ell(ctx, -4, 0, 6.5, 4.5, R('gold', st), ink, 1.2);
    ctx.fillStyle = ink;
    ctx.fillRect(-6, -4.5, 1.8, 9);
    ctx.fillRect(-2.5, -4.5, 1.8, 9);
    ell(ctx, 4, 0, 3.5, 3.2, ink);
    dot(ctx, 8, 0, 3, ink);
    dot(ctx, 9, -1.8, 1.1, R('red', st));
    dot(ctx, 9, 1.8, 1.1, R('red', st));
    ctx.restore();
  };

  CR.peixe = function (ctx, st) {
    const e = st.emerge || 0;
    const ink = st._flash || R('ink', st);
    const pap = R('paper', st);
    ctx.save();
    ctx.translate(st.x, st.y);
    // anéis de água
    ctx.strokeStyle = pap;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 2; i++) {
      const k = ((st.t || 0) * 0.8 + i * 0.5) % 1;
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8 + k * 16, 3 + k * 5, 0, 0, U.TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (e > 0.05) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(-40, -80, 80, 80);
      ctx.clip();
      ctx.translate(0, 8 - e * 26);
      if (st.dir === 'left') ctx.scale(-1, 1);
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, 8, -0.2, 0, U.TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-11, 1);
      ctx.lineTo(-21, -7);
      ctx.lineTo(-19, 8);
      ctx.closePath();
      ctx.fill();
      dot(ctx, 7, -3, 3, pap);
      dot(ctx, 7.8, -3, 1.4, ink);
      ctx.strokeStyle = pap;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) ctx.arc(-2 + i * 4, 1, 3, -0.8, 0.8);
      ctx.stroke();
      if (st.spit) ell(ctx, 13, 1, 2.2, 1.6, R('red', st));
      ctx.restore();
    }
    ctx.restore();
  };

  CR.carimbo = function (ctx, st) {
    const t = st.t || 0;
    const ink = st._flash || R('ink', st);
    const pap = R('paper', st);
    const lift = st.lift || 0;
    ctx.save();
    ctx.translate(st.x, st.y);
    shadow(ctx, 16 * (1 - lift / 80), 5);
    const ph = st.phase || 0;
    // perninhas
    if (lift < 2) {
      for (const s of [-1, 1]) {
        const k = st.moving ? Math.max(0, Math.sin(ph + (s > 0 ? Math.PI : 0))) * 3 : 0;
        limb(ctx, s * 6, -8, s * 7, -1 - k, R('mid', st), 3, 2);
        ell(ctx, s * 7, -0.5 - k, 3, 1.6, ink);
      }
    }
    ctx.translate(0, -lift);
    // bloco (borracha vermelha embaixo)
    ctx.fillStyle = R('red', st);
    ctx.fillRect(-14, -12, 28, 4);
    ctx.fillStyle = ink;
    ctx.fillRect(-15, -26, 30, 15);
    ctx.fillStyle = pap;
    ctx.font = G.font(7, 'title');
    ctx.textAlign = 'center';
    ctx.fillText('CONFISCADO', 0, -15.5);
    ctx.strokeStyle = pap;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-12.5, -23.5, 25, 10);
    // braços
    for (const s of [-1, 1]) {
      const up = st.raise ? -10 : 0;
      limb(ctx, s * 14, -21, s * 20, -14 + up, ink, 2.4, 1.5);
      dot(ctx, s * 20, -14 + up, 2, R('mid', st), ink, 0.8);
    }
    // cabo de madeira = cabeça
    ctx.fillStyle = R('mid', st);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.4;
    ctx.fillRect(-4, -34, 8, 8);
    ctx.strokeRect(-4, -34, 8, 8);
    dot(ctx, 0, -42, 9.5, R('mid', st), ink, 1.5);
    ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(0, -42, 6, 0.5, 2.5);
    ctx.arc(0, -42, 3, 3.5, 5.5);
    ctx.stroke();
    ctx.globalAlpha = 1;
    eyes(ctx, st, 0, -43, 3.6, 2.2, st.look || Math.PI / 2, true);
    ctx.fillStyle = ink;
    ctx.fillRect(-3, -37.5, 6, 1.4);
    ctx.restore();
    void t;
  };

  CR.rascunho = function (ctx, st) {
    const ink = R('ink', st);
    const pap = st._flash || '#f7f0de';
    ctx.save();
    ctx.translate(st.x, st.y);
    shadow(ctx, 13, 4);
    const r = 13 * (st.size || 1);
    ctx.translate(0, -r - (st.hop || 0));
    ctx.rotate(st.rot || 0);
    const seed = (st.seed || 3) + G.boil;
    const rr = U.rng(seed);
    ctx.beginPath();
    const n = 14;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * U.TAU;
      const k = r * (0.78 + rr() * 0.3);
      pts.push([Math.cos(a) * k, Math.sin(a) * k]);
    }
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.fillStyle = G.Pal.negative ? '#f1e9d6' : pap;
    ctx.fill();
    ctx.strokeStyle = G.Pal.negative ? '#1d1712' : ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = pts[(i * 3) % n], b = pts[(i * 3 + 5) % n];
      ctx.moveTo(a[0] * 0.8, a[1] * 0.8);
      ctx.lineTo(b[0] * 0.3, b[1] * 0.3);
    }
    ctx.stroke();
    // rabiscos de texto
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    for (let i = -1; i <= 1; i++) {
      ctx.moveTo(-6, i * 4 + 3);
      for (let k = 0; k < 6; k++) ctx.lineTo(-6 + k * 2.4, i * 4 + 3 + (k % 2 ? -1 : 1));
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.rotate(-(st.rot || 0));
    const eInk = G.Pal.negative ? '#1d1712' : ink;
    ctx.fillStyle = eInk;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 7, -5);
      ctx.lineTo(s * 2, -2);
      ctx.lineTo(s * 6, -1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(-5, 4);
    for (let i = 0; i <= 5; i++) ctx.lineTo(-5 + i * 2, 4 + (i % 2 ? 2 : -0.5));
    ctx.strokeStyle = eInk;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  };

  CR.letra = function (ctx, st) {
    const t = st.t || 0;
    const ink = st._flash || R('ink', st);
    ctx.save();
    ctx.translate(st.x, st.y);
    shadow(ctx, 7, 2.5, 0.15);
    const alt = 20 + Math.sin(t * 5 + (st.seed || 0)) * 4;
    ctx.translate(0, -alt);
    const f = Math.abs(Math.sin(t * 25));
    ctx.fillStyle = 'rgba(255,250,240,0.6)';
    if (G.Pal.negative) ctx.fillStyle = 'rgba(40,30,20,0.6)';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.8;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(s * 9, -6, 6, 3 * f + 0.5, s * -0.5, 0, U.TAU);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = ink;
    ctx.font = G.font(22, 'title');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.ch || 'A', 0, 0);
    ctx.fillStyle = R('red', st);
    dot(ctx, -3, -3, 1.1, R('red', st));
    dot(ctx, 3, -3, 1.1, R('red', st));
    ctx.restore();
  };

  // ------------------------------------------------------------------
  // CHEFE 1 — Capitão Mandacaru
  // ------------------------------------------------------------------
  CR.mandacaru = function (ctx, st) {
    const t = st.t || 0;
    const ink = st._flash || R('ink', st);
    const pap = R('paper', st);
    const pose = st.pose || 'idle';
    ctx.save();
    ctx.translate(st.x, st.y);
    shadow(ctx, 34, 10);
    if (st.dir === 'left') ctx.scale(-1, 1);
    const ph = st.phase || 0;
    const bob = st.moving ? -Math.abs(Math.sin(ph)) * 3 : Math.sin(t * 2) * 1;
    const kneel = pose === 'kneel' ? 14 : 0;
    // pés-raiz
    for (const s of [-1, 1]) {
      const k = st.moving ? Math.max(0, Math.sin(ph + (s > 0 ? Math.PI : 0))) * 5 : 0;
      ctx.fillStyle = ink;
      Art.blob(ctx, s * 11, -4 - k, 10, 5, 4, 0.25, 7 + s);
      ctx.fill();
    }
    ctx.translate(0, bob + kneel);
    const topY = -92;
    // braços de cacto
    const armL = pose === 'shoot' ? [[-15, -52], [-36, -54], [-44, -62]] : pose === 'stun' ? [[-15, -52], [-34, -44], [-40, -30]] : [[-15, -52], [-36, -52], [-38, -80]];
    const armR = pose === 'shoot' ? [[15, -46], [40, -50], [52, -52]] : pose === 'summon' ? [[15, -46], [34, -60], [36, -96]] : [[15, -46], [34, -46], [36, -72]];
    ctx.strokeStyle = ink;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const arm of [armL, armR]) {
      ctx.lineWidth = 15;
      ctx.beginPath();
      ctx.moveTo(arm[0][0], arm[0][1]);
      ctx.lineTo(arm[1][0], arm[1][1]);
      ctx.lineTo(arm[2][0], arm[2][1]);
      ctx.stroke();
      ctx.strokeStyle = pap;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(arm[1][0], arm[1][1]);
      ctx.lineTo(arm[2][0], arm[2][1]);
      ctx.stroke();
      ctx.strokeStyle = ink;
      // espinhos
      ctx.fillStyle = pap;
      for (let k = 0; k < 5; k++) {
        const px = U.lerp(arm[1][0], arm[2][0], k / 4), py = U.lerp(arm[1][1], arm[2][1], k / 4);
        ctx.fillRect(px - 9, py, 3, 0.9);
        ctx.fillRect(px + 6, py + 2, 3, 0.9);
      }
    }
    // tronco
    ctx.fillStyle = ink;
    Art.rrect(ctx, -18, topY, 36, -topY - 6, 16);
    ctx.fill();
    ctx.strokeStyle = pap;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const x of [-10, -3.5, 3.5, 10]) {
      ctx.moveTo(x, topY + 14);
      ctx.lineTo(x * 1.05, -12);
    }
    ctx.stroke();
    ctx.fillStyle = pap;
    for (let i = 0; i < 16; i++) {
      const px = i % 2 ? 17 : -20, py = topY + 16 + i * 4.5;
      ctx.fillRect(px, py, 3.5, 0.9);
    }
    // cartucheiras cruzadas
    ctx.strokeStyle = R('mid', st);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-17, -66);
    ctx.lineTo(17, -30);
    ctx.moveTo(17, -66);
    ctx.lineTo(-17, -30);
    ctx.stroke();
    ctx.fillStyle = R('red', st);
    for (let k = 0; k < 6; k++) {
      dot(ctx, U.lerp(-14, 14, k / 5), U.lerp(-63, -33, k / 5), 1.5, R('red', st));
      dot(ctx, U.lerp(14, -14, k / 5), U.lerp(-63, -33, k / 5), 1.5, R('red', st));
    }
    // lenço vermelho
    ctx.fillStyle = R('red', st);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-17, -70);
    ctx.lineTo(17, -70);
    ctx.lineTo(2, -58);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // rosto
    const fy = -80;
    const corrupt = st.corrupt;
    if (pose === 'stun') {
      ctx.strokeStyle = pap;
      ctx.lineWidth = 1.5;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * 7 - 3, fy - 3);
        ctx.lineTo(s * 7 + 3, fy + 3);
        ctx.moveTo(s * 7 + 3, fy - 3);
        ctx.lineTo(s * 7 - 3, fy + 3);
        ctx.stroke();
      }
    } else {
      for (const s of [-1, 1]) {
        ell(ctx, s * 7, fy, 4.2, 3.4, corrupt ? R('red', st) : pap, null);
        dot(ctx, s * 7 + 0.8, fy + 0.5, 1.8, ink);
      }
      ctx.strokeStyle = pap;
      ctx.lineWidth = 2;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        if (pose === 'bloom' || pose === 'kneel') {
          ctx.moveTo(s * 12, fy - 6);
          ctx.lineTo(s * 3, fy - 7);
        } else {
          ctx.moveTo(s * 12, fy - 8);
          ctx.lineTo(s * 3, fy - 4);
        }
        ctx.stroke();
      }
    }
    // bigode de espinho
    ctx.strokeStyle = pap;
    ctx.lineWidth = 1.4;
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(s * 2, fy + 7 + k);
        ctx.quadraticCurveTo(s * 10, fy + 5 + k * 2, s * (15 + k * 2), fy + 10 + k * 3);
        ctx.stroke();
      }
    }
    if (st.talking && Math.floor(t * 10) % 2 === 0) ell(ctx, 0, fy + 13, 3, 2, R('red', st));
    // chapéu de cangaceiro
    const hy = topY + 2;
    ctx.fillStyle = R('mid', st);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, hy, 22, 9, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, hy + 10, 40, Math.PI * 1.1, Math.PI * 1.9);
    ctx.arc(0, hy + 12, 22, Math.PI * 1.82, Math.PI * 1.18, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = pap;
    Art.star(ctx, 0, hy - 14, 7, 3, 6);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.15 + (i / 8) * 0.7);
      dot(ctx, Math.cos(a) * 33, hy + 10 + Math.sin(a) * 33, 2, R('gold', st), ink, 0.7);
    }
    // flor (liberto)
    if (pose === 'bloom' || st.flower) {
      for (let k = 0; k < 8; k++) {
        const a = (k * U.TAU) / 8 + t * 0.3;
        ell(ctx, Math.cos(a) * 7, hy - 26 + Math.sin(a) * 7, 6, 3, R('red', st), ink, 0.8, a);
      }
      dot(ctx, 0, hy - 26, 4, R('gold', st), ink, 0.8);
    }
    // tinta da Traça escorrendo
    if (corrupt) {
      ctx.fillStyle = R('ink', st);
      for (let i = 0; i < 5; i++) {
        const k = (t * 0.5 + i * 0.2) % 1;
        const px = -30 + i * 15;
        dot(ctx, px, hy + 8 + k * 60, 3 * (1 - k * 0.6), R('ink', st));
      }
      ctx.fillStyle = R('red', st);
      ctx.globalAlpha = 0.7 + Math.sin(t * 5) * 0.3;
      ctx.beginPath();
      ctx.ellipse(0, -44, 6, 3.5, 0, 0, U.TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      dot(ctx, 0, -44, 2, ink);
    }
    if (pose === 'stun') {
      for (let i = 0; i < 3; i++) {
        const a = t * 4 + (i * U.TAU) / 3;
        ctx.fillStyle = R('gold', st);
        Art.star(ctx, Math.cos(a) * 26, hy - 20 + Math.sin(a) * 7, 5, 2, 5);
        ctx.fill();
      }
    }
    ctx.restore();
  };

  // ------------------------------------------------------------------
  // CHEFE 2 — Dona Renda
  // ------------------------------------------------------------------
  CR.renda = function (ctx, st) {
    const t = st.t || 0;
    const ink = st._flash || R('ink', st);
    const pap = R('paper', st);
    const lace = R('lace', st);
    const pose = st.pose || 'idle';
    const lift = st.lift != null ? st.lift : 0;
    ctx.save();
    ctx.translate(st.x, st.y);
    shadow(ctx, 50 - lift * 0.1, 14);
    const ph = st.phase || t * 3;
    // pernas de bilro
    const cy = -44 - lift;
    for (let i = 0; i < 6; i++) {
      const s = i < 3 ? -1 : 1;
      const k = i % 3;
      const bx = s * (18 + k * 12);
      const sw = st.moving ? Math.sin(ph + i) * 4 : Math.sin(t + i) * 1;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bx * 0.7, cy + 12);
      ctx.quadraticCurveTo(bx * 1.3, cy + 6, bx * 1.25 + sw, -4 - Math.max(0, sw) * 0.3);
      ctx.stroke();
      ell(ctx, bx * 1.25 + sw, -4, 3, 4.5, R('mid', st), ink, 1.2);
    }
    // almofada de bilro
    ctx.save();
    ctx.translate(0, cy);
    ell(ctx, 0, 0, 52, 26, lace, ink, 2);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, 52, 26, 0, 0, U.TAU);
    ctx.clip();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.7;
    for (let y = -24; y < 26; y += 6) {
      for (let x = -52 + ((y / 6) % 2 ? 3 : 0); x < 52; x += 6) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, U.TAU);
        ctx.stroke();
      }
    }
    ctx.fillStyle = R('red', st);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(0, 4, 30, 12, 0, 0, U.TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = lace;
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(0, 4, 6 + i * 3, 0, U.TAU);
      ctx.stroke();
    }
    ctx.restore();
    // alfinetes
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.1 + i * 0.1);
      const px = Math.cos(a) * 40, py = Math.sin(a) * 18;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py - 8);
      ctx.stroke();
      dot(ctx, px, py - 9, 1.6, R('red', st));
    }
    ctx.restore();
    // corpo da velhinha
    const by = cy - 20;
    ctx.fillStyle = R('mid', st);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-15, by + 16);
    ctx.lineTo(15, by + 16);
    ctx.lineTo(10, by - 12);
    ctx.lineTo(-10, by - 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // xale de renda
    ctx.fillStyle = lace;
    ctx.beginPath();
    ctx.moveTo(-17, by - 12);
    ctx.lineTo(17, by - 12);
    ctx.lineTo(0, by + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ink;
    for (let i = 0; i < 7; i++) dot(ctx, -12 + i * 4, by - 9 + (i % 2) * 2, 0.9, ink);
    // seis braços tecendo
    const weave = pose === 'weave' || pose === 'idle';
    for (let i = 0; i < 6; i++) {
      const s = i < 3 ? -1 : 1;
      const k = i % 3;
      const sx = s * 9, sy = by - 8 + k * 6;
      const wv = weave ? Math.sin(t * 5 + i * 1.3) * 5 : 0;
      let ex = s * (26 + k * 6) + wv, ey = sy + 10 + k * 4 - wv * 0.5;
      if (pose === 'throw') {
        ex = s * (30 + k * 4);
        ey = sy - 14 - k * 5;
      }
      if (pose === 'dazed') {
        ex = s * (20 + k * 3);
        ey = sy + 18;
      }
      limb(ctx, sx, sy, ex, ey, R('mid', st), 2.4, 1.6);
      dot(ctx, ex, ey, 2, R('skin', st), ink, 0.8);
      // linha até a almofada
      ctx.strokeStyle = lace;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex * 0.6, cy);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ell(ctx, ex, ey + 5, 1.4, 3, R('mid', st), ink, 0.8);
    }
    // cabeça
    const hy = by - 22;
    ctx.save();
    ctx.translate(0, hy);
    dot(ctx, 0, 0, 11, R('skin', st), ink, 1.6);
    // coque cheio de agulhas
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.05 + i * 0.1);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 12, -12 + Math.sin(a) * 6);
      ctx.lineTo(Math.cos(a) * 24, -12 + Math.sin(a) * 18);
      ctx.stroke();
      dot(ctx, Math.cos(a) * 24, -12 + Math.sin(a) * 18, 1.3, R('red', st));
    }
    dot(ctx, 0, -12, 8, R('white', st), ink, 1.4);
    ctx.fillStyle = R('white', st);
    ctx.beginPath();
    ctx.arc(0, -2, 11.5, Math.PI * 1.05, Math.PI * 1.95);
    ctx.quadraticCurveTo(0, -6, -11, -1);
    ctx.fill();
    ctx.stroke();
    // óculos na ponta do nariz
    const angry = st.corrupt && pose !== 'dazed';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(s * 4.5, 2, 3.4, 0, U.TAU);
      ctx.stroke();
      if (pose === 'dazed') {
        ctx.beginPath();
        ctx.arc(s * 4.5, 2, 1.8, 0, Math.PI * 1.6);
        ctx.stroke();
      } else if (angry) {
        dot(ctx, s * 4.5, 2.5, 1.3, R('red', st));
      } else {
        ctx.beginPath();
        ctx.arc(s * 4.5, 2.5, 1.4, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
    }
    ctx.beginPath();
    if (angry) {
      ctx.moveTo(-4, 8);
      ctx.lineTo(4, 8);
    } else {
      ctx.arc(0, 6, 3.2, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();
    if (st.talking && Math.floor(t * 10) % 2 === 0) ell(ctx, 0, 8, 2, 1.4, R('red', st));
    ctx.restore();
    if (st.corrupt) {
      for (let i = 0; i < 4; i++) {
        const k = (t * 0.4 + i * 0.25) % 1;
        dot(ctx, -30 + i * 20, cy + 20 + k * 20, 2.5 * (1 - k), R('ink', st));
      }
    }
    ctx.restore();
  };

  // ------------------------------------------------------------------
  // CHEFE 3 — Coronel Papelão (a pé) e a Prensa-Mor
  // ------------------------------------------------------------------
  function coronelFigure(ctx, st, x, y, s = 1) {
    const t = st.t || 0;
    const ink = st._flash || R('ink', st);
    const pap = R('paper', st);
    const card = R('card', st);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const ph = st.phase || 0;
    if (!st.seated) {
      for (const sx of [-1, 1]) {
        const k = st.moving ? Math.max(0, Math.sin(ph + (sx > 0 ? Math.PI : 0))) * 3 : 0;
        limb(ctx, sx * 7, -14, sx * 8, -1 - k, R('linen', st), 4.5);
        ell(ctx, sx * 8 + 1, -1 - k, 4, 2, ink);
      }
    }
    // corpo de caixa
    ctx.fillStyle = card;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.8;
    ctx.fillRect(-17, -46, 34, 34);
    ctx.strokeRect(-17, -46, 34, 34);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-17, -46, 34, 34);
    ctx.clip();
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let i = -17; i < 17; i += 2.4) {
      ctx.moveTo(i, -46);
      ctx.lineTo(i, -12);
    }
    ctx.stroke();
    ctx.restore();
    // colete de linho
    ctx.fillStyle = R('linen', st);
    ctx.beginPath();
    ctx.moveTo(-8, -46);
    ctx.lineTo(0, -24);
    ctx.lineTo(8, -46);
    ctx.fill();
    ctx.stroke();
    dot(ctx, 0, -20, 1.2, ink);
    dot(ctx, 0, -16, 1.2, ink);
    // corrente de relógio
    ctx.strokeStyle = R('gold', st);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10, -26);
    ctx.quadraticCurveTo(-4, -20, 2, -26);
    ctx.stroke();
    // braços
    const wave = st.panic ? Math.sin(t * 20) * 8 : 0;
    limb(ctx, -16, -42, -24, -28 + wave, card, 4.5);
    limb(ctx, 16, -42, 24, st.panic ? -56 - wave : -28, card, 4.5);
    dot(ctx, -24, -27 + wave, 3, R('skin', st), ink, 1);
    dot(ctx, 24, st.panic ? -57 - wave : -27, 3, R('skin', st), ink, 1);
    if (!st.panic) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(24, -28);
      ctx.lineTo(27, -2);
      ctx.stroke();
      dot(ctx, 24, -30, 2.5, R('gold', st));
    }
    // cabeça
    dot(ctx, 0, -58, 12, R('skin', st), ink, 1.6);
    // monóculo e olhos
    for (const sx of [-1, 1]) dot(ctx, sx * 4.5, -60, 1.5, ink);
    ctx.strokeStyle = R('gold', st);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(4.5, -60, 3.6, 0, U.TAU);
    ctx.stroke();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.4;
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      if (st.panic) {
        ctx.moveTo(sx * 7, -66);
        ctx.lineTo(sx * 2, -64);
      } else {
        ctx.moveTo(sx * 8, -64);
        ctx.lineTo(sx * 2, -65.5);
      }
      ctx.stroke();
    }
    // bigodão
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(0, -54);
    ctx.bezierCurveTo(-8, -58, -16, -56, -19, -50 + Math.sin(t * 3) * 1);
    ctx.bezierCurveTo(-14, -53, -8, -51, 0, -52);
    ctx.bezierCurveTo(8, -51, 14, -53, 19, -50 + Math.sin(t * 3) * 1);
    ctx.bezierCurveTo(16, -56, 8, -58, 0, -54);
    ctx.fill();
    if (st.talking && Math.floor(t * 10) % 2 === 0) ell(ctx, 0, -49, 2.6, 1.8, R('red', st));
    if (st.panic) {
      ell(ctx, 0, -48.5, 2.6, 2.6, ink);
      for (const sx of [-1, 1]) {
        ctx.fillStyle = R('blue', st);
        ctx.beginPath();
        ctx.moveTo(sx * 13, -68);
        ctx.quadraticCurveTo(sx * 17, -62, sx * 13, -60);
        ctx.quadraticCurveTo(sx * 9, -62, sx * 13, -68);
        ctx.fill();
      }
    }
    // chapéu-coco
    ell(ctx, 0, -68, 16, 3.5, ink);
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(0, -69, 10, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = R('red', st);
    ctx.fillRect(-10, -71.5, 20, 2.5);
    ctx.restore();
    void pap;
  }
  CR.coronel = function (ctx, st) {
    ctx.save();
    ctx.translate(st.x, st.y);
    shadow(ctx, 20, 6);
    if (st.dir === 'left') ctx.scale(-1, 1);
    coronelFigure(ctx, st, 0, 0, 1);
    ctx.restore();
  };

  CR.prensa = function (ctx, st) {
    const t = st.t || 0;
    const ink = st._flash || R('ink', st);
    const pap = R('paper', st);
    const mid = R('mid', st);
    ctx.save();
    ctx.translate(st.x, st.y);
    shadow(ctx, 80, 18);
    const ph = st.phase || 0;
    const bob = st.moving ? Math.abs(Math.sin(ph)) * -4 : Math.sin(t * 2) * 1.5;
    // pernas mecânicas
    for (const [lx, k] of [[-62, 0], [-30, 1], [30, 0], [62, 1]]) {
      const lift = st.moving ? Math.max(0, Math.sin(ph + k * Math.PI)) * 8 : 0;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(lx * 0.8, -60 + bob);
      ctx.lineTo(lx * 1.15, -34 - lift);
      ctx.lineTo(lx, -4 - lift);
      ctx.stroke();
      ctx.strokeStyle = pap;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = ink;
      ctx.fillRect(lx - 9, -6 - lift, 18, 6);
      dot(ctx, lx * 1.15, -34 - lift, 4, mid, ink, 1.5);
    }
    ctx.translate(0, bob);
    // corpo de ferro
    ctx.fillStyle = ink;
    ctx.fillRect(-70, -128, 140, 72);
    ctx.fillStyle = pap;
    for (let i = 0; i < 12; i++) {
      dot(ctx, -64 + i * 11.6, -123, 1.6, pap);
      dot(ctx, -64 + i * 11.6, -61, 1.6, pap);
    }
    ctx.strokeStyle = pap;
    ctx.lineWidth = 1;
    ctx.strokeRect(-62, -116, 124, 48);
    // letreiro
    ctx.font = G.font(15, 'title');
    ctx.textAlign = 'center';
    ctx.fillStyle = pap;
    ctx.fillText('PRENSA-MOR', 0, -96);
    ctx.font = G.font(9, 'title');
    ctx.fillText('PROPRIEDADE DO CORONEL', 0, -80);
    // válvulas
    const valves = st.valves || [true, true, true];
    for (let i = 0; i < 3; i++) {
      const vx = -44 + i * 44, vy = -60;
      const alive = valves[i];
      const glow = st.exposed && alive ? 0.6 + Math.sin(t * 10) * 0.4 : 0;
      ctx.fillStyle = mid;
      ctx.fillRect(vx - 5, vy - 2, 10, 10);
      if (alive) {
        dot(ctx, vx, vy + 12, 8 + glow * 2, R('red', st), ink, 2);
        ctx.strokeStyle = pap;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(vx - 5, vy + 12);
        ctx.lineTo(vx + 5, vy + 12);
        ctx.moveTo(vx, vy + 7);
        ctx.lineTo(vx, vy + 17);
        ctx.stroke();
      } else {
        ctx.fillStyle = ink;
        Art.blob(ctx, vx, vy + 12, 8, 6, 5, 0.4, i + 3);
        ctx.fill();
      }
    }
    // cabine do Coronel
    if (st.seated !== false) {
      const cst = Object.assign({}, st, { seated: true, moving: false, phase: 0 });
      coronelFigure(ctx, cst, 0, -120, 0.85);
    }
    // parafuso gigante e volante
    ctx.fillStyle = mid;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.fillRect(-58, -170, 12, 44);
    ctx.strokeRect(-58, -170, 12, 44);
    ctx.save();
    ctx.translate(-52, -170);
    ctx.rotate(t * (st.spin || 0.6));
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, U.TAU);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos((i * U.TAU) / 6) * 18, Math.sin((i * U.TAU) / 6) * 18);
    }
    ctx.stroke();
    ctx.restore();
    // chaminé
    ctx.fillStyle = ink;
    ctx.fillRect(46, -162, 14, 36);
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.7 + i / 3) % 1;
      ctx.globalAlpha = (1 - k) * 0.8;
      dot(ctx, 53 + Math.sin(k * 5 + i) * 6, -168 - k * 40, 5 + k * 9, pap, ink, 1);
    }
    ctx.globalAlpha = 1;
    // prato da prensa (frente)
    const plat = st.platen || 0;
    ctx.fillStyle = mid;
    ctx.fillRect(-50, -56 + plat * 40, 100, 10);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(-50, -56 + plat * 40, 100, 10);
    ctx.restore();
  };

  // ------------------------------------------------------------------
  // CHEFE FINAL — A Traça
  // ------------------------------------------------------------------
  const TP = { paper: '#f3ead6', ink: '#1d1712', red: '#c7402a', text: 'rgba(29,23,18,0.5)', dark: '#3b2f26' };
  function wing(ctx, st, s, fore, spread, seed) {
    const L = fore ? 150 : 100;
    const Hh = fore ? 70 : 64;
    ctx.save();
    ctx.scale(s, 1);
    ctx.rotate(fore ? -0.35 * spread : 0.35 * spread);
    ctx.scale(0.55 + 0.45 * spread, 1);
    ctx.beginPath();
    if (fore) {
      ctx.moveTo(4, -6);
      ctx.bezierCurveTo(40, -70, 110, -86, L, -60);
      // borda mordida
      const pts = 7;
      for (let i = 1; i <= pts; i++) {
        const k = i / pts;
        const px = U.lerp(L, 30, k), py = U.lerp(-60, 14, k);
        const bite = U.hash(i, seed) < 0.45 ? 9 : 3;
        ctx.quadraticCurveTo(px + bite, py - bite * 0.2, px, py);
      }
      ctx.lineTo(4, 6);
    } else {
      ctx.moveTo(4, 4);
      ctx.bezierCurveTo(40, 10, 100, 30, L, 58);
      ctx.bezierCurveTo(80, Hh + 26, 40, 70, 10, 26);
    }
    ctx.closePath();
    ctx.fillStyle = st._flash || TP.paper;
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = TP.ink;
    ctx.stroke();
    ctx.save();
    ctx.clip();
    // linhas de texto
    ctx.strokeStyle = TP.text;
    ctx.lineWidth = 1.3;
    const r = U.rng(seed);
    for (let y = -90; y < 100; y += 7) {
      ctx.beginPath();
      let x = 10 + r() * 10;
      while (x < 160) {
        const w = 6 + r() * 16;
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + (r() - 0.5));
        x += w + 4;
      }
      ctx.stroke();
    }
    // nervuras
    ctx.strokeStyle = TP.ink;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = fore ? -1.2 + i * 0.28 : 0.1 + i * 0.25;
      ctx.moveTo(4, 0);
      ctx.quadraticCurveTo(Math.cos(a) * 60, Math.sin(a) * 50, Math.cos(a) * 170, Math.sin(a) * 120);
    }
    ctx.stroke();
    // furos de traça
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    for (let i = 0; i < 4; i++) {
      Art.blob(ctx, 40 + r() * 90, (fore ? -50 : 25) + r() * 40, 4 + r() * 5, 3 + r() * 4, 5, 0.3, seed + i);
      ctx.fill();
    }
    ctx.restore();
    // olho-de-sol na asa
    if (fore) {
      const cx = 88, cy = -38;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = TP.ink;
      for (let i = 0; i < 12; i++) {
        ctx.save();
        ctx.rotate((i * U.TAU) / 12);
        ctx.beginPath();
        ctx.moveTo(14, -3);
        ctx.lineTo(24, 0);
        ctx.lineTo(14, 3);
        ctx.fill();
        ctx.restore();
      }
      dot(ctx, 0, 0, 14, TP.red, TP.ink, 2);
      dot(ctx, 0, 0, 6, TP.ink);
      dot(ctx, -2, -2, 2, TP.paper);
      ctx.restore();
    } else {
      dot(ctx, 60, 42, 9, TP.ink, null);
      dot(ctx, 60, 42, 4, TP.red, null);
    }
    ctx.restore();
  }

  CR.traca = function (ctx, st) {
    const t = st.t || 0;
    const pose = st.pose || 'fly';
    const alt = st.alt != null ? st.alt : 60;
    ctx.save();
    ctx.translate(st.x, st.y);
    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 140 * (1 - alt / 500), 30 * (1 - alt / 500), 0, 0, U.TAU);
    ctx.fill();
    ctx.translate(0, -alt);
    if (st.scale) ctx.scale(st.scale, st.scale);
    if (st.rot) ctx.rotate(st.rot);
    let flap = pose === 'calm' ? 0.15 : 0.5 + 0.5 * Math.sin(t * (pose === 'fly' ? 9 : 4));
    if (pose === 'eat' || pose === 'land') flap = 0.35 + 0.1 * Math.sin(t * 3);
    if (pose === 'hurt') flap = 0.9;
    // asas de trás, depois da frente
    for (const s of [-1, 1]) wing(ctx, st, s, false, flap, 20 + s);
    for (const s of [-1, 1]) wing(ctx, st, s, true, flap, 10 + s);
    // patas
    ctx.strokeStyle = TP.ink;
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 3; i++) {
      for (const s of [-1, 1]) {
        const sw = Math.sin(t * 3 + i + s) * 3;
        ctx.beginPath();
        ctx.moveTo(s * 6, -4 + i * 8);
        ctx.lineTo(s * 20, 8 + i * 8 + sw);
        ctx.lineTo(s * 26, 22 + i * 8 + sw);
        ctx.stroke();
      }
    }
    // abdome segmentado
    for (let i = 5; i >= 0; i--) {
      const yy = 14 + i * 11;
      ell(ctx, 0, yy, 15 - i * 1.6, 8, st._flash || TP.dark, TP.ink, 2);
      ctx.strokeStyle = TP.paper;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let k = -3; k <= 3; k++) {
        ctx.moveTo(k * 3.2, yy - 4);
        ctx.lineTo(k * 3.8, yy + 3);
      }
      ctx.stroke();
    }
    // tórax peludo
    ctx.fillStyle = st._flash || TP.dark;
    Art.blob(ctx, 0, -6, 20, 17, 12, 0.18, 5 + G.boil);
    ctx.fill();
    ctx.strokeStyle = TP.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = TP.paper;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * U.TAU;
      ctx.moveTo(Math.cos(a) * 10, -6 + Math.sin(a) * 8);
      ctx.lineTo(Math.cos(a) * 18, -6 + Math.sin(a) * 15);
    }
    ctx.stroke();
    // cabeça
    const hy = -30;
    dot(ctx, 0, hy, 15, TP.dark, TP.ink, 2);
    // olhos compostos
    for (const s of [-1, 1]) {
      dot(ctx, s * 11, hy - 3, 8, TP.paper, TP.ink, 2);
      ctx.save();
      ctx.beginPath();
      ctx.arc(s * 11, hy - 3, 8, 0, U.TAU);
      ctx.clip();
      Art.hatch(ctx, s * 11 - 8, hy - 11, 16, 16, 2.6, 0.8, 0.7, TP.ink);
      Art.hatch(ctx, s * 11 - 8, hy - 11, 16, 16, 2.6, -0.8, 0.7, TP.ink);
      ctx.restore();
    }
    // o olho de gente
    const open = pose === 'calm' ? 0.1 : st.eyeOpen != null ? st.eyeOpen : 1;
    ctx.save();
    ctx.translate(0, hy + 2);
    ctx.fillStyle = TP.paper;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(0, -9 * open, 8, 0);
    ctx.quadraticCurveTo(0, 9 * open, -8, 0);
    ctx.fill();
    ctx.strokeStyle = TP.ink;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    if (open > 0.3) {
      ctx.save();
      ctx.clip();
      dot(ctx, st.lookX || 0, 0, 4.2, TP.red);
      dot(ctx, st.lookX || 0, 0, 2, TP.ink);
      ctx.restore();
    }
    // lágrima de tinta
    const k = (t * 0.4) % 1;
    ctx.fillStyle = TP.ink;
    ctx.beginPath();
    ctx.moveTo(2, 5);
    ctx.quadraticCurveTo(4, 10 + k * 20, 2, 12 + k * 22);
    ctx.quadraticCurveTo(0, 10 + k * 20, 2, 5);
    ctx.fill();
    ctx.restore();
    // mandíbulas
    const chew = pose === 'eat' ? Math.sin(t * 16) * 0.35 : 0.1;
    ctx.fillStyle = TP.ink;
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(s * 5, hy + 12);
      ctx.rotate(s * (0.3 + chew));
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s * 6, 8, s * 1, 14);
      ctx.lineTo(-s * 1, 4);
      ctx.fill();
      ctx.restore();
    }
    // antenas de pena
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(s * 6, hy - 12);
      ctx.rotate(s * (0.5 + Math.sin(t * 2 + s) * 0.08));
      ctx.strokeStyle = TP.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s * 10, -30, s * 4, -58);
      ctx.stroke();
      ctx.fillStyle = TP.paper;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s * 2, -8);
      ctx.quadraticCurveTo(s * 18, -30, s * 5, -56);
      ctx.quadraticCurveTo(s * 2, -30, s * 2, -8);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const py = -12 - i * 5.5;
        ctx.moveTo(s * 4, py);
        ctx.lineTo(s * (12 - i * 0.6), py - 3);
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  };
})();
