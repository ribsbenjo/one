/* ====================================================
   Optimizer lab
   SGD, Momentum, RMSProp and Adam race down the same
   3D loss surface from the same start. Drag to orbit.
==================================================== */
(function () {
  const lab = document.querySelector('.lab');
  if (!lab) return;

  const root = document.documentElement;
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const view = lab.querySelector('.lab-3d');
  const curve = lab.querySelector('.lab-curve');
  const vctx = view.getContext('2d');
  const cctx = curve.getContext('2d');
  const lrInput = lab.querySelector('[data-lr]');
  const lrOut = lab.querySelector('[data-lr-out]');
  const restartBtn = lab.querySelector('[data-restart]');

  /* ---------- Loss surface on [-3, 3]² ---------- */
  const R = 3;
  const rot = 0.55, cr = Math.cos(rot), sr = Math.sin(rot);
  function f(x, y) {
    // A long, narrow, tilted valley (hard for plain SGD) ...
    const u = cr * (x - 0.9) + sr * (y - 0.4);
    const v = -sr * (x - 0.9) + cr * (y - 0.4);
    let z = 1 - Math.exp(-(0.07 * u * u + 1.1 * v * v));
    // ... a hill in the way and a shallow trap
    z += 0.38 * Math.exp(-((x + 0.9) ** 2 + (y - 1.6) ** 2) / 0.55);
    z -= 0.22 * Math.exp(-((x + 1.7) ** 2 + (y + 1.5) ** 2) / 0.35);
    return z + 0.012 * (x * x + y * y);
  }
  function grad(x, y) {
    const e = 1e-3;
    return [(f(x + e, y) - f(x - e, y)) / (2 * e), (f(x, y + e) - f(x, y - e)) / (2 * e)];
  }
  // Global minimum, found once by brute force + refinement
  const fmin = (() => {
    let best = Infinity, bx = 0, by = 0;
    for (let i = 0; i <= 120; i++) for (let j = 0; j <= 120; j++) {
      const x = -R + (2 * R * i) / 120, y = -R + (2 * R * j) / 120, z = f(x, y);
      if (z < best) { best = z; bx = x; by = y; }
    }
    for (let k = 0; k < 400; k++) { const g = grad(bx, by); bx -= 0.5 * g[0]; by -= 0.5 * g[1]; }
    return f(bx, by);
  })();

  /* ---------- Optimizers ---------- */
  const OPTS = [
    { key: 'sgd', name: 'SGD', lr: 0.9,
      step(s, g, lr) { s.x -= lr * g[0]; s.y -= lr * g[1]; } },
    { key: 'mom', name: 'Momentum', lr: 0.12,
      step(s, g, lr) {
        s.vx = 0.92 * s.vx + g[0]; s.vy = 0.92 * s.vy + g[1];
        s.x -= lr * s.vx; s.y -= lr * s.vy;
      } },
    { key: 'rms', name: 'RMSProp', lr: 0.025,
      step(s, g, lr) {
        s.sx = 0.9 * s.sx + 0.1 * g[0] * g[0]; s.sy = 0.9 * s.sy + 0.1 * g[1] * g[1];
        s.x -= lr * g[0] / (Math.sqrt(s.sx) + 1e-8); s.y -= lr * g[1] / (Math.sqrt(s.sy) + 1e-8);
      } },
    { key: 'adam', name: 'Adam', lr: 0.06,
      step(s, g, lr) {
        const b1 = 0.9, b2 = 0.999;
        s.t++;
        s.mx = b1 * s.mx + (1 - b1) * g[0]; s.my = b1 * s.my + (1 - b1) * g[1];
        s.sx = b2 * s.sx + (1 - b2) * g[0] * g[0]; s.sy = b2 * s.sy + (1 - b2) * g[1] * g[1];
        const c1 = 1 - b1 ** s.t, c2 = 1 - b2 ** s.t;
        s.x -= lr * (s.mx / c1) / (Math.sqrt(s.sx / c2) + 1e-8);
        s.y -= lr * (s.my / c1) / (Math.sqrt(s.sy / c2) + 1e-8);
      } },
  ];
  const STEPS = 260;
  let runners = [];
  let stepN = 0, holdUntil = 0;
  let lrScale = 1;

  const legend = {};
  lab.querySelectorAll('[data-opt]').forEach((li) => { legend[li.dataset.opt] = li.querySelector('[data-loss]'); });

  function newRace(x0, y0) {
    if (x0 == null) {
      // Start high up on the far side, away from the minimum
      const a = Math.random() * Math.PI * 2;
      x0 = Math.max(-2.7, Math.min(2.7, -1.2 + Math.cos(a) * 1.5));
      y0 = Math.max(-2.7, Math.min(2.7, 0.8 + Math.sin(a) * 1.6));
      if (f(x0, y0) < 0.6) { x0 = -2.4; y0 = 2.2; }
    }
    runners = OPTS.map((o) => ({
      o, s: { x: x0, y: y0, vx: 0, vy: 0, sx: 0, sy: 0, mx: 0, my: 0, t: 0 },
      path: [[x0, y0, f(x0, y0)]], losses: [f(x0, y0) - fmin],
    }));
    stepN = 0;
    holdUntil = 0;
  }

  function advance() {
    if (stepN >= STEPS) return false;
    stepN++;
    runners.forEach((r) => {
      const g = grad(r.s.x, r.s.y);
      r.o.step(r.s, g, r.o.lr * lrScale);
      r.s.x = Math.max(-R, Math.min(R, r.s.x));
      r.s.y = Math.max(-R, Math.min(R, r.s.y));
      const z = f(r.s.x, r.s.y);
      r.path.push([r.s.x, r.s.y, z]);
      r.losses.push(Math.max(1e-5, z - fmin));
    });
    return true;
  }

  /* ---------- Camera ---------- */
  let yaw = -0.75, pitch = 0.62, autoSpin = true;
  let W = 0, H = 0, dpr = 1, scale = 1;
  const ZH = 1.7; // vertical exaggeration

  function project(x, y, z) {
    // world: x right, y forward, z up → rotate around z by yaw, tilt by pitch
    const cx = Math.cos(yaw), sx = Math.sin(yaw);
    const X = x * cx - y * sx;
    const Y = x * sx + y * cx;
    const Z = (z - 0.5) * ZH;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const depth = Y * cp + Z * sp;
    const up = Z * cp - Y * sp;
    const persp = 9 / (9 + depth);
    return [W / 2 + X * scale * persp, H * 0.47 - up * scale * persp, depth];
  }

  let colors = {};
  function readColors() {
    colors = {
      ink: css('--ink'), faint: css('--ink-faint'), line: css('--line'), contour: css('--contour'),
      sgd: css('--c-sgd'), mom: css('--c-mom'), rms: css('--c-rms'), adam: css('--c-adam'),
    };
  }

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = view.clientWidth; H = view.clientHeight;
    view.width = W * dpr; view.height = H * dpr;
    vctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(W, H * 1.3) / 8.6;
    const cw = curve.clientWidth, ch = curve.clientHeight;
    curve.width = cw * dpr; curve.height = ch * dpr;
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Precomputed surface heights
  const N = 36;
  const surf = [];
  for (let j = 0; j <= N; j++) {
    const row = [];
    for (let i = 0; i <= N; i++) {
      const x = -R + (2 * R * i) / N, y = -R + (2 * R * j) / N;
      row.push([x, y, f(x, y)]);
    }
    surf.push(row);
  }

  function drawSurface() {
    vctx.lineWidth = 0.8;
    const P = surf.map((row) => row.map((p) => project(p[0], p[1], p[2])));
    // Shade lines by height: low = darker ink, high = faint
    for (let j = 0; j <= N; j++) {
      for (let i = 0; i < N; i++) {
        const za = surf[j][i][2], a = P[j][i], b = P[j][i + 1];
        vctx.globalAlpha = 0.16 + 0.34 * (1 - Math.min(1, za));
        vctx.strokeStyle = colors.ink;
        vctx.beginPath(); vctx.moveTo(a[0], a[1]); vctx.lineTo(b[0], b[1]); vctx.stroke();
      }
    }
    for (let i = 0; i <= N; i++) {
      for (let j = 0; j < N; j++) {
        const za = surf[j][i][2], a = P[j][i], b = P[j + 1][i];
        vctx.globalAlpha = 0.16 + 0.34 * (1 - Math.min(1, za));
        vctx.strokeStyle = colors.ink;
        vctx.beginPath(); vctx.moveTo(a[0], a[1]); vctx.lineTo(b[0], b[1]); vctx.stroke();
      }
    }
    vctx.globalAlpha = 1;
  }

  function drawRunners() {
    // Draw far runners first so the near ones sit on top
    const order = runners.map((r) => ({ r, d: project(r.s.x, r.s.y, f(r.s.x, r.s.y))[2] })).sort((a, b) => b.d - a.d);
    order.forEach(({ r }) => {
      const col = colors[r.o.key];
      vctx.strokeStyle = col;
      vctx.lineWidth = 2;
      vctx.lineJoin = 'round';
      vctx.beginPath();
      r.path.forEach((p, i) => {
        const q = project(p[0], p[1], p[2] + 0.012);
        i ? vctx.lineTo(q[0], q[1]) : vctx.moveTo(q[0], q[1]);
      });
      vctx.stroke();
      const last = r.path[r.path.length - 1];
      const q = project(last[0], last[1], last[2] + 0.012);
      vctx.fillStyle = col;
      vctx.beginPath(); vctx.arc(q[0], q[1], 5, 0, Math.PI * 2); vctx.fill();
      vctx.strokeStyle = colors.ink;
      vctx.lineWidth = 1;
      vctx.stroke();
    });
    // Start marker
    const s = runners[0].path[0];
    const q = project(s[0], s[1], s[2] + 0.012);
    vctx.fillStyle = colors.ink;
    vctx.font = 'italic 15px "Newsreader", Georgia, serif';
    vctx.fillText('θ₀', q[0] + 8, q[1] - 8);
  }

  function drawCurve() {
    const cw = curve.clientWidth, ch = curve.clientHeight;
    cctx.clearRect(0, 0, cw, ch);
    const pad = { l: 30, r: 6, t: 8, b: 18 };
    const lo = Math.log10(1e-4), hi = Math.log10(1.5);
    const X = (i) => pad.l + (i / STEPS) * (cw - pad.l - pad.r);
    const Y = (v) => pad.t + (1 - (Math.log10(v) - lo) / (hi - lo)) * (ch - pad.t - pad.b);
    cctx.font = '10px "JetBrains Mono", monospace';
    cctx.fillStyle = colors.faint;
    cctx.strokeStyle = colors.line;
    cctx.lineWidth = 1;
    [1, 1e-2, 1e-4].forEach((v) => {
      const y = Y(v);
      cctx.beginPath(); cctx.moveTo(pad.l, y); cctx.lineTo(cw - pad.r, y); cctx.stroke();
      cctx.fillText(v === 1 ? '1' : v === 1e-2 ? '1e-2' : '1e-4', 0, y + 3);
    });
    cctx.fillText('step →', cw - 46, ch - 4);
    runners.forEach((r) => {
      cctx.strokeStyle = colors[r.o.key];
      cctx.lineWidth = 1.6;
      cctx.beginPath();
      r.losses.forEach((v, i) => {
        const y = Y(Math.max(1e-4, Math.min(1.5, v)));
        i ? cctx.lineTo(X(i), y) : cctx.moveTo(X(i), y);
      });
      cctx.stroke();
    });
  }

  function updateLegend() {
    runners.forEach((r) => {
      const el = legend[r.o.key];
      if (el) el.textContent = r.losses[r.losses.length - 1].toExponential(1);
    });
  }

  function render() {
    vctx.clearRect(0, 0, W, H);
    drawSurface();
    drawRunners();
    drawCurve();
    updateLegend();
  }

  /* ---------- Loop ---------- */
  let visible = false, raf = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (autoSpin && !dragging) yaw += dt * 0.12;
    // Two optimizer steps per frame ≈ 4 s per race
    if (!advance() || !advance()) {
      if (!holdUntil) holdUntil = now + 2600;
      else if (now > holdUntil) newRace();
    }
    render();
    if (visible) raf = requestAnimationFrame(frame);
  }
  function start() { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame); }

  /* ---------- Interaction ---------- */
  let dragging = false, px = 0, py = 0;
  view.addEventListener('pointerdown', (e) => {
    dragging = true; px = e.clientX; py = e.clientY;
    view.setPointerCapture(e.pointerId);
    autoSpin = false;
  });
  view.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    yaw += (e.clientX - px) * 0.008;
    pitch = Math.max(0.15, Math.min(1.35, pitch + (e.clientY - py) * 0.006));
    px = e.clientX; py = e.clientY;
    if (reduceMotion) render();
  });
  const end = () => { dragging = false; };
  view.addEventListener('pointerup', end);
  view.addEventListener('pointercancel', end);

  restartBtn.addEventListener('click', () => {
    newRace();
    if (reduceMotion) { while (advance()); render(); }
  });
  lrInput.addEventListener('input', () => {
    lrScale = parseFloat(lrInput.value);
    lrOut.textContent = `${lrScale.toFixed(2)}×`;
    const s = runners[0].path[0];
    newRace(s[0], s[1]);
    if (reduceMotion) { while (advance()); render(); }
  });

  window.addEventListener('resize', () => { size(); render(); });
  window.addEventListener('themechange', () => { readColors(); render(); });

  readColors();
  size();
  newRace(-2.3, 2.1);

  if (reduceMotion) {
    while (advance());
    render();
    return;
  }
  render();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was) start();
    }).observe(lab);
  } else {
    visible = true; start();
  }
})();
