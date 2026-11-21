(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const gallery = 'media/episodes/';
  const products = 'media/comparison/';
  const art = 'media/mascot-scenes/';

  const image = (src, description = '') => `<img src="${src}" alt="${description}" decoding="async" draggable="false">`;
  const query = () => image(gallery + 'gallery-query.webp', 'The rotated, darker query painting with blue and green squares.');
  const frame = () => image(gallery + 'gallery-door7.webp', 'Original observation showing two teal paintings on either side of door 7.');

  const pilots = [
    {
      title: 'Two different patterns fit the same description.',
      numbers: [['100','134','photo-detail queries answered correctly'],['1','106','pattern queries answered correctly']],
      pose: 'archivist', speech: 'In DMV-Hard, the crop came from the vase page. AutoMem searched its text notes and returned the table.', next: 'See the visual matcher',
      visual: () => `<div class="ep-notes">
        <figure>${image(products + 'pattern-query.webp', 'A cropped pattern with blue and rust marks on teal.')}<figcaption>Query crop</figcaption></figure>
        <figure>${image(products + 'correct-vase.webp', 'Vase above a teal, blue and rust swatch.')}<figcaption>Source page</figcaption></figure>
        <figure>${image(products + 'returned-table.webp', 'Side table with a different swatch in similar colours.')}<figcaption>Text lookup</figcaption></figure>
        </div>`
    },
    {
      title: 'The matcher found the painting. Which door was it at?',
      numbers: [['56','60','seen paintings in the top match'],['0','60','seen paintings located correctly']],
      pose: 'detective', speech: 'In MC Gallery, the archive kept every frame. The matcher returned pixel coordinates. The agent still had to read the door number and place the painting on its left or right.', next: 'See the one-shot program',
      visual: () => `<div class="ep-search"><div class="ep-search-image">${frame()}<i aria-hidden="true"></i></div><div class="ep-search-output"><span>Matcher output</span><b>Frame + bounding box</b><small>Door <em>?</em> &nbsp; Side <em>?</em></small></div></div>`
    },
    {
      title: 'Door order could not locate a painting.',
      numbers: [['0','60','seen paintings located correctly'],['11','20','unseen paintings correctly rejected']],
      pose: 'mechanic', speech: 'The model wrote its MC Gallery program from the opening instruction. Across ten walks it saved just one frame.', next: 'Return to text memory',
      visual: () => `<div class="ep-route"><div class="ep-route-label">Opening instruction</div><strong>Reach the gold wall</strong>
        <div class="ep-ledger"><small>Door order</small><div>${[1,2,3,'…',8].map((n,i)=>`<b style="--i:${i}">${n}</b>`).join('')}</div></div>
        <div class="ep-late-query">${query()}<b>Which door and side?</b></div></div>`
    }
  ];

  function mount(id, steps, context, delay) {
    const root = document.getElementById(id);
    if (!root) return;
    const table = root.querySelector('.ep-comparison');
    const rows = [...table.tBodies[0].rows];
    const buttons = rows.map((row,i) => {
      const heading = row.cells[0];
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = heading.textContent;
      button.dataset.epIndex = String(i);
      button.setAttribute('aria-controls', id + '-stage');
      heading.replaceChildren(button);
      for (const cell of [...row.cells].slice(1)) {
        const value = cell.textContent;
        cell.innerHTML = `<span class="ep-score"><i aria-hidden="true" style="--score:${Number(value)}%"></i><b>${value}</b></span>`;
      }
      return button;
    });
    root.insertAdjacentHTML('beforeend', `<div class="ep-stage" id="${id}-stage">
        <div class="ep-picture"></div>
        <div class="ep-narration">
          <h3></h3>
          <div class="ep-counts"></div>
          <div class="ep-guide"><img alt="" width="112" height="112"><p></p></div>
        </div>
      </div>
      <div class="ep-playbar">
        <div class="ep-controls"><button class="ep-play" type="button"></button><button class="ep-next" type="button"></button></div>
      </div><p class="ep-sr" role="status"></p>`);
    const picture = root.querySelector('.ep-picture');
    const title = root.querySelector('h3');
    const next = root.querySelector('.ep-next');
    const toggle = root.querySelector('.ep-play');
    const guide = root.querySelector('.ep-guide');
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
      const guideImage = guide.querySelector('img');
      const pose = art + steps[index].pose + (playing && !motion.matches ? '-motion' : '') + '.webp';
      if (guideImage.getAttribute('src') !== pose) guideImage.src = pose;
      if (playing) {
        started = performance.now();
        timer = setTimeout(() => {
          timer = undefined;
          select((index + 1) % steps.length);
        }, Math.max(0,delay - elapsed));
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
      picture.innerHTML = step.visual();
      title.textContent = step.title;
      const counts = root.querySelector('.ep-counts');
      counts.hidden = !step.numbers;
      if (step.numbers) counts.innerHTML = step.numbers.map(([value, all, label]) =>
        `<div><strong>${value}<small> / ${all}</small></strong><span>${label}</span></div>`).join('');
      guide.querySelector('p').textContent = step.speech;
      next.innerHTML = `<span>${step.next}</span> <i aria-hidden="true">${index === steps.length - 1 ? '↺' : '→'}</i>`;
      if (visible && !motion.matches) {
        root.querySelector('.ep-narration').animate([{opacity: .45, transform: 'translateY(5px)'},{opacity:1,transform:'none'}],{duration:250});
      }
      if (manual) status.textContent = step.title + ' ' + step.speech;
      sync();
    }
    rows.forEach((row,i) => row.addEventListener('click',() => select(i,true)));
    next.addEventListener('click', () => select((index + 1) % steps.length,true));
    toggle.addEventListener('click', () => {run = !run; sync();});
    document.addEventListener('visibilitychange',sync);
    motion.addEventListener('change', () => {if (motion.matches) run = false; sync();});
    select(0);
    const revealScores = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        table.classList.add('ep-shown');
        revealScores.disconnect();
      }
    });
    revealScores.observe(table);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    },{rootMargin:'-10% 0px -10%',threshold:0}).observe(picture);
  }

  mount('pilot-story',pilots,'Pilot studies',11000);
})();
