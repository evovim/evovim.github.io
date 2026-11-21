(() => {
  'use strict';

  const section = document.getElementById('score-explorer');
  const data = window.EVOVIM_RESULTS;
  if (!section || !data) return;

  const format = number => number.toFixed(1);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const replay = document.querySelector('.fd-revision-replay');
  if (replay) {
    const panels = [...replay.closest('.fd-revision').querySelectorAll('.fd-ablation-panel')];
    const observer = 'IntersectionObserver' in window && new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.replace('fd-ablation-ready', 'fd-ablation-drawing');
        observer.unobserve(entry.target);
      }
    }, { threshold: .45 });

    function replayComparison() {
      if (observer) observer.disconnect();
      replay.hidden = reduced.matches || !observer;
      for (const panel of panels) {
        panel.classList.remove('fd-ablation-ready', 'fd-ablation-drawing');
        if (replay.hidden) continue;
        panel.classList.add('fd-ablation-ready');
        observer.observe(panel);
      }
    }
    replay.addEventListener('click', replayComparison);
    reduced.addEventListener('change', replayComparison);
    replayComparison();
  }
  const scoreUnits = {
    average: 'Mean score across six tasks (%)',
    cards: 'Pairs cleared (%)',
    dmv: 'Answer accuracy (%)',
    gallery: 'Correct answers out of eight (%)',
    maze: 'Correct answers out of eight (%)',
    tetris: 'Task progress toward 600 points (%)',
    pacman: 'Task progress toward 2,500 points (%)'
  };
  const methods = data.models[0].rows.map(row => row.method).reverse();
  const metrics = [{key: 'average', label: 'Six-task average'}, ...data.tasks];

  function modelPlot(model) {
    const tracks = methods.map((method, index) =>
      `<div class="fd-track fd-series-${index}" data-method="${method}"><div class="fd-bar"><strong></strong></div></div>`
    ).join('');
    const grid = [100, 75, 50, 25, 0].map(tick => `<div><span>${tick}</span></div>`).join('');
    return `<div class="fd-model" role="img">
      <div class="fd-plot"><div class="fd-grid" aria-hidden="true">${grid}</div><div class="fd-bars">${tracks}</div></div>
      <div class="fd-model-label">${model.label}</div>
    </div>`;
  }

  section.innerHTML = `
    <div class="fd-controls">
      <label>Task <select id="findings-task"></select></label>
      <label>Compare EvoViM with <select id="findings-baseline"></select></label>
    </div>
    <figure class="fd-main-chart" aria-labelledby="fd-chart-title">
      <figcaption id="fd-chart-title">
        <span data-score-unit></span>
        <span class="fd-legend">${methods.map((method, index) => `<span class="fd-series-${index}" data-method="${method}"><i aria-hidden="true"></i>${method}</span>`).join('')}</span>
      </figcaption>
      <div class="fd-groups">${data.models.map(modelPlot).join('')}</div>
      <span class="fd-sr" aria-live="polite" data-score-reader></span>
    </figure>
    <div class="fd-score-data">
      <details class="fd-table"><summary>All methods and scores</summary><div class="fd-tables"></div></details>
      <a href="downloads/main_results.csv" download>Download scores (CSV)</a>
    </div>`;

  const task = section.querySelector('#findings-task');
  const baseline = section.querySelector('#findings-baseline');
  metrics.forEach(metric => task.add(new Option(metric.label, metric.key)));
  baseline.add(new Option('All baselines', 'all'));
  methods.slice(1).forEach(method => baseline.add(new Option(method, method)));
  const requested = new URLSearchParams(location.search).get('example');
  if (metrics.some(metric => metric.key === requested)) task.value = requested;

  const chart = section.querySelector('.fd-main-chart');
  const groups = [...chart.querySelectorAll('.fd-model')];
  let hasEntered = false;
  let animationFrame;
  const plottedScores = new Map();

  function drawBar(track, label, score, light) {
    plottedScores.set(track, score);
    track.style.setProperty('--score', score + '%');
    track.style.setProperty('--fd-light', light);
    label.textContent = format(score);
  }

  function renderChart(entrance = false) {
    cancelAnimationFrame(animationFrame);
    const animate = hasEntered && !reduced.matches;
    const taskIndex = data.tasks.findIndex(item => item.key === task.value);
    const included = method => baseline.value === 'all' || method === 'EvoViM' || method === baseline.value;
    const paired = baseline.value !== 'all';
    chart.classList.toggle('fd-paired', paired);
    chart.querySelector('[data-score-unit]').textContent = scoreUnits[task.value];

    // Keep the legend in place while the bars move so a color keeps its reference point.
    for (const key of chart.querySelectorAll('.fd-legend [data-method]')) {
      key.classList.toggle('fd-muted', !included(key.dataset.method));
    }

    const changes = [];
    const descriptions = [];
    groups.forEach((node, modelIndex) => {
      const model = data.models[modelIndex];
      const readings = [];
      node.querySelectorAll('.fd-track').forEach((track, methodIndex) => {
        const method = track.dataset.method;
        const show = included(method);
        const row = model.rows.find(item => item.method === method);
        const value = taskIndex === -1 ? row.average : row.scores[taskIndex];
        const reading = method + ' ' + format(value) + '%';
        if (show) readings.push(reading);
        track.title = show ? reading : '';
        track.classList.toggle('fd-excluded', !show);
        const label = track.querySelector('strong');
        const from = entrance ? 0 : plottedScores.get(track) ?? 0;
        const to = show ? value : 0;
        if (animate && from !== to) {
          const delay = show ? modelIndex * 42 + methodIndex * 16 : 0;
          changes.push({track, label, from, to, delay, show});
          drawBar(track, label, from, 0);
        } else {
          drawBar(track, label, to, 0);
        }
      });
      const description = model.label + ', ' + readings.join(', ');
      node.setAttribute('aria-label', description);
      descriptions.push(description);
    });
    chart.querySelector('[data-score-reader]').textContent = task.selectedOptions[0].textContent + '. ' + descriptions.join('. ') + '.';
    if (!changes.length) return;

    const start = performance.now();
    function tick(now) {
      let unfinished = false;
      for (const {track, label, from, to, delay, show} of changes) {
        const duration = show ? 660 : 300;
        const t = Math.min(1, Math.max(0, (now - start - delay) / duration));
        const eased = t * t * (3 - 2 * t);
        drawBar(track, label, from + (to - from) * eased, show ? Math.sin(t * Math.PI) : 0);
        if (t < 1) unfinished = true;
      }
      if (unfinished) animationFrame = requestAnimationFrame(tick);
    }
    animationFrame = requestAnimationFrame(tick);
  }

  task.addEventListener('change', () => renderChart());
  baseline.addEventListener('change', () => renderChart());
  reduced.addEventListener('change', () => renderChart());
  document.querySelectorAll('[data-result-example]').forEach(button => button.addEventListener('click', () => {
    if (metrics.some(metric => metric.key === button.dataset.resultExample)) {
      task.value = button.dataset.resultExample;
      baseline.value = 'all';
      renderChart();
    }
  }));
  chart.classList.add('fd-awaiting');
  renderChart();
  const appear = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    hasEntered = true;
    renderChart(true);
    chart.classList.remove('fd-awaiting');
    appear.disconnect();
  }, {threshold: .1});
  appear.observe(chart);

  section.querySelector('.fd-tables').innerHTML = data.models.map(model =>
    '<div class="fd-table-scroll" role="region" tabindex="0" aria-label="'+model.label+' scores"><table><caption>'+model.label+'</caption><thead><tr>' +
    ['Method', ...data.tasks.map(item=>item.label), 'Average'].map(label => '<th scope="col">'+label+'</th>').join('') +
    '</tr></thead><tbody>' + [...model.rows].reverse().map(row => '<tr><th scope="row">'+row.method+'</th>'+
      [...row.scores,row.average].map(value=>'<td>'+format(value)+'</td>').join('')+'</tr>').join('') +
    '</tbody></table></div>').join('');
})();
