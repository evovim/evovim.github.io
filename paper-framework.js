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

  function mount(container, onSelect) {
    container.innerHTML = '<div class="paper-map"><div class="paper-window"><div class="paper-canvas">' +
      '<img width="990" height="518" src="media/method/framework-paper.svg" alt="EvoViM framework, from recording an observation to revising and selecting a memory program.">' +
      '<div class="paper-hotspots" role="group" aria-label="Framework components"></div></div></div>' +
      '<div class="paper-map-actions"><span>Select a part of the figure to see it in use.</span>' +
      '<button type="button" class="paper-focus" hidden></button></div></div>';
    const map = container.firstElementChild;
    const canvas = map.querySelector('.paper-canvas');
    const spots = map.querySelector('.paper-hotspots');
    const focusButton = map.querySelector('.paper-focus');
    const narrow = matchMedia('(max-width: 700px)');
    const buttons = [];
    let current = null, zoomed = false, selectedStage = '';
    let clickedRegion = null;

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
      let scale = 1, dx = 0, dy = 0;
      if (zoomed && current) {
        const [, , x, y, w, h] = current;
        scale = Math.min(4, width / (w + 28), height / (h + 22));
        dx = Math.max(1 - scale, Math.min(0, .5 - scale * (x + w / 2) / width));
        dy = Math.max(1 - scale, Math.min(0, .5 - scale * (y + h / 2) / height));
      }
      map.style.setProperty('--paper-outline', (2 / scale) + 'px');
      map.querySelector('.paper-map-actions span').hidden = !!current;
      canvas.style.transform = 'translate(' + (dx * 100) + '%,' + (dy * 100) + '%) scale(' + scale + ')';
      focusButton.hidden = !current;
      focusButton.textContent = zoomed ? 'Show whole figure' : 'Enlarge this part';
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

    return {update(step) {
      const stageChanged = step.id !== selectedStage;
      if (stageChanged) {
        selectedStage = step.id;
        current = clickedRegion || regions.find(([name]) => name === primary[step.id])
          || regions.find(([, stage]) => stage === step.id) || null;
        zoomed = !!current && narrow.matches;
      }
      clickedRegion = null;
      draw();
    }};
  }
  window.EvoViMFrameworkMap = {mount};
})();
