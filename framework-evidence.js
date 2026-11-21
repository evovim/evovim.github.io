(() => {
  const visual = 'media/framework/';
  const dev = 'media/evolution/';
  const view = id => 'media/gallery-memory/view_' + id + '.webp';
  const query = 'media/evolved-tools/gallery-question.webp';
  const img = (src, alt, key = '') => '<img decoding="async" src="' + src + '" alt="' + alt + '"' + (key ? ' data-evidence-key="' + key + '"' : '') + '>';
  const photo = (src, alt, caption, key = '') => '<figure>' + img(src, alt, key) + '<figcaption>' + caption + '</figcaption></figure>';
  const door = () => img(view('0011'), 'Stored frame of the passage to doorway seven', 'frame12');
  const ask = () => img(query, 'Blue and green painting in the first exit question', 'query');
  const lead = (label, value) => '<div class="fe-entry"><span>' + label + '</span><b>' + value + '</b></div>';
  const correct = (before, after, name) => '<tr><th scope="row">' + name + '</th><td>' + before + '</td><td>' + after + '</td></tr>';

  const practiceFrame = () => img(visual+'practice-door4.webp', 'Original baseline frame at step 6 showing door 4 ahead and its two green paintings', 'practice-door4');
  const green = () => img(dev+'question.webp', 'Rotated green painting in question eight of walk 42', 'green');

  function intro() {
    return '<div class="fe-duo"><figure>' + door() + '<figcaption>Door 7 during exploration</figcaption></figure>' +
      '<figure>' + ask() + '<figcaption>Painting in the exit question</figcaption></figure></div>';
  }

  function execution() {
    return '<div class="fe-walk"><figure>' + img(view('0011'), 'Number seven above the approaching doorway', 'frame12') +
      '<figcaption>Step 12</figcaption></figure><figure>' + img(view('0012'), 'The model approaches the paintings by the same doorway') +
      '<figcaption>Step 13</figcaption></figure></div>';
  }

  function record() {
    return '<div class="fe-file"><figure><a href="' + view('0011') + '" target="_blank" rel="noopener">' + door() + '</a><figcaption>Original saved view</figcaption></figure>' +
      '<div class="fe-file-output"><code>SAVE_VIEW</code>' + lead('Door','7') + lead('Stored as','view_0011') + '</div></div>';
  }

  function pixels() {
    const ranks = [['7, left','0.791'],['1, left','0.231'],['8, left','0.230']];
    return '<div class="fe-consult"><figure>' + ask() + '<figcaption>Query</figcaption></figure>' +
      '<div class="fe-rank"><b>Best score per door and side</b>' + ranks.map(([place,score]) => '<div><span>' + place + '</span><i aria-hidden="true" style="--fe-score:' + score + '"></i><strong>' + score + '</strong></div>').join('') +
      '</div></div><figure class="fe-match-frame"><div class="fe-hit-frame">' + door() + '<i aria-hidden="true"></i></div><figcaption>Best matching region in the saved view</figcaption></figure>';
  }

  function recall() {
    return '<figure class="fe-strip"><a href="' + visual + 'recall-strip.webp" target="_blank" rel="noopener">' +
      img(visual+'recall-strip.webp','Visual input returned by MATCH_QUERY_IMAGE, with the query patch followed by three views from the gallery') +
      '</a><figcaption>Query and candidate regions returned to the model</figcaption></figure>' +
      '<div class="fe-response"><span>Action submitted</span><code>answer 7,L</code></div>';
  }

  function development() {
    return '<div class="fe-diagnosis"><a class="fe-contact" href="' + visual + 'development-walk.webp" target="_blank" rel="noopener">' +
      img(visual+'development-walk.webp','Contact sheet of the 24 frames seen on a development episode') +
      '<span>Inspect the 24 recorded frames ↗</span></a><figure>' + green() + '<figcaption>Question 8</figcaption></figure></div>';
  }

  function feedback() {
    return '<table class="fe-score-table"><caption>Change from the crop program</caption><thead><tr><th scope="col">Measure</th><th scope="col">Predicted</th><th scope="col">Measured</th></tr></thead><tbody>' +
      correct('+12.5','+18.75','Score (percentage points)') + correct('+9','+18','View saves per walk') +
      '</tbody></table><p class="fe-foot">The program answered 16 of 16 development questions correctly, up from 13.</p>';
  }

  function experience() {
    return '<table class="fe-score-table"><caption>Earlier matcher edits</caption><tbody><tr><th scope="row">Refine rotations</th><td>More false positives</td></tr><tr><th scope="row">Search more scales</th><td>Same ranking</td></tr></tbody></table>' +
      '<figure class="fe-aligned"><figcaption>Same-scale comparison on a held-out query</figcaption><div class="fe-samples">' + photo('media/evolved-tools/dmv-query.webp','Original DMV-Hard query patch','Query') +
      photo('media/evolved-tools/dmv-win1.webp','Aligned region on the correct page','Page 1') +
      photo('media/evolved-tools/dmv-win18.webp','Aligned region on another retrieved page','Page 18') +
      '</div></figure>';
  }

  function revision(retry) {
    if (retry) return '<table class="fe-score-table"><thead><tr><th scope="col">Per walk</th><th scope="col">Parent</th><th scope="col">Rejected edit</th></tr></thead><tbody>' +
      correct('24','28.5','Mean steps') + correct('266k','382k','Mean tokens') + '</tbody></table>';
    return '<div class="fe-note-pair"><figure>' + practiceFrame() + '<figcaption>Door 4 during exploration</figcaption></figure>' +
      '<div class="fe-note"><code>exploration.txt</code><q>Green mottled tile wall</q></div></div>' +
      '<div class="fe-response"><span>Answer to the later question</span><code>answer not_seen</code></div>';
  }

  function candidate(retry) {
    if (retry) return '<div class="fe-revision-pair"><div><span>Previous procedure</span><b>Save one view</b><em>Request another logging turn</em></div>' +
      '<div><span>Proposed procedure</span><b>Save one view</b><em>End logging after a successful save</em></div></div>';
    return '<div class="fe-edit"><div class="fe-crops">' + photo(dev+'crop-1R.webp','Saved painting pixels for door 1, right side','1, right','crop') +
      photo(dev+'crop-3R.webp','Saved painting pixels for door 3, right side','3, right') + '</div><div class="fe-rewrite-ops"><span>During play</span><b>Save crops with a door and side</b><code>SAVE_REGION</code><em>Prompt the model to cite a match.</em></div></div>';
  }

  function checks(retry) {
    const rows = retry ? correct('8 / 8','8 / 8','1') + correct('8 / 8','5 / 8','2')
      : correct('2 / 8','7 / 8','1') + correct('2 / 8','6 / 8','2');
    return '<div class="fe-preflight"><b>24 steps replayed</b><b>Memory state restored</b></div>' +
      '<table class="fe-score-table"><thead><tr><th scope="col">Development episode</th><th scope="col">Parent</th><th scope="col">' + (retry ? 'Retry' : 'Crop program') +
      '</th></tr></thead><tbody>' + rows + '</tbody><tfoot>' + correct(retry?'16 / 16':'4 / 16','13 / 16','Total') + '</tfoot></table>' +
      (retry ? '' : '<p class="fe-foot">On question 8 the crop program still misses. Door 4 has no saved crop. Its best score, 0.242, falls below the 0.45 cutoff.</p>');
  }

  function gate(retry, verdict) {
    const rejected = retry || verdict === 'reject';
    const parent = rejected ? 'Whole-view search' : 'Starting program';
    const candidate = retry ? 'Shorter logging phase' : rejected ? 'Reworked query extraction' : 'Labeled crop memory';
    const reason = retry || rejected ? 'Parent retained' : 'Candidate accepted';
    return '<div class="fe-choice"><div><span>Parent</span><strong>' + (rejected?'16':'4') + '<small> / 16</small></strong><b>' + parent + '</b></div>' +
      '<div><span>Candidate</span><strong>' + (retry?'13':rejected?'16':'13') + '<small> / 16</small></strong><b>' + candidate + '</b></div></div>' +
      '<div class="fe-decision">' + reason + '</div>';
  }

  function lineage() {
    const nodes = [['Basic image tools','4 / 16'],['Labeled crops','13 / 16'],['Full views','16 / 16']];
    return '<div class="fe-proof"><figure><div class="fe-hit-frame">' + img(dev+'door-four.webp','The evolved program’s saved frame with the matched pixels on the right of door 4', 'whole-view') +
      '<i aria-hidden="true"></i></div><figcaption>Saved doorway view</figcaption></figure><div class="fe-match-return">' +
      '<a class="fe-recalled-detail" href="' + visual + 'practice-recall.webp" target="_blank" rel="noopener">' + img(visual+'practice-recall.webp','Actual tile returned to the model. Its left two panels show the green query and top match from door 4, right.') +
      '</a><span>Query and top match</span><b>Door 4, right</b><code>Score 0.834</code></div></div>' +
      '<div class="fe-lineage" aria-label="Correct answers across the same two development seeds">' + nodes.map(([name,score]) => '<div><b>' + name + '</b><strong>' + score + '</strong></div>').join('') + '</div>';
  }

  function heldout() {
    const seeds = [43,44,45,47,48,49,52,53,54,55];
    const walks = seeds.map(seed=>'<i aria-hidden="true" style="--fe-h:' + (seed===55?'87.5%':'100%') + '"></i>').join('');
    return '<div class="fe-final"><div><span>Correct answers</span><strong>79<small> / 80</small></strong></div>' +
      '<div class="fe-walk-plot"><div class="fe-walk-bars" role="img" aria-label="Eight of eight correct in the first nine walks and seven of eight correct in the last walk.">' + walks +
      '</div><span>Correct answers per walk</span></div></div>';
  }

  const plates = {intro, execution, record, pixels, recall, development, feedback, experience, revision, candidate, checks, gate, lineage, heldout};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function sharedPositions(container) {
    const anchor = container.getBoundingClientRect();
    const positions = new Map();
    for (const el of container.querySelectorAll('[data-evidence-key]')) {
      const rect = el.getBoundingClientRect();
      if (rect.width && rect.height) positions.set(el.dataset.evidenceKey, {x: rect.left-anchor.left, y:rect.top-anchor.top, width:rect.width, height:rect.height});
    }
    return positions;
  }

  function render(container, stageId, options={}) {
    if (!container || !Object.hasOwn(plates,stageId)) return;
    const retry = options.retry === true;
    const verdict = options.verdict === 'reject' ? 'reject' : 'accept';
    const previous = reduced.matches ? new Map() : sharedPositions(container);
    container.dataset.evidenceStage = stageId;
    container.dataset.evidenceRetry = String(retry);
    container.dataset.evidenceVerdict = verdict;
    container.innerHTML = '<figure class="fe-plate">' + plates[stageId](retry, verdict) + '</figure>';
    if (!previous.size || reduced.matches) return;
    const anchor = container.getBoundingClientRect();
    for (const el of container.querySelectorAll('[data-evidence-key]')) {
      const from = previous.get(el.dataset.evidenceKey);
      const to = el.getBoundingClientRect();
      if (!from || !to.width || !to.height || typeof el.animate!=='function') continue;
      const dx=from.x-(to.left-anchor.left), dy=from.y-(to.top-anchor.top);
      const scale=Math.min(2,Math.max(.5,from.width/to.width));
      el.animate([{transformOrigin:'top left',transform:'translate('+dx+'px,'+dy+'px) scale('+scale+')',opacity:.7},
        {transformOrigin:'top left',transform:'none',opacity:1}], {duration:480,easing:'cubic-bezier(.2,.75,.25,1)'});
    }
  }

  window.EvoViMFrameworkEvidence = {render};
})();
