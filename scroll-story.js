(() => {
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const page = document.documentElement;
  const header = document.querySelector('.top');
  const chapters = [
    ['.hero', 'opening'],
    ['.chapter-intro, .lineage-intro, .question-copy', 'heading'],
    ['#environments .atlas-groups', 'environments'],
    ['#cases .cs-stage', 'decision'],
    ['#pilot-story .ep-stage, #ev-panel', 'evidence'],
    ['#applications .archive-records', 'archive'],
    ['#install .install-inner', 'install']
  ];
  const scenes = chapters.flatMap(([selector, name]) =>
    [...document.querySelectorAll(selector)].map(element => ({element, name}))
  );
  const fraction = value => Math.min(1, Math.max(0, value));
  let frame = 0;
  let geometryChanged = true;
  let height, scrollRange, headerHeight;

  function update() {
    frame = 0;
    const y = window.scrollY;
    if (geometryChanged) {
      height = page.clientHeight;
      scrollRange = page.scrollHeight - height;
      headerHeight = header.offsetHeight;
      // Measure untransformed parents only. The scroll handler uses these cached
      // document coordinates until a section, its content or the viewport resizes.
      for (const scene of scenes) {
        const rect = scene.element.getBoundingClientRect();
        scene.top = rect.top + y;
        scene.height = rect.height;
      }
      geometryChanged = false;
    }

    header.style.setProperty('--reading-progress', (scrollRange > 0 ? fraction(y / scrollRange) : 1).toFixed(4));
    if (!motion.matches) return;
    for (const scene of scenes) {
      if (!scene.height) continue;
      const top = scene.top - y;
      let progress;
      if (scene.name === 'opening') {
        progress = (headerHeight - top) / (height * .7);
      } else {
        progress = (height * .96 - top) / (height * .47);
      }
      const value = fraction(progress).toFixed(4);
      if (scene.value === value) continue;
      scene.value = value;
      scene.element.style.setProperty('--arrival', value);
    }
  }

  function requestUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  function requestMeasure() {
    geometryChanged = true;
    requestUpdate();
  }

  function configure() {
    page.classList.toggle('scroll-story', motion.matches);
    for (const scene of scenes) {
      if (motion.matches) scene.element.dataset.scrollScene = scene.name;
      else {
        delete scene.element.dataset.scrollScene;
        scene.element.style.removeProperty('--arrival');
        scene.value = null;
      }
    }
    requestMeasure();
  }

  const resize = new ResizeObserver(requestMeasure);
  resize.observe(document.body);
  for (const {element} of scenes) resize.observe(element);
  document.addEventListener('scroll', requestUpdate, {passive: true});
  window.addEventListener('resize', requestMeasure);
  window.addEventListener('pageshow', requestMeasure);
  window.addEventListener('hashchange', requestMeasure);
  motion.addEventListener('change', configure);
  configure();
})();
