(() => {
  'use strict';
  const root = document.getElementById('framework-loops');
  const figure = window.EvoViMFrameworkMap;
  const evidence = window.EvoViMFrameworkEvidence;
  if (!root || !figure || !evidence) return;

  const blue = '#184878', green = '#256d69', orange = '#a3473e', plum = '#76549d';
  const story = [
    {id:'intro', name:'Overview', color:blue,
      title:'How did a gallery agent learn where paintings hang?', text:'Its starting program could save frames but had no pixel matcher. Two development walks exposed a missing link between each painting and its location.',
      next:'Run the starting program', caseStep:0},
    {id:'execution', name:'Task execution', color:blue, pose:'photographer',
      title:'Act first. Record what happens next.', text:'Each walk starts with empty memory. At the first step the model chooses an action. Once the environment responds, Record can write the new observation. Act reads memory to choose the next move.',
      next:'Inspect the two walks', caseStep:0},
    {id:'development', name:'Development episodes', color:blue,
      title:'Trace a missed painting back to door 4.', text:'On one development walk, the agent called all eight paintings unseen, including six it had passed. The model can revisit the frames, actions, memory snapshots and tool results from both walks.',
      next:'Read the feedback', caseStep:1},
    {id:'feedback', name:'Enhanced feedback', color:orange,
      title:'Where did the program lose the evidence?', text:'Episode digests and tool-use counts guide the diagnosis. The model predicts how an edit will affect scores and tool use. Later rounds compare the prediction with what happened on each seed.',
      next:'Consult revision experience', caseStep:1},
    {id:'experience', name:'Revision experience', color:plum,
      title:'Past edits guide the next one.', text:'Playbooks, notes and analysis scripts carry forward. In DMV-Hard, generation 3 used the playbook to skip two failed matcher changes. Claude Haiku 5.5 instead built a tool that shows the query and candidate patches at the same scale.',
      next:'Revise the gallery program', caseStep:1},
    {id:'revision', name:'Revision', color:plum, pose:'detective',
      title:'Edit the parent and its playbook.', text:'In the gallery trace, the note at door 4 described a green wall. The model proposed saving the painting with its door and side. It can also rewrite the playbook and scripts that later revisions use.',
      next:'Inspect the proposed edit', caseStep:2},
    {id:'candidate', name:'Candidate program', color:green, pose:'mechanic',
      title:'Give each crop a door and a side.', text:'The proposed program adds SAVE_REGION and changes the answering prompt to consult saved crops. The parent stays in place while the host tests the edit.',
      next:'Run code checks', caseStep:2},
    {id:'checks', name:'Code checks', color:orange,
      title:'Exercise the tools before running the model.', text:'A stub calls every registered tool on recorded observations and checks that memory can be saved and restored. Passing makes the candidate eligible for a development run. A failed check sends the code and error back for one retry.',
      next:'Run the checked candidate', caseStep:2},
    {id:'evaluation', name:'Candidate evaluation', color:orange,
      title:'Replay both development seeds.', text:'The host installs the checked candidate and starts a fresh episode on each of the parent’s two seeds. Saving labelled crops raised the number of correct answers from 4 to 13 out of 16.',
      next:'Apply the gate', caseStep:2},
    {id:'gate', name:'Gate', color:orange,
      title:'Does the candidate replace its parent?', text:'A higher mean development score wins. To win a tie, the candidate must succeed on both seeds and reduce steps or tokens without increasing the other.',
      next:'Follow the accepted program', caseStep:2},
    {id:'lineage', name:'Program lineage', color:orange,
      title:'The crop program becomes the next parent.', text:'A later revision saved whole doorways. Even without a crop from door 4, the program could now find the queried painting in the saved view. It answered all 16 development questions correctly.',
      next:'See a rejected edit', caseStep:3},
    {id:'rejection', name:'Rejected candidate', color:orange,
      title:'A tie sends the edit back for one retry.', text:'A later edit to query extraction tied the whole-view parent at 16 of 16 but used more steps and tokens. The model received the rejected code and its measurements and revised the same parent once more.',
      next:'See the retry outcome', caseStep:4},
    {id:'retained', name:'Retained parent', color:orange,
      title:'The retry scores lower. The parent stays.', text:'Shorter logging dropped the score to 13 of 16. With the single retry spent, the whole-view program survived. The playbook, scripts and records of both rejected attempts also carried forward.',
      next:'Run the selected program', caseStep:4},
    {id:'record', name:'Frame memory', color:green,
      title:'On a new walk, save the whole doorway.', text:'After the final generation, the selected program is fixed. The held-out walk starts with empty memory. At step 12, SAVE_VIEW stores the frame for door 7.',
      next:'Match the exit question', caseStep:5},
    {id:'pixels', name:'Pixel computation', color:green,
      title:'Search the saved pixels for the painting.', text:'When the exit question arrives, the matcher compares the painting against saved views at different rotations and scales. Its best match lies to the left of door 7.',
      next:'Read the matches and act', caseStep:5},
    {id:'recall', name:'Visual recall and Act', color:green,
      title:'Return the best matches to the model.', text:'Visual recall includes the query and retrieved regions in the next request. The model checks the match and submits door 7, left, through the environment’s action interface.',
      next:'See all ten held-out walks', caseStep:5},
    {id:'heldout', name:'Held-out evaluation', color:blue, pose:'presenter',
      title:'79 correct answers on 80 new questions.', text:'Across ten held-out walks, Claude Haiku 5.5 used the selected program with fixed weights and fresh episode memory. Nine walks had eight correct answers. The tenth had seven.',
      next:'Restart walkthrough', caseStep:5}
  ];
  const chapters = [
    {name:'Development walks', start:'execution'},
    {name:'Revision', start:'feedback'},
    {name:'Candidate selection', start:'checks'},
    {name:'Held-out evaluation', start:'record'}
  ];
  const indexOf = id => story.findIndex(step => step.id === id);
  const initial = () => ({index:0, retry:false, verdict:'accept'});
  let state = initial(), mode = 'manual', visible = false, timer = 0, started = 0, remaining = 0;
  const history = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const originalFigure = document.getElementById('framework-open');

  root.innerHTML = '<div class="fw-toolbar"><div class="fw-location"><button type="button" class="fw-overview"><span aria-hidden="true">←</span> Back to overview</button>' +
    '<label class="fw-picker"><select aria-label="Jump to a walkthrough step"></select></label></div>' +
    '<div class="fw-nav"><button type="button" class="fw-back" aria-label="Previous step">Previous</button><button type="button" class="fw-auto"></button><button type="button" class="fw-next" aria-controls="fw-title"></button></div>' +
    '<p class="fw-instruction" id="fw-instruction"></p></div>' +
    '<div class="fw-spread"><div class="fw-map"></div><section class="fw-inspect" aria-labelledby="fw-title">' +
    '<div class="fw-heading"><h3 id="fw-title"></h3><picture class="fw-guide" hidden><source><img alt="" width="70" height="72"></picture></div><p class="fw-explain"></p>' +
    '<div class="fw-verdicts" role="group" aria-label="Gallery gate decisions" hidden><button type="button" data-verdict="accept">Accepted edit</button><button type="button" data-verdict="reject">Rejected edit</button></div>' +
    '<div class="fw-evidence"></div></section></div>' +
    '<div class="fw-footer"><a class="fw-case" href="#gallery-lineage" data-gallery-step="0">Follow the gallery revision history</a></div><span class="fw-sr" role="status"></span>';

  const find = selector => root.querySelector(selector);
  find('.fw-footer').prepend(originalFigure);
  const picker = find('.fw-picker select');
  picker.add(new Option('Framework overview','intro'));
  let group;
  for (const [index, step] of story.entries()) {
    if (!index) continue;
    const chapter = chapters.find(part => part.start === step.id);
    if (chapter) {
      group = document.createElement('optgroup');
      group.label = chapter.name;
      picker.append(group);
    }
    group.append(new Option(index+' / '+(story.length-1)+' · '+step.name,step.id));
  }
  const next = find('.fw-next'), back = find('.fw-back'), auto = find('.fw-auto'), overview = find('.fw-overview');
  const gate = find('.fw-verdicts'), guide = find('.fw-guide'), instruction = find('.fw-instruction');
  const map = figure.mount(find('.fw-map'),jump,() => { mode='manual'; transport(); });

  function jump(id) {
    if (id === 'intro') { returnToOverview(); return; }
    const index = indexOf(id);
    if (index >= 0 && state.index !== index) navigate({...initial(),index});
    else if (mode !== 'manual') { mode = 'manual'; transport(); }
  }
  function schedule(reset=false) {
    if (timer) {
      clearTimeout(timer);
      remaining = Math.max(0,remaining-(performance.now()-started));
      timer = 0;
    }
    if (reset) remaining = Math.max(7800,map.duration()+950);
    if (mode === 'auto' && visible && !document.hidden) {
      started = performance.now();
      timer = setTimeout(() => { timer=0; advance(false); },remaining);
    }
  }
  function updateGuide() {
    const pose = story[state.index].pose;
    guide.hidden = !pose;
    if (!pose) return;
    const path = 'media/mascot-scenes/'+pose;
    guide.querySelector('img').src = path+'.webp';
    guide.querySelector('source').srcset = path+(visible && !document.hidden && !reduced.matches && mode!=='paused' ? '-motion.webp' : '.webp');
  }
  function transport(reset=false) {
    const intro = state.index === 0, end = state.index === story.length-1;
    find('.fw-location').hidden = intro;
    const nav = next.parentElement;
    if (intro !== (next.nextElementSibling === auto)) {
      const focused = document.activeElement === next;
      nav.insertBefore(next,intro ? auto : null);
      if (focused) next.focus({preventScroll:true});
    }
    back.hidden = intro || history.length === 0 || (history.length === 1 && history[0].index === 0);
    auto.hidden = end;
    auto.textContent = mode === 'auto' ? 'Pause playback' : mode === 'paused' ? 'Resume playback' : 'Play automatically';
    next.textContent = intro ? 'Start step by step →' : end ? 'Replay walkthrough' : 'Next step →';
    next.title = intro || end ? '' : story[state.index].next;
    root.dataset.playback = mode;
    instruction.hidden = intro;
    const connections = map.connectionCount();
    let hint = 'Choose Next step when you’re ready.';
    if (end) hint = 'Walkthrough complete.';
    else if (mode === 'auto') hint = 'Steps advance automatically.';
    else if (mode === 'paused') hint = 'Paused. Resume playback or choose Next step.';
    else if (reduced.matches && connections > 1) hint = 'Select a connection to inspect its arrow, or choose Next step.';
    else if (!reduced.matches && connections) hint = (connections === 1 ? 'The arrow plays' : 'Arrows play')+' automatically. Choose Next step when you’re ready.';
    instruction.textContent = hint;
    map.setPlayback(mode);
    schedule(reset);
    updateGuide();
  }
  const retryText = {
    revision:'After rejection, the model gets one retry from the same parent. The rejected code, cost measurements, playbook, notes and scripts guide the next revision.',
    candidate:'In this gallery retry the model keeps whole-view search but shortens the logging instructions to reduce the extra model requests.',
    checks:'The host checks the retry on recorded observations before using it in another development run.',
    evaluation:'The checked retry answers 13 of 16 questions on the two development walks. Its whole-view parent answered all 16.',
    gate:'The retry scored lower on the same development seeds. The whole-view parent stayed in place.',
    lineage:'The whole-view program remains the parent. The retry and the first rejected edit both leave revision records for later diagnosis.'
  };

  function render(announce = true) {
    const step = story[state.index];
    const rejected = step.id === 'gate' && state.verdict === 'reject' && !state.retry;
    root.dataset.stage = step.id;
    root.style.setProperty('--fw-active',step.color);
    const intro = state.index === 0;
    find('.fw-inspect').hidden = intro;
    find('.fw-map .paper-map-actions').hidden = intro;
    picker.value = step.id;
    const retryTitles = {revision:'Retry from the same parent.', candidate:'Shorten the logging instructions.', evaluation:'Score the retry on the same walks.'};
    find('#fw-title').textContent = state.retry && retryTitles[step.id] || step.title;
    find('.fw-explain').textContent = rejected ? 'A later gallery edit ties the whole-view parent at 16 of 16, but takes more steps and tokens. The gate retains the parent. Follow the retry to see what the model changes next.' : state.retry && retryText[step.id] ? retryText[step.id] : step.text;
    gate.hidden = step.id !== 'gate' || state.retry;
    for (const button of gate.children) button.setAttribute('aria-pressed',String(button.dataset.verdict === state.verdict));
    if (intro) find('.fw-evidence').replaceChildren();
    else evidence.render(find('.fw-evidence'),step.id,state);
    find('.fw-case').hidden = intro || step.id === 'experience';
    find('.fw-case').dataset.galleryStep = String(state.retry || rejected ? 4 : step.caseStep);
    map.update(step,state);
    transport(true);
    if (announce) find('.fw-sr').textContent = intro ? 'Framework overview.' : 'Step '+state.index+' of '+(story.length-1)+'. '+step.name+'. '+step.title;
  }
  function returnToOverview() {
    mode = 'manual';
    history.length = 0;
    state = initial();
    if (location.hash.startsWith('#method-')) window.history.replaceState(window.history.state,'','#method');
    render();
    next.focus({preventScroll:true});
    root.scrollIntoView({block:'start',behavior:'instant'});
  }
  function navigate(newState, manual=true) {
    if (manual) mode='manual';
    history.push({...state});
    state = newState;
    if (story[state.index].id === 'heldout') mode='manual';
    render();
  }
  function advance(manual=true) {
    const id = story[state.index].id;
    if (id === 'heldout') {
      history.length = 0;
      state = initial();
      navigate({...initial(),index:1});
    } else if (id === 'gate' && state.verdict === 'reject' && !state.retry) {
      navigate({index:indexOf('revision'),retry:true,verdict:'reject'},manual);
    } else if (id === 'gate' && state.retry) {
      navigate({...state,index:indexOf('retained')},manual);
    } else if (id === 'retained') {
      navigate({...initial(),index:indexOf('record')},manual);
    } else {
      navigate({...state,index:state.index+1},manual);
    }
  }
  picker.addEventListener('change',() => jump(picker.value));
  next.addEventListener('click',() => advance());
  overview.addEventListener('click',returnToOverview);
  root.addEventListener('keydown',event => {
    if (event.key === 'Escape' && state.index && event.target !== picker) {
      event.preventDefault();
      returnToOverview();
    }
  });
  back.addEventListener('click',() => {
    if (!history.length) return;
    mode='manual';
    state=history.pop();
    render();
    if (back.hidden) next.focus({preventScroll:true});
  });
  auto.addEventListener('click',() => {
    mode = mode === 'auto' ? 'paused' : 'auto';
    if (!state.index) advance(false);
    else transport();
  });
  gate.addEventListener('click',event => {
    const button = event.target.closest('[data-verdict]');
    if (!button) return;
    mode='manual';
    state = {...state, verdict:button.dataset.verdict};
    render();
  });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updateGuide(); schedule(); }).observe(find('.fw-spread'));
  document.addEventListener('visibilitychange',() => { updateGuide(); schedule(); });
  reduced.addEventListener('change',() => { mode='manual'; render(false); });
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
