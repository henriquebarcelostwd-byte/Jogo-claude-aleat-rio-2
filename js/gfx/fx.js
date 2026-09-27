/* PELEJA — partículas, decalques no chão e textos flutuantes */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Art = G.Art;
  const SP = G.Sprites;

  class FX {
    constructor() {
      this.parts = [];
      this.decals = [];
    }

    add(p) {
      p.life = p.life || 0.6;
      p.age = 0;
      p.vx = p.vx || 0;
      p.vy = p.vy || 0;
      p.z = p.z || 0;
      p.vz = p.vz || 0;
      p.rot = p.rot || 0;
      p.vr = p.vr || 0;
      this.parts.push(p);
      if (this.parts.length > 700) this.parts.splice(0, this.parts.length - 700);
      return p;
    }

    burst(x, y, n, o = {}) {
      for (let i = 0; i < n; i++) {
        const a = o.angle != null ? o.angle + (Math.random() - 0.5) * (o.spread || 1) : Math.random() * U.TAU;
        const sp = (o.speed || 120) * (0.4 + Math.random() * 0.8);
        this.add({
          type: o.type || 'ink',
          x: x + (Math.random() - 0.5) * (o.jitter || 4),
          y: y + (Math.random() - 0.5) * (o.jitter || 4),
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp * 0.7,
          vz: o.vz != null ? o.vz * (0.6 + Math.random() * 0.8) : 80 + Math.random() * 120,
          z: o.z || 10,
          grav: o.grav != null ? o.grav : 500,
          size: (o.size || 3) * (0.6 + Math.random() * 0.8),
          color: o.color,
          life: (o.life || 0.6) * (0.7 + Math.random() * 0.6),
          rot: Math.random() * U.TAU,
          vr: (Math.random() - 0.5) * 10,
          ch: o.chars ? U.pick(o.chars) : undefined,
          splat: o.splat,
        });
      }
    }

    text(x, y, s, o = {}) {
      this.add({ type: 'text', x, y, z: o.z || 30, vz: o.vz != null ? o.vz : 50, grav: 0, text: s, life: o.life || 0.9, size: o.size || 22, color: o.color || G.C.red, wood: o.wood !== false });
    }

    ring(x, y, r, o = {}) {
      this.add({ type: 'ring', x, y, r0: o.r0 || 4, r1: r, life: o.life || 0.35, color: o.color, lw: o.lw || 4 });
    }

    dust(x, y, n = 4, o = {}) {
      for (let i = 0; i < n; i++) {
        this.add({
          type: 'dust', x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 60 + (o.vx || 0), vy: (Math.random() - 0.5) * 20 + (o.vy || 0),
          life: 0.4 + Math.random() * 0.3, size: (o.size || 5) * (0.7 + Math.random() * 0.6), grav: 0, z: 2,
        });
      }
    }

    decal(o) {
      o.age = 0;
      o.life = o.life || 8;
      this.decals.push(o);
      if (this.decals.length > 60) this.decals.shift();
    }

    splat(x, y, r = 12, color) {
      this.decal({ type: 'splat', x, y, r, seed: (Math.random() * 1000) | 0, color, life: 6 });
    }

    stampMark(x, y, text, o = {}) {
      this.decal({ type: 'stamp', x, y, text, rot: o.rot != null ? o.rot : (Math.random() - 0.5) * 0.5, size: o.size || 26, color: o.color || G.C.red, life: o.life || 3 });
    }

    update(dt) {
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.age += dt;
        if (p.age >= p.life) {
          if (p.splat && p.type === 'ink') this.splat(p.x, p.y, p.size * 1.5, p.color);
          this.parts.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.type === 'dust' || p.type === 'smoke') {
          p.vx *= 0.92;
          p.vy *= 0.92;
        }
        if (p.grav) {
          p.vz -= p.grav * dt;
          p.z += p.vz * dt;
          if (p.z < 0) {
            p.z = 0;
            if (p.type === 'ink' && p.splat) {
              this.splat(p.x, p.y, p.size * 1.5, p.color);
              p.age = p.life;
            }
            p.vz *= -0.3;
            p.vx *= 0.6;
            p.vy *= 0.6;
          }
        } else if (p.vz) {
          p.z += p.vz * dt;
        }
        p.rot += p.vr * dt;
      }
      for (let i = this.decals.length - 1; i >= 0; i--) {
        const d = this.decals[i];
        d.age += dt;
        if (d.age >= d.life) this.decals.splice(i, 1);
      }
    }

    drawDecals(ctx) {
      for (const d of this.decals) {
        const a = Math.min(1, (d.life - d.age) / 1.2);
        ctx.save();
        ctx.globalAlpha = a * (d.alpha || 0.85);
        if (d.type === 'splat') {
          Art.inkBlot(ctx, d.x, d.y, d.r, d.seed, d.color || G.Pal.ink, 5);
        } else if (d.type === 'stamp') {
          ctx.translate(d.x, d.y);
          ctx.rotate(d.rot);
          const s = d.age < 0.08 ? 1.6 - d.age * 7 : 1;
          ctx.scale(s, s);
          ctx.strokeStyle = d.color;
          ctx.lineWidth = 3;
          ctx.font = G.font(d.size, 'title');
          const w = ctx.measureText(d.text).width + 18;
          ctx.strokeRect(-w / 2, -d.size * 0.72, w, d.size * 1.3);
          ctx.fillStyle = d.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(d.text, 0, 0);
        } else if (d.type === 'scorch') {
          ctx.fillStyle = G.Pal.ink;
          Art.blob(ctx, d.x, d.y, d.r, d.r * 0.6, 7, 0.3, d.seed || 3);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    draw(ctx) {
      const ink = G.Pal.ink;
      const pap = G.Pal.paper;
      for (const p of this.parts) {
        const k = p.age / p.life;
        const x = p.x, y = p.y - p.z;
        ctx.save();
        switch (p.type) {
          case 'ink':
            SP.dot(ctx, x, y, p.size * (1 - k * 0.3), p.color || ink);
            break;
          case 'spark':
            ctx.translate(x, y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color || pap;
            Art.star(ctx, 0, 0, p.size * (1 - k), p.size * 0.35 * (1 - k), 4);
            ctx.fill();
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1;
            ctx.stroke();
            break;
          case 'dust':
            ctx.globalAlpha = (1 - k) * 0.6;
            SP.dot(ctx, x, y, p.size * (1 + k * 1.5), G.Pal.paperDark || pap, ink, 0.8);
            break;
          case 'smoke':
            ctx.globalAlpha = (1 - k) * 0.5;
            SP.dot(ctx, x, y, p.size * (1 + k * 2), p.color || '#8a8070');
            break;
          case 'ring':
            ctx.globalAlpha = 1 - k;
            ctx.strokeStyle = p.color || ink;
            ctx.lineWidth = p.lw * (1 - k) + 1;
            ctx.beginPath();
            ctx.ellipse(x, y, U.lerp(p.r0, p.r1, U.ease.outCubic(k)), U.lerp(p.r0, p.r1, U.ease.outCubic(k)) * 0.62, 0, 0, U.TAU);
            ctx.stroke();
            break;
          case 'text': {
            const s = k < 0.15 ? 0.6 + (k / 0.15) * 0.6 : 1.2 - (k - 0.15) * 0.25;
            ctx.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
            ctx.translate(x, y);
            ctx.scale(s, s);
            if (p.wood) {
              Art.drawWood(ctx, p.text, 0, 0, p.size, p.color || G.C.red, { red: G.C.ink });
            } else {
              Art.text(ctx, p.text, 0, 0, { size: p.size, font: 'title', color: p.color, align: 'center', base: 'middle', outline: G.C.paperLight, ow: 4 });
            }
            break;
          }
          case 'letter':
            ctx.globalAlpha = 1 - k;
            ctx.translate(x, y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color || ink;
            ctx.font = G.font(p.size * 4, 'title');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.ch || 'A', 0, 0);
            break;
          case 'confetti':
            ctx.translate(x, y);
            ctx.rotate(p.rot);
            ctx.scale(1, Math.cos(p.age * 9));
            ctx.fillStyle = p.color || G.C.red;
            ctx.fillRect(-p.size, -p.size * 0.6, p.size * 2, p.size * 1.2);
            break;
          case 'paper':
            ctx.globalAlpha = 1 - k * k;
            ctx.translate(x, y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color || '#f3ead6';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1;
            ctx.fillRect(-p.size, -p.size * 0.7, p.size * 2, p.size * 1.4);
            ctx.strokeRect(-p.size, -p.size * 0.7, p.size * 2, p.size * 1.4);
            break;
          case 'glow':
            ctx.globalAlpha = (1 - k) * 0.9;
            ctx.fillStyle = p.color || '#ffd27a';
            ctx.beginPath();
            ctx.arc(x, y, p.size * (1 - k * 0.5), 0, U.TAU);
            ctx.fill();
            break;
          case 'flame':
            ctx.globalAlpha = 1 - k;
            Art.flame(ctx, x, y, p.size * (1 - k * 0.5), G.time + p.rot);
            break;
          default:
            break;
        }
        ctx.restore();
      }
    }
  }
  G.FX = FX;

  // onomatopeias de xilogravura
  G.ONO = {
    hit: ['PÁ!', 'TÁ!', 'ZÁS!', 'PLAFT!'],
    big: ['CATAPLÁ!', 'BUM!', 'TÓIN!', 'CRÁS!'],
    stamp: ['PÁ!', 'TUM!', 'CARIMBADO!', 'BAM!'],
    ink: ['SPLOC!', 'PLOFT!', 'GLUB!'],
  };
})();
