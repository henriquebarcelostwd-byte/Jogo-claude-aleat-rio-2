/* PELEJA — telas e menus: título, menu principal, ajustes, controles, caderno, pausa, loja, fim de jogo… */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Art = G.Art;
  const Inp = G.Input;
  const Au = G.Audio;
  const C = G.C;

  const COVERS = ['#e6c14f', '#e39a9a', '#8fb3d9', '#b8d49a', '#f0e3c0', '#d9a07a'];

  // ------------------------------------------------------------------
  // Cenário do menu (sol, serra, casas, cordão)
  // ------------------------------------------------------------------
  function drawBackdrop(ctx, t, o = {}) {
    Art.fillPaper(ctx, 0, 0, G.W, G.H, '#f1dc9c');
    // sol girando
    Art.sun(ctx, G.W / 2, o.sunY || 250, 120, t * 0.05, { face: true });
    // serra ao fundo
    ctx.fillStyle = '#8a6a3c';
    ctx.beginPath();
    ctx.moveTo(0, 380);
    for (let x = 0; x <= G.W; x += 40) ctx.lineTo(x, 360 - Math.abs(Math.sin(x * 0.011) * 70) - Math.sin(x * 0.03) * 12);
    ctx.lineTo(G.W, G.H);
    ctx.lineTo(0, G.H);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(248,240,220,0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) Art.gouge(ctx, 40 + i * 68, 350 + (i % 3) * 8, 26, -0.2, 2);
    // chão e casinhas
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.moveTo(0, 430);
    for (let x = 0; x <= G.W; x += 30) ctx.lineTo(x, 424 + Math.sin(x * 0.02) * 6);
    ctx.lineTo(G.W, G.H);
    ctx.lineTo(0, G.H);
    ctx.fill();
    const houses = [[70, 1], [160, 0], [770, 1], [860, 0], [920, 1]];
    for (const [hx, v] of houses) {
      ctx.fillStyle = C.ink;
      ctx.fillRect(hx - 36, 380, 72, 50);
      ctx.beginPath();
      ctx.moveTo(hx - 44, 384);
      ctx.lineTo(hx, 352 - v * 8);
      ctx.lineTo(hx + 44, 384);
      ctx.fill();
      ctx.fillStyle = '#ffcf6a';
      ctx.fillRect(hx - 22, 396, 12, 12);
      ctx.fillRect(hx + 10, 396, 12, 12);
    }
    // igreja
    ctx.fillStyle = C.ink;
    ctx.fillRect(250, 360, 70, 70);
    ctx.fillRect(272, 316, 26, 46);
    ctx.beginPath();
    ctx.moveTo(266, 318);
    ctx.lineTo(285, 296);
    ctx.lineTo(304, 318);
    ctx.fill();
    ctx.fillRect(283, 282, 4, 16);
    ctx.fillRect(278, 287, 14, 4);
    // mandacarus
    for (const [mx, h] of [[380, 70], [620, 90], [700, 60], [30, 60]]) {
      ctx.fillStyle = C.ink;
      Art.rrect(ctx, mx - 7, 430 - h, 14, h, 7);
      ctx.fill();
      Art.rrect(ctx, mx - 22, 430 - h * 0.6, 10, h * 0.35, 5);
      ctx.fill();
      Art.rrect(ctx, mx - 22, 430 - h * 0.3, 20, 8, 4);
      ctx.fill();
      Art.rrect(ctx, mx + 12, 430 - h * 0.7, 10, h * 0.4, 5);
      ctx.fill();
      Art.rrect(ctx, mx + 2, 430 - h * 0.35, 20, 8, 4);
      ctx.fill();
    }
    if (!o.noCharacters) {
      G.Sprites.humanoid(ctx, 'zabele', { x: 480, y: 492, dir: 'down', t, scale: 1.6 });
      G.Creatures.nanquim(ctx, { x: 540, y: 500, t, dir: 'left', scale: 1.3 });
    }
  }

  function drawCordao(ctx, items, sel, t, y0 = 136) {
    const n = items.length;
    const x0 = 60, x1 = G.W - 60;
    ctx.save();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x0 - 30, y0 - 20);
    ctx.lineTo(x0 - 30, y0 + 250);
    ctx.moveTo(x1 + 30, y0 - 20);
    ctx.lineTo(x1 + 30, y0 + 250);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    const pt = (k) => [U.lerp(x0 - 30, x1 + 30, k), y0 - 14 + Math.sin(k * Math.PI) * 30];
    for (let i = 0; i <= 40; i++) {
      const [x, y] = pt(i / 40);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const rects = [];
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n;
      const [px, py] = pt(0.04 + k * 0.92);
      const isSel = i === sel;
      const sw = Math.sin(t * 2 + i) * 0.03 + (isSel ? Math.sin(t * 4) * 0.06 : 0);
      const w = 148, h = 190;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(sw);
      const lift = isSel ? -10 : 0;
      ctx.translate(0, lift);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-w / 2 + 6, 10, w, h);
      ctx.fillStyle = items[i].disabled ? '#cbbd9e' : COVERS[i % COVERS.length];
      ctx.fillRect(-w / 2, 4, w, h);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = isSel ? 4 : 2.5;
      ctx.strokeRect(-w / 2, 4, w, h);
      ctx.lineWidth = 1;
      ctx.strokeRect(-w / 2 + 7, 11, w - 14, h - 14);
      // ilustração
      ctx.save();
      ctx.beginPath();
      ctx.rect(-w / 2 + 12, 16, w - 24, 96);
      ctx.clip();
      ctx.fillStyle = '#f7eedb';
      ctx.fillRect(-w / 2 + 12, 16, w - 24, 96);
      ctx.globalAlpha = 0.18;
      Art.hatch(ctx, -w / 2 + 12, 16, w - 24, 96, 6, -0.9, 1, C.ink);
      ctx.globalAlpha = 1;
      items[i].icon && items[i].icon(ctx, 0, 64, t, isSel);
      ctx.restore();
      // título
      ctx.fillStyle = C.ink;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let fs = 19;
      ctx.font = G.font(fs, 'title');
      while (ctx.measureText(items[i].label).width > w - 18 && fs > 10) {
        fs--;
        ctx.font = G.font(fs, 'title');
      }
      ctx.fillText(items[i].label, 0, 136);
      ctx.font = G.font(12, 'body', 'italic');
      ctx.fillText(items[i].sub || '', 0, 162);
      // pregador
      ctx.fillStyle = C.red;
      ctx.fillRect(-4, -4, 8, 14);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-4, -4, 8, 14);
      ctx.restore();
      rects.push({ x: px - w / 2, y: py + lift, w, h: h + 8 });
      if (isSel) Art.hand(ctx, px, py + h + 34 + Math.sin(t * 6) * 3, 1.4, C.red);
    }
    ctx.restore();
    return rects;
  }

  // ícones dos folhetos
  const ICONS = {
    jogar(ctx, x, y, t) {
      G.Sprites.humanoid(ctx, 'zabele', { x, y: y + 34, dir: 'down', t, scale: 1.2, noShadow: true, _flash: null });
    },
    caderno(ctx, x, y, t) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = C.paperLight;
      ctx.fillRect(-32, -26, 30, 44);
      ctx.fillRect(2, -26, 30, 44);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(-28, -18 + i * 8);
        ctx.lineTo(-6, -18 + i * 8);
        ctx.moveTo(6, -18 + i * 8);
        ctx.lineTo(28, -18 + i * 8);
        ctx.stroke();
      }
      ctx.rotate(-0.6 + Math.sin(t * 2) * 0.05);
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.moveTo(20, -30);
      ctx.quadraticCurveTo(40, -44, 44, -60);
      ctx.quadraticCurveTo(30, -40, 24, -26);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
    ajustes(ctx, x, y, t) {
      Art.sun(ctx, x, y, 22, t * 0.5, { face: true });
    },
    controles(ctx, x, y) {
      ctx.save();
      for (const [dx, dy, l] of [[-22, 10, '←'], [0, 10, '↓'], [22, 10, '→'], [0, -14, '↑']]) {
        Art.keycap(ctx, l, x + dx, y + dy, { size: 14, h: 20, minW: 20 });
      }
      ctx.restore();
    },
    creditos(ctx, x, y, t) {
      G.Sprites.viola(ctx, { t }, x, y + 10, -0.5, 1.6);
    },
  };

  // ==================================================================
  // TÍTULO
  // ==================================================================
  class TitleScene {
    constructor() {
      this.t = 0;
      this.opaque = true;
    }
    enter() {
      Inp.touch.layout = 'menu';
    }
    update(dt) {
      this.t += dt;
      if (this.t > 0.6 && Inp.anyPressed()) {
        Au.unlock();
        Au.play('menu', { fadeIn: 1.5 });
        Au.sfx('stamp');
        SM().set(new MainMenu(), 'page');
      }
    }
    draw(ctx) {
      const t = this.t;
      drawBackdrop(ctx, t, { sunY: 300 });
      // a Traça cruzando o céu
      const k = ((t * 0.07) % 1.4) - 0.2;
      if (k > 0 && k < 1) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        G.Creatures.traca(ctx, { x: U.lerp(-200, G.W + 200, k), y: 120 + Math.sin(k * 7) * 30, t, alt: 0, scale: 0.45, rot: 0.1 });
        ctx.restore();
      }
      titleLogo(ctx, G.W / 2, 118, 1, t);
      ctx.save();
      ctx.globalAlpha = 0.55 + Math.sin(t * 4) * 0.45;
      ctx.fillStyle = C.paperLight;
      ctx.fillRect(G.W / 2 - 170, G.H - 44, 340, 30);
      ctx.fillStyle = C.ink;
      ctx.font = G.font(18, 'title');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('APERTE QUALQUER TECLA', G.W / 2, G.H - 28);
      ctx.restore();
      Art.vignette(ctx);
      Art.pageFrame(ctx, C.ink, 6);
    }
  }

  function titleLogo(ctx, x, y, s, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = C.paperLight;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 4;
    ctx.fillRect(-290, -86, 580, 168);
    ctx.strokeRect(-290, -86, 580, 168);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-282, -78, 564, 152);
    Art.teeth(ctx, -276, -74, 552, 8, C.red);
    Art.teeth(ctx, -276, 60, 552, 8, C.red, true);
    ctx.font = G.font(15, 'body', 'italic');
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'center';
    ctx.fillText('A', 0, -50);
    Art.drawWood(ctx, 'PELEJA', 0, -6, 76, C.ink, { red: C.red, spacing: 6 });
    ctx.font = G.font(20, 'body', 'italic');
    ctx.fillStyle = C.ink;
    ctx.fillText('de Zabelê com a Traça que Comeu o Sol', 0, 50);
    ctx.restore();
    void t;
  }
  G.titleLogo = titleLogo;

  function SM() {
    return G.SM;
  }

  // ==================================================================
  // MENU PRINCIPAL
  // ==================================================================
  class MainMenu {
    constructor() {
      this.t = 0;
      this.sel = 0;
      this.opaque = true;
      this.items = [
        { label: 'JOGAR', sub: 'abrir o folheto', icon: ICONS.jogar, act: () => this.openPlay() },
        { label: 'CADERNO', sub: 'versos, gente, finais', icon: ICONS.caderno, act: () => SM().push(new JournalScene({ inGame: false }), 'fade') },
        { label: 'CONFIGURAÇÕES', sub: 'som, texto, tela', icon: ICONS.ajustes, act: () => SM().push(new SettingsScene(), 'fade') },
        { label: 'CONTROLES', sub: 'como jogar', icon: ICONS.controles, act: () => SM().push(new ControlsScene(), 'fade') },
        { label: 'CRÉDITOS', sub: 'quem fez', icon: ICONS.creditos, act: () => G.Game.credits(null) },
      ];
    }
    enter() {
      Inp.touch.layout = 'menu';
      if (Au.curName !== 'menu') Au.play('menu', { fadeIn: 1 });
      Au.ambient(null);
    }
    openPlay() {
      const has = G.Save.hasGame();
      const opts = [];
      if (has) {
        const s = G.Save.loadGame();
        const ch = s && G.Story.CH[s.chapter];
        opts.push({ label: 'Continuar', sub: ch ? ch.num + ' — ' + ch.name + ' · ' + U.fmtTime(s.time || 0) : '', act: () => G.Game.continueGame() });
      }
      opts.push({
        label: 'Novo Jogo', sub: 'começar do prólogo', act: () => {
          if (has) SM().push(new ConfirmScene('Começar de novo? O progresso salvo será substituído (versos e finais ficam no Caderno).', () => G.Game.newGame()));
          else G.Game.newGame();
        },
      });
      opts.push({ label: 'Capítulos', sub: 'rejogar capítulos liberados', act: () => SM().push(new ChapterSelect()) });
      SM().push(new ListMenu('JOGAR', opts));
    }
    update(dt) {
      this.t += dt;
      const n = this.items.length;
      if (Inp.repeat('left') || Inp.repeat('up')) {
        this.sel = (this.sel + n - 1) % n;
        Au.sfx('menuMove');
      }
      if (Inp.repeat('right') || Inp.repeat('down')) {
        this.sel = (this.sel + 1) % n;
        Au.sfx('menuMove');
      }
      if (this.rects) {
        this.rects.forEach((r, i) => {
          if (U.inRect(Inp.mouse.x, Inp.mouse.y, r)) {
            if (Inp.mouse.moved && this.sel !== i) {
              this.sel = i;
              Au.sfx('menuMove');
            }
            if (Inp.mouse.clicked) {
              this.sel = i;
              this.choose();
            }
          }
        });
      }
      if (Inp.pressed('confirm')) this.choose();
    }
    choose() {
      Au.sfx('menuSelect');
      this.items[this.sel].act();
    }
    draw(ctx) {
      const t = this.t;
      drawBackdrop(ctx, t, { sunY: 470, noCharacters: true });
      titleLogo(ctx, G.W / 2, 70, 0.52, t);
      this.rects = drawCordao(ctx, this.items, this.sel, t, 150);
      G.Sprites.humanoid(ctx, 'zabele', { x: 70, y: 512, dir: 'right', t, scale: 1.4 });
      G.Creatures.nanquim(ctx, { x: 116, y: 516, t, dir: 'left', scale: 1.1 });
      ctx.save();
      ctx.font = G.font(14, 'body', 'italic');
      ctx.fillStyle = C.paperLight;
      ctx.textAlign = 'right';
      ctx.fillText('←/→ escolher · ' + Inp.keyLabel('confirm') + ' abrir', G.W - 24, G.H - 16);
      ctx.textAlign = 'left';
      const v = G.Save.meta.verses.length;
      ctx.fillText('Versos Perdidos: ' + v + '/9 · Finais: ' + G.Save.meta.endings.length + '/3', 160, G.H - 16);
      ctx.restore();
      Art.vignette(ctx);
      Art.pageFrame(ctx, C.ink, 6);
    }
  }

  // ==================================================================
  // Menus genéricos
  // ==================================================================
  class ListMenu {
    constructor(title, items, o = {}) {
      this.title = title;
      this.items = items;
      this.sel = 0;
      this.t = 0;
      this.o = o;
      this.opaque = false;
      while (this.items[this.sel] && this.items[this.sel].disabled) this.sel++;
    }
    update(dt) {
      this.t += dt;
      const n = this.items.length;
      const move = (d) => {
        let i = this.sel;
        for (let k = 0; k < n; k++) {
          i = (i + d + n) % n;
          if (!this.items[i].disabled) break;
        }
        this.sel = i;
        Au.sfx('menuMove');
      };
      if (Inp.repeat('up')) move(-1);
      if (Inp.repeat('down')) move(1);
      if (this.rects) {
        this.rects.forEach((r, i) => {
          if (U.inRect(Inp.mouse.x, Inp.mouse.y, r) && !this.items[i].disabled) {
            if (Inp.mouse.moved && this.sel !== i) {
              this.sel = i;
              Au.sfx('menuMove');
            }
            if (Inp.mouse.clicked) {
              this.sel = i;
              this.choose();
            }
          }
        });
      }
      if (this.t > 0.15 && Inp.pressed('confirm')) this.choose();
      else if (Inp.pressed('cancel') || (Inp.mouse.clicked && this.box && !U.inRect(Inp.mouse.x, Inp.mouse.y, this.box))) {
        Au.sfx('menuBack');
        SM().pop();
        if (this.o.onCancel) this.o.onCancel();
      }
    }
    choose() {
      const it = this.items[this.sel];
      if (!it || it.disabled) return;
      Au.sfx('menuSelect');
      if (!it.keep) SM().pop();
      it.act();
    }
    draw(ctx) {
      const k = U.ease.outBack(Math.min(1, this.t / 0.3));
      ctx.save();
      ctx.fillStyle = 'rgba(15,10,6,' + Math.min(0.55, this.t * 3) + ')';
      ctx.fillRect(0, 0, G.W, G.H);
      const w = 540, h = 110 + this.items.length * 58;
      const x = G.W / 2 - w / 2, y = G.H / 2 - h / 2;
      this.box = { x, y, w, h };
      ctx.translate(G.W / 2, G.H / 2);
      ctx.scale(k, k);
      ctx.translate(-G.W / 2, -G.H / 2);
      Art.panel(ctx, x, y, w, h, { fill: C.paper, teeth: true });
      Art.drawWood(ctx, this.title, G.W / 2, y + 44, 30, C.ink, { red: C.red });
      this.rects = [];
      this.items.forEach((it, i) => {
        const yy = y + 92 + i * 58;
        const sel = i === this.sel;
        this.rects.push({ x: x + 16, y: yy - 20, w: w - 32, h: 54 });
        if (sel) {
          ctx.fillStyle = 'rgba(194,58,34,0.13)';
          ctx.fillRect(x + 18, yy - 20, w - 36, 52);
          Art.hand(ctx, x + 48 + Math.sin(this.t * 7) * 3, yy + 2, 1.2, C.red);
        }
        ctx.textAlign = 'left';
        ctx.font = G.font(22, 'title');
        ctx.fillStyle = it.disabled ? '#a8977a' : sel ? C.red : C.ink;
        ctx.fillText(it.label, x + 78, yy + 8);
        if (it.sub) {
          ctx.font = G.font(15, 'body', 'italic');
          ctx.fillStyle = it.disabled ? '#a8977a' : C.inkSoft;
          ctx.fillText(it.sub, x + 78, yy + 28, w - 100);
        }
      });
      ctx.restore();
    }
  }
  G.ListMenu = ListMenu;

  class ConfirmScene extends ListMenu {
    constructor(text, yes, no) {
      super('TEM CERTEZA?', [
        { label: 'Sim', act: yes },
        { label: 'Não', act: () => no && no() },
      ]);
      this.text = text;
      this.sel = 1;
    }
    draw(ctx) {
      super.draw(ctx);
      if (this.t < 0.3) return;
      ctx.save();
      ctx.font = G.font(17, 'body', 'italic');
      ctx.fillStyle = C.paperLight;
      ctx.textAlign = 'center';
      const lines = U.wrap(ctx, this.text, 600);
      lines.forEach((l, i) => ctx.fillText(l, G.W / 2, this.box.y + this.box.h + 30 + i * 22));
      ctx.restore();
    }
  }
  G.ConfirmScene = ConfirmScene;

  class ChapterSelect extends ListMenu {
    constructor() {
      const CH = G.Story.CH;
      const items = G.Game.ORDER.map((id) => {
        const ok = G.Save.meta.chapters.includes(id);
        return {
          label: ok ? CH[id].num : '? ? ?', sub: ok ? CH[id].name : 'ainda não chegou nesta página', disabled: !ok,
          act: () => SM().push(new ConfirmScene('Começar "' + CH[id].name + '"? O jogo salvo atual será substituído.', () => G.Game.startChapter(id))),
        };
      });
      super('CAPÍTULOS', items);
    }
  }

  // ==================================================================
  // CONFIGURAÇÕES
  // ==================================================================
  class SettingsScene {
    constructor(o = {}) {
      this.t = 0;
      this.sel = 0;
      this.opaque = !o.overlay;
      this.o = o;
      const S = () => G.Save.settings;
      const pct = (v) => Math.round(v * 10) + '/10';
      this.items = [
        { label: 'Volume da música', get: () => pct(S().music), change: (d) => { S().music = U.clamp(Math.round((S().music + d * 0.1) * 10) / 10, 0, 1); Au.applyVolumes(); } },
        { label: 'Volume dos efeitos', get: () => pct(S().sfx), change: (d) => { S().sfx = U.clamp(Math.round((S().sfx + d * 0.1) * 10) / 10, 0, 1); Au.applyVolumes(); Au.sfx('pickup'); } },
        { label: 'Velocidade do texto', get: () => ['Lenta', 'Normal', 'Rápida', 'Instantânea'][S().textSpeed], change: (d) => { S().textSpeed = (S().textSpeed + d + 4) % 4; } },
        { label: 'Dificuldade', get: () => G.diff().name, change: (d) => { S().difficulty = (S().difficulty + d + 3) % 3; }, help: 'Fácil: menos dano e janela de ritmo maior. Difícil: inimigos mais duros.' },
        { label: 'Tremor de tela', get: () => (S().shake ? 'Ligado' : 'Desligado'), change: () => { S().shake = !S().shake; } },
        { label: 'Traço vivo (linhas tremendo)', get: () => (S().boil ? 'Ligado' : 'Desligado'), change: () => { S().boil = !S().boil; G.Cache.clear(); } },
        { label: 'Dicas na tela', get: () => (S().hints ? 'Ligadas' : 'Desligadas'), change: () => { S().hints = !S().hints; } },
        { label: 'Qualidade gráfica', get: () => ({ auto: 'Automática', normal: 'Normal', alta: 'Alta' })[S().quality], change: (d) => { const q = ['auto', 'normal', 'alta']; S().quality = q[(q.indexOf(S().quality) + d + 3) % 3]; G.applyQuality(); } },
        { label: 'Ajuste de ritmo (peleja)', get: () => (S().rhythmOffset > 0 ? '+' : '') + S().rhythmOffset + ' ms', change: (d) => { S().rhythmOffset = U.clamp(S().rhythmOffset + d * 10, -200, 200); }, help: 'Se as notas parecem atrasadas, aumente. Adiantadas, diminua.' },
        { label: 'Tela cheia', get: () => (document.fullscreenElement ? 'Sim' : 'Não'), change: () => toggleFull(), act: () => toggleFull() },
        { label: 'Apagar todo o progresso', act: () => SM().push(new ConfirmScene('Apagar jogo salvo, versos, finais e capítulos liberados?', () => { G.Save.resetAll(); Au.sfx('tear'); })), danger: true },
        { label: 'Voltar', act: () => this.back() },
      ];
    }
    enter() {
      Inp.touch.layout = 'menu';
    }
    back() {
      G.Save.saveSettings();
      Au.sfx('menuBack');
      SM().pop(this.o.overlay ? 'none' : 'fade');
    }
    update(dt) {
      this.t += dt;
      const n = this.items.length;
      if (Inp.repeat('up')) {
        this.sel = (this.sel + n - 1) % n;
        Au.sfx('menuMove');
      }
      if (Inp.repeat('down')) {
        this.sel = (this.sel + 1) % n;
        Au.sfx('menuMove');
      }
      const it = this.items[this.sel];
      if (it.change) {
        if (Inp.repeat('left')) {
          it.change(-1);
          Au.sfx('menuMove');
        }
        if (Inp.repeat('right')) {
          it.change(1);
          Au.sfx('menuMove');
        }
      }
      if (this.rects) {
        this.rects.forEach((r, i) => {
          if (U.inRect(Inp.mouse.x, Inp.mouse.y, r)) {
            if (Inp.mouse.moved) this.sel = i;
            if (Inp.mouse.clicked) {
              this.sel = i;
              const itm = this.items[i];
              if (itm.act) itm.act();
              else if (itm.change) itm.change(Inp.mouse.x > r.x + r.w * 0.6 ? 1 : -1);
              Au.sfx('menuSelect');
            }
          }
        });
      }
      if (Inp.pressed('confirm')) {
        if (it.act) {
          Au.sfx('menuSelect');
          it.act();
        } else if (it.change) {
          it.change(1);
          Au.sfx('menuMove');
        }
      }
      if (Inp.pressed('cancel')) this.back();
    }
    draw(ctx) {
      if (this.opaque) Art.fillPaper(ctx, 0, 0, G.W, G.H, '#e9d9b3');
      else {
        ctx.fillStyle = 'rgba(15,10,6,0.6)';
        ctx.fillRect(0, 0, G.W, G.H);
      }
      const x = 150, y = 30, w = G.W - 300, h = G.H - 60;
      Art.panel(ctx, x, y, w, h, { fill: C.paper, teeth: true });
      Art.drawWood(ctx, 'CONFIGURAÇÕES', G.W / 2, y + 44, 30, C.ink, { red: C.red });
      this.rects = [];
      this.items.forEach((it, i) => {
        const yy = y + 86 + i * 32;
        const sel = i === this.sel;
        this.rects.push({ x: x + 20, y: yy - 16, w: w - 40, h: 30 });
        if (sel) {
          ctx.fillStyle = 'rgba(194,58,34,0.13)';
          ctx.fillRect(x + 20, yy - 16, w - 40, 30);
          Art.hand(ctx, x + 44, yy, 0.9, C.red);
        }
        ctx.font = G.font(18, 'body');
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = it.danger ? C.red : sel ? C.red : C.ink;
        ctx.fillText(it.label, x + 66, yy);
        if (it.get) {
          ctx.textAlign = 'right';
          ctx.font = G.font(17, 'title');
          ctx.fillStyle = C.ink;
          const v = it.get();
          ctx.fillText((it.change ? '‹  ' : '') + v + (it.change ? '  ›' : ''), x + w - 40, yy);
        }
      });
      const it = this.items[this.sel];
      ctx.font = G.font(15, 'body', 'italic');
      ctx.textAlign = 'center';
      ctx.fillStyle = C.inkSoft;
      ctx.fillText(it.help || '←/→ muda o valor · ' + Inp.keyLabel('cancel') + ' volta', G.W / 2, y + h - 26);
      ctx.textBaseline = 'alphabetic';
    }
  }
  function toggleFull() {
    try {
      const r = !document.fullscreenElement ? document.documentElement.requestFullscreen() : document.exitFullscreen();
      if (r && r.catch) r.catch(() => { /* recusado (ex.: dentro de um quadro) */ });
    } catch (e) { /* sem suporte */ }
  }
  G.SettingsScene = SettingsScene;

  // ==================================================================
  // CONTROLES
  // ==================================================================
  class ControlsScene {
    constructor(o = {}) {
      this.t = 0;
      this.opaque = !o.overlay;
      this.o = o;
    }
    update(dt) {
      this.t += dt;
      if (this.t > 0.2 && (Inp.pressed('cancel') || Inp.pressed('confirm') || Inp.mouse.clicked)) {
        Au.sfx('menuBack');
        SM().pop(this.o.overlay ? 'none' : 'fade');
      }
    }
    draw(ctx) {
      if (this.opaque) Art.fillPaper(ctx, 0, 0, G.W, G.H, '#e9d9b3');
      else {
        ctx.fillStyle = 'rgba(15,10,6,0.6)';
        ctx.fillRect(0, 0, G.W, G.H);
      }
      Art.panel(ctx, 60, 24, G.W - 120, G.H - 48, { fill: C.paper, teeth: true });
      Art.drawWood(ctx, 'CONTROLES', G.W / 2, 66, 32, C.ink, { red: C.red });
      const rows = [
        ['Andar', 'WASD / Setas', 'Analógico / Direcional'],
        ['Chicote de Cordel (combo de 3)', 'J  ou  Z', 'A'],
        ['Esquiva (invencível, pula buracos)', 'K  ou  X  ou  Shift', 'B / LB'],
        ['Carimbo (onda de choque, gasta tinta)', 'L  ou  C', 'Y'],
        ['Pregador (arremesso)', 'I  ou  V', 'RB / RT'],
        ['Falar / interagir / ler', 'E  ou  Espaço  ou  Enter', 'X'],
        ['Caderno (missão, mapa, versos)', 'Tab  ou  Q', 'Select'],
        ['Pausa', 'Esc  ou  P', 'Start'],
        ['PELEJA: acertar a pista', '← ↓ ↑ →  ou  A S W D', 'Direcional'],
      ];
      ctx.save();
      ctx.textBaseline = 'middle';
      ctx.font = G.font(13, 'title');
      ctx.fillStyle = C.red;
      ctx.textAlign = 'left';
      ctx.fillText('AÇÃO', 100, 110);
      ctx.fillText('TECLADO', 470, 110);
      ctx.fillText('CONTROLE', 700, 110);
      rows.forEach((r, i) => {
        const y = 142 + i * 36;
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(29,23,18,0.06)';
          ctx.fillRect(86, y - 16, G.W - 172, 32);
        }
        ctx.fillStyle = C.ink;
        ctx.font = G.font(18, 'body');
        ctx.fillText(r[0], 100, y);
        ctx.font = G.font(16, 'title');
        ctx.fillText(r[1], 470, y);
        ctx.fillText(r[2], 700, y);
      });
      ctx.font = G.font(16, 'body', 'italic');
      ctx.textAlign = 'center';
      ctx.fillStyle = C.inkSoft;
      ctx.fillText('Na Peleja, acerte só as palavras que RIMAM com o verso do adversário, no tempo da viola.', G.W / 2, 474);
      ctx.fillText('Toque na tela funciona também: direcional à esquerda, botões à direita.', G.W / 2, 498);
      ctx.restore();
    }
  }
  G.ControlsScene = ControlsScene;

  // ==================================================================
  // CADERNO (missão, mapa, versos, gente, bestiário, finais)
  // ==================================================================
  class JournalScene {
    constructor(o = {}) {
      this.o = o;
      this.t = 0;
      this.opaque = false;
      this.tabs = o.inGame ? ['Missão', 'Mapa', 'Versos', 'Gente', 'Bestiário'] : ['Versos', 'Gente', 'Bestiário', 'Finais'];
      this.tab = Math.max(0, this.tabs.indexOf(o.tab || this.tabs[0]));
      this.scroll = 0;
    }
    enter() {
      Inp.touch.layout = 'menu';
    }
    exit() {
      Inp.touch.layout = this.o.inGame ? 'game' : 'menu';
    }
    update(dt) {
      this.t += dt;
      const n = this.tabs.length;
      if (Inp.repeat('left')) {
        this.tab = (this.tab + n - 1) % n;
        this.scroll = 0;
        Au.sfx('page');
      }
      if (Inp.repeat('right')) {
        this.tab = (this.tab + 1) % n;
        this.scroll = 0;
        Au.sfx('page');
      }
      if (Inp.repeat('down')) this.scroll++;
      if (Inp.repeat('up')) this.scroll = Math.max(0, this.scroll - 1);
      if (this.tabRects) {
        this.tabRects.forEach((r, i) => {
          if (Inp.mouse.clicked && U.inRect(Inp.mouse.x, Inp.mouse.y, r)) {
            this.tab = i;
            this.scroll = 0;
            Au.sfx('page');
          }
        });
      }
      if (this.t > 0.2 && (Inp.pressed('cancel') || Inp.pressed('journal') || Inp.pressed('pause'))) {
        Inp.consume('pause');
        Au.sfx('page');
        SM().pop(this.o.inGame ? 'none' : 'fade');
      }
    }
    draw(ctx) {
      const k = U.ease.outCubic(Math.min(1, this.t / 0.25));
      ctx.fillStyle = 'rgba(15,10,6,' + 0.65 * k + ')';
      ctx.fillRect(0, 0, G.W, G.H);
      ctx.save();
      ctx.translate(0, (1 - k) * 40);
      const x = 40, y = 34, w = G.W - 80, h = G.H - 60;
      // caderno aberto
      Art.panel(ctx, x, y, w, h, { fill: '#f3e8cf' });
      ctx.fillStyle = 'rgba(29,23,18,0.15)';
      ctx.fillRect(G.W / 2 - 3, y + 8, 6, h - 16);
      // abas
      this.tabRects = [];
      let tx = x + 20;
      ctx.font = G.font(16, 'title');
      this.tabs.forEach((tb, i) => {
        const tw = ctx.measureText(tb).width + 28;
        const sel = i === this.tab;
        ctx.fillStyle = sel ? C.red : COVERS[i % COVERS.length];
        ctx.fillRect(tx, y - 26, tw, 30);
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, y - 26, tw, 30);
        ctx.fillStyle = sel ? C.paperLight : C.ink;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tb, tx + tw / 2, y - 10);
        this.tabRects.push({ x: tx, y: y - 26, w: tw, h: 30 });
        tx += tw + 6;
      });
      ctx.textBaseline = 'alphabetic';
      const name = this.tabs[this.tab];
      const L = { x: x + 30, y: y + 30, w: w / 2 - 50 };
      const R = { x: G.W / 2 + 20, y: y + 30, w: w / 2 - 50 };
      if (name === 'Missão') this.drawMission(ctx, L, R);
      else if (name === 'Mapa') this.drawMap(ctx, x + 20, y + 20, w - 40, h - 40);
      else if (name === 'Versos') this.drawVerses(ctx, L, R);
      else if (name === 'Gente') this.drawPeople(ctx, L, R);
      else if (name === 'Bestiário') this.drawBestiary(ctx, L, R);
      else if (name === 'Finais') this.drawEndings(ctx, L, R);
      ctx.font = G.font(13, 'body', 'italic');
      ctx.fillStyle = C.inkSoft;
      ctx.textAlign = 'center';
      ctx.fillText('←/→ trocar página · ' + Inp.keyLabel('cancel') + ' fechar', G.W / 2, y + h - 10);
      ctx.restore();
    }
    drawMission(ctx, L, R) {
      const S = G.state;
      const W = G.Game.world();
      const ch = G.Story.CH[S.chapter];
      ctx.textAlign = 'left';
      ctx.fillStyle = C.red;
      ctx.font = G.font(16, 'title');
      ctx.fillText(ch.num, L.x, L.y + 10);
      Art.drawWood(ctx, ch.name, L.x, L.y + 44, 24, C.ink, { align: 'left' });
      Art.vinheta(ctx, L.x + L.w / 2, L.y + 74, L.w, C.ink);
      ctx.font = G.font(20, 'body');
      ctx.fillStyle = C.ink;
      const obj = W && W.objective ? W.objective : 'Siga a história.';
      Art.hand(ctx, L.x + 16, L.y + 108, 1, C.red);
      U.wrap(ctx, obj, L.w - 40).forEach((l, i) => ctx.fillText(l, L.x + 40, L.y + 114 + i * 26));
      ctx.font = G.font(17, 'body', 'italic');
      ctx.fillStyle = C.inkSoft;
      const lines = [
        'Local: ' + (W ? W.map.name : '—'),
        'Tempo de jogo: ' + U.fmtTime(S.time),
        'Rimas no bolso: ' + S.rimas,
        'Fôlego: ' + S.hp / 2 + ' / ' + S.maxHp / 2 + ' corações',
        'Inimigos espantados: ' + S.stats.kills,
      ];
      lines.forEach((l, i) => ctx.fillText(l, L.x, L.y + 210 + i * 26));
      // habilidades
      ctx.fillStyle = C.red;
      ctx.font = G.font(16, 'title');
      ctx.fillText('HABILIDADES', R.x, R.y + 10);
      const ab = [
        ['Chicote de Cordel', 'attack', true, 'Combo de três estalos. O terceiro derruba.'],
        ['Esquiva', 'dodge', true, 'Rolamento invencível. Pula buracos.'],
        ['Carimbo', 'stamp', S.abil.stamp, 'Onda de choque. Quebra rocha rachada e nó.'],
        ['Pregador de Mira', 'throw', S.abil.throw, 'Acerta sinos, escudos e o que está longe.'],
      ];
      ab.forEach((a, i) => {
        const yy = R.y + 44 + i * 62;
        ctx.globalAlpha = a[2] ? 1 : 0.35;
        Art.keycap(ctx, Inp.keyLabel(a[1]), R.x + 16, yy, { size: 13 });
        ctx.fillStyle = C.ink;
        ctx.font = G.font(19, 'title');
        ctx.textAlign = 'left';
        ctx.fillText(a[2] ? a[0] : '???', R.x + 44, yy + 6);
        ctx.font = G.font(15, 'body', 'italic');
        ctx.fillText(a[2] ? a[3] : 'Ainda não aprendida.', R.x + 44, yy + 28);
        ctx.globalAlpha = 1;
      });
      const upg = [];
      if (S.up.heart) upg.push('Remendos de Coração: ' + S.up.heart);
      if (S.up.ink) upg.push('Tinteiro Maior');
      if (S.up.dmg) upg.push('Cordão Trançado ' + S.up.dmg);
      if (S.up.dodge) upg.push('Alpargata Ligeira ' + S.up.dodge);
      if (S.up.whip) upg.push('Linha de Renda');
      ctx.font = G.font(15, 'body', 'italic');
      ctx.fillStyle = C.inkSoft;
      ctx.fillText(upg.length ? 'Melhorias: ' + upg.join(' · ') : 'Nenhuma melhoria ainda. (A Dona Filó vende!)', R.x, R.y + 320, R.w);
    }
    drawMap(ctx, x, y, w, h) {
      const W = G.Game.world();
      if (!W) return;
      const m = W.map;
      const s = Math.min((w - 40) / m.w, (h - 60) / m.h);
      const ox = x + w / 2 - (m.w * s) / 2, oy = y + h / 2 - (m.h * s) / 2 + 6;
      const ex = G.state.explored['exp_' + W.mapId] || {};
      ctx.save();
      ctx.fillStyle = 'rgba(29,23,18,0.08)';
      ctx.fillRect(ox - 6, oy - 6, m.w * s + 12, m.h * s + 12);
      for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
        const seen = ex[Math.floor(tx / 4) + ',' + Math.floor(ty / 4)];
        if (!seen) continue;
        const c = m.get(tx, ty);
        let col = null;
        if (c === '#' || c === 'B' || c === ' ') col = C.ink;
        else if (c === '~' || c === 'l') col = '#5f86aa';
        else if (c === '%') col = '#241d17';
        else if (c === ':' || c === 's') col = '#c7a868';
        else if (c === 'L' || c === '=') col = '#e8dcc0';
        else col = '#ecdcb4';
        ctx.fillStyle = col;
        ctx.fillRect(ox + tx * s, oy + ty * s, s + 0.5, s + 0.5);
      }
      // marcadores
      for (const e of W.ents) {
        let col = null, r = 3;
        if (e.kind === 'candeeiro') col = e.lit ? C.gold : '#6a5a4a';
        else if (e.kind === 'chest' && !e.opened) col = C.red;
        else if (e.kind === 'bell') col = e.rung ? C.gold : C.blue;
        else if (e.kind === 'npc') col = C.green;
        else if (e.kind === 'prensaObj') col = e.done ? '#6a5a4a' : C.red;
        if (!col) continue;
        const tx = Math.floor(e.x / G.TILE / 4) + ',' + Math.floor(e.y / G.TILE / 4);
        if (!ex[tx]) continue;
        ctx.fillStyle = col;
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ox + (e.x / G.TILE) * s, oy + (e.y / G.TILE) * s, r + 1, 0, U.TAU);
        ctx.fill();
        ctx.stroke();
      }
      const p = W.player;
      const px = ox + (p.x / G.TILE) * s, py = oy + (p.y / G.TILE) * s;
      ctx.fillStyle = C.red;
      Art.star(ctx, px, py, 7 + Math.sin(this.t * 6), 3, 5);
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.stroke();
      ctx.font = G.font(20, 'title');
      ctx.fillStyle = C.ink;
      ctx.textAlign = 'center';
      ctx.fillText(m.name, x + w / 2, y + 8);
      ctx.font = G.font(13, 'body', 'italic');
      ctx.fillText('★ você   ● vermelho: baú/prensa   ● dourado: candeeiro aceso/sino tocado   ● verde: gente', x + w / 2, y + h - 18);
      ctx.restore();
    }
    drawVerses(ctx, L, R) {
      const meta = G.Save.meta.verses;
      ctx.textAlign = 'left';
      ctx.fillStyle = C.red;
      ctx.font = G.font(16, 'title');
      ctx.fillText('OS VERSOS PERDIDOS', L.x, L.y + 10);
      ctx.font = G.font(15, 'body', 'italic');
      ctx.fillStyle = C.inkSoft;
      ctx.fillText('"O Sol de Papel" — ' + meta.length + ' de 9 estrofes', L.x, L.y + 32);
      const all = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const perPage = 5;
      all.forEach((n, i) => {
        const col = i < perPage ? L : R;
        const yy = col.y + (i < perPage ? 58 + i * 84 : -10 + (i - perPage) * 84);
        const v = G.Story.verses[n];
        const has = meta.includes(n);
        ctx.fillStyle = has ? C.ink : '#b0a080';
        ctx.font = G.font(13, 'title');
        ctx.fillText(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'][i] + '.', col.x, yy + 14);
        ctx.font = G.font(15, 'body', 'italic');
        if (has) v.lines.forEach((l, k) => ctx.fillText(l, col.x + 38, yy + 14 + k * 17));
        else {
          ctx.fillText('— estrofe perdida —', col.x + 38, yy + 14);
          ctx.font = G.font(13, 'body');
          ctx.fillText('(algo em: ' + v.where + ')', col.x + 38, yy + 32);
        }
      });
      if (meta.length >= 9) {
        ctx.fillStyle = C.red;
        ctx.font = G.font(15, 'title');
        ctx.fillText('O poema está completo.', R.x, R.y + 350);
      }
    }
    drawPeople(ctx, L, R) {
      const met = G.Save.meta.people;
      const order = ['zab', 'nan', 'sab', 'filo', 'can', 'vir', 'ze', 'tiao', 'tete', 'lala', 'anz', 'biu', 'juca', 'zef', 'fir', 'luz', 'man', 'ren', 'cor', 'tra'];
      const list = order.filter((p) => met.includes(p) || met.includes(p + 'C'));
      const per = 4;
      const pages = Math.max(1, Math.ceil(list.length / (per * 2)));
      const pg = Math.min(this.scroll, pages - 1);
      const slice = list.slice(pg * per * 2, pg * per * 2 + per * 2);
      slice.forEach((id, i) => {
        const col = i < per ? L : R;
        const yy = col.y + 6 + (i % per) * 96;
        G.Portraits.draw(ctx, id, 'neutro', col.x, yy, 84, { t: this.t });
        ctx.textAlign = 'left';
        ctx.fillStyle = C.red;
        ctx.font = G.font(16, 'title');
        ctx.fillText(G.Story.speakers[id].name, col.x + 96, yy + 18);
        ctx.fillStyle = C.ink;
        ctx.font = G.font(14, 'body');
        U.wrap(ctx, G.Story.people[id] || '', col.w - 96).slice(0, 4).forEach((l, k) => ctx.fillText(l, col.x + 96, yy + 40 + k * 17));
      });
      ctx.font = G.font(14, 'body', 'italic');
      ctx.fillStyle = C.inkSoft;
      ctx.textAlign = 'right';
      ctx.fillText('conhecidos: ' + list.length + '/' + order.length + '  ·  página ' + (pg + 1) + '/' + pages + ' (↑/↓)', R.x + R.w, R.y + 400);
      if (!list.length) {
        ctx.textAlign = 'left';
        ctx.fillText('Ninguém ainda. Vá conversar com o povo!', L.x, L.y + 30);
      }
    }
    drawBestiary(ctx, L, R) {
      const seen = G.Save.meta.bestiary;
      const all = Object.keys(G.ENEMY_INFO);
      all.forEach((k, i) => {
        const col = i < 6 ? L : R;
        const yy = col.y + 8 + (i % 6) * 66;
        const has = seen.includes(k);
        ctx.save();
        ctx.beginPath();
        ctx.rect(col.x, yy - 8, 56, 56);
        ctx.clip();
        ctx.fillStyle = has ? '#e2cfa4' : '#cbbd9e';
        ctx.fillRect(col.x, yy - 8, 56, 56);
        if (has) {
          G.setTheme('papel');
          const st = { x: col.x + 28, y: yy + 40, t: this.t, look: Math.PI / 2, angle: -0.3, alt: 14, emerge: 1, ch: 'Ç', dir: 'right', size: 0.8, lift: 0 };
          if (k === 'jagunco') G.Sprites.humanoid(ctx, 'jagunco', { x: col.x + 28, y: yy + 46, dir: 'down', t: this.t, scale: 0.8 });
          else if (G.Creatures[k]) {
            ctx.translate(col.x + 28, yy + 40);
            ctx.scale(0.8, 0.8);
            ctx.translate(-(col.x + 28), -(yy + 40));
            G.Creatures[k](ctx, st);
          }
          const W = G.Game.world();
          if (W) G.setTheme(W.map.theme);
        }
        ctx.restore();
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(col.x, yy - 8, 56, 56);
        const info = G.ENEMY_INFO[k];
        ctx.textAlign = 'left';
        ctx.fillStyle = has ? C.red : '#a8977a';
        ctx.font = G.font(15, 'title');
        ctx.fillText(has ? info.name : '???', col.x + 66, yy + 8);
        ctx.fillStyle = has ? C.ink : '#a8977a';
        ctx.font = G.font(13, 'body');
        U.wrap(ctx, has ? info.desc : 'Ainda não encontrado.', col.w - 70).slice(0, 2).forEach((l, j) => ctx.fillText(l, col.x + 66, yy + 26 + j * 15));
      });
    }
    drawEndings(ctx, L, R) {
      const E = G.Save.meta.endings;
      const list = [
        ['ponto', 'PONTO FINAL.', 'Carimbar "FIM" e fechar o livro.'],
        ['reticencias', 'RETICÊNCIAS...', 'Deixar a dor seguir, acompanhada.'],
        ['virgula', 'VÍRGULA,', 'O final verdadeiro. Exige os nove Versos Perdidos.'],
      ];
      list.forEach(([id, name, desc], i) => {
        const yy = L.y + 40 + i * 110;
        const has = E.includes(id);
        Art.drawWood(ctx, has ? name : '? ? ?', L.x, yy, 30, has ? C.red : '#b0a080', { align: 'left' });
        ctx.font = G.font(17, 'body', 'italic');
        ctx.fillStyle = has ? C.ink : '#a8977a';
        ctx.textAlign = 'left';
        ctx.fillText(has ? desc : 'Final ainda não visto.', L.x, yy + 38);
      });
      ctx.textAlign = 'left';
      ctx.fillStyle = C.ink;
      ctx.font = G.font(17, 'body');
      const lines = [
        'Jogos terminados: ' + G.Save.meta.finished,
        'Versos Perdidos: ' + G.Save.meta.verses.length + '/9',
        'Capítulos liberados: ' + G.Save.meta.chapters.length + '/5',
        '',
        '"Toda história precisa de uma pausa.',
        ' O ponto termina. As reticências esperam.',
        ' A vírgula continua."',
        '                         — Seu Vírgula',
      ];
      lines.forEach((l, i) => ctx.fillText(l, R.x, R.y + 50 + i * 28));
    }
  }
  G.JournalScene = JournalScene;

  // ==================================================================
  // PAUSA
  // ==================================================================
  class PauseScene {
    constructor(under, fromPeleja) {
      this.under = under;
      this.fromPeleja = fromPeleja;
      this.t = 0;
      this.sel = 0;
      this.opaque = false;
      this.items = [
        { label: 'Continuar', act: () => this.resume() },
        { label: 'Caderno', act: () => SM().push(new JournalScene({ inGame: true })), hide: fromPeleja },
        { label: 'Configurações', act: () => SM().push(new SettingsScene({ overlay: true })) },
        { label: 'Controles', act: () => SM().push(new ControlsScene({ overlay: true })) },
        { label: 'Voltar ao menu principal', act: () => SM().push(new ConfirmScene('Voltar ao menu? Você continua do último candeeiro aceso.', () => G.Game.toMenu())) },
      ].filter((i) => !i.hide);
    }
    enter() {
      Inp.touch.layout = 'menu';
      if (Au.running()) Au.ctx.suspend && this.fromPeleja && Au.ctx.suspend();
      Au.duck && Au.duck(0.35, 9999);
    }
    exit() {
      Inp.touch.layout = this.fromPeleja ? 'peleja' : 'game';
      if (Au.ctx && Au.ctx.state === 'suspended' && this.fromPeleja) Au.ctx.resume();
      if (Au.running()) {
        const t = Au.ctx.currentTime;
        const g = Au.musicBus.gain;
        g.cancelScheduledValues(t);
        Au.applyVolumes();
      }
    }
    resume() {
      Au.sfx('menuSelect');
      SM().pop();
    }
    update(dt) {
      this.t += dt;
      const n = this.items.length;
      if (Inp.repeat('up')) {
        this.sel = (this.sel + n - 1) % n;
        Au.sfx('menuMove');
      }
      if (Inp.repeat('down')) {
        this.sel = (this.sel + 1) % n;
        Au.sfx('menuMove');
      }
      if (this.rects) {
        this.rects.forEach((r, i) => {
          if (U.inRect(Inp.mouse.x, Inp.mouse.y, r)) {
            if (Inp.mouse.moved) this.sel = i;
            if (Inp.mouse.clicked) {
              this.sel = i;
              this.items[i].act();
            }
          }
        });
      }
      if (this.t > 0.1 && Inp.pressed('confirm')) {
        Au.sfx('menuSelect');
        this.items[this.sel].act();
      } else if (this.t > 0.1 && (Inp.pressed('pause') || Inp.pressed('cancel'))) this.resume();
    }
    draw(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(15,10,6,0.62)';
      ctx.fillRect(0, 0, G.W, G.H);
      const w = 420, h = 120 + this.items.length * 50;
      const x = G.W / 2 - w / 2, y = G.H / 2 - h / 2;
      Art.panel(ctx, x, y, w, h, { fill: C.paper, teeth: true });
      Art.drawWood(ctx, 'PAUSA', G.W / 2, y + 48, 38, C.ink, { red: C.red });
      this.rects = [];
      this.items.forEach((it, i) => {
        const yy = y + 104 + i * 50;
        const sel = i === this.sel;
        this.rects.push({ x: x + 20, y: yy - 22, w: w - 40, h: 44 });
        if (sel) {
          ctx.fillStyle = 'rgba(194,58,34,0.13)';
          ctx.fillRect(x + 20, yy - 20, w - 40, 40);
          Art.hand(ctx, x + 56 + Math.sin(this.t * 7) * 3, yy, 1.1, C.red);
        }
        ctx.font = G.font(21, 'title');
        ctx.fillStyle = sel ? C.red : C.ink;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(it.label, x + 90, yy + 1);
      });
      ctx.font = G.font(14, 'body', 'italic');
      ctx.fillStyle = C.paperLight;
      ctx.textAlign = 'center';
      const S = G.state;
      ctx.fillText(G.Story.CH[S.chapter].num + ' · ' + U.fmtTime(S.time) + ' · Versos Perdidos ' + G.Save.meta.verses.length + '/9', G.W / 2, y + h + 24);
      ctx.restore();
    }
  }
  G.PauseScene = PauseScene;

  // ==================================================================
  // O FOLHETO RASGOU (fim de jogo)
  // ==================================================================
  const QUIPS = [
    'Levante-se, senhorita. Borrão nenhum tem direito de assinar o seu final.',
    'Consta nos autos: a senhorita caiu. Consta também que vai levantar.',
    'Folheto rasgado a gente cola com goma. Vamos de novo.',
    'Até o Cego Sabiá erra uma rima de vez em quando.',
    'Hunf. Eu teria desviado. Se eu tivesse pernas maiores.',
  ];
  class GameOverScene {
    constructor() {
      this.t = 0;
      this.sel = 0;
      this.opaque = true;
      this.quip = U.pick(QUIPS);
      this.items = ['Tentar de novo', 'Menu principal'];
    }
    enter() {
      Inp.touch.layout = 'menu';
      Au.jingle('defeat', null);
    }
    update(dt) {
      this.t += dt;
      if (this.t < 1) return;
      if (Inp.repeat('up') || Inp.repeat('down')) {
        this.sel = 1 - this.sel;
        Au.sfx('menuMove');
      }
      if (this.rects) {
        this.rects.forEach((r, i) => {
          if (U.inRect(Inp.mouse.x, Inp.mouse.y, r)) {
            if (Inp.mouse.moved) this.sel = i;
            if (Inp.mouse.clicked) {
              this.sel = i;
              this.go();
            }
          }
        });
      }
      if (Inp.pressed('confirm')) this.go();
    }
    go() {
      Au.sfx('menuSelect');
      if (this.sel === 0) G.Game.retry();
      else G.Game.toMenu();
    }
    draw(ctx) {
      const t = this.t;
      ctx.fillStyle = '#120e0b';
      ctx.fillRect(0, 0, G.W, G.H);
      // pedaços de papel caindo
      for (let i = 0; i < 24; i++) {
        const x = (U.hash(i, 1) * G.W + Math.sin(t + i) * 20) % G.W;
        const y = ((U.hash(i, 2) * G.H + t * (30 + U.hash(i, 3) * 40)) % (G.H + 40)) - 20;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * (U.hash(i, 4) - 0.5) * 3 + i);
        ctx.fillStyle = '#d6c39c';
        ctx.globalAlpha = 0.25;
        ctx.fillRect(-10, -6, 20, 12);
        ctx.restore();
      }
      const k = U.ease.outBack(Math.min(1, t / 0.6));
      ctx.save();
      ctx.translate(G.W / 2, 150);
      ctx.scale(k, k);
      Art.drawWood(ctx, 'O FOLHETO', 0, -30, 56, C.paperLight, { red: C.red });
      Art.drawWood(ctx, 'RASGOU!', 0, 40, 72, C.red, { red: C.ink });
      ctx.restore();
      if (t > 0.6) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, (t - 0.6) * 2);
        G.Creatures.nanquim(ctx, { x: 200, y: 360, t, scale: 2.2, face: 'sad', dir: 'right', talking: t < 3 });
        ctx.font = G.font(20, 'body', 'italic');
        ctx.fillStyle = C.paperLight;
        ctx.textAlign = 'left';
        U.wrap(ctx, '"' + this.quip + '"', 560).forEach((l, i) => ctx.fillText(l, 280, 300 + i * 28));
        this.rects = [];
        this.items.forEach((it, i) => {
          const yy = 420 + i * 44;
          const sel = i === this.sel;
          ctx.font = G.font(24, 'title');
          ctx.fillStyle = sel ? C.red : C.paperLight;
          ctx.fillText(it, 330, yy);
          if (sel) Art.hand(ctx, 300, yy - 8, 1.2, C.red);
          this.rects.push({ x: 290, y: yy - 30, w: 360, h: 40 });
        });
        ctx.restore();
      }
    }
  }
  G.GameOverScene = GameOverScene;

  // ==================================================================
  // FIM DE CAPÍTULO
  // ==================================================================
  class ChapterCompleteScene {
    constructor(id, stats, next) {
      this.id = id;
      this.stats = stats;
      this.next = next;
      this.t = 0;
      this.opaque = true;
    }
    enter() {
      Inp.touch.layout = 'menu';
      Au.stop(0.3);
      Au.ambient(null);
      setTimeout(() => Au.play('chapter', { restart: true, after: 'menu' }), 300);
    }
    update(dt) {
      this.t += dt;
      if (this.t > 2 && (Inp.pressed('confirm') || Inp.mouse.clicked)) {
        Au.sfx('menuSelect');
        if (this.next) G.Game.startNextChapter(this.next);
        else G.Game.toMenu();
      }
    }
    draw(ctx) {
      const t = this.t;
      const CH = G.Story.CH;
      Art.fillPaper(ctx, 0, 0, G.W, G.H, '#efe2c4');
      Art.pageFrame(ctx, C.ink);
      const k = U.ease.outBack(Math.min(1, t / 0.6));
      ctx.save();
      ctx.translate(G.W / 2, 110);
      ctx.scale(k, k);
      ctx.fillStyle = C.red;
      ctx.font = G.font(20, 'title');
      ctx.textAlign = 'center';
      ctx.fillText('FIM D' + (this.id === 'prologo' ? 'O ' : 'O ') + CH[this.id].num, 0, -30);
      Art.drawWood(ctx, CH[this.id].name, 0, 20, 40, C.ink, { red: C.red });
      ctx.restore();
      Art.vinheta(ctx, G.W / 2, 176, 420, C.ink);
      const s = this.stats;
      const rows = [
        ['Tempo', U.fmtTime(s.time)],
        ['Rimas no bolso', String(s.rimas)],
        ['Inimigos espantados', String(s.kills)],
        ['Golpes recebidos', String(s.hits)],
        ['Versos Perdidos', s.verses + '/9'],
      ];
      rows.forEach((r, i) => {
        if (t < 0.6 + i * 0.25) return;
        const y = 216 + i * 36;
        ctx.font = G.font(20, 'body');
        ctx.fillStyle = C.ink;
        ctx.textAlign = 'right';
        ctx.fillText(r[0], G.W / 2 - 20, y);
        ctx.textAlign = 'left';
        ctx.font = G.font(20, 'title');
        ctx.fillStyle = C.red;
        ctx.fillText(r[1], G.W / 2 + 20, y);
      });
      if (this.next && t > 1.8) {
        ctx.font = G.font(18, 'body', 'italic');
        ctx.fillStyle = C.inkSoft;
        ctx.textAlign = 'center';
        ctx.fillText('A seguir: ' + CH[this.next].num + ' — ' + CH[this.next].name, G.W / 2, 430);
      }
      if (t > 2) {
        ctx.globalAlpha = 0.6 + Math.sin(t * 5) * 0.4;
        ctx.font = G.font(16, 'title');
        ctx.fillStyle = C.ink;
        ctx.textAlign = 'center';
        ctx.fillText('[ ' + Inp.keyLabel('confirm') + ' ] virar a página', G.W / 2, 480);
        ctx.globalAlpha = 1;
      }
      G.Sprites.humanoid(ctx, 'zabele', { x: 120, y: 470, dir: 'right', t, scale: 1.6, pose: t % 3 < 1.5 ? 'cheer' : 'idle' });
      G.Creatures.nanquim(ctx, { x: 180, y: 476, t, dir: 'left', scale: 1.3 });
    }
  }
  G.ChapterCompleteScene = ChapterCompleteScene;

  // ==================================================================
  // LOJA DA DONA FILÓ
  // ==================================================================
  class ShopScene {
    constructor(done) {
      this.done = done;
      this.t = 0;
      this.sel = 0;
      this.opaque = false;
      this.msg = '"Escolhe com calma, meu fi, que pressa é coisa de urubu."';
    }
    items() {
      const S = G.state;
      return G.Story.shop.filter((it) => !it.need || it.need(S));
    }
    price(it) {
      const n = it.count(G.state);
      return it.price[Math.min(n, it.price.length - 1)];
    }
    update(dt) {
      this.t += dt;
      const list = this.items();
      const n = list.length + 1;
      if (Inp.repeat('up')) {
        this.sel = (this.sel + n - 1) % n;
        Au.sfx('menuMove');
      }
      if (Inp.repeat('down')) {
        this.sel = (this.sel + 1) % n;
        Au.sfx('menuMove');
      }
      if (this.rects) {
        this.rects.forEach((r, i) => {
          if (U.inRect(Inp.mouse.x, Inp.mouse.y, r)) {
            if (Inp.mouse.moved) this.sel = i;
            if (Inp.mouse.clicked) {
              this.sel = i;
              this.buy();
            }
          }
        });
      }
      if (this.t > 0.2 && Inp.pressed('confirm')) this.buy();
      if (Inp.pressed('cancel')) this.close();
    }
    buy() {
      const list = this.items();
      if (this.sel >= list.length) return this.close();
      const it = list[this.sel];
      const S = G.state;
      const n = it.count(S);
      if (n >= it.max) {
        Au.sfx('error');
        this.msg = '"Esse acabou, meu fi. Nem a Lorota tem mais."';
        return;
      }
      const p = this.price(it);
      if (S.rimas < p) {
        Au.sfx('error');
        this.msg = '"Tá faltando rima nesse bolso aí, minha fia."';
        return;
      }
      if (it.id === 'garrafada' && S.hp >= S.maxHp) {
        Au.sfx('error');
        this.msg = '"Tu tá mais saudável que eu! Guarda o dinheiro."';
        return;
      }
      S.rimas -= p;
      it.apply(S);
      S.bought[it.id] = (S.bought[it.id] || 0) + 1;
      Au.sfx('buy');
      this.msg = U.pick(['"Negócio fechado! Leva que é bom!"', '"Tu tem bom gosto, igual tua mãe."', '"Vendido! A Lorota aprova."', '"Isso aí dura mais que promessa de político."']);
    }
    close() {
      Au.sfx('menuBack');
      G.Game.checkpoint();
      SM().pop();
      if (this.done) this.done();
    }
    draw(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(15,10,6,0.6)';
      ctx.fillRect(0, 0, G.W, G.H);
      const x = 190, y = 36, w = G.W - 230, h = G.H - 70;
      Art.panel(ctx, x, y, w, h, { fill: C.paper, teeth: true });
      Art.drawWood(ctx, 'BARRACA DA FILÓ', x + w / 2, y + 42, 28, C.ink, { red: C.red });
      Art.panel(ctx, 26, 60, 168, 168, { fill: C.ink });
      G.Portraits.draw(ctx, 'filo', 'feliz', 30, 64, 160, { t: this.t, talk: this.t % 2 < 0.8 });
      G.Creatures.lorota(ctx, { x: 110, y: 330, t: this.t, dir: 'right' });
      const list = this.items();
      const S = G.state;
      this.rects = [];
      list.concat([{ name: 'Sair da barraca', exit: true }]).forEach((it, i) => {
        const yy = y + 84 + i * 62;
        const sel = i === this.sel;
        this.rects.push({ x: x + 16, y: yy - 20, w: w - 32, h: 58 });
        if (sel) {
          ctx.fillStyle = 'rgba(194,58,34,0.13)';
          ctx.fillRect(x + 16, yy - 20, w - 32, 58);
          Art.hand(ctx, x + 40, yy + 4, 1, C.red);
        }
        ctx.textAlign = 'left';
        ctx.fillStyle = sel ? C.red : C.ink;
        ctx.font = G.font(20, 'title');
        ctx.fillText(it.name, x + 66, yy + 6);
        if (!it.exit) {
          const n = it.count(S);
          const soldOut = n >= it.max;
          ctx.font = G.font(14, 'body', 'italic');
          ctx.fillStyle = C.inkSoft;
          ctx.fillText(it.desc, x + 66, yy + 26, w - 240);
          ctx.textAlign = 'right';
          ctx.font = G.font(18, 'title');
          ctx.fillStyle = soldOut ? '#a8977a' : S.rimas >= this.price(it) ? C.ink : C.red;
          ctx.fillText(soldOut ? 'ESGOTADO' : this.price(it) + ' rimas', x + w - 30, yy + 6);
          if (it.max < 99) {
            ctx.font = G.font(12, 'body');
            ctx.fillStyle = C.inkSoft;
            ctx.fillText(n + '/' + it.max, x + w - 30, yy + 24);
          }
        }
      });
      ctx.textAlign = 'center';
      ctx.font = G.font(17, 'body', 'italic');
      ctx.fillStyle = C.ink;
      ctx.fillText(this.msg, x + w / 2, y + h - 48);
      ctx.font = G.font(18, 'title');
      ctx.fillStyle = C.red;
      ctx.fillText('No bolso: ' + S.rimas + ' rimas  ·  Fôlego ' + S.hp / 2 + '/' + S.maxHp / 2, x + w / 2, y + h - 20);
      ctx.restore();
    }
  }
  G.ShopScene = ShopScene;

  // ==================================================================
  // VERSO PERDIDO ENCONTRADO
  // ==================================================================
  class VerseScene {
    constructor(n, isNew, done) {
      this.n = n;
      this.isNew = isNew;
      this.done = done;
      this.t = 0;
      this.opaque = false;
    }
    update(dt) {
      this.t += dt;
      if (this.t > 1.2 && (Inp.pressed('confirm') || Inp.pressed('interact') || Inp.mouse.clicked)) {
        Au.sfx('page');
        SM().pop();
        if (this.done) this.done();
      }
    }
    draw(ctx) {
      const v = G.Story.verses[this.n];
      const k = U.ease.outBack(Math.min(1, this.t / 0.5));
      ctx.save();
      ctx.fillStyle = 'rgba(15,10,6,' + Math.min(0.7, this.t * 2) + ')';
      ctx.fillRect(0, 0, G.W, G.H);
      ctx.translate(G.W / 2, G.H / 2);
      ctx.scale(k, k);
      ctx.rotate(Math.sin(this.t * 1.5) * 0.01);
      const w = 520, h = 330;
      Art.panel(ctx, -w / 2, -h / 2, w, h, { fill: '#f6ecd4' });
      ctx.textAlign = 'center';
      ctx.fillStyle = C.red;
      ctx.font = G.font(15, 'title');
      ctx.fillText(this.isNew ? 'VERSO PERDIDO ENCONTRADO!' : 'VERSO PERDIDO (já estava no Caderno)', 0, -h / 2 + 40);
      Art.vinheta(ctx, 0, -h / 2 + 58, 300, C.ink);
      ctx.font = G.font(24, 'body', 'italic');
      ctx.fillStyle = C.ink;
      v.lines.forEach((l, i) => {
        if (this.t > 0.4 + i * 0.25) ctx.fillText(l, 0, -h / 2 + 110 + i * 38);
      });
      Art.vinheta(ctx, 0, h / 2 - 70, 300, C.ink);
      ctx.font = G.font(15, 'body');
      ctx.fillText('Estrofe ' + ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'][this.n - 1] + ' de "O Sol de Papel" · ' + G.Save.meta.verses.length + '/9 encontradas', 0, h / 2 - 40);
      ctx.restore();
    }
  }
  G.VerseScene = VerseScene;

  // ==================================================================
  // CRÉDITOS (com cortejo dos personagens)
  // ==================================================================
  class CreditsScene {
    constructor(kind) {
      this.kind = kind;
      this.t = 0;
      this.opaque = true;
      this.lines = [
        ['title', 'PELEJA'],
        ['sub', 'de Zabelê com a Traça que Comeu o Sol'],
        ['gap'],
        ['head', 'CONCEITO, HISTÓRIA E VERSOS'],
        ['name', 'Claude'],
        ['gap'],
        ['head', 'PROGRAMAÇÃO E MOTOR DO JOGO'],
        ['name', 'Claude'],
        ['gap'],
        ['head', 'ARTE EM XILOGRAVURA (TODA DESENHADA POR CÓDIGO)'],
        ['name', 'Claude'],
        ['gap'],
        ['head', 'MÚSICA E EFEITOS (SINTETIZADOS NA HORA)'],
        ['name', 'Sanfona, zabumba, triângulo, pífano,'],
        ['name', 'rabeca e viola de dez cordas de mentirinha'],
        ['gap'],
        ['head', 'ELENCO'],
        ['cast', 'Zabelê', 'a vendedora de folhetos'],
        ['cast', 'Seu Nanquim', 'o tinteiro de cristal'],
        ['cast', 'Cego Sabiá', 'o cantador'],
        ['cast', 'Dona Filó & Lorota', 'comércio e opinião'],
        ['cast', 'Vovó Candinha', 'as lendas'],
        ['cast', 'Seu Vírgula', 'a pausa'],
        ['cast', 'Zé Pipoco & Bodinha', 'rojão e sininho'],
        ['cast', 'Tião Vaqueiro', 'poucas palavras'],
        ['cast', 'Tetê & Lalá', 'meia frase cada'],
        ['cast', 'Seu Anzol', 'deste tamanho'],
        ['cast', 'Biu', 'figurante nº 3'],
        ['cast', 'Juca Manchete', 'EXTRA! EXTRA!'],
        ['cast', 'Dona Zefinha', 'pão de papel'],
        ['cast', 'Capitão Mandacaru', 'que floresceu'],
        ['cast', 'Dona Renda', 'que desembolou'],
        ['cast', 'Coronel Papelão', 'que queria ser escrito'],
        ['cast', 'Mestre Firmino', 'o Poeta'],
        ['cast', 'Luzia', 'a luz'],
        ['cast', 'A Traça', 'a saudade'],
        ['gap'],
        ['head', 'INSPIRADO EM'],
        ['name', 'Toda a literatura de cordel,'],
        ['name', 'os xilogravadores do Nordeste,'],
        ['name', 'os repentistas e as rendeiras de bilro.'],
        ['gap'],
        ['head', 'E VOCÊ,'],
        ['name', 'leitor ou leitora, que chegou até esta página.'],
        ['gap'],
        ['gap'],
        ['end', kind === 'virgula' ? 'Continua,' : kind === 'reticencias' ? '...' : kind === 'ponto' ? 'FIM.' : 'Obrigado por ler!'],
      ];
      this.parade = ['zabele', 'nanquim', 'sabia', 'filo', 'lorota', 'candinha', 'virgula', 'ze', 'bodinha', 'tiao', 'tete', 'lala', 'anzol', 'biu', 'juca', 'zefinha', 'firmino'];
    }
    enter() {
      Inp.touch.layout = 'menu';
      Au.play('credits', { restart: true, fadeIn: 1 });
      G.setTheme('vila');
    }
    update(dt) {
      this.t += dt * (Inp.down('confirm') ? 4 : 1);
      if ((this.t > 3 && Inp.pressed('cancel')) || this.scrollY < -this.totalH - 80) {
        G.Game.toMenu();
      }
    }
    draw(ctx) {
      const t = this.t;
      Art.fillPaper(ctx, 0, 0, G.W, G.H, this.kind === 'virgula' ? '#f1dc9c' : '#efe2c4');
      if (this.kind === 'virgula') {
        ctx.save();
        ctx.globalAlpha = 0.35;
        G.Panels.drawMothSun(ctx, G.W / 2, 150, 80, t);
        ctx.restore();
      }
      const speed = 38;
      const y0 = G.H + 20 - t * speed;
      this.scrollY = y0;
      let y = y0;
      ctx.save();
      ctx.textAlign = 'center';
      // o texto some antes de chegar ao cortejo do rodapé
      const fadeBottom = G.H - 84;
      for (const l of this.lines) {
        const k = l[0];
        const low = U.clamp((fadeBottom - y) / 44, 0, 1);
        ctx.globalAlpha = k === 'end' ? low : low * U.clamp((y + 20) / 50, 0, 1);
        if (k === 'title') {
          if (y > -80 && y < G.H + 80) Art.drawWood(ctx, l[1], G.W / 2, y, 64, C.ink, { red: C.red, spacing: 4 });
          y += 60;
        } else if (k === 'sub') {
          ctx.font = G.font(20, 'body', 'italic');
          ctx.fillStyle = C.ink;
          ctx.fillText(l[1], G.W / 2, y);
          y += 40;
        } else if (k === 'head') {
          ctx.font = G.font(16, 'title');
          ctx.fillStyle = C.red;
          ctx.fillText(l[1], G.W / 2, y);
          y += 30;
        } else if (k === 'name') {
          ctx.font = G.font(22, 'body');
          ctx.fillStyle = C.ink;
          ctx.fillText(l[1], G.W / 2, y);
          y += 30;
        } else if (k === 'cast') {
          ctx.font = G.font(20, 'title');
          ctx.fillStyle = C.ink;
          ctx.textAlign = 'right';
          ctx.fillText(l[1], G.W / 2 - 14, y);
          ctx.textAlign = 'left';
          ctx.font = G.font(18, 'body', 'italic');
          ctx.fillText(l[2], G.W / 2 + 14, y);
          ctx.textAlign = 'center';
          y += 30;
        } else if (k === 'gap') y += 34;
        else if (k === 'end') {
          if (y > -80 && y < G.H + 80) Art.drawWood(ctx, l[1], G.W / 2, Math.max(y, G.H / 2 - 40), 72, C.red, { red: C.ink });
          y += 80;
        }
      }
      this.totalH = y - y0;
      ctx.restore();
      // cortejo dos personagens no rodapé
      ctx.save();
      ctx.fillStyle = 'rgba(29,23,18,0.08)';
      ctx.fillRect(0, G.H - 70, G.W, 70);
      const n = this.parade.length;
      for (let i = 0; i < n; i++) {
        const x = ((t * 40 + i * 90) % (n * 90)) - 60;
        const id = this.parade[i];
        const st = { x, y: G.H - 14, dir: 'right', t: t + i, moving: true, phase: t * 9 + i, scale: 1.1 };
        if (id === 'nanquim') G.Creatures.nanquim(ctx, st);
        else G.Sprites.draw(ctx, id, st);
      }
      ctx.restore();
      Art.vignette(ctx);
      ctx.save();
      ctx.font = G.font(13, 'body', 'italic');
      ctx.fillStyle = C.inkSoft;
      ctx.textAlign = 'right';
      ctx.fillText('segure ' + Inp.keyLabel('confirm') + ' para acelerar · ' + Inp.keyLabel('cancel') + ' para sair', G.W - 20, 22);
      ctx.restore();
    }
  }
  G.CreditsScene = CreditsScene;

  G.TitleScene = TitleScene;
  G.MainMenu = MainMenu;
})();
