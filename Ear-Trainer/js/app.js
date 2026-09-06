/* App shell: menu, settings, shared piano instance, game switching. */
(function (global) {
  'use strict';

  const PIANO_START = Theory.nameToMidi('C', 3); // 48
  const PIANO_END = Theory.nameToMidi('C', 6); // 84

  const state = {
    mode: 'major',
    tonicName: 'C',
    difficulty: 'normal',
    showLabels: false,
    currentGameId: null,
  };

  let pianoApi = null;
  let onNotePlay = function () {};

  const App = {
    getSettings() {
      return { mode: state.mode, tonicName: state.tonicName, difficulty: state.difficulty };
    },
    tonicMidi(octave) {
      return Theory.nameToMidi(state.tonicName, octave === undefined ? 3 : octave);
    },
    piano: null, // set after createPiano
    setPianoHandler(fn) {
      onNotePlay = fn;
    },
  };

  function labelForKey(midi) {
    if (!state.showLabels) return '';
    const info = Theory.midiToName(midi, state.mode === 'minor');
    return info.name;
  }

  function initPiano() {
    const container = document.getElementById('piano-container');
    pianoApi = Piano.createPiano(container, {
      startMidi: PIANO_START,
      endMidi: PIANO_END,
      labelMode: 'letters',
      getLabel: labelForKey,
      onNotePlay(midi) {
        Audio2.playNote(midi, 0.8, 0);
        onNotePlay(midi);
      },
    });
    App.piano = pianoApi;
  }

  function refreshPianoLabels() {
    if (pianoApi) pianoApi.refreshLabels(labelForKey);
  }

  function populateKeySelect() {
    const sel = document.getElementById('key-select');
    sel.innerHTML = '';
    const keys = state.mode === 'major' ? Theory.MAJOR_KEYS : Theory.MINOR_KEYS;
    keys.forEach((k) => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k + (state.mode === 'major' ? ' dur' : ' mol');
      sel.appendChild(opt);
    });
    sel.value = keys.includes(state.tonicName) ? state.tonicName : keys[0];
    state.tonicName = sel.value;
  }

  function currentGameConfig() {
    return Object.values(Games).find((g) => g.id === state.currentGameId);
  }

  let activeGameHandle = null;

  function openGame(gameId) {
    state.currentGameId = gameId;
    document.querySelectorAll('.menu-card').forEach((c) => c.classList.toggle('active', c.dataset.game === gameId));
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('back-btn').classList.remove('hidden');

    if (activeGameHandle && activeGameHandle.destroy) activeGameHandle.destroy();
    onNotePlay = function () {};
    pianoApi.clearHighlights();

    const config = Games[gameId];
    const container = document.getElementById('game-container');
    activeGameHandle = config.mount(container, App);
  }

  function backToMenu() {
    document.getElementById('menu-screen').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('back-btn').classList.add('hidden');
    if (activeGameHandle && activeGameHandle.destroy) activeGameHandle.destroy();
    activeGameHandle = null;
    onNotePlay = function () {};
    if (pianoApi) pianoApi.clearHighlights();
  }

  function buildMenu() {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';
    Object.values(Games).forEach((g) => {
      const card = document.createElement('button');
      card.className = 'menu-card';
      card.dataset.game = g.id;
      card.innerHTML = `<h3>${g.title}</h3><p>${g.desc}</p>`;
      card.addEventListener('click', () => {
        Audio2.unlock();
        openGame(g.id);
      });
      grid.appendChild(card);
    });
  }

  function wireSettings() {
    const modeSelect = document.getElementById('mode-select');
    const keySelect = document.getElementById('key-select');
    const diffSelect = document.getElementById('difficulty-select');
    const labelsToggle = document.getElementById('labels-toggle');

    modeSelect.addEventListener('change', () => {
      state.mode = modeSelect.value;
      populateKeySelect();
      refreshPianoLabels();
    });
    keySelect.addEventListener('change', () => {
      state.tonicName = keySelect.value;
    });
    diffSelect.addEventListener('change', () => {
      state.difficulty = diffSelect.value;
    });
    labelsToggle.addEventListener('change', () => {
      state.showLabels = labelsToggle.checked;
      refreshPianoLabels();
    });

    document.getElementById('back-btn').addEventListener('click', backToMenu);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initPiano();
    populateKeySelect();
    buildMenu();
    wireSettings();
    document.body.addEventListener('pointerdown', Audio2.unlock, { once: true });
  });

  global.App = App;
})(window);
