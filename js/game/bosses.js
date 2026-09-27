/* PELEJA — chefes: Capitão Mandacaru, Dona Renda, Coronel Papelão & Prensa-Mor, A Traça */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Au = G.Audio;
  const E = G.Ent;
  const Enemy = E.Enemy;
  const Projectile = E.Projectile;
  const T = G.TILE;

  class Boss extends Enemy {
    constructor(o) {
      super(o);
      this.boss = true;
      this.active = false;
      this.heavy = true;
      this.defeated = false;
      this.phaseN = 1;
      this.atkQ = [];
      this.nextT = 1.2;
      this.lootR = [0, 0];
    }
    get hpFrac() {
      return U.clamp(this.hp / this.maxHp, 0, 1);
    }
    die(W) {
      if (this.defeated) return;
      this.defeated = true;
      this.hp = 0;
      this.state = 'defeated';
      this.kx = this.ky = 0;
      Au.sfx('boom');
      W.shake(10, 0.6);
      W.hitstop(0.25);
      W.fx.burst(this.x, this.y - this.hy, 30, { type: 'ink', speed: 260, size: 5, splat: true });
      W.onBossDefeated(this);
    }
    update(dt, W) {
      if (this.defeated) {
        this.baseUpdate(dt);
        return;
      }
      if (!this.active) {
        this.baseUpdate(dt);
        return;
      }
      super.update(dt, W);
    }
    pickAttack(list) {
      // evita repetir o mesmo ataque duas vezes seguidas
      let a;
      let tries = 0;
      do {
        a = U.pick(list);
        tries++;
      } while (a === this.lastAtk && tries < 5);
      this.lastAtk = a;
      return a;
    }
    arenaCenter(W) {
      return W.arena || { x: W.map.w * T / 2, y: W.map.h * T / 2, r: 300 };
    }
  }
  E.Boss = Boss;

  // pilar de cacto invocado
  class CactoPilar extends E.Ent {
    constructor(o) {
      super(o);
      this.kind = 'pilar';
      this.solid = true;
      this.cw = 30;
      this.ch = 18;
      this.life = o.life || 5;
      this.rise = 0;
      this.burst = o.burst;
    }
    update(dt, W) {
      this.baseUpdate(dt);
      this.rise = Math.min(1, this.rise + dt * 5);
      this.life -= dt;
      if (this.life <= 0) {
        this.dead = true;
        W.fx.burst(this.x, this.y - 30, 10, { type: 'ink', speed: 140, size: 3 });
        if (this.burst) {
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * U.TAU;
            W.add(new Projectile({ x: this.x, y: this.y - 4, vx: Math.cos(a) * 210, vy: Math.sin(a) * 210, z: 26, kind: 'espinho', range: 360 }));
          }
          Au.sfx('shoot', { p: 0.8 });
        }
      }
    }
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(1, this.rise);
      ctx.translate(-this.x, -this.y);
      G.Props.draw(ctx, { kind: 'mandacaru', x: this.x, y: this.y, v: 1 }, 0);
      ctx.restore();
      if (this.burst && this.life < 1 && Math.floor(this.life * 10) % 2 === 0) {
        ctx.save();
        ctx.strokeStyle = G.C.red;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 30, 12, 0, 0, U.TAU);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
  E.CactoPilar = CactoPilar;

  // ==================================================================
  // CAPITÃO MANDACARU
  // ==================================================================
  class Mandacaru extends Boss {
    constructor(o) {
      super(o);
      this.name = 'Capitão Mandacaru';
      this.maxHp = this.hp = Math.round(34 * G.diff().enemyHp);
      this.hr = 30;
      this.hy = 50;
      this.cw = 50;
      this.ch = 22;
      this.eh = 150;
      this.corrupt = true;
      this.dir = 'left';
    }
    ai(dt, W) {
      const p = W.player;
      const fast = this.phaseN === 2 ? 1.35 : 1;
      if (this.phaseN === 1 && this.hpFrac < 0.5) {
        this.phaseN = 2;
        this.setState('rage');
        Au.sfx('roar', { p: 1.3, dur: 1 });
        W.shake(8, 0.6);
        W.toast('O Capitão está furioso!', 2);
        return;
      }
      if (p) this.dir = p.x < this.x ? 'left' : 'right';
      switch (this.state) {
        case 'idle':
        case 'rage': {
          this.pose = 'idle';
          if (this.state === 'rage' && this.stT < 1) return;
          const d = this.dist(W);
          if (d > 140) {
            const a = this.angTo(W);
            W.moveEnt(this, Math.cos(a) * 60 * fast * dt, Math.sin(a) * 60 * fast * dt);
            this.moving = true;
            this.phase += dt * 6;
          } else this.moving = false;
          this.nextT -= dt;
          if (this.nextT <= 0) {
            this.moving = false;
            const a = this.pickAttack(this.phaseN === 1 ? ['thorns', 'charge', 'pillars', 'thorns'] : ['thorns', 'charge', 'pillars', 'burst', 'charge']);
            this.setState(a);
            this.vol = 0;
          }
          break;
        }
        case 'thorns': {
          this.pose = 'shoot';
          const n = this.phaseN === 1 ? 3 : 4;
          const iv = 0.5 / fast;
          if (this.stT > 0.4 + this.vol * iv && this.vol < n) {
            const a = this.angTo(W);
            const k = this.phaseN === 1 ? 5 : 7;
            for (let i = 0; i < k; i++) {
              const aa = a + (i - (k - 1) / 2) * 0.17;
              W.add(new Projectile({ x: this.x + Math.cos(a) * 30, y: this.y - 10, vx: Math.cos(aa) * 260, vy: Math.sin(aa) * 260, z: 40, kind: 'espinho', range: 600 }));
            }
            Au.sfx('shoot', { p: 0.9 });
            this.vol++;
          }
          if (this.stT > 0.4 + n * iv + 0.5) this.endAttack(1.4);
          break;
        }
        case 'charge': {
          this.pose = 'idle';
          if (this.stT < 0.05) {
            this.chA = this.angTo(W);
            Au.sfx('charge', { dur: 0.8 });
          }
          if (this.stT < 0.8) {
            this.chA = U.lerp(this.chA, this.angTo(W), dt * 2);
            this.shakeX = Math.sin(this.t * 60) * 2;
            if (Math.random() < 0.3) W.fx.dust(this.x, this.y, 1, { size: 6 });
          } else {
            this.shakeX = 0;
            const sp = 480 * fast;
            this.moving = true;
            this.phase += dt * 18;
            const ok = W.moveEnt(this, Math.cos(this.chA) * sp * dt, Math.sin(this.chA) * sp * dt);
            if (Math.random() < 0.6) W.fx.dust(this.x, this.y, 1, { size: 8 });
            if (!ok || this.stT > 2.2) {
              this.moving = false;
              if (!ok) {
                Au.sfx('boom', { vol: 0.8 });
                W.shake(9, 0.4);
                W.fx.burst(this.x + Math.cos(this.chA) * 30, this.y - 30, 12, { type: 'spark', size: 6, speed: 150, grav: 0 });
                W.fx.text(this.x, this.y - 120, 'TÓIN!', { size: 26 });
                this.setState('stun');
              } else this.endAttack(1);
            }
          }
          break;
        }
        case 'stun':
          this.pose = 'stun';
          if (this.stT > 2 / fast) {
            this.pose = 'idle';
            this.endAttack(0.8);
          }
          break;
        case 'pillars': {
          this.pose = 'summon';
          if (this.stT < 0.05) {
            Au.sfx('rumble', { dur: 1 });
            W.shake(4, 0.8);
            const n = this.phaseN === 1 ? 4 : 6;
            for (let i = 0; i < n; i++) {
              const a = (i / n) * U.TAU + Math.random() * 0.5;
              const r = 90 + Math.random() * 110;
              let px = p.x + Math.cos(a) * r, py = p.y + Math.sin(a) * r * 0.7;
              if (i === 0) {
                px = p.x;
                py = p.y;
              }
              if (W.solidAt(px, py)) continue;
              const burst = this.phaseN === 2;
              W.add(new E.Telegraph({
                x: px, y: py, r: 30, delay: 1, dmg: 1,
                onBoom: (W2, tg) => {
                  W2.add(new CactoPilar({ x: tg.x, y: tg.y, life: burst ? 3.2 : 5, burst }));
                  W2.fx.dust(tg.x, tg.y, 5, { size: 6 });
                  Au.sfx('thud');
                },
              }));
            }
          }
          if (this.stT > 1.6) this.endAttack(1.2);
          break;
        }
        case 'burst': {
          this.pose = 'summon';
          if (this.stT > 0.6 && !this.bursted) {
            this.bursted = true;
            for (let ring = 0; ring < 2; ring++) {
              for (let i = 0; i < 14; i++) {
                const a = (i / 14) * U.TAU + ring * 0.22;
                W.add(new Projectile({ x: this.x, y: this.y - 10, vx: Math.cos(a) * (170 + ring * 60), vy: Math.sin(a) * (170 + ring * 60), z: 40, kind: 'espinho', range: 520 }));
              }
            }
            Au.sfx('shoot', { p: 0.7 });
            W.shake(5, 0.3);
          }
          if (this.stT > 1.4) {
            this.bursted = false;
            this.endAttack(1.3);
          }
          break;
        }
        default:
          break;
      }
    }
    endAttack(wait) {
      this.nextT = wait / (this.phaseN === 2 ? 1.3 : 1);
      this.setState('idle');
    }
    hurt(W, dmg, fx, fy, kb) {
      const bonus = this.state === 'stun' ? 1 : 0;
      return super.hurt(W, dmg + bonus, fx, fy, kb * 0.3);
    }
    draw(ctx) {
      G.Creatures.mandacaru(ctx, {
        x: this.x + (this.shakeX || 0), y: this.y, t: this.t, dir: this.dir, moving: this.moving, phase: this.phase,
        pose: this.defeated ? (this.freed ? 'bloom' : 'kneel') : this.pose, corrupt: this.corrupt && !this.freed, _flash: E.flashColor(this), talking: this.talking,
      });
      if (this.state === 'charge' && this.stT < 0.8 && this.chA != null) {
        ctx.save();
        ctx.strokeStyle = G.C.red;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 30;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 10);
        ctx.lineTo(this.x + Math.cos(this.chA) * 400, this.y - 10 + Math.sin(this.chA) * 400);
        ctx.stroke();
        ctx.restore();
      }
      this.drawEmote(ctx);
    }
  }

  // ==================================================================
  // DONA RENDA
  // ==================================================================
  class BilroShield extends E.Ent {
    constructor(o) {
      super(o);
      this.kind = 'bilro';
      this.hr = 12;
      this.hy = 0;
    }
    draw(ctx) {
      const ink = G.Pal.ink;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = this.flash > 0 ? G.Pal.paper : G.C.gold;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -6, 5, 11, 0, 0, U.TAU);
      ctx.fill();
      ctx.stroke();
      G.Sprites.dot(ctx, 0, 8, 5, ctx.fillStyle, ink, 2);
      ctx.restore();
    }
  }

  class Renda extends Boss {
    constructor(o) {
      super(o);
      this.name = 'Dona Renda, a Rendeira das Mil Agulhas';
      this.maxHp = this.hp = Math.round(30 * G.diff().enemyHp);
      this.hr = 40;
      this.hy = 60;
      this.cw = 90;
      this.ch = 30;
      this.eh = 160;
      this.corrupt = true;
      this.lift = 30;
      this.shield = [];
      this.cycle = 0;
      this.flying = true;
    }
    makeShield() {
      this.shield = [];
      for (let i = 0; i < 6; i++) this.shield.push({ a: (i / 6) * U.TAU, hp: 1, flash: 0 });
      this.cycle++;
    }
    canBeHit() {
      return this.state === 'dazed' && super.canBeHit();
    }
    // chamado pelo mundo para cada golpe na área do chefe
    hitShield(W, x, y, dmg) {
      for (const b of this.shield) {
        if (b.hp <= 0) continue;
        const bx = this.x + Math.cos(b.a) * 78, by = this.y - 40 + Math.sin(b.a) * 44;
        if (U.dist(x, y, bx, by) < 24) {
          b.hp -= dmg;
          b.flash = 0.2;
          if (b.hp <= 0) {
            Au.sfx('shield');
            W.fx.burst(bx, by, 8, { type: 'spark', size: 6, speed: 150, grav: 0 });
            W.fx.text(bx, by - 10, 'TIN!', { size: 16 });
            if (this.shield.every((s) => s.hp <= 0)) {
              this.setState('dazed');
              Au.sfx('roar', { p: 1.6, dur: 0.6 });
              W.toast('Ela está tonta! Agora, o chicote!', 2);
            }
          }
          return true;
        }
      }
      return false;
    }
    ai(dt, W) {
      const p = W.player;
      const A = this.arenaCenter(W);
      const sp = 1 + (this.cycle - 1) * 0.2;
      for (const b of this.shield) {
        b.a += dt * (1.2 + this.cycle * 0.25);
        if (b.flash > 0) b.flash -= dt;
      }
      if (!this.shield.length) this.makeShield();
      switch (this.state) {
        case 'idle': {
          this.pose = 'weave';
          this.lift = U.lerp(this.lift, 30, dt * 3);
          const tx = A.x + Math.sin(this.t * 0.5) * 180, ty = A.y - 110 + Math.cos(this.t * 0.7) * 30;
          this.x += (tx - this.x) * dt * 0.8;
          this.y += (ty - this.y) * dt * 0.8;
          this.moving = true;
          this.phase += dt * 5;
          this.nextT -= dt;
          if (this.nextT <= 0) this.setState(this.pickAttack(this.cycle >= 2 ? ['agulhas', 'ponto', 'novelo', 'ponto', 'agulhas'] : ['agulhas', 'ponto', 'agulhas', 'novelo']));
          break;
        }
        case 'agulhas': {
          this.pose = 'throw';
          const n = 3 + this.cycle;
          const k = Math.floor((this.stT - 0.3) / (0.38 / sp));
          if (k >= 0 && k < n && k !== this.lastK) {
            this.lastK = k;
            const a = this.angTo(W) + (Math.random() - 0.5) * 0.1;
            W.add(new Projectile({ x: this.x, y: this.y - 20, vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, z: 50, kind: 'agulha', range: 800 }));
            Au.sfx('shoot', { p: 1.6 });
          }
          if (this.stT > 0.3 + n * (0.38 / sp) + 0.4) {
            this.lastK = -1;
            this.endAttack(1.3);
          }
          break;
        }
        case 'ponto': {
          this.pose = 'weave';
          if (this.stT < 0.02) {
            const horiz = this.cycle >= 3 ? true : Math.random() < 0.5;
            const both = this.cycle >= 2 && Math.random() < 0.6;
            const mk = (h) => {
              const gapC = h ? U.clamp(p.x + (Math.random() - 0.5) * 200, A.x - A.r + 80, A.x + A.r - 80) : U.clamp(p.y + (Math.random() - 0.5) * 140, A.y - A.r * 0.6 + 60, A.y + A.r * 0.6 - 30);
              const pos = h ? U.clamp(p.y, A.y - A.r * 0.6, A.y + A.r * 0.6) : U.clamp(p.x, A.x - A.r, A.x + A.r);
              W.add(new LaceBeam({ horiz: h, pos, gapC, gap: 90, A, delay: 1.1 / sp }));
            };
            mk(horiz);
            if (both) mk(!horiz);
            Au.sfx('charge', { dur: 1 });
          }
          if (this.stT > 1.9) this.endAttack(1);
          break;
        }
        case 'novelo': {
          this.pose = 'throw';
          if (this.stT > 0.4 && !this.sent) {
            this.sent = true;
            const n = W.ents.filter((e) => e.type === 'novelo' && !e.dead).length;
            if (n < 3) {
              const nv = G.Enemies.create({ kind: 'novelo', x: this.x, y: this.y + 20, hp: 5, aggro: 900 });
              nv.size = 1.6;
              nv.hr = 20;
              nv.hy = 18;
              nv.lootR = [0, 1];
              W.add(nv);
              Au.sfx('paper');
            }
          }
          if (this.stT > 1) {
            this.sent = false;
            this.endAttack(1.2);
          }
          break;
        }
        case 'dazed':
          this.pose = 'dazed';
          this.lift = U.lerp(this.lift, 0, dt * 6);
          this.moving = false;
          if (this.stT > 4.8) {
            this.makeShield();
            Au.sfx('bell');
            this.endAttack(1);
          }
          break;
        default:
          break;
      }
      this.hy = 60 + this.lift;
    }
    endAttack(w) {
      this.nextT = w;
      this.setState('idle');
    }
    harmful() {
      return this.state !== 'dazed';
    }
    draw(ctx) {
      G.Creatures.renda(ctx, { x: this.x, y: this.y, t: this.t, lift: this.lift, pose: this.defeated ? 'dazed' : this.pose, moving: this.moving, phase: this.phase, corrupt: this.corrupt && !this.freed, _flash: E.flashColor(this), talking: this.talking });
      if (!this.defeated) {
        for (const b of this.shield) {
          if (b.hp <= 0) continue;
          const bx = this.x + Math.cos(b.a) * 78, by = this.y - 40 + Math.sin(b.a) * 44;
          ctx.save();
          ctx.strokeStyle = 'rgba(251,246,234,0.6)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y - 80);
          ctx.lineTo(bx, by);
          ctx.stroke();
          ctx.restore();
          BilroShield.prototype.draw.call({ x: bx, y: by, flash: b.flash }, ctx);
        }
        if (this.state === 'dazed') G.Enemies.drawDizzy(ctx, this.x, this.y - 150, this.t);
      }
      this.drawEmote(ctx);
    }
  }

  // feixe de ponto-cruz
  class LaceBeam extends E.Ent {
    constructor(o) {
      super(o);
      this.kind = 'hazard';
      this.age = 0;
      this.active = 0.45;
    }
    sortY() {
      return -1e6;
    }
    update(dt, W) {
      this.baseUpdate(dt);
      this.age += dt;
      const A = this.A;
      if (this.age > this.delay && this.age < this.delay + this.active) {
        if (!this.sfx) {
          this.sfx = true;
          Au.sfx('whip', { p: 0.6 });
          W.shake(3, 0.2);
        }
        const p = W.player;
        if (p && p.state !== 'dodge') {
          const onLine = this.horiz ? Math.abs(p.y - this.pos) < 22 : Math.abs(p.x - this.pos) < 22;
          const inGap = this.horiz ? Math.abs(p.x - this.gapC) < this.gap / 2 : Math.abs(p.y - this.gapC) < this.gap / 2;
          if (onLine && !inGap) W.hurtPlayer(1, this.horiz ? p.x : this.pos - 10, this.horiz ? this.pos - 10 : p.y);
        }
      }
      if (this.age > this.delay + this.active + 0.2) this.dead = true;
      void A;
    }
    draw(ctx) {
      const A = this.A;
      const pre = this.age < this.delay;
      const k = U.clamp(this.age / this.delay, 0, 1);
      ctx.save();
      const x0 = A.x - A.r - 60, x1 = A.x + A.r + 60, y0 = A.y - A.r, y1 = A.y + A.r;
      const segs = this.horiz ? [[x0, this.gapC - this.gap / 2], [this.gapC + this.gap / 2, x1]] : [[y0, this.gapC - this.gap / 2], [this.gapC + this.gap / 2, y1]];
      for (const [a, b] of segs) {
        if (pre) {
          ctx.strokeStyle = G.C.red;
          ctx.globalAlpha = 0.3 + k * 0.5;
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          if (this.horiz) {
            ctx.moveTo(a, this.pos - 20);
            ctx.lineTo(b, this.pos - 20);
            ctx.moveTo(a, this.pos + 20);
            ctx.lineTo(b, this.pos + 20);
          } else {
            ctx.moveTo(this.pos - 20, a);
            ctx.lineTo(this.pos - 20, b);
            ctx.moveTo(this.pos + 20, a);
            ctx.lineTo(this.pos + 20, b);
          }
          ctx.stroke();
        } else {
          ctx.globalAlpha = 1;
          ctx.setLineDash([]);
          // linha de renda (xis de ponto-cruz)
          ctx.strokeStyle = '#fbf6ea';
          ctx.lineWidth = 5;
          ctx.beginPath();
          const len = b - a;
          for (let i = 0; i < len; i += 20) {
            if (this.horiz) {
              ctx.moveTo(a + i, this.pos - 14);
              ctx.lineTo(a + i + 20, this.pos + 14);
              ctx.moveTo(a + i + 20, this.pos - 14);
              ctx.lineTo(a + i, this.pos + 14);
            } else {
              ctx.moveTo(this.pos - 14, a + i);
              ctx.lineTo(this.pos + 14, a + i + 20);
              ctx.moveTo(this.pos + 14, a + i);
              ctx.lineTo(this.pos - 14, a + i + 20);
            }
          }
          ctx.stroke();
          ctx.strokeStyle = G.C.red;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  // ==================================================================
  // CORONEL PAPELÃO & A PRENSA-MOR
  // ==================================================================
  class Prensa extends Boss {
    constructor(o) {
      super(o);
      this.name = 'A Prensa-Mor do Coronel';
      this.valves = [3, 3, 3].map((v) => Math.round(v * G.diff().enemyHp));
      this.valveMax = this.valves[0];
      this.maxHp = this.hp = this.valves.reduce((a, b) => a + b, 0);
      this.hr = 70;
      this.hy = 70;
      this.cw = 150;
      this.ch = 40;
      this.eh = 220;
      this.exposed = 0;
      this.platen = 0;
      this.stage = 'machine';
      this.coronelHp = Math.round(12 * G.diff().enemyHp);
      this.coronelMax = this.coronelHp;
    }
    get hpFrac() {
      if (this.stage === 'machine') return 0.5 + 0.5 * (this.valves.reduce((a, b) => a + b, 0) / (this.valveMax * 3));
      return 0.5 * (this.coronelHp / this.coronelMax);
    }
    canBeHit() {
      return false;
    }
    valvePos(i) {
      return { x: this.x - 44 + i * 44, y: this.y - 48 };
    }
    hitValves(W, x, y, dmg, how) {
      if (this.stage !== 'machine') return false;
      for (let i = 0; i < 3; i++) {
        if (this.valves[i] <= 0) continue;
        const v = this.valvePos(i);
        if (U.dist(x, y, v.x, v.y) < (how === 'stamp' ? 120 : 34)) {
          if (!this.exposed) {
            Au.sfx('shield', { vol: 0.6 });
            W.fx.text(v.x, v.y - 20, 'TENC!', { size: 14, color: G.C.ink });
            return true;
          }
          this.valves[i] = Math.max(0, this.valves[i] - (how === 'stamp' ? this.valveMax : dmg));
          this.flash = 0.15;
          Au.sfx('bossHit');
          W.fx.burst(v.x, v.y, 10, { type: 'ink', color: G.C.red, speed: 180, size: 4 });
          if (this.valves[i] <= 0) {
            Au.sfx('boom');
            W.shake(8, 0.4);
            W.fx.burst(v.x, v.y, 18, { type: 'smoke', size: 8, speed: 80, grav: 0, life: 1 });
            W.fx.text(v.x, v.y - 30, 'PSSSHHH!', { size: 22 });
            this.exposed = 0;
            this.setState('idle');
            this.nextT = 1.5;
            if (this.valves.every((vv) => vv <= 0)) this.breakDown(W);
          }
          return true;
        }
      }
      return false;
    }
    breakDown(W) {
      this.stage = 'fall';
      this.setState('collapse');
      Au.sfx('boom');
      W.shake(12, 1);
      for (let i = 0; i < 40; i++) {
        W.fx.add({ type: 'confetti', x: this.x + (Math.random() - 0.5) * 140, y: this.y - 80, vx: (Math.random() - 0.5) * 300, vy: -Math.random() * 100, z: 60, vz: 200 + Math.random() * 200, grav: 300, life: 2, size: 4, color: U.pick([G.C.red, G.C.yellow, G.C.blue, G.C.paperLight]) });
      }
      W.toast('A Prensa-Mor quebrou! Pegue o Coronel!', 2.5);
    }
    ai(dt, W) {
      const p = W.player;
      const A = this.arenaCenter(W);
      if (this.stage === 'coronel') return this.coronelAI(dt, W);
      if (this.stage === 'fall') {
        if (this.stT > 1.6) {
          this.stage = 'coronel';
          this.cx = this.x;
          this.cy = this.y + 30;
          this.setState('run');
          Au.sfx('roar', { p: 2, dur: 0.5 });
        }
        return;
      }
      if (this.exposed > 0) {
        this.exposed -= dt;
        if (this.exposed <= 0) {
          this.setState('idle');
          this.nextT = 0.8;
        }
      }
      switch (this.state) {
        case 'idle': {
          const tx = U.clamp(p.x, A.x - A.r + 120, A.x + A.r - 120), ty = U.clamp(p.y - 150, A.y - A.r * 0.6 + 60, A.y + A.r * 0.3);
          const a = Math.atan2(ty - this.y, tx - this.x);
          if (U.dist(this.x, this.y, tx, ty) > 20) {
            W.moveEnt(this, Math.cos(a) * 55 * dt, Math.sin(a) * 55 * dt);
            this.moving = true;
            this.phase += dt * 4;
          } else this.moving = false;
          this.nextT -= dt;
          if (this.nextT <= 0 && !this.exposed) {
            this.moving = false;
            const broken = this.valves.filter((v) => v <= 0).length;
            this.setState(this.pickAttack(broken >= 1 ? ['stomp', 'confisca', 'avioes', 'stomp', 'confisca'] : ['stomp', 'confisca', 'avioes', 'stomp']));
          }
          break;
        }
        case 'stomp': {
          if (this.stT < 0.7) {
            this.lift = U.ease.outQuad(this.stT / 0.7) * 50;
          } else if (!this.landed) {
            this.landed = true;
            this.lift = 0;
            Au.sfx('stamp');
            Au.sfx('boom', { vol: 0.5 });
            W.shake(10, 0.4);
            W.add(new E.Shockwave({ x: this.x, y: this.y, maxR: 340, speed: 300, width: 18 }));
            const broken = this.valves.filter((v) => v <= 0).length;
            if (broken >= 2) W.add(new E.Shockwave({ x: this.x, y: this.y, maxR: 340, speed: 190, width: 18 }));
            this.exposed = 3;
            W.toast('As válvulas estão expostas!', 1.5);
          }
          if (this.stT > 1) {
            this.landed = false;
            this.setState('open');
          }
          break;
        }
        case 'open':
          this.spin = 3;
          if (this.exposed <= 0) {
            this.spin = 0.6;
            this.setState('idle');
            this.nextT = 1;
          }
          break;
        case 'confisca': {
          if (this.stT < 0.02) {
            Au.sfx('clank');
            const n = 4 + this.valves.filter((v) => v <= 0).length * 2;
            for (let i = 0; i < n; i++) {
              const px = i === 0 ? p.x : p.x + (Math.random() - 0.5) * 360, py = i === 0 ? p.y : p.y + (Math.random() - 0.5) * 240;
              if (W.solidAt(px, py)) continue;
              W.add(new E.Telegraph({
                x: px, y: py, shape: 'rect', w: 76, h: 54, delay: 1 + i * 0.12, dmg: 1,
                onBoom: (W2, tg) => {
                  Au.sfx('stamp', { vol: 0.6 });
                  W2.fx.stampMark(tg.x, tg.y, 'CONFISCADO', { size: 14, life: 2.5 });
                  W2.shake(3, 0.1);
                },
              }));
            }
          }
          if (this.stT > 2) this.endAttack(1.2);
          break;
        }
        case 'avioes': {
          const k = Math.floor((this.stT - 0.3) / 0.45);
          if (k >= 0 && k < 3 && k !== this.lastK) {
            this.lastK = k;
            const a = this.angTo(W) + (k - 1) * 0.5;
            W.add(new Projectile({ x: this.x, y: this.y - 120, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, z: 60, kind: 'aviao', range: 1000, turn: 1.5, life: 4.5 }));
            Au.sfx('paper');
          }
          if (this.stT > 1.8) {
            this.lastK = -1;
            this.endAttack(1);
          }
          break;
        }
        default:
          break;
      }
    }
    coronelAI(dt, W) {
      const p = W.player;
      const A = this.arenaCenter(W);
      this.ct = (this.ct || 0) + dt;
      if (this.cflash > 0) this.cflash -= dt;
      if (this.cinv > 0) this.cinv -= dt;
      // corre em pânico, fugindo
      const a = Math.atan2(this.cy - p.y, this.cx - p.x) + Math.sin(this.ct * 1.3) * 1.2;
      let nx = this.cx + Math.cos(a) * 150 * dt, ny = this.cy + Math.sin(a) * 150 * dt;
      if (U.dist(nx, ny, A.x, A.y) > A.r * 0.8) {
        const b = Math.atan2(A.y - ny, A.x - nx);
        nx += Math.cos(b) * 200 * dt;
        ny += Math.sin(b) * 200 * dt;
      }
      if (!W.solidAt(nx, ny)) {
        this.cx = nx;
        this.cy = ny;
      }
      this.cdir = Math.cos(a) < 0 ? 'left' : 'right';
      this.cphase = (this.cphase || 0) + dt * 14;
      this.throwT = (this.throwT || 2) - dt;
      if (this.throwT <= 0) {
        this.throwT = 2.2;
        const aa = Math.atan2(p.y - this.cy, p.x - this.cx);
        W.add(new Projectile({ x: this.cx, y: this.cy - 30, vx: Math.cos(aa) * 200, vy: Math.sin(aa) * 200, z: 40, kind: 'aviao', range: 800, turn: 1.2, life: 3.5 }));
        Au.sfx('paper');
      }
      this.sumT = (this.sumT || 5) - dt;
      if (this.sumT <= 0) {
        this.sumT = 9;
        const cnt = W.ents.filter((e) => e.type === 'jagunco' && !e.dead).length;
        if (cnt < 2) {
          for (const s of [-1, 1]) W.add(G.Enemies.create({ kind: 'jagunco', x: A.x + s * A.r * 0.7, y: A.y, spawnT: 0.6, aggro: 900 }));
          W.toast('"Jagunços! Me acudam!"', 1.6);
        }
      }
      // contato com a jogadora não fere (ele só corre)
    }
    hitCoronel(W, x, y, dmg) {
      if (this.stage !== 'coronel' || this.cinv > 0) return false;
      if (U.dist(x, y, this.cx, this.cy - 30) > 36) return false;
      this.coronelHp -= dmg;
      this.cflash = 0.2;
      this.cinv = 0.2;
      Au.sfx('hit');
      W.fx.burst(this.cx, this.cy - 30, 8, { type: 'paper', size: 4, speed: 160 });
      W.fx.text(this.cx, this.cy - 80, U.pick(['AI!', 'UI!', 'VALEI-ME!', 'SOCORRO!']), { size: 18 });
      const aa = Math.atan2(this.cy - y, this.cx - x);
      this.cx += Math.cos(aa) * 30;
      this.cy += Math.sin(aa) * 20;
      if (this.coronelHp <= 0) {
        this.hp = 0;
        this.die(W);
      }
      return true;
    }
    harmful() {
      return this.stage === 'machine';
    }
    endAttack(w) {
      this.nextT = w;
      this.setState('idle');
    }
    draw(ctx) {
      const machineAlive = this.stage === 'machine' || (this.stage === 'fall' && this.stT < 0.8);
      if (this.stage === 'machine' || this.stage === 'fall') {
        ctx.save();
        if (this.stage === 'fall') {
          ctx.translate(this.x, this.y);
          ctx.rotate(Math.min(0.25, this.stT * 0.2));
          ctx.translate(-this.x, -this.y);
          ctx.globalAlpha = machineAlive ? 1 : Math.max(0, 1 - (this.stT - 0.8));
        }
        G.Creatures.prensa(ctx, {
          x: this.x, y: this.y - (this.lift || 0), t: this.t, moving: this.moving, phase: this.phase, valves: this.valves.map((v) => v > 0),
          exposed: this.exposed > 0, spin: this.spin || 0.6, platen: this.platen, _flash: E.flashColor(this), seated: this.stage === 'machine', talking: this.talking,
        });
        ctx.restore();
        if (this.exposed > 0) {
          for (let i = 0; i < 3; i++) {
            if (this.valves[i] <= 0) continue;
            const v = this.valvePos(i);
            ctx.save();
            ctx.strokeStyle = G.C.red;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5 + Math.sin(this.t * 12) * 0.5;
            ctx.beginPath();
            ctx.arc(v.x, v.y, 20, 0, U.TAU);
            ctx.stroke();
            ctx.restore();
          }
        }
      } else {
        G.Creatures.prensa(ctx, { x: this.x, y: this.y, t: 0, valves: [false, false, false], seated: false, spin: 0 });
        ctx.save();
        ctx.fillStyle = G.Pal.ink;
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 3; i++) {
          const k = (this.t * 0.5 + i / 3) % 1;
          G.Sprites.dot(ctx, this.x - 40 + i * 40, this.y - 100 - k * 60, 8 + k * 14, '#6a6258');
        }
        ctx.restore();
      }
      if (this.stage === 'coronel' || this.defeated) {
        G.Creatures.coronel(ctx, { x: this.cx, y: this.cy, t: this.t, dir: this.cdir, moving: !this.defeated, phase: this.cphase, panic: true, _flash: this.cflash > 0 ? G.Pal.paper : null, talking: this.talking });
      }
      this.drawEmote(ctx);
    }
    get cxs() {
      return this.cx;
    }
  }

  // ==================================================================
  // A TRAÇA
  // ==================================================================
  class Traca extends Boss {
    constructor(o) {
      super(o);
      this.name = 'A Traça que Comeu o Sol';
      this.maxHp = this.hp = Math.round(54 * G.diff().enemyHp);
      this.hr = 46;
      this.hy = 40;
      this.cw = 60;
      this.ch = 20;
      this.eh = 200;
      this.flying = true;
      this.alt = 120;
      this.contact = 1;
    }
    canBeHit() {
      return this.alt < 50 && super.canBeHit();
    }
    harmful() {
      return this.alt < 40 && this.state !== 'eat' && this.state !== 'spiral';
    }
    ai(dt, W) {
      const p = W.player;
      const A = this.arenaCenter(W);
      const newPhase = this.hpFrac < 0.33 ? 3 : this.hpFrac < 0.66 ? 2 : 1;
      if (newPhase > this.phaseN) {
        this.phaseN = newPhase;
        Au.sfx('roar', { p: 0.6, dur: 1.4 });
        Au.sfx('wings', { dur: 1.2 });
        W.shake(8, 0.8);
        W.toast(newPhase === 2 ? 'As letras fogem das asas dela!' : 'A Traça está desesperada!', 2);
        this.setState('rise');
      }
      const fast = 1 + (this.phaseN - 1) * 0.25;
      this.wingT = (this.wingT || 0) - dt;
      if (this.wingT <= 0 && this.alt > 40) {
        this.wingT = 1.2;
        Au.sfx('wings', { dur: 0.7, vol: 0.5 });
      }
      switch (this.state) {
        case 'idle':
        case 'rise': {
          this.pose = 'fly';
          this.alt = U.lerp(this.alt, 130, dt * 2);
          this.orb = (this.orb || 0) + dt * 0.7 * fast;
          const tx = A.x + Math.cos(this.orb) * A.r * 0.55, ty = A.y + Math.sin(this.orb) * A.r * 0.3;
          this.x += (tx - this.x) * dt * 1.5;
          this.y += (ty - this.y) * dt * 1.5;
          this.nextT -= dt;
          if (this.nextT <= 0 && this.alt > 100) {
            const opts = ['dive', 'dive'];
            if (this.phaseN >= 2) opts.push('letras', 'tinta');
            if (this.phaseN >= 3) opts.push('spiral');
            this.setState(this.pickAttack(opts));
          }
          break;
        }
        case 'dive': {
          this.pose = 'fly';
          if (this.stT < 0.02) {
            this.from = { x: this.x, y: this.y };
            const a = Math.atan2(p.y - this.y, p.x - this.x);
            this.to = { x: p.x + Math.cos(a) * 160, y: p.y + Math.sin(a) * 100 };
            Au.sfx('charge', { dur: 0.9 });
          }
          if (this.stT < 0.9 / fast) {
            this.alt = U.lerp(this.alt, 90, dt * 3);
          } else {
            const k = U.clamp((this.stT - 0.9 / fast) / (0.9 / fast), 0, 1);
            this.x = U.lerp(this.from.x, this.to.x, U.ease.inOut(k));
            this.y = U.lerp(this.from.y, this.to.y, U.ease.inOut(k));
            this.alt = 90 - Math.sin(k * Math.PI) * 75;
            if (k >= 1) this.setState('land');
          }
          break;
        }
        case 'land': {
          this.pose = 'land';
          this.alt = U.lerp(this.alt, 0, dt * 6);
          if (this.stT > 0.5) {
            this.setState('eat');
            this.bites = 0;
          }
          break;
        }
        case 'eat': {
          this.pose = 'eat';
          this.alt = 0;
          const dur = this.phaseN === 3 ? 2.4 : 3.2;
          const bi = Math.floor(this.stT / 0.7);
          if (bi > this.bites) {
            this.bites = bi;
            Au.sfx('chomp');
            W.eatFloor && W.eatFloor(this.x, this.y + 10, 1 + (this.phaseN >= 2 ? 1 : 0), this);
          }
          if (this.stT > dur) {
            this.setState('rise');
            this.nextT = 1.2 / fast;
            Au.sfx('wings', { dur: 1 });
          }
          break;
        }
        case 'letras': {
          this.pose = 'fly';
          if (this.stT > 0.5 && !this.sent) {
            this.sent = true;
            const cnt = W.ents.filter((e) => e.type === 'letra' && !e.dead).length;
            const n = Math.max(0, 6 - cnt);
            for (let i = 0; i < n; i++) {
              const l = G.Enemies.create({ kind: 'letra', x: this.x + (Math.random() - 0.5) * 120, y: this.y + (Math.random() - 0.5) * 60, aggro: 900 });
              l.invul = 0.3;
              W.add(l);
            }
            Au.sfx('paper');
          }
          if (this.stT > 1.3) {
            this.sent = false;
            this.setState('idle');
            this.nextT = 1.4;
          }
          break;
        }
        case 'tinta': {
          this.pose = 'fly';
          const k = Math.floor(this.stT / 0.5);
          if (k < 3 && k !== this.lastK && this.stT > 0.3) {
            this.lastK = k;
            for (let i = 0; i < 6; i++) {
              const tx = p.x + (Math.random() - 0.5) * 300, ty = p.y + (Math.random() - 0.5) * 200;
              const tt = 1;
              W.add(new Projectile({ x: this.x, y: this.y, vx: (tx - this.x) / tt, vy: (ty - this.y) / tt, z: this.alt, vz: 350 - this.alt * 0.5, kind: 'tinta', range: 2000 }));
            }
            Au.sfx('splat', { vol: 0.6 });
          }
          if (this.stT > 1.8) {
            this.lastK = -1;
            this.setState('idle');
            this.nextT = 1.2;
          }
          break;
        }
        case 'spiral': {
          this.pose = 'land';
          if (this.stT < 0.8) {
            this.x += (A.x - this.x) * dt * 3;
            this.y += (A.y - this.y) * dt * 3;
            this.alt = U.lerp(this.alt, 30, dt * 4);
          } else {
            this.spA = (this.spA || 0) + dt * 2.6;
            this.shT = (this.shT || 0) - dt;
            if (this.shT <= 0) {
              this.shT = 0.11;
              for (let arm = 0; arm < 3; arm++) {
                const a = this.spA + (arm * U.TAU) / 3;
                const pr = new Projectile({ x: this.x, y: this.y, vx: Math.cos(a) * 180, vy: Math.sin(a) * 120, z: 30, kind: 'letraP', range: 700, ghost: true });
                pr.ch = U.pick('LUZIASOLFIM'.split(''));
                pr.color = G.C.ink;
                W.add(pr);
              }
            }
            if (this.stT > 4.4) {
              this.setState('rise');
              this.nextT = 1.2;
            }
          }
          break;
        }
        default:
          break;
      }
      this.hy = 40 + this.alt;
    }
    draw(ctx) {
      if (this.state === 'dive' && this.stT < 0.9 && this.to) {
        ctx.save();
        ctx.strokeStyle = G.C.red;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 50;
        ctx.setLineDash([16, 12]);
        ctx.beginPath();
        ctx.moveTo(this.from.x, this.from.y);
        ctx.lineTo(this.to.x, this.to.y);
        ctx.stroke();
        ctx.restore();
      }
      G.Creatures.traca(ctx, { x: this.x, y: this.y, t: this.t, alt: this.alt, pose: this.defeated ? 'calm' : this.pose, _flash: E.flashColor(this), lookX: W_lookX(this), scale: 0.95 });
      this.drawEmote(ctx);
    }
  }
  function W_lookX(b) {
    return Math.sin(b.t * 0.7) * 2;
  }

  G.Bosses = { mandacaru: Mandacaru, renda: Renda, prensa: Prensa, traca: Traca };
})();
