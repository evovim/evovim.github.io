(() => {
  const artPath = 'media/mascot-scenes/';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const clips = new Map();

  const caseLines = {
    'dmv-hard': ['archivist', 'Which detail identifies this vase?', 'Look for the fan-shaped panels.'],
    'poster-maze': ['detective', 'Where am I standing?', 'Follow my sightline into the next cell.'],
    'card-matching': ['detective', 'Remember where the pink card lands.', 'Was it column H or I?'],
    tetris: ['puzzle', 'How far can the piece fall?', 'Same drop. Which slide is shorter?']
  };

  function selected(scope, selector) {
    return scope.querySelector(selector + '[aria-pressed="true"]')?.dataset;
  }

  const scenes = [
    {
      area: 'cases', anchor: '.cs-actions',
      read(scope) {
        const task = scope.dataset.example;
        const step = scope.querySelector('.cs-bar [aria-current="step"] i')?.textContent;
        const [pose, observe, decide] = caseLines[task];
        return [pose, step === '1' ? observe : step === '2' ? decide : ''];
      }
    },
    {
      area: 'applications', anchor: '.archive-status', feedback: '.archive-status',
      read(scope) {
        const monet = selected(scope, '[data-key]')?.key === 'monet';
        const stage = scope.querySelector('.archive-guide').dataset.stage;
        if (stage === 'answer') return ['archivist', ''];
        if (scope.querySelector('.archive-record.missed')) return ['archivist', monet
          ? 'Compare the edges of the stacks.'
          : 'Trace the edge of the crop.'];
        if (stage === 'choose') return ['archivist', 'Look for a matching edge.'];
        return ['archivist', monet
          ? 'Watch how the light changes.'
          : 'Notice the shapes in the dust and sky.'];
      }
    },
    {
      area: 'install', anchor: '.install-links',
      read: () => ['mechanic', 'Give it a try!']
    }
  ];

  // A fresh object URL replays the one-shot animation even when a pose is reused.
  function motionClip(pose) {
    if (!clips.has(pose)) {
      clips.set(pose, fetch(artPath + pose + '-motion.webp')
        .then(response => response.ok ? response.blob() : null).catch(() => null));
    }
    return clips.get(pose);
  }

  for (const scene of scenes) {
    const scope = document.getElementById(scene.area);
    if (!scope) continue;
    const note = document.createElement('figure');
    note.className = 'mascot-scene mascot-' + scene.area;
    note.setAttribute('aria-label', 'EvoViM’s guide');
    note.innerHTML = '<span class="mascot-illustration" aria-hidden="true"><img class="mascot-still" alt="" decoding="async"></span><figcaption class="mascot-bubble"><span class="mascot-line"></span></figcaption>';
    const illustration = note.firstElementChild;
    const still = illustration.firstElementChild;
    const bubble = note.lastElementChild;
    const words = bubble.firstElementChild;
    still.loading = 'lazy';

    let pose, previousLine, clipImage, clipURL, timer;
    let visible = false;
    let bubbleMotion, fadeMotion;
    let introduced = false;

    function rest() {
      clearTimeout(timer);
      clipImage?.remove();
      clipImage = null;
      if (clipURL) URL.revokeObjectURL(clipURL);
      clipURL = null;
      note.classList.remove('mascot-performing');
    }

    async function perform() {
      rest();
      if (!visible || motion.matches || document.hidden) return;
      const frame = new Image();
      clipImage = frame;
      frame.alt = '';
      frame.className = 'mascot-motion';
      const url = artPath + pose + '-motion.webp';
      const clip = location.protocol === 'file:' ? null : await motionClip(pose);
      if (clipImage !== frame) return;
      frame.onload = () => {
        if (clipImage !== frame || !visible || motion.matches) return;
        illustration.append(frame);
        note.classList.add('mascot-performing');
        timer = setTimeout(rest, 1320);
      };
      clipURL = clip ? URL.createObjectURL(clip) : null;
      frame.src = clipURL || url;
    }

    function speak(line, rewind = false) {
      const animate = visible && !motion.matches && !document.hidden;
      bubbleMotion?.cancel();
      fadeMotion?.cancel();
      if (!line) {
        if (animate && !bubble.hidden) {
          fadeMotion = bubble.animate([{opacity: 1}, {opacity: 0, transform: 'translateY(4px)'}], {duration: 180});
          fadeMotion.onfinish = () => { bubble.hidden = true; };
        } else bubble.hidden = true;
        return;
      }
      bubble.hidden = false;
      words.textContent = line;
      if (animate) {
        bubbleMotion = bubble.animate([
          {opacity: 0, transform: 'translate(-8px, 4px) rotate(-2deg) scale(.94)'},
          {opacity: 1, transform: 'translate(1px, -1px) rotate(.4deg) scale(1.015)', offset: .7},
          {opacity: 1, transform: 'none'}
        ], {duration: rewind ? 420 : 310, delay: rewind ? 110 : 0, easing: 'ease-out', fill: 'backwards'});
      }
    }

    function update() {
      const anchor = scope.querySelector(scene.anchor);
      if (!anchor) return;
      // Choosing another case replaces its entire action panel.
      if (!note.isConnected) anchor.after(note);
      const [nextPose, line] = scene.read(scope);
      if (pose === nextPose && previousLine === line) return;
      if (pose !== nextPose) {
        pose = nextPose;
        still.src = artPath + pose + '.webp';
        note.dataset.pose = pose;
      }
      previousLine = line;
      speak(line);
      if (introduced) perform();
    }

    update();
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) rest();
      else if (!introduced) {
        introduced = true;
        perform();
        speak(previousLine, true);
      }
    }, {threshold: .15});
    visibility.observe(note);

    const states = new MutationObserver(update);
    states.observe(scope, {subtree: true, attributes: true, attributeFilter: ['aria-pressed', 'aria-current', 'data-stage']});
    if (scene.feedback) states.observe(scope.querySelector(scene.feedback), {childList: true});
    if (scene.area === 'install') scope.querySelector('#copy-install')?.addEventListener('click', perform);
    motion.addEventListener('change', () => {
      if (motion.matches) {
        rest();
        speak(previousLine);
      }
    });
  }
})();
