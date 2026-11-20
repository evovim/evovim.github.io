(() => {
  const root = document.getElementById('challenge');
  const video = document.getElementById('reel');
  const guess = document.getElementById('gallery-guess');
  const door = document.getElementById('guess-door');
  const feedback = document.getElementById('guess-feedback');
  const clue = document.getElementById('doorway-clue');
  const clueToggle = document.getElementById('clue-toggle');
  const caption = document.getElementById('walk-caption');
  const source = document.getElementById('lesson-source');
  const buttons = [...root.querySelectorAll('[data-stage]')];
  const transport = root.querySelector('.transport');
  let stage = 'walk';

  const galleryScores = document.getElementById('gallery-score-link');
  const counts = [...galleryScores.querySelectorAll('.walk-count')].map(node => ({node, target: Number(node.textContent)}));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const scoreEntrance = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    scoreEntrance.disconnect();
    if (motion.matches) return;
    const start = performance.now();
    function count(now) {
      const fraction = motion.matches ? 1 : Math.min(1, Math.max(0, (now - start) / 850));
      for (const {node, target} of counts) node.textContent = Math.round(target * (1 - (1 - fraction) ** 3));
      if (fraction < 1) requestAnimationFrame(count);
    }
    count(start);
  }, {threshold: .6});
  scoreEntrance.observe(galleryScores);

  function updateCaption() {
    if (stage !== 'walk' || !clue.hidden) return;
    let text = 'The agent is asked to reach the gold wall. The instructions say nothing about paintings.';
    if (video.currentTime >= 14) text = 'Now comes the question. Can you place a painting shown from a different angle?';
    else if (video.currentTime >= 6) text = 'These paintings share colors. A description that fits one could fit several.';
    if (caption.textContent !== text) caption.textContent = text;
  }

  function showClue(active) {
    clue.hidden = !active;
    video.hidden = active;
    transport.hidden = active;
    clueToggle.setAttribute('aria-pressed', String(active));
    clueToggle.textContent = active ? 'Return to the video' : 'Peek at a clue';
    source.textContent = active ? 'Test episode · Seed 43' : 'Recorded walk · Seed 43';
    if (active) {
      caption.textContent = 'The agent’s original doorway view at step 13.';
      video.pause();
    } else updateCaption();
  }

  function showStage(next, focus = false) {
    const previous = stage;
    stage = next;
    const order = ['walk', 'question', 'answer'];
    root.style.setProperty('--stage-progress', String(order.indexOf(stage) / (order.length - 1)));
    if (stage !== 'walk') {
      video.pause();
      source.textContent = 'Test episode · Haiku 5.5';
    }
    for (const button of buttons) {
      const key = button.dataset.stage;
      document.getElementById(key + '-panel').hidden = key !== stage;
      button.setAttribute('aria-pressed', String(key === stage));
      if (key === stage) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      button.classList.toggle('completed', order.indexOf(key) < order.indexOf(stage));
    }
    if (stage === 'walk') {
      showClue(false);
      if (previous !== 'walk' && video.ended) video.currentTime = 0;
    }
    if (focus) {
      const target = stage === 'walk' ? document.getElementById('reel-toggle') : document.querySelector('#' + stage + '-panel h3');
      target.tabIndex = stage === 'walk' ? 0 : -1;
      target.focus({preventScroll: true});
    }
  }

  clueToggle.addEventListener('click', () => showClue(clue.hidden));
  for (const button of buttons) button.addEventListener('click', () => showStage(button.dataset.stage));
  function startWalk() {
    showStage('walk', true);
    guess.reset();
    document.getElementById('guess-side').disabled = false;
    feedback.hidden = true;
    video.loop = false;
    video.currentTime = 0;
    updateCaption();
    video.play().catch(() => {});
  }
  root.querySelectorAll('[data-jump]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.jump === 'walk') startWalk();
    else showStage(button.dataset.jump, true);
  }));
  video.addEventListener('ended', () => {
    if (stage === 'walk' && !video.hidden) showStage('question', root.contains(document.activeElement));
  });
  video.addEventListener('timeupdate', updateCaption);
  document.getElementById('start-walk').addEventListener('click', startWalk);
  door.addEventListener('change', () => { document.getElementById('guess-side').disabled = door.value === 'unseen'; });
  guess.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(guess);
    const correct = data.get('door') === '7' && data.get('side') === 'left';
    const label = door.value === 'unseen' ? 'never seen' : 'door ' + door.value + ', ' + data.get('side');
    feedback.textContent = (correct ? 'Correct' : 'Your guess') + ' · ' + label;
    feedback.hidden = false;
    showStage('answer', true);
  });
})();
