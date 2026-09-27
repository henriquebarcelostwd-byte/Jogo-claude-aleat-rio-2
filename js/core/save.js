/* PELEJA — configurações, progresso e memória permanente (localStorage) */
(function () {
  'use strict';
  const G = window.G;
  const U = G.U;

  const K_SET = 'peleja.settings.v1';
  const K_META = 'peleja.meta.v1';
  const K_GAME = 'peleja.save.v1';

  const DEFAULT_SETTINGS = {
    music: 0.7,
    sfx: 0.8,
    textSpeed: 1, // 0 lenta, 1 normal, 2 rápida, 3 instantânea
    shake: true,
    boil: true,
    quality: 'auto', // auto | normal | alta
    difficulty: 1, // 0 fácil, 1 normal, 2 difícil
    rhythmOffset: 0, // ms
    hints: true,
  };

  const DEFAULT_META = {
    verses: [], // versos perdidos encontrados (permanente)
    endings: [], // finais vistos
    chapters: ['prologo'], // capítulos liberados
    bestiary: [], // inimigos vistos
    people: [], // personagens conhecidos
    finished: 0,
  };

  function load(key, def) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return U.copy(def);
      return Object.assign(U.copy(def), JSON.parse(raw));
    } catch (e) {
      return U.copy(def);
    }
  }
  function store(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      return false;
    }
  }

  const S = (G.Save = {
    settings: load(K_SET, DEFAULT_SETTINGS),
    meta: load(K_META, DEFAULT_META),

    saveSettings() {
      store(K_SET, this.settings);
    },
    saveMeta() {
      store(K_META, this.meta);
    },
    hasGame() {
      try {
        return !!localStorage.getItem(K_GAME);
      } catch (e) {
        return false;
      }
    },
    saveGame(state) {
      return store(K_GAME, state);
    },
    loadGame() {
      try {
        const raw = localStorage.getItem(K_GAME);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    clearGame() {
      try {
        localStorage.removeItem(K_GAME);
      } catch (e) { /* ok */ }
    },
    resetAll() {
      try {
        localStorage.removeItem(K_GAME);
        localStorage.removeItem(K_META);
      } catch (e) { /* ok */ }
      this.meta = U.copy(DEFAULT_META);
    },

    // --- memória permanente ---
    addVerse(id) {
      if (!this.meta.verses.includes(id)) {
        this.meta.verses.push(id);
        this.saveMeta();
        return true;
      }
      return false;
    },
    hasVerse(id) {
      return this.meta.verses.includes(id);
    },
    addEnding(id) {
      if (!this.meta.endings.includes(id)) this.meta.endings.push(id);
      this.meta.finished++;
      this.saveMeta();
    },
    unlockChapter(id) {
      if (!this.meta.chapters.includes(id)) {
        this.meta.chapters.push(id);
        this.saveMeta();
      }
    },
    seeEnemy(kind) {
      if (!this.meta.bestiary.includes(kind)) {
        this.meta.bestiary.push(kind);
        this.saveMeta();
      }
    },
    meet(who) {
      if (!this.meta.people.includes(who)) {
        this.meta.people.push(who);
        this.saveMeta();
      }
    },
  });

  // dificuldade -> multiplicadores
  G.diff = function () {
    const d = S.settings.difficulty;
    return [
      { dmgTaken: 1, enemyHp: 0.75, window: 1.35, pelejaPenalty: 0.6, name: 'Fácil' },
      { dmgTaken: 2, enemyHp: 1, window: 1, pelejaPenalty: 1, name: 'Normal' },
      { dmgTaken: 3, enemyHp: 1.3, window: 0.85, pelejaPenalty: 1.3, name: 'Difícil' },
    ][d] || { dmgTaken: 2, enemyHp: 1, window: 1, pelejaPenalty: 1, name: 'Normal' };
  };
})();
