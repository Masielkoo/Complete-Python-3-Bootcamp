/* Minimal Web Audio synth — no external libraries/CDN required. */
(function (global) {
  'use strict';

  let ctx = null;
  let masterGain = null;

  function ensureContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.9;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /** Play one note. midi = MIDI number. duration/startDelay in seconds. */
  function playNote(midi, duration, startDelay, velocity) {
    duration = duration || 0.9;
    startDelay = startDelay || 0;
    velocity = velocity === undefined ? 0.8 : velocity;
    const audioCtx = ensureContext();
    const freq = Theory.midiToFreq(midi);
    const t0 = audioCtx.currentTime + startDelay;

    const gain = audioCtx.createGain();
    gain.connect(masterGain);

    // Two detuned oscillators (triangle + sine) for a warmer, piano-ish tone.
    const osc1 = audioCtx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.value = freq;
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq / 2;
    const osc2Gain = audioCtx.createGain();
    osc2Gain.gain.value = 0.25;

    osc1.connect(gain);
    osc2.connect(osc2Gain);
    osc2Gain.connect(gain);

    // Percussive envelope: fast attack, exponential decay/release.
    const peak = velocity;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak * 0.25, 0.0001), t0 + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc1.start(t0);
    osc2.start(t0);
    osc1.stop(t0 + duration + 0.05);
    osc2.stop(t0 + duration + 0.05);
  }

  /** Play several notes together (a chord). */
  function playChord(midis, duration, startDelay) {
    midis.forEach((m) => playNote(m, duration, startDelay, 0.55));
  }

  /** Play a melodic sequence: [{midi, duration}], `gap` seconds between note starts. */
  function playSequence(notes, gap) {
    gap = gap || 0.55;
    notes.forEach((n, i) => {
      playNote(n.midi, n.duration || gap * 0.95, i * gap, 0.8);
    });
    return notes.length * gap;
  }

  function unlock() {
    ensureContext();
  }

  global.Audio2 = { playNote, playChord, playSequence, unlock };
})(window);
