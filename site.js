"use strict";

const inlinePlayers = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) {
      entry.target.pause();
      inlinePlayers.unobserve(entry.target);
    }
  }
});
document.addEventListener("play", event => {
  const active = event.target;
  if (!(active instanceof HTMLVideoElement)) return;
  if (active.id !== "environment-film") inlinePlayers.observe(active);
  document.querySelectorAll("video").forEach(video => {
    if (video !== active && !video.paused) video.pause();
  });
}, true);
document.addEventListener("pause", event => {
  if (event.target instanceof HTMLVideoElement) inlinePlayers.unobserve(event.target);
}, true);

const dialog = document.getElementById("framework-dialog");
document.getElementById("framework-open").addEventListener("click", event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !dialog.showModal) return;
  event.preventDefault();
  dialog.showModal();
});
document.getElementById("framework-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});

const installCode = document.getElementById("install-code");
const copyButton = document.getElementById("copy-install");
let resetTimer;
copyButton.addEventListener("click", async () => {
  try {
    if (!navigator.clipboard) throw new Error("clipboard unavailable");
    await navigator.clipboard.writeText(installCode.textContent);
    window.EvoViMMetrics?.copiedInstall();
    copyButton.textContent = "Copied ✓";
  } catch {
    const range = document.createRange(); range.selectNodeContents(installCode);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    copyButton.textContent = "Selected · press Copy";
  }
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {copyButton.textContent = "Copy commands";}, 2600);
});

const navBar = document.querySelector('.reading-header');
const contents = navBar.querySelector('.reading-nav');
const toggle = contents.querySelector('.reading-toggle');
const currentLabel = toggle.querySelector('.reading-current');
const chapterList = contents.querySelector('.reading-links');
const mastheadLinks = new Map([...navBar.querySelectorAll('.masthead-links a')].map(link => [link.hash, link]));
const chapters = [...contents.querySelectorAll('a[href^="#"]')].map(link => ({
  link,
  section: document.getElementById(link.hash.slice(1))
})).filter(chapter => chapter.section);
const compactNav = matchMedia('(max-width: 1149px)');
const dockMotion = matchMedia('(min-width: 1150px) and (prefers-reduced-motion: no-preference)');
let currentChapter = chapters.find(chapter => chapter.link.hasAttribute('aria-current'));
let navFrame = 0;
let pointerY = null;
let focusedChapter = null;
let lastDockCenter = null;

function closeContents(restoreFocus = false) {
  toggle.setAttribute('aria-expanded', 'false');
  if (restoreFocus) toggle.focus({preventScroll: true});
}

function updateDock(readingCenter) {
  if (!dockMotion.matches) return;
  let center = focusedChapter ?? readingCenter;
  if (pointerY !== null) {
    // Measure the stationary hit area, so enlarging a label never moves the pointer's target.
    const box = chapterList.getBoundingClientRect();
    const row = (pointerY - box.top) / box.height * chapters.length - .5;
    center = Math.max(0, Math.min(chapters.length - 1, row));
  }
  if (center === lastDockCenter) return;
  lastDockCenter = center;
  chapters.forEach(({link}, index) => {
    const distance = index - center;
    const lift = (1 + Math.cos(Math.PI * Math.min(1, Math.abs(distance) / 2.2))) / 2;
    link.style.setProperty('--dock-lift', lift.toFixed(3));
    link.style.setProperty('--dock-spread', (distance * lift * 3.8).toFixed(2) + 'px');
  });
}

function updateChapter() {
  navFrame = 0;
  const readingLine = navBar.offsetHeight + Math.min(innerHeight * .20, 150);
  let index = 0;
  let sectionTop = -Infinity;
  let nextTop = Infinity;
  for (let i = 1; i < chapters.length; i++) {
    const top = chapters[i].section.getBoundingClientRect().top;
    if (top > readingLine) {
      nextTop = top;
      break;
    }
    index = i;
    sectionTop = top;
  }
  // The emphasis passes between adjacent labels as their section boundary crosses the reading line.
  const halfBand = Math.min(96, innerHeight * .1);
  const entering = Math.max(0, 1 - (readingLine - sectionTop) / halfBand);
  const leaving = Math.max(0, 1 - (nextTop - readingLine) / halfBand);
  let center = index + (leaving - entering) / 2;
  if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) {
    index = chapters.length - 1;
    center = index;
  }
  updateDock(center);
  const active = chapters[index];
  if (currentChapter === active) return;
  currentChapter?.link.removeAttribute('aria-current');
  if (currentChapter) mastheadLinks.get(currentChapter.link.hash)?.removeAttribute('aria-current');
  active.link.setAttribute('aria-current', 'location');
  mastheadLinks.get(active.link.hash)?.setAttribute('aria-current', 'location');
  currentLabel.textContent = active.link.textContent;
  currentChapter = active;
}

function scheduleChapter() {
  if (!navFrame) navFrame = requestAnimationFrame(updateChapter);
}

function followReadingPosition() {
  pointerY = null;
  focusedChapter = null;
  scheduleChapter();
}

chapterList.addEventListener('pointermove', event => {
  if (!dockMotion.matches || event.pointerType === 'touch') return;
  pointerY = event.clientY;
  scheduleChapter();
});
chapterList.addEventListener('pointerleave', () => {
  pointerY = null;
  scheduleChapter();
});
chapterList.addEventListener('focusin', event => {
  if (!dockMotion.matches || !event.target.matches('a:focus-visible')) return;
  pointerY = null;
  focusedChapter = chapters.findIndex(chapter => chapter.link === event.target);
  scheduleChapter();
});
chapterList.addEventListener('focusout', () => {
  focusedChapter = null;
  scheduleChapter();
});
dockMotion.addEventListener('change', followReadingPosition);

function updateNavLayout() {
  document.documentElement.style.setProperty('--nav-height', navBar.offsetHeight + 'px');
  scheduleChapter();
}

contents.classList.add('is-ready');
toggle.hidden = false;
toggle.addEventListener('click', () => {
  toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true'));
});
contents.addEventListener('keydown', event => {
  if (event.key === 'Escape' && compactNav.matches && toggle.getAttribute('aria-expanded') === 'true') {
    event.preventDefault();
    closeContents(true);
  }
});
document.addEventListener('click', event => {
  if (!contents.contains(event.target) || event.target.closest('.reading-links a')) closeContents();
});
contents.addEventListener('focusout', event => {
  if (!contents.contains(event.relatedTarget)) closeContents();
});
compactNav.addEventListener('change', () => {
  closeContents();
  updateNavLayout();
});
new ResizeObserver(updateNavLayout).observe(navBar);
const sectionSizes = new ResizeObserver(scheduleChapter);
for (const {section} of chapters) sectionSizes.observe(section);
window.addEventListener('scroll', followReadingPosition, {passive: true});
window.addEventListener('resize', scheduleChapter);
window.addEventListener('hashchange', scheduleChapter);
window.addEventListener('pageshow', scheduleChapter);
updateNavLayout();
