/* PELEJA — utilidades de arte em estilo xilogravura */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const C = G.C;
  const A = (G.Art = {});

  // ------------------------------------------------------------------
  // Papel
  // ------------------------------------------------------------------
  const paperCache = new Map();
  A.paperTex = function (base, negative = false) {
    const key = base + (negative ? 'n' : '');
    if (paperCache.has(key)) return paperCache.get(key);
    const S = 512;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const x = c.getContext('2d');
    x.fillStyle = base;
    x.fillRect(0, 0, S, S);
    const r = U.rng(U.strHash(key));
    const dark = negative ? '255,245,225' : '60,40,20';
    const light = negative ? '0,0,0' : '255,250,235';
    const wrapDraw = (px, py, rad, fn) => {
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        const X = px + ox, Y = py + oy;
        if (X + rad < 0 || X - rad > S || Y + rad < 0 || Y - rad > S) continue;
        fn(X, Y);
      }
    };
    // manchas grandes
    for (let i = 0; i < 46; i++) {
      const px = r() * S, py = r() * S, rad = 30 + r() * 110;
      const a = 0.02 + r() * 0.035;
      const col = r() < 0.6 ? dark : light;
      wrapDraw(px, py, rad, (X, Y) => {
        const g = x.createRadialGradient(X, Y, 0, X, Y, rad);
        g.addColorStop(0, 'rgba(' + col + ',' + a + ')');
        g.addColorStop(1, 'rgba(' + col + ',0)');
        x.fillStyle = g;
        x.fillRect(X - rad, Y - rad, rad * 2, rad * 2);
      });
    }
    // fibras
    x.lineCap = 'round';
    for (let i = 0; i < 420; i++) {
      const px = r() * S, py = r() * S, len = 4 + r() * 16, ang = r() * Math.PI;
      const a = 0.03 + r() * 0.07;
      x.strokeStyle = 'rgba(' + (r() < 0.7 ? dark : light) + ',' + a + ')';
      x.lineWidth = 0.6 + r() * 0.7;
      wrapDraw(px, py, len, (X, Y) => {
        x.beginPath();
        x.moveTo(X, Y);
        x.quadraticCurveTo(X + Math.cos(ang) * len * 0.5 + r() * 3, Y + Math.sin(ang) * len * 0.5 + r() * 3, X + Math.cos(ang) * len, Y + Math.sin(ang) * len);
        x.stroke();
      });
    }
    // pintinhas
    for (let i = 0; i < 3200; i++) {
      const px = r() * S, py = r() * S, s = 0.4 + r() * 1.3;
      x.fillStyle = 'rgba(' + (r() < 0.75 ? dark : light) + ',' + (0.05 + r() * 0.2) + ')';
      x.fillRect(px, py, s, s);
    }
    paperCache.set(key, c);
    return c;
  };

  const patCache = new WeakMap();
  A.pattern = function (ctx, base, negative = false) {
    let m = patCache.get(ctx);
    if (!m) {
      m = new Map();
      patCache.set(ctx, m);
    }
    const key = base + (negative ? 'n' : '');
    let p = m.get(key);
    if (!p) {
      p = ctx.createPattern(A.paperTex(base, negative), 'repeat');
      m.set(key, p);
    }
    return p;
  };

  A.fillPaper = function (ctx, x, y, w, h, base = C.paper, ox = 0, oy = 0, negative = false) {
    const p = A.pattern(ctx, base, negative);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.fillStyle = p;
    ctx.fillRect(x - ox, y - oy, w, h);
    ctx.restore();
  };

  // ------------------------------------------------------------------
  // Traços
  // ------------------------------------------------------------------
  A.jit = function (x, y, seed = 0) {
    if (!G.Save.settings.boil) return 0;
    return (U.hash(Math.round(x * 3), Math.round(y * 3), seed + G.boil * 101) - 0.5);
  };

  // polígono com leve tremor de xilogravura
  A.poly = function (ctx, pts, amp = 0.8, seed = 0, close = true) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 2) {
      const px = pts[i] + A.jit(pts[i], pts[i + 1], seed) * amp;
      const py = pts[i + 1] + A.jit(pts[i + 1], pts[i], seed + 7) * amp;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    if (close) ctx.closePath();
  };

  // blob irregular (pedras, manchas)
  A.blob = function (ctx, cx, cy, rx, ry, bumps = 8, rough = 0.18, seed = 1, rot = 0) {
    ctx.beginPath();
    const n = bumps * 3;
    for (let i = 0; i <= n; i++) {
      const a = rot + (i / n) * U.TAU;
      const k = 1 + (U.noise1((i % n) / 3, seed) - 0.5) * 2 * rough;
      const px = cx + Math.cos(a) * rx * k;
      const py = cy + Math.sin(a) * ry * k;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  // marca de goiva (lente afinada nas pontas)
  A.gouge = function (ctx, x, y, len, ang, w) {
    const c = Math.cos(ang), s = Math.sin(ang);
    const hx = (c * len) / 2, hy = (s * len) / 2;
    const nx = (-s * w) / 2, ny = (c * w) / 2;
    ctx.beginPath();
    ctx.moveTo(x - hx, y - hy);
    ctx.quadraticCurveTo(x + nx * 2, y + ny * 2, x + hx, y + hy);
    ctx.quadraticCurveTo(x - nx * 2, y - ny * 2, x - hx, y - hy);
    ctx.fill();
  };

  A.gouges = function (ctx, x, y, w, h, n, seed, color, len = 8, ang = null, width = 1.6) {
    const r = U.rng(seed);
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const a = ang == null ? r() * Math.PI : ang + (r() - 0.5) * 0.5;
      A.gouge(ctx, x + r() * w, y + r() * h, len * (0.5 + r()), a, width * (0.6 + r() * 0.8));
    }
  };

  // hachura dentro de um retângulo (use com clip)
  A.hatch = function (ctx, x, y, w, h, gap, ang, lw, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    const cx = x + w / 2, cy = y + h / 2;
    const R = Math.hypot(w, h) / 2 + 2;
    const c = Math.cos(ang), s = Math.sin(ang);
    ctx.beginPath();
    for (let d = -R; d <= R; d += gap) {
      const px = cx - s * d, py = cy + c * d;
      ctx.moveTo(px - c * R, py - s * R);
      ctx.lineTo(px + c * R, py + s * R);
    }
    ctx.stroke();
    ctx.restore();
  };

  A.star = function (ctx, x, y, r1, r2, n = 5, rot = -Math.PI / 2) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 === 0 ? r1 : r2;
      const a = rot + (i * Math.PI) / n;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  // ------------------------------------------------------------------
  // Texto
  // ------------------------------------------------------------------
  A.text = function (ctx, s, x, y, o = {}) {
    ctx.save();
    ctx.font = G.font(o.size || 20, o.font || 'body', o.italic ? 'italic' : '');
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'alphabetic';
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.shadow) {
      ctx.fillStyle = o.shadow;
      ctx.fillText(s, x + (o.sx || 2), y + (o.sy || 2));
    }
    if (o.outline) {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = o.outline;
      ctx.lineWidth = o.ow || 4;
      ctx.strokeText(s, x, y);
    }
    ctx.fillStyle = o.color || C.ink;
    if (o.maxW) ctx.fillText(s, x, y, o.maxW);
    else ctx.fillText(s, x, y);
    ctx.restore();
  };

  // linha com trechos *realçados* em vermelho
  A.rich = function (ctx, line, x, y, base, em) {
    const parts = line.split('*');
    let cx = x;
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i]) continue;
      ctx.fillStyle = i % 2 === 1 ? em : base;
      ctx.fillText(parts[i], cx, y);
      cx += ctx.measureText(parts[i]).width;
    }
  };

  // título em "tipo de madeira": letras entalhadas + registro vermelho deslocado
  A.woodTitle = function (text, size, color = C.ink, o = {}) {
    const key = 'wt:' + text + ':' + size + ':' + color + ':' + (o.red || '') + ':' + (o.spacing || 0);
    const meas = document.createElement('canvas').getContext('2d');
    meas.font = G.font(size, 'title');
    const sp = o.spacing || 0;
    const w = Math.ceil(meas.measureText(text).width + sp * text.length + size * 0.5);
    const h = Math.ceil(size * 1.5);
    return G.Cache.get(key, w, h, (x) => {
      const draw = (col, dx, dy) => {
        x.fillStyle = col;
        x.font = G.font(size, 'title');
        x.textBaseline = 'middle';
        let cx = size * 0.25 + dx;
        for (const ch of text) {
          x.fillText(ch, cx, h / 2 + dy);
          cx += x.measureText(ch).width + sp;
        }
      };
      if (o.red) draw(o.red, size * 0.06, size * 0.05);
      const off = document.createElement('canvas');
      off.width = Math.ceil(w * G.RS);
      off.height = Math.ceil(h * G.RS);
      const ox = off.getContext('2d');
      ox.scale(G.RS, G.RS);
      const saved = x;
      // desenha letras no offscreen e entalha
      (function () {
        ox.fillStyle = color;
        ox.font = G.font(size, 'title');
        ox.textBaseline = 'middle';
        let cx = size * 0.25;
        for (const ch of text) {
          ox.fillText(ch, cx, h / 2);
          cx += ox.measureText(ch).width + sp;
        }
        ox.globalCompositeOperation = 'destination-out';
        const r = U.rng(U.strHash(text) + size);
        for (let i = 0; i < text.length * 5; i++) {
          ox.fillStyle = 'rgba(0,0,0,' + (0.55 + r() * 0.45) + ')';
          A.gouge(ox, r() * w, h * 0.2 + r() * h * 0.6, size * (0.12 + r() * 0.25), -0.3 + r() * 0.6, size * 0.035);
        }
        ox.globalCompositeOperation = 'source-over';
      })();
      saved.drawImage(off, 0, 0, w, h);
    });
  };

  A.drawWood = function (ctx, text, x, y, size, color, o = {}) {
    const c = A.woodTitle(text, size, color, o);
    const align = o.align || 'center';
    let dx = x;
    if (align === 'center') dx = x - c.lw / 2;
    else if (align === 'right') dx = x - c.lw;
    ctx.drawImage(c, dx, y - c.lh / 2, c.lw, c.lh);
    return c.lw;
  };

  // ------------------------------------------------------------------
  // Elementos de interface
  // ------------------------------------------------------------------
  A.panel = function (ctx, x, y, w, h, o = {}) {
    const ink = o.ink || C.ink;
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.shadow !== false) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x + 6, y + 6, w, h);
    }
    A.fillPaper(ctx, x, y, w, h, o.fill || C.paper, 0, 0, !!o.negative);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 6.5, y + 6.5, w - 13, h - 13);
    ctx.fillStyle = ink;
    for (const [px, py] of [[x + 6.5, y + 6.5], [x + w - 6.5, y + 6.5], [x + 6.5, y + h - 6.5], [x + w - 6.5, y + h - 6.5]]) {
      ctx.beginPath();
      ctx.moveTo(px, py - 5);
      ctx.lineTo(px + 5, py);
      ctx.lineTo(px, py + 5);
      ctx.lineTo(px - 5, py);
      ctx.closePath();
      ctx.fill();
    }
    if (o.teeth) {
      A.teeth(ctx, x + 12, y + 10, w - 24, 7, ink);
      A.teeth(ctx, x + 12, y + h - 17, w - 24, 7, ink, true);
    }
    ctx.restore();
  };

  // "dente de serra" decorativo
  A.teeth = function (ctx, x, y, w, h, color, flip = false) {
    ctx.fillStyle = color;
    const n = Math.max(2, Math.floor(w / h));
    const step = w / n;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const px = x + i * step;
      if (!flip) {
        ctx.moveTo(px, y);
        ctx.lineTo(px + step / 2, y + h);
        ctx.lineTo(px + step, y);
      } else {
        ctx.moveTo(px, y + h);
        ctx.lineTo(px + step / 2, y);
        ctx.lineTo(px + step, y + h);
      }
    }
    ctx.fill();
  };

  // vinheta ornamental (separador de cordel)
  A.vinheta = function (ctx, cx, y, w, color = C.ink) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, y);
    ctx.lineTo(cx - 14, y);
    ctx.moveTo(cx + 14, y);
    ctx.lineTo(cx + w / 2, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, y - 7);
    ctx.lineTo(cx + 8, y);
    ctx.lineTo(cx, y + 7);
    ctx.lineTo(cx - 8, y);
    ctx.closePath();
    ctx.fill();
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(cx + s * 20, y, 2.5, 0, U.TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + s * (w / 2), y, 3, 0, U.TAU);
      ctx.fill();
    }
    ctx.restore();
  };

  // moldura de página de cordel
  A.pageFrame = function (ctx, color = C.ink, inset = 10) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(inset, inset, G.W - inset * 2, G.H - inset * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(inset + 7, inset + 7, G.W - inset * 2 - 14, G.H - inset * 2 - 14);
    for (const [px, py] of [[inset + 7, inset + 7], [G.W - inset - 7, inset + 7], [inset + 7, G.H - inset - 7], [G.W - inset - 7, G.H - inset - 7]]) {
      A.star(ctx, px, py, 9, 4, 8, 0);
      ctx.fill();
    }
    ctx.restore();
  };

  A.heart = function (ctx, x, y, s, frac = 1, o = {}) {
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.42);
      ctx.bezierCurveTo(x - s * 0.1, y + s * 0.3, x - s * 0.55, y + s * 0.05, x - s * 0.52, y - s * 0.18);
      ctx.bezierCurveTo(x - s * 0.5, y - s * 0.45, x - s * 0.12, y - s * 0.5, x, y - s * 0.22);
      ctx.bezierCurveTo(x + s * 0.12, y - s * 0.5, x + s * 0.5, y - s * 0.45, x + s * 0.52, y - s * 0.18);
      ctx.bezierCurveTo(x + s * 0.55, y + s * 0.05, x + s * 0.1, y + s * 0.3, x, y + s * 0.42);
      ctx.closePath();
    };
    ctx.save();
    path();
    ctx.fillStyle = o.empty || 'rgba(29,23,18,0.25)';
    ctx.fill();
    if (frac > 0) {
      ctx.save();
      path();
      ctx.clip();
      ctx.fillStyle = o.color || C.red;
      ctx.fillRect(x - s, y - s, frac >= 1 ? s * 2 : s, s * 2);
      ctx.fillStyle = 'rgba(255,240,220,0.8)';
      A.gouge(ctx, x - s * 0.25, y - s * 0.18, s * 0.28, -0.8, s * 0.08);
      ctx.restore();
    }
    path();
    ctx.lineWidth = o.lw || 2.2;
    ctx.strokeStyle = o.ink || C.ink;
    ctx.stroke();
    ctx.restore();
  };

  A.keycap = function (ctx, label, x, y, o = {}) {
    ctx.save();
    ctx.font = G.font(o.size || 14, 'title');
    const w = Math.max(o.minW || 22, ctx.measureText(label).width + 12);
    const h = o.h || 22;
    const px = o.align === 'left' ? x : x - w / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    A.rrect(ctx, px + 2, y - h / 2 + 3, w, h, 4);
    ctx.fill();
    ctx.fillStyle = o.fill || C.paperLight;
    A.rrect(ctx, px, y - h / 2, w, h, 4);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = o.ink || C.ink;
    ctx.stroke();
    ctx.fillStyle = o.ink || C.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, px + w / 2, y + 1);
    ctx.restore();
    return w;
  };

  A.rrect = function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // mão apontando (☞) — cursor de menu tipográfico
  A.hand = function (ctx, x, y, s = 1, color = C.ink) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    // punho
    ctx.beginPath();
    ctx.moveTo(-18, -6);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-10, 7);
    ctx.lineTo(-18, 6);
    ctx.closePath();
    ctx.fill();
    // mão
    ctx.beginPath();
    ctx.moveTo(-9, -7);
    ctx.lineTo(10, -7);
    ctx.quadraticCurveTo(14, -7, 14, -4);
    ctx.quadraticCurveTo(14, -1.5, 10, -1.5);
    ctx.lineTo(2, -1.5);
    ctx.lineTo(2, 1);
    ctx.quadraticCurveTo(5, 1, 5, 3.5);
    ctx.quadraticCurveTo(5, 6, 2, 6);
    ctx.lineTo(1, 6);
    ctx.quadraticCurveTo(3, 8, 0, 9);
    ctx.lineTo(-9, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C.paperLight;
    A.gouge(ctx, 3, -4.5, 12, 0, 1.2);
    ctx.restore();
  };

  // ------------------------------------------------------------------
  // Figuras recorrentes
  // ------------------------------------------------------------------
  A.sun = function (ctx, x, y, r, rot = 0, o = {}) {
    const ink = o.ink || C.ink;
    const fill = o.fill || C.red;
    const paper = o.paper || C.paper;
    ctx.save();
    ctx.translate(x, y);
    // raios
    const n = o.rays || 18;
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * U.TAU;
      const long = i % 2 === 0;
      const L = r * (long ? 1.75 : 1.4);
      const w = r * (long ? 0.2 : 0.14);
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(r * 1.05, -w);
      if (long) {
        ctx.lineTo(L, 0);
      } else {
        ctx.quadraticCurveTo(r * 1.25, -w * 1.6, L, 0);
      }
      ctx.lineTo(r * 1.05, w);
      ctx.closePath();
      ctx.fillStyle = long ? ink : fill;
      ctx.fill();
      if (long) {
        ctx.fillStyle = paper;
        A.gouge(ctx, r * 1.3, 0, r * 0.25, 0, r * 0.03);
      }
      ctx.restore();
    }
    // disco
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, U.TAU);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.07);
    ctx.strokeStyle = ink;
    ctx.stroke();
    // anéis entalhados
    ctx.strokeStyle = paper;
    ctx.globalAlpha = 0.6;
    for (let k = 1; k <= 3; k++) {
      ctx.lineWidth = Math.max(1, r * 0.025);
      ctx.beginPath();
      ctx.arc(0, 0, r * (1 - k * 0.2), rot * 2 + k, rot * 2 + k + Math.PI * 1.2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (o.face) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = Math.max(1.5, r * 0.06);
      ctx.lineCap = 'round';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(s * r * 0.32, -r * 0.1, r * 0.13, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, r * 0.2, r * 0.3, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
      ctx.fillStyle = ink;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(s * r * 0.55, r * 0.15, r * 0.06, 0, U.TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  };

  A.inkBlot = function (ctx, x, y, r, seed = 1, color = C.ink, drops = 7) {
    ctx.fillStyle = color;
    A.blob(ctx, x, y, r, r * 0.92, 7, 0.28, seed);
    ctx.fill();
    const rr = U.rng(seed);
    for (let i = 0; i < drops; i++) {
      const a = rr() * U.TAU, d = r * (1.15 + rr() * 0.8), s = r * (0.06 + rr() * 0.14);
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, s, 0, U.TAU);
      ctx.fill();
    }
  };

  A.bunting = function (ctx, x1, y1, x2, y2, n, t, sag = 18, colors) {
    colors = colors || [C.red, C.paperLight, C.yellow, C.blue, C.pink];
    ctx.save();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.2;
    const pt = (k) => {
      const x = U.lerp(x1, x2, k);
      const y = U.lerp(y1, y2, k) + Math.sin(k * Math.PI) * sag;
      return [x, y];
    };
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const [px, py] = pt(i / 20);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n;
      const [px, py] = pt(k);
      const sw = Math.sin(t * 2.2 + i * 1.3) * 3;
      ctx.beginPath();
      ctx.moveTo(px - 6, py);
      ctx.lineTo(px + 6, py);
      ctx.lineTo(px + sw * 0.5, py + 14);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  };

  // ------------------------------------------------------------------
  // Sobreposições de tela
  // ------------------------------------------------------------------
  let vignette = null;
  A.vignette = function (ctx, alpha = 1) {
    if (!vignette || vignette.rs !== G.RS) {
      vignette = G.makeCanvas(G.W, G.H);
      vignette.rs = G.RS;
      const x = vignette.getContext('2d');
      const g = x.createRadialGradient(G.W / 2, G.H / 2, G.H * 0.35, G.W / 2, G.H / 2, G.W * 0.62);
      g.addColorStop(0, 'rgba(20,12,6,0)');
      g.addColorStop(1, 'rgba(20,12,6,0.42)');
      x.fillStyle = g;
      x.fillRect(0, 0, G.W, G.H);
      const r = U.rng(99);
      for (let i = 0; i < 1400; i++) {
        x.fillStyle = 'rgba(30,20,10,' + (0.03 + r() * 0.08) + ')';
        x.fillRect(r() * G.W, r() * G.H, 1, 1);
      }
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(vignette, 0, 0, G.W, G.H);
    ctx.restore();
  };

  A.letterbox = function (ctx, k) {
    if (k <= 0) return;
    const h = 56 * k;
    ctx.fillStyle = C.night;
    ctx.fillRect(0, 0, G.W, h);
    ctx.fillRect(0, G.H - h, G.W, h);
    ctx.fillStyle = C.paperDark;
    ctx.globalAlpha = 0.3 * k;
    ctx.fillRect(0, h - 2, G.W, 1);
    ctx.fillRect(0, G.H - h + 1, G.W, 1);
    ctx.globalAlpha = 1;
  };

  // balão de expressão (! ? … etc.)
  A.emote = function (ctx, x, y, type, t = 0) {
    ctx.save();
    const s = 1 + Math.max(0, 0.3 - t) * 1.5;
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = C.paperLight;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 13, 0, 0, U.TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4, 11);
    ctx.lineTo(-8, 20);
    ctx.lineTo(3, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = type === '!' || type === 'raiva' ? C.red : C.ink;
    ctx.font = G.font(18, 'title');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const txt = { '!': '!', '?': '?', '...': '…', 'nota': '♪', 'coração': '♥', 'raiva': '#', 'suor': '💧' }[type] || type;
    if (type === 'suor') {
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.quadraticCurveTo(7, 3, 0, 6);
      ctx.quadraticCurveTo(-7, 3, 0, -8);
      ctx.fill();
    } else if (type === 'coração') {
      A.heart(ctx, 0, 0, 16, 1, { lw: 1.4 });
    } else ctx.fillText(txt, 0, 2);
    ctx.restore();
  };
})();
