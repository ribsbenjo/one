/* ====================================================
   From tokens to vectors
   Each token gets a 16-d embedding built from hashed
   character n-grams (fastText-style), then we show:
   E (embedding rows), S = Ê Êᵀ (cosine similarity) and
   a 2-D PCA projection found by power iteration.
==================================================== */
(function () {
  const box = document.querySelector('.vec-lab');
  if (!box) return;

  const root = document.documentElement;
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const tr = (key, vars) => (window.i18n ? window.i18n.t(key, vars) : key);

  const D = 16;          // embedding dimension
  const MAX_TOKENS = 14; // keep the matrices readable

  const cE = box.querySelector('[data-vec="E"]');
  const cS = box.querySelector('[data-vec="S"]');
  const cP = box.querySelector('[data-vec="P"]');
  const readout = box.querySelector('[data-vec-readout]');

  /* ---------- Linear algebra helpers ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  // Pseudo-random Gaussian vector for one n-gram
  function gramVec(g) {
    const rnd = mulberry32(hash(g));
    const v = new Float64Array(D);
    for (let i = 0; i < D; i += 2) {
      const u = Math.max(1e-9, rnd()), w = rnd();
      const r = Math.sqrt(-2 * Math.log(u));
      v[i] = r * Math.cos(2 * Math.PI * w);
      if (i + 1 < D) v[i + 1] = r * Math.sin(2 * Math.PI * w);
    }
    return v;
  }
  const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
  const norm = (a) => Math.sqrt(dot(a, a));
  const scale = (a, k) => a.map((x) => x * k);

  // Embedding = normalised sum of the token's character 2–4-grams
  function embed(token) {
    const w = `<${token.trim().toLowerCase()}>`;
    const v = new Float64Array(D);
    for (let n = 2; n <= 4; n++) {
      for (let i = 0; i + n <= w.length; i++) {
        const g = gramVec(w.slice(i, i + n));
        for (let k = 0; k < D; k++) v[k] += g[k];
      }
    }
    const len = norm(v) || 1;
    return scale(v, 1 / len);
  }

  // Top-k principal components by power iteration with deflation
  function pca(X, k = 2) {
    const n = X.length;
    const mean = new Float64Array(D);
    X.forEach((x) => x.forEach((v, i) => { mean[i] += v / n; }));
    const Xc = X.map((x) => x.map((v, i) => v - mean[i]));
    // Covariance C = Xcᵀ Xc / n  (D × D)
    const C = Array.from({ length: D }, () => new Float64Array(D));
    Xc.forEach((x) => { for (let i = 0; i < D; i++) for (let j = 0; j < D; j++) C[i][j] += (x[i] * x[j]) / n; });
    const comps = [];
    for (let c = 0; c < k; c++) {
      let v = new Float64Array(D).map((_, i) => Math.sin(i + 1 + c * 7));
      for (let it = 0; it < 120; it++) {
        const w = new Float64Array(D);
        for (let i = 0; i < D; i++) for (let j = 0; j < D; j++) w[i] += C[i][j] * v[j];
        const len = norm(w);
        if (len < 1e-12) break;
        v = scale(w, 1 / len);
      }
      // λ = vᵀ C v, then deflate: C ← C − λ v vᵀ
      let lambda = 0;
      for (let i = 0; i < D; i++) for (let j = 0; j < D; j++) lambda += v[i] * C[i][j] * v[j];
      for (let i = 0; i < D; i++) for (let j = 0; j < D; j++) C[i][j] -= lambda * v[i] * v[j];
      comps.push(v);
    }
    return Xc.map((x) => comps.map((v) => dot(x, v)));
  }

  /* ---------- Drawing ---------- */
  let colors = {};
  function readColors() {
    colors = { ink: css('--ink'), faint: css('--ink-faint'), line: css('--line'), pos: css('--accent'), neg: css('--c-mom'), paper: css('--paper') };
  }

  function setup(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }

  // Diverging colour: blue for negative, accent for positive
  function cell(ctx, x, y, w, h, v, vmax) {
    const a = Math.min(1, Math.abs(v) / vmax);
    ctx.fillStyle = colors.paper;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 0.08 + 0.92 * a;
    ctx.fillStyle = v >= 0 ? colors.pos : colors.neg;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
  }

  const shown = (t) => t.replace(/^ /, '␣');
  const clip = (t, n) => (t.length > n ? t.slice(0, n - 1) + '…' : t);

  let state = { tokens: [], E: [], S: [], P: [] };

  function drawE() {
    const { ctx, w, h } = setup(cE);
    const { tokens, E } = state;
    if (!tokens.length) return;
    const left = 64, top = 4, rowH = Math.min(18, (h - top - 16) / tokens.length);
    const colW = (w - left - 4) / D;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';
    tokens.forEach((t, r) => {
      ctx.fillStyle = colors.ink;
      ctx.textAlign = 'right';
      ctx.fillText(clip(shown(t), 8), left - 8, top + r * rowH + rowH / 2);
      for (let c = 0; c < D; c++) cell(ctx, left + c * colW, top + r * rowH, colW - 1, rowH - 1, E[r][c], 0.55);
    });
    ctx.fillStyle = colors.faint;
    ctx.textAlign = 'left';
    ctx.fillText(`d = ${D}`, left, top + tokens.length * rowH + 9);
  }

  let hoverS = null;
  function drawS() {
    const { ctx, w, h } = setup(cS);
    const { tokens, S } = state;
    const n = tokens.length;
    if (!n) return;
    const size = Math.min(w - 64, h - 8);
    const left = 64, top = 4, c = size / n;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = hoverS && hoverS[0] === i ? colors.pos : colors.ink;
      ctx.fillText(clip(shown(tokens[i]), 8), left - 8, top + i * c + c / 2);
      for (let j = 0; j < n; j++) cell(ctx, left + j * c, top + i * c, c - 1, c - 1, S[i][j], 1);
    }
    if (hoverS) {
      const [i, j] = hoverS;
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(left + j * c + 0.5, top + i * c + 0.5, c - 2, c - 2);
    }
    cS._grid = { left, top, c, n };
  }

  function drawP() {
    const { ctx, w, h } = setup(cP);
    const { tokens, P } = state;
    if (tokens.length < 2) return;
    const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
    const pad = 26;
    const span = (a) => (Math.max(...a) - Math.min(...a)) || 1;
    const sx = (w - 2 * pad) / span(xs), sy = (h - 2 * pad) / span(ys);
    const k = Math.min(sx, sy);
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    const X = (v) => w / 2 + (v - cx) * k, Y = (v) => h / 2 - (v - cy) * k;
    // axes through the mean
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X(0), 6); ctx.lineTo(X(0), h - 6); ctx.moveTo(6, Y(0)); ctx.lineTo(w - 6, Y(0)); ctx.stroke();
    ctx.fillStyle = colors.faint;
    ctx.font = 'italic 13px "Newsreader", Georgia, serif';
    ctx.fillText('PC₁', w - 30, Y(0) - 6);
    ctx.fillText('PC₂', X(0) + 6, 16);
    ctx.font = '11px "JetBrains Mono", monospace';
    P.forEach((p, i) => {
      const x = X(p[0]), y = Y(p[1]);
      const hot = hoverS && (hoverS[0] === i || hoverS[1] === i);
      ctx.fillStyle = hot ? colors.pos : colors.ink;
      ctx.beginPath(); ctx.arc(x, y, hot ? 4.5 : 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(clip(shown(state.tokens[i]), 9), x + 6, y - 5);
    });
  }

  function drawAll() { drawE(); drawS(); drawP(); }

  function update(tokenList) {
    // Unique, non-whitespace tokens in order of appearance
    const seen = new Set();
    const tokens = [];
    tokenList.forEach((t) => {
      if (/^\s*$/.test(t)) return;
      const k = t.trim().toLowerCase();
      if (!seen.has(k) && tokens.length < MAX_TOKENS) { seen.add(k); tokens.push(t); }
    });
    const E = tokens.map(embed);
    const S = E.map((a) => E.map((b) => dot(a, b))); // rows are unit length → cosine similarity
    const P = tokens.length >= 2 ? pca(E) : [];
    state = { tokens, E, S, P };
    hoverS = null;
    setReadout();
    drawAll();
  }

  function setReadout() {
    if (!readout) return;
    if (hoverS) {
      const [i, j] = hoverS;
      readout.innerHTML = `cos(<b>“${shown(state.tokens[i])}”</b>, <b>“${shown(state.tokens[j])}”</b>) = <b>${state.S[i][j].toFixed(2)}</b>`;
    } else {
      readout.textContent = tr('vec_hint');
    }
  }

  cS.addEventListener('mousemove', (e) => {
    const g = cS._grid;
    if (!g) return;
    const r = cS.getBoundingClientRect();
    const j = Math.floor((e.clientX - r.left - g.left) / g.c);
    const i = Math.floor((e.clientY - r.top - g.top) / g.c);
    const next = i >= 0 && j >= 0 && i < g.n && j < g.n ? [i, j] : null;
    if (String(next) !== String(hoverS)) { hoverS = next; setReadout(); drawS(); drawP(); }
  });
  cS.addEventListener('mouseleave', () => { hoverS = null; setReadout(); drawS(); drawP(); });

  window.addEventListener('tokens:update', (e) => update(e.detail.tokens));
  window.addEventListener('resize', drawAll);
  window.addEventListener('themechange', () => { readColors(); drawAll(); });
  window.addEventListener('langchange', setReadout);

  readColors();
  // tokens.js may have tokenised the default text before this script loaded
  if (window.__lastTokens) update(window.__lastTokens);
})();
