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
    {name:'Development walks', start:'execution', color:blue},
    {name:'Revision', start:'feedback', color:plum},
    {name:'Candidate selection', start:'checks', color:orange},
    {name:'Held-out evaluation', start:'record', color:green}
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
  const map = figure.mount(find('.fw-map'), id => jump(id), () => { playing=false; transport(); });

  function jump(id) {
    const index = indexOf(id);
    if (index >= 0 && state.index !== index) navigate({...initial(), index});
    else if (playing) { playing = false; transport(); }
  }
  function schedule() {
    clearTimeout(timer);
    if (playing && visible && !document.hidden) timer = setTimeout(() => advance(false),Math.max(7800,map.duration()+950));
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
    next.textContent = step.id === 'gate' && state.verdict === 'reject'
      ? (state.retry ? 'Keep the parent' : 'Follow the retry') : step.next;
    schedule();
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
    const retryTitles = {revision:'Retry from the same parent.', candidate:'Shorten the logging instructions.', evaluation:'Score the retry on the same walks.'};
    find('#fw-title').textContent = state.retry && retryTitles[step.id] || step.title;
    find('.fw-explain').textContent = rejected ? 'A later gallery edit ties the whole-view parent at 16 of 16, but takes more steps and tokens. The gate retains the parent. Follow the retry to see what the model changes next.' : state.retry && retryText[step.id] ? retryText[step.id] : step.text;
    gate.hidden = step.id !== 'gate' || state.retry;
    for (const button of gate.children) button.setAttribute('aria-pressed',String(button.dataset.verdict === state.verdict));
    evidence.render(find('.fw-evidence'),step.id,state);
    find('.fw-case').hidden = step.id === 'experience';
    find('.fw-case').dataset.galleryStep = String(state.retry || rejected ? 4 : step.caseStep);
    map.update(step,state);
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
