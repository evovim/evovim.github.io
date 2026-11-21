(() => {
  const root = document.getElementById('cases');
  if (!root) return;

  const cases = [
    {
      id: 'dmv-hard', environment: 'DMV-Hard',
      first: {caption: 'First shopping session', alt: 'A full gold vase with orange, fan-shaped panels on its body.'},
      later: {caption: 'A re-photographed detail from an earlier session', alt: 'A close-up showing the neck and fan-shaped panels of a gold vase.'},
      opening: 'Browse the first catalog.',
      introduction: 'One of these 20 vases will come up later. What would help you recognize this one?',
      forward: 'See the later question', question: 'Which of these three vases matches the detail?',
      options: ['Multicolored vase', 'Amber-and-gold vase', 'Gray-green vase'], answer: 1,
      optionPhotos: ['cases/dmv-multicolored.webp', 'observations/dmv-hard-a.webp', 'cases/dmv-gray.webp'],
      result: 'The detail belongs to the amber-and-gold vase.',
      evidence: 'The agent compared 20 catalog photos. This vase ranked first, and the agent returned its page.'
    },
    {
      id: 'poster-maze', environment: 'Poster Maze',
      first: {caption: 'Cell (4, 3) · facing east', alt: 'A green and teal patterned poster on the far wall of a maze corridor.'},
      later: {caption: 'A tilted poster image shown after the exit', alt: 'An enlarged, tilted green and teal poster pattern framed in gray.'},
      opening: 'Look down the corridor.',
      introduction: 'From (4, 3), look east into cell (4, 4). Remember where the poster hangs.',
      forward: 'See the later question', question: 'Where did this poster hang?',
      prompt: 'Which cell and wall held this pattern? Choose “Never seen” for a new poster.',
      options: ['East wall of (4, 3)', 'Never seen', 'East wall of (4, 4)'], answer: 2,
      result: 'The agent located the east wall of (4, 4).',
      evidence: 'The two closest views both placed the poster on the east wall of the same cell.'
    },
    {
      id: 'card-matching', environment: 'Card Matching',
      first: {caption: 'Row a · columns G through L', alt: 'Columns H and I in row a are face up. H has an orange-red checkered pattern and I has a wine-red and pink pattern.', crop: 'row'},
      later: {caption: 'First confirmed pair · row a', alt: 'The matching wine-red and pink cards are face up at I and K in row a.', crop: 'row'},
      decision: {caption: 'Card aK · detail from the confirmed pair', alt: 'The revealed card has a wine-red and pink checker pattern.', crop: 'tile'},
      opening: 'Remember two exposed cards.',
      introduction: 'Find pairs on a 12 × 12 board. These two cards are about to turn face down.',
      forward: 'See the next move', question: 'Which square should the agent flip?',
      prompt: 'Five moves later, aK is face up. Which square holds its twin?',
      options: ['aI', 'aH', 'aJ'], answer: 0,
      result: 'The agent found its first pair at aI and aK.',
      evidence: 'The pixels matched aI exactly. Flipping aI scored one point.'
    },
    {
      id: 'tetris', environment: 'Tetris',
      first: {caption: 'Before the move · game score 298', alt: 'A falling T-shaped piece above a stack of blocks with room on either side.'},
      later: {caption: 'After the drop · game score 320', alt: 'The T-shaped piece has settled against the left edge of the stack. A new piece has appeared at the top.'},
      opening: 'Read the board before the piece falls.',
      introduction: 'Reach 600 points before the stack tops out. A hard drop earns two points per row.',
      forward: 'Try three placements', question: 'Which placement did the program choose?',
      prompt: 'Preview the landings. If two drops are equally long, choose the one with fewer sideways moves.',
      options: ['Stay put', 'Two left', 'Four right'], answer: 1,
      result: 'Two left moves, then a hard drop.',
      evidence: 'Two left moves let the piece fall two rows before the hard drop. The remaining 11 rows earned 22 points.'
    }
  ];

  // Original board in the step-30 PLAN prompt, Qwen3.8-27B, held-out seed 47 (main paper, Fig. 1c).
  // The two active-piece rows are followed by the lower stack. The game's ghost is excluded.
  const occupied = [
    '...o......', '..ooo.....', ...Array(11).fill('..........'), '.....o....',
    '...ooo....', '.oo..ooooo', 'oooooooo..', '.ooooooooo', '.oo.oo..o.', '..ooooooo.'
  ];
  const columns = occupied[0].length;
  const squares = occupied.join('').split('');
  const fallingPiece = [];
  const settled = new Set();
  squares.forEach((value, index) => {
    if (value !== 'o') return;
    if (index < 2 * columns) fallingPiece.push(index);
    else settled.add(index);
  });
  // Compare the three displayed placements without rotation on the same step-30 board.
  function projectDrop(shift) {
    const position = fallingPiece.map(index => index + shift);
    function fits(rowsDown) {
      return position.every(index => {
        const next = index + rowsDown * columns;
        return next < squares.length && !settled.has(next);
      });
    }
    let rows = 0;
    while (fits(rows + 1)) rows++;
    return {rows, cells: position.map(index => index + rows * columns)};
  }
  const drops = [0, -2, 4].map(projectDrop);

  root.innerHTML = `
    <div class="cs-inner">
      <div class="cs-chooser" role="group" aria-label="Choose a case study">
        ${cases.map((item, i) => `<button type="button" data-case-id="${i}" data-case-key="${item.id}" aria-controls="case-episode" aria-pressed="${i === 0}"><span>${item.environment}</span></button>`).join('')}
      </div>
      <div class="cs-board" id="case-episode">
        <div class="cs-bar">
          <ol aria-label="Case progress"><li><i aria-hidden="true">1</i>Observe</li><li><i aria-hidden="true">2</i>Decide</li><li><i aria-hidden="true">3</i>Compare</li></ol>
        </div>
        <div class="cs-stage"></div>
      </div>
    </div>`;

  const chooser = root.querySelector('.cs-chooser');
  const caseButtons = [...chooser.querySelectorAll('button')];
  const stage = root.querySelector('.cs-stage');
  const progress = root.querySelectorAll('.cs-bar li');
  const requestedCase = new URLSearchParams(location.search).get('case');
  let current = Math.max(0, cases.findIndex(item => item.id === requestedCase));
  let page = 0;
  let choice = null;

  function picture(which, view, crop = view.crop) {
    const item = cases[current];
    const dir = item.id === 'tetris' ? 'cases' : 'observations';
    const media = `<img src="media/${dir}/${item.id}-${which}.webp" alt="${view.alt}" loading="lazy">`;
    return `<figure class="cs-figure">
      <div class="cs-photo"${crop ? ` data-crop="${crop}"` : ''}><div class="cs-image">${media}</div></div>
      <figcaption>${view.caption}</figcaption>
    </figure>`;
  }

  function drawLanding(index, animate = false) {
    const {rows, cells} = drops[index];
    const grid = squares.map((symbol, position) => {
      let kind = '';
      if (cells.includes(position)) kind = 'landing';
      else if (symbol === 'o') kind = position < 20 ? 'active' : 'stack';
      return `<i class="${kind}"></i>`;
    }).join('');
    const label = cases[current].options[index];
    return `<figure class="cs-projection">
      <div class="cs-diagram">
        <div class="cs-grid" data-preview="${animate}" style="--drop-start:calc(-${rows * 100}% - ${rows}px)" aria-hidden="true">${grid}</div>
        <div class="cs-grid-key" aria-hidden="true"><span class="active">Falling piece</span><span class="stack">Stack</span><span class="landing">Landing</span></div>
      </div>
      <figcaption aria-live="polite"><strong>${label} · ${rows}-row drop</strong></figcaption>
    </figure>`;
  }

  function action(name, label, secondary = false) {
    const arrow = secondary ? '' : '<span class="cs-arrow" aria-hidden="true">→</span>';
    return `<button type="button" class="${secondary ? 'cs-link' : 'cs-action'}" data-action="${name}">${label}${arrow}</button>`;
  }

  function render(focus = true) {
    const item = cases[current];
    const isTetris = item.id === 'tetris';
    const decisionView = item.decision ?? item.later;
    root.dataset.example = item.id;
    caseButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === current)));
    progress.forEach((step, i) => {
      if (i === page) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
      step.dataset.done = i < page;
      step.firstElementChild.textContent = i < page ? '✓' : String(i + 1);
    });

    let media, heading, explanation, controls;
    if (page === 0) {
      media = picture('a', item.first);
      heading = item.opening;
      explanation = `<p>${item.introduction}</p>`;
      controls = action('question', item.forward) + action('evidence', 'Skip to evidence', true);
    } else if (page === 1) {
      media = isTetris ? drawLanding(choice ?? 0) : picture('b', decisionView);
      heading = item.question;
      const options = item.options.map((option, i) => {
        const radio = `<input type="radio" name="case-answer" value="${i}"${i === choice ? ' checked' : ''}>`;
        const label = `${radio}<span>${option}</span>`;
        return item.optionPhotos
          ? `<label><img src="media/${item.optionPhotos[i]}" width="512" height="512" alt=""><span class="cs-photo-label">${label}</span></label>`
          : `<label>${label}</label>`;
      }).join('');
      explanation = `${item.prompt ? `<p>${item.prompt}</p>` : ''}
        <fieldset class="cs-options${item.optionPhotos ? ' cs-photo-options' : ''}"><legend>${isTetris ? 'Select a placement to preview the drop' : 'Select your answer'}</legend>${options}</fieldset>`;
      controls = `<button class="cs-action" type="button" data-action="check" ${choice === null ? 'disabled' : ''}>Check my answer<span class="cs-arrow" aria-hidden="true">→</span></button>` + action('evidence', 'Reveal the answer', true) + action('observe', 'Revisit first view', true);
    } else {
      media = `<div class="cs-pair">${picture('a', item.first)}${picture('b', item.later)}</div>`;
      heading = item.result;
      const feedback = choice === null ? '' : `<p class="cs-feedback">${choice === item.answer ? 'Correct.' : 'Your choice was different.'} You chose ${item.options[choice]}.</p>`;
      explanation = `${feedback}<p>${item.evidence}</p>`;
      controls = action('next', 'Next case · ' + cases[(current + 1) % cases.length].environment) + action('observe', 'Replay this case', true);
    }
    stage.innerHTML = `<div class="cs-visual">${media}</div><div class="cs-copy"><h3 tabindex="-1">${heading}</h3>${explanation}<div class="cs-actions">${controls}</div></div>`;
    if (focus) {
      const heading = stage.querySelector('h3');
      heading.focus({preventScroll: true});
      const boardTop = root.querySelector('.cs-board').getBoundingClientRect().top;
      if (boardTop < -32) root.querySelector('.cs-board').scrollIntoView({block: 'start', behavior: 'instant'});
    }
  }

  chooser.addEventListener('keydown', event => {
    const index = caseButtons.indexOf(event.target);
    if (index < 0) return;
    const last = caseButtons.length - 1;
    let next;
    switch (event.key) {
      case 'ArrowLeft': next = index > 0 ? index - 1 : last; break;
      case 'ArrowRight': next = index < last ? index + 1 : 0; break;
      case 'Home': next = 0; break;
      case 'End': next = last; break;
      default: return;
    }
    event.preventDefault();
    caseButtons[next].focus();
    caseButtons[next].click();
  });
  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-case-id')) {
      if (current === Number(button.dataset.caseId)) return;
      current = Number(button.dataset.caseId);
      choice = null;
      page = 0;
      render(false);
      return;
    }
    switch (button.dataset.action) {
      case 'question':
        window.EvoViMMetrics?.demo(cases[current].id, 'start');
        page = 1;
        break;
      case 'check':
        if (choice === null) return;
        window.EvoViMMetrics?.demo(cases[current].id, 'complete');
        page = 2;
        break;
      case 'evidence':
        window.EvoViMMetrics?.demo(cases[current].id, 'reveal');
        choice = null;
        page = 2;
        break;
      case 'observe': choice = null; page = 0; break;
      case 'next': current = (current + 1) % cases.length; choice = null; page = 0; break;
      default: return;
    }
    render();
  });
  stage.addEventListener('change', event => {
    if (event.target.name === 'case-answer') {
      choice = Number(event.target.value);
      stage.querySelector('[data-action="check"]').disabled = false;
      if (cases[current].id === 'tetris') stage.querySelector('.cs-visual').innerHTML = drawLanding(choice, true);
    }
  });
  render(false);
})();
