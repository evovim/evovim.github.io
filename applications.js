(() => {
  const section = document.getElementById('applications');
  if (!section) return;
  const path = 'media/field-cases/';
  const collections = {
    apollo: {
      title: 'Which lunar photograph contains this detail?',
      credit: 'Apollo 11 photographs courtesy of NASA / Johnson Space Center.',
      hints: ['The folds of a flag against black sky.', 'A row of parallel ridges in the dust.', 'A reflection in a gold visor.'],
      first: 1,
    },
    monet: {
      title: 'Which canvas contains these brushstrokes?',
      credit: 'Claude Monet, Art Institute of Chicago. Open-access reproductions via Wikimedia Commons.',
      hints: ['The small stack where sunlight meets the field.', 'The outline of a reddish stack against the sky.', 'A ridge of blue-violet paint against a distant hillside.'],
      first: 0,
    },
  };
  const records = {
    apollo: [
      {"id": "AS11-40-5874", "title": "Flag on the surface", "alt": "Aldrin stands to the right of the flag. The lunar module is at the left edge.", "image": "apollo-flag.webp", "query": "apollo-flag-crop.png", "width": 600, "height": 593, "box": [165, 150, 99], "source": "https://images.nasa.gov/details/as11-40-5874"},
      {"id": "AS11-40-5878", "title": "Bootprint in lunar soil", "alt": "A bootprint cuts diagonally across the dusty surface.", "image": "apollo-print.webp", "query": "apollo-print-crop.png", "width": 597, "height": 600, "box": [304, 319, 90], "source": "https://images.nasa.gov/details/as11-40-5878"},
      {"id": "AS11-40-5903", "title": "Aldrin near Eagle", "alt": "Aldrin faces the camera with a gold visor. His shadow crosses the foreground.", "image": "apollo-visor.webp", "query": "apollo-visor-crop.png", "width": 600, "height": 585, "box": [277, 8, 66], "source": "https://images.nasa.gov/details/as11-40-5903"},
    ],
    monet: [
      {"id": "1985.1103", "title": "End of Summer", "alt": "Two stacks sit in a sunlit field in front of scattered houses.", "image": "monet-summer.webp", "query": "monet-summer-crop.png", "width": 600, "height": 356, "box": [104, 156, 90], "source": "https://publications.artic.edu/node/135599"},
      {"id": "1933.444", "title": "End of Day, Autumn", "alt": "Two reddish stacks stand before a blue band of trees.", "image": "monet-autumn.webp", "query": "monet-autumn-crop.png", "width": 600, "height": 386, "box": [392, 104, 114], "source": "https://publications.artic.edu/node/135601"},
      {"id": "1922.431", "title": "Sunset, Snow Effect", "alt": "A large blue-violet stack and a smaller one stand below a peach sky.", "image": "monet-snow.webp", "query": "monet-snow-crop.png", "width": 600, "height": 386, "box": [204, 121, 102], "source": "https://publications.artic.edu/node/135603"},
    ],
  };

  section.innerHTML = `
    <div class="wrap app-wrap">
      <h2 id="applications-title">Where can <em>EvoViM</em> be used?</h2>
      <div class="app-switch" role="group" aria-label="Choose an application">
        <button type="button" data-key="apollo" aria-controls="archive-example" aria-pressed="true">Apollo 11 photography</button>
        <button type="button" data-key="monet" aria-controls="archive-example" aria-pressed="false">Monet’s wheat stacks</button>
        <button type="button" data-key="kitchen" aria-controls="embodied-case" aria-pressed="false">OpenEQA kitchen visit</button>
      </div>
      <div class="app-case-stage">
      <article class="archive" id="archive-example" aria-labelledby="archive-title">
        <h3 class="archive-title" id="archive-title"></h3>
        <div class="archive-interaction">
          <div class="archive-guide">
            <h4 class="archive-instruction" tabindex="-1"></h4>
            <figure class="archive-query" hidden><img alt=""></figure>
            <div class="archive-actions">
              <button data-open-query type="button" class="archive-action"></button>
              <button data-back-to-collection type="button" class="archive-action archive-back" hidden><span aria-hidden="true">←</span> <span></span></button>
            </div>
            <p class="archive-status" role="status"></p>
          </div>
          <div class="archive-records" role="group" aria-label="Three archive records"></div>
        </div>
        <footer class="archive-foot"><details><summary>Images and Python example</summary>
          <p class="archive-credit"></p>
          <a href="downloads/archive_lookup.zip" download>Download the images and lookup script ↓</a>
          <p><a href="#install">Install EvoViM</a> and unzip the example.</p><code class="archive-command"></code></details></footer>
      </article>
      <article id="embodied-case" aria-labelledby="kitchen-title" hidden></article>
      </div>
    </div>`;

  const get = selector => section.querySelector(selector);
  const listing = get('.archive-records');
  const guide = get('.archive-guide');
  const submit = get('[data-open-query]');
  const back = get('[data-back-to-collection]');
  const status = get('.archive-status');
  let collection = 'apollo';
  let sample = collections.apollo.first;
  let stage = 'browse';
  let missed = null;

  function drawRecords() {
    const active = records[collection][sample];
    listing.replaceChildren(...records[collection].map((record, index) => {
      const card = document.createElement('div');
      card.className = 'archive-record';
      const picture = document.createElement(stage === 'choose' ? 'button' : 'div');
      picture.className = 'archive-picture';
      if (stage === 'choose') {
        picture.type = 'button';
        picture.dataset.pick = index;
        picture.setAttribute('aria-label', 'Choose ' + record.title);
      }
      const image = document.createElement('img');
      Object.assign(image, {src: path + record.image, alt: record.alt, width: record.width, height: record.height, loading: 'lazy'});
      picture.append(image);
      if (stage === 'answer' && record === active) {
        card.classList.add('correct-record');
        const box = document.createElement('span');
        box.className = 'archive-match';
        const [left, top, size] = record.box;
        Object.assign(box.style, {left: left / record.width * 100 + '%', top: top / record.height * 100 + '%',
          width: size / record.width * 100 + '%', height: size / record.height * 100 + '%'});
        box.setAttribute('aria-hidden', 'true');
        picture.append(box);
      }
      const body = document.createElement('div');
      body.className = 'archive-record-label';
      const title = document.createElement('strong');
      const link = document.createElement('a');
      link.href = record.source;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = record.title;
      link.setAttribute('aria-label', 'Open the archive record for ' + record.title + ' (' + record.id + ') in a new tab');
      title.append(link);
      body.append(title);
      card.append(picture, body);
      return card;
    }));
  }

  function drawStage() {
    const item = collections[collection];
    const record = records[collection][sample];
    const copy = {
      browse: ['Explore the three images.', 'Reveal the detail →'],
      choose: ['Choose the matching image.', 'Show the match →'],
      answer: [record.title, 'Try another detail →'],
    }[stage];
    get('.archive-instruction').textContent = copy[0];
    submit.textContent = copy[1];
    back.hidden = stage === 'browse';
    get('.archive-command').textContent = 'python visual_lookup.py ' + collection + ' --sample ' + (sample + 1);
    guide.dataset.stage = stage;
    const figure = get('.archive-query');
    figure.hidden = stage === 'browse';
    if (!figure.hidden) {
      const image = figure.querySelector('img');
      image.src = path + record.query;
      image.alt = item.hints[sample];
    }
    drawRecords();
  }

  function browseCollection() {
    const item = collections[collection];
    get('.archive-title').textContent = item.title;
    get('.archive-credit').textContent = item.credit;
    back.lastElementChild.textContent = collection === 'apollo' ? 'Back to photos' : 'Back to paintings';
    status.textContent = '';
    missed = null;
    stage = 'browse';
    drawStage();
  }

  const picker = get('.app-switch');
  const choices = [...picker.querySelectorAll('button')];
  const caseStage = get('.app-case-stage');
  const archive = get('#archive-example');
  const kitchen = get('#embodied-case');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let selectedIndex = 0;
  let transitions = [];

  function placeIndicator() {
    const active = choices[selectedIndex];
    picker.style.setProperty('--tab-left', active.offsetLeft + 'px');
    picker.style.setProperty('--tab-width', active.offsetWidth + 'px');
  }

  const sizes = new ResizeObserver(placeIndicator);
  [picker, ...choices].forEach(element => sizes.observe(element));
  placeIndicator();

  function stopTransition() {
    transitions.forEach(animation => animation.cancel());
    transitions = [];
  }
  reducedMotion.addEventListener('change', stopTransition);

  function revealCase(panel, direction, previousHeight) {
    const height = panel.offsetHeight;
    const ease = 'cubic-bezier(.2,.75,.2,1)';
    if (Math.abs(height - previousHeight) > 1) {
      transitions.push(caseStage.animate([
        {height: previousHeight + 'px', overflow: 'clip'},
        {height: height + 'px', overflow: 'clip'}
      ], {duration: 420, easing: ease}));
    }
    // Sequence the actual items: archive prints or the questions in the walkthrough.
    const pieces = panel.querySelectorAll(
      '.archive-title, .archive-guide, .archive-picture, .kitchen-intro, .kitchen-questions details, #kitchen-filmbox:not([hidden])'
    );
    pieces.forEach((element, order) => {
      const print = element.matches('.archive-picture');
      const distance = direction * (print ? 32 : 20);
      const from = {opacity: 0, transform: 'translate(' + distance + 'px, ' + (print ? 14 : 5) + 'px)'};
      const to = {opacity: 1, transform: 'none'};
      if (print) {
        from.clipPath = direction > 0 ? 'inset(0 0 0 30%)' : 'inset(0 30% 0 0)';
        to.clipPath = 'inset(0 0 0 0)';
      }
      transitions.push(element.animate([from, to], {duration: print ? 470 : 370, delay: order * 32, easing: ease, fill: 'backwards'}));
    });
  }

  function selectCase(key, animate = true) {
    const index = choices.findIndex(button => button.dataset.key === key);
    if (index < 0 || index === selectedIndex) return;
    const direction = Math.sign(index - selectedIndex);
    const previousHeight = caseStage.getBoundingClientRect().height;
    stopTransition();
    selectedIndex = index;
    choices.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    placeIndicator();
    archive.hidden = key === 'kitchen';
    kitchen.hidden = !archive.hidden;
    if (kitchen.hidden) kitchen.querySelector('video')?.pause();
    if (key !== 'kitchen' && collection !== key) {
      collection = key;
      sample = collections[key].first;
      browseCollection();
    }
    if (animate && !reducedMotion.matches) revealCase(kitchen.hidden ? archive : kitchen, direction, previousHeight);
  }
  for (const [index, button] of choices.entries()) {
    button.addEventListener('click', () => selectCase(button.dataset.key));
    button.addEventListener('keydown', event => {
      const next = {ArrowLeft: (index + choices.length - 1) % choices.length,
        ArrowRight: (index + 1) % choices.length, Home: 0, End: choices.length - 1}[event.key];
      if (next === undefined) return;
      event.preventDefault();
      choices[next].focus();
      selectCase(choices[next].dataset.key);
    });
  }

  back.addEventListener('click', () => {
    browseCollection();
    submit.focus();
  });
  submit.addEventListener('click', () => {
    status.textContent = '';
    missed = null;
    if (stage === 'browse') stage = 'choose';
    else if (stage === 'choose') {
      stage = 'answer';
      window.EvoViMMetrics?.demo(collection, 'reveal');
    } else {
      sample = (sample + 1) % records[collection].length;
      stage = 'choose';
    }
    if (stage === 'choose') window.EvoViMMetrics?.demo(collection, 'start');
    drawStage();
    get('.archive-instruction').focus({preventScroll: true});
  });

  listing.addEventListener('click', event => {
    const button = event.target.closest('[data-pick]');
    if (!button || stage !== 'choose') return;
    const chosen = Number(button.dataset.pick);
    if (chosen !== sample) {
      missed?.closest('.archive-record').classList.remove('missed');
      missed = button;
      button.closest('.archive-record').classList.add('missed');
      status.textContent = records[collection][chosen].title + ' doesn’t match. Try another image.';
      return;
    }
    stage = 'answer';
    window.EvoViMMetrics?.demo(collection, 'complete');
    status.textContent = 'Correct match.';
    drawStage();
    get('.archive-instruction').focus({preventScroll: true});
  });
  browseCollection();
  function openLinkedCase() {
    if (location.hash === '#embodied-case') {
      selectCase('kitchen', false);
      section.scrollIntoView();
    }
  }
  openLinkedCase();
  window.addEventListener('hashchange', openLinkedCase);
})();
