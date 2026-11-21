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
      <div class="gen-actions"><div class="gen-key">${methods.map(method =>
        `<span class="gen-${method.key}"><i aria-hidden="true"></i>${method.label}</span>`
      ).join('')}</div>
      <button type="button" class="gen-replay" aria-label="Replay scores across generations"><span aria-hidden="true">↻</span> Replay</button></div>
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

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function modelPlot(model) {
    const paths = methods.map(({ key }) => `<polyline class="gen-line gen-${key}"/>`).join('');
    const marks = methods.map(({ key }) => [0, 1, 2, 3].map(gen => {
      const shape = key === 'evo' ? '<circle r="3.8"/>' : '<path d="M 0 -5.7 L 5.7 0 0 5.7 -5.7 0 Z"/>';
      return `<g class="gen-marks gen-${key}" style="--gen-index:${gen}"><title></title>${shape}</g>`;
    }).join('')).join('');
    return `<div class="gen-model">
      <h4>${model.label}</h4>
      <svg role="img" aria-labelledby="gen-title-${model.key} gen-description-${model.key}" viewBox="0 0 354 181">
        <title id="gen-title-${model.key}"></title><desc id="gen-description-${model.key}"></desc>
        <defs><clipPath id="gen-clip-${model.key}"><rect class="gen-reveal" x="36" y="6" width="267" height="150"/></clipPath></defs>
        ${grid}${ticks}
        <g clip-path="url(#gen-clip-${model.key})">${paths}</g>
        ${marks}
        <g class="gen-end-labels">
          <text class="gen-end gen-evo" x="316"></text>
          <text class="gen-end gen-auto" x="316"></text>
        </g>
      </svg>
    </div>`;
  }

  plots.innerHTML = catalog.models.map(modelPlot).join('');
  const panels = catalog.models.map((model, index) => {
    const element = plots.children[index];
    const tracks = methods.map(({key, label}) => ({
      key, label,
      line: element.querySelector(`.gen-line.gen-${key}`),
      marks: [...element.querySelectorAll(`.gen-marks.gen-${key}`)],
      end: element.querySelector(`.gen-end.gen-${key}`)
    }));
    return { element, model, tracks, frame: 0 };
  });

  // On phones the panels stack. Each panel starts its own trace as it comes into view.
  const visible = new Set();
  const canObserve = 'IntersectionObserver' in window;
  if (canObserve) {
    const observer = new IntersectionObserver(entries => {
      for (const {target, intersectionRatio} of entries) {
        if (intersectionRatio >= .2) {
          visible.add(target);
          target.classList.replace('gen-pending', 'gen-tracing');
        } else {
          visible.delete(target);
        }
      }
    }, { threshold: .2 });
    for (const {element} of panels) {
      if (!reducedMotion.matches) element.classList.add('gen-pending');
      observer.observe(element);
    }
  }

  function paintTrack(track, heights) {
    track.line.setAttribute('points', heights.map((height, gen) => `${x(gen)},${height}`).join(' '));
    track.marks.forEach((mark, gen) => mark.setAttribute('transform', `translate(${x(gen)} ${heights[gen]})`));
  }

  function updatePanel(panel, task, animate) {
    const {element, model, tracks} = panel;
    const series = scores[model.key][task.key];
    cancelAnimationFrame(panel.frame);
    element.querySelector('svg > title').textContent = `${task.label}, ${model.label}`;
    element.querySelector('svg > desc').textContent = `Development scores in percent for generations 0 through 3.
      EvoViM: ${series.evo.join(', ')}. AutoMem: ${series.auto.join(', ')}.`;

    const target = tracks.map(track => series[track.key].map(y));
    const labelY = target.map(heights => heights[3]);
    if (Math.abs(labelY[0] - labelY[1]) < 16) {
      const middle = (labelY[0] + labelY[1]) / 2;
      const offset = labelY[0] <= labelY[1] ? -8 : 8;
      labelY[0] = middle + offset;
      labelY[1] = middle - offset;
    }
    tracks.forEach((track, index) => {
      const samples = series[track.key];
      track.marks.forEach((mark, gen) => {
        mark.firstElementChild.textContent = `${track.label}, generation ${gen}, ${samples[gen]}%`;
      });
      track.end.textContent = samples[3];
      track.end.setAttribute('y', labelY[index] + 4);
    });

    if (animate && !reducedMotion.matches && canObserve && !visible.has(element)) {
      element.classList.remove('gen-tracing');
      element.classList.add('gen-pending');
    }
    if (!animate || reducedMotion.matches || element.classList.contains('gen-pending')) {
      tracks.forEach((track, index) => paintTrack(track, target[index]));
      element.classList.remove('gen-morphing');
      return;
    }
    // A second selection can arrive mid-transition. Continue from the coordinates on screen.
    const from = tracks.map(track => Array.from(track.line.points, point => point.y));
    const start = performance.now();
    element.classList.add('gen-morphing');
    function morph(now) {
      const elapsed = Math.min(1, Math.max(0, (now - start) / 530));
      const progress = elapsed * elapsed * (3 - 2 * elapsed);
      tracks.forEach((track, index) => {
        const heights = target[index].map((goal, gen) => from[index][gen] + (goal - from[index][gen]) * progress);
        paintTrack(track, heights);
      });
      if (elapsed < 1) panel.frame = requestAnimationFrame(morph);
      else element.classList.remove('gen-morphing');
    }
    panel.frame = requestAnimationFrame(morph);
  }

  function render(animate = false) {
    const task = catalog.tasks.find(item => item.key === selector.value);
    panels.forEach(panel => updatePanel(panel, task, animate));
    const rows = catalog.models.map(model => methods.map((method, index) =>
      `<tr>${index === 0 ? `<th rowspan="2" scope="rowgroup">${model.label}</th>` : ''}
        <th scope="row">${method.label}</th>
        ${scores[model.key][task.key][method.key].map(score => `<td>${score}</td>`).join('')}</tr>`
    ).join('')).map(body => `<tbody>${body}</tbody>`).join('');
    values.innerHTML = `<table><caption>${task.label} development score (%)</caption>
      <thead><tr><th scope="col">Model</th><th scope="col">Method</th>
        ${[0, 1, 2, 3].map(gen => `<th scope="col">G${gen}</th>`).join('')}</tr></thead>${rows}</table>`;
  }

  chart.querySelector('.gen-replay').addEventListener('click', () => {
    if (reducedMotion.matches) return;
    for (const {element} of panels) {
      element.classList.remove('gen-tracing');
      element.classList.add('gen-pending');
    }
    render();
    // Latch the starting state before restarting the same CSS animation.
    void plots.offsetWidth;
    for (const {element} of panels) {
      if (!canObserve || visible.has(element)) element.classList.replace('gen-pending', 'gen-tracing');
    }
  });
  selector.addEventListener('change', () => render(true));
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    panels.forEach(({element}) => element.classList.remove('gen-pending', 'gen-tracing'));
    render();
  });
  render();
})();
