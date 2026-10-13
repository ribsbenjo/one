/* ====================================================
   Shared site script
   - theme toggle (paper / chalkboard)
   - scroll progress, reveal on scroll, active nav link
   - count-up stats
   - interactive function plot in the banner
   - easter egg: type "ice" for snowfall
==================================================== */
(function () {
  const root = document.documentElement;
  root.classList.remove('no-js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Theme toggle ---------- */
  const toggle = document.querySelector('.theme-toggle');
  function setToggleLabel() {
    if (!toggle) return;
    const dark = root.dataset.theme === 'dark';
    toggle.textContent = dark ? '◑ Paper' : '◐ Chalkboard';
    toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  setToggleLabel();
  if (toggle) {
    toggle.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
      setToggleLabel();
      window.dispatchEvent(new Event('themechange'));
    });
  }

  /* ---------- Scroll progress ---------- */
  const bar = document.querySelector('.progress');
  if (bar) {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
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
    // Nothing is highlighted while you're up in the banner
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

  /* ---------- Banner plot ---------- */
  const plot = document.querySelector('canvas.plot');
  if (plot) initPlot(plot);

  function initPlot(canvas) {
    const ctx = canvas.getContext('2d');
    const banner = canvas.parentElement;
    const eqEl = banner.querySelector('.equation');
    const UNIT = 56; // px per unit (two graph-paper squares)

    // Function families: click the banner to cycle through them
    const families = [
      { name: 'sin', f: (x) => Math.sin(x), label: (a, k) => `f(x) = <b>${a}</b>·sin(<b>${k}</b>x + t)` },
      { name: 'square', label: (a, k) => `f(x) = <b>${a}</b>·Σ sin((2n−1)<b>${k}</b>x)/(2n−1)`,
        f: (x) => { let s = 0; for (let n = 1; n <= 9; n += 2) s += Math.sin(n * x) / n; return s * 4 / Math.PI * 0.8; } },
      { name: 'saw', label: (a, k) => `f(x) = <b>${a}</b>·Σ (−1)ⁿ⁺¹ sin(n<b>${k}</b>x)/n`,
        f: (x) => { let s = 0; for (let n = 1; n <= 8; n++) s += (n % 2 ? 1 : -1) * Math.sin(n * x) / n; return s * 0.65; } },
      { name: 'beat', label: (a, k) => `f(x) = <b>${a}</b>·sin(<b>${k}</b>x)·cos(x/3)`,
        f: (x) => Math.sin(x) * Math.cos(x / 3.2) },
    ];
    let fam = 0;

    let w = 0, h = 0, dpr = 1;
    let region = 300; // twice the headline's vertical centre, in px
    let colors = {};
    const target = { a: 1.2, k: 1.1 };
    const cur = { a: 1.2, k: 1.1 };
    let t = 0;
    let running = true;
    let last = performance.now();

    function readColors() {
      colors = { ink: css('--ink'), soft: css('--ink-faint'), accent: css('--accent'), blue: css('--blue'), line: css('--line') };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = banner.clientWidth;
      h = banner.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Centre the x-axis on the headline so the curve weaves behind the name
      const h1 = banner.querySelector('h1');
      if (h1) {
        const r = h1.getBoundingClientRect();
        region = (r.top + r.height / 2 - banner.getBoundingClientRect().top) * 2;
      } else {
        region = h * 0.6;
      }
      if (reduceMotion) draw();
    }

    function f(x) {
      return families[fam].f(cur.k * x + t);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      // Keep the plot in the empty space above the text
      const oy = Math.round(region / 2);                          // x-axis position
      const ox = Math.round(w * (w < 720 ? 0.6 : 0.72));           // y-axis position
      const amp = Math.min(region * 0.3, 170) / (1.6 * 1.1) / UNIT;  // max |a·f(x)| ≈ 1.6·1.1

      // Axes
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, oy); ctx.lineTo(w, oy);
      ctx.moveTo(ox, 0); ctx.lineTo(ox, h);
      ctx.stroke();

      // Ticks + labels
      ctx.fillStyle = colors.soft;
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      for (let px = ox % UNIT; px < w; px += UNIT) {
        ctx.fillRect(px - 0.5, oy - 4, 1, 8);
        const n = Math.round((px - ox) / UNIT);
        if (n !== 0 && n % 2 === 0) ctx.fillText(n, px, oy + 18);
      }
      ctx.textAlign = 'left';
      ctx.fillText('x', w - 16, oy - 8);
      ctx.fillText('y', ox + 8, 14);

      // Derivative (dashed blue)
      const step = 3;
      ctx.setLineDash([5, 6]);
      ctx.strokeStyle = colors.blue;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let px = 0; px <= w; px += step) {
        const x = (px - ox) / UNIT;
        const d = (f(x + 0.01) - f(x - 0.01)) / 0.02 * cur.a * amp * 0.35;
        const py = oy - d * UNIT;
        px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Main curve
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let px = 0; px <= w; px += step) {
        const x = (px - ox) / UNIT;
        const py = oy - f(x) * cur.a * amp * UNIT;
        px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Tracing point with projections and tangent
      const tx = Math.sin(t * 0.35) * (w * 0.32) / UNIT;
      const tpx = ox + tx * UNIT;
      const tpy = oy - f(tx) * cur.a * amp * UNIT;
      const slope = (f(tx + 0.01) - f(tx - 0.01)) / 0.02 * cur.a * amp;

      ctx.strokeStyle = colors.soft;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(tpx, tpy); ctx.lineTo(tpx, oy);
      ctx.moveTo(tpx, tpy); ctx.lineTo(ox, tpy);
      ctx.stroke();
      ctx.setLineDash([]);

      const len = 70 / Math.sqrt(1 + slope * slope);
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tpx - len, tpy + slope * len);
      ctx.lineTo(tpx + len, tpy - slope * len);
      ctx.stroke();

      ctx.fillStyle = colors.accent;
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tpx, tpy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colors.ink;
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText(`(${tx.toFixed(2)}, ${(f(tx) * cur.a).toFixed(2)})`, tpx + 12, tpy - 12);

      if (eqEl) {
        eqEl.innerHTML = families[fam].label(cur.a.toFixed(2), cur.k.toFixed(2)) +
          ` &nbsp;<span style="color:${colors.blue}">- - f′(x)</span>`;
      }
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt * 0.9;
      cur.a += (target.a - cur.a) * 0.06;
      cur.k += (target.k - cur.k) * 0.06;
      draw();
      if (running) requestAnimationFrame(frame);
    }

    banner.addEventListener('pointermove', (e) => {
      const r = banner.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      target.k = 0.5 + nx * 2.2;
      target.a = 1.6 - ny * 1.2;
      if (reduceMotion) { cur.a = target.a; cur.k = target.k; draw(); }
    });

    banner.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      fam = (fam + 1) % families.length;
      if (reduceMotion) draw();
    });

    window.addEventListener('resize', resize);
    window.addEventListener('themechange', () => { readColors(); if (reduceMotion) draw(); });

    readColors();
    resize();
    if (document.fonts) document.fonts.ready.then(resize);

    if (reduceMotion) {
      t = 1;
      draw();
      return;
    }

    // Only animate while the banner is on screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        const was = running;
        running = entry.isIntersecting;
        if (running && !was) { last = performance.now(); requestAnimationFrame(frame); }
      }).observe(banner);
    }
    requestAnimationFrame(frame);
  }

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
      g.fillStyle = css('--blue');
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

  console.log('%cHey, you opened the console 👋 Try typing "ice" on the page.', 'font: 600 14px monospace; color: #ff4d1a');
})();
