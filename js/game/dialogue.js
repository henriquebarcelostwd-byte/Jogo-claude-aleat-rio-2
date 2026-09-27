/* PELEJA — caixa de diálogo, narração e escolhas */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Art = G.Art;
  const Inp = G.Input;
  const Au = G.Audio;
  const C = G.C;

  const SPEEDS = [26, 48, 95, 9999];

  class DialogueBox {
    constructor() {
      this.active = false;
      this.mode = 'line';
      this.k = 0; // animação de entrada
      this.t = 0;
    }
    speaker(who) {
      const sp = (G.Story && G.Story.speakers[who]) || { name: who, voice: { type: 'triangle', base: 300 } };
      return sp;
    }
    open(line) {
      this.active = true;
      this.mode = line.narr ? 'narr' : 'line';
      this.line = line;
      this.who = line.who;
      this.expr = line.expr || 'neutro';
      const sp = this.speaker(line.who);
      this.side = line.side || sp.side || 'right';
      this.name = line.name || sp.name;
      this.voice = sp.voice;
      this.text = line.text;
      this.shown = 0;
      this.full = false;
      this.done = false;
      this.wait = 0;
      this.t = 0;
      this.lines = null;
      this.auto = line.auto;
      this.memory = line.memory || sp.memory;
      if (this.k < 0.01) this.k = 0.001;
    }
    openChoice(prompt, options, o = {}) {
      this.active = true;
      this.mode = 'choice';
      this.prompt = prompt;
      this.options = options;
      this.sel = 0;
      this.result = null;
      this.done = false;
      this.chWho = o.who || 'zab';
      this.chExpr = o.expr || 'pensativo';
      this.t = 0;
      if (this.k < 0.01) this.k = 0.001;
    }
    close() {
      this.active = false;
    }
    layout(ctx) {
      const hasP = this.mode === 'line' && G.Portraits.has(this.who);
      const left = this.side === 'left';
      const x0 = this.mode === 'narr' ? 110 : hasP && left ? 206 : 56;
      const x1 = this.mode === 'narr' ? G.W - 110 : hasP && !left ? G.W - 206 : G.W - 56;
      ctx.font = G.font(this.mode === 'narr' ? 23 : 22, 'body', this.mode === 'narr' || this.memory ? 'italic' : '');
      this.lines = U.wrap(ctx, this.text, x1 - x0);
      this.tx0 = x0;
      this.tx1 = x1;
      this.total = this.text.replace(/\*/g, '').length;
    }
    update(dt) {
      if (!this.active) {
        this.k = Math.max(0, this.k - dt * 6);
        return;
      }
      this.k = Math.min(1, this.k + dt * 6);
      this.t += dt;
      if (this.mode === 'choice') {
        const n = this.options.length;
        if (Inp.repeat('up')) {
          this.sel = (this.sel + n - 1) % n;
          Au.sfx('menuMove');
        }
        if (Inp.repeat('down')) {
          this.sel = (this.sel + 1) % n;
          Au.sfx('menuMove');
        }
        const m = Inp.mouse;
        if (this.optRects) {
          this.optRects.forEach((r, i) => {
            if (U.inRect(m.x, m.y, r)) {
              if (m.moved && this.sel !== i) {
                this.sel = i;
                Au.sfx('menuMove');
              }
              if (m.clicked) {
                this.sel = i;
                this.pick();
              }
            }
          });
        }
        if (this.t > 0.25 && (Inp.pressed('confirm') || Inp.pressed('interact'))) this.pick();
        return;
      }
      if (!this.lines) return;
      const sp = SPEEDS[G.Save.settings.textSpeed] || 48;
      if (!this.full) {
        if (this.wait > 0) this.wait -= dt;
        else {
          const before = Math.floor(this.shown);
          this.shown += sp * dt;
          const now = Math.floor(this.shown);
          const plain = this.text.replace(/\*/g, '');
          for (let i = before; i < Math.min(now, plain.length); i++) {
            const ch = plain[i];
            if (ch === ',' || ch === ';') this.wait = 0.09;
            if (ch === '.' || ch === '!' || ch === '?' || ch === '…') this.wait = 0.16;
            if (/[a-zA-ZÀ-ú]/.test(ch) && i % 2 === 0 && this.mode !== 'narr') Au.blip(this.voice);
            if (this.wait > 0) {
              this.shown = i + 1;
              break;
            }
          }
          if (this.shown >= this.total) {
            this.shown = this.total;
            this.full = true;
          }
        }
        if (this.t > 0.12 && (Inp.pressed('confirm') || Inp.pressed('interact') || Inp.mouse.clicked)) {
          this.shown = this.total;
          this.full = true;
          Inp.consume('confirm');
          Inp.consume('interact');
          this.t = 0.05;
        }
      } else {
        if (this.auto != null) {
          this.auto -= dt;
          if (this.auto <= 0) this.done = true;
        }
        if (this.t > 0.15 && (Inp.pressed('confirm') || Inp.pressed('interact') || Inp.mouse.clicked)) {
          this.done = true;
          Au.sfx('menuMove', { vol: 0.5 });
        }
      }
    }
    pick() {
      const o = this.options[this.sel];
      if (o && o.locked) {
        Au.sfx('error');
        return;
      }
      this.result = this.sel;
      this.done = true;
      Au.sfx('menuSelect');
    }
    get typing() {
      return this.active && this.mode !== 'choice' && !this.full;
    }
    draw(ctx) {
      if (this.k <= 0) return;
      const e = U.ease.outCubic(this.k);
      ctx.save();
      ctx.globalAlpha = e;
      ctx.translate(0, (1 - e) * 40);
      if (this.mode === 'choice') this.drawChoice(ctx);
      else if (this.mode === 'narr') this.drawNarr(ctx);
      else this.drawLine(ctx);
      ctx.restore();
    }
    drawLine(ctx) {
      if (!this.lines) this.layout(ctx);
      const bx = 22, by = G.H - 146, bw = G.W - 44, bh = 128;
      Art.panel(ctx, bx, by, bw, bh, { fill: this.memory ? '#f3d9cc' : C.paper, teeth: true });
      const hasP = G.Portraits.has(this.who);
      const left = this.side === 'left';
      if (hasP) {
        const px = left ? 30 : G.W - 30 - 160;
        Art.panel(ctx, px - 4, by - 58, 168, 168, { fill: C.ink, shadow: true });
        G.Portraits.draw(ctx, this.who, this.expr, px, by - 54, 160, { talk: !this.full, memory: this.memory, flip: !left && this.who !== 'tra' && this.who !== 'lor' });
      }
      // placa do nome
      if (this.name) {
        ctx.font = G.font(19, 'title');
        const nw = ctx.measureText(this.name).width + 30;
        const nx = hasP ? (left ? 204 : G.W - 204 - nw) : 44;
        const ny = by - 18;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(nx + 4, ny + 4, nw, 30);
        ctx.fillStyle = this.memory ? C.redDark : C.red;
        ctx.fillRect(nx, ny, nw, 30);
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(nx, ny, nw, 30);
        ctx.fillStyle = C.paperLight;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.name, nx + 15, ny + 16);
      }
      this.drawText(ctx, by + 42);
    }
    drawNarr(ctx) {
      if (!this.lines) this.layout(ctx);
      const h = 60 + this.lines.length * 30;
      const by = G.H - h - 26;
      Art.panel(ctx, 80, by, G.W - 160, h, { fill: '#f6ecd4' });
      Art.vinheta(ctx, G.W / 2, by + 16, 220, C.ink);
      this.drawText(ctx, by + 46, true);
    }
    drawText(ctx, y0, center = false) {
      const narr = this.mode === 'narr';
      ctx.font = G.font(narr ? 23 : 22, 'body', narr || this.memory ? 'italic' : '');
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      let remain = Math.floor(this.shown);
      const lh = narr ? 30 : 28;
      for (let i = 0; i < this.lines.length && i < 4; i++) {
        const raw = this.lines[i];
        const plainLen = raw.replace(/\*/g, '').length;
        let part = raw;
        if (remain < plainLen) {
          // corta preservando marcações
          let cnt = 0, j = 0;
          for (; j < raw.length && cnt < remain; j++) if (raw[j] !== '*') cnt++;
          part = raw.slice(0, j);
          if ((part.match(/\*/g) || []).length % 2 === 1) part += '*';
        }
        remain -= plainLen + 1;
        let x = this.tx0;
        if (center) {
          const w = ctx.measureText(raw.replace(/\*/g, '')).width;
          x = G.W / 2 - w / 2;
        }
        Art.rich(ctx, part, x, y0 + i * lh, C.ink, C.red);
        if (remain < 0) break;
      }
      if (this.full) {
        const b = Math.sin(this.t * 6) * 3;
        const x = narr ? G.W - 120 : G.W - 60;
        const y = narr ? G.H - 44 : G.H - 36;
        ctx.fillStyle = C.red;
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 6 + b);
        ctx.lineTo(x + 8, y - 6 + b);
        ctx.lineTo(x, y + 4 + b);
        ctx.closePath();
        ctx.fill();
      }
    }
    drawChoice(ctx) {
      const n = this.options.length;
      ctx.font = G.font(22, 'body');
      let w = 300;
      for (const o of this.options) w = Math.max(w, ctx.measureText(o.text || o).width + 90);
      w = Math.min(w, G.W - 260);
      const h = 64 + n * 40;
      const x = G.W - w - 40, y = G.H - h - 30;
      // retrato de quem escolhe
      Art.panel(ctx, 30, G.H - 196, 168, 168, { fill: C.ink });
      G.Portraits.draw(ctx, this.chWho, this.chExpr, 34, G.H - 192, 160, { t: G.time });
      Art.panel(ctx, x, y, w, h, { fill: C.paper, teeth: false });
      if (this.prompt) {
        ctx.font = G.font(18, 'body', 'italic');
        ctx.fillStyle = C.inkSoft;
        ctx.textAlign = 'left';
        ctx.fillText(this.prompt, x + 26, y + 34);
      }
      this.optRects = [];
      for (let i = 0; i < n; i++) {
        const o = this.options[i];
        const oy = y + 50 + i * 40;
        const sel = i === this.sel;
        this.optRects.push({ x: x + 10, y: oy - 6, w: w - 20, h: 36 });
        if (sel) {
          ctx.fillStyle = 'rgba(194,58,34,0.14)';
          ctx.fillRect(x + 12, oy - 4, w - 24, 34);
          Art.hand(ctx, x + 36 + Math.sin(this.t * 7) * 3, oy + 13, 1.1, C.red);
        }
        ctx.font = G.font(22, 'body', sel ? '' : '');
        ctx.fillStyle = o.locked ? '#9a8a70' : sel ? C.red : C.ink;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(o.text || o, x + 62, oy + 14);
      }
      ctx.textBaseline = 'alphabetic';
    }
  }
  G.DialogueBox = DialogueBox;
})();
