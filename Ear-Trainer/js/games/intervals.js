/* Intervals: hear tonic + another scale degree, name the interval. */
(function (global) {
  'use strict';

  function mount(container, App) {
    const ui = GameUI.buildScaffold(container, 'intervals', 'Intervals');
    ui.prompt.textContent = 'Vypočuj si interval medzi dvoma tónmi stupnice a pomenuj ho.';
    App.setPianoHandler(function () {});

    let current = null;
    let answered = false;

    function playQuestion() {
      const gap = 0.8;
      if (current.harmonic) {
        Audio2.playChord([current.tonicMidi, current.note.midi], 1.1, 0);
      } else {
        Audio2.playSequence([{ midi: current.tonicMidi }, { midi: current.note.midi }], gap);
      }
    }

    function newQuestion() {
      answered = false;
      ui.clearFeedback();
      ui.nextBtn.classList.add('hidden');
      App.piano.clearHighlights();

      const settings = App.getSettings();
      const tonicMidi = App.tonicMidi();
      const scale = Theory.buildScale(tonicMidi, settings.mode, settings.mode === 'minor');
      const octaveNote = Object.assign({}, scale[0], { midi: scale[0].midi + 12, degree: 8, label: scale[0].label });
      const candidates = scale.slice(1).concat([octaveNote]);
      const note = Theory.randomChoice(candidates);
      const harmonic = settings.difficulty === 'hard' && Math.random() < 0.5;
      current = { note, tonicMidi, harmonic };

      const pool = candidates.map((n) => Theory.semitoneToIntervalName(n.midi - tonicMidi));
      const uniquePool = Array.from(new Set(pool));
      const correctLabel = Theory.semitoneToIntervalName(note.midi - tonicMidi);
      let distractors = uniquePool.filter((n) => n !== correctLabel);
      distractors = shuffle(distractors).slice(0, 3);
      const choiceLabels = shuffle([correctLabel].concat(distractors));
      const choices = choiceLabels.map((label) => ({ label, value: label }));

      GameUI.buildChoiceGrid(ui.answerArea, choices, (choice, btn) => {
        if (answered) return;
        answered = true;
        const correct = choice.value === correctLabel;
        btn.classList.add(correct ? 'choice-correct' : 'choice-wrong');
        if (!correct) {
          Array.from(ui.answerArea.children).forEach((b, i) => {
            if (choiceLabels[i] === correctLabel) b.classList.add('choice-correct');
          });
        }
        App.piano.highlight(tonicMidi, 'highlight-correct');
        App.piano.highlight(note.midi, correct ? 'highlight-correct' : 'highlight-wrong');
        ui.showFeedback(correct, correct ? '✔ Správne! ' + correctLabel : '✘ Nesprávne. Bol to ' + correctLabel);
        ui.recordAnswer(correct);
        ui.nextBtn.classList.remove('hidden');
      });

      playQuestion();
    }

    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    ui.replayBtn.addEventListener('click', () => current && playQuestion());
    ui.nextBtn.addEventListener('click', newQuestion);

    newQuestion();
    return { destroy() {} };
  }

  global.Games = global.Games || {};
  global.Games.intervals = { id: 'intervals', title: 'Intervals', desc: 'Rozoznávaj intervaly medzi tónmi stupnice.', mount };
})(window);
