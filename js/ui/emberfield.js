/**
 * EMBER FIELD — the living atmosphere
 * A canvas of chakra embers: drifting, glowing, breathing with the
 * genome, and shyly following the cursor. The site should feel alive
 * even when nothing on it is moving on purpose.
 */

export function startEmberField(canvas, { genome } = {}) {
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  let ctx = null;
  try {
    ctx = canvas.getContext("2d");
  } catch {
    ctx = null;
  }
  if (!ctx) return () => {};

  let w = 0, h = 0, dpr = 1, raf = 0, running = true;
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

  const HUES = [
    [255, 45, 85],   // crimson
    [255, 122, 69],  // ember
    [255, 206, 115], // gold
    [157, 123, 255], // violet
  ];

  let motes = [];

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = Math.min(110, Math.floor((w * h) / 16000));
    while (motes.length < target) motes.push(spawn(true));
    motes.length = target;
  }

  function spawn(anywhere = false) {
    const [r, g, b] = HUES[Math.floor(Math.random() * HUES.length)];
    return {
      x: Math.random() * (w || 800),
      y: anywhere ? Math.random() * (h || 600) : h + 10 + Math.random() * 40,
      r: 0.6 + Math.random() * 2.4,
      vy: -(0.12 + Math.random() * 0.55),
      vx: (Math.random() - 0.5) * 0.22,
      drift: Math.random() * Math.PI * 2,
      driftSpeed: 0.002 + Math.random() * 0.01,
      alpha: 0.25 + Math.random() * 0.6,
      r0: r, g0: g, b0: b,
    };
  }

  function frame() {
    if (!running) return;
    const speed = genome ? 0.55 + genome.pace * 0.9 : 0.8;
    ctx.clearRect(0, 0, w, h);

    // soft parallax toward the cursor
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;

    for (const m of motes) {
      m.drift += m.driftSpeed * speed;
      m.x += (m.vx + Math.sin(m.drift) * 0.35) * speed;
      m.y += m.vy * speed;

      // gentle avoidance of the cursor — embers shy away like fire
      const dx = m.x - mouse.x;
      const dy = m.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 120 * 120) {
        const d = Math.sqrt(d2) || 1;
        m.x += (dx / d) * (1 - d / 120) * 1.7;
        m.y += (dy / d) * (1 - d / 120) * 1.7;
      }

      if (m.y < -12 || m.x < -12 || m.x > w + 12) Object.assign(m, spawn(false));

      const glow = m.r * 7;
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, glow);
      grad.addColorStop(0, `rgba(${m.r0},${m.g0},${m.b0},${m.alpha})`);
      grad.addColorStop(1, `rgba(${m.r0},${m.g0},${m.b0},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, glow, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  function onMove(e) {
    mouse.tx = e.clientX;
    mouse.ty = e.clientY;
    if (mouse.x < -1000) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
  }

  function onLeave() {
    mouse.tx = -9999;
    mouse.ty = -9999;
  }

  resize();
  addEventListener("resize", resize);
  addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  document.addEventListener("visibilitychange", () => {
    running = document.visibilityState === "visible";
    if (running) raf = requestAnimationFrame(frame);
  });

  if (prefersReduced) {
    // one still frame — atmosphere without motion
    running = true;
    frame();
    running = false;
    cancelAnimationFrame(raf);
    return () => {};
  }

  raf = requestAnimationFrame(frame);
  return () => {
    running = false;
    cancelAnimationFrame(raf);
    removeEventListener("resize", resize);
    removeEventListener("pointermove", onMove);
  };
}
