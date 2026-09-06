/* Stats screen: overview tiles, 14-day history chart, per-game table, weakest items. */
(function (global) {
  'use strict';

  const DAYS_SHOWN = 14;
  const el = GameUI.el;

  function pct(c, w) {
    const t = c + w;
    return t ? Math.round((c / t) * 100) : 0;
  }

  function dayKeyOffset(offset) {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return { key: d.getFullYear() + '-' + m + '-' + day, label: d.getDate() + '.' + (d.getMonth() + 1) + '.' };
  }

  function dayTotals(dayObj) {
    let c = 0, w = 0;
    Object.values(dayObj || {}).forEach((g) => { c += g.c || 0; w += g.w || 0; });
    return { c, w };
  }

  /** Consecutive training days ending today (or yesterday, if today is still empty). */
  function dayStreak(days) {
    let streak = 0;
    let offset = dayTotals(days[dayKeyOffset(0).key]).c + dayTotals(days[dayKeyOffset(0).key]).w > 0 ? 0 : 1;
    for (;; offset++) {
      const t = dayTotals(days[dayKeyOffset(offset).key]);
      if (t.c + t.w === 0) break;
      streak++;
    }
    return streak;
  }

  function svgEl(tag, attrs, text) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs).forEach((k) => e.setAttribute(k, attrs[k]));
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function buildChart(days) {
    const W = 600, H = 220, padL = 34, padR = 8, padT = 26, padB = 30;
    const rows = [];
    for (let i = DAYS_SHOWN - 1; i >= 0; i--) {
      const d = dayKeyOffset(i);
      rows.push(Object.assign({}, d, dayTotals(days[d.key])));
    }
    // Round the top of the scale up to a multiple of 4 so the 4 tick labels are whole numbers.
    const max = Math.ceil(Math.max(4, ...rows.map((r) => r.c + r.w)) / 4) * 4;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const slot = plotW / DAYS_SHOWN;
    const barW = Math.min(28, slot * 0.6);
    const y = (v) => padT + plotH - (v / max) * plotH;

    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'stats-chart', role: 'img', 'aria-label': 'Odpovede za posledných 14 dní' });
    const defs = svgEl('defs', {});
    const pat = svgEl('pattern', { id: 'hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
    pat.appendChild(svgEl('rect', { width: 6, height: 6, class: 'hatch-bg' }));
    pat.appendChild(svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 6, class: 'hatch-line' }));
    defs.appendChild(pat);
    svg.appendChild(defs);

    // Grid: 4 horizontal lines with tick labels.
    const ticks = 4;
    for (let t = 0; t <= ticks; t++) {
      const v = Math.round((max / ticks) * t);
      const yy = y(v);
      svg.appendChild(svgEl('line', { x1: padL, x2: W - padR, y1: yy, y2: yy, class: 'grid-line' }));
      svg.appendChild(svgEl('text', { x: padL - 6, y: yy + 4, class: 'axis-label', 'text-anchor': 'end' }, String(v)));
    }

    rows.forEach((r, i) => {
      const x = padL + slot * i + (slot - barW) / 2;
      const total = r.c + r.w;
      const g = svgEl('g', { class: 'bar-group' });
      g.appendChild(svgEl('title', {}, `${r.label}  ✔ ${r.c}  ✘ ${r.w}` + (total ? `  (${pct(r.c, r.w)} %)` : '')));
      // hover hit target wider than the bar
      g.appendChild(svgEl('rect', { x: padL + slot * i, y: padT, width: slot, height: plotH, class: 'bar-hit' }));
      if (r.c > 0) {
        g.appendChild(svgEl('rect', { x, y: y(r.c), width: barW, height: y(0) - y(r.c), rx: 3, class: 'bar-correct' }));
      }
      if (r.w > 0) {
        const top = y(total), bottom = y(r.c) - (r.c > 0 ? 2 : 0);
        g.appendChild(svgEl('rect', { x, y: top, width: barW, height: Math.max(0, bottom - top), rx: 3, fill: 'url(#hatch)', class: 'bar-wrong' }));
      }
      if (total > 0) {
        g.appendChild(svgEl('text', { x: x + barW / 2, y: y(total) - 6, class: 'bar-label', 'text-anchor': 'middle' }, pct(r.c, r.w) + '%'));
      }
      svg.appendChild(g);
      if (i % 2 === DAYS_SHOWN % 2 || DAYS_SHOWN <= 8) {
        svg.appendChild(svgEl('text', { x: x + barW / 2, y: H - 10, class: 'axis-label', 'text-anchor': 'middle' }, r.label));
      }
    });
    return svg;
  }

  function render(container) {
    const d = Storage2.getAll();
    container.innerHTML = '';
    const wrap = el('div', 'stats');

    // ---- header ----
    const header = el('div', 'game-header');
    header.appendChild(el('h2', null, 'Štatistiky'));
    const sync = el('div', 'sync-badge');
    const status = Storage2.getSyncStatus();
    sync.textContent = { local: 'Uložené v tomto prehliadači', syncing: 'Synchronizujem…', cloud: '☁ Synchronizované medzi zariadeniami', error: 'Synchronizácia zlyhala — dáta sú uložené lokálne' }[status];
    sync.className = 'sync-badge sync-' + status;
    header.appendChild(sync);
    wrap.appendChild(header);

    // ---- overview tiles ----
    let totC = 0, totW = 0;
    Object.values(d.games).forEach((g) => { totC += g.correct; totW += g.wrong; });
    const today = dayTotals(d.days[Storage2.todayKey()]);
    const trainedDays = Object.keys(d.days).filter((k) => { const t = dayTotals(d.days[k]); return t.c + t.w > 0; }).length;
    const tiles = el('div', 'stat-tiles');
    [
      ['Úspešnosť celkovo', pct(totC, totW) + ' %', `${totC} ✔ / ${totW} ✘`],
      ['Dnes', `${today.c} ✔ / ${today.w} ✘`, today.c + today.w ? pct(today.c, today.w) + ' % správne' : 'ešte nič — začni hrať'],
      ['Dní tréningu', String(trainedDays), 'celkovo'],
      ['Séria dní', String(dayStreak(d.days)), 'po sebe'],
    ].forEach(([label, value, sub]) => {
      const t = el('div', 'stat-tile');
      t.appendChild(el('div', 'stat-label', label));
      t.appendChild(el('div', 'stat-value', value));
      t.appendChild(el('div', 'stat-sub', sub));
      tiles.appendChild(t);
    });
    wrap.appendChild(tiles);

    // ---- chart ----
    const chartCard = el('section', 'stats-section');
    chartCard.appendChild(el('h3', null, 'Posledných 14 dní'));
    chartCard.appendChild(buildChart(d.days));
    const legend = el('div', 'chart-legend');
    legend.innerHTML = '<span><i class="sw sw-correct"></i> správne</span><span><i class="sw sw-wrong"></i> nesprávne</span><span class="muted">číslo nad stĺpcom = úspešnosť dňa</span>';
    chartCard.appendChild(legend);
    wrap.appendChild(chartCard);

    // ---- per-game table ----
    const tableCard = el('section', 'stats-section');
    tableCard.appendChild(el('h3', null, 'Podľa hry'));
    const table = el('table', 'stats-table');
    table.innerHTML = '<thead><tr><th>Hra</th><th>✔</th><th>✘</th><th>Úspešnosť</th><th>Najlepšia séria</th></tr></thead>';
    const tbody = el('tbody');
    Object.values(Games).forEach((game) => {
      const g = d.games[game.id] || { correct: 0, wrong: 0, best: 0 };
      const tr = el('tr');
      tr.appendChild(el('td', null, game.title));
      tr.appendChild(el('td', 'num', String(g.correct)));
      tr.appendChild(el('td', 'num', String(g.wrong)));
      const p = pct(g.correct, g.wrong);
      const cell = el('td');
      const bar = el('div', 'acc-bar');
      const fill = el('div', 'acc-fill');
      fill.style.width = p + '%';
      bar.appendChild(fill);
      cell.appendChild(bar);
      cell.appendChild(el('span', 'acc-text', g.correct + g.wrong ? p + ' %' : '—'));
      tr.appendChild(cell);
      tr.appendChild(el('td', 'num', String(g.best)));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    const tableWrap = el('div', 'table-wrap');
    tableWrap.appendChild(table);
    tableCard.appendChild(tableWrap);
    wrap.appendChild(tableCard);

    // ---- weakest items ----
    const weakCard = el('section', 'stats-section');
    weakCard.appendChild(el('h3', null, 'Na čom najviac zapracovať'));
    const items = [];
    Object.values(Games).forEach((game) => {
      const g = d.games[game.id];
      if (!g) return;
      Object.keys(g.items).forEach((label) => {
        const it = g.items[label];
        const p = pct(it.c, it.w);
        if (it.c + it.w >= 3 && p < 80) items.push({ game: game.title, label, c: it.c, w: it.w, p });
      });
    });
    items.sort((a, b) => a.p - b.p || (b.c + b.w) - (a.c + a.w));
    const anyItems = Object.values(d.games).some((g) => Object.values(g.items).some((it) => it.c + it.w >= 3));
    if (!items.length) {
      weakCard.appendChild(el('p', 'muted', anyItems
        ? 'Všetko, čo si skúšal aspoň 3×, máš nad 80 %. 💪'
        : 'Zobrazí sa, keď budeš mať aspoň 3 pokusy na jednu položku (interval, akord, slabiku…) s úspešnosťou pod 80 %.'));
    } else {
      const list = el('ul', 'weak-list');
      items.slice(0, 8).forEach((it) => {
        const li = el('li');
        li.innerHTML = `<span class="weak-game">${it.game}</span> <span class="weak-label">${it.label}</span> <span class="weak-num">${it.p} % <small>(${it.c}/${it.c + it.w})</small></span>`;
        list.appendChild(li);
      });
      weakCard.appendChild(list);
    }
    wrap.appendChild(weakCard);

    // ---- actions ----
    const actions = el('div', 'game-controls');
    const copyBtn = el('button', 'btn btn-secondary', 'Skopírovať zálohu (JSON)');
    copyBtn.addEventListener('click', () => {
      const text = JSON.stringify(d, null, 2);
      const done = () => { copyBtn.textContent = 'Skopírované ✔'; setTimeout(() => { copyBtn.textContent = 'Skopírovať zálohu (JSON)'; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => window.prompt('Skopíruj si zálohu:', text));
      else window.prompt('Skopíruj si zálohu:', text);
    });
    const resetBtn = el('button', 'btn btn-danger', 'Vymazať štatistiky');
    resetBtn.addEventListener('click', () => {
      if (window.confirm('Naozaj vymazať všetky štatistiky? Toto sa nedá vrátiť.')) {
        Storage2.reset();
        render(container);
      }
    });
    actions.appendChild(copyBtn);
    actions.appendChild(resetBtn);
    wrap.appendChild(actions);

    container.appendChild(wrap);
  }

  global.Stats = { render };
})(window);
