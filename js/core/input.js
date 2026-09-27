/* PELEJA — entrada: teclado, controle, mouse e toque */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;

  const KEYMAP = {
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    attack: ['KeyJ', 'KeyZ'],
    dodge: ['KeyK', 'KeyX', 'ShiftLeft', 'ShiftRight'],
    stamp: ['KeyL', 'KeyC'],
    throw: ['KeyI', 'KeyV'],
    interact: ['KeyE', 'Space', 'Enter', 'NumpadEnter'],
    pause: ['Escape', 'KeyP'],
    journal: ['Tab', 'KeyQ'],
    confirm: ['Enter', 'NumpadEnter', 'Space', 'KeyE', 'KeyJ', 'KeyZ'],
    cancel: ['Escape', 'Backspace', 'KeyK', 'KeyX'],
    skip: ['Escape', 'Enter', 'Space'],
  };
  const PADMAP = {
    confirm: [0], cancel: [1], attack: [0], dodge: [1, 4], interact: [2], stamp: [3], throw: [5, 7],
    pause: [9], journal: [8], up: [12], down: [13], left: [14], right: [15], skip: [9, 0],
  };
  const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'Backspace']);

  const keys = new Set();
  const justKeys = new Set();
  const state = {};
  const prev = {};
  const pressedNow = {};
  const rep = {};
  let padButtons = [];
  let padPrev = [];
  let padAxes = [0, 0];
  let anyJust = false;

  const I = (G.Input = {
    lastDevice: 'kb',
    mouse: { x: 0, y: 0, down: false, clicked: false, moved: false, active: false },
    touch: { enabled: false, layout: 'game', stick: null, buttons: {}, taps: [] },
    dt: 0,
    blocked: 0,
  });

  window.addEventListener('keydown', (e) => {
    if (PREVENT.has(e.code)) e.preventDefault();
    if (!e.repeat) {
      keys.add(e.code);
      justKeys.add(e.code);
      anyJust = true;
    }
    I.lastDevice = 'kb';
    if (G.Audio) G.Audio.unlock();
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
  });
  window.addEventListener('blur', () => {
    keys.clear();
    if (G.onBlur) G.onBlur();
  });

  // ---------- mouse ----------
  function toLogical(cx, cy) {
    const cv = G.canvas;
    if (!cv) return { x: 0, y: 0 };
    const r = cv.getBoundingClientRect();
    return { x: ((cx - r.left) / r.width) * G.W, y: ((cy - r.top) / r.height) * G.H };
  }
  window.addEventListener('mousemove', (e) => {
    const p = toLogical(e.clientX, e.clientY);
    const m = I.mouse;
    if (Math.abs(p.x - m.x) + Math.abs(p.y - m.y) > 0.5) m.moved = true;
    m.x = p.x;
    m.y = p.y;
    m.active = true;
  });
  window.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const p = toLogical(e.clientX, e.clientY);
    I.mouse.x = p.x;
    I.mouse.y = p.y;
    I.mouse.down = true;
    I.mouse.clicked = true;
    I.mouse.active = true;
    anyJust = true;
    I.lastDevice = 'mouse';
    if (G.Audio) G.Audio.unlock();
  });
  window.addEventListener('mouseup', () => {
    I.mouse.down = false;
  });

  // ---------- toque ----------
  const T = I.touch;
  function touchButtons() {
    const L = T.layout;
    if (L === 'peleja') {
      return [
        { a: 'left', x: 150, y: 470, r: 52, label: '←' },
        { a: 'down', x: 360, y: 490, r: 52, label: '↓' },
        { a: 'up', x: 600, y: 490, r: 52, label: '↑' },
        { a: 'right', x: 810, y: 470, r: 52, label: '→' },
        { a: 'pause', x: 924, y: 36, r: 26, label: 'II' },
      ];
    }
    if (L === 'menu') {
      return [
        { a: 'confirm', x: 870, y: 460, r: 44, label: 'OK' },
        { a: 'cancel', x: 780, y: 490, r: 34, label: '✕' },
      ];
    }
    return [
      { a: 'attack', x: 872, y: 452, r: 44, label: 'J' },
      { a: 'dodge', x: 780, y: 492, r: 34, label: 'K' },
      { a: 'stamp', x: 800, y: 392, r: 32, label: 'L' },
      { a: 'throw', x: 890, y: 350, r: 30, label: 'I' },
      { a: 'interact', x: 706, y: 468, r: 30, label: 'E' },
      { a: 'journal', x: 850, y: 36, r: 24, label: '≡' },
      { a: 'pause', x: 924, y: 36, r: 26, label: 'II' },
    ];
  }
  I.touchButtons = touchButtons;

  function handleTouches(e) {
    e.preventDefault();
    T.enabled = true;
    I.lastDevice = 'touch';
    if (G.Audio) G.Audio.unlock();
    const btns = touchButtons();
    const held = {};
    let stick = null;
    for (const t of e.touches) {
      const p = toLogical(t.clientX, t.clientY);
      let hit = false;
      for (const b of btns) {
        if (U.dist(p.x, p.y, b.x, b.y) < b.r + 14) {
          held[b.a] = true;
          hit = true;
        }
      }
      if (!hit && T.layout !== 'peleja' && p.x < G.W * 0.45 && p.y > G.H * 0.3) {
        if (T.stick && T.stick.id === t.identifier) stick = { id: t.identifier, ox: T.stick.ox, oy: T.stick.oy, x: p.x, y: p.y };
        else if (!stick) stick = { id: t.identifier, ox: p.x, oy: p.y, x: p.x, y: p.y };
      }
    }
    T.stick = stick;
    T.buttons = held;
  }
  function onTouchStart(e) {
    const btns = touchButtons();
    for (const t of e.changedTouches) {
      const p = toLogical(t.clientX, t.clientY);
      T.taps.push(p);
      if (!btns.some((b) => U.dist(p.x, p.y, b.x, b.y) < b.r + 14)) {
        I.mouse.x = p.x;
        I.mouse.y = p.y;
        I.mouse.clicked = true;
        I.mouse.moved = true;
      }
    }
    anyJust = true;
    handleTouches(e);
  }
  window.addEventListener('touchstart', onTouchStart, { passive: false });
  window.addEventListener('touchmove', handleTouches, { passive: false });
  window.addEventListener('touchend', handleTouches, { passive: false });
  window.addEventListener('touchcancel', handleTouches, { passive: false });

  // ---------- atualização por quadro ----------
  I.update = function (dt) {
    I.dt = dt;
    // controle
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let pad = null;
    for (const p of pads) if (p && p.connected) { pad = p; break; }
    padPrev = padButtons;
    padButtons = [];
    padAxes = [0, 0];
    if (pad) {
      for (let i = 0; i < pad.buttons.length; i++) padButtons[i] = pad.buttons[i].pressed;
      padAxes = [pad.axes[0] || 0, pad.axes[1] || 0];
      if (padButtons.some((b, i) => b && !padPrev[i]) || Math.hypot(padAxes[0], padAxes[1]) > 0.5) {
        if (I.lastDevice !== 'pad') I.lastDevice = 'pad';
        if (padButtons.some((b, i) => b && !padPrev[i])) anyJust = true;
      }
    }
    const stickDir = {
      left: padAxes[0] < -0.5, right: padAxes[0] > 0.5, up: padAxes[1] < -0.5, down: padAxes[1] > 0.5,
    };
    // toque: direcional virtual
    const tdir = { left: false, right: false, up: false, down: false };
    if (T.stick) {
      const dx = T.stick.x - T.stick.ox, dy = T.stick.y - T.stick.oy;
      if (Math.hypot(dx, dy) > 16) {
        tdir.left = dx < -16 && Math.abs(dx) > Math.abs(dy) * 0.45;
        tdir.right = dx > 16 && Math.abs(dx) > Math.abs(dy) * 0.45;
        tdir.up = dy < -16 && Math.abs(dy) > Math.abs(dx) * 0.45;
        tdir.down = dy > 16 && Math.abs(dy) > Math.abs(dx) * 0.45;
      }
    }

    for (const a in KEYMAP) {
      let d = false;
      let jp = false;
      for (const k of KEYMAP[a]) {
        if (keys.has(k)) d = true;
        if (justKeys.has(k)) jp = true;
      }
      const pm = PADMAP[a];
      if (pm) for (const b of pm) {
        if (padButtons[b]) d = true;
        if (padButtons[b] && !padPrev[b]) jp = true;
      }
      if (stickDir[a]) d = true;
      if (tdir[a]) d = true;
      if (T.buttons[a]) d = true;
      if (a === 'confirm' && T.buttons.attack) d = true;
      if (a === 'cancel' && T.buttons.dodge) d = true;
      const was = prev[a] || false;
      if (d && !was) jp = true;
      prev[a] = d;
      state[a] = d;
      pressedNow[a] = jp;
    }
    if (I.blocked > 0) {
      I.blocked -= dt;
      for (const a in pressedNow) pressedNow[a] = false;
    }
  };

  I.endFrame = function () {
    justKeys.clear();
    I.mouse.clicked = false;
    I.mouse.moved = false;
    T.taps.length = 0;
    anyJust = false;
  };

  I.down = (a) => !!state[a];
  I.pressed = (a) => !!pressedNow[a];
  I.consume = function (a) {
    if (a) pressedNow[a] = false;
    else for (const k in pressedNow) pressedNow[k] = false;
  };
  I.block = function (t = 0.15) {
    I.blocked = t;
    for (const a in pressedNow) pressedNow[a] = false;
  };
  I.anyPressed = function () {
    return anyJust && I.blocked <= 0;
  };

  I.repeat = function (a) {
    if (pressedNow[a]) {
      rep[a] = 0.36;
      return true;
    }
    if (state[a]) {
      rep[a] = (rep[a] || 0) - I.dt;
      if (rep[a] <= 0) {
        rep[a] = 0.11;
        return true;
      }
    }
    return false;
  };

  // eixo de movimento normalizado
  I.axis = function () {
    let x = 0, y = 0;
    if (state.left) x -= 1;
    if (state.right) x += 1;
    if (state.up) y -= 1;
    if (state.down) y += 1;
    if (Math.hypot(padAxes[0], padAxes[1]) > 0.25) {
      x = padAxes[0];
      y = padAxes[1];
    }
    if (T.stick) {
      const dx = T.stick.x - T.stick.ox, dy = T.stick.y - T.stick.oy;
      const m = Math.hypot(dx, dy);
      if (m > 10) {
        const k = Math.min(1, m / 60);
        x = (dx / m) * k;
        y = (dy / m) * k;
      }
    }
    const m = Math.hypot(x, y);
    if (m > 1) {
      x /= m;
      y /= m;
    }
    return { x, y };
  };

  I.keyLabel = function (action) {
    const pad = I.lastDevice === 'pad';
    const kb = {
      attack: 'J', dodge: 'K', stamp: 'L', throw: 'I', interact: 'E', pause: 'Esc', journal: 'Tab', confirm: 'Enter', cancel: 'Esc',
      up: '↑', down: '↓', left: '←', right: '→', move: 'WASD',
    };
    const gp = {
      attack: 'A', dodge: 'B', stamp: 'Y', throw: 'RB', interact: 'X', pause: 'Start', journal: 'Select', confirm: 'A', cancel: 'B',
      up: '↑', down: '↓', left: '←', right: '→', move: 'Analóg.',
    };
    if (I.lastDevice === 'touch') return kb[action] || action;
    return (pad ? gp : kb)[action] || action;
  };

  // desenha a interface de toque (quando usada)
  I.drawTouch = function (ctx) {
    if (!T.enabled) return;
    ctx.save();
    ctx.globalAlpha = 0.55;
    const btns = touchButtons();
    for (const b of btns) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, U.TAU);
      ctx.fillStyle = T.buttons[b.a] ? G.C.red : G.C.paper;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = G.C.ink;
      ctx.stroke();
      ctx.fillStyle = G.C.ink;
      ctx.font = G.font(Math.round(b.r * 0.7), 'title');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, b.x, b.y + 2);
    }
    if (T.layout !== 'peleja' && T.stick) {
      ctx.beginPath();
      ctx.arc(T.stick.ox, T.stick.oy, 60, 0, U.TAU);
      ctx.strokeStyle = G.C.paper;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.beginPath();
      const dx = T.stick.x - T.stick.ox, dy = T.stick.y - T.stick.oy;
      const m = Math.min(60, Math.hypot(dx, dy)) / (Math.hypot(dx, dy) || 1);
      ctx.arc(T.stick.ox + dx * m, T.stick.oy + dy * m, 26, 0, U.TAU);
      ctx.fillStyle = G.C.paper;
      ctx.fill();
    }
    ctx.restore();
  };
})();
