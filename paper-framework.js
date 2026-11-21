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
  // The directions and bends below follow printed arrows in the 495 × 259 figure.
  // Drafting a candidate, retaining an incumbent, and held-out scoring have no direct connectors.
  const edges = {
    read: ['Read memory', 'Memory program → Act', 'Act', 'M278 210 V213 Q278 218 273 218 H194'],
    act: ['Act', 'Act → Environment', 'Environment', 'M168 218 H152 Q143 218 143 209 V140'],
    observe: ['Observe', 'Environment → Record', 'Record', 'M143 108 V39 Q143 30 152 30 H167'],
    write: ['Write memory', 'Record → Memory program', 'Memory program', 'M193 30 H273 Q278 30 278 37'],
    file: ['Store frame', 'Doorway view → Frame memory', 'Frame memory', 'M234 118 H256.5'],
    compare: ['Compare', 'Query → Candidate scores', 'Pixel computation', 'M223 78 H231'],
    recall: ['Recall', 'Retrieved regions → Next prompt', 'Visual recall', 'M279 156 H293'],
    rollout: ['Record episode', 'Environment → Development episodes', 'Development episodes', 'M133 139 V154 Q133 157 129 157 H121'],
    episodes: ['Inspect trace', 'Development episodes → Revision', 'Revision', 'M41 157 H37'],
    summarize: ['Summarize', 'Development episodes → Enhanced feedback', 'Enhanced feedback', 'M80 142 V133'],
    feedback: ['Diagnose', 'Enhanced feedback → Revision', 'Revision', 'M41 107.5 H37'],
    consult: ['Consult experience', 'Revision experience → Revision', 'Revision', 'M41 56.7 H31 Q26.5 56.7 26.5 62 V93'],
    parent: ['Load parent', 'Program lineage → Revision', 'Revision', 'M272 235 H34 Q28.5 235 28.5 229 V171'],
    rewrite: ['Update experience', 'Revision → Revision experience', 'Revision experience', 'M14.2 94 V21 Q14.2 11.2 24 11.2 H102.3 V40'],
    submit: ['Check proposed code', 'Revision → Code checks', 'Code checks', 'M14.2 94 V21 Q14.2 11.2 24 11.2 H429 Q435 11.2 435 18 V21'],
    pass: ['Pass checks', 'Code checks → Candidate program', 'Candidate program', 'M435 33.5 V88'],
    install: ['Install', 'Candidate program → Memory program', 'Memory program', 'M377 124 H359'],
    score: ['Submit score', 'Development score → Gate', 'Gate', 'M435 183 V228'],
    accept: ['Accept', 'Gate → Program lineage', 'Program lineage', 'M422 235 H397'],
    gen1: ['Generation 1', 'Generation 0 → Generation 1', 'Program lineage', 'M345 235 H350'],
    gen2: ['Generation 2', 'Generation 1 → Generation 2', 'Program lineage', 'M369 235 H373.5'],
    reject: ['Reject and retry', 'Gate → Revision of the same parent', 'Revision', 'M435 241 V244 Q435 248 429 248 H19 Q12 248 12 241 V171']
  };
  const steps = {
    intro: [null, [], 'Starting program'],
    execution: ['Environment',['read','act','observe','write']],
    development: ['Development episodes',['rollout','episodes']],
    feedback: ['Enhanced feedback',['summarize','feedback']],
    experience: ['Revision experience',['consult']],
    revision: ['Revision',['parent','rewrite']],
    candidate: ['Candidate program',[],'Proposed candidate · awaiting code checks'],
    checks: ['Code checks',['submit','pass']],
    evaluation: ['Candidate program',['install','rollout']],
    gate: ['Gate',['score','accept']],
    lineage: ['Program lineage',['gen1','gen2','parent']],
    rejection: ['Gate',['score','reject']],
    retained: ['Program lineage',['submit','pass','install','rollout','score']],
    record: ['Frame memory',['observe','write','file']],
    pixels: ['Pixel computation',['compare']],
    recall: ['Visual recall',['recall','read','act']],
    heldout: ['Program lineage',[],'Last accepted program → Held-out evaluation']
  };
  const regionFor = name => regions.find(region => region[0] === name);

  function mount(container, onSelect, onManual) {
    container.innerHTML = '<div class="paper-map"><div class="paper-map-actions"><p class="paper-link"></p>' +
      '<div class="paper-controls"><button type="button" class="paper-replay">Replay arrows</button><button type="button" class="paper-focus" hidden></button></div></div>' +
      '<div class="paper-window"><div class="paper-canvas"><img width="990" height="518" src="media/method/framework-paper.svg" alt="Paper framework. Task execution produces episode traces, which guide revisions to the program and its playbook. Checked candidates run on the same seeds before selection.">' +
      '<div class="paper-lens" aria-hidden="true" hidden></div><svg class="paper-flow" viewBox="0 0 495 259" aria-hidden="true" focusable="false">' +
      '<path class="paper-halo"/><path class="paper-track"/><path class="paper-wire"/><g class="paper-tip"><path d="M0 0 L-1 -.48 L-.78 0 L-1 .48 Z"/></g></svg>' +
      '<div class="paper-hotspots" role="group" aria-label="Framework components"></div></div></div>' +
      '<div class="paper-sequence" role="group" aria-label="Connections in this step"></div></div>';
    const find = selector => container.querySelector(selector);
    const map = find('.paper-map'), canvas = find('.paper-canvas');
    const spots = find('.paper-hotspots'), focusButton = find('.paper-focus'), replay = find('.paper-replay');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)'), narrow = matchMedia('(max-width: 700px)');
    const wire = find('.paper-wire'), tip = find('.paper-tip'), flow = find('.paper-flow');
    const link = find('.paper-link'), lens = find('.paper-lens'), sequence = find('.paper-sequence');
    let base = null, component = null, chain = [], leg = 0, stage = '', staticLabel = '';
    let zoomed = false, visible = false, frame = 0, scale = 1;
    let runSequence = true, length = 0, stateKey = '';
    let playback = 'manual', elapsed = 0, finished = false;

    function viewport() {
      const edge = edges[chain[leg]];
      const target = component || (edge ? regionFor(edge[2]) : base);
      let dx = 0, dy = 0;
      scale = 1;
      lens.hidden = !target;
      if (target) {
        const [, , x, y, w, h] = target;
        Object.assign(lens.style, {left:x/width*100+'%',top:y/height*100+'%',width:w/width*100+'%',height:h/height*100+'%'});
        if (zoomed) {
          const route = edge ? wire.getBBox() : {x,y,width:w,height:h};
          const left = Math.min(x,route.x), top = Math.min(y,route.y);
          const right = Math.max(x+w,route.x+route.width), bottom = Math.max(y+h,route.y+route.height);
          scale = Math.max(1,Math.min(3.5,width/(right-left+32),height/(bottom-top+25)));
          dx = Math.max(1-scale,Math.min(0,.5-scale*(left+right)/(2*width)));
          dy = Math.max(1-scale,Math.min(0,.5-scale*(top+bottom)/(2*height)));
        }
      }
      // Resize the vector artwork itself so phone crops are rendered at their displayed resolution.
      Object.assign(canvas.style,{width:(scale*100)+'%',left:(dx*100)+'%',top:(dy*100)+'%'});
      map.style.setProperty('--wire-width',2.6/Math.max(.5,canvas.offsetWidth/width));
      focusButton.hidden = !target;
      focusButton.textContent = zoomed ? 'Zoom out' : 'Zoom in';
      focusButton.setAttribute('aria-pressed',String(zoomed));
      [...spots.children].forEach((button,i) => {
        const region = regions[i];
        const cx = dx+(region[2]+region[4]/2)*scale/width, cy = dy+(region[3]+region[5]/2)*scale/height;
        button.tabIndex = cx>=0 && cx<=1 && cy>=0 && cy<=1 ? 0 : -1;
        button.setAttribute('aria-pressed',String(region === target));
      });
    }

    function place(progress) {
      const distance = length * progress;
      const point = wire.getPointAtLength(distance);
      const before = wire.getPointAtLength(Math.max(0,distance-.25));
      const after = wire.getPointAtLength(Math.min(length,distance+.25));
      const angle = Math.atan2(after.y-before.y,after.x-before.x)*180/Math.PI;
      const unit = canvas.offsetWidth / width;
      const size = 14 / Math.max(.5,unit);
      tip.setAttribute('transform','translate('+point.x+' '+point.y+') rotate('+angle+') scale('+size+')');
      wire.style.strokeDashoffset = String(length-distance);
    }
    function animate() {
      cancelAnimationFrame(frame);
      if (!chain.length) return;
      if (reduced.matches) place(1);
      if (!visible || document.hidden || playback==='paused' || (reduced.matches && playback!=='auto')) return;
      if (finished) {
        if (runSequence && leg+1 < chain.length) setLeg(leg+1);
        return;
      }
      const start = performance.now()-elapsed;
      const duration = Math.min(1450,760 + length*1.8);
      function tick(now) {
        elapsed = now-start;
        const t = Math.max(0,Math.min(1,(elapsed-100)/duration));
        if (!reduced.matches) place(t * (2-t));
        if (elapsed < duration+480) frame = requestAnimationFrame(tick);
        else {
          finished = true;
          if (runSequence && leg+1 < chain.length) setLeg(leg+1);
        }
      }
      frame = requestAnimationFrame(tick);
    }
    function setLeg(index) {
      cancelAnimationFrame(frame);
      elapsed=0; finished=false;
      leg = index;
      const id = chain[leg], edge = edges[id];
      map.dataset.edge = id || '';
      flow.style.display = edge ? '' : 'none';
      link.textContent = edge ? edge[1] : staticLabel;
      [...sequence.children].forEach((button,i) => {
        button.setAttribute('aria-pressed',String(i===leg));
      });
      if (edge) {
        for (const path of flow.querySelectorAll(':scope > path')) path.setAttribute('d',edge[3]);
        length = wire.getTotalLength();
        wire.style.strokeDasharray = String(length)+' '+String(length);
      }
      viewport();
      if (edge) { place(0); animate(); }
    }
    function replaySequence() {
      onManual();
      component = null;
      runSequence = true;
      setLeg(0);
    }
    function update(step,state) {
      const key = [step.id,state.retry,state.verdict].join('-');
      if (key === stateKey) return;
      stateKey = key; stage = step.id;
      const [name, normal, label] = steps[stage];
      base = regionFor(name); component = null;
      chain = normal;
      staticLabel = label || '';
      if (stage === 'gate' && state.verdict === 'reject') chain = state.retry ? ['score'] : ['score','reject'];
      if (stage === 'retained' && state.retry) { chain = []; staticLabel = 'Retry exhausted · parent retained'; }
      zoomed = narrow.matches && !!base;
      runSequence = true;
      sequence.replaceChildren();
      chain.forEach((id,i) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = edges[id][0];
        button.title = edges[id][1];
        button.addEventListener('click',() => { onManual(); component=null; runSequence=false; setLeg(i); });
        sequence.append(button);
      });
      sequence.hidden = chain.length < 2;
      replay.hidden = !chain.length || reduced.matches;
      setLeg(0);
    }
    regions.forEach(region => {
      const [name, id, x, y, w, h] = region;
      const button = document.createElement('button');
      button.type='button'; button.className='fm-spot'; button.dataset.stage=id;
      button.id='method-'+name.toLowerCase().replaceAll(' ','-');
      button.setAttribute('aria-label',name); button.setAttribute('aria-controls','fw-title'); button.title=name;
      Object.assign(button.style,{left:x/width*100+'%',top:y/height*100+'%',width:w/width*100+'%',height:h/height*100+'%'});
      button.addEventListener('click',() => {
        onSelect(id);
        component=region;
        const relevant = chain.findIndex(edge => edges[edge][2]===name);
        runSequence=false;
        setLeg(Math.max(0,relevant));
      });
      spots.append(button);
    });
    replay.addEventListener('click',replaySequence);
    focusButton.addEventListener('click',() => { zoomed=!zoomed; viewport(); });
    narrow.addEventListener('change',() => { zoomed=narrow.matches && !!base; viewport(); });
    reduced.addEventListener('change',() => { replay.hidden=!chain.length || reduced.matches; animate(); });
    new IntersectionObserver(([entry]) => { visible=entry.isIntersecting; animate(); }).observe(map);
    document.addEventListener('visibilitychange',animate);
    return {update,connectionCount:() => chain.length,duration:() => chain.length * 1930,setPlayback(mode) {
      if (mode===playback) return;
      playback=mode;
      if (mode==='auto') runSequence=true;
      animate();
    }};
  }
  window.EvoViMFrameworkMap = {mount};
})();
