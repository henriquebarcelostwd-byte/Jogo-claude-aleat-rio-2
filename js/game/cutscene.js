/* PELEJA — roteirizador de cenas (câmera, atores, falas, efeitos, escolhas) */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;
  const Au = G.Audio;
  const Inp = G.Input;
  const T = G.TILE;

  function parseSay(s) {
    // "quem.expressão|texto"  ou  "quem|texto"
    const bar = s.indexOf('|');
    const head = s.slice(0, bar);
    const text = s.slice(bar + 1);
    const [who, expr] = head.split('.');
    if (who === 'narr') return { narr: true, text };
    return { who, expr: expr || 'neutro', text };
  }

  class Cutscene {
    constructor(W, steps, onDone) {
      this.W = W;
      this.q = steps.slice();
      this.cur = null;
      this.onDone = onDone;
      this.done = false;
    }
    pos(v) {
      const W = this.W;
      if (!v) return null;
      if (Array.isArray(v)) return { x: v[0], y: v[1] };
      if (typeof v === 'string') {
        const e = W.find(v);
        if (e) return { x: e.x, y: e.y };
        if (W.map.pts[v]) return W.map.pts[v];
        return null;
      }
      if (v.pt) {
        const p = W.map.pts[v.pt];
        return p ? { x: p.x + (v.dx || 0), y: p.y + (v.dy || 0) } : null;
      }
      if (v.tile) return { x: v.tile[0] * T + T / 2, y: v.tile[1] * T + T * 0.75 };
      if (v.rel) {
        const e = W.find(v.rel);
        return e ? { x: e.x + (v.dx || 0), y: e.y + (v.dy || 0) } : null;
      }
      return v;
    }
    update(dt) {
      let guard = 0;
      while (!this.done && guard++ < 200) {
        if (!this.cur) {
          if (!this.q.length) {
            this.done = true;
            if (this.onDone) this.onDone();
            break;
          }
          const step = this.q.shift();
          this.cur = this.start(step);
          if (!this.cur) continue;
        }
        if (this.cur.update(dt)) {
          this.cur = null;
          dt = 0;
          continue;
        }
        break;
      }
    }
    // cria uma tarefa para o passo (ou executa na hora e devolve null)
    start(step) {
      const W = this.W;
      if (typeof step === 'function') {
        step(W);
        return null;
      }
      if (typeof step === 'string') step = parseSay(step);
      if (step.text != null && (step.who || step.narr)) return this.sayTask(step);
      if (step.narr != null && typeof step.narr === 'string') return this.sayTask({ narr: true, text: step.narr });

      if (step.wait != null && Object.keys(step).length === 1) {
        let t = step.wait;
        return { update: (dt) => (t -= dt) <= 0 };
      }
      if (step.choice) return this.choiceTask(step);
      if (step.if !== undefined) {
        const ok = typeof step.if === 'function' ? step.if(W) : !!G.state.flags[step.if];
        const branch = ok ? step.then : step.else;
        if (branch) this.q.unshift(...branch);
        return null;
      }
      if (step.cam !== undefined) {
        const p = step.cam === 'player' ? { x: W.player.x, y: W.player.y - 30 } : this.pos(step.cam);
        const dur = step.t != null ? step.t : 1;
        W.camTo(p ? p.x : W.cam.x, p ? p.y + (step.dy || 0) : W.cam.y, dur, step.zoom, step.ease);
        if (step.wait === false || dur <= 0) return null;
        let t = dur;
        return { update: (dt) => (t -= dt) <= 0 };
      }
      if (step.camFollow) {
        W.camFollow(step.t != null ? step.t : 0.8);
        let t = step.t != null ? step.t : 0.8;
        if (step.wait === false) return null;
        return { update: (dt) => (t -= dt) <= 0 };
      }
      if (step.move) {
        const e = W.find(step.move);
        const p = this.pos(step.to);
        if (!e || !p) return null;
        e.goTo(p.x + (step.dx || 0), p.y + (step.dy || 0), step.speed || 110);
        if (step.wait === false) return null;
        return { update: () => !e.goal };
      }
      if (step.tp) {
        const e = W.find(step.tp);
        const p = this.pos(step.to);
        if (e && p) {
          e.x = p.x + (step.dx || 0);
          e.y = p.y + (step.dy || 0);
          e.goal = null;
          if (step.dir) e.dir = step.dir;
        }
        return null;
      }
      if (step.face) {
        const e = W.find(step.face);
        if (e) {
          if (step.to) {
            const o = this.pos(step.to);
            if (o) e.dir = U.dirName(o.x - e.x, o.y - e.y);
          } else e.dir = step.dir;
          if (e.baseDir) e.baseDir = e.dir;
        }
        return null;
      }
      if (step.emote) {
        const e = W.find(step.emote);
        if (e) {
          e.showEmote(step.e, step.t || 1.6);
          if (step.e === '!') Au.sfx('menuMove');
        }
        if (step.wait) {
          let t = step.wait;
          return { update: (dt) => (t -= dt) <= 0 };
        }
        return null;
      }
      if (step.pose !== undefined) {
        const e = W.find(step.pose);
        if (e) e.pose = step.p || null;
        return null;
      }
      if (step.face2 !== undefined) {
        const e = W.find(step.face2);
        if (e) e.face = step.f || null;
        return null;
      }
      if (step.spawn) {
        W.spawn(step.spawn);
        return null;
      }
      if (step.despawn) {
        const e = W.find(step.despawn);
        if (e) e.dead = true;
        return null;
      }
      if (step.alpha !== undefined) {
        const e = W.find(step.alpha);
        if (e) {
          const a0 = e.alpha != null ? e.alpha : 1;
          const a1 = step.to;
          const dur = step.t || 0.5;
          let t = 0;
          return {
            update: (dt) => {
              t += dt;
              e.alpha = U.lerp(a0, a1, Math.min(1, t / dur));
              return t >= dur;
            },
          };
        }
        return null;
      }
      if (step.shake) {
        W.shake(step.shake, step.t || 0.4);
        return null;
      }
      if (step.flash) {
        W.flash(step.flash === true ? '#fff8e0' : step.flash, step.t || 0.4);
        return null;
      }
      if (step.fade) {
        W.fadeTo(step.fade === 'out' ? 1 : 0, step.t || 0.6, step.color);
        let t = step.t || 0.6;
        if (step.wait === false) return null;
        return { update: (dt) => (t -= dt) <= 0 };
      }
      if (step.music !== undefined) {
        if (step.music) Au.play(step.music, step.opt || {});
        else Au.stop(step.fadeT || 1);
        return null;
      }
      if (step.jingle) {
        Au.jingle(step.jingle, step.after);
        return null;
      }
      if (step.sfx) {
        Au.sfx(step.sfx, step.opt || {});
        return null;
      }
      if (step.amb !== undefined) {
        Au.ambient(step.amb);
        return null;
      }
      if (step.bars !== undefined) {
        W.bars = step.bars;
        return null;
      }
      if (step.title) {
        W.showTitle(step.title, step.sub, step.dur || 3.6);
        return { update: () => !W.titleCard };
      }
      if (step.do) {
        step.do(W);
        return null;
      }
      if (step.until) {
        return { update: () => step.until(W) };
      }
      if (step.run) {
        let fin = false;
        step.run(W, () => (fin = true));
        return { update: () => fin };
      }
      if (step.give) {
        W.giveAbility(step.give);
        return { update: () => !W.popup };
      }
      if (step.flag) {
        G.state.flags[step.flag] = step.v !== undefined ? step.v : true;
        W.refreshObjective();
        return null;
      }
      if (step.objective !== undefined) {
        W.refreshObjective(true);
        return null;
      }
      if (step.panel) {
        W.showPanel(step.panel, step.dur || 5, step);
        return { update: () => !W.panel };
      }
      if (step.checkpoint) {
        W.checkpoint(step.at ? this.pos(step.at) : null);
        return null;
      }
      if (step.peleja) {
        let fin = false;
        W.startPeleja(step.peleja, () => (fin = true));
        return { update: () => fin };
      }
      if (step.toast) {
        W.toast(step.toast, step.t || 2.2);
        return null;
      }
      if (step.par) {
        const subs = step.par.map((s) => new Cutscene(W, [s]));
        return {
          update: (dt) => {
            for (const s of subs) if (!s.done) s.update(dt);
            return subs.every((s) => s.done);
          },
        };
      }
      if (step.hint) {
        W.showHint(step.hint, step.keys, step.t || 5);
        return null;
      }
      console.warn('passo desconhecido', step);
      return null;
    }
    sayTask(line) {
      const W = this.W;
      const actor = line.who ? W.find(line.who === 'zab' ? 'zab' : line.who) : null;
      return {
        started: false,
        update: () => {
          if (!this.started) {
            this.started = true;
          }
          if (!W.dlg.active || W.dlg.line !== line) {
            if (!line._opened) {
              line._opened = true;
              W.dlg.open(line);
              if (G.Save && line.who) G.Save.meet(line.who);
            }
          }
          if (actor) actor.talking = W.dlg.typing;
          if (W.dlg.done) {
            if (actor) actor.talking = false;
            const nxt = this.q[0];
            const nextIsSay = typeof nxt === 'string' || (nxt && (nxt.text != null || nxt.narr != null || nxt.choice));
            if (!nextIsSay) W.dlg.close();
            line._opened = false;
            return true;
          }
          return false;
        },
      };
    }
    choiceTask(step) {
      const W = this.W;
      const opts = step.choice.filter((o) => !o.if || o.if(W));
      let opened = false;
      return {
        update: () => {
          if (!opened) {
            opened = true;
            W.dlg.openChoice(step.prompt, opts, { who: step.who, expr: step.expr });
          }
          if (W.dlg.done) {
            const o = opts[W.dlg.result];
            W.dlg.close();
            if (o.set) for (const k in o.set) G.state.flags[k] = o.set[k];
            if (o.steps) this.q.unshift(...o.steps);
            if (step.key) G.state.flags[step.key] = o.id || W.dlg.result;
            return true;
          }
          return false;
        },
      };
    }
  }
  G.Cutscene = Cutscene;
  G.parseSay = parseSay;
  void Inp;
})();
