(() => {
  const film = document.getElementById('environment-film');
  const chapters = document.getElementById('film-chapter-track');
  const picker = document.getElementById('film-chapter-picker');
  const select = document.getElementById('film-chapters');
  const track = chapters.track;
  const start = document.getElementById('film-start');
  const title = document.getElementById('film-title');

  function showControls() {
    const focusPlayer = document.activeElement === start;
    film.controls = true;
    if (focusPlayer) {
      film.tabIndex = 0;
      film.focus({preventScroll: true});
    }
    title.hidden = false;
    start.hidden = true;
    film.removeEventListener('click', playFromCover);
  }

  function playFromCover() {
    film.play().catch(showControls);
  }

  // On a narrow screen the native control bar covers the paper's byline.
  // Offer play below the title frame until the viewer plays or seeks.
  film.controls = false;
  title.hidden = true;
  start.hidden = false;
  film.addEventListener('click', playFromCover);
  start.addEventListener('click', playFromCover);
  film.addEventListener('play', showControls, {once: true});

  function showCurrentChapter() {
    const active = track.activeCues?.[0];
    if (active) select.value = String(active.startTime);
  }

  function loadChapters() {
    if (!track.cues?.length) return;
    const options = Array.from(track.cues, cue => {
      const seconds = Math.floor(cue.startTime);
      const time = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
      return new Option(time + '  ' + cue.text, String(cue.startTime));
    });
    select.replaceChildren(...options);
    picker.hidden = false;
    showCurrentChapter();
  }

  chapters.addEventListener('load', loadChapters);
  track.addEventListener('cuechange', showCurrentChapter);
  select.addEventListener('change', () => {
    showControls();
    film.currentTime = Number(select.value);
  });
  track.mode = 'hidden';
  loadChapters();
})();
