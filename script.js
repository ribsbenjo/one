/* ====================================================
   Shared site script
   - theme toggle (paper / night)
   - reveal on scroll, active nav link, count-up stats
   - loss landscapes: contour maps with live gradient descent
   - "training" readout that converges as you scroll
   - easter egg: type "ice" for snowfall
==================================================== */
(function () {
  const root = document.documentElement;
  root.classList.remove('no-js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const tr = (key, vars) => (window.i18n ? window.i18n.t(key, vars) : key);

  /* ---------- Theme toggle ---------- */
  const toggle = document.querySelector('.theme-toggle');
  function setToggleLabel() {
    if (!toggle) return;
    const dark = root.dataset.theme === 'dark';
    const [icon, ...words] = (dark ? tr('theme_paper') : tr('theme_night')).split(' ');
    toggle.innerHTML = `<span aria-hidden="true">${icon}</span><span class="tt">${words.join(' ')}</span>`;
    toggle.setAttribute('aria-label', dark ? tr('theme_to_light') : tr('theme_to_dark'));
  }
  setToggleLabel();
  window.addEventListener('langchange', setToggleLabel);
  if (toggle) {
    toggle.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
      setToggleLabel();
      window.dispatchEvent(new Event('themechange'));
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('visible'));
  }

  /* ---------- Active nav link ---------- */
  const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  if (navLinks.length && 'IntersectionObserver' in window) {
    const byId = Object.fromEntries(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && byId[e.target.id]) {
          navLinks.forEach((a) => a.classList.remove('active'));
          byId[e.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    window.addEventListener('scroll', () => {
      if (window.scrollY < window.innerHeight * 0.5) navLinks.forEach((a) => a.classList.remove('active'));
    }, { passive: true });
    Object.keys(byId).forEach((id) => {
      const s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll('[data-count]');
  function runCount(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
    const start = performance.now();
    const dur = 1400;
    (function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => co.observe(el));
  } else {
    counters.forEach(runCount);
  }

  /* ---------- Scroll = training: loss converges as you read ---------- */
  const trainer = document.querySelector('.trainer');
  if (trainer) {
    const epochEl = trainer.querySelector('[data-epoch]');
    const lossEl = trainer.querySelector('[data-train-loss]');
    const fill = trainer.querySelector('.trainer-fill');
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 1;
      const epoch = Math.round(p * 100);
      // A slightly noisy, exponentially decaying training loss
      const loss = 2.3 * Math.exp(-4.2 * p) + 0.012 + 0.03 * Math.abs(Math.sin(epoch * 2.7)) * (1 - p);
      epochEl.textContent = String(epoch).padStart(3, '0');
      lossEl.textContent = loss.toFixed(3);
      fill.style.transform = `scaleX(${p})`;
      trainer.classList.toggle('done', p > 0.985);
      trainer.classList.toggle('shown', window.scrollY > window.innerHeight * 0.45);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ====================================================
     Loss landscapes
     L(θ) is a sum of rotated Gaussian wells and hills on a
     gentle bowl. Contours come from marching squares; the
     path is gradient descent with momentum.
  ==================================================== */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Build a loss function in normalised coords: u ∈ [0,1] (left→right), v ∈ [0,1] (top→bottom).
  function makeLoss(seed, minU, minV, aspect, zone) {
    const rnd = mulberry32(seed);
    const terms = [];
    const add = (u, v, amp, sx, sy, rot) => terms.push({ u, v, amp, sx, sy, c: Math.cos(rot), s: Math.sin(rot) });

    // Global minimum: deep, elongated well
    add(minU, minV, -1.5, 0.24, 0.11, -0.3 + rnd() * 0.4);
    add(minU + 0.015, minV + 0.01, -0.5, 0.05, 0.035, 0.2);
    // Local minima (shallower) stay right of `zone`, so runs don't end behind the text
    for (let i = 0; i < 5; i++) {
      add(zone + rnd() * (0.94 - zone), 0.1 + rnd() * 0.8, -(0.18 + rnd() * 0.3), 0.04 + rnd() * 0.06, 0.035 + rnd() * 0.05, rnd() * Math.PI);
    }
    for (let i = 0; i < 6; i++) {
      add(rnd(), rnd() * 1.1 - 0.05, 0.35 + rnd() * 0.5, 0.06 + rnd() * 0.12, 0.05 + rnd() * 0.1, rnd() * Math.PI);
    }

    function L(u, v) {
      // Bowl centred on the global minimum, so the descent mostly finds it
      const bu = (u - minU) * aspect, bv = v - minV;
      let z = 0.8 * (bu * bu * 0.5 + bv * bv);
      for (let i = 0; i < terms.length; i++) {
        const t = terms[i];
        const du = (u - t.u) * aspect, dv = v - t.v;
        const a = (du * t.c + dv * t.s) / t.sx;
        const b = (-du * t.s + dv * t.c) / t.sy;
        z += t.amp * Math.exp(-0.5 * (a * a + b * b));
      }
      return z;
    }
    return L;
  }

  // Marching squares over a value grid → line segments per level
  function contours(grid, cols, rows, step, levels, ctx, styleFor) {
    const paths = levels.map(() => new Path2D());
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = grid[j * cols + i], b = grid[j * cols + i + 1];
        const c = grid[(j + 1) * cols + i + 1], d = grid[(j + 1) * cols + i];
        const lo = Math.min(a, b, c, d), hi = Math.max(a, b, c, d);
        const x = i * step, y = j * step;
        for (let k = 0; k < levels.length; k++) {
          const l = levels[k];
          if (l < lo || l > hi) continue;
          const idx = (a > l ? 8 : 0) | (b > l ? 4 : 0) | (c > l ? 2 : 0) | (d > l ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          const top = [x + step * (l - a) / (b - a), y];
          const right = [x + step, y + step * (l - b) / (c - b)];
          const bottom = [x + step * (l - d) / (c - d), y + step];
          const left = [x, y + step * (l - a) / (d - a)];
          const p = paths[k];
          const seg = (p1, p2) => { p.moveTo(p1[0], p1[1]); p.lineTo(p2[0], p2[1]); };
          switch (idx) {
            case 1: case 14: seg(left, bottom); break;
            case 2: case 13: seg(bottom, right); break;
            case 3: case 12: seg(left, right); break;
            case 4: case 11: seg(top, right); break;
            case 6: case 9: seg(top, bottom); break;
            case 7: case 8: seg(left, top); break;
            case 5: seg(left, top); seg(bottom, right); break;
            case 10: seg(top, right); seg(left, bottom); break;
          }
        }
      }
    }
    paths.forEach((p, k) => { styleFor(k); ctx.stroke(p); });
  }

  function initLandscape(host) {
    const mode = host.dataset.mode || 'live'; // live | static
    const seed = parseInt(host.dataset.seed || '7', 10);
    const [minUDesk, minV] = (host.dataset.min || '0.66,0.55').split(',').map(Number);
    const levelsCount = parseInt(host.dataset.levels || '34', 10);
    const section = host.closest('.hero') || host.parentElement;
    const readStep = section.querySelector('[data-step]');
    const readLoss = section.querySelector('[data-loss]');

    const base = document.createElement('canvas');
    const over = document.createElement('canvas');
    base.className = 'lc-base';
    over.className = 'lc-over';
    host.append(base, over);
    const bctx = base.getContext('2d');
    const octx = over.getContext('2d');

    let w = 0, h = 0, dpr = 1, L = null, minU = minUDesk;
    let colors = {};
    let globalMin = { x: 0, y: 0, z: 0 };
    const trails = [];      // finished runs, drawn faintly
    let run = null;         // current run
    let pointer = null;
    let visible = true;
    let rafId = 0;

    const toU = (x) => x / w;
    const toV = (y) => y / h;
    const Lpx = (x, y) => L(toU(x), toV(y));

    function readColors() {
      colors = {
        ink: css('--ink'), faint: css('--ink-faint'), accent: css('--accent'),
        contour: css('--contour'), contourMajor: css('--contour-major'), bg: css('--bg'),
      };
    }

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth;
      h = host.clientHeight;
      [base, over].forEach((c) => { c.width = w * dpr; c.height = h * dpr; });
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // On narrow screens put the minimum lower-right, away from the text
      minU = w < 760 && host.dataset.minMobile ? Number(host.dataset.minMobile.split(',')[0]) : minUDesk;
      const mv = w < 760 && host.dataset.minMobile ? Number(host.dataset.minMobile.split(',')[1]) : minV;
      const zone = w < 760 ? 0 : parseFloat(host.dataset.zone || '0');
      L = makeLoss(seed, minU, mv, w / h, zone);
      drawContours();
      trails.length = 0;
      run = null;
    }

    function drawContours() {
      const step = w > 1200 ? 6 : 5;
      const cols = Math.ceil(w / step) + 1, rows = Math.ceil(h / step) + 1;
      const grid = new Float32Array(cols * rows);
      let lo = Infinity, gx = 0, gy = 0;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const z = Lpx(i * step, j * step);
          grid[j * cols + i] = z;
          if (z < lo) { lo = z; gx = i * step; gy = j * step; }
        }
      }
      // Refine the true minimum with a short descent from the best grid cell
      let p = { x: gx, y: gy };
      for (let k = 0; k < 200; k++) {
        const g = grad(p.x, p.y);
        p = { x: p.x - g.x * 20, y: p.y - g.y * 20 };
      }
      globalMin = { x: p.x, y: p.y, z: Lpx(p.x, p.y) };

      const sorted = Array.from(grid).sort((a, b) => a - b);
      const hi = sorted[Math.floor(sorted.length * 0.985)];
      const levels = [];
      for (let k = 1; k <= levelsCount; k++) {
        // Denser spacing near the bottom of wells, like the reference
        const t = k / (levelsCount + 1);
        levels.push(lo + (hi - lo) * Math.pow(t, 1.35));
      }

      bctx.clearRect(0, 0, w, h);
      bctx.lineJoin = 'round';
      contours(grid, cols, rows, step, levels, bctx, (k) => {
        const major = k % 5 === 4;
        bctx.strokeStyle = major ? colors.contourMajor : colors.contour;
        bctx.lineWidth = major ? 1 : 0.7;
      });
    }

    // Gradient in pixel space, scaled so steps behave the same at any size
    function grad(x, y) {
      const e = 0.6;
      const s = Math.min(w, h);
      return {
        x: (Lpx(x + e, y) - Lpx(x - e, y)) / (2 * e) * s / 1000,
        y: (Lpx(x, y + e) - Lpx(x, y - e)) / (2 * e) * s / 1000,
      };
    }

    // Run gradient descent with momentum and resample the path into evenly spaced dots
    function descend(x0, y0, eta = Math.min(w, h) * 0.3, beta = 0.95) {
      const s = Math.min(w, h);
      let x = x0, y = y0, vx = 0, vy = 0;
      const raw = [{ x, y, z: Lpx(x, y), step: 0 }];
      for (let k = 1; k < 900; k++) {
        const g = grad(x, y);
        vx = beta * vx - eta * g.x;
        vy = beta * vy - eta * g.y;
        // Cap the step so steep starts don't jump across the map
        const sp = Math.hypot(vx, vy), cap = s * 0.03;
        if (sp > cap) { vx *= cap / sp; vy *= cap / sp; }
        x += vx; y += vy;
        // Bounce off the edges so the whole path stays on the map
        if (x < 4 || x > w - 4) { vx = -vx * 0.5; x = Math.max(4, Math.min(w - 4, x)); }
        if (y < 4 || y > h - 4) { vy = -vy * 0.5; y = Math.max(4, Math.min(h - 4, y)); }
        raw.push({ x, y, z: Lpx(x, y), step: k });
        if (k > 30 && sp < 0.05 && Math.hypot(g.x, g.y) < 1e-4) break;
      }
      const gap = Math.max(8, Math.min(13, s / 60));
      const dots = [raw[0]];
      let need = gap;
      for (let i = 1; i < raw.length; i++) {
        const a = raw[i - 1], b = raw[i];
        const seg = Math.hypot(b.x - a.x, b.y - a.y);
        let pos = 0;
        while (seg - pos >= need) {
          pos += need;
          const t = pos / seg;
          dots.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, step: b.step });
          need = gap;
        }
        need -= seg - pos;
      }
      const end = raw[raw.length - 1];
      const isGlobal = Math.hypot(end.x - globalMin.x, end.y - globalMin.y) < s * 0.05;
      return { dots, end, steps: end.step, isGlobal, shown: 0, start: performance.now(), doneAt: 0, alpha: 1 };
    }

    function randomStart() {
      // Start somewhere high on the right-hand side, away from the text
      const xMin = w < 760 ? 0.08 : 0.42;
      for (let i = 0; i < 40; i++) {
        const x = w * (xMin + Math.random() * (0.95 - xMin));
        const y = h * (0.08 + Math.random() * 0.8);
        if (Math.hypot(x - globalMin.x, y - globalMin.y) > Math.min(w, h) * 0.4) return { x, y };
      }
      return { x: w * 0.92, y: h * 0.12 };
    }

    function startRun(x, y) {
      if (run) { run.alpha = 0.32; trails.push(run); }
      while (trails.length > 3) trails.shift();
      trails.forEach((t, i) => { t.alpha = 0.12 + 0.07 * i; });
      if (x != null) { run = descend(x, y); return; }
      // Auto-runs mostly show a successful descent; one in five may get stuck
      const allowLocal = trails.length > 0 && Math.random() < 0.2;
      for (let i = 0; i < 12; i++) {
        const p = randomStart();
        run = descend(p.x, p.y);
        if (run.isGlobal || allowLocal) break;
      }
    }

    function label(text, x, y, sub) {
      octx.font = 'italic 15px "Newsreader", Georgia, serif';
      octx.fillStyle = colors.faint;
      octx.textAlign = 'left';
      octx.fillText(text, x, y);
      if (sub) {
        const m = octx.measureText(text).width;
        octx.font = 'italic 10px "Newsreader", Georgia, serif';
        octx.fillText(sub, x + m + 1, y + 4);
      }
    }

    function drawRun(r, count, alpha) {
      octx.globalAlpha = alpha;
      octx.fillStyle = colors.ink;
      for (let i = 0; i < count; i++) {
        const d = r.dots[i];
        octx.beginPath();
        octx.arc(d.x, d.y, i === 0 ? 2.6 : 1.7, 0, Math.PI * 2);
        octx.fill();
      }
      octx.globalAlpha = 1;
    }

    function drawTarget(x, y, a) {
      octx.globalAlpha = a;
      octx.strokeStyle = colors.ink;
      octx.lineWidth = 0.8;
      octx.beginPath(); octx.arc(x, y, 9, 0, Math.PI * 2); octx.stroke();
      octx.beginPath(); octx.arc(x, y, 4, 0, Math.PI * 2); octx.stroke();
      octx.beginPath();
      octx.moveTo(x - 14, y); octx.lineTo(x - 10, y);
      octx.moveTo(x + 10, y); octx.lineTo(x + 14, y);
      octx.moveTo(x, y - 14); octx.lineTo(x, y - 10);
      octx.moveTo(x, y + 10); octx.lineTo(x, y + 14);
      octx.stroke();
      octx.fillStyle = colors.ink;
      octx.beginPath(); octx.arc(x, y, 1.6, 0, Math.PI * 2); octx.fill();
      octx.globalAlpha = 1;
    }

    function drawPointer() {
      if (!pointer) return;
      const g = grad(pointer.x, pointer.y);
      const m = Math.hypot(g.x, g.y);
      if (m < 1e-6) return;
      const len = Math.min(46, 8 + m * 9000);
      const ux = -g.x / m, uy = -g.y / m;
      const ex = pointer.x + ux * len, ey = pointer.y + uy * len;
      octx.strokeStyle = colors.accent;
      octx.fillStyle = colors.accent;
      octx.lineWidth = 1.4;
      octx.beginPath(); octx.moveTo(pointer.x, pointer.y); octx.lineTo(ex, ey); octx.stroke();
      octx.beginPath();
      octx.moveTo(ex + ux * 6, ey + uy * 6);
      octx.lineTo(ex - uy * 4, ey + ux * 4);
      octx.lineTo(ex + uy * 4, ey - ux * 4);
      octx.closePath(); octx.fill();
      octx.beginPath(); octx.arc(pointer.x, pointer.y, 2.4, 0, Math.PI * 2); octx.fill();
      label('−∇L', ex + 8, ey + 4);
    }

    function readout(r, i) {
      if (!readStep || !r) return;
      const d = r.dots[Math.max(0, i - 1)];
      readStep.textContent = String(d.step).padStart(3, '0');
      readLoss.textContent = Math.max(0, d.z - globalMin.z + 0.0021).toFixed(4);
      const done = i >= r.dots.length;
      section.classList.toggle('is-local', done && !r.isGlobal);
      section.classList.toggle('is-global', done && r.isGlobal);
    }

    function render(now) {
      octx.clearRect(0, 0, w, h);
      trails.forEach((t) => drawRun(t, t.dots.length, t.alpha));
      if (run) {
        const perSec = 34;
        const n = mode === 'static' || reduceMotion
          ? run.dots.length
          : Math.min(run.dots.length, 1 + Math.floor(((now - run.start) / 1000) * perSec));
        drawRun(run, n, 1);
        const s0 = run.dots[0];
        label('θ', s0.x + 8, s0.y - 6, '0');
        if (n < run.dots.length) {
          const head = run.dots[n - 1];
          octx.strokeStyle = colors.accent;
          octx.lineWidth = 1.5;
          octx.beginPath(); octx.arc(head.x, head.y, 5, 0, Math.PI * 2); octx.stroke();
        } else {
          if (!run.doneAt) run.doneAt = now;
          const a = mode === 'static' || reduceMotion ? 1 : Math.min(1, (now - run.doneAt) / 500);
          drawTarget(run.end.x, run.end.y, a);
          octx.globalAlpha = a;
          label(run.isGlobal ? 'θ*' : tr('local_min'), run.end.x + 14, run.end.y - 14);
          octx.globalAlpha = 1;
          if (mode === 'live' && !reduceMotion && now - run.doneAt > 4200) startRun();
        }
        readout(run, n);
      }
      drawPointer();
    }

    function loop(now) {
      render(now);
      if (visible && mode === 'live' && !reduceMotion) rafId = requestAnimationFrame(loop);
    }

    function kick() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    }

    // Interaction (live maps only): hover shows −∇L, click drops a new θ₀
    if (mode === 'live') {
      section.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = host.getBoundingClientRect();
        pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
        if (reduceMotion) render(performance.now());
      });
      section.addEventListener('pointerleave', () => { pointer = null; if (reduceMotion) render(performance.now()); });
      section.addEventListener('click', (e) => {
        if (e.target.closest('a, button, img, h1, p')) return;
        const r = host.getBoundingClientRect();
        startRun(e.clientX - r.left, e.clientY - r.top);
        section.classList.add('touched');
        if (reduceMotion) render(performance.now());
      });
    }

    let resizeT;
    window.addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        if (host.clientWidth === w && Math.abs(host.clientHeight - h) < 80) return; // ignore mobile URL-bar jitter
        size(); startRun(); kick();
      }, 150);
    });
    window.addEventListener('themechange', () => { readColors(); drawContours(); kick(); });

    function boot() {
      readColors();
      size();
      startRun();
      kick();
    }
    boot();
    if (document.fonts) document.fonts.ready.then(() => kick());

    if ('IntersectionObserver' in window && mode === 'live') {
      new IntersectionObserver(([entry]) => {
        const was = visible;
        visible = entry.isIntersecting;
        if (visible && !was) kick();
      }).observe(host);
    }
  }

  document.querySelectorAll('.landscape').forEach(initLandscape);

  /* ---------- Contact: the email is only assembled on click, so scrapers never see it ---------- */
  document.querySelectorAll('[data-email]').forEach((btn) => {
    const out = btn.querySelector('[data-email-out]');
    const label = () => {
      if (!btn.dataset.revealed) out.textContent = tr('email_show');
      else btn.title = tr('email_copy');
      const mail = btn.closest('.contact') && btn.closest('.contact').querySelector('.contact-mailto');
      if (mail) mail.textContent = tr('email_open');
    };
    label();
    window.addEventListener('langchange', label);
    btn.addEventListener('click', () => {
      const addr = btn.dataset.email.split(',').map((n) => String.fromCharCode(n ^ 7)).join('');
      if (btn.dataset.revealed) {
        try { navigator.clipboard.writeText(addr); out.textContent = tr('email_copied'); } catch (e) {}
        setTimeout(() => { out.textContent = addr; }, 1400);
        return;
      }
      btn.dataset.revealed = '1';
      out.textContent = addr;
      btn.querySelector('.arrow').textContent = '⧉';
      btn.setAttribute('aria-label', `Copy email address ${addr}`);
      btn.title = tr('email_copy');
      const mail = document.createElement('a');
      mail.href = `mailto:${addr}`;
      mail.className = 'contact-mailto';
      mail.textContent = tr('email_open');
      (btn.closest('.contact') || btn.parentElement).appendChild(mail);
    });
  });

  /* ---------- Easter egg: type "ice" ---------- */
  let typed = '';
  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    typed = (typed + e.key.toLowerCase()).slice(-3);
    if (typed === 'ice') snow();
  });

  function snow() {
    if (document.querySelector('.snow')) return; // user-triggered, so allowed even with reduced motion
    const c = document.createElement('canvas');
    c.className = 'snow';
    Object.assign(c.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: 300 });
    document.body.appendChild(c);
    const g = c.getContext('2d');
    const W = (c.width = window.innerWidth);
    const H = (c.height = window.innerHeight);
    const flakes = Array.from({ length: 140 }, () => ({
      x: Math.random() * W, y: Math.random() * -H, r: 1 + Math.random() * 3, s: 0.6 + Math.random() * 1.6, d: Math.random() * 6,
    }));
    const end = performance.now() + 7000;
    (function fall(now) {
      g.clearRect(0, 0, W, H);
      g.fillStyle = css('--ink-faint');
      flakes.forEach((p) => {
        p.y += p.s;
        p.x += Math.sin((now / 600) + p.d) * 0.6;
        if (p.y > H && now < end) p.y = -5;
        g.beginPath();
        g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        g.fill();
      });
      if (now < end + 4000) requestAnimationFrame(fall);
      else c.remove();
    })(performance.now());
  }

  console.log('%cθ ← θ − η∇L(θ)  ·  psst, type "tokens" on the page, or try tokenize("Ribizsár Benjámin") here.', 'font: italic 15px Georgia, serif; color: #8a7f6a');
})();
