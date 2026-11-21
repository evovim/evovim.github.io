(() => {
  'use strict';
  // Hotspots follow the labelled boxes in the original 495 × 259 paper artwork.
  const width = 495, height = 259;
  const regions = [
    ['Memory evolution', 'revision', 16, 12, 63, 12],
    ['Task execution', 'execution', 121, 16, 46, 12],
    ['Environment', 'execution', 122, 108, 41, 32],
    ['Record', 'record', 168, 24, 25, 12],
    ['Memory program', 'record', 198, 39, 158, 12],
    ['Frame memory', 'record', 200, 100, 155, 37],
    ['Pixel computation', 'pixels', 200, 51, 155, 47],
    ['Visual recall', 'recall', 200, 140, 155, 37],
    ['Prompt at question steps', 'recall', 200, 179, 155, 28],
    ['Act', 'recall', 168, 213, 25, 12],
    ['Development episodes', 'development', 40, 143, 79, 29],
    ['Enhanced feedback', 'feedback', 40, 84, 79, 46],
    ['Revision experience', 'experience', 40, 42, 79, 30],
    ['Revision', 'revision', 4, 94, 32, 75],
    ['Candidate program', 'candidate', 377, 89, 115, 94],
    ['Code checks', 'checks', 415, 22, 40, 11],
    ['Gate', 'gate', 422, 229, 27, 12],
    ['Program lineage', 'lineage', 272, 228, 122, 15]
  ];
  // For a region with more than one button, start on the part that explains the example.
  const primary = {execution:'Environment', record:'Frame memory', recall:'Visual recall', revision:'Revision'};
  // Each guide follows ONE existing connector in the published figure's coordinate system.
  // Held-out evaluation takes place after the lineage, outside the paper illustration.
  const routes = {
    'Environment': ['Environment', 'Record', 'M143 108 V39 Q143 30 152 30 H167'],
    'Record': ['Environment', 'Record', 'M143 108 V39 Q143 30 152 30 H167'],
    'Task execution': ['Environment', 'Record', 'M143 108 V39 Q143 30 152 30 H167'],
    'Frame memory': ['Observation', 'Frame memory', 'M234 118 H256.5'],
    'Memory program': ['Record', 'Memory program', 'M193 30 H273 Q278 30 278 37'],
    'Pixel computation': ['Query', 'Candidate scores', 'M223 78 H231'],
    'Visual recall': ['Saved regions', 'Next prompt', 'M279 156 H293'],
    'Prompt at question steps': ['Memory program', 'Act', 'M278 210 V213 Q278 218 273 218 H194'],
    'Act': ['Act', 'Environment', 'M168 218 H152 Q143 218 143 209 V140'],
    'Development episodes': ['Environment', 'Development episodes', 'M133 139 V154 Q133 157 129 157 H121'],
    'Enhanced feedback': ['Development episodes', 'Enhanced feedback', 'M80 142 V133'],
    'Revision experience': ['Revision', 'Revision experience', 'M102.3 12 V40'],
    'Revision': ['Revision experience', 'Revision', 'M41 56.7 H31 Q26.5 56.7 26.5 62 V93'],
    'Memory evolution': ['Program lineage', 'Revision', 'M272 235 H34 Q28.5 235 28.5 229 V171'],
    'Candidate program': ['Candidate program', 'Memory program', 'M377 124 H359'],
    'Code checks': ['Revision', 'Code checks', 'M372 11.2 H429 Q435 11.2 435 18 V21'],
    'Gate': ['Development score', 'Gate', 'M435 183 V228'],
    'Rejected edit': ['Gate', 'Retry from parent', 'M435 241 V244 Q435 248 429 248 H19 Q12 248 12 241 V171'],
    'Program lineage': ['Gate', 'Program lineage', 'M422 235 H397']
  };

  function mount(container, onSelect) {
    container.innerHTML = '<div class="paper-map"><div class="paper-map-actions"><p class="paper-link"></p>' +
      '<button type="button" class="paper-focus" hidden></button></div><div class="paper-window"><div class="paper-canvas">' +
      '<img width="990" height="518" src="media/method/framework-paper.svg" alt="EvoViM framework, from recording an observation to revising and selecting a memory program.">' +
      '<div class="paper-lens" aria-hidden="true" hidden></div><svg class="paper-flow" viewBox="0 0 495 259" aria-hidden="true" focusable="false"><path class="paper-wire"/><g class="paper-tip"><path d="M-3 -1.75 L0 0 L-3 1.75"/></g></svg>' +
      '<div class="paper-hotspots" role="group" aria-label="Framework components"></div></div></div></div>';
    const map = container.firstElementChild;
    const canvas = map.querySelector('.paper-canvas');
    const spots = map.querySelector('.paper-hotspots');
    const focusButton = map.querySelector('.paper-focus');
    const narrow = matchMedia('(max-width: 700px)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const wire = map.querySelector('.paper-wire');
    const tip = map.querySelector('.paper-tip');
    const link = map.querySelector('.paper-link');
    const lens = map.querySelector('.paper-lens');
    const buttons = [];
    let current = null, zoomed = false, selectedStage = '';
    let clickedRegion = null, rejected = false, visible = false, frame = 0, routeKey = '';

    function pointTip(distance, length) {
      const point = wire.getPointAtLength(distance);
      const before = wire.getPointAtLength(Math.max(0, distance - .2));
      const after = wire.getPointAtLength(Math.min(length, distance + .2));
      const angle = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI;
      tip.setAttribute('transform', 'translate('+point.x+' '+point.y+') rotate('+angle+')');
    }
    function trace() {
      cancelAnimationFrame(frame);
      if (!wire.hasAttribute('d')) return;
      const length = wire.getTotalLength();
      pointTip(length, length);
      if (!visible || document.hidden || reduced.matches) return;
      const start = performance.now();
      const duration = Math.min(1400, 620 + length * 5);
      function tick(now) {
        const progress = Math.min(1, (now - start) / duration);
        pointTip(length * (1 - (1 - progress) ** 1.6), length);
        if (progress < 1) frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);
    }
    function showRoute() {
      const key = selectedStage === 'heldout' ? 'heldout' : rejected && selectedStage === 'gate' ? 'Rejected edit' : current?.[0] || 'Environment';
      if (key === routeKey) return;
      routeKey = key;
      const [from, to, path] = routes[key] || ['Selected program','Held-out evaluation',null];
      link.replaceChildren(document.createTextNode(from));
      const arrow = document.createElement('span');
      arrow.textContent = ' → ';
      link.append(arrow, document.createTextNode(to));
      map.querySelector('.paper-flow').style.display = path ? '' : 'none';
      if (path) wire.setAttribute('d',path);
      else wire.removeAttribute('d');
      trace();
    }
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; trace(); }).observe(map);
    reduced.addEventListener('change',trace);
    document.addEventListener('visibilitychange',trace);

    for (const region of regions) {
      const [name, stage, x, y, w, h] = region;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fm-spot';
      button.id = 'method-' + name.toLowerCase().replaceAll(' ', '-');
      button.setAttribute('aria-label', name);
      button.setAttribute('aria-controls', 'fw-title');
      button.title = name;
      button.dataset.stage = stage;
      Object.assign(button.style, {
        left: (x / width * 100) + '%', top: (y / height * 100) + '%',
        width: (w / width * 100) + '%', height: (h / height * 100) + '%'
      });
      button.addEventListener('click', () => {
        clickedRegion = region;
        onSelect(stage);
        // Some paper components correspond to different parts of the same worked step.
        if (clickedRegion) { current = clickedRegion; clickedRegion = null; draw(); }
      });
      buttons.push(button);
      spots.append(button);
    }

    function draw() {
      showRoute();
      let scale = 1, dx = 0, dy = 0;
      lens.hidden = !current;
      if (current) {
        const [, , x, y, w, h] = current;
        Object.assign(lens.style, {left:x/width*100+'%',top:y/height*100+'%',width:w/width*100+'%',height:h/height*100+'%'});
      }
      if (zoomed && current) {
        const [, , x, y, w, h] = current;
        const route = wire.hasAttribute('d') ? wire.getBBox() : {x, y, width:w, height:h};
        const left = Math.min(x,route.x), top = Math.min(y,route.y);
        const right = Math.max(x+w,route.x+route.width), bottom = Math.max(y+h,route.y+route.height);
        scale = Math.min(3.5, width / (right-left+26), height / (bottom-top+19));
        dx = Math.max(1 - scale, Math.min(0, .5 - scale * (left+right) / (2*width)));
        dy = Math.max(1 - scale, Math.min(0, .5 - scale * (top+bottom) / (2*height)));
      }
      map.style.setProperty('--paper-outline', (2 / scale) + 'px');
      canvas.style.transform = 'translate(' + (dx * 100) + '%,' + (dy * 100) + '%) scale(' + scale + ')';
      focusButton.hidden = !current;
      focusButton.textContent = zoomed ? 'Show whole figure' : 'Enlarge component';
      focusButton.setAttribute('aria-pressed', String(zoomed));
      for (const [index, button] of buttons.entries()) {
        const region = regions[index];
        const centerX = dx + (region[2] + region[4] / 2) / width * scale;
        const centerY = dy + (region[3] + region[5] / 2) / height * scale;
        button.tabIndex = centerX >= 0 && centerX <= 1 && centerY >= 0 && centerY <= 1 ? 0 : -1;
        button.setAttribute('aria-pressed', String(current === region));
      }
    }
    focusButton.addEventListener('click', () => { zoomed = !zoomed; draw(); });
    narrow.addEventListener('change', () => { zoomed = narrow.matches && !!current; draw(); });

    return {update(step, rejectedGate) {
      rejected = rejectedGate;
      const stageChanged = step.id !== selectedStage;
      if (stageChanged) {
        routeKey = '';
        selectedStage = step.id;
        current = clickedRegion || regions.find(([name]) => name === primary[step.id])
          || regions.find(([, stage]) => stage === step.id) || null;
        if (step.id === 'heldout') current = regions.find(([name]) => name === 'Program lineage');
        zoomed = !!current && narrow.matches;
      }
      clickedRegion = null;
      draw();
    }};
  }
  window.EvoViMFrameworkMap = {mount};
})();
