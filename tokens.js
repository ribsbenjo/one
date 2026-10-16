/* ====================================================
   Tokenizer view: the "Tokens" button (or typing "tokens")
   shows the page the way a language model reads it, and
   the playground tokenizes whatever you type. A toy BPE-style tokenizer:
   GPT-2-like pre-tokenisation, common English pieces kept
   whole, long words split into sub-words, and accented
   letters (á, é, ő…) falling back to byte-level tokens.
==================================================== */
(function () {
  const TRIGGER = 'tokens';
  const tr = (key) => (window.i18n ? window.i18n.t(key) : key);

  // Pre-tokenisation: contractions, words with their leading space, numbers, punctuation, whitespace
  const PRE = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;
  const SUFFIXES = ['ization', 'ation', 'ition', 'ment', 'ness', 'ship', 'able', 'ible', 'ally', 'tion', 'sion', 'ing', 'ity', 'ive', 'ous', 'ers', 'est', 'ful', 'ed', 'er', 'ly', 'es', 'al', 'ic', 's'];
  const COMMON = new Set(('the of and to a in is it you that he was for on are with as i his they be at one have this from or had by not word but what some we can out other were all there when up use your how said an each she which do their time if will way about many then them write would like so these her long make thing see him two has look more day could go come did number sound no most people my over know water than call first who may down side been now find any new work part take get place made live where after back little only round man year came show every good me give our under name very through just form sentence great think say help low line differ turn cause much mean before move right boy old too same tell does set three want air well also play small end put home read hand port large spell add even land here must big high such follow act why ask men change went light kind off need house picture try us again animal point mother world near build self earth father student project data code model learning teaching university economics college building automation workflows').split(' '));
  const ASCII = /^[\x00-\x7f]*$/;

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) % 100256;
  }

  function splitWord(w) {
    // w has no leading space here
    if (!w) return [];
    if (!ASCII.test(w)) {
      // Byte-level fallback: ASCII runs stay together, each accented letter becomes its own token(s)
      const out = [];
      let run = '';
      for (const ch of w) {
        if (ASCII.test(ch)) run += ch;
        else {
          if (run) { out.push(...splitWord(run)); run = ''; }
          out.push(ch);
        }
      }
      if (run) out.push(...splitWord(run));
      return out;
    }
    const lower = w.toLowerCase();
    if (w.length <= 4 || COMMON.has(lower)) return [w];
    for (const suf of SUFFIXES) {
      if (lower.endsWith(suf) && w.length - suf.length >= 3) {
        return [...splitWord(w.slice(0, -suf.length)), w.slice(-suf.length)];
      }
    }
    if (w.length <= 7) return [w];
    // Long stems: roughly 4-character merges
    const out = [];
    for (let i = 0; i < w.length; i += 4) out.push(w.slice(i, i + 4));
    if (out.length > 1 && out[out.length - 1].length < 2) out[out.length - 2] += out.pop();
    return out;
  }

  function tokenize(text) {
    const tokens = [];
    for (const m of text.matchAll(PRE)) {
      const piece = m[0];
      if (/^\s+$/.test(piece)) { tokens.push(piece); continue; }
      if (/^ ?\p{N}+$/u.test(piece)) {
        // Numbers are chunked in groups of up to three digits
        const lead = piece[0] === ' ' ? ' ' : '';
        const digits = piece.trim();
        for (let i = 0; i < digits.length; i += 3) tokens.push((i === 0 ? lead : '') + digits.slice(i, i + 3));
        continue;
      }
      if (/^ ?\p{L}+$/u.test(piece)) {
        const lead = piece[0] === ' ';
        const parts = splitWord(lead ? piece.slice(1) : piece);
        if (lead && parts.length) parts[0] = ' ' + parts[0];
        tokens.push(...parts);
        continue;
      }
      if (!ASCII.test(piece)) {
        // Emoji and other non-ASCII symbols fall back to byte-level pieces
        const lead = piece[0] === ' ' ? ' ' : '';
        [...piece.trimStart()].forEach((ch, i) => tokens.push((i === 0 ? lead : '') + ch));
        continue;
      }
      tokens.push(piece);
    }
    return tokens;
  }

  function renderTokens(target, text, offset = 0) {
    let k = offset, count = 0;
    tokenize(text).forEach((t) => {
      count++;
      if (/^\s+$/.test(t)) { target.appendChild(document.createTextNode(t)); return; }
      const s = document.createElement('span');
      s.className = `tok tok-${k++ % 5}`;
      s.textContent = t;
      s.dataset.id = hash(t);
      target.appendChild(s);
    });
    return { count, next: k };
  }

  /* ---------- Page overlay ---------- */
  const SKIP = 'script, style, canvas, svg, noscript, textarea, input, select, .tok-panel, .tok-play';
  let active = false;
  let wrapped = [];
  let panel = null;

  function collectTextNodes() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (n.parentElement.closest(SKIP)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  function enable() {
    let count = 0, chars = 0, k = 0;
    collectTextNodes().forEach((node) => {
      const text = node.nodeValue;
      const wrap = document.createElement('span');
      wrap.className = 'tok-wrap';
      const r = renderTokens(wrap, text, k);
      k = r.next; count += r.count; chars += text.length;
      node.replaceWith(wrap);
      wrapped.push([wrap, text]);
    });

    // Scanning wave: tokens light up top to bottom
    const all = document.querySelectorAll('.tok-wrap .tok');
    const vh = window.innerHeight;
    all.forEach((el) => {
      const y = el.getBoundingClientRect().top;
      const d = y < -200 || y > vh + 200 ? 0 : Math.max(0, y) / vh * 0.9;
      el.style.setProperty('--d', `${d.toFixed(3)}s`);
    });

    panel = document.createElement('div');
    panel.className = 'tok-panel';
    panel.setAttribute('role', 'status');
    const pct = (count / 200000) * 100;
    panel.innerHTML = `
      <div class="tok-head">
        <div class="tok-title">${tr('tok_view')} <span>· ${tr('tok_toy')}</span></div>
        <button type="button" class="tok-close" aria-label="${tr('tok_close')}">×</button>
      </div>
      <div class="tok-stats"><b data-count>0</b> ${tr('tok_tokens')} · <b>${(chars / count).toFixed(1)}</b> ${tr('tok_ratio')}</div>
      <div class="tok-ctx"><div style="width:${Math.max(0.6, Math.min(100, pct))}%"></div></div>
      <div class="tok-sub">${pct.toFixed(1)}% ${tr('tok_ctx')}</div>
      <div class="tok-hover">${tr('tok_hover')}</div>
      <div class="tok-switch" role="group" aria-label="Show tokens as">
        <button type="button" data-mode="text" aria-pressed="true">${tr('tok_text')}</button>
        <button type="button" data-mode="ids" aria-pressed="false">${tr('tok_ids')}</button>
      </div>`;
    document.body.appendChild(panel);
    panel.querySelector('.tok-close').addEventListener('click', disable);
    panel.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

    active = true;
    // Count up the token total
    const countEl = panel.querySelector('[data-count]');
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - t0) / 900);
      countEl.textContent = Math.round(count * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US');
      if (p < 1 && active) requestAnimationFrame(tick);
    })(t0);

    document.documentElement.classList.add('tok-on');
    syncButtons();
  }

  function setMode(mode) {
    document.documentElement.classList.toggle('tok-ids', mode === 'ids');
    document.querySelectorAll('.tok-switch [data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  }

  function syncButtons() {
    document.querySelectorAll('[data-tok-toggle]').forEach((b) => {
      b.setAttribute('aria-pressed', String(active));
      b.classList.toggle('on', active);
    });
  }

  function disable() {
    wrapped.forEach(([wrap, text]) => wrap.replaceWith(document.createTextNode(text)));
    wrapped = [];
    if (panel) panel.remove();
    panel = null;
    document.documentElement.classList.remove('tok-on', 'tok-ids');
    active = false;
    syncButtons();
  }

  const toggle = () => (active ? disable() : enable());

  document.querySelectorAll('[data-tok-toggle]').forEach((b) => b.addEventListener('click', toggle));
  const titleButtons = () => document.querySelectorAll('.tok-toggle').forEach((b) => { b.title = tr('tok_title'); });
  titleButtons();
  window.addEventListener('langchange', titleButtons);

  document.addEventListener('mouseover', (e) => {
    if (!active || !panel) return;
    const t = e.target.closest && e.target.closest('.tok-wrap .tok');
    if (!t) return;
    const shown = t.textContent.replace(/ /g, '␣');
    panel.querySelector('.tok-hover').innerHTML = `<code>“${shown.replace(/</g, '&lt;')}”</code> → id <b>${t.dataset.id}</b>`;
  });

  let typed = '';
  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.key === 'Escape' && active) { disable(); return; }
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-TRIGGER.length);
    if (typed === TRIGGER) { typed = ''; toggle(); }
  });

  /* ---------- Playground ---------- */
  const play = document.querySelector('.tok-play');
  if (play) {
    const input = play.querySelector('.tok-input');
    const out = play.querySelector('.tok-out');
    const stat = (k) => play.querySelector(`[data-stat="${k}"]`);
    const draw = () => {
      out.textContent = '';
      const text = input.value;
      const { count } = renderTokens(out, text);
      stat('tokens').textContent = count.toLocaleString('en-US');
      stat('chars').textContent = text.length.toLocaleString('en-US');
      stat('ratio').textContent = count ? (text.length / count).toFixed(1) : '0';
    };
    input.addEventListener('input', draw);
    play.querySelectorAll('[data-sample]').forEach((b) => b.addEventListener('click', () => {
      input.value = b.dataset.sample;
      draw();
    }));
    play.querySelectorAll('[data-play-mode]').forEach((b) => b.addEventListener('click', () => {
      play.classList.toggle('show-ids', b.dataset.playMode === 'ids');
      play.querySelectorAll('[data-play-mode]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    }));
    draw();
  }

  // For the curious: window.tokenize("Ribizsár Benjámin")
  window.tokenize = (s) => tokenize(String(s)).map((t) => ({ token: t, id: hash(t) }));
})();
