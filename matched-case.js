(() => {
  const mount = document.getElementById('matched-case');
  if (!mount) return;

  // Source: seed 43, attempt a001, holdout_parent of haiku_dmv_{ours,automem}_20261017.
  // trajectory.jsonl records the pages and answers. calls.jsonl records the lookups.
  // The two agents received identical environment frames and question text for all 124 steps.
  const patternVase = {
    object: 'vase', image: 'media/comparison/correct-vase.webp',
    alt: 'A wood-panelled vase with a teal, blue and rust-coloured swatch in the lower left.'
  };
  const table = {
    object: 'table', image: 'media/comparison/returned-table.webp',
    alt: 'A wooden side table with a similar mottled swatch.'
  };
  const goldVase = {
    object: 'vase', image: 'media/observations/dmv-hard-a.webp',
    alt: 'A gold vase with a fan design on its body.'
  };
  const examples = {
    pattern: {
      query: 'media/comparison/pattern-query.webp',
      alt: 'A re-photographed swatch with rust-coloured and blue marks on teal.',
      correct: patternVase, returned: [patternVase, table], scores: ['10 / 13', '1 / 13'],
      note: 'EvoViM compared the crop with 20 saved pages and ranked the vase first. AutoMem searched its written descriptions and returned a table with a similar swatch.'
    },
    detail: {
      query: 'media/observations/dmv-hard-b.webp',
      alt: 'A close-up of the gold fan pattern on a vase.',
      correct: goldVase, returned: [goldVase, goldVase], scores: ['11 / 11', '11 / 11'],
      note: 'The close-up shows the raised gold fan design. EvoViM matched it to the saved photo. AutoMem found the same vase in its written descriptions.'
    }
  };

  mount.innerHTML = `
    <header class="paired-head">
      <div><h3>Which product did this crop come from?</h3>
      <p>In this held-out DMV-Hard episode, both methods used Claude Haiku 5.5 and saw the same 100 product pages. Select a method to see which page it returned.</p></div>
      <div class="paired-tabs" role="group" aria-label="Choose a type of question">
        <button type="button" data-example="pattern" aria-pressed="true">Generated pattern</button>
        <button type="button" data-example="detail" aria-pressed="false">Photo detail</button>
      </div>
    </header>
    <div class="paired-body">
      <div class="paired-pictures">
        <figure><img class="paired-query" width="256" height="256" loading="lazy" alt=""><figcaption>Query image</figcaption></figure>
        <figure><img class="paired-page" width="512" height="512" loading="lazy" alt=""><figcaption class="paired-page-caption" aria-live="polite"></figcaption></figure>
      </div>
      <div class="paired-explain">
        <p class="paired-note"></p>
        <div class="paired-methods" role="group" aria-label="Inspect the product returned by each method">
          <div class="paired-columns" aria-hidden="true"><span>Method</span><span>Correct in this category</span></div>
        </div>
      </div>
    </div>`;

  const get = selector => mount.querySelector(selector);
  const methods = ['EvoViM', 'AutoMem'];
  const methodButtons = methods.map((method, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = `<b>${method}</b><strong></strong>`;
    button.addEventListener('click', () => inspect(index));
    get('.paired-methods').append(button);
    return button;
  });
  let example;
  const exampleButtons = [...mount.querySelectorAll('[data-example]')];
  function inspect(index) {
    const page = example.returned[index];
    const image = get('.paired-page');
    const changed = image.getAttribute('src') && image.getAttribute('src') !== page.image;
    image.src = page.image;
    image.alt = page.alt;
    if (changed && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      image.animate([{opacity: .4, transform: 'translateY(4px)'}, {opacity: 1, transform: 'none'}], {duration: 260, easing: 'ease-out'});
    }
    get('.paired-page-caption').textContent = `${methods[index]} returned this ${page.object} (${page === example.correct ? 'correct' : 'incorrect'}).`;
    methodButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(index === i)));
  }
  function selectExample(key) {
    example = examples[key];
    exampleButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.example === key)));
    const query = get('.paired-query');
    query.src = example.query;
    query.alt = example.alt;
    get('.paired-note').textContent = example.note;
    methodButtons.forEach((button, i) => {
      const page = example.returned[i];
      const result = page === example.correct ? 'Correct' : 'Incorrect';
      button.querySelector('strong').textContent = example.scores[i];
      button.setAttribute('aria-label', `Inspect ${methods[i]}’s answer. It returned a ${page.object}. ${result}. ${example.scores[i]} correct in this category.`);
    });
    inspect(0);
  }
  exampleButtons.forEach(button => button.addEventListener('click', () => selectExample(button.dataset.example)));
  selectExample('pattern');
})();
