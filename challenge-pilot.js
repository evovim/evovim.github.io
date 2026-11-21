(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const gallery = 'media/episodes/';
  const art = 'media/mascot-scenes/';

  const image = (src, description = '') => `<img src="${src}" alt="${description}" decoding="async" draggable="false">`;
  const query = () => image(gallery + 'gallery-query.webp', 'The rotated, darker query painting with blue and green squares.');
  const frame = () => image(gallery + 'gallery-door7.webp', 'Original observation showing two teal paintings on either side of door 7.');

  const pilots = [
    {
      title: 'Why did AutoMem choose the side table?',
      duration: 18000, scoreContext: 'Claude Haiku 5.5 on DMV-Hard',
      numbers: [['100','134','photo-detail queries answered correctly'],['1','106','pattern queries answered correctly']],
      pose: 'archivist', speech: 'I left the spot positions out of my search. It matched 40 pages. I chose the side table, ranked second. The vase was missing from the eight results I saw.', next: 'See the visual matcher'
    },
    {
      title: 'The matcher found the painting. Which door was it at?',
      numbers: [['56','60','seen paintings in the top match'],['0','60','seen paintings located correctly']],
      pose: 'detective', speech: 'In MC Gallery, the archive kept every frame. The matcher gave Claude Haiku 5.5 pixel coordinates. The question asked for the door number and side.', next: 'See the one-shot program',
      visual: () => `<div class="ep-search"><div class="ep-search-image">${frame()}<i aria-hidden="true"></i></div><div class="ep-search-output"><span>Matcher output</span><b>Frame + bounding box</b><small>Door <em>?</em> &nbsp; Side <em>?</em></small></div></div>`
    },
    {
      title: 'Door order could not locate a painting.',
      numbers: [['0','60','seen paintings located correctly'],['11','20','unseen paintings correctly rejected']],
      pose: 'mechanic', speech: 'Claude Haiku 5.5 wrote its MC Gallery program from the opening instruction. Across ten walks it saved just one frame.', next: 'Return to text memory',
      visual: () => `<div class="ep-route"><div class="ep-route-label">Opening instruction</div><strong>Reach the gold wall</strong>
        <div class="ep-ledger"><small>Door order</small><div>${[1,2,3,'…',8].map((n,i)=>`<b style="--i:${i}">${n}</b>`).join('')}</div></div>
        <div class="ep-late-query">${query()}<b>Which door and side?</b></div></div>`
    }
  ];

  function mount(id, steps, context, delay) {
    const root = document.getElementById(id);
    if (!root) return;
    const table = root.querySelector('.ep-comparison');
    const notebook = root.querySelector('.ep-notes');
    const modelSelector = document.createElement('select');
    modelSelector.setAttribute('aria-label','Model for pilot accuracy');
    modelSelector.innerHTML = '<option value="claude">Claude Haiku 5.5</option><option value="qwen">Qwen3.8-27B</option>';
    table.querySelector('.ep-model-name').replaceWith(modelSelector);
    const measurements = [...table.tBodies[0].rows].flatMap(row => {
      const qwen = row.dataset.qwen.split(' ');
      return [...row.cells].slice(1).map((cell,i) => {
        const claude = cell.textContent;
        cell.innerHTML = `<span class="ep-score" role="img" aria-label="${claude}%"><i aria-hidden="true" style="--score:${claude}%"></i><b aria-hidden="true">${claude}</b></span>`;
        return {bar:cell.querySelector('i'), value:cell.querySelector('b'), claude, qwen:qwen[i]};
      });
    });
    let tableSeen = false;
    function drawTable(enter = false) {
      for (const measurement of measurements) {
        const target = Number(measurement[modelSelector.value]);
        const label = measurement.value;
        label.parentElement.setAttribute('aria-label', target.toFixed(1) + '%');
        measurement.bar.style.setProperty('--score', target + '%');
        window.EvoViMNumbers.to(label, target, {
          from: enter ? 0 : Number(label.textContent), digits: 1, duration: 820, instant: !tableSeen
        });
      }
    }
    const rows = [...table.querySelectorAll('tr[data-pilot]')];
    const buttons = rows.map((row,i) => {
      const heading = row.cells[0];
      const button = document.createElement('button');
      button.type = 'button';
      const label = document.createElement('span');
      label.append(...heading.childNodes);
      button.append(label);
      button.dataset.epIndex = String(i);
      button.setAttribute('aria-controls', id + '-stage');
      heading.replaceChildren(button);
      return button;
    });
    root.insertAdjacentHTML('beforeend', `<div class="ep-stage" id="${id}-stage">
        <div class="ep-picture"></div>
        <div class="ep-narration">
          <h3></h3>
          <div class="ep-metrics"><p class="ep-score-context" hidden></p><div class="ep-counts"></div></div>
          <div class="ep-guide"><img alt="" width="112" height="112"><p></p></div>
        </div>
      </div>
      <div class="ep-playbar">
        <div class="ep-controls"><button class="ep-play" type="button"></button><button class="ep-next" type="button"></button></div>
      </div><p class="ep-sr" role="status"></p>`);
    const picture = root.querySelector('.ep-picture');
    const title = root.querySelector('.ep-narration h3');
    const next = root.querySelector('.ep-next');
    const toggle = root.querySelector('.ep-play');
    const guide = root.querySelector('.ep-guide');
    const status = root.querySelector('[role=status]');
    const metrics = root.querySelector('.ep-metrics');
    const scoreContext = metrics.querySelector('.ep-score-context');
    const counts = metrics.querySelector('.ep-counts');
    let countsVisible = false;
    let countsPlayed = false;
    function animateCounts() {
      if (!countsVisible || countsPlayed) return;
      countsPlayed = true;
      counts.querySelectorAll('[data-total]').forEach(node => {
        window.EvoViMNumbers.to(node, Number(node.dataset.total), {from:0, duration:760});
      });
    }
    let index = 0;
    let run = !motion.matches;
    let visible = false;
    let timer;
    let elapsed = 0;
    let started = 0;

    function sync() {
      if (timer !== undefined) {
        clearTimeout(timer);
        elapsed += performance.now() - started;
        timer = undefined;
      }
      const playing = run && visible && !document.hidden;
      root.classList.toggle('ep-playing', playing);
      toggle.innerHTML = run ? '<span aria-hidden="true">Ⅱ</span> Pause' : '<span aria-hidden="true">▶</span> Play';
      toggle.setAttribute('aria-label', (run ? 'Pause ' : 'Play ') + context.toLowerCase());
      const guideImage = guide.querySelector('img');
      const pose = art + steps[index].pose + (playing && !motion.matches ? '-motion' : '') + '.webp';
      if (guideImage.getAttribute('src') !== pose) guideImage.src = pose;
      if (playing) {
        started = performance.now();
        timer = setTimeout(() => {
          timer = undefined;
          select((index + 1) % steps.length);
        }, Math.max(0, (steps[index].duration ?? delay) - elapsed));
      }
    }

    function select(newIndex, manual = false) {
      clearTimeout(timer);
      timer = undefined;
      elapsed = 0;
      index = newIndex;
      if (manual) run = false;
      root.classList.toggle('ep-prompted',manual);
      const step = steps[index];
      buttons.forEach((button,i) => {
        button.setAttribute('aria-pressed',String(index === i));
        rows[i].classList.toggle('ep-selected',index === i);
      });
      root.dataset.beat = String(index + 1);
      if (step.visual) picture.innerHTML = step.visual();
      else picture.replaceChildren(notebook);
      if (index === 0) guide.after(metrics);
      else guide.before(metrics);
      scoreContext.textContent = step.scoreContext ?? '';
      scoreContext.hidden = !step.scoreContext;
      title.textContent = step.title;
      countsPlayed = false;
      counts.hidden = !step.numbers;
      if (step.numbers) counts.innerHTML = step.numbers.map(([value, all, label]) =>
        `<div><strong role="img" aria-label="${value} out of ${all}"><b data-total="${value}" aria-hidden="true">${value}</b><small aria-hidden="true"> / ${all}</small></strong><span>${label}</span></div>`).join('');
      animateCounts();
      guide.querySelector('p').textContent = step.speech;
      next.innerHTML = `<span>${step.next}</span> <i aria-hidden="true">${index === steps.length - 1 ? '↺' : '→'}</i>`;
      if (visible && !motion.matches) {
        root.querySelector('.ep-narration').animate([{opacity: .45, transform: 'translateY(5px)'},{opacity:1,transform:'none'}],{duration:250});
      }
      if (manual) status.textContent = step.title + ' ' + step.speech;
      sync();
    }
    rows.forEach((row,i) => row.addEventListener('click',() => select(i,true)));
    modelSelector.addEventListener('change',() => {
      drawTable();
      status.textContent = 'Showing scores for ' + modelSelector.selectedOptions[0].text + '. Examples use Claude Haiku 5.5.';
    });
    next.addEventListener('click', () => select((index + 1) % steps.length,true));
    toggle.addEventListener('click', () => {run = !run; sync();});
    document.addEventListener('visibilitychange',sync);
    motion.addEventListener('change', () => {if (motion.matches) run = false; sync();});
    select(0);
    table.classList.add('ep-awaiting');
    new IntersectionObserver(([entry]) => {
      countsVisible = entry.isIntersecting;
      animateCounts();
    }, {threshold:.2}).observe(counts);
    const revealScores = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        tableSeen = true;
        table.classList.remove('ep-awaiting');
        drawTable(true);
        revealScores.disconnect();
      }
    }, {threshold:.15});
    revealScores.observe(table);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    },{rootMargin:'-10% 0px -10%',threshold:0}).observe(picture);
  }

  mount('pilot-story',pilots,'Pilot studies',11000);
})();
