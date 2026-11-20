(() => {
  const root = document.getElementById('evolution-story');
  if (!root) return;

  const small = (name, alt) => '<img src="media/evolution/' + name + '.webp" alt="' + alt + '" decoding="async">';
  const query = () => small('question', 'The eighth question shows a rotated green painting against a grey background.');
  const fullView = () => small('door-four', 'The original view of door 4, with a green painting on either side.');
  const queryPrint = label => '<figure class="ev-print">' + query() + '<figcaption>' + label + '</figcaption></figure>';

  const steps = [
    {
      name: 'Practice', title: 'Walk first. Get the question later.',
      text: 'Claude Haiku 5.5 walked past eight doors. At the exit, question eight asked where it had seen this green pattern.',
      pose: 'photographer', line: 'I saw these walls on the way in. Which side was this one on?',
      next: 'Inspect the mistake',
      picture: () => '<div class="ev-encounter"><figure class="ev-door"><img src="media/framework/practice-door4.webp" alt="Door 4 in the starting program’s development episode" decoding="async">'
        + '<figcaption>On the walk <b>Door 4</b></figcaption></figure>'
        + queryPrint('At the exit') + '</div>'
    },
    {
      name: 'Diagnose', title: 'Read what survived the walk.',
      text: 'The same model inspected the frames, tool calls and notes. A note described a green wall. The program never linked a painting to a door and side.',
      pose: 'detective', line: 'My notes say “wall.” I called every painting unseen, including six I walked past.',
      next: 'Rewrite what gets saved',
      picture: () => '<div class="ev-notes">' + queryPrint('Question 8') + '<div class="ev-paper"><span>Walk notebook</span>'
        + '<p>Door 4<br><mark>Green mottled tile wall</mark></p><small>Painting location</small>'
        + '<b class="ev-blank">No entry</b></div></div><div class="ev-score"><b>4 / 16</b> correct across two development episodes</div>'
    },
    {
      name: 'Save crops', title: 'File a picture with its address.',
      text: 'The first accepted edit saved painting crops by door and side, and compared them to the query. It still missed this painting. Door 4 had no saved crop.',
      pose: 'archivist', line: 'Look between doors 3 and 6. The picture I need never made it into my file.',
      next: 'Widen the saved view',
      picture: () => {
        const crops = [['1R', '1 · right'], ['3R', '3 · right'], [null, '4 · missing'], ['6L', '6 · left'], ['7L', '7 · left']];
        return '<div class="ev-cabinet"><span class="ev-plate-label">Filed by door and side</span><div class="ev-sheet">'
          + crops.map(([id, label], index) => '<figure style="--order:' + index + '">' + (id ? small('crop-' + id, 'Saved crop from door ' + label)
            : '<span class="ev-absent" aria-label="No painting filed for door four">×</span>') + '<figcaption>' + label + '</figcaption></figure>').join('')
          + '</div><div class="ev-hit"><span>Closest crop for this query</span><b>0.242</b><span>Below the 0.45 cutoff</span></div></div>'
          + '<div class="ev-score"><b>13 / 16</b> correct across two development episodes</div>';
      }
    },
    {
      name: 'Search views', title: 'Save the whole doorway.',
      text: 'The next edit filed full views by door. At question time it searched inside each view. The matching patch fell on the right of door 4.',
      pose: 'mechanic', line: 'Now I can search every part of the frame, even when I missed the painting on the walk.',
      next: 'Test the next two edits',
      picture: () => '<div class="ev-search"><figure class="ev-located"><div class="ev-original">' + fullView() + '<i class="ev-box" aria-hidden="true"></i></div>'
        + '<figcaption>Stored view <b>Door 4</b></figcaption></figure><div class="ev-rank">' + small('match', 'The matched patch on the right side of the doorway.')
        + '<b>0.834</b><span>Match score</span></div></div><div class="ev-score"><b>16 / 16</b> correct across two development episodes</div>'
    },
    {
      name: 'Select', title: 'Which candidate does the gate retain?',
      text: 'The model can also rewrite the notes and analysis scripts that guide its next edit. Here it tested two more changes on the same development episodes.',
      pose: 'puzzle', line: 'I keep the whole-view program. Both attempts stay in my revision history.',
      next: 'Try the frozen program',
      picture: () => '<div class="ev-verdict"><span class="ev-plate-label">Candidate program</span>'
        + [['Whole-view search', '16 / 16', 'Kept', 'kept'], ['Rework rotated queries', '16 / 16', 'More steps and tokens', ''], ['Shorten the log', '13 / 16', 'Lower score', '']]
          .map(([name, score, reason, cls], index) => '<div class="ev-verdict-line ' + cls + '" style="--order:' + index + '"><span>' + name + '</span><b>'
            + score + '</b><small>' + reason + '</small></div>').join('') + '</div>'
        + '<details class="ev-playbook"><summary>How a failed idea helped in DMV-Hard</summary>'
        + '<ol><li><strong>Write down what failed.</strong> Offline matcher edits did not improve recognition. Haiku recorded them in its playbook.</li>'
        + '<li><strong>Use that finding.</strong> The right page was often already on the shortlist. A later edit showed candidate patches beside the query at the same scale.</li></ol>'
        + '</details>'
    },
    {
      name: 'Test', title: 'Take the program into ten new galleries.',
      text: 'The program is fixed for testing. Each walk starts with empty memory, new paintings and eight questions. The model’s weights stay fixed throughout.',
      pose: 'presenter', line: 'I carry the way to remember. I fill the notebook again on every walk.',
      next: 'Replay the evolution',
      picture: () => {
        const walkCount = 10;
        return '<div class="ev-test"><div class="ev-outcome"><strong>79<span> / 80</span></strong><span>questions correct</span></div>'
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
    + '<h3></h3><p></p></div><div class="ev-guide"><picture><source><img alt="" width="124" height="120" decoding="async"></picture>'
    + '<p class="ev-quote"></p></div></article><div class="ev-controls"><button class="ev-back" type="button">Back</button>'
    + '<a href="#tools" class="ev-tools-link" hidden>Explore the six evolved tools</a><button class="ev-next" type="button"></button></div>';

  const rail = root.querySelector('.ev-rail');
  const stageButtons = [...rail.querySelectorAll('button')];
  const panel = root.querySelector('#ev-panel');
  const figure = root.querySelector('.ev-figure');
  const title = root.querySelector('.ev-caption h3');
  const body = root.querySelector('.ev-caption p');
  const guideImage = root.querySelector('.ev-guide img');
  const motionSource = root.querySelector('.ev-guide source');
  const quote = root.querySelector('.ev-quote');
  const previous = root.querySelector('.ev-back');
  const next = root.querySelector('.ev-next');
  const toolsLink = root.querySelector('.ev-tools-link');
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
    title.textContent = step.title;
    body.textContent = step.text;
    quote.textContent = step.line;
    updatePose();
    previous.disabled = index === 0;
    next.textContent = step.next;
    toolsLink.hidden = index !== steps.length - 1;
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
