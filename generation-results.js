(() => {
  'use strict';

  // Development scores (%) of the retained program at G0–G3, at the paper figure’s precision.
  // Source: curves.json, cross-checked against the coordinates used for supp_devlines.pdf.
  const scores = {
    gpt: {
      cards: { evo: [11.1, 74.3, 81.2, 100.0], auto: [5.6, 5.6, 44.4, 44.4] },
      gallery: { evo: [25.0, 62.5, 62.5, 62.5], auto: [25.0, 25.0, 25.0, 25.0] },
      maze: { evo: [25.0, 75.0, 100.0, 100.0], auto: [18.8, 100.0, 100.0, 100.0] },
      dmv: { evo: [6.2, 83.3, 100.0, 100.0], auto: [2.1, 33.3, 35.4, 41.7] },
      tetris: { evo: [42.5, 75.7, 75.7, 75.7], auto: [41.5, 77.2, 77.2, 77.2] },
      pacman: { evo: [29.8, 36.0, 79.8, 79.8], auto: [28.4, 44.2, 44.2, 51.2] },
    },
    haiku: {
      cards: { evo: [3.5, 63.2, 100.0, 100.0], auto: [6.9, 34.7, 68.8, 68.8] },
      gallery: { evo: [25.0, 81.2, 100.0, 100.0], auto: [25.0, 25.0, 25.0, 25.0] },
      maze: { evo: [0.0, 25.0, 50.0, 81.2], auto: [18.8, 18.8, 25.0, 31.2] },
      dmv: { evo: [14.6, 79.2, 81.2, 83.3], auto: [20.8, 37.5, 37.5, 37.5] },
      tetris: { evo: [34.5, 61.5, 77.3, 84.7], auto: [34.8, 34.8, 34.8, 34.8] },
      pacman: { evo: [39.2, 49.8, 59.8, 67.8], auto: [20.0, 38.6, 64.8, 64.8] },
    },
    qwen: {
      cards: { evo: [0.7, 100.0, 100.0, 100.0], auto: [0.7, 14.6, 14.6, 16.7] },
      gallery: { evo: [25.0, 75.0, 100.0, 100.0], auto: [25.0, 25.0, 25.0, 25.0] },
      maze: { evo: [25.0, 87.5, 100.0, 100.0], auto: [25.0, 25.0, 25.0, 25.0] },
      dmv: { evo: [4.2, 14.6, 45.8, 54.2], auto: [25.0, 35.4, 37.5, 39.6] },
      tetris: { evo: [43.3, 100.0, 100.0, 100.0], auto: [35.1, 35.1, 47.8, 47.8] },
      pacman: { evo: [28.8, 40.6, 82.6, 82.6], auto: [28.6, 37.0, 39.6, 39.6] },
    },
  };

  const chart = document.getElementById('generation-chart');
  const catalog = window.EVOVIM_RESULTS;
  if (!chart || !catalog) return;

  const methods = [{ key: 'evo', label: 'EvoViM' }, { key: 'auto', label: 'AutoMem' }];
  const x = generation => 37 + 88 * generation;
  const y = score => 148 - 1.32 * score;

  chart.innerHTML = `
    <div class="gen-controls">
      <label>Task <select id="generation-task">
        ${catalog.tasks.map(task => `<option value="${task.key}">${task.label}</option>`).join('')}
      </select></label>
      <div class="gen-key">${methods.map(method =>
        `<span class="gen-${method.key}"><i aria-hidden="true"></i>${method.label}</span>`
      ).join('')}</div>
    </div>
    <figure>
      <figcaption class="gen-caption">Development score (%)</figcaption>
      <div class="gen-plots"></div>
      <p class="gen-note">Generation 0 is the starting program. Each point averages the retained program’s score on the same two development seeds.</p>
    </figure>
    <details class="gen-values"><summary>View scores by generation</summary><div></div></details>`;

  const selector = chart.querySelector('select');
  selector.value = 'gallery';
  const plots = chart.querySelector('.gen-plots');
  const values = chart.querySelector('.gen-values div');
  const grid = [0, 50, 100].map(tick => `
    <line class="gen-grid" x1="32" y1="${y(tick)}" x2="307" y2="${y(tick)}"/>
    <text class="gen-tick" x="26" y="${y(tick) + 4}" text-anchor="end">${tick}</text>`
  ).join('');
  const ticks = [0, 1, 2, 3].map(gen =>
    `<text class="gen-tick" x="${x(gen)}" y="170" text-anchor="middle">G${gen}</text>`
  ).join('');

  function modelPlot(model, task) {
    const series = scores[model.key][task.key];
    let evoLabel = y(series.evo[3]);
    let autoLabel = y(series.auto[3]);
    if (Math.abs(evoLabel - autoLabel) < 16) {
      const middle = (evoLabel + autoLabel) / 2;
      const offset = evoLabel <= autoLabel ? -8 : 8;
      evoLabel = middle + offset;
      autoLabel = middle - offset;
    }

    const paths = methods.map(({ key }) => {
      const points = series[key].map((score, gen) => `${x(gen)},${y(score)}`).join(' ');
      return `<polyline points="${points}" class="gen-line gen-${key}"/>`;
    }).join('');
    const marks = methods.map(({ key, label }) => series[key].map((score, gen) => {
      const cx = x(gen), cy = y(score);
      const mark = key === 'evo' ? `<circle cx="${cx}" cy="${cy}" r="3.8"/>`
        : `<path d="M ${cx} ${cy - 5.7} l 5.7 5.7 -5.7 5.7 -5.7 -5.7 Z"/>`;
      return `<g class="gen-marks gen-${key}"><title>${label}, generation ${gen}, ${score}%</title>${mark}</g>`;
    }).join('')).join('');

    return `<div class="gen-model">
      <h4>${model.label}</h4>
      <svg role="img" aria-labelledby="gen-title-${model.key} gen-description-${model.key}" viewBox="0 0 354 181">
        <title id="gen-title-${model.key}">${task.label}, ${model.label}</title>
        <desc id="gen-description-${model.key}">Development scores in percent for generations 0 through 3.
          EvoViM: ${series.evo.join(', ')}. AutoMem: ${series.auto.join(', ')}.</desc>
        ${grid}${ticks}${paths}${marks}
        <text class="gen-end gen-evo" x="316" y="${evoLabel + 4}">${series.evo[3]}</text>
        <text class="gen-end gen-auto" x="316" y="${autoLabel + 4}">${series.auto[3]}</text>
      </svg>
    </div>`;
  }

  function render() {
    const task = catalog.tasks.find(item => item.key === selector.value);
    plots.innerHTML = catalog.models.map(model => modelPlot(model, task)).join('');
    const rows = catalog.models.map(model => methods.map((method, index) =>
      `<tr>${index === 0 ? `<th rowspan="2" scope="rowgroup">${model.label}</th>` : ''}
        <th scope="row">${method.label}</th>
        ${scores[model.key][task.key][method.key].map(score => `<td>${score}</td>`).join('')}</tr>`
    ).join('')).map(body => `<tbody>${body}</tbody>`).join('');
    values.innerHTML = `<table><caption>${task.label} development score (%)</caption>
      <thead><tr><th scope="col">Model</th><th scope="col">Method</th>
        ${[0, 1, 2, 3].map(gen => `<th scope="col">G${gen}</th>`).join('')}</tr></thead>${rows}</table>`;
  }

  selector.addEventListener('change', render);
  render();
})();
