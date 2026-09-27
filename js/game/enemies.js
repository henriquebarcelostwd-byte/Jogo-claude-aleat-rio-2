/* PELEJA — inimigos comuns */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Au = G.Audio;
  const E = G.Ent;
  const Ent = E.Ent;
  const Projectile = E.Projectile;

  const INFO = (G.ENEMY_INFO = {
    borrao: { name: 'Borrão', hp: 3, desc: 'Mancha de tinta que pingou do buraco do sol. Pula em cima de quem tem luz.' },
    calango: { name: 'Calango-Tipo', hp: 4, desc: 'Lagarto feito de tipos de chumbo. Só anda em linha reta — como toda frase mal escrita.' },
    urubu: { name: 'Urubu de Papel', hp: 3, desc: 'Dobradura de jornal velho. Rodeia, grita e mergulha.' },
    mandacaruzinho: { name: 'Mandacaruzinho', hp: 5, desc: 'Filhote do Capitão. Não sai do lugar, mas cospe espinho longe.' },
    novelo: { name: 'Novelo', hp: 4, desc: 'Linha embolada que rola atrás de quem passa. Ricocheteia nas paredes.' },
    agulheira: { name: 'Agulheira', hp: 2, desc: 'Vespa-agulha da Dona Renda. Mira, espera… e fura.' },
    peixe: { name: 'Peixe-Tinta', hp: 2, desc: 'Mora no açude e cospe bolas de tinta. Só dá pra acertar quando ele sobe.' },
    carimbo: { name: 'Soldado-Carimbo', hp: 6, desc: 'Guarda do Coronel. Levanta o corpo e CONFISCA o chão à frente.' },
    jagunco: { name: 'Jagunço de Papelão', hp: 4, desc: 'Capanga de caixa. Prefere atirar aviãozinho de longe.' },
    rascunho: { name: 'Rascunho', hp: 3, desc: 'Folha amassada que o Poeta jogou fora. Quando desamassa, vira letra solta.' },
    letra: { name: 'Letra Solta', hp: 1, desc: 'Letra que fugiu da palavra. Sozinha é fraca; em bando, pica.' },
  });

  class Enemy extends Ent {
    constructor(o) {
      super(o);
      this.kind = 'enemy';
      this.type = o.kind;
      const info = INFO[this.type] || { hp: 3 };
      this.maxHp = Math.max(1, Math.round((o.hp || info.hp) * G.diff().enemyHp));
      this.hp = this.maxHp;
      this.contact = 1;
      this.stun = 0;
      this.state = 'idle';
      this.stT = 0;
      this.aggro = o.aggro || 280;
      this.home = { x: this.x, y: this.y };
      this.flying = false;
      this.hr = 14;
      this.hy = 14;
      this.cw = 22;
      this.ch = 12;
      this.eh = 50;
      this.lootR = [1, 3];
      this.seed = (Math.random() * 1000) | 0;
      this.look = Math.PI / 2;
      this.spawnT = o.spawnT || 0;
      this.invul = 0;
    }
    setState(s) {
      this.state = s;
      this.stT = 0;
    }
    tgt(W) {
      return this.target && !this.target.dead ? this.target : W.player;
    }
    dist(W) {
      const p = this.tgt(W);
      return p ? U.dist(this.x, this.y, p.x, p.y) : 1e9;
    }
    angTo(W) {
      const p = this.tgt(W);
      return p ? Math.atan2(p.y - this.y, p.x - this.x) : 0;
    }
    canBeHit() {
      return this.invul <= 0 && this.spawnT <= 0;
    }
    hurt(W, dmg, fx, fy, kb = 180) {
      if (!this.canBeHit() || this.dead) return false;
      this.hp -= dmg;
      this.flash = 0.18;
      const a = Math.atan2(this.y - fy, this.x - fx);
      const kbm = this.heavy ? 0.3 : 1;
      this.kx = Math.cos(a) * kb * kbm;
      this.ky = Math.sin(a) * kb * kbm;
      Au.sfx('hit', { p: 1 + Math.random() * 0.2 });
      W.fx.burst(this.x, this.y - this.hy, 6, { type: 'ink', speed: 160, size: 3, splat: Math.random() < 0.4 });
      W.fx.burst(this.x, this.y - this.hy, 3, { type: 'spark', speed: 120, size: 6, grav: 0, life: 0.25 });
      if (this.hp <= 0) this.die(W);
      else this.onHurt && this.onHurt(W);
      return true;
    }
    die(W) {
      if (this.dead) return;
      this.dead = true;
      Au.sfx('splat');
      W.fx.burst(this.x, this.y - this.hy, 12, { type: 'ink', speed: 200, size: 4, splat: true });
      if (Math.random() < 0.5) W.fx.text(this.x, this.y - 40, U.pick(G.ONO.ink), { size: 18 });
      W.onEnemyKilled(this);
    }
    update(dt, W) {
      this.baseUpdate(dt);
      if (this.spawnT > 0) {
        this.spawnT -= dt;
        return;
      }
      if (this.invul > 0) this.invul -= dt;
      if (Math.abs(this.kx) + Math.abs(this.ky) > 2) {
        if (this.flying) {
          this.x += this.kx * dt;
          this.y += this.ky * dt;
        } else W.moveEnt(this, this.kx * dt, this.ky * dt);
        this.kx *= Math.pow(0.004, dt);
        this.ky *= Math.pow(0.004, dt);
      }
      this.stT += dt;
      if (this.stun > 0) {
        this.stun -= dt;
        return;
      }
      if (W.locked()) return;
      this.ai(dt, W);
      // separação
      for (const o of W.ents) {
        if (o === this || o.kind !== 'enemy' || o.dead) continue;
        const d = U.dist(this.x, this.y, o.x, o.y);
        if (d < 24 && d > 0.01) {
          const push = (24 - d) * 3 * dt;
          if (this.flying) {
            this.x += ((this.x - o.x) / d) * push;
            this.y += ((this.y - o.y) / d) * push;
          } else W.moveEnt(this, ((this.x - o.x) / d) * push, ((this.y - o.y) / d) * push);
        }
      }
      // dano por contato
      if (this.contact && this.harmful(W) && W.player) {
        const p = W.player;
        if (U.dist(this.x, this.y - this.hy, p.x, p.y - 20) < this.hr + 12) W.hurtPlayer(this.contact, this.x, this.y);
      }
      this.look = this.angTo(W);
    }
    harmful() {
      return true;
    }
    ai() {}
    stDraw() {
      return { x: this.x, y: this.y, t: this.t, look: this.look, _flash: E.flashColor(this), seed: this.seed };
    }
    drawSpawn(ctx) {
      if (this.spawnT > 0) {
        const k = 1 - Math.min(1, this.spawnT / 0.6);
        ctx.save();
        ctx.fillStyle = G.Pal.ink;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 16 * k, 6 * k, 0, 0, U.TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
        G.Sprites.dot(ctx, this.x, this.y - 200 * (1 - k), 6, G.Pal.ink);
        ctx.restore();
        return true;
      }
      return false;
    }
  }
  E.Enemy = Enemy;

  // --- Borrão -----------------------------------------------------------------
  class Borrao extends Enemy {
    constructor(o) {
      super(o);
      this.hopT = Math.random();
      this.hop = 0;
      this.squash = 0;
    }
    ai(dt, W) {
      const d = this.dist(W);
      if (this.state === 'idle') {
        this.squash = Math.sin(this.t * 4) * 0.06;
        if (d < this.aggro) this.setState('wait');
      } else if (this.state === 'wait') {
        this.squash = U.lerp(this.squash, 0.25, dt * 8);
        if (this.stT > 0.45) {
          const a = this.angTo(W) + (Math.random() - 0.5) * 0.4;
          this.jvx = Math.cos(a) * 150;
          this.jvy = Math.sin(a) * 150;
          this.setState('jump');
        }
      } else if (this.state === 'jump') {
        const k = this.stT / 0.42;
        this.hop = Math.sin(Math.min(1, k) * Math.PI);
        this.squash = -0.18 * this.hop;
        W.moveEnt(this, this.jvx * dt, this.jvy * dt);
        if (k >= 1) {
          this.hop = 0;
          this.squash = 0.3;
          if (Math.random() < 0.25) W.fx.splat(this.x, this.y, 9);
          W.fx.dust(this.x, this.y, 2);
          this.setState(d > this.aggro * 1.6 ? 'idle' : 'wait');
        }
      }
    }
    harmful() {
      return this.hop < 0.6;
    }
    draw(ctx) {
      if (this.drawSpawn(ctx)) return;
      const st = this.stDraw();
      st.hop = this.hop;
      st.squash = this.squash;
      st.size = this.size || 1;
      G.Creatures.borrao(ctx, st);
    }
  }

  // --- Calango-Tipo -----------------------------------------------------------
  class Calango extends Enemy {
    constructor(o) {
      super(o);
      this.angle = 0;
      this.letters = U.pick(['ABC', 'SOL', 'RIM', 'FIM', 'LUZ', 'CÉU']);
      this.wT = 0;
      this.hr = 16;
      this.hy = 8;
    }
    ai(dt, W) {
      const p = W.player;
      const d = this.dist(W);
      if (this.state === 'idle' || this.state === 'wander') {
        this.wT -= dt;
        if (this.wT <= 0) {
          this.wT = 1 + Math.random() * 1.5;
          this.wa = U.pick([0, Math.PI / 2, Math.PI, -Math.PI / 2]);
        }
        const moved = W.moveEnt(this, Math.cos(this.wa || 0) * 55 * dt, Math.sin(this.wa || 0) * 55 * dt);
        if (!moved) this.wT = 0;
        this.angle = this.wa || 0;
        this.phase += dt * 12;
        if (p && d < 330 && (Math.abs(p.x - this.x) < 26 || Math.abs(p.y - this.y) < 26)) {
          this.dashA = Math.abs(p.x - this.x) < 26 ? (p.y > this.y ? Math.PI / 2 : -Math.PI / 2) : p.x > this.x ? 0 : Math.PI;
          this.angle = this.dashA;
          this.setState('aim');
          Au.sfx('charge', { dur: 0.4 });
        }
      } else if (this.state === 'aim') {
        this.shake = true;
        if (this.stT > 0.42) {
          this.shake = false;
          this.setState('dash');
        }
      } else if (this.state === 'dash') {
        const moved = W.moveEnt(this, Math.cos(this.dashA) * 470 * dt, Math.sin(this.dashA) * 470 * dt);
        this.phase += dt * 30;
        if (Math.random() < 0.5) W.fx.dust(this.x, this.y, 1);
        if (!moved) {
          this.stun = 0.9;
          W.fx.burst(this.x, this.y - 8, 5, { type: 'spark', size: 5, speed: 90, grav: 0 });
          Au.sfx('clank', { vol: 0.5 });
          W.shake(2, 0.1);
          this.setState('wander');
        } else if (this.stT > 0.7) this.setState('wander');
      }
    }
    draw(ctx) {
      if (this.drawSpawn(ctx)) return;
      const st = this.stDraw();
      st.angle = this.angle;
      st.phase = this.phase;
      st.shake = this.shake;
      st.letters = this.letters;
      G.Creatures.calango(ctx, st);
      if (this.stun > 0) drawDizzy(ctx, this.x, this.y - 22, this.t);
    }
  }

  function drawDizzy(ctx, x, y, t) {
    ctx.save();
    ctx.fillStyle = G.C.gold;
    for (let i = 0; i < 3; i++) {
      const a = t * 5 + (i * U.TAU) / 3;
      G.Art.star(ctx, x + Math.cos(a) * 12, y + Math.sin(a) * 4, 4, 1.6, 5);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- Urubu de Papel ---------------------------------------------------------
  class Urubu extends Enemy {
    constructor(o) {
      super(o);
      this.flying = true;
      this.alt = 70;
      this.orbitA = Math.random() * U.TAU;
      this.hy = 60;
      this.hr = 18;
      this.diveT = 2 + Math.random() * 2;
    }
    ai(dt, W) {
      const p = W.player;
      const d = this.dist(W);
      if (this.state === 'idle') {
        this.orbitA += dt * 0.9;
        const cx = d < this.aggro * 1.4 && p ? p.x : this.home.x, cy = d < this.aggro * 1.4 && p ? p.y : this.home.y;
        const tx = cx + Math.cos(this.orbitA) * 130, ty = cy + Math.sin(this.orbitA) * 80;
        this.x += (tx - this.x) * Math.min(1, dt * 1.5);
        this.y += (ty - this.y) * Math.min(1, dt * 1.5);
        this.angle = this.orbitA + Math.PI / 2;
        this.alt = U.lerp(this.alt, 70, dt * 2);
        this.diveT -= dt;
        if (this.diveT <= 0 && d < this.aggro * 1.3) {
          this.target = { x: p.x, y: p.y };
          this.setState('screech');
          Au.sfx('shoot', { p: 0.5 });
        }
      } else if (this.state === 'screech') {
        this.flap = Math.sin(this.t * 30);
        if (this.stT > 0.5) this.setState('dive');
      } else if (this.state === 'dive') {
        const a = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        this.angle = a;
        this.x += Math.cos(a) * 360 * dt;
        this.y += Math.sin(a) * 360 * dt;
        this.alt = U.lerp(this.alt, 10, dt * 6);
        if (U.dist(this.x, this.y, this.target.x, this.target.y) < 14 || this.stT > 1.2) {
          this.setState('rise');
          this.diveT = 2.5 + Math.random() * 2;
        }
      } else if (this.state === 'rise') {
        this.alt = U.lerp(this.alt, 70, dt * 2.5);
        this.x += Math.cos(this.angle) * 160 * dt;
        this.y += Math.sin(this.angle) * 160 * dt;
        if (this.stT > 0.8) this.setState('idle');
      }
      this.hy = this.alt;
      this.x = U.clamp(this.x, 30, W.map.w * G.TILE - 30);
      this.y = U.clamp(this.y, 60, W.map.h * G.TILE - 30);
    }
    harmful() {
      return this.alt < 30;
    }
    draw(ctx) {
      if (this.drawSpawn(ctx)) return;
      const st = this.stDraw();
      st.alt = this.alt;
      st.angle = this.angle || 0;
      st.flap = this.state === 'screech' ? this.flap : undefined;
      G.Creatures.urubu(ctx, st);
      if (this.state === 'screech' && this.target) {
        ctx.save();
        ctx.strokeStyle = G.C.red;
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(this.target.x, this.target.y, 18, 8, 0, 0, U.TAU);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // --- Mandacaruzinho ---------------------------------------------------------
  class Mandacaruzinho extends Enemy {
    constructor(o) {
      super(o);
      this.heavy = true;
      this.shootT = 1 + Math.random();
      this.hr = 16;
      this.hy = 18;
      this.solid = true;
    }
    ai(dt, W) {
      const d = this.dist(W);
      this.shootT -= dt;
      if (this.state === 'idle' && this.shootT <= 0 && d < 380) this.setState('charge');
      if (this.state === 'charge') {
        this.squash = 0.12 * Math.sin(this.stT * 40);
        if (this.stT > 0.35) {
          const a = this.angTo(W);
          for (let i = -1; i <= 1; i++) {
            const aa = a + i * 0.28;
            W.add(new Projectile({ x: this.x, y: this.y - 4, vx: Math.cos(aa) * 240, vy: Math.sin(aa) * 240, z: 22, kind: 'espinho', range: 420 }));
          }
          Au.sfx('shoot');
          this.squash = -0.1;
          this.shootT = 2.1;
          this.setState('idle');
        }
      } else this.squash = U.lerp(this.squash || 0, 0, dt * 8);
    }
    draw(ctx) {
      if (this.drawSpawn(ctx)) return;
      const st = this.stDraw();
      st.squash = this.squash;
      G.Creatures.mandacaruzinho(ctx, st);
    }
  }

  // --- Novelo -----------------------------------------------------------------
  class Novelo extends Enemy {
    constructor(o) {
      super(o);
      this.rot = 0;
      this.hr = 13;
      this.hy = 12;
      this.sp = 0;
    }
    ai(dt, W) {
      const d = this.dist(W);
      if (d < this.aggro || this.state === 'roll') {
        this.state = 'roll';
        const a = this.angTo(W);
        this.mvx = U.lerp(this.mvx || 0, Math.cos(a) * 200, dt * 1.6);
        this.mvy = U.lerp(this.mvy || 0, Math.sin(a) * 200, dt * 1.6);
        const okx = W.moveEnt(this, this.mvx * dt, 0);
        const oky = W.moveEnt(this, 0, this.mvy * dt);
        if (!okx) this.mvx *= -0.9;
        if (!oky) this.mvy *= -0.9;
        this.rot += (Math.hypot(this.mvx, this.mvy) / 13) * dt;
        this.moveAngle = Math.atan2(this.mvy, this.mvx);
      }
    }
    onHurt() {
      this.mvx = this.kx * 0.5;
      this.mvy = this.ky * 0.5;
    }
    draw(ctx) {
      if (this.drawSpawn(ctx)) return;
      const st = this.stDraw();
      st.rot = this.rot;
      st.moveAngle = this.moveAngle;
      st.size = this.size || 1;
      G.Creatures.novelo(ctx, st);
    }
  }

  // --- Agulheira --------------------------------------------------------------
  class Agulheira extends Enemy {
    constructor(o) {
      super(o);
      this.flying = true;
      this.alt = 24;
      this.hy = 24;
      this.hr = 12;
      this.atkT = 1.5 + Math.random() * 2;
      this.angle = 0;
    }
    ai(dt, W) {
      const p = W.player;
      const d = this.dist(W);
      if (this.state === 'idle') {
        const a = this.angTo(W) + Math.sin(this.t * 1.3 + this.seed) * 1.5;
        const want = d < this.aggro ? 150 : 0;
        const cx = p && d < this.aggro * 1.5 ? p.x - Math.cos(a) * want : this.home.x;
        const cy = p && d < this.aggro * 1.5 ? p.y - Math.sin(a) * want : this.home.y;
        this.x += (cx - this.x + Math.sin(this.t * 7) * 30) * dt * 1.5;
        this.y += (cy - this.y + Math.cos(this.t * 5) * 20) * dt * 1.5;
        this.angle = this.angTo(W);
        this.atkT -= dt;
        if (this.atkT <= 0 && d < this.aggro) {
          this.dashA = this.angTo(W);
          this.setState('aim');
        }
      } else if (this.state === 'aim') {
        this.angle = this.dashA;
        if (this.stT > 0.45) {
          this.setState('dash');
          Au.sfx('shoot', { p: 1.4 });
        }
      } else if (this.state === 'dash') {
        this.x += Math.cos(this.dashA) * 520 * dt;
        this.y += Math.sin(this.dashA) * 520 * dt;
        if (this.stT > 0.38) {
          this.atkT = 2 + Math.random() * 1.5;
          this.setState('idle');
        }
      }
      this.x = U.clamp(this.x, 30, W.map.w * G.TILE - 30);
      this.y = U.clamp(this.y, 40, W.map.h * G.TILE - 30);
    }
    draw(ctx) {
      if (this.drawSpawn(ctx)) return;
      if (this.state === 'aim') {
        ctx.save();
        ctx.strokeStyle = G.C.red;
        ctx.globalAlpha = 0.6;
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(this.dashA) * 190, this.y + Math.sin(this.dashA) * 190);
        ctx.stroke();
        ctx.restore();
      }
      const st = this.stDraw();
      st.alt = this.alt;
      st.angle = this.angle;
      G.Creatures.agulheira(ctx, st);
    }
  }

  // --- Peixe-Tinta ------------------------------------------------------------
  class Peixe extends Enemy {
    constructor(o) {
      super(o);
      this.flying = true;
      this.contact = 0;
      this.emerge = 0;
      this.coolT = 1 + Math.random() * 2;
      this.hy = 16;
      this.hr = 14;
    }
    canBeHit() {
      return this.emerge > 0.5 && super.canBeHit();
    }
    ai(dt, W) {
      const d = this.dist(W);
      if (this.state === 'idle') {
        this.emerge = U.lerp(this.emerge, 0, dt * 6);
        this.coolT -= dt;
        if (this.coolT <= 0 && d < 330) this.setState('up');
      } else if (this.state === 'up') {
        this.emerge = Math.min(1, this.stT / 0.35);
        this.dir = W.player && W.player.x < this.x ? 'left' : 'right';
        if (this.stT > 0.55) {
          const p = W.player;
          const tx = p.x + (p.vx || 0) * 0.3, ty = p.y;
          const dd = U.dist(this.x, this.y, tx, ty);
          const tt = 0.9;
          W.add(new Projectile({ x: this.x, y: this.y, vx: (tx - this.x) / tt, vy: (ty - this.y) / tt, z: 20, vz: 315, kind: 'tinta', range: dd + 50 }));
          Au.sfx('splat', { vol: 0.4 });
          this.spit = 0.2;
          this.setState('hold');
        }
      } else if (this.state === 'hold') {
        if (this.stT > 0.9) {
          this.coolT = 1.8 + Math.random() * 1.5;
          this.setState('idle');
          Au.sfx('splash', { vol: 0.3 });
        }
      }
      if (this.spit > 0) this.spit -= dt;
    }
    draw(ctx) {
      const st = this.stDraw();
      st.emerge = this.emerge;
      st.dir = this.dir;
      st.spit = this.spit > 0;
      G.Creatures.peixe(ctx, st);
    }
  }

  // --- Soldado-Carimbo --------------------------------------------------------
  class Carimbo extends Enemy {
    constructor(o) {
      super(o);
      this.heavy = true;
      this.hr = 16;
      this.hy = 26;
      this.lift = 0;
    }
    ai(dt, W) {
      const d = this.dist(W);
      if (this.state === 'idle') {
        if (d < this.aggro) {
          const a = this.angTo(W);
          W.moveEnt(this, Math.cos(a) * 72 * dt, Math.sin(a) * 72 * dt);
          this.moving = true;
          this.phase += dt * 9;
          if (d < 64) {
            this.setState('raise');
            this.slamA = a;
            this.moving = false;
            Au.sfx('charge', { dur: 0.5 });
          }
        } else this.moving = false;
      } else if (this.state === 'raise') {
        this.lift = U.lerp(this.lift, 40, dt * 8);
        this.raise = true;
        if (this.stT > 0.6) {
          this.setState('slam');
        }
      } else if (this.state === 'slam') {
        this.lift = U.lerp(this.lift, 0, dt * 30);
        if (!this.slammed && this.lift < 4) {
          this.slammed = true;
          const sx = this.x + Math.cos(this.slamA) * 40, sy = this.y + Math.sin(this.slamA) * 30;
          Au.sfx('stamp', { vol: 0.7 });
          W.shake(4, 0.2);
          W.fx.stampMark(sx, sy, 'CONFISCADO', { size: 13, life: 2.5 });
          W.fx.dust(sx, sy, 5);
          const p = W.player;
          if (U.dist(sx, sy, p.x, p.y) < 44 && p.state !== 'dodge') W.hurtPlayer(1, this.x, this.y);
        }
        if (this.stT > 0.7) {
          this.slammed = false;
          this.raise = false;
          this.setState('idle');
        }
      }
    }
    draw(ctx) {
      if (this.drawSpawn(ctx)) return;
      const st = this.stDraw();
      st.lift = this.lift;
      st.raise = this.raise;
      st.moving = this.moving;
      st.phase = this.phase;
      if (this.state === 'raise') {
        const sx = this.x + Math.cos(this.slamA) * 40, sy = this.y + Math.sin(this.slamA) * 30;
        ctx.save();
        ctx.fillStyle = 'rgba(194,58,34,0.25)';
        ctx.strokeStyle = G.C.red;
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 44, 27, 0, 0, U.TAU);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      G.Creatures.carimbo(ctx, st);
    }
  }

  // --- Jagunço de Papelão -----------------------------------------------------
  class Jagunco extends Enemy {
    constructor(o) {
      super(o);
      this.shootT = 1.5 + Math.random() * 1.5;
      this.hy = 26;
      this.hr = 14;
      this.eh = 70;
    }
    ai(dt, W) {
      const d = this.dist(W);
      const a = this.angTo(W);
      this.dir = U.dirName(Math.cos(a), Math.sin(a));
      if (d > this.aggro * 1.4) {
        this.moving = false;
        return;
      }
      let mx = 0, my = 0;
      if (d < 170) {
        mx = -Math.cos(a);
        my = -Math.sin(a);
      } else if (d > 260) {
        mx = Math.cos(a);
        my = Math.sin(a);
      } else {
        mx = Math.cos(a + Math.PI / 2) * Math.sin(this.t * 0.8);
        my = Math.sin(a + Math.PI / 2) * Math.sin(this.t * 0.8);
      }
      W.moveEnt(this, mx * 80 * dt, my * 80 * dt);
      this.moving = Math.hypot(mx, my) > 0.2;
      this.phase += dt * 9;
      this.shootT -= dt;
      if (this.shootT <= 0) {
        this.shootT = 2.4 + Math.random();
        W.add(new Projectile({ x: this.x, y: this.y - 10, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, z: 30, kind: 'aviao', range: 700, turn: 1.4, life: 4 }));
        Au.sfx('paper');
        this.pose = 'point';
        this.poseT = 0.3;
      }
      if (this.poseT > 0) {
        this.poseT -= dt;
        if (this.poseT <= 0) this.pose = null;
      }
    }
    draw(ctx) {
      if (this.drawSpawn(ctx)) return;
      G.Sprites.humanoid(ctx, 'jagunco', { x: this.x, y: this.y, dir: this.dir, t: this.t, moving: this.moving, phase: this.phase, pose: this.pose || 'idle', _flash: E.flashColor(this) });
    }
  }

  // --- Rascunho ---------------------------------------------------------------
  class Rascunho extends Enemy {
    constructor(o) {
      super(o);
      this.rot = 0;
      this.hr = 14;
      this.hy = 14;
    }
    ai(dt, W) {
      const d = this.dist(W);
      if (d < this.aggro) {
        const a = this.angTo(W);
        const sp = 115 + Math.sin(this.t * 3) * 40;
        W.moveEnt(this, Math.cos(a) * sp * dt, Math.sin(a) * sp * dt);
        this.rot += dt * 5 * (Math.cos(a) >= 0 ? 1 : -1);
        this.hop = Math.abs(Math.sin(this.t * 6)) * 4;
      }
    }
    die(W) {
      if (this.dead) return;
      super.die(W);
      for (let i = 0; i < 2; i++) {
        const l = new Letra({ kind: 'letra', x: this.x + (i ? 14 : -14), y: this.y, ch: U.pick('AEIOURSLMN'.split('')) });
        l.invul = 0.4;
        W.add(l);
      }
      Au.sfx('paper');
    }
    draw(ctx) {
      if (this.drawSpawn(ctx)) return;
      const st = this.stDraw();
      st.rot = this.rot;
      st.hop = this.hop;
      G.Creatures.rascunho(ctx, st);
    }
  }

  // --- Letra Solta ------------------------------------------------------------
  class Letra extends Enemy {
    constructor(o) {
      super(o);
      this.flying = true;
      this.ch = o.ch || U.pick('ABCDEFGHIJLMNOPQRSTUVXZ'.split(''));
      this.hr = 10;
      this.hy = 20;
      this.lootR = [0, 1];
      this.vx = 0;
      this.vy = 0;
    }
    ai(dt, W) {
      const p = W.player;
      if (!p) return;
      const d = this.dist(W);
      if (d > this.aggro * 1.8) return;
      const a = this.angTo(W) + Math.sin(this.t * 2 + this.seed) * 0.8;
      this.vx = U.lerp(this.vx, Math.cos(a) * 150, dt * 2.5);
      this.vy = U.lerp(this.vy, Math.sin(a) * 150, dt * 2.5);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
    draw(ctx) {
      if (this.drawSpawn(ctx)) return;
      const st = this.stDraw();
      st.ch = this.ch;
      G.Creatures.letra(ctx, st);
    }
  }

  const CLASSES = { borrao: Borrao, calango: Calango, urubu: Urubu, mandacaruzinho: Mandacaruzinho, novelo: Novelo, agulheira: Agulheira, peixe: Peixe, carimbo: Carimbo, jagunco: Jagunco, rascunho: Rascunho, letra: Letra };
  G.Enemies = {
    classes: CLASSES,
    create(o) {
      const C = CLASSES[o.kind];
      return C ? new C(o) : null;
    },
    drawDizzy,
  };
})();
