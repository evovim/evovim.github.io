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
      tab: 'Evolved text memory', title: 'Two patterns fit the same words.',
      caption: 'On DMV-Hard, AutoMem’s notes often identified a product from a photo detail. The same description could fit generated patterns on several pages.',
      numbers: [['100','134','photo-detail queries answered correctly'],['1','106','pattern queries answered correctly']],
      pose: 'archivist', speech: 'A teal field with rust and blue spots… that could describe either one.', next: 'Try keeping every frame',
      visual: () => `<div class="ep-notes"><div class="ep-product-pair">
        <figure>${image(products + 'correct-vase.webp', 'Vase above a teal, blue and rust swatch.')}<figcaption>Vase</figcaption></figure>
        <figure>${image(products + 'returned-table.webp', 'Side table with a different swatch in similar colours.')}<figcaption>Table</figcaption></figure>
        </div><div class="ep-converge" aria-hidden="true"><i></i><i></i></div>
        <div class="ep-notebook"><small>Both patterns in words</small><strong>Teal, blue and rust spots</strong></div></div>`
    },
    {
      tab: 'Hand-designed visual memory', title: 'Which door was beside the match?',
      caption: 'This design saves every frame and searches for a matching patch. On DMV-Hard, finding the page gives the product ID. In MC Gallery, the match alone gives neither the door number nor the side.',
      numbers: [['56','60','seen paintings in the top match'],['0','60','seen paintings located correctly']],
      pose: 'detective', speech: 'I have a matching patch. How do I turn its position in the frame into an answer?', next: 'Try writing the program up front',
      visual: () => `<div class="ep-search"><div class="ep-search-image">${frame()}<i aria-hidden="true"></i></div><div class="ep-search-output"><span>Matcher output</span><b>Frame + bounding box</b><small>Door <em>?</em> &nbsp; Side <em>?</em></small></div></div>`
    },
    {
      tab: 'One-shot program', title: 'A list of doors leaves out the paintings.',
      caption: 'Given only the initial MC Gallery instructions, the model wrote a program to record the doors in order. At the exit, each query showed a painting and asked for its door and side.',
      numbers: [['0','60','seen paintings located correctly'],['11','20','unseen paintings correctly rejected']],
      pose: 'mechanic', speech: 'I prepared for the walk. My door list cannot tell me where this painting hung.', next: 'Replay the comparisons',
      visual: () => `<div class="ep-route"><div class="ep-route-label">Opening instruction</div><strong>Reach the gold wall</strong>
        <div class="ep-ledger"><small>Door order</small><div>${[1,2,3,'…',8].map((n,i)=>`<b style="--i:${i}">${n}</b>`).join('')}</div></div>
        <div class="ep-late-query">${query()}<b>Which door and side?</b></div></div>`
    }
  ];

  function mount(id, steps, context, delay) {
    const root = document.getElementById(id);
    if (!root) return;
    root.classList.add('ep-story');
    root.innerHTML = `<div class="ep-chapters" role="group" aria-label="${context}">
        ${steps.map((step,i) => `<button type="button" data-ep-index="${i}" aria-controls="${id}-stage"><span>${step.tab}</span></button>`).join('')}
      </div>
      <div class="ep-stage" id="${id}-stage">
        <div class="ep-picture"></div>
        <div class="ep-narration">
          <h3></h3><p class="ep-caption"></p>
          <div class="ep-counts"></div>
          <div class="ep-guide"><img alt="" width="112" height="112"><p></p></div>
        </div>
      </div>
      <div class="ep-playbar">
        <div class="ep-controls"><button class="ep-play" type="button"></button><button class="ep-next" type="button"></button></div>
      </div><p class="ep-sr" role="status"></p>`;
    const picture = root.querySelector('.ep-picture');
    const title = root.querySelector('h3');
    const caption = root.querySelector('.ep-caption');
    const next = root.querySelector('.ep-next');
    const toggle = root.querySelector('.ep-play');
    const guide = root.querySelector('.ep-guide');
    const buttons = [...root.querySelectorAll('[data-ep-index]')];
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
      buttons.forEach((button,i) => button.setAttribute('aria-pressed',String(index === i)));
      root.dataset.beat = String(index + 1);
      picture.innerHTML = step.visual();
      title.textContent = step.title;
      caption.textContent = step.caption;
      const counts = root.querySelector('.ep-counts');
      counts.hidden = !step.numbers;
      if (step.numbers) counts.innerHTML = step.numbers.map(([value, all, label]) =>
        `<div><strong>${value}<small> / ${all}</small></strong><span>${label}</span></div>`).join('');
      guide.querySelector('p').textContent = step.speech;
      next.innerHTML = `<span>${step.next}</span> <i aria-hidden="true">${index === steps.length - 1 ? '↺' : '→'}</i>`;
      if (visible && !motion.matches) {
        root.querySelector('.ep-narration').animate([{opacity: .45, transform: 'translateY(5px)'},{opacity:1,transform:'none'}],{duration:250});
      }
      if (manual) status.textContent = step.title + ' ' + step.caption;
      sync();
    }
    buttons.forEach((button,i) => button.addEventListener('click',() => select(i,true)));
    next.addEventListener('click', () => {
      select((index + 1) % steps.length,true);
      if (index === 0 && !motion.matches) {
        run = true;
        sync();
      }
    });
    toggle.addEventListener('click', () => {run = !run; sync();});
    document.addEventListener('visibilitychange',sync);
    motion.addEventListener('change', () => {if (motion.matches) run = false; sync();});
    select(0);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    },{rootMargin:'-10% 0px -10%',threshold:0}).observe(picture);
  }

  mount('pilot-story',pilots,'Pilot studies',11000);
})();
