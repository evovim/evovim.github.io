(() => {
  const mount = document.getElementById('evolved-tools');
  if (!mount) return;

  const media = 'media/evolved-tools/';
  const img = (name, alt) => '<img src="' + media + name + '.webp" alt="' + alt + '" decoding="async">';
  const card = (name) => img('card-' + name, 'Pixel pattern on card ' + name);
  const tile = (picture, label, winning = false) => '<figure class="et-tile' + (winning ? ' et-hit' : '') + '">' + picture + '<figcaption>' + label + '</figcaption></figure>';
  const plate = (art, style = '') => '<div class="et-plate ' + style + '">' + art + '</div>';
  const score = (value, label) => '<div class="et-score"><b>' + value + '</b><small>' + label + '</small></div>';
  const withScore = (art, value, label) => plate(art + score(value, label), 'et-with-score');
  const step = (label, picture, caption) => ({label, picture, caption});
  const families = ['Visual matching', 'Spatial recall', 'Sequential decision-making'];

  // The paper's mechanisms figure counts additions relative to the starting
  // programs. Its supplementary functions table counts programs, out of 18.
  const mechanismGroups = [
    { name: 'Image memory', count: 39, functions: [
      ['Pixel matching', 14, 'Compare a query with stored pixels or features.'],
      ['Visual store', 12, 'Save frames, crops or features under an ID or location.'],
      ['Visual recall', 11, 'Show a saved frame or crop to the model.']
    ] },
    { name: 'Frame parsing', count: 42, functions: [
      ['Frame parsing', 13, 'Read an observation into card cells, posters or board state.'],
      ['Spatial index', 8, 'Track locations and how they connect.'],
      ['Decision support', 12, 'Use the evidence to rank a move or propose an answer.']
    ] },
    { name: 'Text notes', count: 6, functions: [
      ['Text ledger', 6, 'Keep, revise or pin records written by the model.']
    ] },
    { name: 'Workflow', count: 19, functions: [
      ['Workflow control', 16, 'Manage request budgets, add reminders or change when the model is called.']
    ] }
  ];

  const tools = [
    {
      id: 'card', name: 'Card memory + pixel matcher', task: 'Card Matching', family: 0,
      title: 'Which card completes the pair?', action: 'Compare card faces', finish: 'Reveal the next flip',
      stages: [
        step('A card turns up', plate(tile(card('hE'), 'hE'), 'et-single et-card'), 'The matching card appeared 86 steps earlier.'),
        step('Align and compare', plate([['aC','79.9'],['aE','54.4'],['bB','37.5'],['cG','0.0']].map(([cell,n]) => tile(card(cell), cell + ' · ' + n, cell === 'cG')).join(''), 'et-four et-card'),
          'Recomputing the pixel differences gives zero for the matching pair.'),
        step('Flip cG', plate(tile(card('hE'), 'hE') + '<b class="et-pair-sign" aria-hidden="true">=</b>' + tile(card('cG'), 'cG · 86 steps earlier', true), 'et-pair et-card'),
          '')
      ]
    },
    {
      id: 'page', name: 'Page catalog + corner matcher', task: 'DMV-Hard', family: 0,
      title: 'Which product carried this pattern?', action: 'Search saved pages', finish: 'Identify the product',
      stages: [
        step('A corner patch', plate(tile(img('dmv-query', 'Queried teal product swatch with colored dots'), 'Question image') + tile(img('dmv-catalog', 'Twenty saved grayscale product thumbnails'), '20 saved pages'), 'et-query-catalog'),
          'The catalog keeps a grayscale thumbnail and product ID for every page.'),
        step('Match the patch', plate(tile(img('dmv-win18', 'Runner-up patch on page 18'), 'Page 18 · 0.402') + tile(img('dmv-win1', 'Best matching patch on page 1'), 'Page 1 · 0.955', true), 'et-pair'),
          'The matcher slides the query across each thumbnail. A higher correlation means a closer match.'),
        step('Return the product ID', withScore(img('dmv-p1', 'Original page for the winning product'), '9cbae018', 'Page 1 · session 1'),
          '')
      ]
    },
    {
      id: 'gallery', name: 'Door views + painting search', task: 'MC Gallery', family: 1,
      title: 'Which side of which door?', action: 'Search doorway views', finish: 'Read the door and side',
      stages: [
        step('A painting returns', plate(tile(img('gallery-question', 'The transformed painting in the held-out gallery question'), 'Question image'), 'et-single'),
          'The query shows the painting from a different angle.'),
        step('Search 14 saved views', plate(img('gallery-peak', 'Recomputed similarity across view 0011 with a red peak left of the doorway') + '<span class="et-image-note">Peak similarity 0.791</span>', 'et-landscape'),
          'The heatmap was recomputed with the evolved matcher across rotations and scales.'),
        step('Door 7, left', plate('<div class="et-shot"><img src="media/gallery-memory/view_0011.webp" alt="Saved view of doorway 7, with the matching painting marked on its left"><i class="et-box et-door-box" aria-hidden="true"></i></div>', 'et-landscape'),
          'The saved doorway shows both number and side.')
      ]
    },
    {
      id: 'poster', name: 'Frames on a map + wall finder', task: 'Poster Maze', family: 1,
      title: 'On which wall did the poster hang?', action: 'Find the saved view', finish: 'Trace the wall',
      stages: [
        step('A poster to locate', plate(tile(img('maze-query', 'Poster image from question six in the maze episode'), 'Question image'), 'et-single'),
          'Answer with a cell and wall direction.'),
        step('Retrieve its camera view', plate('<div class="et-shot">' + img('maze-view', 'First-person view from cell 0,6 looking south, with the matched poster region outlined') + '<i class="et-box et-maze-box" aria-hidden="true"></i></div><span class="et-image-note">Similarity 0.908</span>', 'et-landscape'),
          'The matched frame places the camera at (0, 6), facing south.'),
        step('Follow the sightline', plate('<div class="et-maze-map"><div><span>Camera</span><b>(0, 6)</b></div><div><span>Open edge ↓</span><b>(1, 6)</b></div><strong>South wall</strong></div>', 'et-map'),
          'An open edge reveals the wall one cell beyond the camera.')
      ]
    },
    {
      id: 'tetris', name: 'Board reader + drop planner', task: 'Tetris', family: 2,
      title: 'Where should the T land?', action: 'Project the landings', finish: 'Play the drop',
      stages: [
        step('Read the live well', withScore(img('tetris-well', 'Actual Tetris well with the T piece at step 30'), '298', 'Score before the move'),
          'The program reads the occupied cells and the falling piece from the screenshot.'),
        step('Simulate each slide', withScore('<div class="et-drop-simulation">' + img('tetris-plan', 'Board reconstructed by the parser with the planned T landing outlined') + '<i class="et-tetromino" aria-hidden="true"></i></div>', '13 rows', 'Projected drop'),
          'Two cells left or four right give the same drop.'),
        step('Left, left, hard drop', withScore(img('tetris-drop', 'Actual board after the two left moves and the hard drop'), '320', 'Score after the drop'),
          'After the shorter slide, the hard drop covers 11 rows.')
      ]
    },
    {
      id: 'pacman', name: 'Pellet memory + route finder', task: 'Pac-Man', family: 2,
      title: 'Which way to the next pellet?', action: 'Trace a shortest path', finish: 'Read the first move',
      stages: [
        step('Update the pellet map', withScore(img('pacman-maze', 'Pac-Man maze at step 30'), '157', 'Regular pellets remaining'),
          'The map tracks walls and eaten pellets across frames.'),
        step('Trace four moves', plate('<div class="et-route-detail">' + img('pacman-route', 'Map detail of three moves right followed by one move up to the pellet') + '<i class="et-route-dot" aria-hidden="true"></i></div>', 'et-route'),
          'Replaying the program recovers a four-move route to (9, 22) without reversing.'),
        step('Recommend right', plate('<div class="et-route-keys" aria-label="The suggested path is right, right, right, then up"><b>→</b><i>→</i><i>→</i><i>↑</i></div><span class="et-route-target">First move <strong>right</strong></span>', 'et-keys'),
          '')
      ]
    }
  ];

  const familyNav = families.map((family, index) => '<div class="et-family"><p>' + family + '</p><div role="group" aria-label="' + family + '">' + tools.filter(t => t.family === index).map(t =>
    '<button type="button" class="et-picker" data-tool="' + t.id + '" aria-pressed="false"><span>' + t.task + '</span></button>'
  ).join('') + '</div></div>').join('');

  const mechanismBars = mechanismGroups.map((group, index) =>
    '<button type="button" class="et-mechanism" data-group="' + index + '" aria-controls="et-function-panel" aria-pressed="' + (index === 0) + '">' +
      '<span>' + group.name + '</span><i aria-hidden="true"><i style="width:' + (group.count / 50 * 100) + '%"></i></i>' +
      '<strong>' + group.count + '</strong></button>'
  ).join('');
  mount.innerHTML = '<figure class="et-taxonomy" aria-labelledby="et-taxonomy-title">' +
    '<figcaption><h3 id="et-taxonomy-title">Mechanisms added during evolution</h3>' +
    '<p>Across six tasks and three models, the 18 selected programs added 106 mechanisms. A program can add several mechanisms in the same group.</p></figcaption>' +
    '<div class="et-taxonomy-grid"><div class="et-group-picker" role="group" aria-labelledby="et-group-label"><h4 id="et-group-label">Choose a mechanism group</h4>' +
    mechanismBars + '</div><div class="et-function-panel" id="et-function-panel" aria-live="polite"></div></div></figure>' +
    '<h3 class="et-examples-title">A tool from each task</h3><div class="et-menu">' + familyNav + '</div><div class="et-trace"></div>';

  function selectGroup(index) {
    const group = mechanismGroups[index];
    mount.querySelectorAll('.et-mechanism').forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    const rows = group.functions.map(([name, count, description]) =>
      '<div><dt>' + name + '</dt><dd><span>' + description + '</span><strong>' + count + '<span> / 18</span></strong></dd></div>'
    ).join('');
    mount.querySelector('.et-function-panel').innerHTML = '<h4>' + group.name + '</h4><p>Selected programs with each function</p><dl>' + rows + '</dl>';
  }
  selectGroup(0);
  const trace = mount.querySelector('.et-trace');
  const buttons = [...mount.querySelectorAll('.et-picker')];
  let active;
  let stageIndex = 0;

  function showStep(index, restart = false) {
    stageIndex = index;
    const stages = trace.querySelectorAll('.et-stage');
    stages.forEach((el, i) => {
      el.classList.toggle('et-active', i === index);
      el.querySelector('.et-stage-button').setAttribute('aria-pressed', String(i === index));
    });
    const selected = stages[index];
    if (restart && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      selected.classList.remove('et-animate');
      void selected.offsetWidth;
      selected.classList.add('et-animate');
    }
    trace.querySelector('.et-next').innerHTML = (index === 0 ? active.action : index === 1 ? active.finish : 'Replay from the input') + '<span aria-hidden="true">' + (index === 2 ? '↺' : '→') + '</span>';
    trace.querySelector('.et-sr-update').textContent = active.stages[index].label + '. ' + active.stages[index].caption;
  }

  function selectTool(id) {
    active = tools.find(t => t.id === id);
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === id)));
    trace.dataset.tool = id;
    trace.innerHTML = '<div class="et-trace-heading"><h3>' + active.name + '</h3><p>' + active.title + '</p></div>' +
      '<div class="et-stages">' + active.stages.map((s, i) =>
        '<section class="et-stage"><button type="button" class="et-stage-button" data-step="' + i + '" aria-pressed="false"><i>' + ['Input','Computation','Outcome'][i] + '</i><b>' + s.label + '</b></button>' + 
        '<div class="et-stage-body"><h4>' + s.label + '</h4>' + s.picture + (s.caption ? '<p>' + s.caption + '</p>' : '') + '</div></section>'
      ).join('') + '</div><div class="et-controls"><a class="et-code-link" href="' + media + 'source/' + active.id + '.txt" target="_blank" rel="noopener">View tool code</a><button class="et-next" type="button"></button></div><span class="et-sr-update" aria-live="polite"></span>';
    showStep(0, true);
  }

  mount.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !mount.contains(button)) return;
    if (button.dataset.group !== undefined) selectGroup(Number(button.dataset.group));
    else if (button.dataset.tool) selectTool(button.dataset.tool);
    else if (button.dataset.step !== undefined) showStep(Number(button.dataset.step), true);
    else if (button.classList.contains('et-next')) showStep((stageIndex + 1) % 3, true);
  });

  selectTool('card');
})();
