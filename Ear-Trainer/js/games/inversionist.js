/* Inversionist: hear a triad in root position / 1st / 2nd inversion, identify which. */
(function (global) {
  'use strict';

  const INV_CHOICES = [
    { label: 'Základný tvar', value: 0 },
    { label: '1. obrat', value: 1 },
    { label: '2. obrat', value: 2 },
  ];

  function mount(container, App) {
    const ui = GameUI.buildScaffold(container, 'inversionist', 'Inversionist');
    ui.prompt.textContent = 'Vypočuj si akord a uhádni, v akom obrate znie.';
    App.setPianoHandler(function () {});

    let current = null;
    let answered = false;

    function playQuestion() {
      const settings = App.getSettings();
      if (settings.difficulty === 'easy') {
        Audio2.playSequence(current.midis.map((m) => ({ midi: m, duration: 0.55 })), 0.4);
        setTimeout(() => Audio2.playChord(current.midis, 1.2), current.midis.length * 400 + 150);
      } else {
        Audio2.playChord(current.midis, 1.4);
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
      const inversion = settings.difficulty === 'easy' ? Theory.randomInt(0, 1) : Theory.randomInt(0, 2);
      const midis = Theory.applyInversion(triad, inversion);
      current = { triad, inversion, midis };

      GameUI.buildChoiceGrid(ui.answerArea, INV_CHOICES, (choice, btn) => {
        if (answered) return;
        answered = true;
        const correct = choice.value === inversion;
        btn.classList.add(correct ? 'choice-correct' : 'choice-wrong');
        if (!correct) {
          Array.from(ui.answerArea.children).forEach((b, i) => {
            if (INV_CHOICES[i].value === inversion) b.classList.add('choice-correct');
          });
        }
        midis.forEach((m) => App.piano.highlight(m, correct ? 'highlight-correct' : 'highlight-wrong'));
        ui.showFeedback(correct,
          (correct ? '✔ Správne! ' : '✘ Nesprávne. ') + 'Bol to ' + triad.roman + ' v ' + INV_CHOICES[inversion].label.toLowerCase());
        ui.recordAnswer(correct, INV_CHOICES[inversion].label);
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
  global.Games.inversionist = { id: 'inversionist', title: 'Inversionist', desc: 'Rozoznaj základný tvar, 1. a 2. obrat akordu.', mount };
})(window);
