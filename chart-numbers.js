(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Map();
  let frame = 0;

  function draw(label, now) {
    const progress = Math.min(1, Math.max(0, (now - label.start) / label.duration));
    const eased = 1 - (1 - progress) ** 3;
    const value = progress === 1 ? label.target : label.from + (label.target - label.from) * eased;
    const text = value.toFixed(label.digits) + label.suffix;
    if (label.node.textContent !== text) label.node.textContent = text;
    return progress === 1;
  }

  function tick(now) {
    frame = 0;
    for (const [node, label] of running) {
      if (!node.isConnected || draw(label, now)) running.delete(node);
    }
    if (running.size) frame = requestAnimationFrame(tick);
  }

  function to(node, target, {from = parseFloat(node.textContent) || 0, digits = 0, duration = 850, delay = 0, suffix = '', instant = false} = {}) {
    running.delete(node);
    if (instant || reduced.matches || document.hidden || from === target || duration <= 0) {
      node.textContent = target.toFixed(digits) + suffix;
      return;
    }
    const now = performance.now();
    const label = {node, target, from, digits, suffix, start: now + delay, duration};
    running.set(node, label);
    draw(label, now);
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function finish() {
    cancelAnimationFrame(frame);
    frame = 0;
    for (const label of running.values()) draw(label, Infinity);
    running.clear();
  }
  reduced.addEventListener('change', () => { if (reduced.matches) finish(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });
  window.EvoViMNumbers = {to};
})();
