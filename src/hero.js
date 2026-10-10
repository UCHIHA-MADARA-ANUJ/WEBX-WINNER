// A living wave field drawn on canvas. It reacts to the pointer and to the
// engine's live pace signal, so the first screen already shows the idea.
export function mountHero(canvas, { getSpeed = () => 0, interactive = true } = {}) {
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let w = 0, h = 0, dpr = 1, pts = [], raf = 0, visible = true;
  let mx = -9999, my = -9999, t = 0, last = performance.now();

  function layout() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gap = w < 700 ? 24 : 32;
    pts = [];
    for (let y = gap / 2; y < h; y += gap) for (let x = gap / 2; x < w; x += gap) pts.push({ x, y });
  }

  function draw(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt * (0.8 + Math.min(Math.max(getSpeed(), 0), 3000) / 600);
    ctx.clearRect(0, 0, w, h);
    const R = 140;
    for (const p of pts) {
      const wave = Math.sin(p.x * 0.012 + t) * 0.5 + Math.cos(p.y * 0.016 - t * 1.3) * 0.5; // -1..1
      let x = p.x, y = p.y + wave * 10, near = 0;
      if (interactive) {
        const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
        if (d < R) {
          near = 1 - d / R;
          const push = near * 26;
          x += (dx / (d || 1)) * push;
          y += (dy / (d || 1)) * push;
        }
      }
      const size = 0.9 + (wave + 1) * 0.8 + near * 2.4;
      ctx.fillStyle = near > 0.05
        ? `rgba(255,0,85,${(0.5 + near * 0.5).toFixed(2)})`
        : `rgba(0,240,255,${(0.16 + (wave + 1) * 0.16).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(now) {
    draw(now);
    if (visible && !reduce) raf = requestAnimationFrame(loop);
  }

  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
  };
  const onLeave = () => { mx = my = -9999; };
  const onResize = () => { layout(); if (reduce) draw(performance.now()); };

  layout();
  const io = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && !reduce) { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop); }
  });
  io.observe(canvas);
  if (interactive) { window.addEventListener('pointermove', onMove, { passive: true }); window.addEventListener('pointerleave', onLeave); }
  window.addEventListener('resize', onResize);
  if (reduce) draw(performance.now()); else raf = requestAnimationFrame(loop);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', onResize);
    },
  };
}
