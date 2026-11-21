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
      <p class="gen-note">G0 is the starting program. Scores average two development seeds.</p>
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
      return `<g class="gen-marks gen-${key}" style="--gen-index:${gen}">${shape}</g>`;
    }).join('')).join('');
    return `<div class="gen-model">
      <h4>${model.label}</h4>
      <div class="gen-canvas">
      <svg role="img" aria-labelledby="gen-title-${model.key} gen-description-${model.key}" viewBox="0 0 354 181">
        <title id="gen-title-${model.key}"></title><desc id="gen-description-${model.key}"></desc>
        <defs><clipPath id="gen-clip-${model.key}"><rect class="gen-reveal" x="36" y="6" width="267" height="150"/></clipPath></defs>
        ${grid}${ticks}
        <line class="gen-guide" y1="12" y2="149" visibility="hidden"/>
        <g clip-path="url(#gen-clip-${model.key})">${paths}</g>
        ${marks}
        <g class="gen-end-labels">
          <text class="gen-end gen-evo" x="316"></text>
          <text class="gen-end gen-auto" x="316"></text>
        </g>
      </svg>
      <div class="gen-targets" role="group" aria-label="${model.label} generation scores">
        ${[0, 1, 2, 3].map(gen => `<button type="button" tabindex="${gen ? -1 : 0}" aria-label="Generation ${gen}"></button>`).join('')}
      </div>
      <div class="gen-tip" hidden aria-hidden="true">
        <strong></strong>
        ${methods.map(({key,label}) => `<div class="gen-${key}"><span><i></i>${label}</span><b></b></div>`).join('')}
      </div>
      </div>
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
    return {element, model, tracks, frame: 0, generation: null,
      canvas: element.querySelector('.gen-canvas'), guide: element.querySelector('.gen-guide'),
      hits: [...element.querySelectorAll('.gen-targets button')], tip: element.querySelector('.gen-tip')};
  });

  let inspected = null;
  function dismiss(panel) {
    if (inspected !== panel) return;
    panel.guide.setAttribute('visibility', 'hidden');
    panel.tip.hidden = true;
    panel.tracks.forEach(track => track.marks[panel.generation].classList.remove('gen-selected'));
    panel.generation = null;
    inspected = null;
  }
  function positionTip(panel) {
    if (panel.tip.hidden) return;
    const {canvas, tip, generation, series} = panel;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const anchorX = x(generation) * width / 354;
    const anchorY = y(Math.max(series.evo[generation], series.auto[generation])) * height / 181;
    const tipW = tip.offsetWidth, tipH = tip.offsetHeight;
    const left = Math.max(2, Math.min(anchorX < width / 2 ? anchorX + 12 : anchorX - tipW - 12, width - tipW - 2));
    // Find the piece of each curve beside the selected point. Prefer the nearest
    // empty space above, between or below those two curves for the readout.
    const generationAt = px => Math.max(0, Math.min(3, (px * 354 / width - x(0)) / 88));
    const first = generationAt(left), last = generationAt(left + tipW);
    const samples = [first, last, ...[1, 2].filter(g => first < g && g < last)];
    const bands = methods.map(({key}) => {
      const heights = samples.map(g => {
        const lo = Math.floor(g), hi = Math.ceil(g);
        return y(series[key][lo] + (series[key][hi] - series[key][lo]) * (g - lo)) * height / 181;
      });
      return [Math.min(...heights) - 6, Math.max(...heights) + 6];
    });
    const ideal = anchorY - tipH / 2;
    const fits = top => bands.every(([low, high]) => top + tipH <= low || top >= high);
    const tops = [ideal, ...bands.flatMap(([low, high]) => [low - tipH, high])]
      .map(top => Math.max(2, Math.min(top, height - tipH - 2)))
      .sort((a, b) => Math.abs(a - ideal) - Math.abs(b - ideal));
    tip.style.left = left + 'px';
    tip.style.top = (tops.find(fits) ?? tops[0]) + 'px';
  }
  function inspect(panel, gen) {
    if (inspected) dismiss(inspected);
    inspected = panel;
    panel.generation = gen;
    panel.guide.setAttribute('x1', x(gen));
    panel.guide.setAttribute('x2', x(gen));
    panel.guide.setAttribute('visibility', 'visible');
    panel.tip.querySelector('strong').textContent = 'Generation ' + gen;
    for (const track of panel.tracks) {
      track.marks[gen].classList.add('gen-selected');
      panel.tip.querySelector('.gen-' + track.key + ' b').textContent = panel.series[track.key][gen].toFixed(1) + '%';
    }
    panel.tip.hidden = false;
    positionTip(panel);
  }
  for (const panel of panels) {
    panel.hits.forEach((button, gen) => {
      button.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'touch') inspect(panel, gen);
      });
      button.addEventListener('focus', () => {
        panel.hits.forEach((hit, index) => { hit.tabIndex = index === gen ? 0 : -1; });
        inspect(panel, gen);
      });
      button.addEventListener('click', () => inspect(panel, gen));
      button.addEventListener('keydown', event => {
        if (event.key === 'Escape') { dismiss(panel); return; }
        const next = {ArrowLeft: Math.max(0, gen - 1), ArrowRight: Math.min(3, gen + 1), Home: 0, End: 3}[event.key];
        if (next === undefined) return;
        event.preventDefault();
        panel.hits[next].focus();
        if (next === gen) inspect(panel, gen);
      });
    });
    panel.canvas.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'touch' && !panel.canvas.matches(':focus-within')) dismiss(panel);
    });
    panel.canvas.addEventListener('focusout', event => {
      if (!panel.canvas.contains(event.relatedTarget)) dismiss(panel);
    });
  }
  document.addEventListener('pointerdown', event => {
    if (inspected && !inspected.canvas.contains(event.target)) dismiss(inspected);
  });
  window.addEventListener('resize', () => { if (inspected) positionTip(inspected); });

  function endNumber(track, value, options) {
    if (window.EvoViMNumbers) window.EvoViMNumbers.to(track.end, value, {digits: 1, ...options});
    else track.end.textContent = value.toFixed(1);
  }
  function tracePanel(panel) {
    if (!panel.element.classList.replace('gen-pending', 'gen-tracing')) return;
    for (const track of panel.tracks) endNumber(track, panel.series[track.key][3], {from: 0, duration: 700, delay: 340});
  }

  // On phones the panels stack. Each panel starts its own trace as it comes into view.
  const visible = new Set();
  const canObserve = 'IntersectionObserver' in window;
  if (canObserve) {
    const observer = new IntersectionObserver(entries => {
      for (const {target, intersectionRatio} of entries) {
        if (intersectionRatio >= .2) {
          visible.add(target);
          tracePanel(panels.find(panel => panel.element === target));
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

  function placeEnds(tracks, labelY) {
    // Keep tied or nearly tied scores legible while both trajectories move.
    if (Math.abs(labelY[0] - labelY[1]) < 16) {
      const middle = (labelY[0] + labelY[1]) / 2;
      const offset = labelY[0] <= labelY[1] ? -8 : 8;
      labelY = [middle + offset, middle - offset];
    }
    tracks.forEach((track, index) => track.end.setAttribute('y', labelY[index] + 4));
  }

  function updatePanel(panel, task, animate) {
    const {element, model, tracks} = panel;
    const series = scores[model.key][task.key];
    panel.series = series;
    cancelAnimationFrame(panel.frame);
    element.querySelector('svg > title').textContent = `${task.label}, ${model.label}`;
    element.querySelector('svg > desc').textContent = `Development scores in percent for generations 0 through 3.
      EvoViM: ${series.evo.join(', ')}. AutoMem: ${series.auto.join(', ')}.`;

    const target = tracks.map(track => series[track.key].map(y));
    panel.hits.forEach((hit, gen) => {
      hit.setAttribute('aria-label', `Generation ${gen}. EvoViM ${series.evo[gen].toFixed(1)}%. AutoMem ${series.auto[gen].toFixed(1)}%.`);
    });
    if (inspected === panel) inspect(panel, panel.generation);

    if (animate && !reducedMotion.matches && canObserve && !visible.has(element)) {
      element.classList.remove('gen-tracing');
      element.classList.add('gen-pending');
    }
    if (!animate || reducedMotion.matches || element.classList.contains('gen-pending')) {
      tracks.forEach((track, index) => {
        paintTrack(track, target[index]);
        endNumber(track, series[track.key][3], {instant: true});
      });
      placeEnds(tracks, target.map(heights => heights[3]));
      return;
    }
    // A second selection can arrive mid-transition. Continue from the coordinates on screen.
    const from = tracks.map(track => Array.from(track.line.points, point => point.y));
    const start = performance.now();
    element.classList.remove('gen-tracing');
    tracks.forEach(track => endNumber(track, series[track.key][3], {duration: 530}));
    function morph(now) {
      const elapsed = Math.min(1, Math.max(0, (now - start) / 530));
      const progress = elapsed * elapsed * (3 - 2 * elapsed);
      tracks.forEach((track, index) => {
        const heights = target[index].map((goal, gen) => from[index][gen] + (goal - from[index][gen]) * progress);
        paintTrack(track, heights);
      });
      placeEnds(tracks, tracks.map(track => track.line.points.getItem(3).y));
      if (elapsed < 1) panel.frame = requestAnimationFrame(morph);
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
    for (const panel of panels) {
      if (!canObserve || visible.has(panel.element)) tracePanel(panel);
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
