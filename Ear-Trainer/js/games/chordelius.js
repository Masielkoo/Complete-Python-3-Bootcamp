/* Chordelius: hear a diatonic triad, identify its quality (major / minor / diminished). */
(function (global) {
  'use strict';

  const QUALITY_CHOICES = [
    { label: 'Dur (Major)', value: 'maj' },
    { label: 'Mol (Minor)', value: 'min' },
    { label: 'Zmenšený (Diminished)', value: 'dim' },
  ];

  function mount(container, App) {
    const ui = GameUI.buildScaffold(container, 'chordelius', 'Chordelius');
    ui.prompt.textContent = 'Vypočuj si akord postavený na stupnici a uhádni jeho typ.';
    App.setPianoHandler(function () {});

    let current = null;
    let answered = false;

    function playQuestion() {
      const arpeggiate = App.getSettings().difficulty !== 'easy' && Math.random() < 0.4;
      if (arpeggiate) {
        Audio2.playSequence(current.triad.notes.map((n) => ({ midi: n.midi, duration: 0.5 })), 0.28);
        setTimeout(() => Audio2.playChord(current.triad.notes.map((n) => n.midi), 1.2), 900);
      } else {
        Audio2.playChord(current.triad.notes.map((n) => n.midi), 1.4);
      }
    }

    function newQuestion() {
      answered = false;
      ui.clearFeedback();
      ui.nextBtn.classList.add('hidden');
      App.piano.clearHighlights();

      const settings = App.getSettings();
      const tonicMidi = App.tonicMidi();
      const maxDegree = settings.difficulty === 'easy' ? 5 : 7;
      const degree = Theory.randomInt(1, maxDegree);
      const triad = Theory.diatonicTriad(tonicMidi, settings.mode, degree, settings.mode === 'minor');
      current = { triad, degree };

      const choices = QUALITY_CHOICES;
      GameUI.buildChoiceGrid(ui.answerArea, choices, (choice, btn) => {
        if (answered) return;
        answered = true;
        const correct = choice.value === triad.quality;
        btn.classList.add(correct ? 'choice-correct' : 'choice-wrong');
        if (!correct) {
          Array.from(ui.answerArea.children).forEach((b, i) => {
            if (choices[i].value === triad.quality) b.classList.add('choice-correct');
          });
        }
        triad.notes.forEach((n) => App.piano.highlight(n.midi, correct ? 'highlight-correct' : 'highlight-wrong'));
        ui.showFeedback(correct,
          (correct ? '✔ Správne! ' : '✘ Nesprávne. ') + 'Bol to akord ' + triad.roman + ' (' + Theory.CHORD_QUALITY_LABEL[triad.quality] + ')');
        ui.recordAnswer(correct);
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
  global.Games.chordelius = { id: 'chordelius', title: 'Chordelius', desc: 'Uhádni, či je akord dur, mol alebo zmenšený.', mount };
})(window);
