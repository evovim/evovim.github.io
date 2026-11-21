(() => {
  'use strict';
  const root = document.getElementById('framework-loops');
  const figure = window.EvoViMFrameworkMap;
  const evidence = window.EvoViMFrameworkEvidence;
  if (!root || !figure || !evidence) return;

  const blue = '#184878', green = '#256d69', orange = '#a3473e', plum = '#76549d';
  const story = [
    {id:'intro', name:'Overview', color:blue,
      title:'Where did the agent see this painting?', text:'The painting was on the left of door 7. Follow the evolved program as it retrieves that view, then see how development walks led to the tool.',
      next:'Start the walkthrough', caseStep:0},
    {id:'execution', name:'Task execution', color:blue, parts:['execution','environment','record','act'], pose:'photographer',
      title:'Record the outcome, then choose an action.', text:'After each move, Record can store the new observation. Act consults the same episode memory before choosing the next move.',
      next:'Inspect frame memory', caseStep:0},
    {id:'record', name:'Frame memory', color:green, parts:['record','memory','frames'],
      title:'Save the doorway with its number.', text:'At step 12, save_view filed the pixels under door 7. That association survived after the agent walked on.',
      next:'Compare the query image', caseStep:3},
    {id:'pixels', name:'Pixel computation', color:green, parts:['pixels'],
      title:'Search the pixels for the queried painting.', text:'The program compares the query against its saved views at different rotations and scales. The closest patch is left of door 7.',
      next:'See the next prompt', caseStep:3},
    {id:'recall', name:'Visual recall and Act', color:green, parts:['recall','prompt','act'],
      title:'Put the best matches in the next prompt.', text:'The model sees the query next to the retrieved regions and can check the match before submitting a door and side.',
      next:'Open development episodes', caseStep:5},
    {id:'development', name:'Development episodes', color:orange, parts:['development'],
      title:'Trace a wrong answer back to the walk.', text:'On a development walk, the starting program called every painting unseen. The record includes each frame, tool result and memory snapshot, so the model can find where it lost the painting’s location.',
      next:'Read enhanced feedback', caseStep:1},
    {id:'feedback', name:'Enhanced feedback', color:orange, parts:['development','feedback'],
      title:'Did the edit work for the reason predicted?', text:'Before a replay the model predicts changes in score and tool use. The measured changes on two development episodes guide its next diagnosis.',
      next:'Inspect revision experience', caseStep:1},
    {id:'experience', name:'Revision experience', color:plum, parts:['revision','experience'],
      title:'A playbook entry changes the next edit.', text:'The model edits its playbook, notes and scripts. These survive even a rejected candidate. In generation 3 of DMV-Hard, Claude Haiku 5.5 used the playbook to skip two failed matcher changes and build a tool that shows the query and retrieved patches at the same scale.',
      next:'Follow the revision', caseStep:4},
    {id:'revision', name:'Revision', color:orange, parts:['evolution','revision','development','feedback','experience'], pose:'detective',
      title:'Find the missing link in the notes.', text:'In MC Gallery the model could see the painting in a recorded frame, but its notebook described only a green wall. It needed a lookup from painting to door and side.',
      next:'Inspect the candidate', caseStep:2},
    {id:'candidate', name:'Candidate program', color:green, parts:['candidate'], pose:'mechanic',
      title:'Change what the program records.', text:'The candidate saves a crop with its door and side. A new prompt asks the model to use a visual match when it answers.',
      next:'Run code checks', caseStep:2},
    {id:'checks', name:'Code checks', color:orange, parts:['checks','candidate','memory'],
      title:'Check the tools before scoring the edit.', text:'A stub model calls every registered tool on a recorded episode and checks that memory can be restored. A passing candidate runs on the same two development seeds as its parent.',
      next:'Apply the gate', caseStep:2},
    {id:'gate', name:'Gate', color:orange, parts:['gate','lineage'],
      title:'Which program becomes the next parent?', text:'A higher mean score wins. On a tie the candidate must succeed on both seeds and reduce steps or tokens without increasing the other.',
      next:'Follow the program lineage', caseStep:4},
    {id:'lineage', name:'Program lineage', color:orange, parts:['lineage','revision','experience'],
      title:'The next edit saves the entire doorway.', text:'The crop tool sometimes missed a painting on the walk. Saving whole views let the program search for any painting after the question arrived.',
      next:'Evaluate on new episodes', caseStep:3},
    {id:'heldout', name:'Held-out evaluation', color:blue, pose:'presenter',
      title:'Run the selected program on new episodes.', text:'The program and model weights stay fixed. Each of the ten held-out walks starts with empty memory.',
      next:'Restart walkthrough', caseStep:5}
  ];
  const chapters = [
    {name:'Task execution', start:'execution', color:blue},
    {name:'Revision', start:'development', color:plum},
    {name:'Candidate selection', start:'checks', color:orange},
    {name:'Held-out evaluation', start:'heldout', color:green}
  ];
  const indexOf = id => story.findIndex(step => step.id === id);
  const initial = () => ({index:0, retry:false, verdict:'accept'});
  let state = initial(), playing = false, visible = false, timer = 0;
  const history = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const originalFigure = document.getElementById('framework-open');

  root.innerHTML = '<nav class="fw-journey" aria-label="Walkthrough stages"></nav><div class="fw-toolbar"><label class="fw-picker"><span>Step</span><select aria-label="Choose a framework component"></select></label>' +
    '<div class="fw-nav"><button type="button" class="fw-back" aria-label="Previous step">Back</button><button type="button" class="fw-auto" aria-pressed="false"><span aria-hidden="true">▷</span><span class="fw-auto-label">Auto-play</span></button><button type="button" class="fw-next" aria-controls="fw-title"></button></div></div>' +
    '<div class="fw-spread"><div class="fw-map"></div><section class="fw-inspect" aria-labelledby="fw-title">' +
    '<div class="fw-heading"><h3 id="fw-title"></h3><picture class="fw-guide" hidden><source><img alt="" width="70" height="72"></picture></div><p class="fw-explain"></p>' +
    '<div class="fw-verdicts" role="group" aria-label="Gallery gate decisions" hidden><button type="button" data-verdict="accept">Accepted edit</button><button type="button" data-verdict="reject">Rejected edit</button></div>' +
    '<div class="fw-evidence"></div></section></div>' +
    '<div class="fw-footer"><a class="fw-case" href="#gallery-lineage" data-gallery-step="0">Follow the gallery revision history</a></div><span class="fw-sr" role="status"></span>';

  const find = s => root.querySelector(s);
  find('.fw-footer').prepend(originalFigure);
  const journey = find('.fw-journey');
  for (const chapter of chapters) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = chapter.name;
    button.style.setProperty('--chapter-accent',chapter.color);
    button.addEventListener('click',() => jump(chapter.start));
    journey.append(button);
  }
  const picker = find('.fw-picker select');
  for (const [index, step] of story.entries()) picker.add(new Option((index + 1) + ' / ' + story.length + ' · ' + step.name, step.id));
  const next = find('.fw-next'), back = find('.fw-back'), auto = find('.fw-auto');
  const gate = find('.fw-verdicts'), guide = find('.fw-guide');
  const map = figure.mount(find('.fw-map'), id => jump(id));

  function jump(id) {
    const index = indexOf(id);
    if (index >= 0 && state.index !== index) navigate({...initial(), index});
    else if (playing) { playing = false; transport(); }
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
    const active = chapters.findLastIndex(chapter => state.index >= indexOf(chapter.start));
    for (const [index,button] of [...journey.children].entries()) {
      const start = indexOf(chapters[index].start);
      const end = chapters[index+1] ? indexOf(chapters[index+1].start) : story.length;
      const progress = Math.min(1,Math.max(0,(state.index-start+1)/(end-start)));
      button.style.setProperty('--fw-progress',String(progress));
      if (index === active) button.setAttribute('aria-current','step');
      else button.removeAttribute('aria-current');
    }
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
    if (announce) find('.fw-sr').textContent = 'Step '+(state.index+1)+' of '+story.length+'. '+step.name+'. '+step.title;
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
    hotspot.click();
    root.scrollIntoView({block:'start', behavior:'instant'});
  }
  window.addEventListener('hashchange',followFigureLink);
  render(false);
  if (location.hash.startsWith('#method-')) requestAnimationFrame(followFigureLink);
})();
