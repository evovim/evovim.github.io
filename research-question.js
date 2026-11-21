(() => {
  const board = document.querySelector('#research-question .rq-example');
  if (!board) return;
  const replay = board.querySelector('.rq-replay');
  const query = board.querySelector('.rq-patch img');
  const match = board.querySelector('.rq-match');
  const images = [...board.querySelectorAll('figure img')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ghost = document.createElement('img');
  ghost.className = 'rq-ghost';
  ghost.alt = '';
  ghost.setAttribute('aria-hidden','true');
  board.append(ghost);
  let generation = 0, observedWidth = board.clientWidth;

  function finish() {
    generation++;
    board.classList.remove('rq-waiting','rq-playing');
  }
  async function play() {
    finish();
    if (reduced.matches) return;
    const requested = generation;
    board.classList.add('rq-waiting');
    try { await Promise.all(images.map(img => img.decode())); }
    catch { if (generation === requested) finish(); return; }
    if (generation !== requested || reduced.matches) return;
    const bounds = board.getBoundingClientRect();
    if (bounds.bottom <= 0 || bounds.top >= innerHeight) { finish(); return; }
    const from = query.getBoundingClientRect(), to = match.getBoundingClientRect();
    ghost.src = query.currentSrc || query.src;
    Object.assign(ghost.style,{left:(from.left-bounds.left)+'px',top:(from.top-bounds.top)+'px',width:from.width+'px',height:from.height+'px'});
    ghost.style.setProperty('--rq-dx',(to.left-from.left)+'px');
    ghost.style.setProperty('--rq-dy',(to.top-from.top)+'px');
    ghost.style.setProperty('--rq-scale',String(to.width/from.width));
    board.classList.remove('rq-waiting');
    board.classList.add('rq-playing');
  }
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    play();
  },{threshold:.3});
  function motionPreference() {
    observer.disconnect();
    finish();
    replay.hidden = reduced.matches;
    if (!reduced.matches) {
      board.classList.add('rq-waiting');
      observer.observe(board);
    }
  }
  new ResizeObserver(() => {
    if (board.clientWidth !== observedWidth && board.classList.contains('rq-playing')) finish();
    observedWidth = board.clientWidth;
  }).observe(board);
  board.querySelector('.rq-answer').addEventListener('animationend',finish);
  replay.addEventListener('click',() => { observer.disconnect(); play(); });
  reduced.addEventListener('change',motionPreference);
  motionPreference();
})();
