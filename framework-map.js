(() => {
  'use strict';

  // The editorial plate, selectable regions and camera use one coordinate system.
  const width = 1200, height = 610;
  const src = 'media/method/framework-editorial.svg?v=3fc6a064';
  const regions = {
    evolution: ['Memory evolution', 47, 15, 192, 31, 'revision'],
    execution: ['Task execution', 293, 16, 158, 31, 'execution'],
    environment: ['Environment', 298, 245, 101, 74, 'execution'],
    record: ['Record', 407, 40, 63, 30, 'record'],
    memory: ['Memory program', 480, 75, 386, 30, 'record'],
    frames: ['Frame memory', 485, 221, 377, 92, 'record'],
    pixels: ['Pixel computation', 485, 104, 377, 113, 'pixels'],
    recall: ['Visual recall', 485, 317, 377, 85, 'recall'],
    prompt: ['Prompt at question steps', 485, 411, 377, 74, 'recall'],
    act: ['Act', 407, 494, 63, 30, 'recall'],
    development: ['Development episodes', 99, 325, 195, 75, 'development'],
    feedback: ['Enhanced feedback', 99, 185, 195, 116, 'feedback'],
    revision: ['Revision', 11, 209, 83, 187, 'revision'],
    experience: ['Revision experience', 101, 83, 192, 83, 'experience'],
    candidate: ['Candidate program', 912, 194, 277, 231, 'candidate'],
    checks: ['Code checks', 1002, 35, 102, 29, 'checks'],
    gate: ['Gate', 1019, 534, 68, 32, 'gate'],
    lineage: ['Program lineage', 660, 531, 299, 39, 'lineage']
  };

  // Light the connections that carry evidence or a program to this stage.
  const edges = {
    observation:'M348 247 V76 Q348 55 369 55 H410',
    action:'M410 509 H369 Q348 509 348 487 V318',
    write:'M469 55 H660 Q673 55 673 68 V77',
    read:'M673 488 V497 Q673 509 660 509 H469',
    episode:'M325 318 V348 Q325 363 311 363 H292',
    summarized:'M196 326 V298',
    episodesToRevision:'M101 362 H91',
    feedbackToRevision:'M101 244 H91',
    experienceToRevision:'M102 120 H78 Q67 120 67 132 V211',
    rewrite:'M37 211 V27 Q37 10 54 10 H250 V84',
    checks:'M37 211 V27 Q37 10 54 10 H1038 Q1053 10 1053 26 V36',
    checked:'M1053 63 V197',
    install:'M915 282 H865',
    score:'M1053 424 V537',
    accept:'M1023 550 H958',
    parent:'M662 550 H85 Q72 550 72 538 V394',
    retry:'M1053 565 V568 Q1053 581 1040 581 H51 Q32 581 32 564 V394'
  };
  const routes = {
    execution:['observation','action'], record:['write'], recall:['read','action'],
    development:['episode','episodesToRevision'], feedback:['summarized','feedbackToRevision'],
    experience:['rewrite','experienceToRevision'],
    revision:['episodesToRevision','feedbackToRevision','experienceToRevision','rewrite','parent'],
    candidate:['install'], checks:['checks','checked','install'], gate:['score','accept'], lineage:['accept','parent','rewrite','experienceToRevision']
  };
  const svgNS = 'http://www.w3.org/2000/svg';

  function mount(container, onSelect) {
    container.innerHTML = '<div class="fm"><div class="fm-window"><div class="fm-canvas"><img class="fm-overview" src="' + src + '" width="1200" height="610" alt="EvoViM framework. Task execution records outcomes and consults the memory program. Memory evolution revises that program and the guidance used in future revisions.">' +
      '<svg class="fm-mask" aria-hidden="true" viewBox="0 0 1200 610" preserveAspectRatio="none"><defs><mask id="fm-spotlight" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="610"><rect width="1200" height="610" fill="white"/><g></g></mask></defs>' +
      '<rect width="1200" height="610" fill="#fcfcfd" opacity=".44" mask="url(#fm-spotlight)"/></svg><div class="fm-hotspots" role="group" aria-label="Explore the framework components"></div></div></div>' +
      '<div class="fm-actions"><button class="fm-wide" type="button" aria-expanded="false">Enlarge diagram</button><button class="fm-view" type="button" hidden>Show whole diagram</button></div></div>';
    const figure = container.firstElementChild;
    const canvas = figure.querySelector('.fm-canvas');
    const viewport = figure.querySelector('.fm-window');
    const viewButton = figure.querySelector('.fm-view');
    const wideButton = figure.querySelector('.fm-wide');
    wideButton.addEventListener('click', () => {
      const expanded = wideButton.getAttribute('aria-expanded') === 'false';
      wideButton.setAttribute('aria-expanded', String(expanded));
      wideButton.textContent = expanded ? 'Restore split view' : 'Enlarge diagram';
      figure.closest('.fw-spread').classList.toggle('fw-expanded', expanded);
    });
    const mobile = matchMedia('(max-width:650px)');
    let selected = null;
    let showOverview = false;
    const mask = figure.querySelector('.fm-mask g');
    const spots = figure.querySelector('.fm-hotspots');
    const buttons = {};
    for (const [id,[label,x,y,w,h,stage]] of Object.entries(regions)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fm-spot';
      button.style.cssText = 'left:'+x/width*100+'%;top:'+y/height*100+'%;width:'+w/width*100+'%;height:'+h/height*100+'%';
      button.setAttribute('aria-label',label);
      button.dataset.part = id;
      button.id = 'method-'+label.toLowerCase().replaceAll(' ','-');
      button.dataset.stage = stage;
      button.addEventListener('click',() => onSelect(stage));
      buttons[id] = button;
      spots.append(button);
    }

    // Preserve the complete map on desktop. A narrow screen follows the
    // selected component at reading size, with a way back to the full map.
    function positionCamera() {
      const mobileFocus = mobile.matches && Boolean(selected?.parts?.length);
      viewButton.hidden = !mobileFocus;
      const zoomed = mobileFocus && !showOverview;
      figure.dataset.zoomed = String(zoomed);
      viewButton.textContent = zoomed ? 'Show whole diagram' : 'Focus on this step';
      viewButton.setAttribute('aria-pressed', String(zoomed));
      let zoom = 1, tx = 0, ty = 0;
      const {width:vw, height:vh} = viewport.getBoundingClientRect();
      if (!vw || !vh) return;
      if (zoomed) {
        // Keep the selected node readable even when other connected nodes
        // are at opposite ends of the full figure.
        const cameraPart = {execution:'environment',record:'frames'}[selected.id] || selected.id;
        let [,x,y,w,h] = regions[cameraPart] || regions[selected.parts[0]];
        if (selected.id === 'experience') [x,y,w,h] = [16,9,300,198];
        const inkWidth = Math.max(w + 42, 255);
        zoom = Math.min(width / inkWidth, vh / (((h + 34) / width) * vw), 4.6);
        const scale = zoom * vw / width;
        tx = Math.max(vw-vw*zoom, Math.min(0, vw/2-(x+w/2)*scale));
        ty = Math.max(vh-(height*scale), Math.min(0, vh/2-(y+h/2)*scale));
      }
      canvas.style.transform = 'translate('+tx+'px,'+ty+'px) scale('+zoom+')';
      // Off-camera controls remain addressable through the component menu.
      // Tabbing must not scroll the clipped viewport away from the active area.
      for (const [id,button] of Object.entries(buttons)) {
        const [,x,y,w,h] = regions[id];
        const scale = zoom*vw/width;
        const cx = tx+(x+w/2)*scale, cy = ty+(y+h/2)*scale;
        button.tabIndex = !zoomed || (cx>=0 && cx<=vw && cy>=0 && cy<=vh) ? 0 : -1;
      }
    }
    viewButton.addEventListener('click', () => {
      showOverview = !showOverview;
      positionCamera();
    });
    new ResizeObserver(positionCamera).observe(viewport);

    function update(step, rejected) {
      if (selected?.id !== step.id) showOverview = false;
      selected = step;
      const parts = step.parts || [];
      const lit = new Set(parts);
      figure.dataset.focused = String(parts.length > 0);
      figure.style.setProperty('--fm-ink', step.color);
      positionCamera();
      mask.replaceChildren();
      let trace = routes[step.id] || [];
      if (step.id === 'gate' && rejected) trace = ['score','retry'];
      for (const id of trace) {
        const path = document.createElementNS(svgNS,'path');
        for (const [name,value] of Object.entries({d:edges[id], fill:'none', stroke:'black','stroke-width':13,'stroke-linecap':'round',pathLength:1})) path.setAttribute(name,value);
        path.classList.add('fm-trace');
        mask.append(path);
      }
      // The 'rewrite' label distinguishes changing revision experience from
      // reading it. It sits alongside the vertical branch near the top.
      if (trace.includes('rewrite')) {
        const label = document.createElementNS(svgNS,'rect');
        for (const [name,value] of Object.entries({x:196,y:50,width:54,height:22,fill:'black'})) label.setAttribute(name,value);
        mask.append(label);
      }
      for (const [id,button] of Object.entries(buttons)) {
        button.dataset.lit = String(lit.has(id));
        button.setAttribute('aria-pressed',String(lit.has(id)));
        if (!lit.has(id)) continue;
        const [,x,y,w,h] = regions[id];
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
        for (const [name,value] of Object.entries({x:x-3,y:y-3,width:w+6,height:h+6,rx:5,fill:'black'})) rect.setAttribute(name,value);
        mask.append(rect);
      }
    }
    return {update};
  }

  window.EvoViMFrameworkMap = {mount};
})();
