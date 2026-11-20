(() => {
  'use strict';
  const root = document.getElementById('framework-loops');
  const figure = window.EvoViMFrameworkMap;
  const evidence = window.EvoViMFrameworkEvidence;
  if (!root || !figure || !evidence) return;

  const blue = '#184878', green = '#256d69', orange = '#a3473e', plum = '#76549d';
  const story = [
    {id:'intro', name:'Overview', color:blue,
      title:'A walk raises a question.', text:'In MC Gallery, a painting reappears at the exit. Follow the agent’s answer, then see how the program learned to find the painting in its saved views.',
      next:'Follow task execution', caseStep:0},
    {id:'execution', name:'Task execution', color:blue, parts:['execution','environment','record','act'], pose:'photographer',
      title:'Walk through door seven.', text:'The goal during the walk is to reach the gold wall. Each move reveals a view the agent can record before choosing what to do next.',
      next:'Inspect frame memory', caseStep:0},
    {id:'record', name:'Frame memory', color:green, parts:['record','memory','frames'],
      title:'Save the view before moving on.', text:'A call to save_view files the original doorway image under door 7. It remains available when the first question appears six steps later.',
      next:'Compare the query image', caseStep:3},
    {id:'pixels', name:'Pixel computation', color:green, parts:['pixels'],
      title:'Where did this painting hang?', text:'The matcher searches the saved views. The patch with the highest similarity falls to the left of door 7.',
      next:'See the next prompt', caseStep:3},
    {id:'recall', name:'Visual recall and Act', color:green, parts:['recall','prompt','act'],
      title:'Look at the retrieved paintings.', text:'The tool sends the query and its strongest matches back as pixels. The model reads the result and submits its answer.',
      next:'Open development episodes', caseStep:5},
    {id:'development', name:'Development episodes', color:orange, parts:['development'],
      title:'Look back at the missed painting.', text:'In a development episode, the program with basic image tools answered “not seen” for every painting. The recorded frames let the model revisit the doorway and the later question.',
      next:'Read enhanced feedback', caseStep:1},
    {id:'feedback', name:'Enhanced feedback', color:orange, parts:['development','feedback'],
      title:'Compare a prediction with the replay.', text:'Before trying whole-doorway storage, the model predicted how much it would help. The next report compares that forecast with measurements from the two development episodes.',
      next:'Inspect revision experience', caseStep:1},
    {id:'experience', name:'Revision experience', color:plum, parts:['revision','experience'],
      title:'A failed experiment guides the next edit.', text:'In DMV-Hard, Claude Haiku 5.5 recorded two unsuccessful matcher edits in its playbook. A later revision showed the query and candidate patches side by side at the same scale.',
      next:'Follow the revision', caseStep:4},
    {id:'revision', name:'Revision', color:orange, parts:['evolution','revision','development','feedback','experience'], pose:'detective',
      title:'Find what the notes left out.', text:'Back in MC Gallery, the model traced a wrong answer to its notebook. It had described the wall but never linked the painting to its door and side.',
      next:'Inspect the candidate', caseStep:2},
    {id:'candidate', name:'Candidate program', color:green, parts:['candidate'], pose:'mechanic',
      title:'Give each saved crop an address.', text:'The revised program adds a tool to save painting regions under a door and side, so a later visual match can return a location.',
      next:'Run code checks', caseStep:2},
    {id:'checks', name:'Code checks', color:orange, parts:['checks','candidate','memory'],
      title:'Try the revised code on a replay.', text:'Offline checks exercised the crop tools and verified that saved state could be restored. The candidate then ran on the same two development episodes as its parent.',
      next:'Apply the gate', caseStep:2},
    {id:'gate', name:'Gate', color:orange, parts:['gate','lineage'],
      title:'Which edit goes forward?', text:'The gate compares development scores, then efficiency if scores tie. Inspect two decisions from this gallery lineage.',
      next:'Follow the program lineage', caseStep:4},
    {id:'lineage', name:'Program lineage', color:orange, parts:['lineage','revision','experience'],
      title:'A wider view finds the missing door.', text:'The crop program still missed some paintings. Its successor kept whole doorway views and searched for the painting inside them.',
      next:'Evaluate on new episodes', caseStep:3},
    {id:'heldout', name:'Held-out evaluation', color:blue, pose:'presenter',
      title:'Take the tool into ten new galleries.', text:'Claude Haiku 5.5 used the selected MC Gallery program on ten held-out episodes. Each started with empty memory and ended with eight questions.',
      next:'Back to the overview', caseStep:5}
  ];
  const indexOf = id => story.findIndex(step => step.id === id);
  const initial = () => ({index:0, retry:false, verdict:'accept'});
  let state = initial(), playing = false, visible = false, timer = 0;
  const history = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const originalFigure = document.getElementById('framework-open');

  root.innerHTML = '<div class="fw-toolbar"><label class="fw-picker"><span>Explore the framework</span><select aria-label="Choose a framework component"></select></label>' +
    '<div class="fw-nav"><button type="button" class="fw-back" aria-label="Previous step">Back</button><button type="button" class="fw-auto" aria-pressed="false"><span aria-hidden="true">▷</span><span class="fw-auto-label">Auto-play</span></button><button type="button" class="fw-next"></button></div></div>' +
    '<div class="fw-spread"><div class="fw-map"></div><section class="fw-inspect" aria-labelledby="fw-title">' +
    '<div class="fw-heading"><h3 id="fw-title"></h3><picture class="fw-guide" hidden><source><img alt="" width="70" height="72"></picture></div><p class="fw-explain"></p>' +
    '<div class="fw-verdicts" role="group" aria-label="Gallery gate decisions" hidden><button type="button" data-verdict="accept">Accepted edit</button><button type="button" data-verdict="reject">Rejected edit</button></div>' +
    '<div class="fw-evidence"></div></section></div>' +
    '<div class="fw-footer"><a class="fw-case" href="#gallery-lineage" data-gallery-step="0">Follow the gallery revision history</a></div><span class="fw-sr" role="status"></span>';

  const find = s => root.querySelector(s);
  find('.fw-footer').prepend(originalFigure);
  const picker = find('.fw-picker select');
  for (const [index, step] of story.entries()) picker.add(new Option((index + 1) + '. ' + step.name, step.id));
  const next = find('.fw-next'), back = find('.fw-back'), auto = find('.fw-auto');
  const gate = find('.fw-verdicts'), guide = find('.fw-guide');
  const map = figure.mount(find('.fw-map'), id => jump(id));

  function jump(id) {
    const index = indexOf(id);
    if (index >= 0 && state.index !== index) navigate({...initial(), index});
  }
  function schedule() {
    clearTimeout(timer);
    if (playing && visible && !document.hidden) timer = setTimeout(() => advance(false),8500);
  }
  function updateGuide() {
    const pose = story[state.index].pose;
    guide.hidden = !pose;
    if (!pose) return;
    const path = 'media/mascot-scenes/'+pose;
    guide.querySelector('img').src = path+'.webp';
    guide.querySelector('source').srcset = path+(visible && !document.hidden && !reduced.matches ? '-motion.webp' : '.webp');
  }
  function transport() {
    back.disabled = !history.length;
    auto.setAttribute('aria-pressed',String(playing));
    auto.setAttribute('aria-label',playing ? 'Pause walkthrough' : 'Play walkthrough automatically');
    auto.firstElementChild.textContent = playing ? 'Ⅱ' : '▷';
    auto.lastElementChild.textContent = playing ? 'Pause' : 'Auto-play';
    const step = story[state.index];
    next.textContent = step.id === 'gate' && state.verdict === 'reject' && !state.retry ? 'Follow the retry' : step.next;
    schedule();
  }
  const retryText = {
    revision:'After rejection, the model gets one retry from the same parent. The rejected code, cost measurements, playbook, notes and scripts guide the next revision.',
    candidate:'In this gallery retry the model keeps whole-view search but shortens the logging instructions to reduce the extra model requests.',
    checks:'The retry passes code checks and runs on the same two development seeds. It answers 13 of 16 questions. The whole-view parent answered all 16.',
    gate:'The retry scored lower on the same development seeds. The whole-view parent stayed in place.',
    lineage:'The whole-view program remains the parent. The retry and the first rejected edit both leave revision records for later diagnosis.'
  };

  function render(announce = true) {
    const step = story[state.index];
    const rejected = step.id === 'gate' && state.verdict === 'reject' && !state.retry;
    root.dataset.stage = step.id;
    root.style.setProperty('--fw-active',step.color);
    picker.value = step.id;
    find('#fw-title').textContent = step.title;
    find('.fw-explain').textContent = rejected ? 'A later gallery edit ties the whole-view parent at 16 of 16, but takes more steps and tokens. The gate retains the parent. Follow the retry to see what the model changes next.' : state.retry && retryText[step.id] ? retryText[step.id] : step.text;
    gate.hidden = step.id !== 'gate' || state.retry;
    for (const button of gate.children) button.setAttribute('aria-pressed',String(button.dataset.verdict === state.verdict));
    evidence.render(find('.fw-evidence'),step.id,state);
    find('.fw-case').dataset.galleryStep = String(state.retry && step.id !== 'heldout' ? 4 : step.caseStep);
    map.update(step,state.verdict === 'reject');
    updateGuide();
    transport();
    if (announce) find('.fw-sr').textContent = step.name+'. '+step.title;
  }
  function navigate(newState, manual = true) {
    if (manual) playing = false;
    history.push({...state});
    state = newState;

    if (story[state.index].id === 'heldout') playing = false;
    render();
  }
  function advance(manual = true) {
    const id = story[state.index].id;
    if (id === 'heldout') {
      history.length = 0;
      state = initial();
      playing = false;

      render();
    } else if (id === 'gate' && state.verdict === 'reject' && !state.retry) {
      navigate({index:indexOf('revision'),retry:true,verdict:'reject'},manual);
    } else {
      navigate({...state,index:state.index+1},manual);
    }
  }
  picker.addEventListener('change',() => jump(picker.value));
  next.addEventListener('click',() => advance());
  back.addEventListener('click',() => {
    if (!history.length) return;
    playing = false;
    state = history.pop();

    render();
  });
  auto.addEventListener('click',() => {
    if (playing) { playing = false; transport(); return; }
    if (state.index === story.length-1) { state = initial(); history.length = 0; }
    playing = true;
    if (!state.index) advance(false);
    else transport();
  });
  gate.addEventListener('click',event => {
    const button = event.target.closest('[data-verdict]');
    if (!button) return;
    playing = false;
    state = {...state, verdict:button.dataset.verdict};
    render();
  });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updateGuide(); schedule(); }).observe(find('.fw-spread'));
  document.addEventListener('visibilitychange',() => { updateGuide(); schedule(); });
  reduced.addEventListener('change',() => { playing = false; render(false); });
  function followFigureLink() {
    const hotspot = document.getElementById(location.hash.slice(1));
    if (!hotspot?.matches('.fm-spot[data-stage]')) return;
    jump(hotspot.dataset.stage);
    root.scrollIntoView({block:'start', behavior:'instant'});
  }
  window.addEventListener('hashchange',followFigureLink);
  render(false);
  if (location.hash.startsWith('#method-')) requestAnimationFrame(followFigureLink);
})();
