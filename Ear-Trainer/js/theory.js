/* Music theory helpers: notes, scales, chords, intervals. */
(function (global) {
  'use strict';

  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  // Enharmonic spellings used when a key needs flats (natural minor / flat major keys).
  const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
  const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];

  const SOLFEGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];

  // Diatonic triad qualities built on each scale degree (I..VII / i..VII).
  const MAJOR_TRIAD_QUALITIES = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
  const MINOR_TRIAD_QUALITIES = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'];

  const ROMAN_MAJOR = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
  const ROMAN_MINOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

  const CHORD_QUALITY_LABEL = { maj: 'Dur (Major)', min: 'Mol (Minor)', dim: 'Zmenšený (Diminished)' };
  const CHORD_INTERVALS = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6] };

  const INTERVAL_NAMES = [
    'Prima (P1)', 'Malá sekunda (m2)', 'Veľká sekunda (M2)', 'Malá tercia (m3)',
    'Veľká tercia (M3)', 'Kvarta (P4)', 'Tritón (TT)', 'Kvinta (P5)',
    'Malá sexta (m6)', 'Veľká sexta (M6)', 'Malá septima (m7)', 'Veľká septima (M7)',
    'Oktáva (P8)'
  ];

  const MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb', 'Ab'];
  const MINOR_KEYS = ['A', 'E', 'B', 'D', 'G', 'C', 'F', 'Bb', 'Eb'];

  function pitchClassIndex(name) {
    let idx = NOTE_NAMES.indexOf(name);
    if (idx !== -1) return idx;
    return FLAT_NAMES.indexOf(name);
  }

  function midiToName(midi, preferFlats) {
    const pc = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    const table = preferFlats ? FLAT_NAMES : NOTE_NAMES;
    return { name: table[pc], octave, label: table[pc] + octave, midi, pc };
  }

  function nameToMidi(name, octave) {
    const pc = pitchClassIndex(name);
    return pc + (octave + 1) * 12;
  }

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Build a diatonic scale starting at a given tonic midi note.
   * mode: 'major' | 'minor'
   * Returns array of { midi, name, octave, label, degree, solfege }
   */
  function buildScale(tonicMidi, mode, preferFlats) {
    const steps = mode === 'major' ? MAJOR_STEPS : MINOR_STEPS;
    return steps.map((step, i) => {
      const midi = tonicMidi + step;
      const info = midiToName(midi, preferFlats);
      return Object.assign({}, info, { degree: i + 1, solfege: SOLFEGE[i] });
    });
  }

  function triadQualities(mode) {
    return mode === 'major' ? MAJOR_TRIAD_QUALITIES : MINOR_TRIAD_QUALITIES;
  }

  function romanNumerals(mode) {
    return mode === 'major' ? ROMAN_MAJOR : ROMAN_MINOR;
  }

  /**
   * Build a diatonic triad on scale degree `degree` (1-based) of a scale generated
   * from tonicMidi/mode. Returns note objects (root, third, fifth) at absolute midi,
   * plus quality and roman numeral. Octave placement keeps the chord close to the tonic.
   */
  function diatonicTriad(tonicMidi, mode, degree, preferFlats) {
    const steps = mode === 'major' ? MAJOR_STEPS : MINOR_STEPS;
    const n = steps.length;
    const idx = degree - 1;
    function scaleDegreeMidi(i) {
      const octaveShift = Math.floor(i / n);
      const stepIdx = ((i % n) + n) % n;
      return tonicMidi + steps[stepIdx] + octaveShift * 12;
    }
    const rootMidi = scaleDegreeMidi(idx);
    const thirdMidi = scaleDegreeMidi(idx + 2);
    const fifthMidi = scaleDegreeMidi(idx + 4);
    const quality = triadQualities(mode)[idx];
    const roman = romanNumerals(mode)[idx];
    const notes = [rootMidi, thirdMidi, fifthMidi].map((m) => midiToName(m, preferFlats));
    return { notes, quality, roman, degree, rootMidi };
  }

  /**
   * Return chord tones for a given inversion (0 = root, 1 = 1st inv, 2 = 2nd inv),
   * by moving the appropriate bottom note(s) up an octave so it becomes the bass.
   */
  function applyInversion(triad, inversion) {
    let midis = triad.notes.map((n) => n.midi).slice().sort((a, b) => a - b);
    for (let i = 0; i < inversion; i++) {
      const lowest = midis.shift();
      midis.push(lowest + 12);
    }
    return midis;
  }

  function semitoneToIntervalName(semitones) {
    const s = Math.abs(semitones) % 12;
    return INTERVAL_NAMES[s === 0 && Math.abs(semitones) >= 12 ? 12 : s];
  }

  function randomInt(min, maxInclusive) {
    return min + Math.floor(Math.random() * (maxInclusive - min + 1));
  }

  function randomChoice(arr) {
    return arr[randomInt(0, arr.length - 1)];
  }

  global.Theory = {
    NOTE_NAMES, FLAT_NAMES, MAJOR_STEPS, MINOR_STEPS, SOLFEGE,
    MAJOR_KEYS, MINOR_KEYS, CHORD_QUALITY_LABEL, CHORD_INTERVALS, INTERVAL_NAMES,
    pitchClassIndex, midiToName, nameToMidi, midiToFreq, buildScale,
    triadQualities, romanNumerals, diatonicTriad, applyInversion,
    semitoneToIntervalName, randomInt, randomChoice,
  };
})(window);
