(() => {
  const field = document.getElementById('ambient-field');
  if (!field) return;
  const canvas = field.querySelector('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  const turn = Math.PI * 2;

  function registrationMark(x, y, size) {
    context.beginPath();
    context.moveTo(x - size, y);
    context.lineTo(x + size, y);
    context.moveTo(x, y - size);
    context.lineTo(x, y + size);
    context.stroke();
  }

  function scaleArc(cx, cy, radius, first, last, ink) {
    context.save();
    context.translate(cx, cy);
    context.rotate(-.34);
    context.scale(1, .74);
    context.strokeStyle = ink;
    // An engraved arc, a second fine edge and the divisions between them.
    for (const offset of [0, 5, 23]) {
      context.beginPath();
      context.ellipse(0, 0, radius + offset, radius + offset, 0, first, last);
      context.stroke();
    }
    context.beginPath();
    for (let i = 0; i <= 66; ++i) {
      const angle = first + (last - first) * i / 66;
      const inner = radius + (i % 6 === 0 ? 8 : 17);
      context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      context.lineTo(Math.cos(angle) * (radius + 23), Math.sin(angle) * (radius + 23));
    }
    context.stroke();
    context.restore();
  }

  function drawField() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const resolution = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * resolution);
    canvas.height = Math.round(height * resolution);
    context.setTransform(resolution, 0, 0, resolution, 0, 0);
    const compact = width < 720;
    const unit = compact ? 26 : 32;
    const fade = context.createLinearGradient(0, height, width, 0);
    fade.addColorStop(0, '#3f607c26');
    fade.addColorStop(.42, '#3f607c05');
    fade.addColorStop(.7, '#3f607c0c');
    fade.addColorStop(1, '#3f607c30');
    context.fillStyle = fade;
    context.strokeStyle = fade;
    context.lineWidth = 1;
    for (let row = 0; row * unit < height; ++row) {
      for (let col = 0; col * unit < width; ++col) {
        const x = col * unit + 11.5;
        const y = row * unit + 13.5;
        if (row % 5 === 2 && col % 5 === 3) registrationMark(x, y, 3);
        else context.fillRect(x, y, 1.25, 1.25);
      }
    }
    const radius = Math.min(width * .29, height * .48);
    scaleArc(width * 1.015, height * .21, radius, turn * .16, turn * .81, '#3f607c1e');
    scaleArc(width * -.085, height * .86, radius * .78, turn * -.26, turn * .4, '#94836b19');
  }

  new ResizeObserver(drawField).observe(field);
})();
