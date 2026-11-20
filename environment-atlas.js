(() => {
  const games = {
    gallery: {
      name: "MC Gallery",
      text: "Walk past eight numbered doors. At the exit, identify the door and side where each re-photographed painting hung, or answer “not seen.”"
    },
    tetris: {
      name: "Tetris",
      text: "Reach 600 points without topping out. The goal is known on the first move, so each falling piece and each gap in the stack can guide the next placement."
    },
    pacman: {
      name: "Pac-Man",
      text: "The target is 2,500 points. The agent can plan its route around pellets and moving ghosts from the moment play begins."
    },
    "card-matching": {
      name: "Card Matching",
      views: [
        ["Exposed cards", "Two cards are face up in row a. The red pattern at aI will be hidden again."],
        ["Matched pair", "The red pattern is face up at both aI and aK. The agent has found its first pair."]
      ],
      text: "Clear 72 pairs on a 12 × 12 board. Even a failed match tells the agent where to find two patterns the next time it needs them."
    },
    "poster-maze": {
      name: "Poster Maze",
      views: [
        ["Maze view", "From cell (4, 3), the agent sees a teal poster on the east wall of cell (4, 4)."],
        ["Deferred query", "After the agent reaches the exit, a tilted view of the poster asks it to recall the wall location."]
      ],
      text: "Navigating to the exit is only the first part. A later question requires the agent to connect an image to a particular wall, or recognize a poster it never saw."
    },
    "dmv-hard": {
      name: "DMV-Hard",
      views: [
        ["Product page", "A gold Art Deco vase appears on product page 03401944 in the first shopping session."],
        ["Deferred query", "After the second session, a close-up of the vase asks the agent to recover its product ID."]
      ],
      text: "Browse 20 product pages in each shopping session. Later, a transformed crop shows a photo detail or a generated pattern. Identify the product page it came from."
    }
  };

  const dialog = document.getElementById('environment-dialog');
  const player = dialog.querySelector('video');
  const still = dialog.querySelector('.env-observation');
  const caption = dialog.querySelector('.env-still-caption');
  const views = dialog.querySelector('.env-views');
  const exercise = dialog.querySelector('.env-exercise');
  const gallery = document.getElementById('gallery-memory');
  let key;

  function selectView(index) {
    const game = games[key];
    const film = index === 0;
    player.hidden = !film;
    still.hidden = caption.hidden = film;
    if (!film) {
      player.pause();
      const [, description] = game.views[index-1];
      still.src = 'media/observations/' + key + (index === 1 ? '-a.webp' : '-b.webp');
      caption.textContent = still.alt = description;
    }
    [...views.children].forEach((button, i) => button.setAttribute('aria-pressed', String(index === i)));
  }

  for (const link of document.querySelectorAll('.atlas-item')) {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      key = link.dataset.env;
      const game = games[key];
      dialog.querySelector('#environment-name').textContent = game.name;
      dialog.querySelector('#environment-task').textContent = game.text;
      player.setAttribute('aria-label', game.name + (game.views ? ' illustrated episode' : ' recording'));
      dialog.dataset.illustrated = String(Boolean(game.views));
      player.poster = 'media/live/' + key + '.jpg';
      player.src = link.href;
      views.replaceChildren();
      views.hidden = !game.views;
      if (game.views) {
        const labels = ['Illustrated episode', ...game.views.map(([label]) => label)];
        labels.forEach((label, i) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = label;
          button.addEventListener('click', () => selectView(i));
          views.append(button);
        });
      }
      gallery.hidden = key !== 'gallery';
      gallery.querySelector('details').open = false;
      exercise.hidden = !document.querySelector('[data-case-key="' + key + '"]');
      selectView(0);
      dialog.showModal();
      dialog.scrollTop = 0;
      player.play().catch(() => {});
    });
  }

  dialog.querySelector('.env-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => player.pause());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  exercise.addEventListener('click', () => {
    dialog.close();
    const details = document.getElementById('case-exercises');
    details.open = true;
    const button = details.querySelector('[data-case-key="' + key + '"]');
    button.click();
    details.querySelector('[data-action="observe"]')?.click();
    button.focus({preventScroll:true});
    details.scrollIntoView();
  });
  function revealRequestedCase() {
    if (location.hash === '#challenge') {
      location.replace('#environments');
      return;
    }
    if (location.hash === '#cases' || new URLSearchParams(location.search).has('case')) {
      document.getElementById('case-exercises').open = true;
      if (location.hash === '#cases') document.getElementById('cases').scrollIntoView();
    }
  }
  window.addEventListener('hashchange', revealRequestedCase);
  revealRequestedCase();
})();
