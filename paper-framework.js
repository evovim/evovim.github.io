(() => {
  const figure = document.getElementById('framework-loops');
  if (!figure) return;
  const select = figure.querySelector('#framework-detail');
  const region = figure.querySelector('.paper-figure-region');
  const svg = region.querySelector('svg');
  const marker = figure.querySelector('.paper-figure-marker');
  const title = svg.querySelector('title');

  // Coordinates in the original publication's 495 × 259 artboard.
  const crops = new Map([
    ['execution', ['Task execution', 120, 16, 76, 209]],
    ['memory', ['Memory program', 196, 36, 163, 176]],
    ['revision', ['Memory evolution', 2, 9, 119, 211]],
    ['experience', ['Revision experience', 39, 39, 83, 36]],
    ['feedback', ['Enhanced feedback', 39, 82, 83, 51]],
    ['candidate', ['Candidate program', 376, 86, 117, 100]],
    ['gate', ['Gate and program lineage', 271, 201, 188, 56]]
  ]);

  for (const [id, [name]] of crops) select.add(new Option(name, id));
  function show(id) {
    const crop = crops.get(id);
    figure.dataset.detail = String(Boolean(crop));
    region.hidden = marker.hidden = !crop;
    if (!crop) return;
    const [name, x, y, width, height] = crop;
    title.textContent = name;
    svg.setAttribute('viewBox', [x, y, width, height].join(' '));
    // Match the native artwork's aspect ratio and cap the reading size.
    svg.style.aspectRatio = width + '/' + height;
    svg.style.width = Math.min(width * 3.6, 630) + 'px';
    Object.assign(marker.style, {
      left: x / 495 * 100 + '%', top: y / 259 * 100 + '%',
      width: width / 495 * 100 + '%', height: height / 259 * 100 + '%'
    });
  }
  select.addEventListener('change', () => show(select.value));
  select.closest('label').hidden = false;
  show(select.value);

  // Bookmarks from the earlier walkthrough land on the same part of the paper figure.
  const bookmarkedViews = {
    'task-execution': 'execution', environment: 'execution', record: 'execution', act: 'execution',
    'memory-program': 'memory', 'frame-memory': 'memory', 'pixel-computation': 'memory',
    'visual-recall': 'memory', 'prompt-at-question-steps': 'memory',
    'memory-evolution': 'revision', revision: 'revision', 'development-episodes': 'revision',
    'enhanced-feedback': 'feedback', 'revision-experience': 'experience',
    'candidate-program': 'candidate', 'code-checks': 'overview', gate: 'gate', 'program-lineage': 'gate'
  };
  function followBookmark() {
    if (!location.hash.startsWith('#method-')) return;
    select.value = bookmarkedViews[location.hash.slice(8)] || 'overview';
    show(select.value);
    figure.scrollIntoView({block: 'start'});
  }
  window.addEventListener('hashchange', followBookmark);
  followBookmark();
})();
