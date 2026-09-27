/* PELEJA — personagens humanos desenhados por código (rig de xilogravura) */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Art = G.Art;
  const SP = (G.Sprites = {});

  const EXTRA = {
    yellow: '#e6c14f', blue: '#6f97ba', pink: '#e39a9a', green: '#7d9651', gold: '#d9a93a',
    straw: '#d8b46a', card: '#b88d5a', skinDark: '#6f4a31', skinMid: '#8a5c3c', skinLight: '#c99b76',
    linen: '#f4ecd8', white: '#f7f1e3', lace: '#fbf6ea',
  };
  function R(c, st) {
    if (st && st._flash && c !== 'shadow' && c !== 'ink') return st._flash;
    if (c == null) return G.Pal.ink;
    if (G.Pal[c] !== undefined) return G.Pal[c];
    if (EXTRA[c] !== undefined) {
      if (G.Pal.negative && (c === 'white' || c === 'linen' || c === 'lace')) return G.Pal.paper;
      return EXTRA[c];
    }
    return c;
  }
  SP.R = R;

  // ------------------------------------------------------------------
  // Fichas dos personagens
  // ------------------------------------------------------------------
  const SPECS = (SP.SPECS = {
    zabele: {
      skin: 'skin', h: 1, w: 1,
      bottom: { type: 'skirt', color: 'ink', pattern: 'zigzag', pc: 'paper' },
      top: { color: 'ink', pattern: 'stitch', pc: 'paper', sleeve: 'paper' },
      hair: { style: 'braid', color: 'ink' },
      hat: { type: 'couro', color: 'ink' },
      face: { lashes: true, cheeks: true },
      acc: ['lenco', 'cordao', 'bolsa'],
      voice: 'zab',
    },
    sabia: {
      skin: 'skinDark', h: 1.17, w: 0.95,
      bottom: { type: 'pants', color: 'mid' },
      top: { color: 'paper', pattern: 'stripes', pc: 'ink', sleeve: 'paper' },
      hair: { style: 'none' },
      hat: { type: 'palha', color: 'straw' },
      face: { glasses: 'escuros', beard: 'branca' },
      acc: ['viola', 'passaro'],
    },
    filo: {
      skin: 'skinMid', h: 0.98, w: 1.3,
      bottom: { type: 'dress', color: 'red', pattern: 'flores', pc: 'paper' },
      top: { color: 'paper', pattern: 'plain', sleeve: 'paper' },
      hair: { style: 'none' },
      hat: { type: 'turbante', color: 'ink' },
      face: { cheeks: true, earrings: true, lashes: true },
      acc: ['avental'],
    },
    candinha: {
      skin: 'skin', h: 0.84, w: 1.05,
      bottom: { type: 'dress', color: 'mid', pattern: 'dots', pc: 'paper' },
      top: { color: 'mid', pattern: 'plain', sleeve: 'mid' },
      hair: { style: 'bun', color: 'white' },
      hat: { type: 'none' },
      face: { glasses: 'redondos', wrinkles: true },
      acc: ['xale', 'bengala', 'cachimbo'],
      stoop: 3,
    },
    virgula: {
      skin: 'skin', h: 1.16, w: 0.82,
      bottom: { type: 'robe', color: 'ink' },
      top: { color: 'ink', pattern: 'buttons', pc: 'paper', sleeve: 'ink' },
      hair: { style: 'none' },
      hat: { type: 'virgula', color: 'ink' },
      face: { mustache: 'caracol' },
      acc: [],
    },
    ze: {
      skin: 'skinMid', h: 0.74, w: 0.95,
      bottom: { type: 'shorts', color: 'mid' },
      top: { color: 'paper', pattern: 'hstripes', pc: 'red', sleeve: 'paper' },
      hair: { style: 'bowl', color: 'ink' },
      hat: { type: 'none' },
      face: { cheeks: true },
      acc: ['rojao'],
    },
    tiao: {
      skin: 'skin', h: 1.06, w: 1.08,
      bottom: { type: 'pants', color: 'mid' },
      top: { color: 'ink', pattern: 'couro', pc: 'paper', sleeve: 'ink' },
      hair: { style: 'short', color: 'ink' },
      hat: { type: 'vaqueiro', color: 'ink' },
      face: { mustache: 'grosso' },
      acc: [],
    },
    tete: {
      skin: 'skin', h: 1.12, w: 0.84,
      bottom: { type: 'dress', color: 'paper', pattern: 'lace', pc: 'ink' },
      top: { color: 'paper', pattern: 'lace', pc: 'ink', sleeve: 'paper' },
      hair: { style: 'bun', color: 'ink' },
      hat: { type: 'none' },
      face: { lashes: true, cheeks: true },
      acc: ['bilros'],
    },
    lala: {
      skin: 'skin', h: 0.9, w: 1.25,
      bottom: { type: 'dress', color: 'mid', pattern: 'lace', pc: 'paper' },
      top: { color: 'mid', pattern: 'lace', pc: 'paper', sleeve: 'mid' },
      hair: { style: 'bun', color: 'ink' },
      hat: { type: 'none' },
      face: { lashes: true, cheeks: true },
      acc: ['xale', 'bilros'],
    },
    anzol: {
      skin: 'skinDark', h: 1, w: 1.1,
      bottom: { type: 'pants', color: 'mid', rolled: true },
      top: { color: 'paper', pattern: 'plain', sleeve: 'paper' },
      hair: { style: 'none' },
      hat: { type: 'palha', color: 'straw', floppy: true },
      face: { beard: 'curta' },
      acc: ['vara'],
    },
    biu: {
      skin: 'card', h: 1.02, w: 1.1,
      bottom: { type: 'pants', color: 'card' },
      top: { color: 'card', pattern: 'box', pc: 'ink', sleeve: 'card' },
      hair: { style: 'none' },
      hat: { type: 'papel', color: 'paper' },
      face: { sad: true },
      acc: ['fuzil'],
    },
    jagunco: {
      skin: 'card', h: 1.04, w: 1.12,
      bottom: { type: 'pants', color: 'card' },
      top: { color: 'card', pattern: 'box', pc: 'ink', sleeve: 'card' },
      hair: { style: 'none' },
      hat: { type: 'papel', color: 'paper' },
      face: { angry: true },
      acc: ['bandoleira'],
    },
    juca: {
      skin: 'skinLight', h: 0.78, w: 0.95,
      bottom: { type: 'shorts', color: 'ink' },
      top: { color: 'paper', pattern: 'suspensorio', pc: 'ink', sleeve: 'paper' },
      hair: { style: 'short', color: 'ink' },
      hat: { type: 'boina', color: 'mid' },
      face: { cheeks: true, freckles: true },
      acc: ['jornal'],
    },
    zefinha: {
      skin: 'skinDark', h: 0.96, w: 1.3,
      bottom: { type: 'dress', color: 'blue', pattern: 'dots', pc: 'paper' },
      top: { color: 'blue', pattern: 'plain', sleeve: 'blue' },
      hair: { style: 'none' },
      hat: { type: 'chef', color: 'white' },
      face: { cheeks: true, lashes: true },
      acc: ['avental'],
    },
    firmino: {
      skin: 'skin', h: 1.1, w: 0.92,
      bottom: { type: 'pants', color: 'linen' },
      top: { color: 'linen', pattern: 'suit', pc: 'ink', sleeve: 'linen' },
      hair: { style: 'wild', color: 'white' },
      hat: { type: 'none' },
      face: { glasses: 'redondos', mustache: 'fino', wrinkles: true },
      acc: ['gravata', 'caderno'],
      stoop: 2,
    },
    luzia: {
      skin: 'skinLight', h: 1, w: 0.95,
      bottom: { type: 'dress', color: 'red', pattern: 'flores', pc: 'paper' },
      top: { color: 'red', pattern: 'plain', sleeve: 'red' },
      hair: { style: 'long', color: 'ink' },
      hat: { type: 'flores', color: 'red' },
      face: { lashes: true, cheeks: true },
      acc: [],
    },
    vendedor: {
      skin: 'skinMid', h: 1, w: 1.1,
      bottom: { type: 'pants', color: 'ink' },
      top: { color: 'paper', pattern: 'plain', sleeve: 'paper' },
      hair: { style: 'short', color: 'ink' },
      hat: { type: 'palha', color: 'straw' },
      face: { mustache: 'grosso' },
      acc: ['avental'],
    },
    moca: {
      skin: 'skinLight', h: 0.97, w: 0.95,
      bottom: { type: 'skirt', color: 'blue', pattern: 'dots', pc: 'paper' },
      top: { color: 'paper', pattern: 'plain', sleeve: 'paper' },
      hair: { style: 'long', color: 'ink' },
      hat: { type: 'flores', color: 'yellow' },
      face: { lashes: true, cheeks: true },
      acc: [],
    },
    menino: {
      skin: 'skinDark', h: 0.72, w: 0.95,
      bottom: { type: 'shorts', color: 'mid' },
      top: { color: 'yellow', pattern: 'plain', sleeve: 'yellow' },
      hair: { style: 'short', color: 'ink' },
      hat: { type: 'none' },
      face: { cheeks: true },
      acc: [],
    },
  });

  // ------------------------------------------------------------------
  // Partes
  // ------------------------------------------------------------------
  function limb(ctx, x1, y1, x2, y2, color, w, inkW) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = G.Pal.ink;
    ctx.lineWidth = w + (inkW || 2.4);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function dot(ctx, x, y, r, fill, stroke, lw = 1.3) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, U.TAU);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.lineWidth = lw;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }
  function ell(ctx, x, y, rx, ry, fill, stroke, lw = 1.4, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, U.TAU);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.lineWidth = lw;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }
  SP.limb = limb;
  SP.dot = dot;
  SP.ell = ell;

  function patternFill(ctx, pat, pc, x, y, w, h, st, seed = 1) {
    const col = R(pc || 'paper', st);
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    switch (pat) {
      case 'zigzag': {
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        const yy = y + h - 4;
        for (let i = 0; i <= 8; i++) {
          const px = x + (i / 8) * w;
          const py = yy + (i % 2 ? -2.5 : 1);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(x, yy - 5);
        ctx.lineTo(x + w, yy - 5);
        ctx.stroke();
        break;
      }
      case 'stitch':
        ctx.setLineDash([1.6, 1.6]);
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + 2, y + h - 1);
        ctx.moveTo(x + w - 2, y + 2);
        ctx.lineTo(x + w - 2, y + h - 1);
        ctx.moveTo(x + 2, y + h - 3);
        ctx.lineTo(x + w - 2, y + h - 3);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      case 'stripes':
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let px = x + 2; px < x + w; px += 3.2) {
          ctx.moveTo(px, y);
          ctx.lineTo(px, y + h);
        }
        ctx.stroke();
        break;
      case 'hstripes':
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let py = y + 3; py < y + h; py += 4) {
          ctx.moveTo(x, py);
          ctx.lineTo(x + w, py);
        }
        ctx.stroke();
        break;
      case 'dots': {
        const r = U.rng(seed);
        for (let i = 0; i < (w * h) / 16; i++) dot(ctx, x + r() * w, y + r() * h, 0.8, col);
        break;
      }
      case 'flores': {
        const r = U.rng(seed + 3);
        for (let i = 0; i < (w * h) / 40; i++) {
          const fx = x + r() * w, fy = y + r() * h;
          for (let k = 0; k < 5; k++) dot(ctx, fx + Math.cos((k * U.TAU) / 5) * 1.6, fy + Math.sin((k * U.TAU) / 5) * 1.6, 0.9, col);
        }
        break;
      }
      case 'lace': {
        ctx.lineWidth = 0.7;
        for (let py = y + 2; py < y + h; py += 4) {
          for (let px = x + ((py / 4) % 2 ? 2 : 0); px < x + w; px += 4) {
            ctx.beginPath();
            ctx.arc(px, py, 1.2, 0, U.TAU);
            ctx.stroke();
          }
        }
        break;
      }
      case 'box':
        ctx.lineWidth = 0.6;
        ctx.globalAlpha *= 0.6;
        ctx.beginPath();
        for (let px = x + 1; px < x + w; px += 2.2) {
          ctx.moveTo(px, y);
          ctx.lineTo(px, y + h);
        }
        ctx.stroke();
        ctx.globalAlpha /= 0.6;
        ctx.fillStyle = R('ink', st);
        ctx.fillRect(x + w * 0.2, y + h * 0.45, w * 0.6, 1.4);
        break;
      case 'couro':
        ctx.setLineDash([1.5, 1.5]);
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y + h);
        ctx.moveTo(x + 1, y + h * 0.35);
        ctx.quadraticCurveTo(x + w / 2, y + h * 0.55, x + w - 1, y + h * 0.35);
        ctx.stroke();
        ctx.setLineDash([]);
        for (let i = 0; i < 3; i++) dot(ctx, x + w / 2, y + 3 + i * 4, 0.9, col);
        break;
      case 'buttons':
        for (let i = 0; i < 4; i++) dot(ctx, x + w / 2, y + 2 + i * 3.6, 0.9, col);
        break;
      case 'suit':
        ctx.lineWidth = 1;
        ctx.strokeStyle = R('ink', st);
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - 3, y);
        ctx.lineTo(x + w / 2, y + h * 0.6);
        ctx.lineTo(x + w / 2 + 3, y);
        ctx.stroke();
        dot(ctx, x + w / 2, y + h * 0.75, 0.8, R('ink', st));
        break;
      case 'suspensorio':
        ctx.strokeStyle = R(pc, st);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 3, y);
        ctx.lineTo(x + 4, y + h);
        ctx.moveTo(x + w - 3, y);
        ctx.lineTo(x + w - 4, y + h);
        ctx.stroke();
        break;
      default:
        break;
    }
  }

  // ------------------------------------------------------------------
  // Rosto (frente)
  // ------------------------------------------------------------------
  function face(ctx, spec, st, hx, hy, hr) {
    const f = spec.face || {};
    const ink = R('ink', st);
    const expr = st.face || (f.sad ? 'sad' : f.angry ? 'angry' : 'normal');
    const blink = (st.t || 0) % 3.7 < 0.12 || expr === 'closed';
    const ey = hy + hr * 0.05;
    const ex = hr * 0.36;
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    ctx.lineCap = 'round';
    if (f.glasses === 'escuros') {
      for (const s of [-1, 1]) ell(ctx, hx + s * ex, ey, 2.6, 2.3, ink);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx - ex + 2.4, ey);
      ctx.lineTo(hx + ex - 2.4, ey);
      ctx.stroke();
      ctx.fillStyle = R('paper', st);
      for (const s of [-1, 1]) dot(ctx, hx + s * ex - 0.8, ey - 0.8, 0.6, R('paper', st));
    } else {
      if (expr === 'happy' || blink) {
        ctx.lineWidth = 1.3;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          if (expr === 'happy') {
            ctx.arc(hx + s * ex, ey + 0.8, 1.7, Math.PI * 1.1, Math.PI * 1.9);
          } else {
            ctx.moveTo(hx + s * ex - 1.6, ey);
            ctx.lineTo(hx + s * ex + 1.6, ey);
          }
          ctx.stroke();
        }
      } else if (expr === 'hurt') {
        ctx.lineWidth = 1.2;
        for (const s of [-1, 1]) {
          const cx = hx + s * ex;
          ctx.beginPath();
          ctx.moveTo(cx + s * 1.6, ey - 1.4);
          ctx.lineTo(cx - s * 1.2, ey);
          ctx.lineTo(cx + s * 1.6, ey + 1.4);
          ctx.stroke();
        }
      } else {
        const big = expr === 'surprised' ? 1.35 : 1;
        for (const s of [-1, 1]) {
          ell(ctx, hx + s * ex, ey, 1.35 * big, 1.9 * big, ink);
          dot(ctx, hx + s * ex - 0.4, ey - 0.7, 0.45, R('paper', st));
        }
      }
      if (f.glasses === 'redondos') {
        ctx.lineWidth = 0.9;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(hx + s * ex, ey, 2.7, 0, U.TAU);
          ctx.stroke();
        }
      }
      if (f.lashes && !blink && expr !== 'happy') {
        ctx.lineWidth = 0.8;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(hx + s * (ex + 1.3), ey - 1.2);
          ctx.lineTo(hx + s * (ex + 2.4), ey - 2.2);
          ctx.stroke();
        }
      }
    }
    // sobrancelhas
    ctx.lineWidth = 1.1;
    const by = ey - 3.4;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      if (expr === 'angry') {
        ctx.moveTo(hx + s * (ex + 2), by - 1);
        ctx.lineTo(hx + s * (ex - 1.8), by + 1.2);
      } else if (expr === 'sad' || expr === 'hurt') {
        ctx.moveTo(hx + s * (ex + 2), by + 1);
        ctx.lineTo(hx + s * (ex - 1.8), by - 0.8);
      } else if (expr === 'surprised') {
        ctx.moveTo(hx + s * (ex + 2), by - 1);
        ctx.quadraticCurveTo(hx + s * ex, by - 2.6, hx + s * (ex - 2), by - 1);
      } else {
        ctx.moveTo(hx + s * (ex + 1.8), by);
        ctx.lineTo(hx + s * (ex - 1.6), by - 0.3);
      }
      ctx.stroke();
    }
    // boca
    const my = hy + hr * 0.52;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (st.talking && Math.floor((st.t || 0) * 10) % 2 === 0) {
      ell(ctx, hx, my, 1.8, 1.4, R('red', st), ink, 1);
    } else if (expr === 'happy') {
      ctx.arc(hx, my - 1.2, 2.4, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    } else if (expr === 'sad' || expr === 'hurt' || expr === 'angry') {
      ctx.arc(hx, my + 1.6, 2, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
    } else if (expr === 'surprised') {
      ell(ctx, hx, my, 1.4, 1.8, ink);
    } else {
      ctx.moveTo(hx - 1.8, my);
      ctx.quadraticCurveTo(hx, my + 0.8, hx + 1.8, my);
      ctx.stroke();
    }
    if (f.cheeks) {
      ctx.globalAlpha *= 0.35;
      for (const s of [-1, 1]) dot(ctx, hx + s * (ex + 1.8), my - 1.6, 1.4, R('red', st));
      ctx.globalAlpha /= 0.35;
    }
    if (f.freckles) {
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) dot(ctx, hx + s * (ex + k * 0.9), my - 2.4 + (k % 2), 0.35, ink);
    }
    if (f.wrinkles) {
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(hx - 3, hy - hr * 0.62);
      ctx.lineTo(hx + 3, hy - hr * 0.62);
      ctx.stroke();
    }
    // bigodes e barbas
    if (f.mustache) {
      ctx.fillStyle = f.mustache === 'fino' ? R('white', st) : ink;
      ctx.strokeStyle = ink;
      if (f.mustache === 'caracol') {
        ctx.lineWidth = 1.2;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(hx, my - 2);
          ctx.quadraticCurveTo(hx + s * 4, my - 3.5, hx + s * 5, my - 1);
          ctx.arc(hx + s * 4.2, my - 0.4, 1, 0, U.TAU * 0.8);
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(hx, my - 2.4);
        ctx.quadraticCurveTo(hx - 4.5, my - 3, hx - 5, my);
        ctx.quadraticCurveTo(hx - 2, my - 1, hx, my - 1.2);
        ctx.quadraticCurveTo(hx + 2, my - 1, hx + 5, my);
        ctx.quadraticCurveTo(hx + 4.5, my - 3, hx, my - 2.4);
        ctx.fill();
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }
    if (f.beard === 'branca') {
      ctx.fillStyle = R('white', st);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx - hr * 0.9, hy + 1);
      ctx.quadraticCurveTo(hx - hr * 0.9, hy + hr * 1.6, hx, hy + hr * 1.9);
      ctx.quadraticCurveTo(hx + hr * 0.9, hy + hr * 1.6, hx + hr * 0.9, hy + 1);
      ctx.quadraticCurveTo(hx + 3, hy + hr * 0.45, hx, hy + hr * 0.4);
      ctx.quadraticCurveTo(hx - 3, hy + hr * 0.45, hx - hr * 0.9, hy + 1);
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let i = -2; i <= 2; i++) {
        ctx.moveTo(hx + i * 2, hy + hr * 0.9);
        ctx.quadraticCurveTo(hx + i * 2.4, hy + hr * 1.3, hx + i * 1.4, hy + hr * 1.6);
      }
      ctx.stroke();
      if (st.talking && Math.floor((st.t || 0) * 10) % 2 === 0) ell(ctx, hx, hy + hr * 0.62, 1.8, 1.2, ink);
    } else if (f.beard === 'curta') {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(hx - hr * 0.85, hy + 1);
      ctx.quadraticCurveTo(hx, hy + hr * 1.35, hx + hr * 0.85, hy + 1);
      ctx.quadraticCurveTo(hx, hy + hr * 0.75, hx - hr * 0.85, hy + 1);
      ctx.fill();
    }
    if (f.earrings) {
      ctx.strokeStyle = R('gold', st);
      ctx.lineWidth = 1.3;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(hx + s * hr * 0.98, hy + hr * 0.45, 2.3, 0, U.TAU);
        ctx.stroke();
      }
    }
  }

  // ------------------------------------------------------------------
  // Cabelo e chapéus
  // ------------------------------------------------------------------
  function hairFront(ctx, spec, st, hx, hy, hr, view) {
    const h = spec.hair || {};
    if (!h.style || h.style === 'none') return;
    const col = R(h.color || 'ink', st);
    const ink = R('ink', st);
    ctx.fillStyle = col;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.2;
    if (view === 'back') {
      ctx.beginPath();
      if (h.style === 'wild') {
        // cabeleira espetada vista de trás
        const n = 16;
        for (let i = 0; i <= n; i++) {
          const a = (i / n) * U.TAU;
          const rr = hr + (i % 2 ? 1 : 4.5 + Math.sin((st.t || 0) * 3 + i) * 0.8);
          const px = hx + Math.cos(a) * rr, py = hy + Math.sin(a) * rr * 0.95;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
      } else {
        ctx.arc(hx, hy, hr + 0.8, 0, U.TAU);
      }
      ctx.fill();
      ctx.stroke();
      if (h.style === 'wild') {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (let i = -2; i <= 2; i++) {
          ctx.moveTo(hx + i * 2.4, hy - hr * 0.7);
          ctx.lineTo(hx + i * 3.2, hy + hr * 0.5);
        }
        ctx.stroke();
        return;
      }
      if (h.style === 'bun') dot(ctx, hx, hy - hr * 0.4, hr * 0.5, col, ink);
      if (h.style === 'long') {
        ctx.beginPath();
        ctx.moveTo(hx - hr, hy);
        ctx.lineTo(hx - hr * 0.9, hy + hr * 2);
        ctx.lineTo(hx + hr * 0.9, hy + hr * 2);
        ctx.lineTo(hx + hr, hy);
        ctx.fill();
        ctx.stroke();
      }
      ctx.strokeStyle = R('paper', st);
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(hx, hy - hr * 0.8);
      ctx.lineTo(hx, hy + hr * 0.4);
      ctx.stroke();
      return;
    }
    switch (h.style) {
      case 'braid':
      case 'short':
      case 'long':
      case 'bun':
        ctx.beginPath();
        ctx.arc(hx, hy, hr + 0.8, Math.PI * 1.02, Math.PI * 1.98);
        ctx.quadraticCurveTo(hx + hr * 0.4, hy - hr * 0.55, hx, hy - hr * 0.45);
        ctx.quadraticCurveTo(hx - hr * 0.4, hy - hr * 0.55, hx - hr - 0.8, hy);
        ctx.fill();
        ctx.stroke();
        if (h.style === 'long') {
          for (const s of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(hx + s * (hr + 0.5), hy - 2);
            ctx.quadraticCurveTo(hx + s * (hr + 3), hy + hr, hx + s * (hr + 1), hy + hr * 1.8);
            ctx.lineTo(hx + s * (hr - 2.5), hy + hr * 1.2);
            ctx.lineTo(hx + s * (hr - 1), hy);
            ctx.fill();
            ctx.stroke();
          }
        }
        if (h.style === 'bun') dot(ctx, hx, hy - hr - 2.5, hr * 0.45, col, ink);
        break;
      case 'bowl':
        ctx.beginPath();
        ctx.arc(hx, hy, hr + 1.2, Math.PI, 0);
        ctx.lineTo(hx + hr + 1.2, hy - hr * 0.1);
        ctx.lineTo(hx - hr - 1.2, hy - hr * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = R('paper', st);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        for (let i = -3; i <= 3; i++) {
          ctx.moveTo(hx + i * 2.2, hy - hr * 0.2);
          ctx.lineTo(hx + i * 2.6, hy - hr);
        }
        ctx.stroke();
        break;
      case 'wild': {
        ctx.beginPath();
        const n = 11;
        for (let i = 0; i <= n; i++) {
          const a = Math.PI + (i / n) * Math.PI;
          const rr = hr + (i % 2 ? 2 : 6 + Math.sin((st.t || 0) * 3 + i) * 0.8);
          const px = hx + Math.cos(a) * rr, py = hy - 1 + Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(px, py + 4);
          else ctx.lineTo(px, py);
        }
        ctx.lineTo(hx + hr, hy + 3);
        ctx.quadraticCurveTo(hx, hy - hr * 0.5, hx - hr, hy + 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }
      default:
        break;
    }
  }

  function hat(ctx, spec, st, hx, hy, hr, view) {
    const hs = spec.hat || {};
    if (!hs.type || hs.type === 'none') return;
    const col = R(hs.color || 'ink', st);
    const ink = R('ink', st);
    const pap = R('paper', st);
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = ink;
    ctx.fillStyle = col;
    const top = hy - hr;
    switch (hs.type) {
      case 'couro': {
        // copa
        ell(ctx, hx, top + 2, hr * 0.95, hr * 0.62, col, ink);
        if (view === 'side') break;
        if (view === 'back') {
          ell(ctx, hx, top + 3.5, hr * 1.55, hr * 0.42, col, ink);
          ctx.fillStyle = pap;
          for (let i = -2; i <= 2; i++) dot(ctx, hx + i * 4, top + 4.5, 0.7, pap);
          break;
        }
        // aba dobrada em meia-lua
        ctx.beginPath();
        ctx.arc(hx, top + 5, hr * 1.55, Math.PI * 1.08, Math.PI * 1.92);
        ctx.arc(hx, top + 7, hr * 0.95, Math.PI * 1.85, Math.PI * 1.15, true);
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.fill();
        ctx.stroke();
        // estrela e tachas
        ctx.fillStyle = pap;
        Art.star(ctx, hx, top - 3.4, 3.3, 1.5, 6);
        ctx.fill();
        for (let i = 0; i < 7; i++) {
          const a = Math.PI * (1.15 + (i / 6) * 0.7);
          dot(ctx, hx + Math.cos(a) * hr * 1.3, top + 5 + Math.sin(a) * hr * 1.3, 0.6, pap);
        }
        break;
      }
      case 'palha': {
        const flop = hs.floppy ? 2 : 0;
        ell(ctx, hx, top + 3 + flop, hr * 1.9, hr * 0.55 + flop * 0.5, col, ink);
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(hx, top + 3 + flop, hr * 1.9, hr * 0.55 + flop * 0.5, 0, 0, U.TAU);
        ctx.clip();
        ctx.strokeStyle = ink;
        ctx.globalAlpha *= 0.35;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        for (let i = -6; i <= 6; i++) {
          ctx.moveTo(hx + i * 3, top - 5);
          ctx.lineTo(hx + i * 3 + 3, top + 10);
        }
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(hx - hr * 0.85, top + 3);
        ctx.quadraticCurveTo(hx - hr * 0.8, top - hr * 0.75, hx, top - hr * 0.8);
        ctx.quadraticCurveTo(hx + hr * 0.8, top - hr * 0.75, hx + hr * 0.85, top + 3);
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = hs.band ? R(hs.band, st) : ink;
        ctx.fillRect(hx - hr * 0.84, top - 0.5, hr * 1.68, 2.2);
        break;
      }
      case 'turbante': {
        const layers = 4;
        for (let i = 0; i < layers; i++) {
          const yy = top + 2 - i * 3.6;
          ell(ctx, hx + (i % 2 ? 1 : -1), yy, hr * (1.1 - i * 0.08), 3.4, i % 2 ? R('red', st) : col, ink, 1);
        }
        ctx.fillStyle = pap;
        for (let i = 0; i < 6; i++) dot(ctx, hx - 7 + i * 2.8, top + 1 - (i % 2) * 4, 0.7, pap);
        // nó
        ell(ctx, hx + hr * 0.6, top - 9, 3, 2.2, R('red', st), ink, 1, -0.5);
        ell(ctx, hx + hr * 0.9, top - 11, 2.2, 1.5, R('red', st), ink, 1, 0.6);
        break;
      }
      case 'virgula': {
        ctx.beginPath();
        ctx.arc(hx, top - 2, hr * 0.85, 0, U.TAU);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hx + hr * 0.7, top + 0);
        ctx.quadraticCurveTo(hx + hr * 1.3, top + 6, hx + hr * 0.6, top + 14);
        ctx.quadraticCurveTo(hx + hr * 0.75, top + 6, hx + hr * 0.1, top + 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = pap;
        Art.gouge(ctx, hx - 2, top - 5, 5, -0.6, 1);
        ell(ctx, hx, top + 4, hr * 1.25, 2.2, col, ink);
        break;
      }
      case 'boina':
        ell(ctx, hx, top + 1, hr * 1.1, hr * 0.55, col, ink);
        ell(ctx, hx + (view === 'side' ? 5 : 0), top + 4, hr * 0.8, 2, ink);
        dot(ctx, hx, top - 4, 1.2, ink);
        break;
      case 'papel': {
        ctx.beginPath();
        ctx.moveTo(hx - hr * 1.3, top + 4);
        ctx.lineTo(hx, top - hr * 1.1);
        ctx.lineTo(hx + hr * 1.3, top + 4);
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = ink;
        ctx.globalAlpha *= 0.5;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          ctx.moveTo(hx - 5 + i, top - 1 + i * 2);
          ctx.lineTo(hx + 5 - i, top - 1 + i * 2);
        }
        ctx.stroke();
        ctx.globalAlpha /= 0.5;
        ctx.fillStyle = ink;
        ctx.fillRect(hx - hr * 1.3, top + 2.5, hr * 2.6, 2);
        break;
      }
      case 'coco':
        ell(ctx, hx, top + 3, hr * 1.35, 2.6, col, ink);
        ctx.beginPath();
        ctx.arc(hx, top + 2, hr * 0.9, Math.PI, 0);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.stroke();
        break;
      case 'vaqueiro':
        ell(ctx, hx, top + 3, hr * 1.6, hr * 0.5, col, ink);
        ctx.beginPath();
        ctx.arc(hx, top + 2, hr * 0.85, Math.PI, 0);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = pap;
        ctx.setLineDash([1.4, 1.4]);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(hx, top + 3, hr * 1.35, hr * 0.35, 0, 0, U.TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        if (view !== 'back') {
          ctx.strokeStyle = ink;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(hx - hr, top + 4);
          ctx.quadraticCurveTo(hx, hy + hr * 1.3, hx + hr, top + 4);
          ctx.stroke();
        }
        break;
      case 'chef':
        ctx.fillStyle = col;
        ctx.fillRect(hx - hr * 0.8, top - 5, hr * 1.6, 7);
        ctx.strokeRect(hx - hr * 0.8, top - 5, hr * 1.6, 7);
        for (const s of [-1, 0, 1]) dot(ctx, hx + s * 4.5, top - 8, 4.2, col, ink, 1);
        break;
      case 'flores':
        for (const [dx, dy, c] of [[-hr * 0.7, -hr * 0.6, col], [-hr * 0.2, -hr * 0.95, R('paper', st)], [hr * 0.5, -hr * 0.75, col]]) {
          for (let k = 0; k < 5; k++) dot(ctx, hx + dx + Math.cos((k * U.TAU) / 5) * 2, hy + dy + Math.sin((k * U.TAU) / 5) * 2, 1.4, c, ink, 0.5);
          dot(ctx, hx + dx, hy + dy, 0.9, R('gold', st));
        }
        break;
      default:
        break;
    }
  }

  // trança com fita vermelha
  function braid(ctx, st, x0, y0, ang, len = 18) {
    const ink = R('ink', st);
    const pap = R('paper', st);
    const n = 5;
    let px = x0, py = y0;
    const t = st.t || 0;
    for (let i = 0; i < n; i++) {
      const a = ang + Math.sin(t * 3 + i * 0.7) * 0.08 * i;
      const nx = px + Math.cos(a) * (len / n);
      const ny = py + Math.sin(a) * (len / n);
      ell(ctx, (px + nx) / 2, (py + ny) / 2, 2.9 - i * 0.25, len / n / 1.6, ink, null, 1, a - Math.PI / 2);
      ctx.strokeStyle = pap;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo((px + nx) / 2 - 1.6, (py + ny) / 2);
      ctx.lineTo((px + nx) / 2 + 1.6, (py + ny) / 2 + 1);
      ctx.stroke();
      px = nx;
      py = ny;
    }
    // fita
    const red = R('red', st);
    ctx.fillStyle = red;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.8;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + s * 4.5, py - 2.5);
      ctx.lineTo(px + s * 4.5, py + 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - 2, py + 6 + Math.sin(t * 5) * 1);
    ctx.moveTo(px, py);
    ctx.lineTo(px + 2, py + 6 + Math.cos(t * 5) * 1);
    ctx.strokeStyle = red;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // ------------------------------------------------------------------
  // Acessórios
  // ------------------------------------------------------------------
  function drawViola(ctx, st, x, y, rot, s = 1) {
    const ink = R('ink', st);
    const pap = R('paper', st);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s, s);
    // braço
    ctx.fillStyle = ink;
    ctx.fillRect(-1.5, -26, 3, 22);
    ctx.fillRect(-3, -31, 6, 6);
    ctx.fillStyle = pap;
    for (let i = 0; i < 4; i++) dot(ctx, i % 2 ? 3.8 : -3.8, -30 + i * 1.5, 0.7, pap);
    // corpo (forma de 8)
    ctx.fillStyle = R('mid', st);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(0, -2, 5.5, 5, 0, 0, U.TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 6, 7.5, 6.5, 0, 0, U.TAU);
    ctx.fill();
    ctx.stroke();
    dot(ctx, 0, 1.5, 2.4, ink);
    ctx.strokeStyle = pap;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(0, 1.5, 3.3, 0, U.TAU);
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.fillRect(-3, 8, 6, 1.6);
    ctx.restore();
  }
  SP.viola = drawViola;

  function drawBird(ctx, st, x, y, facing = 1) {
    const ink = R('ink', st);
    const t = st.t || 0;
    const hop = Math.max(0, Math.sin(t * 4.1)) > 0.97 ? -2 : 0;
    ctx.save();
    ctx.translate(x, y + hop);
    ctx.scale(facing, 1);
    ell(ctx, 0, 0, 4.2, 3, ink);
    // peito vermelho (sabiá-laranjeira)
    ctx.fillStyle = R('red', st);
    ctx.beginPath();
    ctx.ellipse(1.5, 1, 2.4, 2, 0.3, 0, U.TAU);
    ctx.fill();
    dot(ctx, 3.8, -2.4, 2.2, ink);
    dot(ctx, 4.4, -2.9, 0.5, R('paper', st));
    ctx.fillStyle = R('gold', st);
    ctx.beginPath();
    ctx.moveTo(5.8, -2.6);
    ctx.lineTo(8, -2);
    ctx.lineTo(5.8, -1.6);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(-3.6, -0.5);
    ctx.lineTo(-8, -2 + Math.sin(t * 6) * 0.8);
    ctx.lineTo(-3.6, 1.5);
    ctx.fill();
    ctx.restore();
  }
  SP.bird = drawBird;

  // ------------------------------------------------------------------
  // Humanoide
  // ------------------------------------------------------------------
  SP.humanoid = function (ctx, specOrId, st) {
    const spec = typeof specOrId === 'string' ? SPECS[specOrId] : specOrId;
    if (!spec) return;
    const dir = st.dir || 'down';
    const view = dir === 'up' ? 'back' : dir === 'down' ? 'front' : 'side';
    const H = spec.h || 1;
    const Wd = spec.w || 1;
    const t = st.t || 0;
    const moving = !!st.moving;
    const ph = st.phase || 0;
    const pose = st.pose || 'idle';
    const ink = R('ink', st);
    const pap = R('paper', st);
    const skin = R(spec.skin || 'skin', st);
    const acc = spec.acc || [];
    const bot = spec.bottom || { type: 'pants', color: 'mid' };
    const top = spec.top || { color: 'paper' };

    ctx.save();
    ctx.translate(st.x || 0, st.y || 0);
    if (st.alpha != null) ctx.globalAlpha *= st.alpha;

    // sombra
    if (!st.noShadow) {
      ctx.fillStyle = 'rgba(20,12,6,0.22)';
      if (G.Pal.negative) ctx.fillStyle = 'rgba(255,245,230,0.12)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 13 * Wd, 4.5, 0, 0, U.TAU);
      ctx.fill();
    }
    if (st.scale) ctx.scale(st.scale, st.scale);
    if (pose === 'lie') {
      ctx.translate(-4, -4);
      ctx.rotate(-Math.PI / 2);
    }
    if (dir === 'left') ctx.scale(-1, 1);
    if (st.lift) ctx.translate(0, -st.lift);

    let bob = moving ? -Math.abs(Math.sin(ph)) * 1.7 : Math.sin(t * 2.1 + (spec.seed || 0)) * 0.5;
    let lower = 0;
    if (pose === 'kneel') lower = 9 * H;
    if (pose === 'sit') lower = 7 * H;
    if (pose === 'stamp') lower = 6 * H;
    const stoop = (spec.stoop || 0) + (pose === 'sad' ? 1.5 : 0);
    const hipY = -26 * H + lower + bob * 0.5;
    const shY = -38.5 * H + lower + bob + stoop * 0.5;
    const hr = 9.3 * Math.min(1.1, 0.75 + H * 0.25);
    const headY = -48.5 * H + lower + bob + stoop + (pose === 'sad' ? 1.5 : 0);
    const headX = view === 'side' ? 1 + stoop * 0.6 : 0;
    const sw = 8 * Wd; // meia largura dos ombros
    const ww = 6.4 * Wd; // meia largura da cintura

    // ----- trança atrás (frente/lado)
    const hasBraid = spec.hair && spec.hair.style === 'braid';
    const swing = moving ? 0.35 : 0;
    if (hasBraid && view === 'front') {
      braid(ctx, st, headX - 5, headY + 3, Math.PI / 2 + 0.55 + Math.sin(t * 2.4) * 0.06, 16 * H);
    }
    if (hasBraid && view === 'side') {
      braid(ctx, st, headX - hr * 0.8, headY + 1, Math.PI / 2 + 0.35 + swing + Math.sin(t * 2.6) * 0.08, 20 * H);
    }

    // ----- braço de trás (lado)
    const armSwing = moving ? Math.sin(ph) * 5 : 0;
    const armLen = 12 * H;
    const sleeve = R(top.sleeve || top.color, st);
    if (view === 'side' && pose !== 'lie') {
      const ax = headX - 1, ay = shY + 1.5;
      limb(ctx, ax, ay, ax - armSwing, ay + armLen, R(top.sleeve || top.color, st), 3.4);
      dot(ctx, ax - armSwing, ay + armLen + 1, 2.2, skin, ink, 1);
    }

    // ----- pernas
    const legTop = -13 * H + lower;
    if (pose !== 'kneel' && pose !== 'sit') {
      const legCol = bot.type === 'pants' ? R(bot.color, st) : skin;
      if (view === 'side') {
        const s1 = moving ? Math.sin(ph) * 5 : 0;
        for (const s of [1, -1]) {
          const fx = s * s1;
          limb(ctx, 0, legTop + (bot.type === 'pants' ? -10 * H : 0), fx, -1.5, legCol, 3.6);
          ell(ctx, fx + 1.8, -1, 3.8, 1.9, ink);
        }
      } else {
        const l1 = moving ? Math.max(0, Math.sin(ph)) * 3 : 0;
        const l2 = moving ? Math.max(0, -Math.sin(ph)) * 3 : 0;
        const lx = 3.6 * Wd;
        limb(ctx, -lx, legTop + (bot.type === 'pants' ? -10 * H : 0), -lx, -1.5 - l1, legCol, 3.8);
        limb(ctx, lx, legTop + (bot.type === 'pants' ? -10 * H : 0), lx, -1.5 - l2, legCol, 3.8);
        ell(ctx, -lx, -1 - l1, 2.9, 1.9, ink);
        ell(ctx, lx, -1 - l2, 2.9, 1.9, ink);
        if (bot.rolled) {
          ctx.fillStyle = pap;
          ctx.fillRect(-lx - 2.5, -7 - l1, 5, 2);
          ctx.fillRect(lx - 2.5, -7 - l2, 5, 2);
        }
      }
    }

    // ----- parte de baixo
    {
      const bc = R(bot.color, st);
      ctx.fillStyle = bc;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
      const sway = moving ? Math.sin(ph) * 1.2 : Math.sin(t * 1.5) * 0.3;
      const kneelSpread = pose === 'kneel' || pose === 'sit' ? 3 : 0;
      let hemY, hemW;
      if (bot.type === 'skirt') {
        hemY = -11.5 * H + lower * 0.3;
        hemW = 11 * Wd + kneelSpread;
      } else if (bot.type === 'dress') {
        hemY = -3 * H + lower * 0.1;
        hemW = 12 * Wd + kneelSpread;
      } else if (bot.type === 'robe') {
        hemY = -5 * H;
        hemW = 9.5 * Wd;
      } else if (bot.type === 'shorts') {
        hemY = -16 * H + lower;
        hemW = 8 * Wd;
      } else {
        hemY = -12 * H + lower;
        hemW = 7.5 * Wd;
      }
      if (view === 'side') hemW *= 0.72;
      if (bot.type === 'pants' || bot.type === 'shorts') {
        ctx.beginPath();
        ctx.moveTo(-ww, hipY);
        ctx.lineTo(ww, hipY);
        ctx.lineTo(hemW * 0.95, hemY + 2);
        ctx.lineTo(-hemW * 0.95, hemY + 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        const topY = bot.type === 'robe' ? shY + 3 : hipY;
        const topW = bot.type === 'robe' ? sw * 0.95 : ww;
        ctx.beginPath();
        ctx.moveTo(-topW, topY);
        ctx.lineTo(topW, topY);
        ctx.quadraticCurveTo(hemW * 0.9, (topY + hemY) / 2, hemW + sway, hemY);
        ctx.quadraticCurveTo(sway, hemY + 2.5, -hemW + sway, hemY);
        ctx.quadraticCurveTo(-hemW * 0.9, (topY + hemY) / 2, -topW, topY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (bot.pattern) {
          ctx.save();
          ctx.clip();
          patternFill(ctx, bot.pattern, bot.pc, -hemW - 2, topY, hemW * 2 + 4, hemY - topY + 2, st, 5);
          ctx.restore();
        }
      }
    }

    // ----- tronco
    if (!(spec.bottom && spec.bottom.type === 'robe')) {
      ctx.fillStyle = R(top.color, st);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
      const tw = view === 'side' ? 0.72 : 1;
      ctx.beginPath();
      ctx.moveTo(-sw * tw + headX * 0.3, shY);
      ctx.lineTo(sw * tw + headX * 0.3, shY);
      ctx.lineTo(ww * tw, hipY + 1);
      ctx.lineTo(-ww * tw, hipY + 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (top.pattern && view !== 'back') {
        ctx.save();
        ctx.clip();
        patternFill(ctx, top.pattern, top.pc, -sw * tw, shY, sw * tw * 2, hipY - shY + 1, st, 9);
        ctx.restore();
      }
      if (top.pattern === 'stitch' && view === 'front') {
        // blusa aparecendo no decote
        ctx.fillStyle = sleeve;
        ctx.beginPath();
        ctx.moveTo(-3, shY);
        ctx.lineTo(0, shY + 6);
        ctx.lineTo(3, shY);
        ctx.fill();
      }
    } else if (view !== 'back') {
      patternFill(ctx, top.pattern, top.pc, -sw, shY, sw * 2, hipY - shY, st, 9);
    }

    // ----- acessórios do corpo (frente)
    if (view !== 'back') {
      if (acc.includes('avental')) {
        ctx.fillStyle = pap;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const aw = view === 'side' ? 4 : 6.5 * Wd;
        ctx.moveTo(-aw + (view === 'side' ? 5 : 0), hipY);
        ctx.lineTo(aw + (view === 'side' ? 5 : 0), hipY);
        ctx.lineTo(aw * 1.2 + (view === 'side' ? 5 : 0), hipY + 15 * H);
        ctx.lineTo(-aw * 1.2 + (view === 'side' ? 5 : 0), hipY + 15 * H);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      if (acc.includes('cordao') && view === 'front') {
        ctx.strokeStyle = pap;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-sw + 1, shY + 1);
        ctx.lineTo(ww - 0.5, hipY);
        ctx.stroke();
        ctx.fillStyle = R('red', st);
        for (let k = 1; k <= 3; k++) {
          const px = U.lerp(-sw + 1, ww - 0.5, k / 4), py = U.lerp(shY + 1, hipY, k / 4);
          ctx.fillRect(px - 0.9, py - 2, 1.8, 4);
        }
      }
      if (acc.includes('bandoleira')) {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-sw, shY);
        ctx.lineTo(ww, hipY);
        if (view === 'front') {
          ctx.moveTo(sw, shY);
          ctx.lineTo(-ww, hipY);
        }
        ctx.stroke();
      }
      if (acc.includes('xale')) {
        ctx.fillStyle = spec === SPECS.lala ? pap : R('ink', st);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-sw - 1.5, shY - 1);
        ctx.lineTo(sw + 1.5, shY - 1);
        ctx.lineTo(0, shY + 12 * H);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = spec === SPECS.lala ? ink : pap;
        for (let i = 0; i < 5; i++) dot(ctx, -5 + i * 2.5, shY + 2 + (i % 2) * 2, 0.6, ctx.fillStyle);
      }
      if (acc.includes('gravata') && view === 'front') {
        ctx.fillStyle = R('red', st);
        ctx.beginPath();
        ctx.moveTo(0, shY + 1.5);
        ctx.lineTo(-3.5, shY - 0.5);
        ctx.lineTo(-3.5, shY + 3.5);
        ctx.closePath();
        ctx.moveTo(0, shY + 1.5);
        ctx.lineTo(3.5, shY - 0.5);
        ctx.lineTo(3.5, shY + 3.5);
        ctx.closePath();
        ctx.fill();
      }
      if (acc.includes('viola') && pose !== 'lie') {
        if (view === 'front') drawViola(ctx, st, 1, hipY - 3, pose === 'play' ? -0.95 : -0.75);
        else drawViola(ctx, st, 4, hipY - 4, -1.25, 0.9);
      }
    }

    // ----- braços
    if (pose !== 'lie') {
      const drawArm = (sx, hxp, hyp) => {
        limb(ctx, sx, shY + 1.5, hxp, hyp, sleeve, 3.6);
        dot(ctx, hxp, hyp + 0.5, 2.3, skin, ink, 1);
      };
      const sideX = view === 'side' ? headX : 0;
      if (view === 'side') {
        // braço da frente
        let hx2 = sideX + armSwing, hy2 = shY + 1.5 + armLen;
        if (pose === 'attack' || pose === 'point') {
          hx2 = sideX + 13;
          hy2 = shY + 3;
        } else if (pose === 'cheer') {
          hx2 = sideX + 4;
          hy2 = shY - 12;
        } else if (pose === 'stamp') {
          hx2 = sideX + 9;
          hy2 = -3;
        } else if (pose === 'play') {
          hx2 = sideX + 6;
          hy2 = hipY - 2;
        } else if (pose === 'give') {
          hx2 = sideX + 11;
          hy2 = shY + 6;
        }
        drawArm(sideX + 1, hx2, hy2);
      } else {
        const back = view === 'back';
        const a = moving ? Math.sin(ph) * 2 : 0;
        let L = [-sw - 1.5, shY + 1.5 + armLen - a];
        let Rr = [sw + 1.5, shY + 1.5 + armLen + a];
        if (pose === 'cheer') {
          L = [-sw - 5, shY - 12];
          Rr = [sw + 5, shY - 12];
        } else if (pose === 'attack' || pose === 'point') {
          Rr = back ? [sw + 2, shY - 12] : [sw + 4, shY + 12];
        } else if (pose === 'stamp') {
          L = [-5, -2];
          Rr = [5, -2];
        } else if (pose === 'play') {
          L = [-sw + 3, hipY - 6];
          Rr = [sw - 1, hipY + 1];
        } else if (pose === 'give') {
          Rr = [sw - 2, shY + 9];
          L = [-sw + 3, shY + 9];
        } else if (pose === 'hands') {
          L = [-2, hipY - 2];
          Rr = [2, hipY - 2];
        }
        if (acc.includes('bengala') && pose === 'idle') Rr = [sw + 3, shY + armLen];
        drawArm(-sw + 0.5, L[0], L[1]);
        drawArm(sw - 0.5, Rr[0], Rr[1]);
        if (acc.includes('bengala') && view !== 'side') {
          ctx.strokeStyle = ink;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(Rr[0], Rr[1] - 2);
          ctx.lineTo(Rr[0] + 1, 0);
          ctx.moveTo(Rr[0], Rr[1] - 2);
          ctx.quadraticCurveTo(Rr[0] - 1, Rr[1] - 6, Rr[0] - 4, Rr[1] - 4);
          ctx.stroke();
        }
        if (acc.includes('rojao') && !back) {
          ctx.fillStyle = R('red', st);
          ctx.fillRect(Rr[0] - 1.5, Rr[1] - 11, 3, 10);
          ctx.strokeStyle = ink;
          ctx.lineWidth = 0.8;
          ctx.strokeRect(Rr[0] - 1.5, Rr[1] - 11, 3, 10);
          ctx.beginPath();
          ctx.moveTo(Rr[0], Rr[1] - 11);
          ctx.quadraticCurveTo(Rr[0] + 3, Rr[1] - 14, Rr[0] + 1, Rr[1] - 16);
          ctx.stroke();
          if (Math.floor(t * 8) % 2) dot(ctx, Rr[0] + 1, Rr[1] - 16, 1.2, R('gold', st));
        }
        if (acc.includes('jornal') && !back) {
          ctx.fillStyle = pap;
          ctx.strokeStyle = ink;
          ctx.lineWidth = 1;
          ctx.fillRect(L[0] - 4, L[1] - 9, 8, 11);
          ctx.strokeRect(L[0] - 4, L[1] - 9, 8, 11);
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            ctx.moveTo(L[0] - 3, L[1] - 7 + i * 2.4);
            ctx.lineTo(L[0] + 3, L[1] - 7 + i * 2.4);
          }
          ctx.stroke();
        }
        if (acc.includes('caderno') && !back) {
          ctx.fillStyle = ink;
          ctx.fillRect(L[0] - 4, L[1] - 7, 7, 9);
          ctx.fillStyle = R('red', st);
          ctx.fillRect(L[0] - 4, L[1] - 7, 1.6, 9);
        }
        if (acc.includes('bilros') && !back) {
          for (const p of [L, Rr]) {
            ctx.fillStyle = R('mid', st);
            ctx.strokeStyle = ink;
            ctx.lineWidth = 0.8;
            ell(ctx, p[0], p[1] + 5, 1.6, 3.2, R('mid', st), ink, 0.8);
            dot(ctx, p[0], p[1] + 9, 1.4, R('mid', st), ink, 0.8);
          }
        }
        if (acc.includes('vara')) {
          ctx.strokeStyle = ink;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(Rr[0], Rr[1]);
          ctx.lineTo(Rr[0] + 12, Rr[1] - 38);
          ctx.stroke();
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(Rr[0] + 12, Rr[1] - 38);
          ctx.quadraticCurveTo(Rr[0] + 20, Rr[1] - 20, Rr[0] + 18, Rr[1] - 6 + Math.sin(t * 2) * 2);
          ctx.stroke();
        }
        if (acc.includes('fuzil')) {
          ctx.strokeStyle = R('paper', st);
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(L[0], L[1] + 2);
          ctx.lineTo(L[0] + 3, L[1] - 20);
          ctx.stroke();
          ctx.strokeStyle = ink;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // ----- bolsa com folhetos
    if (acc.includes('bolsa') && pose !== 'lie') {
      const bx = view === 'side' ? -3 : ww + 3;
      if (view !== 'back' || true) {
        const by = hipY + 1;
        const cols = ['#e6c14f', '#e39a9a', '#8fb3d9'];
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = G.Pal.negative ? R('paper', st) : cols[i];
          ctx.fillRect(bx - 3 + i * 2.2, by - 3.5 - (i % 2), 2.2, 4);
        }
        ctx.fillStyle = R('mid', st);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.1;
        ctx.fillRect(bx - 4, by, 8, 7.5);
        ctx.strokeRect(bx - 4, by, 8, 7.5);
        ctx.fillStyle = ink;
        ctx.fillRect(bx - 4, by, 8, 2.4);
      }
    }

    // ----- cabeça
    if (view === 'side') {
      // pescoço
      limb(ctx, headX, shY, headX + 0.5, headY + hr * 0.6, skin, 3.2, 2);
      dot(ctx, headX, headY, hr, skin, ink, 1.5);
      // nariz
      ctx.fillStyle = skin;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(headX + hr * 0.9, headY - 1);
      ctx.lineTo(headX + hr + 2.4, headY + 2.2);
      ctx.lineTo(headX + hr * 0.92, headY + 3.2);
      ctx.fill();
      ctx.stroke();
      // cabelo lado
      const hsd = spec.hair || {};
      if (hsd.style && hsd.style !== 'none') {
        ctx.fillStyle = R(hsd.color || 'ink', st);
        ctx.beginPath();
        if (hsd.style === 'wild') {
          for (let i = 0; i <= 8; i++) {
            const a = Math.PI * 0.55 + (i / 8) * Math.PI * 1.25;
            const rr = hr + (i % 2 ? 1.5 : 5.5);
            const px = headX + Math.cos(a) * rr, py = headY - 1 + Math.sin(a) * rr;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.lineTo(headX - hr * 0.2, headY);
        } else {
          ctx.arc(headX, headY, hr + 0.8, Math.PI * 0.6, Math.PI * 1.9);
          ctx.quadraticCurveTo(headX - 1, headY - 2, headX - hr * 0.55, headY + hr * 0.7);
          if (hsd.style === 'bowl') ctx.lineTo(headX + hr * 0.6, headY - hr * 0.2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.1;
        ctx.stroke();
        if (hsd.style === 'bun') dot(ctx, headX - hr * 0.9, headY - hr * 0.5, hr * 0.45, R(hsd.color, st), ink);
        if (hsd.style === 'long') {
          ctx.beginPath();
          ctx.moveTo(headX - hr * 0.8, headY);
          ctx.lineTo(headX - hr * 1.1, headY + hr * 1.8);
          ctx.lineTo(headX - hr * 0.1, headY + hr * 1.2);
          ctx.fill();
          ctx.stroke();
        }
      }
      // olho
      const f = spec.face || {};
      const blink = t % 3.7 < 0.12 || st.face === 'closed';
      if (f.glasses === 'escuros') {
        ell(ctx, headX + hr * 0.45, headY - 0.5, 2.8, 2.4, ink);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(headX + hr * 0.2, headY - 1);
        ctx.lineTo(headX - hr * 0.6, headY - 1.5);
        ctx.stroke();
      } else if (blink || st.face === 'happy') {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(headX + hr * 0.3, headY - 0.5);
        ctx.lineTo(headX + hr * 0.62, headY - 0.5);
        ctx.stroke();
      } else {
        ell(ctx, headX + hr * 0.45, headY - 0.5, 1.2, 1.8, ink);
        if (f.glasses === 'redondos') {
          ctx.strokeStyle = ink;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(headX + hr * 0.45, headY - 0.5, 2.8, 0, U.TAU);
          ctx.stroke();
        }
      }
      // boca
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      if (st.talking && Math.floor(t * 10) % 2 === 0) {
        ell(ctx, headX + hr * 0.62, headY + hr * 0.5, 1.4, 1.2, R('red', st));
      } else {
        ctx.moveTo(headX + hr * 0.45, headY + hr * 0.5);
        ctx.lineTo(headX + hr * 0.8, headY + hr * 0.45);
        ctx.stroke();
      }
      if (f.beard === 'branca') {
        ctx.fillStyle = R('white', st);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(headX - hr * 0.1, headY + 2);
        ctx.quadraticCurveTo(headX + hr * 1.2, headY + hr * 0.5, headX + hr * 0.6, headY + hr * 1.9);
        ctx.quadraticCurveTo(headX - hr * 0.3, headY + hr * 1.3, headX - hr * 0.1, headY + 2);
        ctx.fill();
        ctx.stroke();
      } else if (f.beard === 'curta') {
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.moveTo(headX - hr * 0.3, headY + 2);
        ctx.quadraticCurveTo(headX + hr * 1.1, headY + hr * 1.4, headX + hr * 0.9, headY + 3);
        ctx.fill();
      }
      if (f.mustache) {
        ctx.fillStyle = f.mustache === 'fino' ? R('white', st) : ink;
        ctx.beginPath();
        ctx.ellipse(headX + hr * 0.75, headY + hr * 0.3, 3, 1.2, 0.3, 0, U.TAU);
        ctx.fill();
        if (f.mustache === 'caracol') {
          ctx.strokeStyle = ink;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(headX + hr * 0.3, headY + hr * 0.45, 1.3, 0, U.TAU * 0.8);
          ctx.stroke();
        }
      }
      if (f.earrings) {
        ctx.strokeStyle = R('gold', st);
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(headX - hr * 0.1, headY + hr * 0.55, 2.3, 0, U.TAU);
        ctx.stroke();
      }
      if (acc.includes('cachimbo')) {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(headX + hr * 0.7, headY + hr * 0.5);
        ctx.lineTo(headX + hr + 5, headY + hr * 0.6);
        ctx.stroke();
        ell(ctx, headX + hr + 6, headY + hr * 0.3, 2, 2.4, R('mid', st), ink, 1);
      }
      hat(ctx, spec, st, headX, headY, hr, 'side');
      if (spec.hat && spec.hat.type === 'couro') {
        // na vista lateral, a aba dobrada vira uma meia-lua erguida na frente
        const hy0 = headY - hr;
        ctx.fillStyle = R('ink', st);
        ctx.strokeStyle = R('ink', st);
        ctx.beginPath();
        ctx.moveTo(headX - hr * 1.15, hy0 + 3);
        ctx.lineTo(headX + hr * 0.9, hy0 + 3);
        ctx.quadraticCurveTo(headX + hr * 1.55, hy0 + 1, headX + hr * 1.45, hy0 - 10);
        ctx.quadraticCurveTo(headX + hr * 1.0, hy0 - 4, headX + hr * 0.5, hy0 - 2);
        ctx.quadraticCurveTo(headX, hy0 - hr * 0.95, headX - hr * 0.75, hy0 - 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = pap;
        Art.star(ctx, headX + hr * 1.12, hy0 - 3.5, 2.2, 1, 6);
        ctx.fill();
        for (let i = 0; i < 4; i++) dot(ctx, headX - hr * 0.7 + i * hr * 0.42, hy0 + 1.2, 0.55, pap);
      }
    } else {
      // pescoço
      limb(ctx, headX, shY + 1, headX, headY + hr * 0.7, skin, 3.4, 2);
      if (acc.includes('lenco') && view === 'front') {
        ctx.fillStyle = R('red', st);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-5.5, shY - 1);
        ctx.lineTo(5.5, shY - 1);
        ctx.lineTo(0, shY + 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      dot(ctx, headX, headY, hr, skin, ink, 1.5);
      if (view === 'front') {
        // orelhas
        for (const s of [-1, 1]) dot(ctx, headX + s * hr * 0.98, headY + 1, 2, skin, ink, 1);
        hairFront(ctx, spec, st, headX, headY, hr, 'front');
        face(ctx, spec, st, headX, headY, hr);
        if (acc.includes('cachimbo')) {
          ctx.strokeStyle = ink;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(headX + 1.5, headY + hr * 0.55);
          ctx.lineTo(headX + 7, headY + hr * 0.8);
          ctx.stroke();
          ell(ctx, headX + 8, headY + hr * 0.5, 2, 2.4, R('mid', st), ink, 1);
        }
      } else {
        hairFront(ctx, spec, st, headX, headY, hr, 'back');
      }
      hat(ctx, spec, st, headX, headY, hr, view);
      if (hasBraid && view === 'back') {
        braid(ctx, st, headX + Math.sin(t * 2) * 0.5, headY + hr * 0.5, Math.PI / 2 + Math.sin(t * 2.2) * 0.08 + (moving ? Math.sin(ph) * 0.1 : 0), 22 * H);
      }
      if (acc.includes('viola') && view === 'back') drawViola(ctx, st, 2, hipY - 6, 0.5, 0.95);
    }
    if (acc.includes('passaro')) {
      const hy2 = headY - hr - hr * 0.8 - 2;
      drawBird(ctx, st, headX + (view === 'side' ? 0 : 2), hy2, 1);
    }
    if (acc.includes('cachimbo') && view !== 'back') {
      // fumaça
      ctx.fillStyle = R('paper', st);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 0.7;
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.6 + i / 3) % 1;
        const px = headX + (view === 'side' ? hr + 7 : 8) + Math.sin(k * 6 + i) * 3;
        const py = headY + hr * 0.2 - k * 18;
        ctx.save();
        ctx.globalAlpha *= 1 - k;
        dot(ctx, px, py, 1.5 + k * 2.5, R('paper', st), ink, 0.6);
        ctx.restore();
      }
    }
    ctx.restore();
  };

  // desenha qualquer "char" (humano ou criatura) pelo id
  SP.draw = function (ctx, id, st) {
    if (SPECS[id]) return SP.humanoid(ctx, SPECS[id], st);
    if (G.Creatures && G.Creatures[id]) return G.Creatures[id](ctx, st);
  };
})();
