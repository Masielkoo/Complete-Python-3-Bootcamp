/* Tiny localStorage wrapper for per-game best streaks / stats. */
(function (global) {
  'use strict';

  const KEY = 'earTrainer.stats.v1';

  function loadAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveAll(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* ignore quota / privacy-mode errors */ }
  }

  function getStats(gameId) {
    const all = loadAll();
    return all[gameId] || { best: 0, correct: 0, total: 0 };
  }

  function recordResult(gameId, wasCorrect, currentStreak) {
    const all = loadAll();
    const s = all[gameId] || { best: 0, correct: 0, total: 0 };
    s.total += 1;
    if (wasCorrect) s.correct += 1;
    if (currentStreak > s.best) s.best = currentStreak;
    all[gameId] = s;
    saveAll(all);
    return s;
  }

  global.Storage2 = { getStats, recordResult };
})(window);
