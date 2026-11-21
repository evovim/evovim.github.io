(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const gallery = 'media/episodes/';

  const image = (src, description = '') => `<img src="${src}" alt="${description}" decoding="async" draggable="false">`;
  const query = () => image(gallery + 'gallery-query.webp', 'The rotated, darker query painting with blue and green squares.');
  const frame = () => image(gallery + 'gallery-door7.webp', 'Original observation showing two teal paintings on either side of door 7.');

  const pilots = [
    {
      next: 'See the visual matcher'
    },
    {
      next: 'See the one-shot program',
      visual: () => `<div class="ep-search"><div class="ep-search-image">${frame()}<i aria-hidden="true"></i></div><div class="ep-search-output"><span>Matcher output</span><b>Frame + bounding box</b><small>Door <em>?</em> &nbsp; Side <em>?</em></small></div></div>`
    },
    {
      next: 'Return to text memory',
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
    const narration = root.querySelector('.ep-narration');
    const findings = [...narration.children];
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
      </div>
      <div class="ep-playbar">
        <div class="ep-controls"><button class="ep-play" type="button"></button><button class="ep-next" type="button"></button></div>
      </div><p class="ep-sr" role="status"></p>`);
    const picture = root.querySelector('.ep-picture');
    picture.after(narration);
    const next = root.querySelector('.ep-next');
    const toggle = root.querySelector('.ep-play');
    const status = root.querySelector('[role=status]');
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
      if (playing) {
        started = performance.now();
        timer = setTimeout(() => {
          timer = undefined;
          select((index + 1) % steps.length);
        }, Math.max(0, delay - elapsed));
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
      findings.forEach((finding, i) => { finding.hidden = i !== index; });
      next.innerHTML = `<span>${step.next}</span> <i aria-hidden="true">${index === steps.length - 1 ? '↺' : '→'}</i>`;
      if (visible && !motion.matches) {
        narration.animate([{opacity: .45, transform: 'translateY(5px)'},{opacity:1,transform:'none'}],{duration:250});
      }
      if (manual) status.textContent = findings[index].textContent.trim();
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
