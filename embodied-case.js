(() => {
  const host = document.getElementById('embodied-case');
  if (!host) return;
  const film = 'https://open-eqa.github.io/assets/videos/open-eqa-teaser.mp4';
  const annotations = 'https://github.com/facebookresearch/open-eqa/blob/main/data/open-eqa-v0.json#L4526-L4539';
  host.innerHTML = `
    <div class="kitchen-case">
      <div class="kitchen-intro">
        <h3 id="kitchen-title">What do you remember about the kitchen?</h3>
        <p>Watch the kitchen walkthrough from <a href="https://open-eqa.github.io/" target="_blank" rel="noopener">OpenEQA</a> by Majumdar and colleagues. Then compare what you remember with the <a href="${annotations}" target="_blank" rel="noopener">human answers</a>.</p>
        <button class="kitchen-play" type="button" data-time="0" aria-controls="kitchen-filmbox"><span aria-hidden="true">▶</span> Watch the kitchen visit</button>
      </div>
      <div class="kitchen-questions" id="kitchen-questions">
        <details>
          <summary>What color are the blinds?</summary>
          <div><p><strong>White.</strong> The camera faces the slats above the radiator.</p>
          <button type="button" data-time="12" aria-controls="kitchen-filmbox">See the window at 0:12 ↗</button></div>
        </details>
        <details>
          <summary>What food is on the counter?</summary>
          <div><p><strong>Cheerios.</strong> The cereal box comes into view beside the sink.</p>
          <button type="button" data-time="26" aria-controls="kitchen-filmbox">See the counter at 0:26 ↗</button></div>
        </details>
      </div>
      <button class="kitchen-back" type="button" aria-controls="kitchen-questions kitchen-filmbox" hidden><span aria-hidden="true">←</span> Back to the kitchen visit</button>
      <figure id="kitchen-filmbox" hidden>
        <video controls playsinline preload="none" tabindex="0" aria-label="OpenEQA kitchen walkthrough with on-screen questions and visual evidence"></video>
        <figcaption><a href="${film}" target="_blank" rel="noopener">Open the original film ↗</a></figcaption>
        <p class="kitchen-status" role="status"></p>
      </figure>
    </div>`;

  const figure = host.querySelector('figure');
  const video = figure.querySelector('video');
  const status = figure.querySelector('.kitchen-status');
  const back = host.querySelector('.kitchen-back');
  const questions = [...host.querySelectorAll('details')];
  let returnFocus = host.querySelector('.kitchen-play');

  function syncBack() {
    back.hidden = figure.hidden && !questions.some(question => question.open);
  }

  for (const question of questions) {
    question.addEventListener('toggle', () => {
      if (question.open && figure.hidden) returnFocus = question.querySelector('summary');
      syncBack();
    });
  }

  back.addEventListener('click', () => {
    figure.hidden = true;
    for (const question of questions) question.open = false;
    if (video.hasAttribute('src')) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    status.textContent = '';
    syncBack();
    returnFocus.focus();
  });

  for (const button of host.querySelectorAll('[data-time]')) {
    button.addEventListener('click', () => {
      const time = Number(button.dataset.time);
      returnFocus = button.closest('details')?.querySelector('summary') || button;
      figure.hidden = false;
      syncBack();
      status.textContent = '';
      video.preload = 'auto';
      if (!video.src || video.error) video.src = film + '#t=0,27';
      video.currentTime = time;
      video.focus();
      if (time > 0) {
        video.pause();
        return;
      }
      video.play().catch(error => {
        if (!figure.hidden && error.name !== 'AbortError') status.textContent = 'Use the player controls or open the original film.';
      });
    });
  }
  video.addEventListener('error', () => {
    if (!figure.hidden) status.textContent = 'The official video could not load. The original film and the written answers are linked here.';
  });
})();
