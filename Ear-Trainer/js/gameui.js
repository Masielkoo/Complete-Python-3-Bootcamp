/* Small reusable UI building blocks shared by every mini-game. */
(function (global) {
  'use strict';

  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function buildScaffold(container, gameId, title) {
    container.innerHTML = '';
    const wrap = el('div', 'game');

    const header = el('div', 'game-header');
    header.appendChild(el('h2', null, title));
    const scoreEl = el('div', 'game-score');
    header.appendChild(scoreEl);
    wrap.appendChild(header);

    const prompt = el('div', 'game-prompt');
    wrap.appendChild(prompt);

    const controls = el('div', 'game-controls');
    const replayBtn = el('button', 'btn btn-secondary', '🔊 Prehrať znova');
    controls.appendChild(replayBtn);
    wrap.appendChild(controls);

    const answerArea = el('div', 'answer-area');
    wrap.appendChild(answerArea);

    const feedback = el('div', 'game-feedback');
    wrap.appendChild(feedback);

    const nextControls = el('div', 'game-controls');
    const nextBtn = el('button', 'btn btn-primary hidden', 'Ďalej →');
    nextControls.appendChild(nextBtn);
    wrap.appendChild(nextControls);

    container.appendChild(wrap);

    let streak = 0;
    function renderScore() {
      const s = Storage2.getStats(gameId);
      const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
      scoreEl.innerHTML =
        `<span>Séria <b>${streak}</b></span>` +
        `<span>Najlepšia <b>${s.best}</b></span>` +
        `<span>Dnes <b class="ok">✔ ${s.today.c}</b> <b class="ko">✘ ${s.today.w}</b></span>` +
        `<span>Celkovo <b>${pct}%</b> <small>(${s.correct}/${s.total})</small></span>`;
    }
    renderScore();

    /** itemLabel = the correct answer (interval name, syllable, chord quality…) for per-item stats. */
    function recordAnswer(correct, itemLabel) {
      streak = correct ? streak + 1 : 0;
      Storage2.recordResult(gameId, correct, streak, itemLabel);
      renderScore();
    }

    function showFeedback(correct, text) {
      feedback.className = 'game-feedback ' + (correct ? 'feedback-correct' : 'feedback-wrong');
      feedback.textContent = text;
    }

    function clearFeedback() {
      feedback.className = 'game-feedback';
      feedback.textContent = '';
    }

    return { prompt, answerArea, replayBtn, nextBtn, recordAnswer, showFeedback, clearFeedback };
  }

  function buildChoiceGrid(container, choices, onChoose) {
    container.innerHTML = '';
    const buttons = choices.map((choice) => {
      const b = el('button', 'btn btn-choice', choice.label);
      b.addEventListener('click', () => onChoose(choice, b));
      container.appendChild(b);
      return b;
    });
    return buttons;
  }

  global.GameUI = { el, buildScaffold, buildChoiceGrid };
})(window);
