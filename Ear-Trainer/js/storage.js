/* Stats storage: per-game totals, per-item (interval/chord/syllable) accuracy and a
 * per-day history. Always persisted to localStorage; when the page runs inside a
 * claude.ai Artifact with the `db` capability, the same document is mirrored to the
 * artifact's cloud store so phone and PC share one history. */
(function (global) {
  'use strict';

  const KEY = 'earTrainer.stats.v2';
  const LEGACY_KEY = 'earTrainer.stats.v1';
  const CLOUD_DOC = 'stats/main';

  let data = null;
  let syncStatus = 'local'; // 'local' | 'syncing' | 'cloud' | 'error'
  let cloudDoc = null;
  let writeTimer = null;
  const listeners = [];

  function emptyData() {
    return { v: 2, updatedAt: null, games: {}, days: {} };
  }

  function emptyGame() {
    return { correct: 0, wrong: 0, best: 0, items: {} };
  }

  function todayKey() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function load() {
    if (data) return data;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        data = JSON.parse(raw);
      } else {
        data = emptyData();
        const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
        if (legacy) {
          Object.keys(legacy).forEach((id) => {
            const s = legacy[id];
            data.games[id] = { correct: s.correct || 0, wrong: Math.max(0, (s.total || 0) - (s.correct || 0)), best: s.best || 0, items: {} };
          });
          saveLocal();
        }
      }
    } catch (e) {
      data = emptyData();
    }
    if (!data.games) data.games = {};
    if (!data.days) data.days = {};
    return data;
  }

  function saveLocal() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* private mode / quota: keep in memory only */ }
  }

  function notify() {
    listeners.forEach((fn) => { try { fn(); } catch (e) { /* listener error must not break recording */ } });
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  /* ---------- public reads ---------- */

  function getAll() {
    return load();
  }

  function getStats(gameId) {
    const g = load().games[gameId] || emptyGame();
    const today = (load().days[todayKey()] || {})[gameId] || { c: 0, w: 0 };
    return { best: g.best, correct: g.correct, wrong: g.wrong, total: g.correct + g.wrong, today };
  }

  /* ---------- writes ---------- */

  function recordResult(gameId, wasCorrect, currentStreak, itemLabel) {
    const d = load();
    const g = d.games[gameId] || (d.games[gameId] = emptyGame());
    if (wasCorrect) g.correct += 1; else g.wrong += 1;
    if (currentStreak > g.best) g.best = currentStreak;
    if (itemLabel) {
      const it = g.items[itemLabel] || (g.items[itemLabel] = { c: 0, w: 0 });
      if (wasCorrect) it.c += 1; else it.w += 1;
    }
    const day = d.days[todayKey()] || (d.days[todayKey()] = {});
    const dg = day[gameId] || (day[gameId] = { c: 0, w: 0 });
    if (wasCorrect) dg.c += 1; else dg.w += 1;
    d.updatedAt = new Date().toISOString();
    saveLocal();
    scheduleCloudWrite();
    return getStats(gameId);
  }

  function reset() {
    data = emptyData();
    data.updatedAt = new Date().toISOString();
    saveLocal();
    scheduleCloudWrite();
    notify();
  }

  /* ---------- cloud mirror (claude.ai Artifact `db` capability) ---------- */

  function mergeCounts(a, b) {
    // Both sides are monotonic counters written by the same person on different
    // devices, so element-wise max is the safe merge.
    const out = {};
    new Set(Object.keys(a || {}).concat(Object.keys(b || {}))).forEach((k) => {
      const x = a && a[k], y = b && b[k];
      if (typeof x === 'number' || typeof y === 'number') out[k] = Math.max(x || 0, y || 0);
      else out[k] = mergeCounts(x || {}, y || {});
    });
    return out;
  }

  function mergeData(local, remote) {
    return {
      v: 2,
      updatedAt: new Date().toISOString(),
      games: mergeCounts(local.games, remote.games),
      days: mergeCounts(local.days, remote.days),
    };
  }

  function scheduleCloudWrite() {
    if (!cloudDoc) return;
    clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
      syncStatus = 'syncing';
      notify();
      cloudDoc.set(JSON.parse(JSON.stringify(data))).then(() => {
        syncStatus = 'cloud';
        notify();
      }).catch(() => {
        syncStatus = 'error';
        notify();
      });
    }, 1500);
  }

  function initSync() {
    if (!global.claude || typeof global.claude.use !== 'function') return;
    global.claude.use('db').then((db) => {
      if (!db) return;
      cloudDoc = db.doc(CLOUD_DOC);
      syncStatus = 'syncing';
      notify();
      return cloudDoc.get().then((snap) => {
        const remote = snap.exists ? snap.data() : null;
        const local = load();
        data = remote ? mergeData(local, remote) : local;
        saveLocal();
        syncStatus = 'cloud';
        notify();
        if (!remote || JSON.stringify(remote.games) !== JSON.stringify(data.games)
          || JSON.stringify(remote.days) !== JSON.stringify(data.days)) {
          scheduleCloudWrite();
        }
      });
    }).catch(() => {
      syncStatus = 'error';
      notify();
    });
  }

  function getSyncStatus() {
    return syncStatus;
  }

  global.Storage2 = { getStats, recordResult, getAll, reset, todayKey, onChange, initSync, getSyncStatus };
})(window);
