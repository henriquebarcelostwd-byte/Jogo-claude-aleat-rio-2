/* PELEJA — retratos de diálogo (bustos em xilogravura, com expressões) */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Art = G.Art;
  const SP = G.Sprites;
  const dot = SP.dot;
  const ell = SP.ell;
  const PT = (G.Portraits = {});

  // paleta fixa (retratos não invertem no mundo negativo)
  const P = {
    ink: '#1d1712', paper: '#efe2c4', light: '#f8f0dc', red: '#c23a22', mid: '#8b6a4a', skin: '#a87a55',
    skinDark: '#6f4a31', skinMid: '#8a5c3c', skinLight: '#c99b76', gold: '#d9a93a', straw: '#d8b46a', blue: '#6f97ba',
    card: '#b88d5a', white: '#f7f1e3', linen: '#f4ecd8', lace: '#fbf6ea', yellow: '#e6c14f', inkSoft: '#3b2f26',
  };
  const col = (c) => P[c] || G.C[c] || c;

  // cor de fundo de cada retrato
  const BG = {
    zab: '#e2b25a', nan: '#b9c7cf', sab: '#d9a07a', filo: '#e7c46a', can: '#cdb79a', vir: '#c9c0b0', ze: '#e3c27e',
    tiao: '#d3a56c', tete: '#bcd3dc', lala: '#bcd3dc', anz: '#a9c6d4', biu: '#e2b4ad', juca: '#e8c1bb', zef: '#e8c1bb',
    fir: '#d8d2c2', luz: '#efc9c0', man: '#d9b36a', manC: '#c9a05a', ren: '#b7cdd6', renC: '#a7bdc6', cor: '#e2b0a8', tra: '#2a221b', lor: '#e3c27e',
    mocaa: '#e3c27e', vend: '#e3c27e', meni: '#e3c27e',
  };
  const SPEC_OF = {
    zab: 'zabele', sab: 'sabia', filo: 'filo', can: 'candinha', vir: 'virgula', ze: 'ze', tiao: 'tiao', tete: 'tete',
    lala: 'lala', anz: 'anzol', biu: 'biu', juca: 'juca', zef: 'zefinha', fir: 'firmino', luz: 'luzia', moca: 'moca',
    vend: 'vendedor', meni: 'menino', jag: 'jagunco',
  };

  // parâmetros de expressão
  const EX = {
    neutro: { brow: 0, browY: 0, eye: 1, mouth: 'flat' },
    feliz: { brow: -0.1, browY: -2, eye: 'happy', mouth: 'smile' },
    bravo: { brow: 0.45, browY: 3, eye: 0.75, mouth: 'frown' },
    surpreso: { brow: -0.3, browY: -6, eye: 1.3, mouth: 'o' },
    triste: { brow: -0.45, browY: -1, eye: 0.8, mouth: 'sad' },
    determinado: { brow: 0.25, browY: 2, eye: 0.85, mouth: 'firm' },
    pensativo: { brow: 0.1, browY: 0, eye: 0.9, mouth: 'side', look: 1, browRaise: 1 },
    sarcastico: { brow: 0.1, browY: 1, eye: 0.6, mouth: 'smirk', browRaise: 1 },
    assustado: { brow: -0.4, browY: -5, eye: 1.25, mouth: 'wide', sweat: true },
    chorando: { brow: -0.5, browY: -1, eye: 'closed', mouth: 'sad', tears: true },
    rindo: { brow: -0.1, browY: -3, eye: 'happy', mouth: 'laugh' },
    fechado: { brow: 0, browY: 0, eye: 'closed', mouth: 'flat' },
  };
  PT.EX = EX;

  function bg(ctx, who, S) {
    ctx.save();
    ctx.fillStyle = BG[who] || '#d9c49a';
    ctx.fillRect(0, 0, S, S);
    // hachura diagonal "entalhada"
    ctx.globalAlpha = who === 'tra' ? 0.25 : 0.18;
    Art.hatch(ctx, 0, 0, S, S, 6, -0.9, 1.1, who === 'tra' ? '#f3ead6' : P.ink);
    ctx.globalAlpha = 1;
    // sol/nimbo atrás da cabeça
    ctx.fillStyle = who === 'tra' ? 'rgba(243,234,214,0.08)' : 'rgba(255,248,230,0.35)';
    ctx.beginPath();
    ctx.arc(S / 2, S * 0.45, S * 0.38, 0, U.TAU);
    ctx.fill();
    ctx.restore();
  }

  // --- rosto genérico grande -------------------------------------------------
  function bigFace(ctx, f, e, cx, cy, r, talk, t, skinC) {
    const ink = P.ink;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const ex = r * 0.38;
    const ey = cy + r * 0.02;
    const blink = t % 4.1 < 0.1;
    const lookX = (e.look || 0) * r * 0.08;
    // olhos
    if (f.glasses === 'escuros') {
      for (const s of [-1, 1]) {
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.ellipse(cx + s * ex, ey, r * 0.27, r * 0.22, 0, 0, U.TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,248,230,0.7)';
        Art.gouge(ctx, cx + s * ex - r * 0.08, ey - r * 0.08, r * 0.15, -0.7, r * 0.04);
      }
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - ex + r * 0.25, ey - 2);
      ctx.quadraticCurveTo(cx, ey - r * 0.1, cx + ex - r * 0.25, ey - 2);
      ctx.stroke();
    } else {
      for (const s of [-1, 1]) {
        const x = cx + s * ex;
        if (e.eye === 'happy') {
          ctx.strokeStyle = ink;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, ey + r * 0.06, r * 0.14, Math.PI * 1.15, Math.PI * 1.85);
          ctx.stroke();
        } else if (e.eye === 'closed' || blink) {
          ctx.strokeStyle = ink;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, ey - r * 0.04, r * 0.14, Math.PI * 0.15, Math.PI * 0.85);
          ctx.stroke();
        } else {
          const k = typeof e.eye === 'number' ? e.eye : 1;
          ctx.fillStyle = P.light;
          ctx.strokeStyle = ink;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(x, ey, r * 0.17, r * 0.13 * k + 0.5, 0, 0, U.TAU);
          ctx.fill();
          ctx.stroke();
          ctx.save();
          ctx.clip();
          dot(ctx, x + lookX, ey + 0.5, r * 0.1, ink);
          dot(ctx, x + lookX - r * 0.03, ey - r * 0.03, r * 0.03, P.light);
          ctx.restore();
          // pálpebra de cima
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.ellipse(x, ey, r * 0.17, r * 0.13 * k + 0.5, 0, Math.PI * 1.05, Math.PI * 1.95);
          ctx.stroke();
          if (f.lashes) {
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(x + s * r * 0.16, ey - r * 0.06);
            ctx.lineTo(x + s * r * 0.24, ey - r * 0.14);
            ctx.stroke();
          }
        }
        if (f.glasses === 'redondos') {
          ctx.strokeStyle = ink;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, ey, r * 0.23, 0, U.TAU);
          ctx.stroke();
          if (s === -1) {
            ctx.beginPath();
            ctx.moveTo(x + r * 0.23, ey);
            ctx.lineTo(cx + ex - r * 0.23, ey);
            ctx.stroke();
          }
        }
      }
    }
    // sobrancelhas
    ctx.strokeStyle = f.whiteBrows ? P.white : ink;
    ctx.lineWidth = f.whiteBrows ? 4.5 : 3.4;
    const by = ey - r * 0.27 + (e.browY || 0) * 0.6;
    for (const s of [-1, 1]) {
      const raise = e.browRaise && s === 1 ? -r * 0.08 : 0;
      const a = (e.brow || 0) * s;
      const x = cx + s * ex;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.17, by + raise - Math.sin(-a) * r * 0.12 * -s);
      ctx.lineTo(x + r * 0.17, by + raise + Math.sin(-a) * r * 0.12 * -s);
      ctx.stroke();
      if (f.whiteBrows) {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.strokeStyle = P.white;
        ctx.lineWidth = 4.5;
      }
    }
    // nariz
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.02, ey + r * 0.05);
    ctx.quadraticCurveTo(cx + r * 0.1, ey + r * 0.28, cx - r * 0.06, ey + r * 0.3);
    ctx.stroke();
    // bochechas
    if (f.cheeks) {
      ctx.fillStyle = 'rgba(194,58,34,0.28)';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(cx + s * r * 0.55, ey + r * 0.3, r * 0.13, r * 0.08, 0, 0, U.TAU);
        ctx.fill();
      }
    }
    if (f.freckles) {
      ctx.fillStyle = ink;
      for (const s of [-1, 1]) for (let k = 0; k < 4; k++) dot(ctx, cx + s * r * (0.42 + (k % 2) * 0.08), ey + r * (0.2 + k * 0.04), 1, ink);
    }
    if (f.wrinkles) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.25, cy - r * 0.62);
      ctx.lineTo(cx + r * 0.25, cy - r * 0.62);
      ctx.moveTo(cx - r * 0.18, cy - r * 0.54);
      ctx.lineTo(cx + r * 0.18, cy - r * 0.54);
      for (const s of [-1, 1]) {
        ctx.moveTo(cx + s * r * 0.62, ey + r * 0.02);
        ctx.lineTo(cx + s * r * 0.7, ey + r * 0.1);
      }
      ctx.stroke();
    }
    // boca
    const my = cy + r * 0.52;
    const open = talk && Math.floor(t * 11) % 2 === 0;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.6;
    ctx.fillStyle = P.redDark || '#7a2014';
    const mouthOpen = (w, h) => {
      ctx.fillStyle = '#5a1810';
      ctx.beginPath();
      ctx.ellipse(cx, my, w, h, 0, 0, U.TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = P.red;
      ctx.beginPath();
      ctx.ellipse(cx, my + h * 0.45, w * 0.6, h * 0.35, 0, 0, U.TAU);
      ctx.fill();
    };
    const m = e.mouth;
    if (open && m !== 'o' && m !== 'wide' && m !== 'laugh') {
      mouthOpen(r * 0.14, r * 0.09);
    } else if (m === 'smile') {
      ctx.beginPath();
      ctx.arc(cx, my - r * 0.14, r * 0.2, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
    } else if (m === 'laugh') {
      ctx.fillStyle = '#5a1810';
      ctx.beginPath();
      ctx.arc(cx, my - r * 0.06, r * 0.2, 0.1, Math.PI - 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (m === 'frown' || m === 'sad') {
      ctx.beginPath();
      ctx.arc(cx, my + r * 0.14, r * 0.16, Math.PI * 1.22, Math.PI * 1.78);
      ctx.stroke();
      if (m === 'frown') {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.1, my + r * 0.01);
        ctx.lineTo(cx + r * 0.1, my + r * 0.01);
        ctx.stroke();
      }
    } else if (m === 'o') {
      mouthOpen(r * 0.08, r * (open ? 0.13 : 0.11));
    } else if (m === 'wide') {
      mouthOpen(r * 0.17, r * (open ? 0.12 : 0.1));
    } else if (m === 'firm') {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.14, my);
      ctx.quadraticCurveTo(cx, my - r * 0.04, cx + r * 0.16, my - r * 0.03);
      ctx.stroke();
    } else if (m === 'side' || m === 'smirk') {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.12, my + r * 0.02);
      ctx.quadraticCurveTo(cx + r * 0.05, my + r * 0.03, cx + r * 0.17, my - r * (m === 'smirk' ? 0.08 : 0.01));
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.13, my);
      ctx.quadraticCurveTo(cx, my + r * 0.03, cx + r * 0.13, my);
      ctx.stroke();
    }
    // bigode
    if (f.mustache) {
      const white = f.mustache === 'fino';
      ctx.fillStyle = white ? P.white : ink;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.4;
      if (f.mustache === 'caracol') {
        ctx.lineWidth = 3;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(cx, my - r * 0.14);
          ctx.quadraticCurveTo(cx + s * r * 0.3, my - r * 0.25, cx + s * r * 0.36, my - r * 0.05);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx + s * r * 0.3, my - r * 0.04, r * 0.06, 0, U.TAU * 0.85);
          ctx.stroke();
        }
      } else {
        const w = f.mustache === 'grosso' ? 0.38 : 0.3;
        ctx.beginPath();
        ctx.moveTo(cx, my - r * 0.16);
        ctx.quadraticCurveTo(cx - r * w, my - r * 0.24, cx - r * (w + 0.06), my - r * 0.02);
        ctx.quadraticCurveTo(cx - r * 0.15, my - r * 0.1, cx, my - r * 0.07);
        ctx.quadraticCurveTo(cx + r * 0.15, my - r * 0.1, cx + r * (w + 0.06), my - r * 0.02);
        ctx.quadraticCurveTo(cx + r * w, my - r * 0.24, cx, my - r * 0.16);
        ctx.fill();
        ctx.stroke();
      }
    }
    if (f.beard === 'branca') {
      ctx.fillStyle = P.white;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.92, cy + r * 0.05);
      ctx.quadraticCurveTo(cx - r * 0.95, cy + r * 1.3, cx, cy + r * 1.55);
      ctx.quadraticCurveTo(cx + r * 0.95, cy + r * 1.3, cx + r * 0.92, cy + r * 0.05);
      ctx.quadraticCurveTo(cx + r * 0.5, cy + r * 0.5, cx + r * 0.2, cy + r * 0.42);
      ctx.lineTo(cx - r * 0.2, cy + r * 0.42);
      ctx.quadraticCurveTo(cx - r * 0.5, cy + r * 0.5, cx - r * 0.92, cy + r * 0.05);
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = -4; i <= 4; i++) {
        ctx.moveTo(cx + i * r * 0.14, cy + r * 0.7);
        ctx.quadraticCurveTo(cx + i * r * 0.17, cy + r * 1.05, cx + i * r * 0.1, cy + r * 1.35);
      }
      ctx.stroke();
      // bigode branco e boca por baixo
      ctx.fillStyle = P.white;
      ctx.beginPath();
      ctx.ellipse(cx, my - r * 0.1, r * 0.34, r * 0.1, 0, 0, U.TAU);
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.stroke();
      if (open) mouthOpen(r * 0.12, r * 0.07);
      else {
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.1, my + r * 0.04);
        ctx.lineTo(cx + r * 0.1, my + r * 0.04);
        ctx.stroke();
      }
    } else if (f.beard === 'curta') {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.9, cy + r * 0.1);
      ctx.quadraticCurveTo(cx - r * 0.7, cy + r * 1.05, cx, cy + r * 1.08);
      ctx.quadraticCurveTo(cx + r * 0.7, cy + r * 1.05, cx + r * 0.9, cy + r * 0.1);
      ctx.quadraticCurveTo(cx + r * 0.6, cy + r * 0.55, cx, cy + r * 0.7);
      ctx.quadraticCurveTo(cx - r * 0.6, cy + r * 0.55, cx - r * 0.9, cy + r * 0.1);
      ctx.fill();
      ctx.fillStyle = P.light;
      for (let i = 0; i < 8; i++) Art.gouge(ctx, cx - r * 0.6 + i * r * 0.17, cy + r * (0.75 + (i % 2) * 0.1), r * 0.1, 1.3, 1.2);
      if (open) mouthOpen(r * 0.12, r * 0.07);
    }
    // lágrimas / suor
    if (e.tears) {
      ctx.fillStyle = P.blue;
      for (const s of [-1, 1]) {
        const k = (t * 0.8 + (s > 0 ? 0.5 : 0)) % 1;
        const x = cx + s * ex, y = ey + r * 0.15 + k * r * 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y - 5);
        ctx.quadraticCurveTo(x + 4, y + 2, x, y + 4);
        ctx.quadraticCurveTo(x - 4, y + 2, x, y - 5);
        ctx.fill();
      }
    }
    if (e.sweat) {
      ctx.fillStyle = P.blue;
      const x = cx + r * 0.8, y = cy - r * 0.45;
      ctx.beginPath();
      ctx.moveTo(x, y - 7);
      ctx.quadraticCurveTo(x + 6, y + 3, x, y + 5);
      ctx.quadraticCurveTo(x - 6, y + 3, x, y - 7);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    if (f.earrings) {
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 3;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(cx + s * r * 0.98, cy + r * 0.45, r * 0.17, 0, U.TAU);
        ctx.stroke();
      }
    }
    void skinC;
  }

  function bigHair(ctx, h, cx, cy, r, t, back) {
    if (!h || !h.style || h.style === 'none') return;
    const c = col(h.color || 'ink');
    ctx.fillStyle = c;
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 2.4;
    if (back) {
      if (h.style === 'long') {
        ctx.beginPath();
        ctx.moveTo(cx - r * 1.02, cy - r * 0.2);
        ctx.quadraticCurveTo(cx - r * 1.3, cy + r * 1.2, cx - r * 0.9, cy + r * 1.9);
        ctx.lineTo(cx + r * 0.9, cy + r * 1.9);
        ctx.quadraticCurveTo(cx + r * 1.3, cy + r * 1.2, cx + r * 1.02, cy - r * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      if (h.style === 'braid') {
        // trança por cima do ombro
        let px = cx - r * 0.85, py = cy + r * 0.3;
        for (let i = 0; i < 6; i++) {
          const nx = px - r * 0.06, ny = py + r * 0.28;
          ell(ctx, (px + nx) / 2, (py + ny) / 2, r * 0.18, r * 0.17, c, P.ink, 2);
          ctx.strokeStyle = P.light;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo((px + nx) / 2 - r * 0.1, (py + ny) / 2 - 2);
          ctx.lineTo((px + nx) / 2 + r * 0.1, (py + ny) / 2 + 2);
          ctx.stroke();
          px = nx;
          py = ny;
        }
        ctx.fillStyle = P.red;
        ctx.strokeStyle = P.ink;
        ctx.lineWidth = 1.5;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + s * 13, py - 7);
          ctx.lineTo(px + s * 13, py + 7);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
      if (h.style === 'bun') dot(ctx, cx, cy - r * 1.05, r * 0.42, c, P.ink, 2.4);
      return;
    }
    switch (h.style) {
      case 'wild': {
        ctx.beginPath();
        const n = 15;
        for (let i = 0; i <= n; i++) {
          const a = Math.PI * 0.9 + (i / n) * Math.PI * 1.2;
          const rr = r * (i % 2 ? 1.05 : 1.45 + Math.sin(t * 2 + i) * 0.04);
          const px = cx + Math.cos(a) * rr, py = cy - r * 0.05 + Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.quadraticCurveTo(cx, cy - r * 0.5, cx - r, cy + r * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'bowl':
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.05, r * 1.08, Math.PI * 0.95, Math.PI * 2.05);
        ctx.lineTo(cx + r * 1.02, cy - r * 0.2);
        ctx.lineTo(cx - r * 1.02, cy - r * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = P.light;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = -5; i <= 5; i++) {
          ctx.moveTo(cx + i * r * 0.17, cy - r * 0.25);
          ctx.lineTo(cx + i * r * 0.2, cy - r * 0.8);
        }
        ctx.stroke();
        break;
      default:
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.04, Math.PI * 1.02, Math.PI * 1.98);
        ctx.quadraticCurveTo(cx + r * 0.5, cy - r * 0.6, cx + r * 0.05, cy - r * 0.55);
        ctx.quadraticCurveTo(cx - r * 0.4, cy - r * 0.62, cx - r * 1.04, cy - r * 0.05);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = h.color === 'white' ? P.ink : P.light;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.moveTo(cx - r * 0.6 + i * r * 0.25, cy - r * 0.85);
          ctx.quadraticCurveTo(cx - r * 0.5 + i * r * 0.26, cy - r * 0.7, cx - r * 0.55 + i * r * 0.3, cy - r * 0.6);
        }
        ctx.stroke();
        if (h.style === 'bun') {
          dot(ctx, cx, cy - r * 1.1, r * 0.4, col(h.color), P.ink, 2.4);
          ctx.strokeStyle = P.gold;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.5, cy - r * 1.25);
          ctx.lineTo(cx + r * 0.5, cy - r * 0.95);
          ctx.stroke();
        }
        if (h.style === 'long') {
          for (const s of [-1, 1]) {
            ctx.fillStyle = col(h.color);
            ctx.beginPath();
            ctx.moveTo(cx + s * r * 1.02, cy - r * 0.1);
            ctx.quadraticCurveTo(cx + s * r * 1.15, cy + r * 0.7, cx + s * r * 0.95, cy + r * 1.3);
            ctx.lineTo(cx + s * r * 0.75, cy + r * 0.7);
            ctx.lineTo(cx + s * r * 0.85, cy);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = P.ink;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
    }
  }

  function bigHat(ctx, hs, cx, cy, r, t) {
    if (!hs || !hs.type || hs.type === 'none') return;
    const c = col(hs.color || 'ink');
    const ink = P.ink;
    const top = cy - r;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.6;
    switch (hs.type) {
      case 'couro': {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.ellipse(cx, top + r * 0.2, r * 0.95, r * 0.55, 0, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, top + r * 0.62, r * 1.62, Math.PI * 1.1, Math.PI * 1.9);
        ctx.arc(cx, top + r * 0.78, r * 0.98, Math.PI * 1.83, Math.PI * 1.17, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = P.light;
        Art.star(ctx, cx, top - r * 0.28, r * 0.3, r * 0.14, 6);
        ctx.fill();
        for (let i = 0; i < 11; i++) {
          const a = Math.PI * (1.14 + (i / 10) * 0.72);
          dot(ctx, cx + Math.cos(a) * r * 1.33, top + r * 0.64 + Math.sin(a) * r * 1.33, 2, P.light);
        }
        ctx.strokeStyle = P.light;
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 6; i++) {
          const a = Math.PI * (1.2 + (i / 5) * 0.6);
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * r * 1.05, top + r * 0.7 + Math.sin(a) * r * 1.05);
          ctx.lineTo(cx + Math.cos(a) * r * 1.22, top + r * 0.7 + Math.sin(a) * r * 1.22);
          ctx.stroke();
        }
        // barbicacho
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.95, top + r * 0.55);
        ctx.quadraticCurveTo(cx - r * 0.95, cy + r * 1.05, cx, cy + r * 1.08);
        ctx.stroke();
        break;
      }
      case 'palha':
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.ellipse(cx, top + r * 0.25, r * 1.95, r * 0.5, 0, 0, U.TAU);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.9, top + r * 0.25);
        ctx.quadraticCurveTo(cx - r * 0.85, top - r * 0.75, cx, top - r * 0.8);
        ctx.quadraticCurveTo(cx + r * 0.85, top - r * 0.75, cx + r * 0.9, top + r * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.ellipse(cx, top + r * 0.25, r * 1.95, r * 0.5, 0, 0, U.TAU);
        ctx.clip();
        Art.hatch(ctx, cx - r * 2, top - r, r * 4, r * 2, 4, 1, 1, ink);
        ctx.restore();
        ctx.fillStyle = ink;
        ctx.fillRect(cx - r * 0.88, top - r * 0.02, r * 1.76, r * 0.16);
        break;
      case 'turbante':
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = i % 2 ? P.red : c;
          ctx.beginPath();
          ctx.ellipse(cx + (i % 2 ? 3 : -3), top + r * 0.2 - i * r * 0.3, r * (1.12 - i * 0.1), r * 0.3, (i % 2 ? 0.08 : -0.08), 0, U.TAU);
          ctx.fill();
          ctx.stroke();
        }
        ctx.fillStyle = P.light;
        for (let i = 0; i < 9; i++) dot(ctx, cx - r * 0.8 + i * r * 0.2, top + r * 0.18 - (i % 3) * r * 0.3, 1.8, P.light);
        ctx.fillStyle = P.red;
        ctx.beginPath();
        ctx.ellipse(cx + r * 0.55, top - r * 1.1, r * 0.3, r * 0.2, -0.5, 0, U.TAU);
        ctx.fill();
        ctx.stroke();
        break;
      case 'virgula':
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(cx, top - r * 0.2, r * 0.82, 0, U.TAU);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.7, top);
        ctx.quadraticCurveTo(cx + r * 1.35, top + r * 0.7, cx + r * 0.6, top + r * 1.5);
        ctx.quadraticCurveTo(cx + r * 0.8, top + r * 0.6, cx + r * 0.1, top + r * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = P.light;
        Art.gouge(ctx, cx - r * 0.25, top - r * 0.5, r * 0.5, -0.6, r * 0.08);
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.ellipse(cx, top + r * 0.35, r * 1.25, r * 0.2, 0, 0, U.TAU);
        ctx.fill();
        ctx.stroke();
        break;
      case 'boina':
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.1, top + r * 0.1, r * 1.12, r * 0.5, -0.1, 0, U.TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.ellipse(cx + r * 0.2, top + r * 0.45, r * 0.8, r * 0.16, 0.1, 0, U.TAU);
        ctx.fill();
        break;
      case 'papel':
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(cx - r * 1.3, top + r * 0.4);
        ctx.lineTo(cx, top - r * 1.1);
        ctx.lineTo(cx + r * 1.3, top + r * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(29,23,18,0.5)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.moveTo(cx - r * 0.55 + i * r * 0.05, top - r * 0.2 + i * r * 0.12);
          ctx.lineTo(cx + r * 0.55 - i * r * 0.05, top - r * 0.2 + i * r * 0.12);
        }
        ctx.stroke();
        ctx.fillStyle = ink;
        ctx.fillRect(cx - r * 1.3, top + r * 0.3, r * 2.6, r * 0.14);
        break;
      case 'vaqueiro':
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.ellipse(cx, top + r * 0.3, r * 1.7, r * 0.45, 0, 0, U.TAU);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, top + r * 0.25, r * 0.88, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = P.light;
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, top + r * 0.3, r * 1.45, r * 0.32, 0, 0, U.TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      case 'chef':
        ctx.fillStyle = c;
        ctx.fillRect(cx - r * 0.8, top - r * 0.35, r * 1.6, r * 0.55);
        ctx.strokeRect(cx - r * 0.8, top - r * 0.35, r * 1.6, r * 0.55);
        for (const s of [-1, 0, 1]) dot(ctx, cx + s * r * 0.48, top - r * 0.62, r * 0.42, c, ink, 2.6);
        break;
      case 'flores':
        for (const [dx, dy, cc] of [[-0.75, -0.55, c], [-0.2, -0.95, P.light], [0.55, -0.72, c]]) {
          for (let k = 0; k < 6; k++) dot(ctx, cx + dx * r + Math.cos((k * U.TAU) / 6) * r * 0.14, cy + dy * r + Math.sin((k * U.TAU) / 6) * r * 0.14, r * 0.1, cc, ink, 1.2);
          dot(ctx, cx + dx * r, cy + dy * r, r * 0.07, P.gold);
        }
        break;
      default:
        break;
    }
    void t;
  }

  function shoulders(ctx, spec, S, t) {
    const top = spec.top || {};
    const ink = P.ink;
    const w = S * 0.46 * Math.min(1.25, spec.w || 1);
    ctx.fillStyle = col(top.color === 'ink' ? 'ink' : top.color || 'paper');
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(S / 2 - w, S + 4);
    ctx.quadraticCurveTo(S / 2 - w, S * 0.78, S / 2 - S * 0.14, S * 0.74);
    ctx.lineTo(S / 2 + S * 0.14, S * 0.74);
    ctx.quadraticCurveTo(S / 2 + w, S * 0.78, S / 2 + w, S + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.clip();
    const pc = col(top.pc || 'paper');
    ctx.strokeStyle = pc;
    ctx.fillStyle = pc;
    if (top.pattern === 'stripes') Art.hatch(ctx, 0, S * 0.7, S, S * 0.4, 7, Math.PI / 2, 2.4, pc);
    if (top.pattern === 'hstripes') Art.hatch(ctx, 0, S * 0.7, S, S * 0.4, 8, 0, 3, pc);
    if (top.pattern === 'stitch') {
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(S / 2 - w + 12, S * 0.85);
      ctx.quadraticCurveTo(S / 2, S * 0.8, S / 2 + w - 12, S * 0.85);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (top.pattern === 'lace') {
      ctx.lineWidth = 1.2;
      for (let y = S * 0.76; y < S; y += 8) for (let x = 0; x < S; x += 8) {
        ctx.beginPath();
        ctx.arc(x + ((y / 8) % 2 ? 4 : 0), y, 2.4, 0, U.TAU);
        ctx.stroke();
      }
    }
    if (top.pattern === 'box') Art.hatch(ctx, 0, S * 0.7, S, S * 0.4, 4, Math.PI / 2, 1, 'rgba(29,23,18,0.3)');
    if (top.pattern === 'couro') {
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(S / 2, S * 0.75);
      ctx.lineTo(S / 2, S);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (top.pattern === 'suit') {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(S / 2 - 16, S * 0.74);
      ctx.lineTo(S / 2, S * 0.97);
      ctx.lineTo(S / 2 + 16, S * 0.74);
      ctx.stroke();
    }
    ctx.restore();
    const acc = spec.acc || [];
    if (acc.includes('lenco')) {
      ctx.fillStyle = P.red;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(S / 2 - 22, S * 0.74);
      ctx.lineTo(S / 2 + 22, S * 0.74);
      ctx.lineTo(S / 2 + 2, S * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = P.light;
      for (let i = 0; i < 4; i++) dot(ctx, S / 2 - 12 + i * 8, S * 0.78, 1.5, P.light);
    }
    if (acc.includes('cordao')) {
      ctx.strokeStyle = P.light;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(S / 2 - w + 8, S * 0.8);
      ctx.lineTo(S / 2 + w - 20, S + 4);
      ctx.stroke();
      ctx.fillStyle = P.red;
      for (let k = 1; k <= 3; k++) ctx.fillRect(U.lerp(S / 2 - w + 8, S / 2 + w - 20, k / 4) - 3, U.lerp(S * 0.8, S + 4, k / 4) - 7, 6, 12);
    }
    if (acc.includes('gravata')) {
      ctx.fillStyle = P.red;
      ctx.beginPath();
      ctx.moveTo(S / 2, S * 0.79);
      ctx.lineTo(S / 2 - 12, S * 0.74);
      ctx.lineTo(S / 2 - 12, S * 0.85);
      ctx.closePath();
      ctx.moveTo(S / 2, S * 0.79);
      ctx.lineTo(S / 2 + 12, S * 0.74);
      ctx.lineTo(S / 2 + 12, S * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    if (acc.includes('xale')) {
      ctx.fillStyle = spec === SP.SPECS.lala ? P.lace : P.ink;
      ctx.beginPath();
      ctx.moveTo(S / 2 - w - 2, S * 0.83);
      ctx.quadraticCurveTo(S / 2, S * 0.7, S / 2 + w + 2, S * 0.83);
      ctx.lineTo(S / 2, S + 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (acc.includes('viola')) {
      ctx.save();
      ctx.translate(S * 0.78, S * 1.0);
      ctx.rotate(-0.6);
      ctx.fillStyle = P.ink;
      ctx.fillRect(-4, -S * 0.5, 8, S * 0.45);
      ctx.fillStyle = P.mid;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 16, 0, 0, U.TAU);
      ctx.fill();
      ctx.stroke();
      dot(ctx, 0, -2, 6, ink);
      ctx.restore();
    }
    void t;
  }

  function humanBust(ctx, who, spec, e, S, talk, t) {
    const cx = S / 2;
    const cy = S * 0.47;
    const r = S * 0.24;
    const skin = col(spec.skin || 'skin');
    bigHair(ctx, spec.hair, cx, cy, r, t, true);
    shoulders(ctx, spec, S, t);
    // pescoço
    ctx.fillStyle = skin;
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 2.6;
    ctx.fillRect(cx - r * 0.35, cy + r * 0.6, r * 0.7, r * 0.8);
    ctx.strokeRect(cx - r * 0.35, cy + r * 0.6, r * 0.7, r * 0.8);
    if ((spec.acc || []).includes('lenco')) {
      ctx.fillStyle = P.red;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.5, cy + r * 1.15);
      ctx.lineTo(cx + r * 0.5, cy + r * 1.15);
      ctx.lineTo(cx, cy + r * 1.55);
      ctx.fill();
      ctx.stroke();
    }
    // orelhas
    for (const s of [-1, 1]) dot(ctx, cx + s * r * 0.98, cy + r * 0.08, r * 0.17, skin, P.ink, 2.2);
    // cabeça
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.97, r * 1.05, 0, 0, U.TAU);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.stroke();
    // sombreado entalhado
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.97, r * 1.05, 0, 0, U.TAU);
    ctx.clip();
    ctx.globalAlpha = 0.22;
    Art.hatch(ctx, cx + r * 0.45, cy - r, r * 0.6, r * 2.2, 3.5, -1.1, 1.1, P.ink);
    ctx.restore();
    bigHair(ctx, spec.hair, cx, cy, r, t, false);
    const f = Object.assign({}, spec.face || {});
    if (who === 'sab' || who === 'can' || who === 'fir') f.whiteBrows = who !== 'sab' ? true : false;
    bigFace(ctx, f, e, cx, cy, r, talk, t, skin);
    bigHat(ctx, spec.hat, cx, cy, r, t);
    if ((spec.acc || []).includes('passaro')) {
      ctx.save();
      ctx.translate(cx + r * 0.3, cy - r * 1.95);
      ctx.scale(2.6, 2.6);
      SP.bird(ctx, { t }, 0, 0, 1);
      ctx.restore();
    }
    if ((spec.acc || []).includes('cachimbo')) {
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.12, cy + r * 0.55);
      ctx.lineTo(cx + r * 0.75, cy + r * 0.72);
      ctx.stroke();
      ell(ctx, cx + r * 0.85, cy + r * 0.55, r * 0.14, r * 0.18, P.mid, P.ink, 2);
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.5 + i / 3) % 1;
        ctx.save();
        ctx.globalAlpha = 1 - k;
        dot(ctx, cx + r * 0.9 + Math.sin(k * 6) * 5, cy + r * 0.3 - k * r * 1.4, 3 + k * 8, P.light, P.ink, 1.2);
        ctx.restore();
      }
    }
  }

  // --- retratos especiais ----------------------------------------------------
  const SPECIAL = {
    nan(ctx, e, S, talk, t) {
      ctx.save();
      ctx.translate(S / 2, S * 0.66);
      const k = S / 150;
      ctx.scale(k * 2.9, k * 2.9);
      G.Creatures.nanquim(ctx, { x: 0, y: 20, t, float: 0, talking: talk, face: mapNan(e), level: 0.6 });
      ctx.restore();
    },
    man(ctx, e, S, talk, t) {
      ctx.save();
      ctx.translate(S / 2, S * 1.55);
      const k = S / 150;
      ctx.scale(k * 1.7, k * 1.7);
      G.Creatures.mandacaru(ctx, { x: 0, y: 0, t, talking: talk, corrupt: e.corrupt, pose: e.mouth === 'smile' || e.eye === 'happy' ? 'bloom' : 'idle', flower: e.flower });
      ctx.restore();
    },
    ren(ctx, e, S, talk, t) {
      ctx.save();
      ctx.translate(S / 2, S * 1.68);
      const k = S / 150;
      ctx.scale(k * 2.2, k * 2.2);
      G.Creatures.renda(ctx, { x: 0, y: 0, t, talking: talk, corrupt: e.corrupt, pose: e.mouth === 'sad' ? 'dazed' : 'idle' });
      ctx.restore();
    },
    cor(ctx, e, S, talk, t) {
      ctx.save();
      ctx.translate(S / 2, S * 1.38);
      const k = S / 150;
      ctx.scale(k * 2.1, k * 2.1);
      G.Creatures.coronel(ctx, { x: 0, y: 0, t, talking: talk, panic: e.sweat || e.tears || e.mouth === 'wide' });
      ctx.restore();
    },
    tra(ctx, e, S, talk, t) {
      ctx.save();
      ctx.translate(S / 2, S * 0.62);
      const k = S / 150;
      ctx.scale(k * 1.35, k * 1.35);
      G.Creatures.traca(ctx, { x: 0, y: 30, t, alt: 0, pose: e.eye === 'closed' ? 'calm' : 'land', eyeOpen: talk ? 0.7 + Math.sin(t * 9) * 0.3 : 1 });
      ctx.restore();
    },
    manC(ctx, e, S, talk, t) {
      SPECIAL.man(ctx, Object.assign({}, e, { corrupt: true }), S, talk, t);
    },
    renC(ctx, e, S, talk, t) {
      SPECIAL.ren(ctx, Object.assign({}, e, { corrupt: true }), S, talk, t);
    },
    lor(ctx, e, S, talk, t) {
      ctx.save();
      ctx.translate(S * 0.35, S * 1.02);
      const k = S / 150;
      ctx.scale(k * 2.6, k * 2.6);
      G.Creatures.lorota(ctx, { x: 0, y: 0, t, dir: 'right' });
      ctx.restore();
    },
  };
  function mapNan(e) {
    if (e.mouth === 'frown' || e.brow > 0.3) return 'angry';
    if (e.eye === 'happy') return 'happy';
    if (e.mouth === 'o' || e.mouth === 'wide') return 'surprised';
    if (e.mouth === 'sad') return 'sad';
    return 'normal';
  }

  // --- API -------------------------------------------------------------------
  PT.draw = function (ctx, who, expr, x, y, S = 150, o = {}) {
    const e = Object.assign({}, EX[expr] || EX.neutro, o.extra || {});
    const t = o.t != null ? o.t : G.time;
    ctx.save();
    ctx.translate(x, y);
    if (o.flip) {
      ctx.translate(S, 0);
      ctx.scale(-1, 1);
    }
    ctx.beginPath();
    ctx.rect(0, 0, S, S);
    ctx.save();
    ctx.clip();
    bg(ctx, who, S);
    if (SPECIAL[who]) SPECIAL[who](ctx, e, S, !!o.talk, t);
    else {
      const spec = SP.SPECS[SPEC_OF[who]] || SP.SPECS.vendedor;
      humanBust(ctx, who, spec, e, S, !!o.talk, t);
    }
    if (o.memory) {
      ctx.globalCompositeOperation = 'color';
      ctx.fillStyle = '#c23a22';
      ctx.fillRect(0, 0, S, S);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    // moldura
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, S - 4, S - 4);
    ctx.strokeStyle = P.light;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(6.5, 6.5, S - 13, S - 13);
    ctx.restore();
  };

  PT.has = (who) => !!(SPECIAL[who] || SPEC_OF[who]);
})();
