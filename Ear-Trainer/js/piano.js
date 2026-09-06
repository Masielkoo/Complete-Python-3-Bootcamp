/* Renders an interactive on-screen piano keyboard. */
(function (global) {
  'use strict';

  const WHITE_PC = [0, 2, 4, 5, 7, 9, 11];
  const WHITE_KEY_W = 40;
  const BLACK_KEY_W = 24;

  /**
   * Build a piano inside `container`.
   * options: { startMidi, endMidi, onNotePlay(midi), labelMode: 'none'|'letters'|'solfege', getLabel(midi) }
   */
  function createPiano(container, options) {
    const startMidi = options.startMidi;
    const endMidi = options.endMidi;
    const onNotePlay = options.onNotePlay || function () {};

    container.innerHTML = '';
    container.classList.add('piano');

    const inner = document.createElement('div');
    inner.className = 'piano-inner';
    container.appendChild(inner);

    const keyEls = {}; // midi -> element
    let whiteX = 0;
    const whiteKeys = [];
    const blackKeys = [];

    for (let midi = startMidi; midi <= endMidi; midi++) {
      const pc = ((midi % 12) + 12) % 12;
      const isWhite = WHITE_PC.indexOf(pc) !== -1;
      if (isWhite) {
        whiteKeys.push({ midi, x: whiteX });
        whiteX += WHITE_KEY_W;
      } else {
        blackKeys.push({ midi, x: whiteX - BLACK_KEY_W / 2 });
      }
    }

    inner.style.width = whiteX + 'px';

    function makeKey(midi, isWhite, x) {
      const el = document.createElement('div');
      el.className = isWhite ? 'key white' : 'key black';
      el.style.left = x + 'px';
      el.dataset.midi = String(midi);
      if (options.labelMode && options.labelMode !== 'none' && isWhite) {
        const label = document.createElement('span');
        label.className = 'key-label';
        label.textContent = options.getLabel ? (options.getLabel(midi) || '') : '';
        el.appendChild(label);
      }
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        pressKey(midi);
        onNotePlay(midi);
      });
      keyEls[midi] = el;
      return el;
    }

    whiteKeys.forEach((k) => inner.appendChild(makeKey(k.midi, true, k.x)));
    blackKeys.forEach((k) => inner.appendChild(makeKey(k.midi, false, k.x)));

    function pressKey(midi) {
      const el = keyEls[midi];
      if (!el) return;
      el.classList.add('pressed');
      setTimeout(() => el.classList.remove('pressed'), 180);
    }

    function highlight(midi, cls) {
      const el = keyEls[midi];
      if (!el) return;
      el.classList.add(cls || 'highlight-correct');
    }

    function clearHighlights() {
      Object.values(keyEls).forEach((el) => {
        el.classList.remove('highlight-correct', 'highlight-wrong', 'highlight-active');
      });
    }

    function setEnabled(enabled) {
      container.classList.toggle('piano-disabled', !enabled);
    }

    function refreshLabels(getLabel) {
      Object.keys(keyEls).forEach((midiStr) => {
        const midi = Number(midiStr);
        const el = keyEls[midi];
        const label = el.querySelector('.key-label');
        if (label) label.textContent = getLabel(midi) || '';
      });
    }

    return { highlight, clearHighlights, setEnabled, pressKey, refreshLabels, keyEls };
  }

  global.Piano = { createPiano };
})(window);
