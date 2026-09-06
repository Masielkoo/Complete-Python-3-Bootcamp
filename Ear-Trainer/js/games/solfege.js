/* Solfège: hear a scale degree, name it (Do Re Mi Fa Sol La Si). */
(function (global) {
  'use strict';

  function mount(container, App) {
    const ui = GameUI.buildScaffold(container, 'solfege', 'Solfège');
    ui.prompt.textContent = 'Vypočuj si tón a uhádni jeho solfežný názov.';
    App.setPianoHandler(function () {});

    let current = null;
    let answered = false;

    function playQuestion() {
      const s = App.getSettings();
      Audio2.playNote(current.tonicMidi, 0.6, 0);
      Audio2.playNote(current.note.midi, 0.7, 0.75);
    }

    function newQuestion() {
      answered = false;
      ui.clearFeedback();
      ui.nextBtn.classList.add('hidden');
      App.piano.clearHighlights();

      const settings = App.getSettings();
      const tonicMidi = App.tonicMidi();
      const scale = Theory.buildScale(tonicMidi, settings.mode, settings.mode === 'minor');
      const pool = settings.difficulty === 'easy' ? [scale[0], scale[2], scale[4]] : scale.slice(0, 7);
      const note = Theory.randomChoice(pool);
      current = { note, tonicMidi };

      const choices = Theory.SOLFEGE.map((syl, i) => ({ label: syl, value: i + 1 }));
      const buttons = GameUI.buildChoiceGrid(ui.answerArea, choices, (choice, btn) => {
        if (answered) return;
        answered = true;
        const correct = choice.value === note.degree;
        btn.classList.add(correct ? 'choice-correct' : 'choice-wrong');
        if (!correct) {
          const correctBtn = Array.from(ui.answerArea.children)[note.degree - 1];
          if (correctBtn) correctBtn.classList.add('choice-correct');
        }
        App.piano.highlight(note.midi, correct ? 'highlight-correct' : 'highlight-wrong');
        ui.showFeedback(correct, correct ? '✔ Správne! To bolo ' + note.solfege : '✘ Nesprávne. Bolo to ' + note.solfege);
        ui.recordAnswer(correct, note.solfege);
        ui.nextBtn.classList.remove('hidden');
      });

      playQuestion();
    }

    ui.replayBtn.addEventListener('click', () => current && playQuestion());
    ui.nextBtn.addEventListener('click', newQuestion);

    newQuestion();
    return { destroy() {} };
  }

  global.Games = global.Games || {};
  global.Games.solfege = { id: 'solfege', title: 'Solfège', desc: 'Hádaj do-re-mi-fa-sol-la-si podľa sluchu.', mount };
})(window);
