/* Very small treble-clef staff renderer (SVG), just enough to place one notehead. */
(function (global) {
  'use strict';

  const LETTER_INDEX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  const LINE_SPACING = 12;
  const WIDTH = 200;
  const HEIGHT = 140;
  const STAFF_LEFT = 60;
  const STAFF_RIGHT = WIDTH - 20;
  const BOTTOM_LINE_Y = 100; // y of E4 line
  const NOTEHEAD_X = 130;

  function diatonicPosition(letter, octave) {
    // position 0 = E4 (bottom line), +2 per diatonic step up a line/space pair combo... (computed per-step, see below)
    const idx = LETTER_INDEX[letter] + 7 * octave;
    const e4 = LETTER_INDEX['E'] + 7 * 4;
    return idx - e4;
  }

  function svgEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs || {}).forEach((k) => el.setAttribute(k, attrs[k]));
    return el;
  }

  /**
   * Render a single note on a treble staff.
   * note: { name: 'C'|'C#'|'Db'..., octave: number }
   */
  function renderNote(container, note) {
    container.innerHTML = '';
    const svg = svgEl('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, class: 'staff-svg' });

    // Five staff lines.
    for (let i = 0; i < 5; i++) {
      const y = BOTTOM_LINE_Y - i * LINE_SPACING;
      svg.appendChild(svgEl('line', {
        x1: STAFF_LEFT, y1: y, x2: STAFF_RIGHT, y2: y, class: 'staff-line',
      }));
    }

    // Treble clef glyph.
    const clef = svgEl('text', { x: STAFF_LEFT - 30, y: BOTTOM_LINE_Y + 8, class: 'clef-glyph' });
    clef.textContent = '\u{1D11E}';
    svg.appendChild(clef);

    const letter = note.name[0];
    const accidental = note.name.length > 1 ? note.name[1] : null; // '#' or 'b'
    const pos = diatonicPosition(letter, note.octave);
    const y = BOTTOM_LINE_Y - pos * (LINE_SPACING / 2);

    // Ledger lines above/below the staff.
    const ledgerWidth = 20;
    if (pos < 0) {
      for (let p = -2; p >= pos; p -= 2) {
        const ly = BOTTOM_LINE_Y - p * (LINE_SPACING / 2);
        svg.appendChild(svgEl('line', {
          x1: NOTEHEAD_X - ledgerWidth / 2, y1: ly, x2: NOTEHEAD_X + ledgerWidth / 2, y2: ly, class: 'ledger-line',
        }));
      }
    } else if (pos > 8) {
      for (let p = 10; p <= pos; p += 2) {
        const ly = BOTTOM_LINE_Y - p * (LINE_SPACING / 2);
        svg.appendChild(svgEl('line', {
          x1: NOTEHEAD_X - ledgerWidth / 2, y1: ly, x2: NOTEHEAD_X + ledgerWidth / 2, y2: ly, class: 'ledger-line',
        }));
      }
    }

    if (accidental) {
      const sym = svgEl('text', { x: NOTEHEAD_X - 22, y: y + 5, class: 'accidental' });
      sym.textContent = accidental === '#' ? '♯' : '♭';
      svg.appendChild(sym);
    }

    const head = svgEl('ellipse', {
      cx: NOTEHEAD_X, cy: y, rx: 7, ry: 5.5, class: 'notehead', transform: `rotate(-18 ${NOTEHEAD_X} ${y})`,
    });
    svg.appendChild(head);

    // Stem.
    const stemUp = pos < 4;
    const stemX = stemUp ? NOTEHEAD_X + 6.5 : NOTEHEAD_X - 6.5;
    const stemY2 = stemUp ? y - 32 : y + 32;
    svg.appendChild(svgEl('line', { x1: stemX, y1: y, x2: stemX, y2: stemY2, class: 'stem' }));

    container.appendChild(svg);
  }

  global.Staff = { renderNote };
})(window);
