/* Melody Hunter: hear a short melody, replay it by clicking the piano keys in order. */
(function (global) {
  'use strict';

  function mount(container, App) {
    const ui = GameUI.buildScaffold(container, 'melodyHunter', 'Melody Hunter');
    ui.prompt.textContent = 'Vypočuj si melódiu a zopakuj ju kliknutím na klaviatúru.';
    ui.answerArea.innerHTML = '<p class="hint">Odpovedaj priamo na klaviatúre nižšie ⌨️🎹</p>';

    let current = null;
    let answered = false;
    let position = 0;

    function lengthForDifficulty(d) {
      if (d === 'easy') return 3;
      if (d === 'hard') return 6;
      return 4;
    }

    function playQuestion() {
      Audio2.playSequence(current.melody.map((n) => ({ midi: n.midi })), 0.62);
    }

    function newQuestion() {
      answered = false;
      position = 0;
      ui.clearFeedback();
      ui.nextBtn.classList.add('hidden');
      App.piano.clearHighlights();

      const settings = App.getSettings();
      const tonicMidi = App.tonicMidi();
      const scale = Theory.buildScale(tonicMidi, settings.mode, settings.mode === 'minor');
      const octaveNote = Object.assign({}, scale[0], { midi: scale[0].midi + 12 });
      const pool = scale.concat([octaveNote]);
      const len = lengthForDifficulty(settings.difficulty);
      const melody = [Theory.randomChoice(scale)];
      for (let i = 1; i < len; i++) melody.push(Theory.randomChoice(pool));
      current = { melody };

      App.setPianoHandler(function (midi) {
        if (answered) return;
        const expected = current.melody[position];
        if (midi === expected.midi) {
          App.piano.highlight(midi, 'highlight-correct');
          position++;
          if (position >= current.melody.length) {
            answered = true;
            ui.showFeedback(true, '✔ Výborne! Zahral si celú melódiu správne.');
            ui.recordAnswer(true);
            ui.nextBtn.classList.remove('hidden');
          }
        } else {
          App.piano.highlight(midi, 'highlight-wrong');
          answered = true;
          ui.showFeedback(false, '✘ Nesprávne. Skús si melódiu vypočuť znova.');
          ui.recordAnswer(false);
          setTimeout(() => {
            current.melody.forEach((n, i) => setTimeout(() => App.piano.highlight(n.midi, 'highlight-correct'), i * 260));
          }, 300);
          ui.nextBtn.classList.remove('hidden');
        }
      });

      playQuestion();
    }

    ui.replayBtn.addEventListener('click', () => current && playQuestion());
    ui.nextBtn.addEventListener('click', newQuestion);

    newQuestion();
    return { destroy() { App.setPianoHandler(function () {}); } };
  }

  global.Games = global.Games || {};
  global.Games.melodyHunter = { id: 'melodyHunter', title: 'Melody Hunter', desc: 'Vypočuj a zopakuj krátku melódiu na klaviatúre.', mount };
})(window);
