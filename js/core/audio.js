/* PELEJA — motor de áudio procedural (Web Audio)
   Tudo aqui é sintetizado: sanfona, pífano, rabeca, viola, zabumba, triângulo…
*/
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;

  const A = (G.Audio = {
    ctx: null,
    ok: false,
    playing: [],
    cur: null,
    curName: null,
    songStart: 0,
    bpm: 120,
    ambName: null,
    amb: null,
    pending: null,
    lastBlip: 0,
  });

  // ------------------------------------------------------------------
  // Notas e acordes
  // ------------------------------------------------------------------
  const NI = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const midiF = (m) => 440 * Math.pow(2, (m - 69) / 12);
  A.nf = function (name) {
    const m = /^([A-G](?:#|b)?)(-?\d)$/.exec(name);
    if (!m) return 0;
    return midiF(NI[m[1]] + (parseInt(m[2], 10) + 1) * 12);
  };
  const CT = {
    '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11],
    dim: [0, 3, 6], sus4: [0, 5, 7], add9: [0, 4, 7, 14], m9: [0, 3, 7, 14], m6: [0, 3, 7, 9],
  };
  function chord(name) {
    const m = /^([A-G](?:#|b)?)(.*)$/.exec(name);
    const r = NI[m[1]];
    const root = 48 + r;
    const iv = CT[m[2]] || CT[''];
    return {
      name,
      root: midiF(root),
      bass: midiF(root - 12),
      fifth: midiF(root - 12 + 7),
      notes: iv.map((x) => midiF(root + x)),
    };
  }
  function parseMel(str, total) {
    const out = new Array(total).fill(null);
    if (!str) return out;
    let pos = 0;
    for (const tok of str.trim().split(/\s+/)) {
      const [n, l] = tok.split(':');
      const len = parseInt(l, 10) || 1;
      if (n !== '_' && pos < total) out[pos] = { f: A.nf(n), len };
      pos += len;
    }
    return out;
  }

  // ------------------------------------------------------------------
  // Inicialização
  // ------------------------------------------------------------------
  A.init = function () {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch (e) {
      this.ctx = null;
      return;
    }
    const c = this.ctx;
    this.comp = c.createDynamicsCompressor();
    this.comp.threshold.value = -16;
    this.comp.knee.value = 12;
    this.comp.ratio.value = 3.5;
    this.comp.attack.value = 0.004;
    this.comp.release.value = 0.2;
    this.master = c.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.comp);
    this.comp.connect(c.destination);

    this.reverb = c.createConvolver();
    this.reverb.buffer = this._impulse(2.2, 2.8);
    this.revIn = c.createGain();
    this.revIn.gain.value = 1;
    this.revIn.connect(this.reverb);
    this.revOut = c.createGain();
    this.revOut.gain.value = 0.28;
    this.reverb.connect(this.revOut);
    this.revOut.connect(this.master);

    this.musicBus = c.createGain();
    this.musicBus.connect(this.master);
    this.musicSend = c.createGain();
    this.musicSend.gain.value = 0.3;
    this.musicBus.connect(this.musicSend);
    this.musicSend.connect(this.revIn);

    this.sfxBus = c.createGain();
    this.sfxBus.connect(this.master);
    this.sfxSend = c.createGain();
    this.sfxSend.gain.value = 0.12;
    this.sfxBus.connect(this.sfxSend);
    this.sfxSend.connect(this.revIn);

    this.ambBus = c.createGain();
    this.ambBus.connect(this.master);

    this._noise = this._makeNoise(2.5);
    this.applyVolumes();
    this.ok = true;
    this._timer = setInterval(() => this._tick(), 25);
  };

  A.unlock = function () {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        if (this.pending) {
          const p = this.pending;
          this.pending = null;
          this.play(p.name, p.opt);
        }
        if (this.pendingAmb) {
          const a = this.pendingAmb;
          this.pendingAmb = null;
          this.ambient(a);
        }
      });
    }
  };

  A.running = function () {
    return !!(this.ctx && this.ctx.state === 'running');
  };
  A.now = function () {
    return this.running() ? this.ctx.currentTime : performance.now() / 1000;
  };

  A.applyVolumes = function () {
    if (!this.ctx) return;
    const s = (G.Save && G.Save.settings) || { music: 0.7, sfx: 0.8 };
    const t = this.ctx.currentTime;
    const mv = Math.pow(s.music, 1.4) * 0.62;
    const sv = Math.pow(s.sfx, 1.2) * 0.9;
    this.musicBus.gain.setTargetAtTime(mv, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(sv, t, 0.05);
    this.ambBus.gain.setTargetAtTime(sv * 0.7, t, 0.05);
  };

  A._makeNoise = function (sec) {
    const c = this.ctx;
    const len = Math.floor(c.sampleRate * sec);
    const b = c.createBuffer(1, len, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  };
  A._impulse = function (sec, decay) {
    const c = this.ctx;
    const len = Math.floor(c.sampleRate * sec);
    const b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  };

  // ------------------------------------------------------------------
  // Primitivas
  // ------------------------------------------------------------------
  function osc(type, f, t, dur) {
    const o = A.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.start(t);
    o.stop(t + dur + 0.05);
    return o;
  }
  function gain(v = 1) {
    const g = A.ctx.createGain();
    g.gain.value = v;
    return g;
  }
  function filt(type, f, q = 0.8) {
    const b = A.ctx.createBiquadFilter();
    b.type = type;
    b.frequency.value = f;
    b.Q.value = q;
    return b;
  }
  function noiseSrc(t, dur) {
    const s = A.ctx.createBufferSource();
    s.buffer = A._noise;
    s.loop = true;
    s.start(t, Math.random() * 2);
    s.stop(t + dur + 0.05);
    return s;
  }
  // envelope: ataque linear, queda exponencial
  function envAD(g, t, a, d, peak) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function envASR(g, t, a, sus, r, peak, sustainLevel = 0.85) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.linearRampToValueAtTime(peak * sustainLevel, t + a + Math.max(0.01, sus));
    g.gain.linearRampToValueAtTime(0.0001, t + a + Math.max(0.01, sus) + r);
  }
  function chain(...nodes) {
    for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
    return nodes[nodes.length - 1];
  }

  // ------------------------------------------------------------------
  // Instrumentos
  // ------------------------------------------------------------------
  const INS = (A.INS = {
    accordion(t, f, dur, v, dst) {
      const env = gain(0);
      envASR(env, t, 0.025, dur, 0.09, v, 0.8);
      const lp = filt('lowpass', Math.min(4200, f * 5.5), 0.7);
      const trem = gain(1);
      const lfo = osc('sine', 5.3, t, dur + 0.15);
      const lg = gain(0.16);
      chain(lfo, lg, trem.gain);
      const o1 = osc('sawtooth', f, t, dur + 0.15);
      o1.detune.value = -9;
      const o2 = osc('sawtooth', f, t, dur + 0.15);
      o2.detune.value = 9;
      const o3 = osc('square', f / 2, t, dur + 0.15);
      const g3 = gain(0.22);
      o1.connect(lp);
      o2.connect(lp);
      chain(o3, g3, lp);
      chain(lp, trem, env, dst);
    },
    fife(t, f, dur, v, dst) {
      const env = gain(0);
      envASR(env, t, 0.035, dur, 0.12, v, 0.9);
      const o = osc('sine', f, t, dur + 0.2);
      const o2 = osc('triangle', f * 2, t, dur + 0.2);
      const g2 = gain(0.1);
      const vib = osc('sine', 5.6, t, dur + 0.2);
      const vg = gain(0);
      vg.gain.setValueAtTime(0, t);
      vg.gain.linearRampToValueAtTime(f * 0.013, t + Math.min(0.35, dur));
      chain(vib, vg, o.frequency);
      vg.connect(o2.frequency);
      o.connect(env);
      chain(o2, g2, env);
      env.connect(dst);
      // sopro
      const n = noiseSrc(t, 0.12);
      const bp = filt('bandpass', f * 1.5, 2.5);
      const ng = gain(0);
      envAD(ng, t, 0.01, 0.1, v * 0.35);
      chain(n, bp, ng, dst);
    },
    fiddle(t, f, dur, v, dst) {
      const env = gain(0);
      envASR(env, t, 0.07, dur, 0.16, v, 0.85);
      const o = osc('sawtooth', f, t, dur + 0.25);
      const o2 = osc('sawtooth', f * 1.003, t, dur + 0.25);
      const vib = osc('sine', 6.2, t, dur + 0.25);
      const vg = gain(0);
      vg.gain.setValueAtTime(0, t);
      vg.gain.linearRampToValueAtTime(f * 0.009, t + Math.min(0.3, dur));
      chain(vib, vg, o.frequency);
      vg.connect(o2.frequency);
      const bp = filt('peaking', 1500, 1);
      bp.gain.value = 6;
      const lp = filt('lowpass', 3600, 0.6);
      o.connect(bp);
      o2.connect(bp);
      chain(bp, lp, env, dst);
    },
    viola(t, f, dur, v, dst) {
      const len = Math.min(1.6, dur + 0.5);
      const env = gain(0);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(v, t + 0.004);
      env.gain.exponentialRampToValueAtTime(0.0001, t + len);
      const lp = filt('lowpass', 5200, 1.2);
      lp.frequency.setValueAtTime(5200, t);
      lp.frequency.exponentialRampToValueAtTime(650, t + 0.45);
      const o1 = osc('sawtooth', f, t, len);
      const o2 = osc('triangle', f * 2.004, t, len);
      const g2 = gain(0.45);
      o1.connect(lp);
      chain(o2, g2, lp);
      chain(lp, env, dst);
    },
    brass(t, f, dur, v, dst) {
      const env = gain(0);
      envASR(env, t, 0.02, dur, 0.07, v, 0.75);
      const lp = filt('lowpass', 700, 1.5);
      lp.frequency.setValueAtTime(600, t);
      lp.frequency.linearRampToValueAtTime(3200, t + 0.04);
      lp.frequency.linearRampToValueAtTime(1800, t + 0.2);
      const o1 = osc('sawtooth', f, t, dur + 0.12);
      const o2 = osc('sawtooth', f * 1.006, t, dur + 0.12);
      o1.connect(lp);
      o2.connect(lp);
      chain(lp, env, dst);
    },
    bass(t, f, dur, v, dst) {
      const env = gain(0);
      envAD(env, t, 0.008, Math.max(0.12, dur), v);
      const o = osc('triangle', f, t, dur + 0.3);
      const o2 = osc('sine', f, t, dur + 0.3);
      const lp = filt('lowpass', 700, 0.7);
      o.connect(lp);
      o2.connect(lp);
      chain(lp, env, dst);
    },
    tuba(t, f, dur, v, dst) {
      const env = gain(0);
      envASR(env, t, 0.02, dur * 0.7, 0.08, v, 0.7);
      const o = osc('square', f, t, dur + 0.15);
      const lp = filt('lowpass', 480, 1);
      chain(o, lp, env, dst);
    },
    pad(t, f, dur, v, dst) {
      const env = gain(0);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(v, t + Math.min(0.8, dur * 0.4));
      env.gain.linearRampToValueAtTime(v * 0.8, t + dur);
      env.gain.linearRampToValueAtTime(0.0001, t + dur + 1.0);
      const lp = filt('lowpass', 1400, 0.5);
      for (const d of [-7, 0, 7]) {
        const o = osc(d === 0 ? 'triangle' : 'sine', f, t, dur + 1.1);
        o.detune.value = d;
        o.connect(lp);
      }
      chain(lp, env, dst);
    },
    bell(t, f, dur, v, dst) {
      const len = Math.max(0.6, Math.min(2.5, dur + 1));
      const env = gain(0);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(v, t + 0.003);
      env.gain.exponentialRampToValueAtTime(0.0001, t + len);
      const o1 = osc('sine', f, t, len);
      const o2 = osc('sine', f * 2.76, t, len * 0.6);
      const g2 = gain(0.28);
      const o3 = osc('sine', f * 5.4, t, len * 0.3);
      const g3 = gain(0.1);
      o1.connect(env);
      chain(o2, g2, env);
      chain(o3, g3, env);
      env.connect(dst);
    },
  });
  INS.lead = INS.accordion;

  // percussão
  const DR = (A.DR = {
    zab(t, v, dst) {
      const o = osc('sine', 140, t, 0.4);
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(46, t + 0.13);
      const g = gain(0);
      envAD(g, t, 0.003, 0.34, v * 0.9);
      chain(o, g, dst);
      const n = noiseSrc(t, 0.05);
      const lp = filt('lowpass', 320, 0.7);
      const ng = gain(0);
      envAD(ng, t, 0.002, 0.045, v * 0.5);
      chain(n, lp, ng, dst);
    },
    bac(t, v, dst) {
      const n = noiseSrc(t, 0.06);
      const hp = filt('highpass', 1900, 0.8);
      const g = gain(0);
      envAD(g, t, 0.002, 0.05, v);
      chain(n, hp, g, dst);
    },
    tri(t, v, open, dst) {
      const len = open ? 0.55 : 0.07;
      const g = gain(0);
      envAD(g, t, 0.002, len, v * 0.5);
      for (const f of [2870, 4130, 5710]) {
        const o = osc('sine', f, t, len);
        o.connect(g);
      }
      g.connect(dst);
    },
    shaker(t, v, dst) {
      const n = noiseSrc(t, 0.06);
      const hp = filt('highpass', 6200, 0.7);
      const g = gain(0);
      envAD(g, t, 0.01, 0.045, v);
      chain(n, hp, g, dst);
    },
    snare(t, v, dst) {
      const n = noiseSrc(t, 0.16);
      const bp = filt('bandpass', 1900, 0.6);
      const g = gain(0);
      envAD(g, t, 0.002, 0.13, v);
      chain(n, bp, g, dst);
      const o = osc('triangle', 200, t, 0.08);
      const og = gain(0);
      envAD(og, t, 0.002, 0.06, v * 0.6);
      chain(o, og, dst);
    },
    pandeiro(t, v, dst) {
      const n = noiseSrc(t, 0.12);
      const hp = filt('highpass', 6800, 0.7);
      const g = gain(0);
      envAD(g, t, 0.002, 0.1, v * 0.7);
      chain(n, hp, g, dst);
      const o = osc('sine', 210, t, 0.1);
      o.frequency.exponentialRampToValueAtTime(120, t + 0.08);
      const og = gain(0);
      envAD(og, t, 0.002, 0.08, v * 0.8);
      chain(o, og, dst);
    },
  });

  function strum(instName, t, ch, dur, v, dst, spread = 0.009, up = false) {
    const ns = up ? ch.notes.slice().reverse() : ch.notes;
    ns.forEach((f, k) => INS[instName](t + k * spread, f, dur, v, dst));
  }

  // ------------------------------------------------------------------
  // Estilos rítmicos
  // ------------------------------------------------------------------
  const ST = {
    baiao(s, t, sd, S, d, ch) {
      if (s === 0 || s === 8) DR.zab(t, 0.95, d);
      else if (s === 3 || s === 11) DR.zab(t, 0.6, d);
      if (s === 4 || s === 12) DR.bac(t, 0.3, d);
      if (s === 6 || s === 14) DR.bac(t, 0.18, d);
      DR.tri(t, s % 4 === 2 ? 0.2 : 0.1, s % 4 === 2, d);
      if (s === 0 || s === 8) INS.bass(t, ch.bass, sd * 2.6, 0.34, d);
      if (s === 3 || s === 11) INS.bass(t, ch.bass, sd * 2.6, 0.28, d);
      if (s === 6 || s === 14) INS.bass(t, ch.fifth, sd * 1.8, 0.26, d);
      if (s === 2 || s === 10) strum(S.comp || 'accordion', t, ch, sd * 1.3, S.compVol || 0.035, d, 0.004);
    },
    xote(s, t, sd, S, d, ch) {
      if (s === 0 || s === 8) DR.zab(t, 0.85, d);
      if (s === 6 || s === 14) DR.zab(t, 0.45, d);
      if (s === 4 || s === 12) DR.bac(t, 0.28, d);
      if (s % 2 === 0) DR.tri(t, s % 4 === 2 ? 0.16 : 0.08, s % 4 === 2, d);
      if (s === 0) INS.bass(t, ch.bass, sd * 5, 0.32, d);
      if (s === 8) INS.bass(t, ch.fifth, sd * 5, 0.28, d);
      if (s === 4 || s === 12) strum(S.comp || 'accordion', t, ch, sd * 2, S.compVol || 0.03, d, 0.005);
    },
    toada(s, t, sd, S, d, ch) {
      if (s === 0) {
        INS.bass(t, ch.bass, sd * 7, 0.26, d);
        if (S.padVol !== 0) ch.notes.forEach((f) => INS.pad(t, f, sd * 15, S.padVol || 0.028, d));
      }
      if (s === 8) INS.bass(t, ch.fifth, sd * 7, 0.2, d);
      if (s % 2 === 0) {
        const seq = [0, 1, 2, 3, 2, 1, 0, 2];
        const n = ch.notes[seq[(s / 2) % seq.length] % ch.notes.length];
        INS.viola(t, n * (s === 6 ? 2 : 1), sd * 2, S.compVol || 0.05, d);
      }
    },
    valsa(s, t, sd, S, d, ch) {
      if (s === 0) {
        INS.bass(t, ch.bass, sd * 3, 0.32, d);
        DR.zab(t, 0.4, d);
      }
      if (s === 4 || s === 8) strum('viola', t, ch, sd * 3, S.compVol || 0.045, d, 0.012);
      if (s === 0 || s === 4 || s === 8) DR.tri(t, 0.07, false, d);
      if (s === 0) ch.notes.forEach((f) => INS.pad(t, f * 2, sd * 11, 0.012, d));
    },
    marcha(s, t, sd, S, d, ch) {
      if (s === 0 || s === 8) DR.zab(t, 0.8, d);
      if (s === 4 || s === 12) DR.snare(t, 0.28, d);
      if (s === 14) DR.snare(t, 0.1, d);
      if (s === 0) INS.tuba(t, ch.bass, sd * 3, 0.3, d);
      if (s === 8) INS.tuba(t, ch.fifth, sd * 3, 0.26, d);
      if (s === 4 || s === 12) strum('accordion', t, ch, sd * 1.4, S.compVol || 0.035, d, 0.003);
      if (s % 2 === 0) DR.shaker(t, 0.05, d);
    },
    frevo(s, t, sd, S, d, ch) {
      const acc = s === 0 || s === 3 || s === 6 || s === 10 || s === 12;
      DR.snare(t, acc ? 0.24 : 0.07, d);
      if (s === 0 || s === 8) DR.zab(t, 0.95, d);
      if (s === 6 || s === 14) DR.zab(t, 0.5, d);
      if (s % 2 === 0) INS.bass(t, s % 4 === 0 ? ch.bass : ch.fifth, sd * 1.8, 0.3, d);
      if (s === 2 || s === 10) strum('brass', t, ch, sd * 1.1, S.compVol || 0.04, d, 0.002);
    },
    repente(s, t, sd, S, d, ch) {
      if (s % 2 === 0) strum('viola', t, ch, sd * 2.2, s % 4 === 0 ? 0.075 : 0.045, d, 0.011, s % 4 === 2);
      if (s % 4 === 0) DR.pandeiro(t, s === 0 ? 0.5 : 0.32, d);
      if (s % 4 === 2) DR.shaker(t, 0.12, d);
      if (s === 0 || s === 8) DR.zab(t, 0.7, d);
      if (s === 0) INS.bass(t, ch.bass, sd * 6, 0.3, d);
      if (s === 8) INS.bass(t, ch.fifth, sd * 6, 0.26, d);
    },
    ambient(s, t, sd, S, d, ch, bar, loop, i) {
      if (s === 0) {
        ch.notes.forEach((f) => INS.pad(t, f / 2, sd * 16, 0.035, d));
        INS.pad(t, ch.bass / 2, sd * 16, 0.05, d);
      }
      if (U.hash(i, 77) < 0.12) {
        const n = ch.notes[(U.hash(i, 3) * ch.notes.length) | 0];
        INS.bell(t, n * (U.hash(i, 9) < 0.5 ? 2 : 4), 1, 0.035, d);
      }
    },
    tension(s, t, sd, S, d, ch) {
      if (s === 0) {
        DR.zab(t, 0.55, d);
        ch.notes.forEach((f) => INS.pad(t, f / 2, sd * 16, 0.03, d));
      }
      if (s === 3) DR.zab(t, 0.35, d);
    },
    none() {},
  };

  // ------------------------------------------------------------------
  // Músicas
  // ------------------------------------------------------------------
  const SONGS = (A.SONGS = {
    menu: {
      bpm: 72, style: 'toada', lead: 'fife', leadAlt: 'fiddle', leadVol: 0.16, compVol: 0.05,
      chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'E7', 'Am'],
      mel: 'A4:4 C5:2 D5:2 E5:8  F5:2 E5:2 D5:4 C5:4 A4:4  G4:4 C5:4 E5:4 D5:2 C5:2  B4:4 D5:4 G4:8  A4:4 C5:2 D5:2 E5:4 G5:4  A5:6 G5:2 F5:4 E5:4  D5:2 E5:2 D5:2 C5:2 B4:4 G#4:4  A4:12 _:4',
    },
    vila: {
      bpm: 118, style: 'baiao', lead: 'accordion', leadAlt: 'fife', leadVol: 0.12, compVol: 0.03,
      chords: ['G', 'G', 'F', 'G', 'C', 'C', 'D7', 'G7'],
      mel: 'D5:3 D5:3 B4:2 G4:2 A4:2 B4:2 D5:2  E5:3 D5:3 B4:2 A4:4 G4:4  F5:3 F5:3 E5:2 D5:2 C5:2 A4:4  B4:3 G4:3 A4:2 G4:8  E5:3 E5:3 G5:2 E5:2 D5:2 C5:4  E5:2 F5:2 G5:4 F5:2 E5:2 D5:4  D5:3 F#5:3 A5:2 F#5:2 E5:2 D5:4  B4:2 D5:2 G5:4 F5:2 D5:2 B4:4',
    },
    sertao: {
      bpm: 92, style: 'xote', lead: 'fife', leadAlt: 'fiddle', leadVol: 0.15, compVol: 0.022,
      chords: ['Em', 'Em', 'D', 'D', 'C', 'D', 'Em', 'Em'],
      mel: 'B4:4 E5:4 D5:2 E5:2 F#5:4  G5:4 F#5:2 E5:2 D5:4 B4:4  A4:4 D5:4 C#5:2 D5:2 E5:4  F#5:6 E5:2 D5:8  E5:4 G5:4 F#5:2 E5:2 D5:4  D5:4 F#5:4 A5:4 F#5:4  G5:2 F#5:2 E5:4 D5:2 B4:2 A4:4  B4:12 _:4',
    },
    acude: {
      bpm: 100, style: 'valsa', spb: 12, lead: 'fiddle', leadAlt: 'fife', leadVol: 0.12, compVol: 0.04,
      chords: ['D', 'A', 'Bm', 'F#m', 'G', 'D', 'Em', 'A7', 'D', 'A', 'Bm', 'F#m', 'G', 'A7', 'D', 'D'],
      mel: 'F#5:4 A5:4 F#5:4  E5:6 C#5:2 A4:4  D5:4 F#5:4 B5:4  A5:6 F#5:2 C#5:4  B4:4 D5:4 G5:4  F#5:6 E5:2 D5:4  E5:4 G5:4 C#5:4  D5:4 E5:4 F#5:4  A5:4 F#5:4 D5:4  C#5:6 E5:2 A4:4  B4:4 D5:4 F#5:4  E5:6 D5:2 C#5:4  B4:4 G5:4 B5:4  A5:4 G5:4 E5:4  D5:12  _:12',
    },
    cidade: {
      bpm: 112, style: 'marcha', lead: 'accordion', leadAlt: 'brass', leadVol: 0.11, compVol: 0.03,
      chords: ['C', 'G7', 'G7', 'C', 'F', 'C', 'G7', 'C'],
      mel: 'G4:2 C5:2 E5:2 G5:2 E5:4 C5:4  F5:2 D5:2 B4:2 G4:2 D5:4 B4:4  A4:2 B4:2 C5:2 D5:2 F5:4 E5:2 D5:2  E5:4 C5:4 G4:8  A4:2 C5:2 F5:2 A5:2 G5:4 F5:4  E5:2 G5:2 C6:4 G5:4 E5:4  D5:2 E5:2 F5:2 D5:2 B4:4 G4:4  C5:8 _:8',
    },
    boss: {
      bpm: 146, style: 'frevo', lead: 'brass', leadAlt: 'accordion', leadVol: 0.09, compVol: 0.035,
      chords: ['Am', 'Am', 'Dm', 'E7', 'Am', 'F', 'E7', 'E7'],
      mel: 'A4:2 C5:2 E5:2 A5:2 G#5:2 A5:2 E5:4  C5:2 E5:2 A5:2 C6:2 B5:2 A5:2 G#5:2 E5:2  F5:2 A5:2 D6:4 C6:2 A5:2 F5:4  G#5:2 B5:2 E6:4 D6:2 B5:2 G#5:4  A5:3 E5:3 A5:2 C6:4 B5:2 A5:2  A5:2 G5:2 F5:4 E5:2 D5:2 C5:4  B4:2 D5:2 E5:2 G#5:2 B5:4 A5:2 G#5:2  E5:4 _:2 E5:2 E5:2 _:2 E5:4',
    },
    traca: {
      bpm: 136, style: 'frevo', lead: 'fiddle', leadAlt: 'brass', leadVol: 0.12, compVol: 0.03,
      chords: ['Dm', 'Bb', 'Gm', 'A7', 'Dm', 'Bb', 'C', 'A7'],
      mel: 'D5:4 F5:4 A5:4 G5:2 F5:2  F5:4 D5:4 Bb4:8  G4:2 Bb4:2 D5:4 G5:4 F5:2 E5:2  C#5:4 E5:4 A5:4 G5:4  F5:2 E5:2 D5:4 A5:4 D6:4  C6:2 Bb5:2 A5:4 G5:4 F5:4  E5:4 G5:4 C6:4 Bb5:4  A5:8 C#5:4 E5:4',
    },
    chase: {
      bpm: 150, style: 'baiao', lead: 'accordion', leadAlt: 'brass', leadVol: 0.11, compVol: 0.03,
      chords: ['Gm', 'F', 'Eb', 'D7', 'Gm', 'F', 'Eb', 'D7'],
      mel: 'G5:2 G5:2 F5:2 D5:2 Bb4:2 C5:2 D5:4  F5:2 F5:2 Eb5:2 C5:2 A4:2 Bb4:2 C5:4  Eb5:2 G5:2 Bb5:4 A5:2 G5:2 F5:4  F#5:2 A5:2 D6:4 C6:2 A5:2 F#5:4  D5:2 G5:2 Bb5:2 G5:2 D5:2 G5:2 Bb5:4  C5:2 F5:2 A5:2 F5:2 C5:2 F5:2 A5:4  Bb4:2 Eb5:2 G5:2 Eb5:2 Bb4:2 Eb5:2 G5:4  A5:2 F#5:2 D5:2 A4:2 F#4:2 A4:2 D5:4',
    },
    margem: {
      bpm: 58, style: 'ambient', lead: 'bell', leadVol: 0.05,
      chords: ['Dm', 'Bbmaj7', 'Gm', 'A', 'Dm', 'Bbmaj7', 'Gm', 'A7'],
      mel: '_:16 A5:8 F5:8 _:16 D5:8 E5:8 _:16 F5:4 E5:4 D5:8 _:16 C#5:16',
    },
    ending: {
      bpm: 80, style: 'toada', lead: 'fife', leadAlt: 'fiddle', leadVol: 0.15, compVol: 0.05,
      chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'],
      mel: 'E5:4 G5:4 C6:4 B5:2 A5:2  G5:6 D5:2 B4:4 D5:4  C5:4 E5:4 A5:4 G5:2 E5:2  F5:8 E5:4 D5:4  E5:4 G5:4 C6:4 D6:2 E6:2  D6:6 B5:2 G5:8  A5:4 F5:4 G5:4 B5:4  C6:12 _:4',
    },
    sad: {
      bpm: 60, style: 'toada', lead: 'fiddle', leadAlt: 'fife', leadVol: 0.12, compVol: 0.045, padVol: 0.03,
      chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'E7', 'Am'],
      mel: 'E5:8 D5:4 C5:4  A4:12 _:4  G4:4 C5:4 E5:6 D5:2  B4:12 _:4  A4:4 C5:4 E5:4 A5:4  F5:8 E5:4 D5:4  D5:4 C5:4 B4:4 G#4:4  A4:16',
    },
    credits: {
      bpm: 126, style: 'baiao', lead: 'fife', leadAlt: 'accordion', leadVol: 0.13, compVol: 0.03,
      chords: ['G', 'G', 'F', 'G', 'C', 'C', 'D7', 'G7'],
      mel: 'D5:3 D5:3 B4:2 G4:2 A4:2 B4:2 D5:2  E5:3 D5:3 B4:2 A4:4 G4:4  F5:3 F5:3 E5:2 D5:2 C5:2 A4:4  B4:3 G4:3 A4:2 G4:8  E5:3 E5:3 G5:2 E5:2 D5:2 C5:4  E5:2 F5:2 G5:4 F5:2 E5:2 D5:4  D5:3 F#5:3 A5:2 F#5:2 E5:2 D5:4  B4:2 D5:2 G5:4 F5:2 D5:2 B4:4',
    },
    peleja: {
      bpm: 100, style: 'repente', chords: ['G', 'C', 'D7', 'G'],
    },
    tension: {
      bpm: 70, style: 'tension', chords: ['Dm', 'Dm', 'Bb', 'A'],
    },
    // vinhetas curtas (não repetem)
    victory: {
      bpm: 132, style: 'none', lead: 'brass', leadVol: 0.12, oneShot: true, chords: ['C', 'C'],
      mel: 'G4:2 C5:2 E5:2 G5:4 E5:2 G5:2 C6:10 _:8',
      counter: 'bell', counterVol: 0.06, mel2: 'C5:2 E5:2 G5:2 C6:4 G5:2 C6:2 E6:10 _:8',
    },
    defeat: {
      bpm: 84, style: 'none', lead: 'fiddle', leadVol: 0.13, oneShot: true, chords: ['Am', 'Am'],
      mel: 'E5:4 D5:4 C5:4 B4:4 A4:12 _:4',
    },
    verse: {
      bpm: 140, style: 'none', lead: 'bell', leadVol: 0.09, oneShot: true, chords: ['C', 'C'],
      mel: 'C5:1 E5:1 G5:1 C6:1 E6:2 G6:2 C7:8 _:16',
    },
    chapter: {
      bpm: 96, style: 'none', lead: 'accordion', leadVol: 0.12, oneShot: true, chords: ['G', 'G', 'G'],
      mel: 'D5:2 G5:2 B5:2 D6:6 C6:2 B5:2 A5:2 B5:2 G5:12 _:16',
      counter: 'viola', counterVol: 0.07, mel2: 'G3:4 D4:4 G4:4 B4:4 G4:4 D4:4 G3:12 _:12',
    },
  });

  for (const k in SONGS) {
    const S = SONGS[k];
    S.spb = S.spb || 16;
    S._chords = S.chords.map(chord);
    S.total = S.spb * S.chords.length;
    S._mel = S.mel ? parseMel(S.mel, S.total) : null;
    S._mel2 = S.mel2 ? parseMel(S.mel2, S.total) : null;
  }

  // ------------------------------------------------------------------
  // Sequenciador
  // ------------------------------------------------------------------
  function doStep(inst, i, t, sd) {
    const S = inst.S;
    const li = i % S.total;
    const loop = Math.floor(i / S.total);
    const bar = Math.floor(li / S.spb);
    const s = li % S.spb;
    const ch = S._chords[bar];
    const d = inst.g;
    ST[S.style](s, t, sd, S, d, ch, bar, loop, i);
    if (S._mel) {
      const n = S._mel[li];
      if (n) {
        const nm = loop % 2 === 1 && S.leadAlt ? S.leadAlt : S.lead;
        INS[nm](t, n.f, n.len * sd * 0.94, S.leadVol || 0.12, d);
      }
    }
    if (S._mel2) {
      const n = S._mel2[li];
      if (n) INS[S.counter](t, n.f, n.len * sd * 0.94, S.counterVol || 0.08, d);
    }
  }

  A._tick = function () {
    if (!this.running()) return;
    const c = this.ctx;
    const horizon = c.currentTime + 0.14;
    for (let k = this.playing.length - 1; k >= 0; k--) {
      const inst = this.playing[k];
      if (inst.stopAt && c.currentTime > inst.stopAt + 0.1) {
        try { inst.g.disconnect(); } catch (e) { /* ok */ }
        this.playing.splice(k, 1);
        continue;
      }
      const sd = 60 / inst.bpm / 4;
      while (inst.next < horizon) {
        if (inst.stopAt && inst.next > inst.stopAt) break;
        if (inst.S.oneShot && inst.step >= inst.S.total) {
          inst.stopAt = inst.next + 1.5;
          if (this.cur === inst) {
            this.cur = null;
            this.curName = null;
            if (inst.after) this.play(inst.after, { fadeIn: 1.2 });
          }
          break;
        }
        if (inst.next > c.currentTime - 0.05) doStep(inst, inst.step, inst.next, sd);
        inst.next += sd;
        inst.step++;
      }
    }
    this._ambTick();
  };

  A.play = function (name, opt = {}) {
    const S = SONGS[name];
    if (!S) return this.now();
    if (!this.running()) {
      this.pending = { name, opt };
      this.curName = name;
      this.bpm = opt.bpm || S.bpm;
      this.songStart = this.now() + (opt.delay || 0.1);
      return this.songStart;
    }
    if (this.curName === name && this.cur && !opt.restart) return this.cur.start;
    const c = this.ctx;
    this.stop(opt.fadeOut != null ? opt.fadeOut : 0.7);
    const g = c.createGain();
    g.connect(this.musicBus);
    const start = Math.max(c.currentTime + 0.05, opt.at || 0) + (opt.delay || 0);
    const fi = opt.fadeIn != null ? opt.fadeIn : 0.05;
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(opt.vol || 1, start + fi + 0.01);
    const inst = { S, name, g, step: 0, next: start, start, bpm: opt.bpm || S.bpm, after: opt.after };
    this.playing.push(inst);
    this.cur = inst;
    this.curName = name;
    this.songStart = start;
    this.bpm = inst.bpm;
    return start;
  };

  // toca vinheta curta e depois volta (ou segue) para outra música
  A.jingle = function (name, after) {
    if (!this.running()) return;
    const back = after === undefined ? this.curName : after;
    this.play(name, { restart: true, fadeOut: 0.25, after: back });
  };

  A.stop = function (fade = 0.6) {
    this.pending = null;
    if (!this.cur) {
      this.curName = null;
      return;
    }
    if (this.ctx) {
      const g = this.cur.g;
      const t = this.ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
      g.gain.linearRampToValueAtTime(0.0001, t + Math.max(0.02, fade));
      this.cur.stopAt = t + fade;
    }
    this.cur = null;
    this.curName = null;
  };

  A.duck = function (amount = 0.35, time = 1.2) {
    if (!this.running()) return;
    const t = this.ctx.currentTime;
    const g = this.musicBus.gain;
    const s = G.Save.settings;
    const base = Math.pow(s.music, 1.4) * 0.62;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(base * amount, t + 0.1);
    g.setValueAtTime(base * amount, t + time);
    g.linearRampToValueAtTime(base, t + time + 0.6);
  };

  // ------------------------------------------------------------------
  // Ambiência
  // ------------------------------------------------------------------
  const AMB = {
    wind() {
      const c = A.ctx, t = c.currentTime;
      const n = noiseSrc(t, 99999);
      const bp = filt('bandpass', 520, 0.6);
      const lfo = osc('sine', 0.07, t, 99999);
      const lg = gain(320);
      chain(lfo, lg, bp.frequency);
      const g = gain(0.14);
      const lfo2 = osc('sine', 0.13, t, 99999);
      const lg2 = gain(0.06);
      chain(lfo2, lg2, g.gain);
      chain(n, bp, g);
      return { out: g, nodes: [n, lfo, lfo2] };
    },
    fair() {
      const c = A.ctx, t = c.currentTime;
      const n = noiseSrc(t, 99999);
      const bp = filt('bandpass', 820, 1.1);
      const g = gain(0.06);
      const lfo = osc('sine', 0.3, t, 99999);
      const lg = gain(0.025);
      chain(lfo, lg, g.gain);
      chain(n, bp, g);
      return { out: g, nodes: [n, lfo], events: 'fair' };
    },
    water() {
      const c = A.ctx, t = c.currentTime;
      const n = noiseSrc(t, 99999);
      const lp = filt('lowpass', 480, 0.8);
      const g = gain(0.11);
      const lfo = osc('sine', 0.18, t, 99999);
      const lg = gain(0.04);
      chain(lfo, lg, g.gain);
      chain(n, lp, g);
      return { out: g, nodes: [n, lfo], events: 'water' };
    },
    city() {
      const c = A.ctx, t = c.currentTime;
      const o = osc('sine', 55, t, 99999);
      const og = gain(0.035);
      chain(o, og);
      const n = noiseSrc(t, 99999);
      const lp = filt('lowpass', 260, 0.7);
      const g = gain(0.08);
      chain(n, lp, g);
      og.connect(g);
      return { out: g, nodes: [o, n], events: 'city' };
    },
    void() {
      const c = A.ctx, t = c.currentTime;
      const g = gain(0.08);
      const o1 = osc('sine', 55, t, 99999);
      const o2 = osc('sine', 82.6, t, 99999);
      const o3 = osc('triangle', 110.3, t, 99999);
      const g3 = gain(0.2);
      o1.connect(g);
      o2.connect(g);
      chain(o3, g3, g);
      const n = noiseSrc(t, 99999);
      const bp = filt('bandpass', 240, 3);
      const ng = gain(0.5);
      chain(n, bp, ng, g);
      const lfo = osc('sine', 0.05, t, 99999);
      const lg = gain(0.04);
      chain(lfo, lg, g.gain);
      return { out: g, nodes: [o1, o2, o3, n, lfo], events: 'void' };
    },
    night() {
      const r = AMB.wind();
      r.out.gain.value = 0.07;
      r.events = 'night';
      return r;
    },
  };

  A.ambient = function (name, fade = 1.2) {
    if (name === this.ambName) return;
    if (!this.running()) {
      this.pendingAmb = name;
      this.ambName = null;
      return;
    }
    const c = this.ctx;
    const t = c.currentTime;
    if (this.amb) {
      const old = this.amb;
      old.fader.gain.cancelScheduledValues(t);
      old.fader.gain.setValueAtTime(old.fader.gain.value, t);
      old.fader.gain.linearRampToValueAtTime(0.0001, t + fade);
      setTimeout(() => {
        for (const n of old.nodes) try { n.stop(); } catch (e) { /* ok */ }
        try { old.fader.disconnect(); } catch (e) { /* ok */ }
      }, fade * 1000 + 200);
      this.amb = null;
    }
    this.ambName = name;
    if (!name || !AMB[name]) return;
    const a = AMB[name]();
    const fader = gain(0);
    fader.gain.setValueAtTime(0.0001, t);
    fader.gain.linearRampToValueAtTime(1, t + fade);
    a.out.connect(fader);
    fader.connect(this.ambBus);
    a.fader = fader;
    this.amb = a;
  };

  A._ambTick = function () {
    const a = this.amb;
    if (!a || !a.events) return;
    const r = Math.random();
    const c = this.ctx;
    const t = c.currentTime + 0.05;
    const dst = this.ambBus;
    if (a.events === 'water' && r < 0.02) {
      const o = osc('sine', U.rand(300, 700), t, 0.15);
      o.frequency.exponentialRampToValueAtTime(U.rand(900, 1400), t + 0.08);
      const g = gain(0);
      envAD(g, t, 0.005, 0.1, 0.05);
      chain(o, g, dst);
    } else if (a.events === 'fair' && r < 0.03) {
      const f = U.rand(160, 320);
      const o = osc(U.chance(0.5) ? 'sawtooth' : 'triangle', f, t, 0.25);
      o.frequency.linearRampToValueAtTime(f * U.rand(0.8, 1.3), t + 0.2);
      const bp = filt('bandpass', U.rand(600, 1300), 3);
      const g = gain(0);
      envAD(g, t, 0.03, 0.2, 0.02);
      chain(o, bp, g, dst);
    } else if (a.events === 'city' && r < 0.012) {
      A.sfx('clank', { vol: 0.25 });
    } else if (a.events === 'night' && r < 0.03) {
      const o = osc('sine', 4300 + Math.random() * 400, t, 0.3);
      const am = osc('square', 28, t, 0.3);
      const ag = gain(0.5);
      const g = gain(0);
      envAD(g, t, 0.02, 0.25, 0.012);
      chain(am, ag, g.gain);
      chain(o, g, dst);
    } else if (a.events === 'void' && r < 0.01) {
      INS.bell(t, U.pick([587, 698, 880, 1175]), 1.5, 0.02, dst);
    }
  };

  // ------------------------------------------------------------------
  // Efeitos sonoros
  // ------------------------------------------------------------------
  const SFX = {
    whip(t, d, o) {
      const p = o.p || 1;
      const n = noiseSrc(t, 0.16);
      const hp = filt('highpass', 700 * p, 0.9);
      hp.frequency.exponentialRampToValueAtTime(5200 * p, t + 0.1);
      const g = gain(0);
      envAD(g, t, 0.004, 0.13, 0.45);
      chain(n, hp, g, d);
      const c = osc('square', 1900 * p, t + 0.09, 0.03);
      const cg = gain(0);
      envAD(cg, t + 0.09, 0.001, 0.025, 0.12);
      chain(c, cg, d);
    },
    hit(t, d, o) {
      const s = osc('sine', 190 * (o.p || 1), t, 0.14);
      s.frequency.exponentialRampToValueAtTime(55, t + 0.12);
      const g = gain(0);
      envAD(g, t, 0.002, 0.14, 0.7);
      chain(s, g, d);
      const n = noiseSrc(t, 0.1);
      const bp = filt('bandpass', 900, 0.8);
      const ng = gain(0);
      envAD(ng, t, 0.002, 0.08, 0.4);
      chain(n, bp, ng, d);
    },
    bossHit(t, d) {
      SFX.hit(t, d, { p: 0.7 });
      const o = osc('square', 120, t, 0.2);
      const lp = filt('lowpass', 600);
      const g = gain(0);
      envAD(g, t, 0.002, 0.18, 0.2);
      chain(o, lp, g, d);
    },
    splat(t, d) {
      const s = osc('sine', 420, t, 0.2);
      s.frequency.exponentialRampToValueAtTime(110, t + 0.18);
      const g = gain(0);
      envAD(g, t, 0.003, 0.18, 0.4);
      chain(s, g, d);
      const n = noiseSrc(t, 0.2);
      const lp = filt('lowpass', 900);
      const ng = gain(0);
      envAD(ng, t, 0.003, 0.16, 0.3);
      chain(n, lp, ng, d);
    },
    hurt(t, d) {
      const o = osc('square', 460, t, 0.3);
      o.frequency.exponentialRampToValueAtTime(150, t + 0.25);
      const lp = filt('lowpass', 1800);
      const g = gain(0);
      envAD(g, t, 0.004, 0.26, 0.28);
      chain(o, lp, g, d);
      SFX.hit(t, d, { p: 0.8 });
    },
    dodge(t, d) {
      const n = noiseSrc(t, 0.25);
      const bp = filt('bandpass', 300, 1.4);
      bp.frequency.exponentialRampToValueAtTime(2200, t + 0.2);
      const g = gain(0);
      envAD(g, t, 0.05, 0.18, 0.35);
      chain(n, bp, g, d);
    },
    stamp(t, d) {
      const s = osc('sine', 95, t, 0.45);
      s.frequency.exponentialRampToValueAtTime(34, t + 0.35);
      const g = gain(0);
      envAD(g, t, 0.002, 0.42, 1.0);
      chain(s, g, d);
      const n = noiseSrc(t, 0.3);
      const lp = filt('lowpass', 420);
      const ng = gain(0);
      envAD(ng, t, 0.002, 0.25, 0.6);
      chain(n, lp, ng, d);
      const k = osc('triangle', 620, t, 0.06);
      const kg = gain(0);
      envAD(kg, t, 0.001, 0.05, 0.3);
      chain(k, kg, d);
    },
    throw(t, d) {
      const n = noiseSrc(t, 0.12);
      const bp = filt('bandpass', 1200, 1.5);
      bp.frequency.exponentialRampToValueAtTime(3200, t + 0.1);
      const g = gain(0);
      envAD(g, t, 0.01, 0.1, 0.25);
      chain(n, bp, g, d);
      const c = osc('triangle', 1250, t, 0.03);
      const cg = gain(0);
      envAD(cg, t, 0.001, 0.025, 0.2);
      chain(c, cg, d);
    },
    pickup(t, d) {
      INS.bell(t, 1318, 0.2, 0.12, d);
      INS.bell(t + 0.06, 1760, 0.3, 0.12, d);
    },
    heal(t, d) {
      [660, 880, 1100, 1320].forEach((f, i) => INS.bell(t + i * 0.07, f, 0.4, 0.1, d));
    },
    verse(t, d) {
      [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => INS.bell(t + i * 0.08, f, 0.8, 0.1, d));
      const n = noiseSrc(t, 1.2);
      const hp = filt('highpass', 7000);
      const g = gain(0);
      envAD(g, t, 0.3, 0.9, 0.05);
      chain(n, hp, g, d);
    },
    menuMove(t, d) {
      const o = osc('sine', 880, t, 0.05);
      const g = gain(0);
      envAD(g, t, 0.001, 0.04, 0.22);
      chain(o, g, d);
      const n = noiseSrc(t, 0.02);
      const hp = filt('highpass', 3000);
      const ng = gain(0);
      envAD(ng, t, 0.001, 0.015, 0.12);
      chain(n, hp, ng, d);
    },
    menuSelect(t, d) {
      SFX.menuMove(t, d);
      SFX.menuMove(t + 0.05, d);
      INS.bell(t + 0.05, 1175, 0.4, 0.1, d);
    },
    menuBack(t, d) {
      const o = osc('sine', 520, t, 0.08);
      o.frequency.exponentialRampToValueAtTime(330, t + 0.07);
      const g = gain(0);
      envAD(g, t, 0.001, 0.07, 0.22);
      chain(o, g, d);
    },
    blip(t, d, o) {
      const v = o.voice || { type: 'triangle', base: 400, var: 0.15 };
      const f = v.base * (1 + (Math.random() - 0.5) * (v.var || 0.15));
      const w = osc(v.type || 'triangle', f, t, 0.07);
      const lp = filt('lowpass', 2800);
      const g = gain(0);
      envAD(g, t, 0.004, 0.05, v.vol || 0.1);
      chain(w, lp, g, d);
    },
    rumble(t, d, o) {
      const dur = o.dur || 1.2;
      const n = noiseSrc(t, dur);
      const lp = filt('lowpass', 180, 1);
      const g = gain(0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.7, t + 0.15);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      chain(n, lp, g, d);
      const s = osc('sine', 42, t, dur);
      const sg = gain(0);
      envAD(sg, t, 0.1, dur, 0.4);
      chain(s, sg, d);
    },
    lamp(t, d) {
      const n = noiseSrc(t, 0.5);
      const bp = filt('bandpass', 250, 1.2);
      bp.frequency.exponentialRampToValueAtTime(1400, t + 0.35);
      const g = gain(0);
      envAD(g, t, 0.05, 0.4, 0.35);
      chain(n, bp, g, d);
      [523, 659, 784].forEach((f) => INS.pad(t + 0.1, f, 0.8, 0.05, d));
      INS.bell(t + 0.15, 1568, 0.8, 0.06, d);
    },
    bell(t, d) {
      INS.bell(t, 1046, 2, 0.2, d);
      INS.bell(t + 0.01, 1567, 1.6, 0.1, d);
      INS.bell(t + 0.3, 1046, 1.4, 0.08, d);
    },
    roar(t, d, o) {
      const dur = o.dur || 1.3;
      const s = osc('sawtooth', (o.p || 1) * 110, t, dur);
      s.frequency.exponentialRampToValueAtTime((o.p || 1) * 55, t + dur);
      const am = osc('square', 19, t, dur);
      const ag = gain(0.35);
      const g = gain(0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.12);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      chain(am, ag, g.gain);
      const lp = filt('lowpass', 900, 2);
      chain(s, lp, g, d);
      const n = noiseSrc(t, dur);
      const bp = filt('bandpass', 400, 1);
      const ng = gain(0);
      envAD(ng, t, 0.1, dur, 0.3);
      chain(n, bp, ng, d);
    },
    wings(t, d, o) {
      const dur = o.dur || 0.9;
      const n = noiseSrc(t, dur);
      const bp = filt('bandpass', 380, 0.9);
      const am = osc('sine', o.rate || 11, t, dur);
      const ag = gain(0.5);
      const g = gain(0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.1);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      chain(am, ag, g.gain);
      chain(n, bp, g, d);
    },
    chomp(t, d) {
      for (let i = 0; i < 3; i++) {
        const tt = t + i * 0.13;
        const n = noiseSrc(tt, 0.08);
        const bp = filt('bandpass', U.rand(900, 1600), 1.2);
        const g = gain(0);
        envAD(g, tt, 0.002, 0.07, 0.5);
        chain(n, bp, g, d);
        const s = osc('sine', 120, tt, 0.08);
        s.frequency.exponentialRampToValueAtTime(50, tt + 0.07);
        const sg = gain(0);
        envAD(sg, tt, 0.002, 0.07, 0.4);
        chain(s, sg, d);
      }
    },
    page(t, d) {
      const n = noiseSrc(t, 0.6);
      const bp = filt('bandpass', 3200, 0.9);
      bp.frequency.exponentialRampToValueAtTime(700, t + 0.45);
      const g = gain(0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.3, t + 0.18);
      g.gain.linearRampToValueAtTime(0.0001, t + 0.55);
      chain(n, bp, g, d);
    },
    tear(t, d) {
      const n = noiseSrc(t, 0.7);
      const bp = filt('bandpass', 2400, 2);
      const am = osc('square', 38, t, 0.7);
      const ag = gain(0.6);
      const g = gain(0);
      envAD(g, t, 0.02, 0.65, 0.4);
      chain(am, ag, g.gain);
      chain(n, bp, g, d);
    },
    perfect(t, d) {
      INS.bell(t, 1568, 0.3, 0.1, d);
      INS.bell(t + 0.03, 2093, 0.3, 0.08, d);
    },
    good(t, d) {
      INS.bell(t, 1318, 0.25, 0.09, d);
    },
    wrong(t, d) {
      const o = osc('sawtooth', 170, t, 0.22);
      const o2 = osc('sawtooth', 181, t, 0.22);
      const lp = filt('lowpass', 900);
      const g = gain(0);
      envAD(g, t, 0.005, 0.2, 0.2);
      o.connect(lp);
      o2.connect(lp);
      chain(lp, g, d);
    },
    miss(t, d) {
      const o = osc('sine', 220, t, 0.12);
      o.frequency.exponentialRampToValueAtTime(140, t + 0.1);
      const g = gain(0);
      envAD(g, t, 0.003, 0.1, 0.18);
      chain(o, g, d);
    },
    cheer(t, d, o) {
      const dur = o.dur || 1.6;
      const n = noiseSrc(t, dur);
      const bp = filt('bandpass', 1300, 0.7);
      const g = gain(0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.22 * (o.vol || 1), t + 0.2);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      chain(n, bp, g, d);
      for (let i = 0; i < 26; i++) {
        const tt = t + Math.random() * dur * 0.8;
        const c = noiseSrc(tt, 0.03);
        const hp = filt('bandpass', U.rand(1200, 3000), 2);
        const cg = gain(0);
        envAD(cg, tt, 0.001, 0.025, 0.25 * (o.vol || 1));
        chain(c, hp, cg, d);
      }
    },
    boo(t, d) {
      const s = osc('sawtooth', 150, t, 1.1);
      s.frequency.linearRampToValueAtTime(110, t + 1);
      const bp = filt('bandpass', 380, 3);
      const g = gain(0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.2);
      g.gain.linearRampToValueAtTime(0.0001, t + 1.1);
      chain(s, bp, g, d);
    },
    shoot(t, d, o) {
      const p = o.p || 1;
      const s = osc('triangle', 1400 * p, t, 0.1);
      s.frequency.exponentialRampToValueAtTime(520 * p, t + 0.08);
      const g = gain(0);
      envAD(g, t, 0.002, 0.08, 0.16);
      chain(s, g, d);
    },
    clank(t, d, o) {
      const g = gain(0);
      envAD(g, t, 0.002, 0.3, 0.2 * (o.vol || 1));
      for (const f of [310, 447, 821]) osc('square', f, t, 0.3).connect(g);
      const bp = filt('bandpass', 1400, 1.5);
      chain(g, bp, d);
    },
    paper(t, d) {
      const n = noiseSrc(t, 0.3);
      const hp = filt('highpass', 2200);
      const g = gain(0);
      g.gain.setValueAtTime(0.0001, t);
      for (let i = 0; i < 6; i++) g.gain.linearRampToValueAtTime(Math.random() * 0.25, t + 0.03 + i * 0.04);
      g.gain.linearRampToValueAtTime(0.0001, t + 0.3);
      chain(n, hp, g, d);
    },
    splash(t, d) {
      const n = noiseSrc(t, 0.5);
      const lp = filt('lowpass', 2400);
      lp.frequency.exponentialRampToValueAtTime(300, t + 0.45);
      const g = gain(0);
      envAD(g, t, 0.01, 0.45, 0.4);
      chain(n, lp, g, d);
    },
    boom(t, d) {
      const n = noiseSrc(t, 0.8);
      const lp = filt('lowpass', 1000);
      lp.frequency.exponentialRampToValueAtTime(90, t + 0.7);
      const g = gain(0);
      envAD(g, t, 0.003, 0.75, 0.8);
      chain(n, lp, g, d);
      const s = osc('sine', 70, t, 0.6);
      s.frequency.exponentialRampToValueAtTime(30, t + 0.5);
      const sg = gain(0);
      envAD(sg, t, 0.003, 0.5, 0.8);
      chain(s, sg, d);
    },
    goat(t, d) {
      const s = osc('sawtooth', 390, t, 0.6);
      const vib = osc('sine', 9, t, 0.6);
      const vg = gain(35);
      chain(vib, vg, s.frequency);
      const bp = filt('bandpass', 1300, 2);
      const g = gain(0);
      envAD(g, t, 0.03, 0.5, 0.2);
      chain(s, bp, g, d);
    },
    donkey(t, d) {
      const s = osc('sawtooth', 720, t, 0.3);
      const bp = filt('bandpass', 1100, 2);
      const g = gain(0);
      envAD(g, t, 0.02, 0.25, 0.2);
      chain(s, bp, g, d);
      const s2 = osc('sawtooth', 240, t + 0.3, 0.45);
      s2.frequency.linearRampToValueAtTime(200, t + 0.7);
      const bp2 = filt('bandpass', 700, 2);
      const g2 = gain(0);
      envAD(g2, t + 0.3, 0.03, 0.4, 0.25);
      chain(s2, bp2, g2, d);
    },
    bird(t, d) {
      for (let i = 0; i < 3; i++) {
        const tt = t + i * 0.12;
        const s = osc('sine', 2100, tt, 0.1);
        s.frequency.exponentialRampToValueAtTime(3300, tt + 0.07);
        const g = gain(0);
        envAD(g, tt, 0.005, 0.08, 0.1);
        chain(s, g, d);
      }
    },
    heartbeat(t, d) {
      DR.zab(t, 0.6, d);
      DR.zab(t + 0.22, 0.4, d);
    },
    creak(t, d) {
      const s = osc('sawtooth', 110, t, 0.5);
      s.frequency.linearRampToValueAtTime(190, t + 0.4);
      const bp = filt('bandpass', 800, 4);
      const g = gain(0);
      envAD(g, t, 0.05, 0.4, 0.2);
      chain(s, bp, g, d);
      SFX.menuMove(t + 0.42, d);
    },
    fanfare(t, d) {
      [523, 659, 784, 1047].forEach((f, i) => INS.brass(t + i * 0.09, f, i === 3 ? 0.5 : 0.08, 0.1, d));
    },
    shield(t, d) {
      INS.bell(t, 2200, 0.3, 0.12, d);
      INS.bell(t, 3100, 0.2, 0.06, d);
    },
    charge(t, d, o) {
      const dur = o.dur || 0.6;
      const s = osc('sawtooth', 180, t, dur);
      s.frequency.exponentialRampToValueAtTime(900, t + dur);
      const lp = filt('lowpass', 1500);
      const g = gain(0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.14, t + dur);
      g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.05);
      chain(s, lp, g, d);
    },
    drip(t, d) {
      const s = osc('sine', 1300, t, 0.12);
      s.frequency.exponentialRampToValueAtTime(280, t + 0.1);
      const g = gain(0);
      envAD(g, t, 0.002, 0.1, 0.2);
      chain(s, g, d);
    },
    thud(t, d) {
      const s = osc('sine', 110, t, 0.2);
      s.frequency.exponentialRampToValueAtTime(45, t + 0.15);
      const g = gain(0);
      envAD(g, t, 0.002, 0.18, 0.5);
      chain(s, g, d);
    },
    coin(t, d) {
      INS.bell(t, 1760, 0.15, 0.08, d);
    },
    buy(t, d) {
      INS.bell(t, 988, 0.2, 0.1, d);
      INS.bell(t + 0.08, 1319, 0.2, 0.1, d);
      INS.bell(t + 0.16, 1976, 0.5, 0.1, d);
    },
    error(t, d) {
      const o = osc('square', 150, t, 0.18);
      const lp = filt('lowpass', 800);
      const g = gain(0);
      envAD(g, t, 0.003, 0.16, 0.15);
      chain(o, lp, g, d);
    },
    strum(t, d) {
      const ch = chord('G');
      ch.notes.concat([ch.notes[0] * 2]).forEach((f, k) => INS.viola(t + k * 0.03, f, 1, 0.08, d));
    },
    breakStrings(t, d) {
      [392, 494, 587, 784].forEach((f, k) => {
        const tt = t + k * 0.12;
        const s = osc('sawtooth', f, tt, 0.3);
        s.frequency.exponentialRampToValueAtTime(f * 0.4, tt + 0.25);
        const g = gain(0);
        envAD(g, tt, 0.002, 0.25, 0.12);
        chain(s, g, d);
      });
    },
    fire(t, d) {
      for (let i = 0; i < 5; i++) {
        const tt = t + Math.random() * 0.4;
        const n = noiseSrc(tt, 0.02);
        const hp = filt('highpass', 2500);
        const g = gain(0);
        envAD(g, tt, 0.001, 0.015, 0.15);
        chain(n, hp, g, d);
      }
    },
  };

  A.sfx = function (name, o = {}) {
    if (!this.running()) return;
    const f = SFX[name];
    if (!f) return;
    const t = this.ctx.currentTime + (o.delay || 0);
    let d = this.sfxBus;
    if (o.vol != null && o.vol !== 1) {
      const g = gain(o.vol);
      g.connect(this.sfxBus);
      d = g;
    }
    try {
      f(t, d, o);
    } catch (e) {
      if (G.DEBUG) console.warn('sfx', name, e);
    }
  };

  A.blip = function (voice) {
    const now = performance.now();
    if (now - this.lastBlip < 55) return;
    this.lastBlip = now;
    this.sfx('blip', { voice });
  };
})();
