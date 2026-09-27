/* PELEJA — chão, paredes, água e objetos de cenário (props) */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Art = G.Art;
  const SP = G.Sprites;
  const R = SP.R;
  const dot = SP.dot;
  const ell = SP.ell;
  const T = G.TILE;

  // ------------------------------------------------------------------
  // Propriedades dos tiles
  // ------------------------------------------------------------------
  const TF = (G.TILEFLAGS = {
    '#': { walk: false, shot: false },
    ' ': { walk: false, shot: false },
    'B': { walk: false, shot: false },
    '~': { walk: false, shot: true, water: true },
    'l': { walk: false, shot: true, water: true },
    '%': { walk: false, shot: true, void: true },
    'F': { walk: false, shot: true },
    'o': { walk: true, shot: true, slow: 0.55 },
    'w': { walk: true, shot: true, slow: 0.45 },
    'h': { walk: true, shot: true, hole: true },
  });
  G.tileWalk = (ch) => (TF[ch] ? TF[ch].walk : true);
  G.tileShot = (ch) => (TF[ch] ? TF[ch].shot : true);

  const TL = (G.Tiles = {});

  // ------------------------------------------------------------------
  // Sprites de tile em cache
  // ------------------------------------------------------------------
  function wallSprite(theme, v) {
    return G.Cache.get('wall:' + theme + ':' + v, T * 2, T * 2, (c) => {
      const cx = T, cy = T;
      const ink = G.Pal.ink;
      const pap = G.Pal.paper;
      if (theme === 'cidade') return;
      c.fillStyle = ink;
      Art.blob(c, cx, cy, T * 0.74, T * 0.72, 7, 0.14, 11 + v * 7);
      c.fill();
      const r = U.rng(31 + v * 13);
      c.fillStyle = pap;
      c.globalAlpha = 0.85;
      if (theme === 'acude') {
        c.strokeStyle = pap;
        c.lineWidth = 1.2;
        for (let i = 0; i < 7; i++) {
          const x = cx - 22 + r() * 44, y = cy - 18 + r() * 30;
          c.beginPath();
          c.moveTo(x, y + 10);
          c.quadraticCurveTo(x + 2, y, x + (r() - 0.5) * 6, y - 10);
          c.stroke();
        }
      } else if (theme === 'margem') {
        for (let i = 0; i < 5; i++) Art.gouge(c, cx - 20 + r() * 40, cy - 20 + r() * 40, 6 + r() * 8, r() * 3, 1.2);
      } else {
        for (let i = 0; i < 6; i++) {
          const y = cy - 20 + i * 7 + r() * 3;
          Art.gouge(c, cx - 14 + r() * 28, y, 10 + r() * 16, -0.1 + r() * 0.2, 1.8);
        }
        for (let i = 0; i < 4; i++) dot(c, cx - 20 + r() * 40, cy - 20 + r() * 40, 0.9 + r(), pap);
      }
      c.globalAlpha = 1;
    });
  }

  function waterSprite(theme, v, frame) {
    return G.Cache.get('water:' + theme + ':' + v + ':' + frame, T * 2, T * 2, (c) => {
      const cx = T, cy = T;
      const col = theme === 'acude' ? '#3e5a6c' : theme === 'margem' ? '#0c0a08' : G.Pal.mid;
      c.fillStyle = col;
      Art.blob(c, cx, cy, T * 0.76, T * 0.74, 7, 0.1, 51 + v * 5);
      c.fill();
      c.strokeStyle = theme === 'margem' ? 'rgba(240,230,210,0.35)' : 'rgba(248,240,220,0.75)';
      c.lineWidth = 1.4;
      const r = U.rng(71 + v * 3);
      for (let i = 0; i < 5; i++) {
        const y = cy - 18 + i * 9 + r() * 3;
        const x = cx - 20 + r() * 12 + frame * 3;
        c.beginPath();
        c.moveTo(x, y);
        c.quadraticCurveTo(x + 5, y - 3, x + 10, y);
        c.quadraticCurveTo(x + 15, y + 3, x + 20, y);
        c.stroke();
      }
    });
  }

  function pathSprite(theme) {
    return G.Cache.get('path:' + theme, T * 1.6, T * 1.6, (c) => {
      const g = c.createRadialGradient(T * 0.8, T * 0.8, 4, T * 0.8, T * 0.8, T * 0.8);
      const base = theme === 'cidade' ? '120,70,80' : theme === 'acude' ? '60,90,110' : '120,80,30';
      g.addColorStop(0, 'rgba(' + base + ',0.13)');
      g.addColorStop(0.65, 'rgba(' + base + ',0.12)');
      g.addColorStop(1, 'rgba(' + base + ',0)');
      c.fillStyle = g;
      c.fillRect(0, 0, T * 1.6, T * 1.6);
    });
  }

  function decoSprite(theme, kind, v) {
    return G.Cache.get('deco:' + theme + ':' + kind + ':' + v, T, T, (c) => {
      const ink = G.Pal.ink;
      const r = U.rng(101 + v * 17 + kind.length * 3);
      c.strokeStyle = ink;
      c.fillStyle = ink;
      c.lineCap = 'round';
      if (kind === 'tuft') {
        const n = 2 + ((r() * 2) | 0);
        for (let k = 0; k < n; k++) {
          const x = 8 + r() * 32, y = 16 + r() * 26;
          c.lineWidth = 1.3;
          c.beginPath();
          for (let i = -2; i <= 2; i++) {
            c.moveTo(x + i * 1.6, y);
            c.lineTo(x + i * 2.8 + (r() - 0.5) * 2, y - 6 - r() * 5);
          }
          c.stroke();
        }
      } else if (kind === 'dots') {
        for (let i = 0; i < 5; i++) dot(c, 6 + r() * 36, 6 + r() * 36, 0.8 + r() * 1.2, ink);
        c.lineWidth = 1;
        c.beginPath();
        const x = 10 + r() * 28, y = 10 + r() * 28;
        c.moveTo(x, y);
        c.lineTo(x + 6, y + (r() - 0.5) * 3);
        c.stroke();
      } else if (kind === 'crack') {
        c.lineWidth = 1;
        c.globalAlpha = 0.6;
        c.beginPath();
        let x = 4 + r() * 10, y = 10 + r() * 28;
        c.moveTo(x, y);
        for (let i = 0; i < 4; i++) {
          x += 6 + r() * 6;
          y += (r() - 0.5) * 12;
          c.lineTo(x, y);
          if (r() < 0.5) {
            c.moveTo(x, y);
            c.lineTo(x + 4, y + (r() - 0.5) * 10);
            c.moveTo(x, y);
          }
        }
        c.stroke();
      } else if (kind === 'text') {
        c.lineWidth = 1.2;
        c.globalAlpha = 0.28;
        for (let yy = 8; yy < 44; yy += 7) {
          c.beginPath();
          let x = 2 + r() * 4;
          while (x < 44) {
            const w = 3 + r() * 9;
            c.moveTo(x, yy);
            c.lineTo(Math.min(46, x + w), yy);
            x += w + 3;
          }
          c.stroke();
        }
      } else if (kind === 'cobble') {
        c.lineWidth = 1;
        c.globalAlpha = 0.45;
        for (let yy = 0; yy < 48; yy += 12) {
          const off = (yy / 12) % 2 ? 8 : 0;
          for (let xx = -8 + off; xx < 48; xx += 16) {
            Art.rrect(c, xx + 1, yy + 1, 14, 10, 4);
            c.stroke();
          }
        }
      } else if (kind === 'plank') {
        c.fillStyle = G.Pal.mid;
        c.fillRect(0, 0, T, T);
        c.lineWidth = 1.2;
        for (let yy = 0; yy <= 48; yy += 12) {
          c.beginPath();
          c.moveTo(0, yy);
          c.lineTo(48, yy);
          c.stroke();
        }
        for (let i = 0; i < 4; i++) {
          const yy = i * 12 + 6;
          dot(c, 4, yy, 1, ink);
          dot(c, 44, yy, 1, ink);
          c.globalAlpha = 0.4;
          c.beginPath();
          c.moveTo(10 + r() * 10, yy - 2);
          c.lineTo(22 + r() * 16, yy - 2 + (r() - 0.5));
          c.stroke();
          c.globalAlpha = 1;
        }
      } else if (kind === 'lace') {
        c.fillStyle = 'rgba(251,246,234,0.97)';
        c.fillRect(0, 0, T, T);
        c.strokeStyle = ink;
        c.lineWidth = 0.9;
        for (let yy = 4; yy < 48; yy += 8) {
          for (let xx = ((yy - 4) / 8) % 2 ? 4 : 0; xx <= 48; xx += 8) {
            c.beginPath();
            c.arc(xx, yy, 2.6, 0, U.TAU);
            c.stroke();
          }
        }
      } else if (kind === 'web') {
        c.strokeStyle = 'rgba(251,246,234,0.9)';
        c.lineWidth = 1;
        const cx = 24, cy = 24;
        c.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * U.TAU;
          c.moveTo(cx, cy);
          c.lineTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30);
        }
        for (let k = 1; k <= 3; k++) {
          for (let i = 0; i <= 8; i++) {
            const a = (i / 8) * U.TAU;
            const px = cx + Math.cos(a) * k * 8, py = cy + Math.sin(a) * k * 8;
            if (i === 0) c.moveTo(px, py);
            else c.lineTo(px, py);
          }
        }
        c.stroke();
        c.strokeStyle = ink;
        c.globalAlpha = 0.5;
        c.lineWidth = 0.5;
        c.stroke();
      } else if (kind === 'ink') {
        Art.inkBlot(c, 24, 26, 15, 3 + v, ink, 6);
        c.fillStyle = G.Pal.paper;
        c.globalAlpha = 0.5;
        Art.gouge(c, 19, 21, 8, -0.4, 1.4);
      } else if (kind === 'wood') {
        c.fillStyle = '#b48a5c';
        c.fillRect(0, 0, T, T);
        c.lineWidth = 1;
        c.globalAlpha = 0.6;
        for (let xx = 0; xx <= 48; xx += 16) {
          c.beginPath();
          c.moveTo(xx, 0);
          c.lineTo(xx, 48);
          c.stroke();
        }
        c.globalAlpha = 0.25;
        for (let i = 0; i < 6; i++) {
          c.beginPath();
          const x = 3 + r() * 42;
          c.moveTo(x, r() * 20);
          c.lineTo(x + (r() - 0.5) * 2, 24 + r() * 24);
          c.stroke();
        }
      } else if (kind === 'hole') {
        c.fillStyle = '#fbf8ef';
        Art.blob(c, 24, 26, 20, 16, 6, 0.25, 9 + v);
        c.fill();
        c.lineWidth = 2;
        c.stroke();
      }
    });
  }

  function pageSprite(v, edges) {
    return G.Cache.get('page:' + v + ':' + edges, T + 16, T + 16, (c) => {
      const o = 8;
      const r = U.rng(301 + v * 11 + edges * 7);
      c.fillStyle = '#efe6d0';
      c.beginPath();
      const N = edges & 1, E = edges & 2, S = edges & 4, W = edges & 8;
      const jag = (n) => (n ? r() * 5 - 1 : -o);
      const pts = [];
      for (let i = 0; i <= 6; i++) pts.push([o + (i / 6) * T, o + jag(N) * (N ? 1 : 1)]);
      for (let i = 1; i <= 6; i++) pts.push([o + T - jag(E), o + (i / 6) * T]);
      for (let i = 5; i >= 0; i--) pts.push([o + (i / 6) * T, o + T - jag(S)]);
      for (let i = 5; i >= 1; i--) pts.push([o + jag(W), o + (i / 6) * T]);
      pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(29,23,18,0.18)';
      c.lineWidth = 1.2;
      for (let yy = o + 7; yy < o + T - 3; yy += 7) {
        c.beginPath();
        let x = o + 2 + r() * 3;
        while (x < o + T - 4) {
          const w = 3 + r() * 9;
          c.moveTo(x, yy);
          c.lineTo(Math.min(o + T - 2, x + w), yy);
          x += w + 3;
        }
        c.stroke();
      }
    });
  }

  function cityWall(ctx, x, y, map, tx, ty) {
    const below = map.get(tx, ty + 1);
    const isFace = below !== 'B' && below !== '#';
    ctx.fillStyle = isFace ? '#b88d5a' : '#8a6a44';
    ctx.fillRect(x, y, T, T);
    ctx.strokeStyle = 'rgba(29,23,18,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 3; i < T; i += 4) {
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i, y + T);
    }
    ctx.stroke();
    ctx.strokeStyle = G.Pal.ink;
    ctx.lineWidth = 2;
    if (isFace) {
      ctx.beginPath();
      ctx.moveTo(x, y + T - 1);
      ctx.lineTo(x + T, y + T - 1);
      ctx.stroke();
      if (U.hash(tx, ty, 5) < 0.4) {
        ctx.fillStyle = G.Pal.ink;
        ctx.fillRect(x + 12, y + 10, 24, 18);
        ctx.fillStyle = U.hash(tx, ty, 9) < 0.5 ? '#ffd9a0' : '#3a2e25';
        ctx.fillRect(x + 14, y + 12, 20, 14);
        ctx.fillStyle = G.Pal.ink;
        ctx.fillRect(x + 23, y + 12, 2, 14);
      } else if (U.hash(tx, ty, 6) < 0.3) {
        ctx.fillStyle = 'rgba(230,220,190,0.8)';
        ctx.save();
        ctx.translate(x + 24, y + 22);
        ctx.rotate(-0.4);
        ctx.fillRect(-20, -4, 40, 8);
        ctx.restore();
      }
    }
    if (map.get(tx, ty - 1) !== 'B' && map.get(tx, ty - 1) !== '#') {
      ctx.beginPath();
      ctx.moveTo(x, y + 1);
      ctx.lineTo(x + T, y + 1);
      ctx.stroke();
    }
    if (map.get(tx - 1, ty) !== 'B' && map.get(tx - 1, ty) !== '#') {
      ctx.beginPath();
      ctx.moveTo(x + 1, y);
      ctx.lineTo(x + 1, y + T);
      ctx.stroke();
    }
    if (map.get(tx + 1, ty) !== 'B' && map.get(tx + 1, ty) !== '#') {
      ctx.beginPath();
      ctx.moveTo(x + T - 1, y);
      ctx.lineTo(x + T - 1, y + T);
      ctx.stroke();
    }
  }

  // ------------------------------------------------------------------
  // Desenho do chão visível
  // ------------------------------------------------------------------
  TL.drawGround = function (ctx, map, x0, y0, x1, y1, t) {
    const theme = map.theme;
    const frame = Math.floor(t * 2.5) % 3;
    const ps = pathSprite(theme);
    // 1) margem: páginas iluminadas sobre o vazio
    if (theme === 'margem') {
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        const ch = map.get(tx, ty);
        if (ch === '%' || ch === ' ' || ch === '#') continue;
        let e = 0;
        const isVoid = (c) => c === '%' || c === ' ' || c === '~';
        if (isVoid(map.get(tx, ty - 1))) e |= 1;
        if (isVoid(map.get(tx + 1, ty))) e |= 2;
        if (isVoid(map.get(tx, ty + 1))) e |= 4;
        if (isVoid(map.get(tx - 1, ty))) e |= 8;
        const sp = pageSprite(((U.hash(tx, ty, 3) * 4) | 0), e);
        ctx.drawImage(sp, tx * T - 8, ty * T - 8, sp.lw, sp.lh);
      }
    }
    // 2) trilhas (manchas suaves)
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const ch = map.get(tx, ty);
      if (ch === ':') ctx.drawImage(ps, tx * T - T * 0.3, ty * T - T * 0.3, ps.lw, ps.lh);
    }
    // 3) decoração e pisos
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const ch = map.get(tx, ty);
      const x = tx * T, y = ty * T;
      const h = U.hash(tx, ty, 17);
      let sp = null;
      switch (ch) {
        case '.':
          if (theme === 'cidade') break;
          if (h < 0.12) sp = decoSprite(theme, theme === 'sertao' ? 'crack' : 'dots', ((h * 100) | 0) % 4);
          else if (h < 0.2 && theme !== 'margem') sp = decoSprite(theme, 'dots', ((h * 1000) | 0) % 4);
          break;
        case ',':
          sp = decoSprite(theme, theme === 'margem' ? 'text' : 'tuft', ((h * 1000) | 0) % 5);
          break;
        case ':':
          if (h < 0.25) sp = decoSprite(theme, 'dots', ((h * 1000) | 0) % 4);
          break;
        case '=':
          sp = decoSprite(theme, 'plank', 0);
          break;
        case 'L': {
          ctx.drawImage(decoSprite(theme, 'lace', 0), x, y, T, T);
          ctx.strokeStyle = G.Pal.ink;
          ctx.lineWidth = 3;
          ctx.beginPath();
          const wat = (c2) => c2 === '~' || c2 === 'l' || c2 === '#';
          if (wat(map.get(tx, ty - 1))) {
            ctx.moveTo(x, y + 1);
            ctx.lineTo(x + T, y + 1);
          }
          if (wat(map.get(tx, ty + 1))) {
            ctx.moveTo(x, y + T - 1);
            ctx.lineTo(x + T, y + T - 1);
          }
          if (wat(map.get(tx - 1, ty))) {
            ctx.moveTo(x + 1, y);
            ctx.lineTo(x + 1, y + T);
          }
          if (wat(map.get(tx + 1, ty))) {
            ctx.moveTo(x + T - 1, y);
            ctx.lineTo(x + T - 1, y + T);
          }
          ctx.stroke();
          break;
        }
        case 'o':
          sp = decoSprite(theme, 'ink', ((h * 1000) | 0) % 3);
          break;
        case 'w':
          sp = decoSprite(theme, 'web', 0);
          break;
        case 's':
          sp = decoSprite(theme, 'cobble', 0);
          break;
        case 'x':
          sp = decoSprite(theme, 'wood', 0);
          break;
        case 'h':
          sp = decoSprite(theme, 'hole', ((h * 1000) | 0) % 3);
          break;
        case 'p':
          if (h < 0.3) sp = decoSprite(theme, 'text', ((h * 1000) | 0) % 5);
          break;
        case 'F':
          ctx.fillStyle = G.Pal.ink;
          ctx.fillRect(x, y + T - 10, T, 10);
          for (let i = 0; i < 4; i++) ctx.fillRect(x + 4 + i * 12, y - 20, 5, T + 10);
          ctx.fillRect(x, y - 16, T, 6);
          break;
        default:
          break;
      }
      if (sp) ctx.drawImage(sp, x, y, T, T);
    }
    // 4) água e paredes (blobs sobrepostos)
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const ch = map.get(tx, ty);
      if (ch === '~' || ch === 'l') {
        const sp = waterSprite(theme, ((U.hash(tx, ty, 1) * 4) | 0), frame);
        ctx.drawImage(sp, tx * T - T / 2, ty * T - T / 2, sp.lw, sp.lh);
      }
    }
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const ch = map.get(tx, ty);
      if (ch === '#' || ch === 'B' || ch === ' ') {
        if (theme === 'cidade' || ch === 'B') {
          cityWall(ctx, tx * T, ty * T, map, tx, ty);
          continue;
        }
        if (theme === 'margem') continue;
        const n = map.get(tx + 1, ty), s = map.get(tx, ty + 1), w = map.get(tx - 1, ty), nn = map.get(tx, ty - 1);
        const solid = (c) => c === '#' || c === ' ';
        if (solid(n) && solid(s) && solid(w) && solid(nn)) {
          ctx.fillStyle = G.Pal.ink;
          ctx.fillRect(tx * T - 1, ty * T - 1, T + 2, T + 2);
        }
        const sp = wallSprite(theme, ((U.hash(tx, ty, 2) * 6) | 0));
        ctx.drawImage(sp, tx * T - T / 2, ty * T - T / 2, sp.lw, sp.lh);
      }
    }
  };

  // ------------------------------------------------------------------
  // PROPS (objetos de cenário)
  // ------------------------------------------------------------------
  const PR = (G.Props = {});
  function def(kind, o) {
    PR[kind] = Object.assign({ w: 60, h: 60, foot: null, shot: false, cache: true, light: null }, o);
  }
  function pal(k) {
    return R(k, null);
  }

  // --- Vila ------------------------------------------------------------------
  def('casa', {
    w: 170, h: 150, foot: [-70, -64, 70, 0], shot: true,
    draw(c, p) {
      const ink = pal('ink'), pap = pal('paper');
      const v = p.v || 0;
      const wallC = ['#f6ecd6', '#ecd3c4', '#d7e0e0', '#efe0b0'][v % 4];
      // parede frontal
      c.fillStyle = G.Pal.negative ? pal('paperDark') : wallC;
      c.strokeStyle = ink;
      c.lineWidth = 2.5;
      c.fillRect(-68, -74, 136, 74);
      c.strokeRect(-68, -74, 136, 74);
      // barra inferior
      c.fillStyle = [pal('red'), '#6f97ba', pal('mid'), '#7d9651'][v % 4];
      c.fillRect(-68, -14, 136, 14);
      c.strokeRect(-68, -14, 136, 14);
      // telhado
      c.fillStyle = ink;
      c.beginPath();
      c.moveTo(-80, -72);
      c.lineTo(-58, -126);
      c.lineTo(58, -126);
      c.lineTo(80, -72);
      c.closePath();
      c.fill();
      c.strokeStyle = pap;
      c.lineWidth = 1.2;
      for (let row = 0; row < 5; row++) {
        const yy = -120 + row * 10;
        const hw = 58 + row * 4.4;
        c.beginPath();
        for (let x = -hw; x < hw; x += 9) {
          c.moveTo(x, yy);
          c.quadraticCurveTo(x + 4.5, yy + 6, x + 9, yy);
        }
        c.stroke();
      }
      // porta
      const dx = v % 2 ? -30 : 18;
      c.fillStyle = ink;
      c.fillRect(dx - 13, -58, 26, 44);
      c.strokeStyle = pap;
      c.lineWidth = 1;
      c.strokeRect(dx - 10, -55, 20, 18);
      c.strokeRect(dx - 10, -34, 20, 17);
      dot(c, dx + 7, -36, 1.8, pal('gold'));
      // janelas
      const wx = v % 2 ? 26 : -34;
      for (const off of [0]) {
        c.fillStyle = ink;
        c.fillRect(wx - 14 + off, -58, 28, 24);
        c.fillStyle = pap;
        c.fillRect(wx - 11 + off, -55, 10, 18);
        c.fillRect(wx + 1 + off, -55, 10, 18);
        c.fillStyle = ink;
        c.beginPath();
        c.moveTo(wx - 11, -46);
        c.lineTo(wx - 1, -46);
        c.moveTo(wx + 1, -46);
        c.lineTo(wx + 11, -46);
        c.strokeStyle = ink;
        c.stroke();
        // vaso
        c.fillStyle = pal('red');
        c.fillRect(wx - 8, -34, 16, 6);
        for (let k = 0; k < 3; k++) dot(c, wx - 5 + k * 5, -37, 2.5, k === 1 ? pal('gold') : pal('red'), ink, 0.8);
      }
      // platibanda ornamental
      c.fillStyle = ink;
      Art.teeth(c, -66, -74, 132, 5, ink);
    },
  });

  def('igreja', {
    w: 220, h: 260, foot: [-92, -90, 92, 0], shot: true,
    draw(c) {
      const ink = pal('ink'), pap = pal('paper');
      c.fillStyle = G.Pal.negative ? pal('paperDark') : '#f6ecd6';
      c.strokeStyle = ink;
      c.lineWidth = 3;
      // corpo
      c.fillRect(-90, -110, 180, 110);
      c.strokeRect(-90, -110, 180, 110);
      // frontão
      c.beginPath();
      c.moveTo(-96, -108);
      c.quadraticCurveTo(-60, -130, -40, -150);
      c.lineTo(40, -150);
      c.quadraticCurveTo(60, -130, 96, -108);
      c.closePath();
      c.fill();
      c.stroke();
      // torre
      c.fillRect(-26, -214, 52, 70);
      c.strokeRect(-26, -214, 52, 70);
      c.fillStyle = ink;
      c.beginPath();
      c.moveTo(-32, -212);
      c.lineTo(0, -246);
      c.lineTo(32, -212);
      c.closePath();
      c.fill();
      // cruz
      c.fillRect(-2, -262, 4, 20);
      c.fillRect(-8, -256, 16, 4);
      // sino
      c.fillStyle = ink;
      c.beginPath();
      c.arc(0, -178, 14, Math.PI, 0);
      c.lineTo(14, -168);
      c.lineTo(-14, -168);
      c.fill();
      dot(c, 0, -165, 3.5, pal('gold'), ink, 1);
      // porta em arco
      c.fillStyle = ink;
      c.beginPath();
      c.moveTo(-22, 0);
      c.lineTo(-22, -54);
      c.arc(0, -54, 22, Math.PI, 0);
      c.lineTo(22, 0);
      c.fill();
      c.strokeStyle = pap;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, -74);
      c.lineTo(0, 0);
      c.stroke();
      // janelas redondas
      for (const s of [-1, 1]) {
        c.fillStyle = ink;
        c.beginPath();
        c.arc(s * 58, -68, 14, 0, U.TAU);
        c.fill();
        c.strokeStyle = pap;
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(s * 58 - 14, -68);
        c.lineTo(s * 58 + 14, -68);
        c.moveTo(s * 58, -82);
        c.lineTo(s * 58, -54);
        c.stroke();
      }
      c.fillStyle = pal('red');
      c.fillRect(-90, -14, 180, 14);
      c.strokeStyle = ink;
      c.lineWidth = 2;
      c.strokeRect(-90, -14, 180, 14);
      Art.teeth(c, -88, -110, 176, 6, ink);
    },
  });

  def('barraca', {
    w: 130, h: 100, foot: [-56, -30, 56, 0], shot: false,
    draw(c, p) {
      const ink = pal('ink'), pap = pal('paper');
      const v = p.v || 0;
      c.strokeStyle = ink;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-54, 0);
      c.lineTo(-54, -78);
      c.moveTo(54, 0);
      c.lineTo(54, -78);
      c.stroke();
      // balcão
      c.fillStyle = pal('mid');
      c.fillRect(-56, -34, 112, 20);
      c.lineWidth = 2;
      c.strokeRect(-56, -34, 112, 20);
      c.fillStyle = ink;
      c.fillRect(-56, -14, 112, 4);
      // mercadorias
      const goods = [
        () => { for (let i = 0; i < 5; i++) { c.fillStyle = '#8a5a2a'; c.fillRect(-46 + i * 18, -44, 14, 10); c.strokeRect(-46 + i * 18, -44, 14, 10); } },
        () => { for (let i = 0; i < 4; i++) { ell(c, -40 + i * 26, -44, 11, 10, pal('mid'), ink, 1.5); c.fillStyle = ink; c.fillRect(-46 + i * 26, -52, 12, 3); } },
        () => { const cols = ['#e6c14f', '#e39a9a', '#8fb3d9', '#f0e3c0']; for (let i = 0; i < 7; i++) { c.fillStyle = G.Pal.negative ? pap : cols[i % 4]; c.fillRect(-48 + i * 14, -48, 12, 15); c.strokeRect(-48 + i * 14, -48, 12, 15); } },
        () => { for (let i = 0; i < 6; i++) dot(c, -42 + i * 17, -40, 7, i % 2 ? pal('red') : pal('gold'), ink, 1.2); },
      ];
      c.strokeStyle = ink;
      c.lineWidth = 1;
      goods[v % goods.length]();
      // toldo listrado
      const cols = [pal('red'), '#6f97ba', '#7d9651', pal('gold')];
      c.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        c.fillStyle = i % 2 ? pap : cols[v % 4];
        c.beginPath();
        c.moveTo(-62 + i * 15.5, -96);
        c.lineTo(-62 + (i + 1) * 15.5, -96);
        c.lineTo(-62 + (i + 1) * 15.5, -74);
        c.quadraticCurveTo(-62 + (i + 0.5) * 15.5, -66, -62 + i * 15.5, -74);
        c.closePath();
        c.fill();
        c.strokeStyle = ink;
        c.stroke();
      }
    },
  });

  def('palanque', {
    w: 200, h: 150, foot: [-92, -62, 92, -8], shot: false,
    draw(c) {
      const ink = pal('ink'), pap = pal('paper');
      c.fillStyle = pal('mid');
      c.strokeStyle = ink;
      c.lineWidth = 2.5;
      c.fillRect(-94, -64, 188, 52);
      c.strokeRect(-94, -64, 188, 52);
      c.beginPath();
      for (let i = 0; i < 12; i++) {
        c.moveTo(-94 + i * 16, -64);
        c.lineTo(-94 + i * 16, -12);
      }
      c.lineWidth = 1;
      c.stroke();
      c.fillStyle = ink;
      c.fillRect(-94, -12, 188, 6);
      // mastros e faixa
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-88, -64);
      c.lineTo(-88, -140);
      c.moveTo(88, -64);
      c.lineTo(88, -140);
      c.stroke();
      c.fillStyle = pal('red');
      c.fillRect(-70, -138, 140, 30);
      c.strokeRect(-70, -138, 140, 30);
      c.fillStyle = pap;
      c.font = G.font(20, 'title');
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('CANTORIA', 0, -122);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-88, -132);
      c.lineTo(-70, -128);
      c.moveTo(88, -132);
      c.lineTo(70, -128);
      c.stroke();
    },
  });

  def('poco', {
    w: 70, h: 80, foot: [-24, -26, 24, 0], shot: false,
    draw(c) {
      const ink = pal('ink'), pap = pal('paper');
      ell(c, 0, -14, 24, 12, pal('mid'), ink, 2.5);
      c.fillStyle = pal('mid');
      c.fillRect(-24, -14, 48, 14);
      c.strokeStyle = ink;
      c.strokeRect(-24, -14, 48, 14);
      ell(c, 0, -14, 18, 8, ink);
      c.strokeStyle = pap;
      c.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(-24 + i * 14, -12);
        c.lineTo(-24 + i * 14, 0);
        c.stroke();
      }
      c.strokeStyle = ink;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-20, -14);
      c.lineTo(-20, -62);
      c.lineTo(20, -62);
      c.lineTo(20, -14);
      c.stroke();
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, -62);
      c.lineTo(0, -40);
      c.stroke();
      c.fillStyle = pal('mid');
      c.fillRect(-6, -40, 12, 10);
      c.strokeRect(-6, -40, 12, 10);
    },
  });

  def('carroca', {
    w: 130, h: 90, foot: [-54, -30, 54, 0], shot: true,
    draw(c) {
      const ink = pal('ink'), pap = pal('paper');
      c.fillStyle = pal('mid');
      c.strokeStyle = ink;
      c.lineWidth = 2.5;
      c.fillRect(-50, -58, 100, 30);
      c.strokeRect(-50, -58, 100, 30);
      c.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        c.beginPath();
        c.moveTo(-50 + i * 20, -58);
        c.lineTo(-50 + i * 20, -28);
        c.stroke();
      }
      // fardos
      for (let i = 0; i < 3; i++) {
        c.fillStyle = pal('straw');
        c.fillRect(-40 + i * 28, -76, 24, 18);
        c.strokeRect(-40 + i * 28, -76, 24, 18);
      }
      for (const s of [-1, 1]) {
        dot(c, s * 34, -24, 20, pap, ink, 3);
        c.beginPath();
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * U.TAU;
          c.moveTo(s * 34, -24);
          c.lineTo(s * 34 + Math.cos(a) * 19, -24 + Math.sin(a) * 19);
        }
        c.lineWidth = 1.5;
        c.stroke();
        dot(c, s * 34, -24, 4, ink);
      }
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(50, -40);
      c.lineTo(66, -34);
      c.stroke();
    },
  });

  def('arvore', {
    w: 140, h: 160, foot: [-12, -14, 12, 0], shot: false,
    draw(c, p) {
      const ink = pal('ink'), pap = pal('paper');
      c.fillStyle = ink;
      c.beginPath();
      c.moveTo(-8, 0);
      c.quadraticCurveTo(-4, -40, -14, -70);
      c.lineTo(14, -70);
      c.quadraticCurveTo(4, -40, 8, 0);
      c.fill();
      c.strokeStyle = ink;
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(-6, -60);
      c.lineTo(-34, -90);
      c.moveTo(6, -64);
      c.lineTo(30, -96);
      c.stroke();
      c.fillStyle = theme() === 'acude' ? '#2f4a3a' : ink;
      const r = U.rng(40 + (p.v || 0));
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * U.TAU;
        Art.blob(c, Math.cos(a) * 36, -104 + Math.sin(a) * 26, 28, 24, 6, 0.2, 60 + i);
        c.fill();
      }
      Art.blob(c, 0, -106, 44, 34, 8, 0.15, 3);
      c.fill();
      c.fillStyle = pap;
      for (let i = 0; i < 30; i++) {
        const a = r() * U.TAU, d = r() * 50;
        Art.gouge(c, Math.cos(a) * d, -104 + Math.sin(a) * d * 0.7, 5 + r() * 5, a + 1.2, 1.4);
      }
      if (p.fruit) for (let i = 0; i < 7; i++) dot(c, -40 + r() * 80, -126 + r() * 44, 3, pal('red'), ink, 0.8);
    },
  });

  def('fogueira', {
    w: 60, h: 70, foot: [-16, -14, 16, 0], shot: false, cache: false, light: 220,
    draw(c, p, t) {
      const ink = pal('ink');
      c.fillStyle = pal('mid');
      c.strokeStyle = ink;
      c.lineWidth = 2;
      for (const a of [-0.35, 0.35]) {
        c.save();
        c.translate(0, -6);
        c.rotate(a);
        c.fillRect(-20, -4, 40, 8);
        c.strokeRect(-20, -4, 40, 8);
        c.restore();
      }
      for (let i = 0; i < 7; i++) dot(c, Math.cos(i) * 18, -3 + Math.sin(i * 2) * 3, 4, '#6b6055', ink, 1);
      flame(c, 0, -8, 1.2, t);
    },
  });

  function flame(c, x, y, s, t) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    const f = (k) => Math.sin(t * 13 + k) * 2;
    c.fillStyle = '#c23a22';
    c.beginPath();
    c.moveTo(-12, 0);
    c.quadraticCurveTo(-14, -14, -4 + f(1), -30 + f(2));
    c.quadraticCurveTo(-2, -18, 2, -24 + f(3));
    c.quadraticCurveTo(6, -14, 9 + f(4), -34 + f(5));
    c.quadraticCurveTo(16, -12, 12, 0);
    c.closePath();
    c.fill();
    c.strokeStyle = '#1d1712';
    c.lineWidth = 1.5;
    c.stroke();
    c.fillStyle = '#f2c14e';
    c.beginPath();
    c.moveTo(-6, 0);
    c.quadraticCurveTo(-6, -10, 0 + f(6), -18 + f(7));
    c.quadraticCurveTo(6, -8, 6, 0);
    c.closePath();
    c.fill();
    c.restore();
  }
  G.Art.flame = flame;

  def('banco', {
    w: 70, h: 40, foot: [-30, -14, 30, 0],
    draw(c) {
      const ink = pal('ink');
      c.fillStyle = pal('mid');
      c.strokeStyle = ink;
      c.lineWidth = 2;
      c.fillRect(-32, -22, 64, 8);
      c.strokeRect(-32, -22, 64, 8);
      c.fillStyle = ink;
      c.fillRect(-28, -14, 5, 14);
      c.fillRect(23, -14, 5, 14);
    },
  });

  def('potes', {
    w: 70, h: 50, foot: [-26, -16, 26, 0],
    draw(c) {
      const ink = pal('ink'), pap = pal('paper');
      for (const [x, s] of [[-14, 1], [10, 1.2], [26, 0.8]]) {
        ell(c, x, -14 * s, 11 * s, 13 * s, '#a0613a', ink, 2);
        c.fillStyle = ink;
        c.fillRect(x - 6 * s, -28 * s, 12 * s, 4 * s);
        c.strokeStyle = pap;
        c.lineWidth = 1;
        c.beginPath();
        c.arc(x, -14 * s, 7 * s, 0.3, 2.8);
        c.stroke();
      }
    },
  });

  def('cerca', {
    w: 56, h: 40, foot: [-24, -10, 24, 0], shot: false,
    draw(c, p) {
      const ink = pal('ink');
      c.strokeStyle = ink;
      c.lineWidth = 3;
      if (p.vert) {
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, -34);
        c.stroke();
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-2, -26);
        c.lineTo(-2, -26 + 48);
        c.stroke();
        return;
      }
      c.beginPath();
      for (const x of [-22, 0, 22]) {
        c.moveTo(x, 0);
        c.lineTo(x + (U.hash(x, 3) - 0.5) * 3, -30);
      }
      c.stroke();
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-26, -22);
      c.lineTo(26, -20);
      c.moveTo(-26, -10);
      c.lineTo(26, -12);
      c.stroke();
    },
  });

  def('porteira', {
    w: 240, h: 180, foot: null, feet: [[-104, -18, -74, 0], [74, -18, 104, 0]], shot: false,
    draw(c) {
      const ink = pal('ink'), pap = pal('paper');
      c.fillStyle = ink;
      for (const s of [-1, 1]) {
        c.fillRect(s * 89 - 12, -150, 24, 150);
        c.fillStyle = pap;
        for (let i = 0; i < 6; i++) Art.gouge(c, s * 89, -130 + i * 22, 14, Math.PI / 2, 2);
        c.fillStyle = ink;
      }
      c.fillRect(-110, -160, 220, 14);
      c.fillStyle = pal('red');
      c.fillRect(-70, -150, 140, 30);
      c.strokeStyle = ink;
      c.lineWidth = 2.5;
      c.strokeRect(-70, -150, 140, 30);
      c.fillStyle = pap;
      c.font = G.font(20, 'title');
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('VILA RIMA', 0, -134);
      Art.star(c, 0, -176, 12, 5, 6);
      c.fillStyle = ink;
      c.fill();
      // folhas da porteira abertas
      c.strokeStyle = ink;
      c.lineWidth = 3;
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * 77, -10);
        c.lineTo(s * 40, 6);
        c.moveTo(s * 77, -60);
        c.lineTo(s * 40, -44);
        c.moveTo(s * 40, 6);
        c.lineTo(s * 40, -44);
        c.moveTo(s * 77, -10);
        c.lineTo(s * 40, -44);
        c.stroke();
      }
    },
  });

  // --- Sertão ------------------------------------------------------------
  def('mandacaru', {
    w: 90, h: 120, foot: [-12, -14, 12, 0], shot: true,
    draw(c, p) {
      const ink = pal('ink'), pap = pal('paper');
      const v = p.v || 0;
      const H = 80 + (v % 3) * 14;
      c.fillStyle = ink;
      Art.rrect(c, -10, -H, 20, H, 10);
      c.fill();
      const arms = [[-1, -H * 0.55, 24, H * 0.35], [1, -H * 0.45, 22, H * 0.28]];
      if (v % 2) arms.push([-1, -H * 0.8, 16, H * 0.18]);
      for (const [s, y, dx, up] of arms) {
        Art.rrect(c, s > 0 ? 6 : -6 - dx, y - 5, dx, 10, 5);
        c.fill();
        Art.rrect(c, s > 0 ? dx - 4 : -dx - 6, y - up, 10, up + 3, 5);
        c.fill();
      }
      c.strokeStyle = pap;
      c.lineWidth = 0.9;
      c.beginPath();
      for (const x of [-4, 0, 4]) {
        c.moveTo(x, -H + 8);
        c.lineTo(x, -6);
      }
      c.stroke();
      c.fillStyle = pap;
      for (let i = 0; i < H / 6; i++) {
        c.fillRect(i % 2 ? 9 : -12, -H + 10 + i * 6, 3, 0.9);
      }
      if (p.flower) for (let k = 0; k < 6; k++) dot(c, Math.cos((k * U.TAU) / 6) * 4, -H - 2 + Math.sin((k * U.TAU) / 6) * 4, 3, pal('red'), ink, 0.6);
    },
  });

  def('xique', {
    w: 60, h: 44, foot: [-16, -12, 16, 0], shot: false,
    draw(c, p) {
      const ink = pal('ink'), pap = pal('paper');
      const r = U.rng(9 + (p.v || 0));
      for (let i = 0; i < 4; i++) {
        const x = -16 + i * 10 + r() * 4, h = 14 + r() * 16;
        c.fillStyle = ink;
        Art.rrect(c, x - 5, -h, 10, h, 5);
        c.fill();
        c.fillStyle = pap;
        for (let k = 0; k < h / 5; k++) c.fillRect(x + (k % 2 ? 3 : -5), -h + 3 + k * 5, 2.5, 0.8);
      }
    },
  });

  def('pedra', {
    w: 60, h: 50, foot: [-20, -18, 20, 0], shot: true,
    draw(c, p) {
      const ink = pal('ink'), pap = pal('paper');
      c.fillStyle = ink;
      Art.blob(c, 0, -16, 22, 17, 5, 0.2, 5 + (p.v || 0));
      c.fill();
      c.fillStyle = pap;
      const r = U.rng(12 + (p.v || 0));
      for (let i = 0; i < 4; i++) Art.gouge(c, -10 + r() * 16, -24 + r() * 14, 7 + r() * 6, -0.2, 1.5);
    },
  });

  def('pedrao', {
    w: 110, h: 90, foot: [-42, -40, 42, 0], shot: true,
    draw(c, p) {
      const ink = pal('ink'), pap = pal('paper');
      c.fillStyle = ink;
      Art.blob(c, 0, -34, 46, 36, 6, 0.18, 21 + (p.v || 0));
      c.fill();
      c.fillStyle = pap;
      const r = U.rng(22 + (p.v || 0));
      for (let i = 0; i < 9; i++) Art.gouge(c, -28 + r() * 50, -54 + r() * 36, 10 + r() * 12, -0.25 + r() * 0.3, 2);
    },
  });

  def('caveira', {
    w: 50, h: 34, foot: null,
    draw(c) {
      const ink = pal('ink'), pap = pal('paper');
      c.fillStyle = G.Pal.negative ? pal('ink') : '#f7f1e3';
      c.strokeStyle = ink;
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(-8, -18);
      c.quadraticCurveTo(0, -24, 8, -18);
      c.lineTo(6, -4);
      c.quadraticCurveTo(0, 0, -6, -4);
      c.closePath();
      c.fill();
      c.stroke();
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * 7, -18);
        c.quadraticCurveTo(s * 20, -20, s * 22, -30);
        c.quadraticCurveTo(s * 16, -22, s * 7, -14);
        c.fill();
        c.stroke();
        dot(c, s * 3.5, -13, 2.4, ink);
      }
      void pap;
    },
  });

  def('ossos', {
    w: 50, h: 20, foot: null,
    draw(c, p) {
      const ink = pal('ink');
      const r = U.rng(3 + (p.v || 0));
      for (let i = 0; i < 3; i++) {
        c.save();
        c.translate(-12 + i * 12, -5);
        c.rotate(r() * 3);
        c.strokeStyle = ink;
        c.lineWidth = 5;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(-8, 0);
        c.lineTo(8, 0);
        c.stroke();
        c.strokeStyle = G.Pal.negative ? ink : '#f7f1e3';
        c.lineWidth = 3;
        c.stroke();
        c.restore();
      }
    },
  });

  def('galho', {
    w: 110, h: 130, foot: [-8, -10, 8, 0], shot: false,
    draw(c, p) {
      const ink = pal('ink');
      c.strokeStyle = ink;
      c.lineCap = 'round';
      const r = U.rng(80 + (p.v || 0));
      const br = (x, y, a, len, w, d) => {
        if (d === 0 || len < 6) return;
        const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len;
        c.lineWidth = w;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(nx, ny);
        c.stroke();
        br(nx, ny, a - 0.4 - r() * 0.3, len * 0.72, w * 0.65, d - 1);
        br(nx, ny, a + 0.35 + r() * 0.3, len * 0.68, w * 0.65, d - 1);
      };
      br(0, 0, -Math.PI / 2, 44, 8, 5);
    },
  });

  def('chapeuPedra', {
    w: 260, h: 200, foot: [-120, -60, 120, 0], shot: true,
    draw(c) {
      const ink = pal('ink'), pap = pal('paper');
      c.fillStyle = ink;
      c.beginPath();
      c.moveTo(-128, 0);
      c.quadraticCurveTo(-130, -60, -80, -76);
      c.quadraticCurveTo(-60, -170, 0, -176);
      c.quadraticCurveTo(60, -170, 80, -76);
      c.quadraticCurveTo(130, -60, 128, 0);
      c.closePath();
      c.fill();
      c.fillStyle = pap;
      Art.star(c, 0, -120, 24, 11, 6);
      c.fill();
      const r = U.rng(5);
      for (let i = 0; i < 20; i++) Art.gouge(c, -100 + r() * 200, -60 + r() * 50, 10 + r() * 20, -0.1 + r() * 0.2, 2);
    },
  });

  // --- Açude -------------------------------------------------------------
  def('palafita', {
    w: 170, h: 170, foot: [-70, -60, 70, 0], shot: true,
    draw(c, p) {
      const ink = pal('ink'), pap = pal('paper');
      c.strokeStyle = ink;
      c.lineWidth = 5;
      c.beginPath();
      for (const x of [-60, -20, 20, 60]) {
        c.moveTo(x, 0);
        c.lineTo(x, -40);
      }
      c.stroke();
      c.fillStyle = pal('mid');
      c.fillRect(-72, -46, 144, 10);
      c.lineWidth = 2;
      c.strokeRect(-72, -46, 144, 10);
      c.fillStyle = G.Pal.negative ? pal('paperDark') : ['#e8eef0', '#f3e7d2'][(p.v || 0) % 2];
      c.fillRect(-62, -104, 124, 58);
      c.strokeRect(-62, -104, 124, 58);
      c.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        c.beginPath();
        c.moveTo(-62 + i * 16, -104);
        c.lineTo(-62 + i * 16, -46);
        c.stroke();
      }
      c.fillStyle = pal('straw');
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-80, -100);
      c.lineTo(0, -150);
      c.lineTo(80, -100);
      c.closePath();
      c.fill();
      c.stroke();
      c.lineWidth = 1;
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        c.moveTo(-70 + i * 14, -102);
        c.lineTo(-4 + i * 1.5, -146);
      }
      c.stroke();
      c.fillStyle = ink;
      c.fillRect(-12, -86, 24, 40);
      c.fillRect(24, -90, 22, 18);
      c.fillStyle = pap;
      c.fillRect(27, -87, 7, 12);
      c.fillRect(36, -87, 7, 12);
    },
  });

  def('junco', {
    w: 40, h: 50, foot: null,
    draw(c, p) {
      const ink = pal('ink');
      const r = U.rng(4 + (p.v || 0));
      c.strokeStyle = ink;
      c.lineWidth = 1.6;
      for (let i = 0; i < 6; i++) {
        const x = -12 + i * 5;
        const h = 22 + r() * 18;
        c.beginPath();
        c.moveTo(x, 0);
        c.quadraticCurveTo(x + 2, -h / 2, x + (r() - 0.5) * 8, -h);
        c.stroke();
        if (i % 2) ell(c, x + 1, -h * 0.7, 2.2, 5, pal('mid'), ink, 1);
      }
    },
  });

  def('varal', {
    w: 150, h: 90, foot: [-4, -6, 4, 0], shot: false, cache: false,
    draw(c, p, t) {
      const ink = pal('ink');
      c.strokeStyle = ink;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-64, 0);
      c.lineTo(-64, -70);
      c.moveTo(64, 0);
      c.lineTo(64, -70);
      c.stroke();
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-64, -66);
      c.quadraticCurveTo(0, -54, 64, -66);
      c.stroke();
      for (let i = 0; i < 3; i++) {
        const x = -40 + i * 36;
        const sw = Math.sin(t * 2 + i) * 3;
        c.fillStyle = 'rgba(251,246,234,0.95)';
        c.beginPath();
        c.moveTo(x - 14, -60);
        c.lineTo(x + 14, -60);
        c.lineTo(x + 12 + sw, -30);
        c.lineTo(x - 12 + sw, -30);
        c.closePath();
        c.fill();
        c.strokeStyle = ink;
        c.stroke();
        for (let k = 0; k < 4; k++) {
          c.beginPath();
          c.arc(x - 8 + k * 5 + sw * 0.5, -42, 2, 0, U.TAU);
          c.stroke();
        }
      }
      void p;
    },
  });

  def('jangada', {
    w: 110, h: 90, foot: null, cache: false,
    draw(c, p, t) {
      const ink = pal('ink'), pap = pal('paper');
      const b = Math.sin(t * 1.5 + (p.v || 0)) * 2;
      c.translate(0, b);
      c.fillStyle = pal('mid');
      c.strokeStyle = ink;
      c.lineWidth = 2;
      c.fillRect(-44, -12, 88, 12);
      c.strokeRect(-44, -12, 88, 12);
      c.beginPath();
      for (let i = 1; i < 6; i++) {
        c.moveTo(-44 + i * 15, -12);
        c.lineTo(-44 + i * 15, 0);
      }
      c.stroke();
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(0, -12);
      c.lineTo(0, -80);
      c.stroke();
      c.fillStyle = G.Pal.negative ? pal('paperDark') : '#f7f1e3';
      c.beginPath();
      c.moveTo(2, -78);
      c.quadraticCurveTo(40, -50, 34, -16);
      c.lineTo(2, -16);
      c.closePath();
      c.fill();
      c.stroke();
      c.strokeStyle = pal('red');
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(6, -40);
      c.lineTo(30, -38);
      c.stroke();
      void pap;
    },
  });

  def('almofadaDeco', {
    w: 80, h: 50, foot: [-30, -20, 30, 0],
    draw(c) {
      const ink = pal('ink');
      ell(c, 0, -16, 32, 16, '#fbf6ea', ink, 2);
      c.strokeStyle = ink;
      c.lineWidth = 0.8;
      for (let i = 0; i < 12; i++) {
        c.beginPath();
        c.arc(-22 + (i % 6) * 9, -20 + Math.floor(i / 6) * 8, 2.5, 0, U.TAU);
        c.stroke();
      }
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        c.moveTo(-20 + i * 10, -28);
        c.lineTo(-20 + i * 10, -38);
        c.stroke();
        dot(c, -20 + i * 10, -39, 1.6, pal('red'));
      }
    },
  });

  // --- Cidade ------------------------------------------------------------
  def('predio', {
    w: 200, h: 220, foot: [-90, -70, 90, 0], shot: true,
    draw(c, p) {
      const ink = pal('ink'), pap = pal('paper');
      const v = p.v || 0;
      const W = [150, 180, 130][v % 3], H = [150, 190, 120][v % 3];
      c.fillStyle = '#b88d5a';
      c.strokeStyle = ink;
      c.lineWidth = 2.5;
      c.fillRect(-W / 2, -H, W, H);
      c.strokeRect(-W / 2, -H, W, H);
      c.save();
      c.beginPath();
      c.rect(-W / 2, -H, W, H);
      c.clip();
      c.globalAlpha = 0.28;
      Art.hatch(c, -W / 2, -H, W, H, 4, Math.PI / 2, 1, ink);
      c.restore();
      // abas do topo
      c.fillStyle = '#a07a4a';
      c.beginPath();
      c.moveTo(-W / 2, -H);
      c.lineTo(-W / 2 + 14, -H - 18);
      c.lineTo(-4, -H - 14);
      c.lineTo(-2, -H);
      c.closePath();
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(W / 2, -H);
      c.lineTo(W / 2 - 10, -H - 22);
      c.lineTo(6, -H - 16);
      c.lineTo(2, -H);
      c.closePath();
      c.fill();
      c.stroke();
      // fita adesiva
      c.fillStyle = 'rgba(240,220,170,0.85)';
      c.fillRect(-8, -H - 2, 16, H * 0.45);
      // janelas recortadas
      const cols = Math.floor(W / 44);
      const rows = Math.floor((H - 50) / 44);
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const x = -W / 2 + 14 + i * 44, y = -H + 18 + j * 44;
        const lit = U.hash(i, j, v) < 0.45;
        c.fillStyle = ink;
        c.fillRect(x, y, 26, 26);
        if (lit) {
          c.fillStyle = '#ffd9a0';
          c.fillRect(x + 3, y + 3, 20, 20);
          c.fillStyle = ink;
          c.fillRect(x + 12, y + 3, 2, 20);
        }
      }
      // porta
      c.fillStyle = ink;
      c.fillRect(-14, -44, 28, 44);
      c.fillStyle = pal('red');
      c.font = G.font(11, 'title');
      c.textAlign = 'center';
      c.save();
      c.translate(W / 2 - 34, -30);
      c.rotate(-0.15);
      c.strokeStyle = pal('red');
      c.lineWidth = 2;
      c.strokeRect(-26, -10, 52, 18);
      c.fillText('FRÁGIL', 0, 4);
      c.restore();
      void pap;
    },
  });

  def('cartaz', {
    w: 90, h: 110, foot: [-8, -8, 8, 0], shot: false,
    draw(c, p) {
      const ink = pal('ink'), pap = pal('paper');
      c.strokeStyle = ink;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, -40);
      c.stroke();
      c.fillStyle = G.Pal.negative ? pal('paperDark') : '#f7f1e3';
      c.fillRect(-36, -104, 72, 66);
      c.lineWidth = 2;
      c.strokeRect(-36, -104, 72, 66);
      // rosto do coronel
      dot(c, 0, -84, 11, pal('skin'), ink, 1.5);
      c.fillStyle = ink;
      c.beginPath();
      c.ellipse(0, -79, 12, 3, 0, 0, U.TAU);
      c.fill();
      c.beginPath();
      c.arc(0, -94, 8, Math.PI, 0);
      c.fill();
      c.fillRect(-12, -95, 24, 2);
      dot(c, -4, -86, 1.3, ink);
      dot(c, 4, -86, 1.3, ink);
      c.fillStyle = pal('red');
      c.font = G.font(9, 'title');
      c.textAlign = 'center';
      const lines = [['VOTE', 'CORONEL'], ['O FINAL', 'É MEU'], ['ORDEM E', 'PAPELÃO']][(p.v || 0) % 3];
      c.fillText(lines[0], 0, -58);
      c.fillText(lines[1], 0, -46);
      void pap;
    },
  });

  def('poste', {
    w: 50, h: 120, foot: [-5, -6, 5, 0], shot: false, cache: false, light: 170,
    draw(c, p, t) {
      const ink = pal('ink');
      c.fillStyle = ink;
      c.fillRect(-3, -100, 6, 100);
      c.fillRect(-8, -6, 16, 6);
      c.strokeStyle = ink;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(0, -96);
      c.quadraticCurveTo(10, -110, 18, -100);
      c.stroke();
      c.fillStyle = '#ffd9a0';
      c.beginPath();
      c.moveTo(12, -100);
      c.lineTo(24, -100);
      c.lineTo(22, -88);
      c.lineTo(14, -88);
      c.closePath();
      c.fill();
      c.lineWidth = 1.5;
      c.stroke();
      c.globalAlpha = 0.25 + Math.sin(t * 7) * 0.05;
      dot(c, 18, -92, 12, '#ffd9a0');
      c.globalAlpha = 1;
      void p;
    },
  });

  def('banca', {
    w: 110, h: 100, foot: [-46, -30, 46, 0], shot: true,
    draw(c) {
      const ink = pal('ink'), pap = pal('paper');
      c.fillStyle = '#6f97ba';
      c.strokeStyle = ink;
      c.lineWidth = 2.5;
      c.fillRect(-46, -70, 92, 70);
      c.strokeRect(-46, -70, 92, 70);
      c.fillStyle = ink;
      c.fillRect(-52, -84, 104, 16);
      c.fillStyle = pap;
      c.font = G.font(12, 'title');
      c.textAlign = 'center';
      c.fillText('JORNAIS', 0, -72);
      for (let i = 0; i < 5; i++) {
        c.fillStyle = G.Pal.negative ? pal('paperDark') : '#f7f1e3';
        c.fillRect(-40 + i * 16, -60, 14, 20);
        c.strokeRect(-40 + i * 16, -60, 14, 20);
        c.fillStyle = ink;
        c.fillRect(-38 + i * 16, -56, 10, 2);
      }
    },
  });

  def('barril', {
    w: 40, h: 50, foot: [-14, -14, 14, 0], shot: true,
    draw(c) {
      const ink = pal('ink');
      c.fillStyle = pal('mid');
      c.strokeStyle = ink;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-13, 0);
      c.quadraticCurveTo(-17, -18, -13, -36);
      c.lineTo(13, -36);
      c.quadraticCurveTo(17, -18, 13, 0);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = ink;
      c.fillRect(-15, -30, 30, 3);
      c.fillRect(-15, -8, 30, 3);
      ell(c, 0, -36, 13, 4, pal('mid'), ink, 2);
    },
  });

  def('engrenagem', {
    w: 70, h: 70, foot: null, cache: false,
    draw(c, p, t) {
      const ink = pal('ink');
      c.save();
      c.translate(0, -30);
      c.rotate(t * 0.5 * (p.v % 2 ? 1 : -1));
      c.fillStyle = ink;
      c.beginPath();
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * U.TAU;
        const r = i % 2 ? 22 : 28;
        c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.closePath();
      c.fill();
      dot(c, 0, 0, 8, pal('mid'), ink, 2);
      c.restore();
    },
  });

  // --- Margem ------------------------------------------------------------
  def('letraG', {
    w: 90, h: 120, foot: [-26, -20, 26, 0], shot: true,
    draw(c, p) {
      c.fillStyle = 'rgba(0,0,0,0.3)';
      c.beginPath();
      c.ellipse(0, 0, 30, 8, 0, 0, U.TAU);
      c.fill();
      c.fillStyle = '#1d1712';
      c.font = G.font(110, 'title');
      c.textAlign = 'center';
      c.fillText(p.ch || 'A', 0, -4);
      c.fillStyle = '#efe6d0';
      const r = U.rng((p.ch || 'A').charCodeAt(0));
      for (let i = 0; i < 6; i++) Art.gouge(c, -20 + r() * 40, -80 + r() * 60, 10, r() * 3, 1.5);
    },
  });

  def('penaG', {
    w: 100, h: 180, foot: [-10, -10, 10, 0], shot: true,
    draw(c) {
      const ink = '#1d1712', pap = '#efe6d0';
      c.save();
      c.rotate(0.25);
      c.fillStyle = pap;
      c.strokeStyle = ink;
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(-34, -80, -8, -170);
      c.quadraticCurveTo(26, -90, 0, 0);
      c.fill();
      c.stroke();
      c.lineWidth = 1.2;
      c.beginPath();
      for (let i = 1; i < 16; i++) {
        c.moveTo(-2, -i * 10);
        c.lineTo(-20 + i * 0.6, -i * 10 - 8);
        c.moveTo(-2, -i * 10);
        c.lineTo(12 - i * 0.4, -i * 10 - 6);
      }
      c.stroke();
      c.fillStyle = ink;
      c.beginPath();
      c.moveTo(-3, 0);
      c.lineTo(0, 16);
      c.lineTo(3, 0);
      c.fill();
      c.restore();
    },
  });

  def('tinteiroG', {
    w: 150, h: 130, foot: [-58, -40, 58, 0], shot: true,
    draw(c) {
      const ink = '#1d1712', pap = '#efe6d0';
      c.fillStyle = 'rgba(0,0,0,0.3)';
      c.beginPath();
      c.ellipse(0, 0, 64, 14, 0, 0, U.TAU);
      c.fill();
      c.fillStyle = pap;
      c.strokeStyle = ink;
      c.lineWidth = 3;
      Art.rrect(c, -56, -96, 112, 96, 24);
      c.fill();
      c.stroke();
      c.fillStyle = ink;
      c.save();
      Art.rrect(c, -56, -96, 112, 96, 24);
      c.clip();
      c.fillRect(-60, -40, 120, 60);
      c.restore();
      // rachadura
      c.strokeStyle = ink;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(20, -96);
      c.lineTo(10, -70);
      c.lineTo(26, -56);
      c.lineTo(14, -40);
      c.stroke();
      c.fillStyle = pap;
      c.fillRect(-20, -118, 40, 22);
      c.strokeRect(-20, -118, 40, 22);
    },
  });

  function theme() {
    return G.Pal.name || 'papel';
  }

  // desenha um prop (com cache quando possível)
  PR.draw = function (ctx, p, t) {
    const d = PR[p.kind];
    if (!d) return;
    if (d.cache) {
      const key = 'prop:' + p.kind + ':' + (p.v || 0) + ':' + (p.flower ? 1 : 0) + ':' + (p.ch || '') + ':' + (p.fruit ? 1 : 0) + ':' + theme() + ':' + (p.vert ? 1 : 0);
      const pad = 14;
      const cv = G.Cache.get(key, d.w + pad * 2, d.h + pad * 2, (c) => {
        c.translate(d.w / 2 + pad, d.h + pad);
        d.draw(c, p, 0);
      });
      ctx.drawImage(cv, p.x - d.w / 2 - pad, p.y - d.h - pad, cv.lw, cv.lh);
    } else {
      ctx.save();
      ctx.translate(p.x, p.y);
      d.draw(ctx, p, t);
      ctx.restore();
    }
  };
})();
