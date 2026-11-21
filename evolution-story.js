(() => {
  const root = document.getElementById('evolution-story');
  if (!root) return;

  const small = (name, alt) => '<img src="media/evolution/' + name + '.webp" alt="' + alt + '" decoding="async">';
  const query = () => small('question', 'The eighth question shows a rotated green painting against a grey background.');
  const fullView = () => small('door-four', 'The original view of door 4, with a green painting on either side.');
  const queryPrint = label => '<figure class="ev-print">' + query() + '<figcaption>' + label + '</figcaption></figure>';

  const practiceScore = correct => '<div class="ev-score"><b role="img" aria-label="' + correct + ' out of 16"><span data-correct="' + correct + '">' + correct + '</span> / 16</b> practice questions correct</div>';

  const steps = [
    {
      name: 'Practice', title: 'Where did this painting hang?',
      pose: 'photographer', line: 'I answered “not seen.” Let’s check what I wrote at door 4.',
      next: 'Inspect the mistake',
      picture: () => '<div class="ev-encounter"><figure class="ev-door"><img src="media/framework/practice-door4.webp" alt="Door 4 in the starting program’s development episode" decoding="async">'
        + '<figcaption>On the walk <b>Door 4</b></figcaption></figure>'
        + queryPrint('At the exit') + '</div>'
    },
    {
      name: 'Diagnose', title: 'The note described the wall.',
      pose: 'detective', line: 'I never wrote down which painting hung on each side. I marked all eight queries “not seen,” even the six I’d passed.',
      next: 'Rewrite what gets saved',
      picture: () => '<div class="ev-notes">' + queryPrint('Question 8') + '<div class="ev-paper"><span>Walk notebook</span>'
        + '<p>Door 4<br><mark>Green mottled tile wall</mark></p><small>Painting location</small>'
        + '<b class="ev-blank">No entry</b></div></div>' + practiceScore(4)
    },
    {
      name: 'Save crops', title: 'Save a crop with its door and side.',
      pose: 'archivist', line: 'I can compare the query to my crops now. But I didn’t save a crop at door 4, so its painting never comes up.',
      next: 'Widen the saved view',
      picture: () => {
        const crops = [['1R', '1 · right'], ['3R', '3 · right'], [null, '4 · missing'], ['6L', '6 · left'], ['7L', '7 · left']];
        return '<div class="ev-cabinet"><span class="ev-plate-label">Filed by door and side</span><div class="ev-sheet">'
          + crops.map(([id, label], index) => '<figure style="--order:' + index + '">' + (id ? small('crop-' + id, 'Saved crop from door ' + label)
            : '<span class="ev-absent" aria-label="No painting filed for door four">×</span>') + '<figcaption>' + label + '</figcaption></figure>').join('')
          + '</div><div class="ev-hit"><span>Closest crop for this query</span><b>0.242</b><span>Below the 0.45 cutoff</span></div></div>'
          + practiceScore(13);
      }
    },
    {
      name: 'Search views', title: 'Search the full doorway view.',
      pose: 'mechanic', line: 'Now I can look for the patch after I see the question. There it is, to the right of door 4.',
      next: 'Test the next two edits',
      picture: () => '<div class="ev-search"><figure class="ev-located"><div class="ev-original">' + fullView() + '<i class="ev-box" aria-hidden="true"></i></div>'
        + '<figcaption>Stored view <b>Door 4</b></figcaption></figure><div class="ev-rank">' + small('match', 'The matched patch on the right side of the doorway.')
        + '<b>0.834</b><span>Match score</span></div></div>' + practiceScore(16)
    },
    {
      name: 'Select', title: 'Would either edit improve the search?',
      pose: 'puzzle', line: 'The rotation edit tied the score but used more steps and tokens. I kept the whole-view search.',
      next: 'Try the frozen program',
      picture: () => '<div class="ev-verdict"><span class="ev-plate-label">Candidate program</span>'
        + [['Whole-view search', '16 / 16', 'Kept', 'kept'], ['Rework rotated queries', '16 / 16', 'More steps and tokens', ''], ['Shorten the log', '13 / 16', 'Lower score', '']]
          .map(([name, score, reason, cls], index) => '<div class="ev-verdict-line ' + cls + '" style="--order:' + index + '"><span>' + name + '</span><b>'
            + score + '</b><small>' + reason + '</small></div>').join('') + '</div>'
    },
    {
      name: 'Test', title: 'Does the program work on ten new walks?',
      pose: 'presenter', line: 'I missed one question on the last walk.',
      next: 'Replay the evolution',
      picture: () => {
        const walkCount = 10;
        return '<div class="ev-test"><div class="ev-outcome"><strong role="img" aria-label="79 out of 80"><span class="ev-numerator" data-correct="79">79</span><span> / 80</span></strong><span>questions correct</span></div>'
          + '<div class="ev-walks" role="img" aria-label="Eight correct on each of the first nine walks. Seven correct on the final walk.">'
          + Array.from({length: walkCount}, (_, i) => '<div style="--order:' + i + '"><b>' + (i + 1) + '</b><span>' + Array.from({length: 8}, (_, q) => i === 9 && q === 0
            ? '<i class="miss">×</i>' : '<i></i>').join('') + '</span></div>').join('')
          + '</div><span class="ev-legend">Walk <i></i> Correct <b>×</b> Missed</span></div>';
      }
    }
  ];

  root.innerHTML = '<div class="ev-rail" role="group" aria-label="Stages in one gallery program’s evolution">'
    + steps.map(({name}, i) => '<button type="button" data-step="' + i + '" aria-controls="ev-panel"><span>' + (i + 1) + '</span>' + name + '</button>').join('')
    + '</div><article id="ev-panel"><div class="ev-figure"></div><div class="ev-caption" aria-live="polite" aria-atomic="true">'
    + '<h3></h3></div><div class="ev-guide"><picture><source><img alt="" width="124" height="120" decoding="async"></picture>'
    + '<p class="ev-quote"></p></div></article><div class="ev-controls"><button class="ev-back" type="button">Back</button>'
    + '<a href="#results" class="ev-results-link" hidden>See results across all six tasks</a><button class="ev-next" type="button"></button></div>';

  const rail = root.querySelector('.ev-rail');
  const stageButtons = [...rail.querySelectorAll('button')];
  const panel = root.querySelector('#ev-panel');
  const figure = root.querySelector('.ev-figure');
  const title = root.querySelector('.ev-caption h3');
  const guideImage = root.querySelector('.ev-guide img');
  const motionSource = root.querySelector('.ev-guide source');
  const quote = root.querySelector('.ev-quote');
  const previous = root.querySelector('.ev-back');
  const next = root.querySelector('.ev-next');
  const resultsLink = root.querySelector('.ev-results-link');
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  let current = 0;
  let inView = false;

  function updatePose() {
    const path = 'media/mascot-scenes/' + steps[current].pose;
    guideImage.src = path + '.webp';
    motionSource.srcset = path + (inView && motion.matches ? '-motion.webp' : '.webp');
  }

  function show(index) {
    current = index;
    const step = steps[index];
    panel.dataset.stage = String(index);
    root.classList.toggle('ev-in-view', inView);
    figure.innerHTML = step.picture();
    const numerator = figure.querySelector('[data-correct]');
    if (numerator) window.EvoViMNumbers.to(numerator, Number(numerator.dataset.correct), {from:0, duration:750, delay:120});
    title.textContent = step.title;
    quote.textContent = step.line;
    updatePose();
    previous.disabled = index === 0;
    next.textContent = step.next;
    resultsLink.hidden = index !== steps.length - 1;
    stageButtons.forEach((button, i) => {
      button.setAttribute('aria-pressed', String(index === i));
      button.classList.toggle('ev-past', i < index);
    });
    if (inView && motion.matches && typeof quote.animate === 'function') {
      quote.animate([{opacity: .2, transform: 'translateY(6px)'}, {opacity: 1, transform: 'none'}], {duration: 340, easing: 'ease-out'});
    }
  }

  stageButtons.forEach((button, index) => button.addEventListener('click', () => show(index)));
  document.getElementById('framework-loops').addEventListener('click', event => {
    const link = event.target.closest('a[data-gallery-step]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const step = Number(link.dataset.galleryStep);
    if (Number.isInteger(step) && step >= 0 && step < steps.length) show(step);
  });
  rail.addEventListener('keydown', event => {
    const directions = {ArrowLeft: Math.max(0, current - 1), ArrowRight: Math.min(steps.length - 1, current + 1), Home: 0, End: steps.length - 1};
    const index = directions[event.key];
    if (index === undefined) return;
    event.preventDefault();
    show(index);
    stageButtons[index].focus();
  });
  function turnPage(index) {
    show(index);
    const header = document.querySelector('.top');
    if (matchMedia('(max-width: 660px)').matches && title.getBoundingClientRect().top < (header?.offsetHeight || 0)) {
      panel.scrollIntoView({block: 'start', behavior: motion.matches ? 'smooth' : 'instant'});
    }
  }
  previous.addEventListener('click', () => turnPage(Math.max(0, current - 1)));
  next.addEventListener('click', () => turnPage((current + 1) % steps.length));
  show(0);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    root.classList.toggle('ev-in-view', inView);
    updatePose();
  }, {threshold: 0}).observe(panel);
  motion.addEventListener('change', updatePose);
})();
