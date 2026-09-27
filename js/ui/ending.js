/* PELEJA — os três finais: PONTO FINAL. · RETICÊNCIAS... · VÍRGULA, */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Art = G.Art;
  const Au = G.Audio;
  const C = G.C;
  const P = G.Panels;

  function voidBg(ctx, t) {
    ctx.fillStyle = '#0f0c0a';
    ctx.fillRect(0, 0, G.W, G.H);
    ctx.save();
    ctx.font = G.font(18, 'title');
    for (let i = 0; i < 40; i++) {
      ctx.globalAlpha = 0.08 + U.hash(i, 4) * 0.15;
      ctx.fillStyle = '#efe6d0';
      const x = (U.hash(i, 1) * G.W + t * (8 + U.hash(i, 2) * 12)) % G.W;
      const y = (U.hash(i, 3) * G.H - t * 6 + G.H) % G.H;
      ctx.fillText('ABCDEFGHIJLMNOPQRSTUVXZ'[i % 23], x, y);
    }
    ctx.restore();
  }
  function page(ctx, x, y, w, h) {
    ctx.fillStyle = '#efe6d0';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(29,23,18,0.18)';
    ctx.lineWidth = 1.2;
    for (let yy = y + 16; yy < y + h - 6; yy += 12) {
      ctx.beginPath();
      ctx.moveTo(x + 12, yy);
      ctx.lineTo(x + w - 12 - (yy % 5) * 8, yy);
      ctx.stroke();
    }
  }
  function festa(ctx, t, o = {}) {
    Art.fillPaper(ctx, 0, 0, G.W, G.H, o.paper || '#f1dc9c');
    if (o.sun) o.sun(ctx, t);
    P.hills(ctx, 360, 50, '#b99058', 1, 0.009);
    for (let i = 0; i < 8; i++) {
      const x = 80 + i * 120;
      ctx.fillStyle = C.ink;
      ctx.fillRect(x - 34, 330, 68, 60);
      ctx.beginPath();
      ctx.moveTo(x - 42, 334);
      ctx.lineTo(x, 300);
      ctx.lineTo(x + 42, 334);
      ctx.fill();
      ctx.fillStyle = o.windows || '#f1dc9c';
      ctx.fillRect(x - 10, 350, 20, 40);
    }
    Art.bunting(ctx, 0, 250, G.W, 250, 24, o.freeze ? 0 : t, 40);
    Art.bunting(ctx, 0, 300, G.W, 300, 24, o.freeze ? 0 : t + 1, 30);
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 440, G.W, 100);
    G.Art.flame(ctx, 480, 440, 2.6, o.freeze ? 1 : t);
    const tt = o.freeze ? 1.3 : t;
    const dancers = o.dancers || ['zabele', 'filo', 'ze', 'tiao', 'candinha', 'moca', 'vendedor', 'menino'];
    dancers.forEach((id, i) => {
      const a = (i / dancers.length) * U.TAU + tt * 0.8;
      const x = 480 + Math.cos(a) * 250;
      const y = 470 + Math.sin(a) * 30;
      G.Sprites.draw(ctx, id, { x, y, dir: Math.sin(a) > 0 ? 'down' : 'up', t: tt + i, moving: !o.freeze, phase: tt * 8 + i, scale: 1.6, pose: Math.floor(tt * 2 + i) % 3 === 0 ? 'cheer' : null });
    });
  }

  // ------------------------------------------------------------------
  // PONTO FINAL.
  // ------------------------------------------------------------------
  const PONTO = [
    {
      dur: 10, textStart: 1.4, dark: true, verseY: 24,
      verse: ['Zabelê molhou a pena', 'no tinteiro do Nanquim', 'e escreveu, com mão firme,', 'a palavra mais ruim:', 'um ponto, bem redondinho,', 'e as três letras do FIM.'],
      draw(ctx, t, dur, p) {
        voidBg(ctx, t);
        page(ctx, 180, 190, 600, 330);
        const fold = U.clamp((t - 5.5) / 2, 0, 1);
        if (fold < 1) G.Creatures.traca(ctx, { x: 520, y: 430, t, alt: 0, pose: 'calm', scale: 0.8 * (1 - fold * 0.8) });
        if (fold > 0) {
          ctx.save();
          ctx.fillStyle = '#e8dcc0';
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = 2;
          Art.blob(ctx, 520, 410, 30 * fold + 5, 26 * fold + 5, 7, 0.3, 4);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        G.Sprites.humanoid(ctx, 'zabele', { x: 330, y: 470, dir: 'right', t, scale: 2.6, pose: t > 3 && t < 5.5 ? 'stamp' : 'point' });
        G.Creatures.nanquim(ctx, { x: 250, y: 480, t, dir: 'right', scale: 2 });
        if (t > 5.2) {
          P.once(p, 's', () => {
            Au.sfx('stamp');
            Au.sfx('boom', { vol: 0.5 });
          });
          const k = Math.min(1, (t - 5.2) / 0.2);
          ctx.save();
          ctx.translate(520, 330);
          ctx.rotate(-0.12);
          ctx.scale(2 - k, 2 - k);
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 6;
          ctx.strokeRect(-110, -54, 220, 108);
          Art.drawWood(ctx, 'FIM', 0, 0, 80, C.red, {});
          ctx.restore();
        }
        P.frame(ctx);
        P.fadeIn(ctx, t, dur, 0.8, 0.3);
      },
    },
    {
      dur: 10, textStart: 1, verseY: 24,
      verse: ['A Traça virou bolinha,', 'papel velho, sem calor;', 'o sol voltou pro seu prego,', 'redesenhado, sem cor,', 'e Vila Rima fez festa', 'com fogueira e com tambor.'],
      draw(ctx, t) {
        festa(ctx, t, {
          sun(c, tt) {
            // um sol redesenhado à mão, meio torto
            c.save();
            c.translate(815, 175);
            c.rotate(0.1);
            c.scale(1.05, 0.92);
            Art.sun(c, 0, 0, 62, tt * 0.04, { face: true, fill: '#e8b060' });
            c.restore();
          },
        });
        P.frame(ctx);
      },
    },
    {
      dur: 10, textStart: 1, verseY: 24,
      verse: ['Mas história que termina', 'vira quadro na parede:', 'a feira é sempre domingo,', 'o açude, sempre com sede,', 'e o Poeta nunca mais', 'jogou verso nessa rede.'],
      draw(ctx, t) {
        Art.fillPaper(ctx, 0, 0, G.W, G.H, '#cdbd9c');
        const k = U.ease.inOut(Math.min(1, t / 4));
        ctx.save();
        const cy = G.H / 2 + 20 + k * 90;
        ctx.translate(G.W / 2, cy);
        ctx.scale(1 - k * 0.45, 1 - k * 0.45);
        ctx.translate(-G.W / 2, -cy);
        festa(ctx, 1.3, { freeze: true, sun: (c) => Art.sun(c, 740, 205, 62, 0, { face: true, fill: '#c8a878' }) });
        ctx.globalCompositeOperation = 'saturation';
        ctx.fillStyle = '#888';
        ctx.globalAlpha = k;
        ctx.fillRect(0, 0, G.W, G.H);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#5a3a1a';
        ctx.lineWidth = 40 * k;
        ctx.strokeRect(0, 0, G.W, G.H);
        ctx.restore();
        // prego e fio do quadro
        if (k > 0.8) {
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(G.W / 2, 110);
          ctx.lineTo(G.W / 2 - 200, 172);
          ctx.moveTo(G.W / 2, 110);
          ctx.lineTo(G.W / 2 + 200, 172);
          ctx.stroke();
          ctx.fillStyle = C.ink;
          ctx.beginPath();
          ctx.arc(G.W / 2, 108, 6, 0, U.TAU);
          ctx.fill();
        }
        P.frame(ctx);
      },
    },
    {
      dur: 11, textStart: 1.2, verseY: 24,
      verse: ['Toda história que termina', 'termina um pouco da gente.', 'Zabelê ficou guardada', 'num cordão, eternamente,', 'balançando com o vento', 'de uma feira diferente.'],
      draw(ctx, t) {
        Art.fillPaper(ctx, 0, 0, G.W, G.H, '#e9cf8c');
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-20, 250);
        ctx.quadraticCurveTo(G.W / 2, 300, G.W + 20, 250);
        ctx.stroke();
        ctx.save();
        ctx.translate(G.W / 2, 276);
        ctx.rotate(Math.sin(t * 1.1) * 0.08);
        ctx.fillStyle = '#c23a22';
        ctx.fillRect(-80, 0, 160, 220);
        ctx.strokeStyle = C.ink;
        ctx.strokeRect(-80, 0, 160, 220);
        ctx.fillStyle = '#f1dc9c';
        ctx.fillRect(-66, 50, 132, 120);
        ctx.save();
        ctx.beginPath();
        ctx.rect(-66, 50, 132, 120);
        ctx.clip();
        G.Sprites.humanoid(ctx, 'zabele', { x: 0, y: 166, dir: 'down', t: 1, scale: 2.2 });
        ctx.restore();
        ctx.fillStyle = C.paperLight;
        ctx.font = G.font(11, 'title');
        ctx.textAlign = 'center';
        ctx.fillText('A PELEJA DE ZABELÊ', 0, 26);
        ctx.fillText('— FIM —', 0, 196);
        ctx.fillStyle = C.red;
        ctx.restore();
        P.frame(ctx);
        P.fadeIn(ctx, t, 11, 0.4, 1.5);
      },
    },
  ];

  // ------------------------------------------------------------------
  // RETICÊNCIAS...
  // ------------------------------------------------------------------
  const RETIC = [
    {
      dur: 10, textStart: 1.2, dark: true, verseY: 24,
      verse: ['Zabelê largou a pena,', 'olhou a Traça no chão,', 'e disse: "Ninguém merece', 'ser carimbado de não:', 'quem sente falta de alguém', 'não é bicho, é coração."'],
      draw(ctx, t) {
        voidBg(ctx, t);
        page(ctx, 180, 200, 600, 320);
        G.Creatures.traca(ctx, { x: 540, y: 440, t, alt: 0, pose: t > 5 ? 'land' : 'calm', scale: 0.8, eyeOpen: Math.min(1, Math.max(0, t - 5) * 0.5) });
        G.Sprites.humanoid(ctx, 'zabele', { x: 380, y: 470, dir: 'right', t, scale: 2.6, pose: 'kneel' });
        // a pena largada
        ctx.save();
        ctx.translate(300, 480);
        ctx.rotate(1.2);
        ctx.fillStyle = '#f7eedb';
        ctx.strokeStyle = C.ink;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-12, -30, -2, -60);
        ctx.quadraticCurveTo(10, -30, 0, 0);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        P.frame(ctx);
        P.fadeIn(ctx, t, 10, 0.8, 0.3);
      },
    },
    {
      dur: 10, textStart: 1, dark: true, verseY: 24,
      verse: ['E foi andando com a Traça', 'pra beira do papel;', 'as duas sentadas juntas', 'olhando o branco do céu,', 'sem sol, mas também sem pressa,', 'que nem quem espera o mel.'],
      draw(ctx, t) {
        voidBg(ctx, t);
        page(ctx, -40, 340, 600, 300);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(556, 340, 8, 300);
        G.Creatures.traca(ctx, { x: 470, y: 400, t, alt: 0, pose: 'calm', scale: 0.55 });
        G.Sprites.humanoid(ctx, 'zabele', { x: 380, y: 400, dir: 'up', t, scale: 2.2, pose: 'sit' });
        G.Creatures.nanquim(ctx, { x: 320, y: 404, t, dir: 'right', scale: 1.6 });
        P.frame(ctx);
      },
    },
    {
      dur: 10, textStart: 1, dark: true, verseY: 24,
      verse: ['Em Vila Rima, o povo', 'acendeu mil candeeiros;', 'fez do escuro uma festa', 'de balão e de pandeiros,', 'e o Poeta, devagarinho,', 'voltou aos versos primeiros.'],
      draw(ctx, t) {
        festa(ctx, t, {
          paper: '#3a3024', windows: '#ffcf6a',
          sun(c, tt) {
            c.save();
            c.fillStyle = '#f8f0dc';
            c.beginPath();
            c.arc(835, 150, 46, 0, U.TAU);
            c.fill();
            for (let i = 0; i < 12; i++) {
              const x = (i * 97 + tt * 12) % G.W;
              const y = 60 + ((i * 53) % 160) - (tt * 10 + i * 20) % 80;
              c.fillStyle = i % 2 ? '#c23a22' : '#e6c14f';
              c.beginPath();
              c.moveTo(x, y);
              c.lineTo(x + 12, y + 16);
              c.lineTo(x, y + 30);
              c.lineTo(x - 12, y + 16);
              c.closePath();
              c.fill();
              c.fillStyle = '#ffcf6a';
              c.fillRect(x - 2, y + 30, 4, 5);
            }
            c.restore();
          },
        });
        P.frame(ctx);
      },
    },
    {
      dur: 11, textStart: 1.2, dark: true, verseY: 24,
      verse: ['Tem dor que não se mata:', 'se acompanha, lado a lado.', 'Tem história que não fecha,', 'fica com o fim guardado...', 'e quem lê, se quiser,', 'escreve o resto com cuidado.'],
      draw(ctx, t) {
        ctx.fillStyle = '#16100b';
        ctx.fillRect(0, 0, G.W, G.H);
        const g = ctx.createRadialGradient(560, 320, 20, 560, 320, 420);
        g.addColorStop(0, 'rgba(240,210,150,0.9)');
        g.addColorStop(1, 'rgba(240,210,150,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, G.W, G.H);
        ctx.fillStyle = C.ink;
        ctx.fillRect(250, 400, 520, 30);
        ctx.fillStyle = '#6b5a45';
        ctx.fillRect(640, 358, 34, 42);
        G.Art.flame(ctx, 657, 358, 0.9, t);
        ctx.fillStyle = '#f3ead6';
        ctx.fillRect(400, 380, 150, 24);
        ctx.fillStyle = C.ink;
        ctx.font = G.font(20, 'title');
        const dots = Math.floor(t * 1.2) % 4;
        ctx.fillText('.'.repeat(dots), 440, 400);
        G.Sprites.humanoid(ctx, 'firmino', { x: 470, y: 510, dir: 'up', t, scale: 3.4, pose: Math.sin(t * 3) > 0 ? 'point' : 'idle' });
        P.frame(ctx);
        P.fadeIn(ctx, t, 11, 0.4, 1.5);
      },
    },
  ];

  // ------------------------------------------------------------------
  // VÍRGULA,  (final verdadeiro)
  // ------------------------------------------------------------------
  const VIRG = [
    {
      dur: 11, textStart: 1.2, dark: true, verseY: 24,
      verse: ['Zabelê abriu o caderno', 'e tirou, verso por verso,', 'nove estrofes esquecidas', 'que achou pelo universo:', 'era o poema de Luzia', 'que o Poeta tinha disperso.'],
      draw(ctx, t) {
        voidBg(ctx, t);
        page(ctx, 180, 200, 600, 320);
        G.Creatures.traca(ctx, { x: 580, y: 440, t, alt: 0, pose: 'calm', scale: 0.7 });
        G.Sprites.humanoid(ctx, 'zabele', { x: 320, y: 470, dir: 'right', t, scale: 2.5, pose: 'give' });
        G.Sprites.humanoid(ctx, 'firmino', { x: 430, y: 470, dir: 'left', t, scale: 2.5 });
        // os nove versos subindo em luz
        for (let i = 0; i < 9; i++) {
          const k = U.clamp((t - 2 - i * 0.5) / 3, 0, 1);
          if (k <= 0) continue;
          const a = (i / 9) * U.TAU + t * 0.3;
          const x = 380 + Math.cos(a) * 150 * k;
          const y = 300 - k * 60 + Math.sin(a) * 60 * k;
          ctx.save();
          ctx.globalAlpha = k;
          ctx.fillStyle = '#fff3c0';
          ctx.shadowColor = '#ffcf6a';
          ctx.shadowBlur = 16;
          ctx.fillRect(x - 36, y - 6, 72, 12);
          ctx.shadowBlur = 0;
          ctx.fillStyle = C.red;
          ctx.font = G.font(9, 'body', 'italic');
          ctx.textAlign = 'center';
          ctx.fillText(G.Story.verses[i + 1].lines[0], x, y + 3, 70);
          ctx.restore();
        }
        P.frame(ctx);
        P.fadeIn(ctx, t, 11, 0.8, 0.3);
      },
    },
    {
      dur: 11, textStart: 1, dark: true, verseY: 24,
      verse: ['Firmino leu com a voz', 'tremendo feito candeia,', 'e a Traça ergueu a cabeça', 'como quem sente maré cheia:', 'mariposa é bicho sábio,', 'vai pra luz que se incendeia.'],
      draw(ctx, t) {
        voidBg(ctx, t);
        const glow = Math.min(1, t / 8);
        const g = ctx.createRadialGradient(480, 180, 10, 480, 180, 400);
        g.addColorStop(0, 'rgba(255,240,190,' + 0.8 * glow + ')');
        g.addColorStop(1, 'rgba(255,240,190,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, G.W, G.H);
        page(ctx, 180, 300, 600, 240);
        const rise = U.ease.inOut(U.clamp((t - 4) / 6, 0, 1));
        G.Creatures.traca(ctx, { x: 520, y: 460 - rise * 220, t, alt: rise * 60, pose: rise > 0.1 ? 'fly' : 'land', scale: 0.8, eyeOpen: 1 });
        G.Sprites.humanoid(ctx, 'firmino', { x: 300, y: 500, dir: 'right', t, scale: 2.6, pose: 'hands' });
        G.Sprites.humanoid(ctx, 'zabele', { x: 220, y: 510, dir: 'right', t, scale: 2.4 });
        G.Creatures.nanquim(ctx, { x: 160, y: 516, t, dir: 'right', scale: 1.8, face: 'happy' });
        P.frame(ctx);
      },
    },
    {
      dur: 12, textStart: 1.5, verseY: 24,
      verse: ['Voou alto, mais que o vento,', 'mais alto que o carcará,', 'e acendeu no céu vazio', 'o sol que faltava lá:', 'um sol com asas de traça', 'que ninguém vai apagar.'],
      draw(ctx, t, dur, p) {
        const k = U.clamp((t - 3) / 3, 0, 1);
        Art.fillPaper(ctx, 0, 0, G.W, G.H, '#f1dc9c');
        ctx.save();
        ctx.fillStyle = 'rgba(20,14,8,' + (1 - k) * 0.8 + ')';
        ctx.fillRect(0, 0, G.W, G.H);
        ctx.restore();
        if (t < 3.2) {
          const s = 1 - t / 3.2;
          G.Creatures.traca(ctx, { x: G.W / 2, y: 300 - t * 40, t, alt: 60, pose: 'fly', scale: 0.4 + s * 0.4 });
        } else {
          P.once(p, 'f', () => {
            Au.sfx('verse');
            Au.sfx('lamp');
          });
          if (t < 3.6) {
            ctx.save();
            ctx.fillStyle = 'rgba(255,250,230,' + (1 - (t - 3.2) / 0.4) + ')';
            ctx.fillRect(0, 0, G.W, G.H);
            ctx.restore();
          }
          P.drawMothSun(ctx, G.W / 2, 190, 60 + k * 30, t, k);
        }
        P.hills(ctx, 400, 50, '#b99058', 1, 0.009);
        P.hills(ctx, 460, 30, C.ink, 5, 0.018);
        if (k > 0.5) P.carcara(ctx, 150 + t * 40, 120, 0.8, t);
        P.frame(ctx);
      },
    },
    {
      dur: 12, textStart: 1, verseY: 330, verseW: 520,
      verse: ['O Sabiá voltou a cantar,', 'o Capitão floresceu,', 'Dona Renda abriu o céu,', 'o Coronel se arrependeu,', 'e o Nanquim, de tinta cheia,', 'disse: "Enfim, ninguém morreu!"'],
      draw(ctx, t) {
        Art.fillPaper(ctx, 0, 0, G.W, G.H, '#f1dc9c');
        const cells = [
          (c, x, y) => {
            G.Sprites.humanoid(c, 'sabia', { x, y, dir: 'down', t, scale: 2, pose: 'play', talking: true });
            for (let i = 0; i < 3; i++) {
              c.fillStyle = C.red;
              c.font = G.font(20, 'title');
              c.fillText('♪', x + 30 + i * 18, y - 120 - ((t * 30 + i * 20) % 60));
            }
          },
          (c, x, y) => G.Creatures.mandacaru(c, { x, y: y + 10, t, pose: 'bloom', scale: 1 }),
          (c, x, y) => {
            c.save();
            c.translate(x, y + 30);
            c.scale(0.8, 0.8);
            G.Creatures.renda(c, { x: 0, y: 0, t, pose: 'weave' });
            c.restore();
          },
          (c, x, y) => {
            G.Creatures.coronel(c, { x: x - 20, y, t, dir: 'right' });
            G.Props.draw(c, { kind: 'barraca', x: x + 40, y: y + 4, v: 0 }, t);
          },
        ];
        const pos = [[240, 150], [720, 150], [240, 320], [720, 320]];
        pos.forEach(([x, y], i) => {
          ctx.save();
          ctx.beginPath();
          ctx.rect(x - 190, y - 140, 380, 160);
          ctx.clip();
          ctx.fillStyle = ['#e7c46a', '#ecc987', '#c7dbe2', '#efc5bf'][i];
          ctx.fillRect(x - 190, y - 140, 380, 160);
          cells[i](ctx, x, y + 14);
          ctx.restore();
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = 3;
          ctx.strokeRect(x - 190, y - 140, 380, 160);
        });
        G.Creatures.nanquim(ctx, { x: G.W / 2, y: 520, t, scale: 2, face: 'happy', level: 0.9, talking: t > 8 });
        P.frame(ctx);
      },
    },
    {
      dur: 13, textStart: 1.2, verseY: 24,
      verse: ['Firmino pegou papel novo,', 'molhou a pena, contente,', 'escreveu "A Peleja de Zabelê"', 'e parou, de repente:', 'no lugar do ponto final', 'botou vírgula, e seguiu em frente.'],
      draw(ctx, t) {
        Art.fillPaper(ctx, 0, 0, G.W, G.H, '#f1dc9c');
        P.drawMothSun(ctx, 820, 170, 46, t);
        ctx.fillStyle = C.ink;
        ctx.fillRect(160, 400, 640, 30);
        page(ctx, 320, 300, 320, 110);
        ctx.fillStyle = C.ink;
        ctx.font = G.font(20, 'title');
        ctx.textAlign = 'center';
        const title = 'A Peleja de Zabelê';
        const n = Math.min(title.length, Math.floor(Math.max(0, t - 2) * 6));
        ctx.fillText(title.slice(0, n), 480, 340);
        if (t > 6.5) {
          ctx.fillStyle = C.red;
          ctx.font = G.font(46, 'title');
          ctx.fillText(',', 480 + 110, 380);
        }
        G.Sprites.humanoid(ctx, 'firmino', { x: 380, y: 520, dir: 'up', t, scale: 2.8, pose: t < 7 ? 'point' : 'idle' });
        G.Sprites.humanoid(ctx, 'zabele', { x: 640, y: 520, dir: t > 8 ? 'down' : 'left', t, scale: 2.8, face: t > 8 ? 'happy' : null, pose: t > 9 ? 'cheer' : null });
        G.Creatures.nanquim(ctx, { x: 250, y: 480, t, scale: 1.6, face: 'happy' });
        P.frame(ctx);
        P.fadeIn(ctx, t, 13, 0.4, 1.5);
      },
    },
  ];

  const FINAL_CARD = {
    ponto: { title: 'PONTO FINAL.', sub: 'Toda história que termina, termina um pouco da gente.', music: 'sad' },
    reticencias: { title: 'RETICÊNCIAS...', sub: 'Tem dor que não se mata: se acompanha.', music: 'sad' },
    virgula: { title: 'VÍRGULA,', sub: 'FIM, não. A história continua.', music: 'ending' },
  };

  class EndingScene extends G.Reel {
    constructor(kind) {
      const panels = (kind === 'ponto' ? PONTO : kind === 'reticencias' ? RETIC : VIRG).slice();
      const card = FINAL_CARD[kind];
      panels.push({
        dur: 7,
        draw(ctx, t) {
          ctx.fillStyle = kind === 'virgula' ? '#f1dc9c' : C.night;
          ctx.fillRect(0, 0, G.W, G.H);
          if (kind === 'virgula') P.drawMothSun(ctx, G.W / 2, 125, 46, t);
          const k = U.ease.outBack(Math.min(1, t / 0.8));
          ctx.save();
          ctx.translate(G.W / 2, G.H / 2 + (kind === 'virgula' ? 50 : 20));
          ctx.scale(k, k);
          ctx.fillStyle = kind === 'virgula' ? C.ink : C.paperLight;
          ctx.font = G.font(18, 'title');
          ctx.textAlign = 'center';
          ctx.fillText('FINAL', 0, -70);
          Art.drawWood(ctx, card.title, 0, -10, 72, C.red, { red: kind === 'virgula' ? C.ink : C.paperDark });
          ctx.font = G.font(20, 'body', 'italic');
          ctx.fillStyle = kind === 'virgula' ? C.ink : C.paperLight;
          ctx.fillText(card.sub, 0, 60);
          if (kind !== 'virgula') {
            ctx.font = G.font(15, 'body', 'italic');
            ctx.fillStyle = C.paperDark;
            const v = G.Save.meta.verses.length;
            ctx.fillText(v < 9 ? 'Dizem que existem nove Versos Perdidos... e um final diferente para quem juntar todos (' + v + '/9).' : 'Você tem os nove versos. Talvez outra escolha, na última página...', 0, 110);
          }
          ctx.restore();
          P.fadeIn(ctx, t, 7, 0.6, 0.8);
        },
      });
      super(panels);
      this.kind = kind;
      this.card = card;
    }
    enter() {
      super.enter();
      Au.play(this.card.music, { restart: true, fadeIn: 2 });
      Au.ambient(null);
    }
    finish() {
      G.Game.credits(this.kind);
    }
  }
  G.EndingScene = EndingScene;
})();
