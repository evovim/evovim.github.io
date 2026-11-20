(() => {
  const host = document.getElementById('gallery-memory');
  if (!host) return;

  // Held-out seed 43. Steps were verified against the saved-view manifest and frame pixels.
  const views = [
    ['view_0001', 0], ['view_0002', 1], ['view_0003', 2], ['view_0004', 3],
    ['view_0005', 4], ['view_0006', 5], ['view_0007', 6], ['view_0008', 7],
    ['view_0009', 9], ['view_0010', 10], ['view_0011', 12], ['view_0012', 13],
    ['view_0013', 14], ['view_0014', 16],
  ];
  // MATCH_QUERY_IMAGE returned these scores and requested these crops of the 1280 × 720 frames.
  const matches = {
    view_0011: {rank: 1, score: '0.791', box: [479, 285, 625, 431]},
    view_0012: {rank: 2, score: '0.754', box: [318, 208, 614, 504]},
  };
  const imagePath = id => `media/gallery-memory/${id}.webp`;
  host.innerHTML = `<details><summary>Inspect the 14 saved views</summary>
    <div class="gm-inspector">
      <div class="gm-choices" role="group" aria-label="Saved gallery views"></div>
      <figure class="gm-viewer"><div class="gm-frame"><img width="560" height="315" alt=""><i hidden aria-hidden="true"></i></div>
        <figcaption aria-live="polite"><strong></strong><span></span></figcaption></figure>
    </div></details>`;
  const details = host.querySelector('details');
  const choices = host.querySelector('.gm-choices');
  const image = host.querySelector('.gm-frame img');
  const box = host.querySelector('.gm-frame i');

  function selectView(id, step) {
    const match = matches[id];
    image.src = imagePath(id);
    image.alt = match ? `Doorway view at step ${step}. The matcher selected a patch on the left of door 7.` : `The saved gallery view at step ${step}.`;
    for (const button of choices.children) button.setAttribute('aria-pressed', String(button.dataset.id === id));
    box.hidden = !match;
    if (match) {
      const [left, top, right, bottom] = match.box;
      Object.assign(box.style, {left: `${left / 1280 * 100}%`, top: `${top / 720 * 100}%`,
        width: `${(right - left) / 1280 * 100}%`, height: `${(bottom - top) / 720 * 100}%`});
    }
    host.querySelector('figcaption strong').textContent = 'View ' + Number(id.slice(-4));
    host.querySelector('figcaption span').textContent = match
      ? `Match rank ${match.rank}, similarity ${match.score}.`
      : 'Outside the top two matches.';
  }

  // Loading the inspection images is optional, even when the answer panel is open.
  details.addEventListener('toggle', () => {
    if (!details.open || choices.childElementCount) return;
    for (const [id, step] of views) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.id = id;
      const thumb = document.createElement('img');
      thumb.src = imagePath(id);
      thumb.alt = '';
      thumb.width = 560;
      thumb.height = 315;
      const label = document.createElement('span');
      const rank = matches[id]?.rank;
      label.textContent = id.slice(-2) + (rank ? ` · #${rank}` : '');
      button.setAttribute('aria-label', `${id}, step ${step}${rank ? ', match rank ' + rank : ''}`);
      button.append(thumb, label);
      button.addEventListener('click', () => selectView(id, step));
      choices.append(button);
    }
    const best = views.find(([id]) => matches[id]?.rank === 1);
    selectView(...best);
  });
})();
