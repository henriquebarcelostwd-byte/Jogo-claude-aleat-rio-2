/* PELEJA — entidades: jogadora, companheiro, NPCs, coletáveis, interativos, projéteis */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Art = G.Art;
  const SP = G.Sprites;
  const T = G.TILE;
  const Inp = G.Input;
  const Au = G.Audio;

  const E = (G.Ent = { types: {} });

  // ------------------------------------------------------------------
  // Base
  // ------------------------------------------------------------------
  class Ent {
    constructor(o = {}) {
      this.x = 0;
      this.y = 0;
      this.cw = 20;
      this.ch = 12;
      this.vx = 0;
      this.vy = 0;
      this.kx = 0;
      this.ky = 0;
      this.dir = 'down';
      this.t = Math.random() * 10;
      this.dead = false;
      this.solid = false;
      this.hr = 14;
      this.hy = 20;
      this.flash = 0;
      this.phase = 0;
      this.moving = false;
      this.pose = null;
      this.emote = null;
      this.emoteT = 0;
      this.talking = false;
      this.alpha = 1;
      Object.assign(this, o);
    }
    box(x = this.x, y = this.y) {
      return { x: x - this.cw / 2, y: y - this.ch, w: this.cw, h: this.ch };
    }
    sortY() {
      return this.y;
    }
    // movimento roteirizado (cenas)
    goTo(x, y, speed = 110) {
      this.goal = { x, y, speed };
    }
    stepGoal(dt, W, collide = false) {
      if (!this.goal) return false;
      const g = this.goal;
      const dx = g.x - this.x, dy = g.y - this.y;
      const d = Math.hypot(dx, dy);
      const step = g.speed * dt;
      if (d <= step || d < 1) {
        this.x = g.x;
        this.y = g.y;
        this.goal = null;
        this.moving = false;
        return false;
      }
      const mx = (dx / d) * step, my = (dy / d) * step;
      if (collide) W.moveEnt(this, mx, my);
      else {
        this.x += mx;
        this.y += my;
      }
      this.dir = U.dirName(dx, dy);
      this.moving = true;
      this.phase += dt * g.speed * 0.075;
      return true;
    }
    showEmote(e, t = 1.6) {
      this.emote = e;
      this.emoteT = t;
    }
    drawEmote(ctx) {
      if (this.emote && this.emoteT > 0) {
        Art.emote(ctx, this.x + 10, this.y - (this.eh || 70), this.emote, Math.max(0, 1.6 - this.emoteT));
      }
    }
    baseUpdate(dt) {
      this.t += dt;
      if (this.flash > 0) this.flash -= dt;
      if (this.emoteT > 0) {
        this.emoteT -= dt;
        if (this.emoteT <= 0) this.emote = null;
      }
    }
    update(dt, W) {
      this.baseUpdate(dt);
      this.stepGoal(dt, W);
    }
    draw() {}
  }
  E.Ent = Ent;

  function flashColor(e) {
    return e.flash > 0 && Math.floor(e.flash * 30) % 2 === 0 ? G.Pal.paper : null;
  }
  E.flashColor = flashColor;

  // ------------------------------------------------------------------
  // ZABELÊ
  // ------------------------------------------------------------------
  class Player extends Ent {
    constructor(o) {
      super(o);
      this.id = 'zab';
      this.kind = 'player';
      this.cw = 20;
      this.ch = 12;
      this.hr = 12;
      this.hy = 22;
      this.eh = 78;
      this.state = 'normal';
      this.fa = Math.PI / 2; // ângulo de mira
      this.atk = null;
      this.combo = 0;
      this.comboT = 0;
      this.queued = false;
      this.dodgeT = 0;
      this.dodgeCD = 0;
      this.inv = 0;
      this.stampT = 0;
      this.throwCD = 0;
      this.hurtT = 0;
      this.ghosts = [];
      this.speed = 150;
    }
    get st() {
      return G.state;
    }
    update(dt, W) {
      this.baseUpdate(dt);
      const S = G.state;
      if (this.inv > 0) this.inv -= dt;
      if (this.dodgeCD > 0) this.dodgeCD -= dt;
      if (this.throwCD > 0) this.throwCD -= dt;
      if (this.comboT > 0) this.comboT -= dt;
      else this.combo = 0;
      for (const g of this.ghosts) g.a -= dt * 3;
      this.ghosts = this.ghosts.filter((g) => g.a > 0);
      // recuperação de tinta
      if (S.ink < S.maxInk) S.ink = Math.min(S.maxInk, S.ink + dt * 3.5);

      // knockback
      if (Math.abs(this.kx) + Math.abs(this.ky) > 1) {
        W.moveEnt(this, this.kx * dt, this.ky * dt);
        this.kx *= Math.pow(0.0015, dt);
        this.ky *= Math.pow(0.0015, dt);
      }

      if (this.state === 'dead') return;
      if (W.qte === 'stamp' && W.locked() && this.state === 'normal' && Inp.pressed('stamp')) {
        this.state = 'stamp';
        this.stampT = 0;
        this.stampDone = false;
        this.moving = false;
      }
      if (W.locked() && !(W.qte && this.state === 'stamp')) {
        if (this.state === 'attack' || this.state === 'dodge' || this.state === 'stamp' || this.state === 'throw') this.state = 'normal';
        this.atk = null;
        if (!this.stepGoal(dt, W)) this.moving = false;
        return;
      }

      const ax = Inp.axis();
      const moving = Math.hypot(ax.x, ax.y) > 0.2;
      const tile = W.tileAtPx(this.x, this.y - 4);
      const slow = (G.TILEFLAGS[tile] && G.TILEFLAGS[tile].slow) || 1;

      switch (this.state) {
        case 'normal': {
          if (moving) {
            this.fa = Math.atan2(ax.y, ax.x);
            this.dir = U.dirName(ax.x, ax.y);
          }
          const sp = this.speed * slow * (W.speedMul || 1);
          if (moving) {
            W.moveEnt(this, ax.x * sp * dt, ax.y * sp * dt);
            this.phase += dt * 11 * Math.hypot(ax.x, ax.y);
            if (Math.floor(this.phase / Math.PI) !== Math.floor((this.phase - dt * 11) / Math.PI)) {
              if (Math.random() < 0.35) W.fx.dust(this.x, this.y, 1, { size: 3 });
            }
          }
          this.moving = moving;
          // ações
          if (Inp.pressed('attack')) this.startAttack(W);
          else if (Inp.pressed('dodge') && this.dodgeCD <= 0) this.startDodge(W, ax, moving);
          else if (Inp.pressed('stamp') && S.abil.stamp) this.startStamp(W);
          else if (Inp.pressed('throw') && S.abil.throw) this.startThrow(W);
          else if (Inp.pressed('interact')) W.tryInteract();
          break;
        }
        case 'attack': {
          this.moving = false;
          const a = this.atk;
          a.t += dt;
          // passinho à frente no golpe
          if (a.t < 0.08) W.moveEnt(this, Math.cos(this.fa) * 90 * dt, Math.sin(this.fa) * 90 * dt);
          if (a.t >= a.hit0 && a.t <= a.hit1) W.playerAttackHits(this, a);
          if (Inp.pressed('attack') && a.t > a.dur * 0.35) this.queued = true;
          if (Inp.pressed('dodge') && a.t > a.hit1 && this.dodgeCD <= 0) {
            this.state = 'normal';
            this.startDodge(W, ax, moving);
            break;
          }
          if (a.t >= a.dur) {
            this.state = 'normal';
            if (this.queued && this.combo < 3) {
              if (moving) {
                this.fa = Math.atan2(ax.y, ax.x);
                this.dir = U.dirName(ax.x, ax.y);
              }
              this.startAttack(W);
            }
          }
          break;
        }
        case 'dodge': {
          this.dodgeT -= dt;
          const sp = (420 + S.up.dodge * 40) * (this.dodgeT > 0.08 ? 1 : 0.5);
          W.moveEnt(this, this.ddx * sp * dt, this.ddy * sp * dt);
          this.phase += dt * 20;
          if (Math.random() < 0.6) this.ghosts.push({ x: this.x, y: this.y, a: 0.5, rot: this.rollA() });
          if (this.dodgeT <= 0) {
            this.state = 'normal';
            W.fx.dust(this.x, this.y, 3);
          }
          break;
        }
        case 'stamp': {
          this.stampT += dt;
          if (this.stampT >= 0.18 && !this.stampDone) {
            this.stampDone = true;
            W.playerStamp(this);
          }
          if (this.stampT >= 0.45) this.state = 'normal';
          break;
        }
        case 'throw': {
          this.throwT += dt;
          if (this.throwT >= 0.22) this.state = 'normal';
          break;
        }
        case 'hurt': {
          this.hurtT -= dt;
          if (this.hurtT <= 0) this.state = 'normal';
          break;
        }
        default:
          break;
      }
    }
    rollA() {
      return this.state === 'dodge' ? (1 - this.dodgeT / 0.3) * U.TAU * (this.ddx < 0 ? -1 : 1) : 0;
    }
    startAttack(W) {
      const S = G.state;
      this.combo = this.combo >= 3 ? 1 : this.combo + 1;
      this.comboT = 0.7;
      this.queued = false;
      const big = this.combo === 3;
      const reach = 64 + S.up.whip * 14 + (big ? 14 : 0);
      this.atk = {
        t: 0, dur: big ? 0.36 : 0.26, hit0: 0.05, hit1: big ? 0.2 : 0.15, reach, arc: big ? 1.35 : 1.05,
        dmg: (big ? 2 : 1) + (S.up.dmg || 0), kb: big ? 320 : 170, hits: new Set(), combo: this.combo, side: this.combo === 2 ? -1 : 1,
      };
      this.state = 'attack';
      Au.sfx('whip', { p: big ? 0.8 : 1 + (this.combo - 1) * 0.12 });
    }
    startDodge(W, ax, moving) {
      let dx = ax.x, dy = ax.y;
      if (!moving) {
        dx = Math.cos(this.fa);
        dy = Math.sin(this.fa);
      }
      const m = Math.hypot(dx, dy) || 1;
      this.ddx = dx / m;
      this.ddy = dy / m;
      this.dodgeT = 0.3;
      this.dodgeCD = 0.55 - G.state.up.dodge * 0.1;
      this.inv = Math.max(this.inv, 0.32);
      this.state = 'dodge';
      Au.sfx('dodge');
      W.fx.dust(this.x, this.y, 4);
    }
    startStamp(W) {
      const S = G.state;
      if (S.ink < 30) {
        W.toast('Tinta insuficiente!', 1.2);
        Au.sfx('error');
        W.nanComment && W.nanComment('semTinta');
        return;
      }
      S.ink -= 30;
      this.state = 'stamp';
      this.stampT = 0;
      this.stampDone = false;
      this.moving = false;
    }
    startThrow(W) {
      if (this.throwCD > 0) return;
      this.throwCD = 0.45;
      this.state = 'throw';
      this.throwT = 0;
      const a = this.fa;
      W.add(new Projectile({
        x: this.x + Math.cos(a) * 14, y: this.y + Math.sin(a) * 8, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560,
        z: 22, kind: 'pregador', friendly: true, dmg: 1, range: 380, ang: a,
      }));
      Au.sfx('throw');
    }
    hurtBy(W, dmg, fx, fy, kb = 260) {
      if (this.inv > 0 || this.state === 'dead') return false;
      const S = G.state;
      S.hp = Math.max(0, S.hp - dmg);
      S.stats.hits++;
      this.inv = 1.1;
      this.flash = 0.3;
      const a = Math.atan2(this.y - fy, this.x - fx);
      this.kx = Math.cos(a) * kb;
      this.ky = Math.sin(a) * kb;
      if (this.state !== 'dodge') {
        this.state = 'hurt';
        this.hurtT = 0.22;
      }
      Au.sfx('hurt');
      W.shake(7, 0.25);
      W.hitstop(0.06);
      W.fx.burst(this.x, this.y - 20, 8, { type: 'ink', color: G.Pal.red, speed: 140, size: 3, splat: true });
      if (S.hp <= 0) {
        this.state = 'dead';
        W.onPlayerDeath();
      }
      return true;
    }
    draw(ctx, W) {
      const S = G.state;
      // rastros da esquiva
      for (const g of this.ghosts) {
        ctx.save();
        ctx.globalAlpha = g.a * 0.5;
        ctx.translate(g.x, g.y - 22);
        ctx.rotate(g.rot);
        ctx.translate(0, 22);
        SP.humanoid(ctx, 'zabele', { x: 0, y: 0, dir: this.dir, t: this.t, noShadow: true, _flash: G.Pal.red });
        ctx.restore();
      }
      if (this.inv > 0 && this.state !== 'dodge' && Math.floor(this.inv * 14) % 2 === 0 && this.state !== 'dead') return this.drawAttack(ctx);
      let pose = this.pose || 'idle';
      if (this.state === 'attack') pose = 'attack';
      if (this.state === 'stamp') pose = 'stamp';
      if (this.state === 'throw') pose = 'point';
      if (this.state === 'dead') pose = 'lie';
      const st = {
        x: this.x, y: this.y, dir: this.dir, t: this.t, moving: this.moving, phase: this.phase, pose,
        face: this.state === 'hurt' || this.state === 'dead' ? 'hurt' : this.face || null, talking: this.talking, _flash: flashColor(this),
        alpha: this.alpha,
      };
      if (this.state === 'dodge') {
        ctx.save();
        ctx.translate(this.x, this.y - 18);
        ctx.rotate(this.rollA());
        ctx.scale(1, 0.85);
        st.x = 0;
        st.y = 18;
        st.noShadow = true;
        SP.humanoid(ctx, 'zabele', st);
        ctx.restore();
        ctx.fillStyle = 'rgba(20,12,6,0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 12, 4, 0, 0, U.TAU);
        ctx.fill();
      } else {
        SP.humanoid(ctx, 'zabele', st);
      }
      this.drawAttack(ctx);
      this.drawEmote(ctx);
      void S;
      void W;
    }
    drawAttack(ctx) {
      if (this.state !== 'attack' || !this.atk) return;
      const a = this.atk;
      const k = U.clamp(a.t / (a.hit1 + 0.04), 0, 1);
      const ox = this.x, oy = this.y - 24;
      const sweep = a.arc * 2;
      const start = this.fa - a.arc * a.side;
      const cur = start + sweep * a.side * U.ease.outCubic(k);
      // rastro do golpe (arco de xilogravura)
      ctx.save();
      ctx.globalAlpha = 0.85 * (1 - Math.max(0, (a.t - a.hit1) / (a.dur - a.hit1)));
      ctx.fillStyle = a.combo === 3 ? G.Pal.red : G.Pal.ink;
      ctx.beginPath();
      const r1 = a.reach, r0 = a.reach * 0.55;
      const s0 = Math.min(start, cur), s1 = Math.max(start, cur);
      ctx.ellipse(ox, oy, r1, r1 * 0.8, 0, s0, s1);
      ctx.ellipse(ox, oy, r0, r0 * 0.8, 0, s1, s0, true);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = G.Pal.paper;
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const rr = U.lerp(r0, r1, i / 4);
        ctx.beginPath();
        ctx.ellipse(ox, oy, rr, rr * 0.8, 0, s0 + 0.1, s1 - 0.05);
        ctx.stroke();
      }
      ctx.restore();
      // o cordão
      ctx.save();
      ctx.strokeStyle = G.Pal.ink;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      const hx = ox + Math.cos(cur) * 12, hy = oy + Math.sin(cur) * 10;
      const tx = ox + Math.cos(cur) * a.reach, ty = oy + Math.sin(cur) * a.reach * 0.8;
      const mx = (hx + tx) / 2 + Math.cos(cur + Math.PI / 2 * a.side) * 10, my = (hy + ty) / 2 + Math.sin(cur + Math.PI / 2 * a.side) * 8;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.quadraticCurveTo(mx, my, tx, ty);
      ctx.stroke();
      ctx.strokeStyle = G.Pal.paper;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // pregador na ponta
      ctx.translate(tx, ty);
      ctx.rotate(cur);
      ctx.fillStyle = G.Pal.red;
      ctx.fillRect(-4, -2.5, 9, 5);
      ctx.strokeStyle = G.Pal.ink;
      ctx.lineWidth = 1;
      ctx.strokeRect(-4, -2.5, 9, 5);
      ctx.restore();
    }
  }
  E.Player = Player;

  // ------------------------------------------------------------------
  // SEU NANQUIM (segue a jogadora)
  // ------------------------------------------------------------------
  class Nanquim extends Ent {
    constructor(o) {
      super(o);
      this.id = 'nan';
      this.kind = 'nanquim';
      this.follow = true;
      this.eh = 64;
    }
    update(dt, W) {
      this.baseUpdate(dt);
      if (this.stepGoal(dt, W)) return;
      const p = W.player;
      if (!p || !this.follow) return;
      const side = p.dir === 'left' ? 1 : -1;
      const tx = p.x + side * 26, ty = p.y + 6;
      const d = U.dist(this.x, this.y, tx, ty);
      if (d > 400) {
        this.x = tx;
        this.y = ty;
      }
      const k = 1 - Math.pow(0.02, dt);
      this.x += (tx - this.x) * k;
      this.y += (ty - this.y) * k;
      this.dir = tx < this.x - 4 ? 'left' : tx > this.x + 4 ? 'right' : this.dir;
      if (d < 30) this.dir = p.dir === 'left' ? 'left' : 'right';
    }
    draw(ctx) {
      G.Creatures.nanquim(ctx, { x: this.x, y: this.y, t: this.t, dir: this.dir, talking: this.talking, face: this.face, level: G.state.ink / G.state.maxInk * 0.7 + 0.1, alpha: this.alpha });
      this.drawEmote(ctx);
    }
  }
  E.Nanquim = Nanquim;

  // ------------------------------------------------------------------
  // NPC
  // ------------------------------------------------------------------
  class NPC extends Ent {
    constructor(o) {
      super(o);
      this.kind = 'npc';
      this.solid = o.solid !== false;
      this.cw = o.cw || 24;
      this.ch = o.ch || 14;
      this.eh = o.eh || 76;
      this.home = { x: this.x, y: this.y };
      this.wanderT = 1 + Math.random() * 3;
      this.baseDir = o.dir || 'down';
      this.dir = this.baseDir;
      this.face = o.face || null;
    }
    get interactive() {
      return !!this.talk;
    }
    verb() {
      return this.verbText || 'Falar';
    }
    update(dt, W) {
      this.baseUpdate(dt);
      if (this.stepGoal(dt, W)) return;
      this.moving = false;
      if (this.wander && !W.locked()) {
        this.wanderT -= dt;
        if (this.wanderT <= 0) {
          this.wanderT = 2 + Math.random() * 4;
          const r = this.wander;
          this.goTo(this.home.x + (Math.random() - 0.5) * r * 2, this.home.y + (Math.random() - 0.5) * r, 40);
        }
      }
      // olha para a jogadora quando perto
      if (!W.locked() && W.player && this.lookAt !== false) {
        const d = U.dist(this.x, this.y, W.player.x, W.player.y);
        if (d < 90 && !this.goal) this.dir = U.dirName(W.player.x - this.x, W.player.y - this.y);
        else if (!this.goal && !this.wander) this.dir = this.baseDir;
      }
    }
    interact(W) {
      if (W.player) this.dir = U.dirName(W.player.x - this.x, W.player.y - this.y);
      W.talkTo(this);
    }
    draw(ctx, W) {
      const st = { x: this.x, y: this.y, dir: this.dir, t: this.t, moving: this.moving, phase: this.phase, pose: this.pose || 'idle', talking: this.talking, face: this.face, _flash: flashColor(this), alpha: this.alpha };
      SP.draw(ctx, this.char, st);
      if (this.mark && this.mark(W) && !W.locked()) {
        const b = Math.sin(this.t * 4) * 3;
        ctx.save();
        ctx.fillStyle = G.C.red;
        ctx.strokeStyle = G.C.ink;
        ctx.lineWidth = 2;
        ctx.font = G.font(26, 'title');
        ctx.textAlign = 'center';
        ctx.strokeText('!', this.x, this.y - this.eh - 4 + b);
        ctx.fillText('!', this.x, this.y - this.eh - 4 + b);
        ctx.restore();
      }
      this.drawEmote(ctx);
    }
  }
  E.NPC = NPC;

  // criaturas ambientes (galinhas, cabra)
  class Critter extends Ent {
    constructor(o) {
      super(o);
      this.kind = 'critter';
      this.home = { x: this.x, y: this.y };
      this.wanderT = Math.random() * 2;
      this.speed = o.speed || 60;
      this.eh = 40;
    }
    update(dt, W) {
      this.baseUpdate(dt);
      if (this.stepGoal(dt, W, true)) return;
      this.moving = false;
      if (this.followPlayer && W.player) {
        const p = W.player;
        const d = U.dist(this.x, this.y, p.x, p.y);
        if (d > 50) {
          const a = Math.atan2(p.y - this.y, p.x - this.x);
          const sp = d > 200 ? 200 : 130;
          W.moveEnt(this, Math.cos(a) * sp * dt, Math.sin(a) * sp * dt);
          this.dir = Math.cos(a) < 0 ? 'left' : 'right';
          this.moving = true;
          this.phase += dt * 12;
          if (d > 500) {
            this.x = p.x - 30;
            this.y = p.y;
          }
        }
        return;
      }
      if (W.player && this.skittish) {
        const d = U.dist(this.x, this.y, W.player.x, W.player.y);
        if (d < 70) {
          const a = Math.atan2(this.y - W.player.y, this.x - W.player.x);
          W.moveEnt(this, Math.cos(a) * 160 * dt, Math.sin(a) * 160 * dt);
          this.dir = Math.cos(a) < 0 ? 'left' : 'right';
          this.moving = true;
          this.phase += dt * 16;
          return;
        }
      }
      if (!this.speed) return;
      this.wanderT -= dt;
      if (this.wanderT <= 0) {
        this.wanderT = 1.5 + Math.random() * 3;
        const tx = this.home.x + (Math.random() - 0.5) * 120, ty = this.home.y + (Math.random() - 0.5) * 80;
        this.goTo(tx, ty, this.speed);
        this.dir = tx < this.x ? 'left' : 'right';
      }
    }
    get interactive() {
      return !!this.talk;
    }
    verb() {
      return this.verbText || 'Chamar';
    }
    interact(W) {
      W.talkTo(this);
    }
    draw(ctx) {
      SP.draw(ctx, this.char, { x: this.x, y: this.y, t: this.t, dir: this.dir === 'left' ? 'left' : 'right', moving: this.moving, phase: this.phase });
      this.drawEmote(ctx);
    }
  }
  E.Critter = Critter;

  // ------------------------------------------------------------------
  // Coletáveis
  // ------------------------------------------------------------------
  const RIMA_CHARS = 'ABCDEFGHIJLMNOPQRSTUVXZÇÃÉ';
  class Pickup extends Ent {
    constructor(o) {
      super(o);
      this.kind = 'pickup';
      this.type = o.type || 'rima';
      this.value = o.value || 1;
      this.z = o.z || 10;
      this.vz = o.vz != null ? o.vz : 160;
      this.vx = o.vx || 0;
      this.vy = o.vy || 0;
      this.ch = RIMA_CHARS[(Math.random() * RIMA_CHARS.length) | 0];
      this.delay = 0.35;
      this.life = 18;
    }
    update(dt, W) {
      this.baseUpdate(dt);
      this.life -= dt;
      if (this.life <= 0) this.dead = true;
      this.delay -= dt;
      // quicar
      this.vz -= 600 * dt;
      this.z += this.vz * dt;
      if (this.z <= 0) {
        this.z = 0;
        this.vz = Math.abs(this.vz) > 60 ? -this.vz * 0.45 : 0;
        this.vx *= 0.6;
        this.vy *= 0.6;
      }
      W.moveEnt(this, this.vx * dt, this.vy * dt);
      this.vx *= Math.pow(0.1, dt);
      this.vy *= Math.pow(0.1, dt);
      const p = W.player;
      if (!p || this.delay > 0 || p.state === 'dead') return;
      const d = U.dist(this.x, this.y, p.x, p.y);
      if (d < 100 && (this.type === 'rima' || d < 40)) {
        const a = Math.atan2(p.y - this.y, p.x - this.x);
        const sp = 380 * (1 - d / 130) + 80;
        this.x += Math.cos(a) * sp * dt;
        this.y += Math.sin(a) * sp * dt;
      }
      if (d < 18) this.collect(W);
    }
    collect(W) {
      const S = G.state;
      this.dead = true;
      if (this.type === 'rima') {
        S.rimas += this.value;
        S.stats.rimas += this.value;
        Au.sfx('coin');
      } else if (this.type === 'heart') {
        S.hp = Math.min(S.maxHp, S.hp + 2);
        Au.sfx('heal');
        W.fx.text(this.x, this.y - 20, '+♥', { size: 18, wood: false });
      } else if (this.type === 'ink') {
        S.ink = Math.min(S.maxInk, S.ink + 35);
        Au.sfx('drip');
        W.fx.text(this.x, this.y - 20, '+tinta', { size: 16, color: G.C.ink, wood: false });
      }
    }
    draw(ctx) {
      const y = this.y - this.z - 8 - Math.sin(this.t * 4) * 2;
      if (this.life < 3 && Math.floor(this.life * 8) % 2 === 0) return;
      ctx.save();
      ctx.fillStyle = 'rgba(20,12,6,0.2)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, 6, 2.5, 0, 0, U.TAU);
      ctx.fill();
      if (this.type === 'rima') {
        ctx.translate(this.x, y);
        ctx.scale(Math.cos(this.t * 3), 1);
        ctx.fillStyle = G.C.paperLight;
        ctx.strokeStyle = G.Pal.ink;
        ctx.lineWidth = 1.5;
        ctx.fillRect(-7, -8, 14, 16);
        ctx.strokeRect(-7, -8, 14, 16);
        ctx.fillStyle = G.Pal.red;
        ctx.font = G.font(12, 'title');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.ch, 0, 1);
      } else if (this.type === 'heart') {
        Art.heart(ctx, this.x, y, 16, 1, {});
      } else if (this.type === 'ink') {
        ctx.fillStyle = G.Pal.ink;
        ctx.beginPath();
        ctx.moveTo(this.x, y - 9);
        ctx.quadraticCurveTo(this.x + 7, y + 2, this.x, y + 6);
        ctx.quadraticCurveTo(this.x - 7, y + 2, this.x, y - 9);
        ctx.fill();
        ctx.fillStyle = G.Pal.paper;
        Art.gouge(ctx, this.x - 2, y, 4, -1, 1);
      }
      ctx.restore();
    }
  }
  E.Pickup = Pickup;

  // ------------------------------------------------------------------
  // Projéteis
  // ------------------------------------------------------------------
  class Projectile extends Ent {
    constructor(o) {
      super(o);
      this.kindP = o.kind;
      this.kind = 'proj';
      this.z = o.z != null ? o.z : 16;
      this.traveled = 0;
      this.range = o.range || 600;
      this.r = o.r || 6;
      this.dmg = o.dmg || 1;
      this.ang = o.ang != null ? o.ang : Math.atan2(this.vy, this.vx);
      this.life = o.life || 6;
      this.hitSet = new Set();
    }
    update(dt, W) {
      this.baseUpdate(dt);
      this.life -= dt;
      if (this.life <= 0) {
        this.dead = true;
        return;
      }
      if (this.kindP === 'aviao' && W.player) {
        // avião de papel teleguiado (curva suave)
        const want = Math.atan2(W.player.y - this.y, W.player.x - this.x);
        this.ang += U.angDiff(this.ang, want) * Math.min(1, dt * (this.turn || 1.8));
        const sp = Math.hypot(this.vx, this.vy);
        this.vx = Math.cos(this.ang) * sp;
        this.vy = Math.sin(this.ang) * sp;
      }
      if (this.kindP === 'tinta') {
        // bola de tinta em arco
        this.vz = (this.vz || 0) - 700 * dt;
        this.z += this.vz * dt;
        if (this.z <= 0) {
          this.dead = true;
          Au.sfx('splat', { vol: 0.5 });
          W.fx.splat(this.x, this.y, 18);
          W.addPuddle && W.addPuddle(this.x, this.y);
          if (W.player && U.dist(this.x, this.y, W.player.x, W.player.y) < 26) W.hurtPlayer(1, this.x, this.y);
          return;
        }
      }
      const nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
      this.traveled += Math.hypot(this.vx * dt, this.vy * dt);
      if (this.kindP !== 'tinta' && !this.ghost && W.shotBlocked(nx, ny)) {
        this.onWall(W);
        return;
      }
      this.x = nx;
      this.y = ny;
      if (this.traveled > this.range) {
        this.dead = true;
        if (this.friendly) W.fx.burst(this.x, this.y - this.z, 3, { type: 'spark', size: 4, speed: 60, grav: 0 });
        return;
      }
      if (this.friendly) W.projHitsEnemies(this);
      else if (W.player && this.kindP !== 'tinta') {
        const p = W.player;
        if (U.dist(this.x, this.y - this.z * 0.2, p.x, p.y - 14) < this.r + 11) {
          if (W.hurtPlayer(this.dmg, this.x, this.y)) this.dead = true;
          else if (p.inv > 0 && p.state === 'dodge') { /* esquivou */ }
        }
      }
    }
    onWall(W) {
      this.dead = true;
      W.fx.burst(this.x, this.y - this.z, 4, { type: this.friendly ? 'spark' : 'ink', size: 3, speed: 70, grav: this.friendly ? 0 : 300 });
      if (this.kindP === 'pregador') Au.sfx('menuMove', { vol: 0.6 });
    }
    draw(ctx) {
      const x = this.x, y = this.y - this.z;
      ctx.save();
      ctx.fillStyle = 'rgba(20,12,6,0.18)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, 5, 2, 0, 0, U.TAU);
      ctx.fill();
      ctx.translate(x, y);
      ctx.rotate(this.ang);
      const ink = G.Pal.ink;
      switch (this.kindP) {
        case 'pregador':
          ctx.rotate(this.t * 25);
          ctx.fillStyle = G.Pal.red;
          ctx.strokeStyle = ink;
          ctx.lineWidth = 1.4;
          ctx.fillRect(-7, -3, 14, 6);
          ctx.strokeRect(-7, -3, 14, 6);
          ctx.fillStyle = '#c0c0b8';
          ctx.fillRect(-2, -4, 4, 8);
          break;
        case 'espinho':
          ctx.fillStyle = ink;
          ctx.beginPath();
          ctx.moveTo(10, 0);
          ctx.lineTo(-8, -3);
          ctx.lineTo(-8, 3);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = G.Pal.paper;
          ctx.fillRect(-7, -0.6, 10, 1.2);
          break;
        case 'agulha':
          ctx.strokeStyle = ink;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-12, 0);
          ctx.lineTo(12, 0);
          ctx.stroke();
          ctx.strokeStyle = '#d8d4c8';
          ctx.lineWidth = 1.4;
          ctx.stroke();
          SP.dot(ctx, -11, 0, 2.2, G.Pal.red);
          break;
        case 'tinta':
          ctx.rotate(-this.ang);
          SP.dot(ctx, 0, 0, 8, ink, G.Pal.paper, 1.2);
          ctx.fillStyle = G.Pal.paper;
          Art.gouge(ctx, -3, -3, 5, -0.8, 1.4);
          break;
        case 'aviao':
          ctx.fillStyle = G.C.paperLight;
          ctx.strokeStyle = ink;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(14, 0);
          ctx.lineTo(-10, -9);
          ctx.lineTo(-5, 0);
          ctx.lineTo(-10, 9);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(14, 0);
          ctx.lineTo(-5, 0);
          ctx.stroke();
          break;
        case 'letraP':
          ctx.rotate(-this.ang + this.t * 6);
          ctx.fillStyle = this.color || ink;
          ctx.font = G.font(20, 'title');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(this.ch || 'A', 0, 0);
          break;
        case 'estrela':
          ctx.rotate(this.t * 8);
          ctx.fillStyle = G.Pal.red;
          Art.star(ctx, 0, 0, 9, 4, 5);
          ctx.fill();
          ctx.strokeStyle = ink;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          break;
        default:
          SP.dot(ctx, 0, 0, 5, ink);
      }
      ctx.restore();
    }
  }
  E.Projectile = Projectile;

  // onda de choque inimiga (anel que se expande)
  class Shockwave extends Ent {
    constructor(o) {
      super(o);
      this.kind = 'hazard';
      this.r = 10;
      this.maxR = o.maxR || 220;
      this.speed = o.speed || 260;
      this.width = o.width || 16;
      this.dmg = o.dmg || 1;
      this.hitDone = false;
    }
    update(dt, W) {
      this.baseUpdate(dt);
      this.r += this.speed * dt;
      if (this.r >= this.maxR) this.dead = true;
      const p = W.player;
      if (!this.hitDone && p) {
        const dx = (p.x - this.x) / 1, dy = (p.y - this.y) / 0.62;
        const d = Math.hypot(dx, dy);
        if (Math.abs(d - this.r) < this.width && p.state !== 'dodge') {
          if (W.hurtPlayer(this.dmg, this.x, this.y)) this.hitDone = true;
        }
      }
    }
    sortY() {
      return this.y - 1000;
    }
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = 1 - this.r / this.maxR;
      ctx.strokeStyle = G.Pal.ink;
      ctx.lineWidth = this.width * 0.8;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.r, this.r * 0.62, 0, 0, U.TAU);
      ctx.stroke();
      ctx.strokeStyle = G.Pal.paper;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.restore();
    }
  }
  E.Shockwave = Shockwave;

  // zona de perigo marcada no chão (telegrafa e depois fere)
  class Telegraph extends Ent {
    constructor(o) {
      super(o);
      this.kind = 'hazard';
      this.delay = o.delay || 0.9;
      this.r = o.r || 40;
      this.dmg = o.dmg || 1;
      this.age = 0;
      this.shape = o.shape || 'circle';
      this.onBoom = o.onBoom;
    }
    update(dt, W) {
      this.baseUpdate(dt);
      this.age += dt;
      if (this.age >= this.delay && !this.boomed) {
        this.boomed = true;
        const p = W.player;
        if (p && p.state !== 'dodge') {
          let inside;
          if (this.shape === 'rect') inside = Math.abs(p.x - this.x) < this.w / 2 && Math.abs(p.y - this.y) < this.h / 2;
          else inside = U.dist(p.x, p.y, this.x, this.y) < this.r;
          if (inside) W.hurtPlayer(this.dmg, this.x, this.y - 1);
        }
        if (this.onBoom) this.onBoom(W, this);
        this.linger = 0.25;
      }
      if (this.boomed) {
        this.linger -= dt;
        if (this.linger <= 0) this.dead = true;
      }
    }
    sortY() {
      return this.y - 1000;
    }
    draw(ctx) {
      const k = U.clamp(this.age / this.delay, 0, 1);
      ctx.save();
      ctx.strokeStyle = G.Pal.red;
      ctx.fillStyle = 'rgba(194,58,34,' + (0.12 + k * 0.25) + ')';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = -this.t * 30;
      if (this.shape === 'rect') {
        ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
        ctx.strokeRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
        ctx.fillRect(this.x - (this.w / 2) * k, this.y - (this.h / 2) * k, this.w * k, this.h * k);
      } else {
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.r, this.r * 0.62, 0, 0, U.TAU);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.r * k, this.r * 0.62 * k, 0, 0, U.TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  E.Telegraph = Telegraph;

  // ------------------------------------------------------------------
  // Interativos
  // ------------------------------------------------------------------
  class Interactable extends Ent {
    constructor(o) {
      super(o);
      this.kind = 'thing';
      this.solid = o.solid !== false;
      this.cw = o.cw || 30;
      this.ch = o.ch || 18;
    }
    get interactive() {
      return true;
    }
    verb() {
      return this.verbText || 'Ver';
    }
  }

  // placa de leitura
  class Sign extends Interactable {
    constructor(o) {
      super(o);
      this.kind = 'sign';
      this.cw = 26;
      this.ch = 10;
    }
    verb() {
      return 'Ler';
    }
    interact(W) {
      W.runScript(typeof this.text === 'string' ? [{ narr: this.text }] : this.text);
    }
    draw(ctx) {
      const ink = G.Pal.ink;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = ink;
      ctx.fillRect(-2, -30, 4, 30);
      ctx.fillStyle = G.Pal.mid;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.fillRect(-20, -46, 40, 22);
      ctx.strokeRect(-20, -46, 40, 22);
      ctx.strokeStyle = G.Pal.paper;
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-14, -40 + i * 6);
        ctx.lineTo(14 - i * 5, -40 + i * 6);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  E.Sign = Sign;

  // baú
  class Chest extends Interactable {
    constructor(o) {
      super(o);
      this.kind = 'chest';
      this.cw = 34;
      this.ch = 16;
      this.eh = 50;
    }
    get opened() {
      return !!G.state.flags['bau_' + this.fid];
    }
    get interactive() {
      return !this.opened;
    }
    verb() {
      return 'Abrir';
    }
    interact(W) {
      if (this.opened) return;
      G.state.flags['bau_' + this.fid] = true;
      Au.sfx('creak');
      this.openT = 0;
      W.openChest(this);
    }
    update(dt) {
      this.baseUpdate(dt);
      if (this.openT != null) this.openT += dt;
    }
    draw(ctx) {
      const ink = G.Pal.ink;
      const open = this.opened;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = 'rgba(20,12,6,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 5, 0, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = G.Pal.mid;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.fillRect(-18, -22, 36, 22);
      ctx.strokeRect(-18, -22, 36, 22);
      ctx.fillStyle = ink;
      ctx.fillRect(-18, -12, 36, 3);
      ctx.fillRect(-12, -22, 3, 22);
      ctx.fillRect(9, -22, 3, 22);
      if (open) {
        ctx.fillStyle = ink;
        ctx.fillRect(-18, -34, 36, 12);
        ctx.fillStyle = G.Pal.paper;
        ctx.fillRect(-15, -31, 30, 7);
      } else {
        ctx.fillStyle = G.Pal.mid;
        ctx.beginPath();
        ctx.moveTo(-18, -22);
        ctx.quadraticCurveTo(0, -36, 18, -22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        SP.dot(ctx, 0, -16, 3, G.C.gold, ink, 1);
        // brilho
        if (Math.sin(this.t * 3) > 0.6) {
          ctx.fillStyle = G.C.paperLight;
          Art.star(ctx, 12, -30, 5, 1.5, 4);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }
  E.Chest = Chest;

  // candeeiro (checkpoint e luz)
  class Candeeiro extends Interactable {
    constructor(o) {
      super(o);
      this.kind = 'candeeiro';
      this.cw = 18;
      this.ch = 12;
      this.eh = 90;
    }
    get lit() {
      return this.alwaysLit || !!G.state.flags['lamp_' + this.fid];
    }
    get interactive() {
      return !this.lit || this.checkpoint;
    }
    verb() {
      return this.lit ? 'Descansar' : 'Acender';
    }
    interact(W) {
      if (!this.lit) {
        G.state.flags['lamp_' + this.fid] = true;
        Au.sfx('lamp');
        W.fx.burst(this.x, this.y - 70, 14, { type: 'glow', color: '#ffcf6a', size: 8, speed: 90, grav: 0, life: 0.8 });
        W.onLampLit(this);
      } else {
        W.restAt(this);
      }
    }
    update(dt, W) {
      this.baseUpdate(dt);
      if (this.lit) W.light(this.x, this.y - 60, this.lightR || 250, 1);
    }
    draw(ctx) {
      const ink = G.Pal.ink;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = 'rgba(20,12,6,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 4, 0, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.fillRect(-3, -62, 6, 62);
      ctx.fillRect(-10, -6, 20, 6);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -60);
      ctx.lineTo(0, -66);
      ctx.stroke();
      // lamparina
      ctx.fillStyle = G.Pal.mid;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-12, -66);
      ctx.lineTo(12, -66);
      ctx.lineTo(9, -84);
      ctx.lineTo(-9, -84);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (this.lit) {
        ctx.fillStyle = 'rgba(255,207,106,0.9)';
        ctx.fillRect(-8, -82, 16, 14);
        Art.flame(ctx, 0, -70, 0.55, this.t);
      } else {
        ctx.fillStyle = ink;
        ctx.fillRect(-8, -82, 16, 14);
      }
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(-12, -84);
      ctx.lineTo(0, -94);
      ctx.lineTo(12, -84);
      ctx.fill();
      ctx.restore();
    }
  }
  E.Candeeiro = Candeeiro;

  // cordão de folhetos (prólogo)
  class Cordao extends Interactable {
    constructor(o) {
      super(o);
      this.kind = 'cordao';
      this.cw = 90;
      this.ch = 10;
      this.solid = false;
      this.eh = 70;
    }
    get hung() {
      return !!G.state.flags['cordao_' + this.fid];
    }
    get interactive() {
      return !this.hung && !!G.state.flags.tarefaCordao;
    }
    verb() {
      return 'Pendurar';
    }
    interact(W) {
      G.state.flags['cordao_' + this.fid] = true;
      Au.sfx('paper');
      W.fx.burst(this.x, this.y - 50, 8, { type: 'paper', size: 4, speed: 80, grav: 200, life: 0.8 });
      W.onCordao(this);
    }
    draw(ctx) {
      const ink = G.Pal.ink;
      const t = this.t;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-46, 0);
      ctx.lineTo(-46, -62);
      ctx.moveTo(46, 0);
      ctx.lineTo(46, -62);
      ctx.stroke();
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-46, -58);
      ctx.quadraticCurveTo(0, -46, 46, -58);
      ctx.stroke();
      const cols = ['#e6c14f', '#e39a9a', '#8fb3d9', '#f0e3c0', '#b8d49a'];
      const n = this.hung ? 5 : 1;
      for (let i = 0; i < n; i++) {
        const k = (i + 0.5) / 5;
        const px = -46 + k * 92;
        const py = -58 + Math.sin(k * Math.PI) * 11;
        const sw = Math.sin(t * 2 + i) * 0.1;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(sw);
        ctx.fillStyle = cols[(i + this.fid.length) % 5];
        ctx.fillRect(-7, 2, 14, 19);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1;
        ctx.strokeRect(-7, 2, 14, 19);
        ctx.fillStyle = ink;
        ctx.fillRect(-5, 6, 10, 6);
        ctx.fillRect(-5, 14, 10, 1);
        ctx.fillRect(-5, 17, 7, 1);
        ctx.fillStyle = G.C.red;
        ctx.fillRect(-1.5, -1, 3, 5);
        ctx.restore();
      }
      if (!this.hung && G.state.flags.tarefaCordao) {
        ctx.fillStyle = G.C.red;
        ctx.font = G.font(20, 'title');
        ctx.textAlign = 'center';
        ctx.fillText('?', 0, -70 + Math.sin(t * 4) * 3);
      }
      ctx.restore();
    }
  }
  E.Cordao = Cordao;

  // bloco-letra empurrável
  class Block extends Ent {
    constructor(o) {
      super(o);
      this.kind = 'block';
      this.solid = true;
      this.cw = 44;
      this.ch = 30;
      this.pushT = 0;
      this.anim = null;
    }
    tile() {
      return { tx: Math.floor(this.x / T), ty: Math.floor((this.y - 10) / T) };
    }
    update(dt, W) {
      this.baseUpdate(dt);
      if (this.anim) {
        this.anim.t += dt / 0.18;
        const k = Math.min(1, this.anim.t);
        this.x = U.lerp(this.anim.x0, this.anim.x1, U.ease.outCubic(k));
        this.y = U.lerp(this.anim.y0, this.anim.y1, U.ease.outCubic(k));
        if (k >= 1) {
          this.anim = null;
          W.onBlockMoved && W.onBlockMoved(this);
        }
        return;
      }
      const p = W.player;
      if (!p || W.locked() || p.state !== 'normal' || !p.moving) {
        this.pushT = 0;
        return;
      }
      // empurrão: jogadora encostada e andando na direção do bloco
      const v = U.dirVec(p.dir);
      const bx = this.x, by = this.y - 14;
      const px = p.x + v.x * 18, py = p.y - 6 + v.y * 18;
      const touching = Math.abs(px - bx) < 30 && Math.abs(py - by) < 24;
      const aligned = v.x !== 0 ? Math.abs(p.y - 6 - by) < 18 : Math.abs(p.x - bx) < 18;
      if (touching && aligned) {
        this.pushT += dt;
        if (this.pushT > 0.28) {
          this.pushT = 0;
          const { tx, ty } = this.tile();
          const nx = tx + v.x, ny = ty + v.y;
          if (W.blockCanMove(this, nx, ny)) {
            this.anim = { t: 0, x0: this.x, y0: this.y, x1: nx * T + T / 2, y1: ny * T + T - 8 };
            Au.sfx('thud');
            W.fx.dust(this.x, this.y, 4);
          }
        }
      } else this.pushT = 0;
    }
    draw(ctx) {
      const ink = G.Pal.ink;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = 'rgba(20,12,6,0.25)';
      ctx.fillRect(-22, -4, 44, 8);
      ctx.fillStyle = ink;
      ctx.fillRect(-22, -44, 44, 42);
      ctx.fillStyle = G.Pal.paperDark;
      ctx.fillRect(-22, -44, 44, 8);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(-22, -44, 44, 8);
      ctx.fillStyle = this.onSlot ? G.C.red : G.Pal.paper;
      ctx.font = G.font(28, 'title');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.letter, 0, -18);
      ctx.fillStyle = G.Pal.paper;
      Art.gouges(ctx, -18, -34, 36, 30, 3, this.letter.charCodeAt(0), G.Pal.paper, 5, 0.2, 1);
      ctx.restore();
    }
  }
  E.Block = Block;

  class Slot extends Ent {
    constructor(o) {
      super(o);
      this.kind = 'slot';
    }
    sortY() {
      return this.y - 2000;
    }
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y - 18);
      ctx.strokeStyle = this.filled ? G.C.red : G.Pal.ink;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(-22, -20, 44, 40);
      ctx.setLineDash([]);
      ctx.globalAlpha = this.filled ? 0.8 : 0.35;
      ctx.fillStyle = this.filled ? G.C.red : G.Pal.ink;
      ctx.font = G.font(26, 'title');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.letter, 0, 2);
      ctx.restore();
    }
  }
  E.Slot = Slot;

  // portão que abre com flag
  class Gate extends Ent {
    constructor(o) {
      super(o);
      this.kind = 'gate';
      this.cw = o.cw || T * (o.wt || 1);
      this.ch = o.ch || 30;
      this.openK = this.isOpen() ? 1 : 0;
    }
    isOpen() {
      return !!G.state.flags[this.flag];
    }
    get solid() {
      return this.openK < 0.5;
    }
    set solid(v) { /* derivado */ }
    update(dt, W) {
      this.baseUpdate(dt);
      const o = this.isOpen();
      if (o && this.openK < 1) {
        if (this.openK === 0) {
          Au.sfx('rumble', { dur: 1 });
          W.shake(4, 0.6);
        }
        this.openK = Math.min(1, this.openK + dt * 1.2);
        if (Math.random() < 0.5) W.fx.dust(this.x + (Math.random() - 0.5) * this.cw, this.y, 1);
      }
    }
    draw(ctx) {
      if (this.openK >= 1) return;
      const ink = G.Pal.ink;
      if (this.style === 'pedra') {
        ctx.save();
        ctx.translate(this.x, this.y);
        const k = this.openK;
        ctx.globalAlpha = 1 - k;
        ctx.translate(0, k * 30);
        ctx.scale(1, 1 - k * 0.6);
        ctx.fillStyle = ink;
        Art.blob(ctx, 0, -40, this.cw * 0.55, 46, 7, 0.16, 77);
        ctx.fill();
        ctx.fillStyle = G.Pal.paper;
        Art.star(ctx, 0, -50, 14, 6, 6);
        ctx.fill();
        Art.gouges(ctx, -60, -70, 120, 50, 8, 9, G.Pal.paper, 12, 0, 2);
        ctx.restore();
        return;
      }
      const h = 60 * (1 - this.openK);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.beginPath();
      ctx.rect(-this.cw / 2 - 4, -90, this.cw + 8, 90);
      ctx.clip();
      ctx.fillStyle = ink;
      ctx.fillRect(-this.cw / 2, -h - 4, this.cw, h + 4);
      ctx.fillStyle = G.Pal.paper;
      if (this.style === 'letras') {
        ctx.font = G.font(22, 'title');
        ctx.textAlign = 'center';
        ctx.fillText('S · O · L', 0, -h + 28);
      } else {
        for (let i = 0; i < this.cw / 12; i++) ctx.fillRect(-this.cw / 2 + 4 + i * 12, -h, 3, h);
      }
      ctx.restore();
    }
  }
  E.Gate = Gate;

  // obstáculo quebrável (rocha rachada, nó cego, caixa)
  class Breakable extends Ent {
    constructor(o) {
      super(o);
      this.kind = 'breakable';
      this.solid = true;
      this.cw = o.cw || 44;
      this.ch = o.ch || 30;
      this.hp = o.hp || 1;
      this.by = o.by || 'stamp'; // stamp | whip | any
      this.hr = 24;
      this.hy = 20;
    }
    get broken() {
      return !!(this.fid && G.state.flags['quebrou_' + this.fid]);
    }
    hit(W, how) {
      if (this.by !== 'any' && this.by !== how) {
        if (!this.hintT || this.hintT < 0) {
          W.toast(this.by === 'stamp' ? 'Parece que só um bom Carimbo quebra isso...' : 'Precisa de mais força.', 1.6);
          this.hintT = 2;
        }
        Au.sfx('shield', { vol: 0.5 });
        return;
      }
      this.hp--;
      this.flash = 0.2;
      if (this.hp <= 0) {
        this.dead = true;
        if (this.fid) G.state.flags['quebrou_' + this.fid] = true;
        Au.sfx('boom', { vol: 0.6 });
        W.shake(5, 0.3);
        W.fx.burst(this.x, this.y - 20, 14, { type: this.style === 'caixa' ? 'paper' : 'ink', size: 4, speed: 160, splat: this.style !== 'caixa' });
        if (this.drop) W.dropLoot(this.x, this.y, this.drop);
      }
    }
    update(dt, W) {
      this.baseUpdate(dt);
      if (this.hintT) this.hintT -= dt;
      if (this.broken) this.dead = true;
      void W;
    }
    draw(ctx) {
      const ink = G.Pal.ink;
      ctx.save();
      ctx.translate(this.x, this.y);
      const fl = flashColor(this);
      if (this.style === 'no') {
        ctx.strokeStyle = fl || '#fbf6ea';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(-26, -10);
        ctx.bezierCurveTo(-10, -50, 10, 10, 26, -30);
        ctx.moveTo(-26, -30);
        ctx.bezierCurveTo(-10, 10, 10, -50, 26, -10);
        ctx.stroke();
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        SP.dot(ctx, 0, -20, 11, '#fbf6ea', ink, 2);
        ctx.fillStyle = ink;
        ctx.font = G.font(9, 'title');
        ctx.textAlign = 'center';
        ctx.fillText('NÓ', 0, -17);
      } else if (this.style === 'caixa') {
        ctx.fillStyle = fl || '#b88d5a';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2;
        ctx.fillRect(-20, -38, 40, 38);
        ctx.strokeRect(-20, -38, 40, 38);
        ctx.beginPath();
        ctx.moveTo(-20, -38);
        ctx.lineTo(20, 0);
        ctx.moveTo(20, -38);
        ctx.lineTo(-20, 0);
        ctx.stroke();
        ctx.fillStyle = 'rgba(240,220,170,0.85)';
        ctx.fillRect(-4, -38, 8, 38);
      } else {
        ctx.fillStyle = fl || ink;
        Art.blob(ctx, 0, -22, 26, 22, 6, 0.18, 44);
        ctx.fill();
        ctx.strokeStyle = G.Pal.paper;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, -44);
        ctx.lineTo(3, -30);
        ctx.lineTo(-5, -20);
        ctx.lineTo(4, -6);
        ctx.moveTo(3, -30);
        ctx.lineTo(14, -26);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  E.Breakable = Breakable;

  // sino de bilro (acerta com o Pregador)
  class Bell extends Ent {
    constructor(o) {
      super(o);
      this.kind = 'bell';
      this.solid = true;
      this.cw = 20;
      this.ch = 12;
      this.hr = 18;
      this.hy = 58;
      this.swing = 0;
    }
    get rung() {
      return !!G.state.flags['sino_' + this.fid];
    }
    ring(W) {
      this.swing = 1;
      Au.sfx('bell');
      if (!this.rung) {
        G.state.flags['sino_' + this.fid] = true;
        W.onBellRung(this);
      }
    }
    update(dt, W) {
      this.baseUpdate(dt);
      this.swing *= Math.pow(0.3, dt);
      if (this.rung) W.light(this.x, this.y - 50, 130, 0.8);
    }
    draw(ctx) {
      const ink = G.Pal.ink;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = 'rgba(20,12,6,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 4, 0, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.fillRect(-3, -80, 6, 80);
      ctx.fillRect(-22, -82, 44, 5);
      ctx.translate(0, -76);
      ctx.rotate(Math.sin(this.t * 14) * this.swing * 0.6);
      // bilro gigante como badalo
      ctx.fillStyle = this.rung ? G.C.gold : G.Pal.mid;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(3, 0);
      ctx.lineTo(4, 10);
      ctx.quadraticCurveTo(14, 20, 10, 32);
      ctx.lineTo(-10, 32);
      ctx.quadraticCurveTo(-14, 20, -4, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      SP.dot(ctx, 0, 36, 5, ink);
      ctx.fillStyle = G.Pal.paper;
      Art.gouge(ctx, -4, 20, 8, 1.3, 1.5);
      ctx.restore();
      if (!this.rung) {
        ctx.save();
        ctx.fillStyle = G.C.red;
        ctx.font = G.font(16, 'title');
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.6 + Math.sin(this.t * 4) * 0.4;
        ctx.fillText('♪', this.x + 20, this.y - 90);
        ctx.restore();
      }
    }
  }
  E.Bell = Bell;

  // eco de memória (Margem)
  class Eco extends Interactable {
    constructor(o) {
      super(o);
      this.kind = 'eco';
      this.solid = false;
      this.cw = 40;
      this.ch = 20;
      this.eh = 80;
    }
    get seen() {
      return !!G.state.flags['eco_' + this.fid];
    }
    verb() {
      return 'Lembrar';
    }
    interact(W) {
      G.state.flags['eco_' + this.fid] = true;
      W.playMemory(this);
    }
    update(dt, W) {
      this.baseUpdate(dt);
      W.light(this.x, this.y - 30, 140, 0.8);
    }
    draw(ctx) {
      const t = this.t;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.globalAlpha = this.seen ? 0.45 : 1;
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.5 + i / 3) % 1;
        ctx.strokeStyle = 'rgba(199,64,42,' + (1 - k) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10 + k * 30, (10 + k * 30) * 0.5, 0, 0, U.TAU);
        ctx.stroke();
      }
      ctx.translate(0, -34 + Math.sin(t * 2) * 5);
      ctx.rotate(Math.sin(t) * 0.1);
      ctx.fillStyle = '#f3ead6';
      ctx.strokeStyle = G.C.red;
      ctx.lineWidth = 2;
      ctx.fillRect(-16, -20, 32, 40);
      ctx.strokeRect(-16, -20, 32, 40);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.moveTo(-10, -12 + i * 7);
        ctx.lineTo(10 - (i % 2) * 5, -12 + i * 7);
      }
      ctx.lineWidth = 1.2;
      ctx.stroke();
      Art.heart(ctx, 0, -26, 12, 1, { lw: 1 });
      ctx.restore();
    }
  }
  E.Eco = Eco;

  // alavanca de reinício do quebra-cabeça
  class Lever extends Interactable {
    constructor(o) {
      super(o);
      this.kind = 'lever';
      this.cw = 20;
      this.ch = 12;
      this.pulled = 0;
    }
    verb() {
      return 'Puxar';
    }
    interact(W) {
      this.pulled = 1;
      Au.sfx('clank');
      W.resetPuzzle && W.resetPuzzle(this.puzzle);
    }
    update(dt) {
      this.baseUpdate(dt);
      this.pulled = Math.max(0, this.pulled - dt);
    }
    draw(ctx) {
      const ink = G.Pal.ink;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = ink;
      ctx.fillRect(-12, -10, 24, 10);
      ctx.save();
      ctx.translate(0, -8);
      ctx.rotate(this.pulled > 0 ? 0.6 : -0.6);
      ctx.fillRect(-2, -30, 4, 30);
      SP.dot(ctx, 0, -32, 5, G.C.red, ink, 1.5);
      ctx.restore();
      ctx.restore();
    }
  }
  E.Lever = Lever;

  // item especial no chão (ex.: bilro de ouro)
  class Item extends Interactable {
    constructor(o) {
      super(o);
      this.kind = 'item';
      this.solid = false;
      this.cw = 24;
      this.ch = 14;
    }
    get interactive() {
      return !G.state.flags['item_' + this.item];
    }
    verb() {
      return 'Pegar';
    }
    interact(W) {
      G.state.flags['item_' + this.item] = true;
      this.dead = true;
      W.gotItem(this.item);
    }
    update(dt) {
      this.baseUpdate(dt);
      if (G.state.flags['item_' + this.item]) this.dead = true;
    }
    draw(ctx) {
      const y = this.y - 16 + Math.sin(this.t * 3) * 3;
      ctx.save();
      ctx.fillStyle = 'rgba(20,12,6,0.2)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, 10, 3, 0, 0, U.TAU);
      ctx.fill();
      ctx.translate(this.x, y);
      ctx.fillStyle = G.C.gold;
      ctx.strokeStyle = G.Pal.ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, -4, 4, 8, 0, 0, U.TAU);
      ctx.fill();
      ctx.stroke();
      SP.dot(ctx, 0, 7, 4, G.C.gold, G.Pal.ink, 1.5);
      if (Math.sin(this.t * 4) > 0.3) {
        ctx.fillStyle = G.C.paperLight;
        Art.star(ctx, 7, -10, 5, 1.5, 4);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  E.Item = Item;

  // esmagador (Cidade): carimbo gigante que cai no ritmo
  class Crusher extends Ent {
    constructor(o) {
      super(o);
      this.kind = 'hazard';
      this.period = o.period || 2.2;
      this.offset = o.offset || 0;
      this.w = o.w || 80;
      this.h = o.h || 60;
    }
    update(dt, W) {
      this.baseUpdate(dt);
      const k = ((W.time + this.offset) % this.period) / this.period;
      const prev = this.k || 0;
      this.k = k;
      if (prev < 0.8 && k >= 0.8) {
        Au.sfx('stamp', { vol: U.clamp(1 - U.dist(this.x, this.y, W.player.x, W.player.y) / 600, 0, 0.8) });
        W.fx.dust(this.x, this.y, 6, { size: 7 });
        const p = W.player;
        if (Math.abs(p.x - this.x) < this.w / 2 && Math.abs(p.y - this.y) < this.h / 2 + 4 && p.state !== 'dodge') W.hurtPlayer(1, this.x, this.y - 40);
        if (U.dist(this.x, this.y, p.x, p.y) < 300) W.shake(3, 0.15);
      }
    }
    sortY() {
      return this.y + this.h / 2;
    }
    draw(ctx) {
      const k = this.k || 0;
      let lift;
      if (k < 0.6) lift = 1;
      else if (k < 0.8) lift = 1 - U.ease.inCubic((k - 0.6) / 0.2);
      else if (k < 0.9) lift = 0;
      else lift = (k - 0.9) / 0.1;
      const ink = G.Pal.ink;
      ctx.save();
      // área de sombra
      ctx.fillStyle = 'rgba(194,58,34,' + (0.1 + (1 - lift) * 0.25) + ')';
      ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
      ctx.strokeStyle = G.C.red;
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
      ctx.setLineDash([]);
      const top = this.y + this.h / 2 - 20 - lift * 110;
      ctx.fillStyle = ink;
      ctx.fillRect(this.x - 6, top - 200, 12, 180);
      ctx.fillStyle = G.Pal.mid;
      ctx.fillRect(this.x - this.w / 2, top - 40, this.w, 30);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x - this.w / 2, top - 40, this.w, 30);
      ctx.fillStyle = G.C.red;
      ctx.fillRect(this.x - this.w / 2 + 4, top - 10, this.w - 8, 10);
      ctx.fillStyle = G.Pal.paper;
      ctx.font = G.font(11, 'title');
      ctx.textAlign = 'center';
      ctx.fillText('CONFISCADO', this.x, top - 20);
      ctx.restore();
    }
  }
  E.Crusher = Crusher;

  // decoração animada (pássaros no céu, bandeirinhas)
  class Overhead extends Ent {
    constructor(o) {
      super(o);
      this.kind = 'over';
    }
    sortY() {
      return 1e9;
    }
    draw(ctx) {
      if (this.type === 'bunting') Art.bunting(ctx, this.x1, this.y1, this.x2, this.y2, this.n || 10, G.time, this.sag || 20);
    }
  }
  E.Overhead = Overhead;

  // ------------------------------------------------------------------
  // Fábrica
  // ------------------------------------------------------------------
  E.extra = {};
  E.create = function (d) {
    const o = Object.assign({}, d);
    if (E.extra[d.kind]) return new E.extra[d.kind](o);
    switch (d.kind) {
      case 'npc': return new NPC(o);
      case 'critter': return new Critter(o);
      case 'sign': return new Sign(o);
      case 'chest': return new Chest(o);
      case 'candeeiro': return new Candeeiro(o);
      case 'cordao': return new Cordao(o);
      case 'block': return new Block(o);
      case 'slot': return new Slot(o);
      case 'gate': return new Gate(o);
      case 'breakable': return new Breakable(o);
      case 'bell': return new Bell(o);
      case 'eco': return new Eco(o);
      case 'lever': return new Lever(o);
      case 'item': return new Item(o);
      case 'crusher': return new Crusher(o);
      case 'over': return new Overhead(o);
      default:
        if (G.Enemies && G.Enemies.create) {
          const e = G.Enemies.create(o);
          if (e) return e;
        }
        if (G.Bosses && G.Bosses[d.kind]) return new G.Bosses[d.kind](o);
        console.warn('entidade desconhecida', d.kind);
        return null;
    }
  };
})();
