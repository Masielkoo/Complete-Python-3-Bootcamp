/* Notationist: see a note on the staff, click the matching key on the piano. */
(function (global) {
  'use strict';

  function mount(container, App) {
    const ui = GameUI.buildScaffold(container, 'notationist', 'Notationist');
    ui.prompt.textContent = 'Pozri sa na notu a klikni na zodpovedajúci tón na klaviatúre.';

    const staffBox = GameUI.el('div', 'staff-box');
    ui.prompt.appendChild(staffBox);
    ui.answerArea.innerHTML = '<p class="hint">Odpovedaj priamo na klaviatúre nižšie ⌨️🎹</p>';
    ui.replayBtn.textContent = '🔊 Prehrať tón (pomôcka)';

    let current = null;
    let answered = false;

    function drawQuestion() {
      Staff.renderNote(staffBox, current.note);
    }

    function newQuestion() {
      answered = false;
      ui.clearFeedback();
      ui.nextBtn.classList.add('hidden');
      App.piano.clearHighlights();

      const settings = App.getSettings();
      // Octave 4 keeps the notes on/around the treble staff instead of far below it.
      const tonicMidi = App.tonicMidi(4);
      const scale = Theory.buildScale(tonicMidi, settings.mode, settings.mode === 'minor');
      const maxDegree = settings.difficulty === 'easy' ? 5 : 7;
      const note = Theory.randomChoice(scale.slice(0, maxDegree));
      current = { note };
      drawQuestion();

      App.setPianoHandler(function (midi) {
        if (answered) return;
        answered = true;
        const correct = midi === note.midi;
        App.piano.highlight(midi, correct ? 'highlight-correct' : 'highlight-wrong');
        if (!correct) App.piano.highlight(note.midi, 'highlight-correct');
        Audio2.playNote(note.midi, 0.7, 0.1);
        ui.showFeedback(correct, correct ? '✔ Správne!' : '✘ Nesprávne. Bola to nota ' + note.label);
        ui.recordAnswer(correct);
        ui.nextBtn.classList.remove('hidden');
      });
    }

    ui.replayBtn.addEventListener('click', () => current && Audio2.playNote(current.note.midi, 0.7, 0));
    ui.nextBtn.addEventListener('click', newQuestion);

    newQuestion();
    return { destroy() { App.setPianoHandler(function () {}); } };
  }

  global.Games = global.Games || {};
  global.Games.notationist = { id: 'notationist', title: 'Notationist', desc: 'Čítaj noty z osnovy a hraj ich na klaviatúre.', mount };
})(window);
