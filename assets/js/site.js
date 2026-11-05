(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const vh = () => window.innerHeight;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- nav ----------
  const toggle = $('.nav-toggle');
  const menu = $('#mobile-menu');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
  };
  toggle.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  const links = $$('.nav-links a');
  const spy = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle('active', a.hash === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a) => { const s = $(a.hash); if (s) spy.observe(s); });

  // ---------- reveal ----------
  const reveal = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const sibs = $$('.reveal', e.target.parentElement);
    e.target.style.transitionDelay = `${Math.min(sibs.indexOf(e.target), 7) * 80}ms`;
    e.target.classList.add('in');
    reveal.unobserve(e.target);
  }), { threshold: 0.12 });
  $$('.reveal').forEach((el) => reveal.observe(el));

  // ---------- statement: split into words, light them up while scrolling ----------
  const words = $('[data-words]');
  let wordEls = [];
  const splitWords = () => {
    const parts = [...words.childNodes].map((n) => [n.textContent, n.nodeType === 1 && n.hasAttribute('data-hl')]);
    words.innerHTML = '';
    parts.forEach(([s, hl]) => s.split(/\s+/).filter(Boolean).forEach((w) => {
      const span = document.createElement('span');
      span.className = hl ? 'w hl' : 'w';
      span.textContent = w + ' ';
      words.appendChild(span);
    }));
    wordEls = $$('.w', words);
  };
  splitWords();

  // ---------- anatomy steps ----------
  const anatomy = $('.anatomy');
  const vis = $('.a-visual');
  const cols = $$('.a-col', vis);
  const items = $$('.a-steps li');
  const big = $('[data-big]', vis);
  const lbl = $('[data-label]', vis);
  const readouts = JSON.parse($('#readouts').textContent);
  let curStep = -1;
  const setStep = (s) => {
    if (s === curStep) return;
    curStep = s;
    vis.dataset.step = s;
    cols.forEach((c, i) => {
      c.classList.toggle('on', i <= s);
      c.classList.toggle('dim', s === 5 && i > 0 && i < 5);
    });
    items.forEach((li, i) => { li.classList.toggle('on', i === s); li.classList.toggle('done', i < s); });
    lbl.textContent = readouts[s][0];
    big.textContent = readouts[s][1];
    big.className = 'a-big num' + (s === 5 ? ' up' : '');
  };
  setStep(0);

  // Remember an explicit language choice so the root URL sends the visitor back here; keep the anchor.
  $$('.lang a').forEach((a) => a.addEventListener('click', (e) => {
    try { localStorage.setItem('dm-lang', a.dataset.lang); } catch (_) { /* private mode */ }
    if (location.hash) { e.preventDefault(); location.href = a.getAttribute('href') + location.hash; }
  }));

  // ---------- one rAF-throttled scroll loop ----------
  const device = $('[data-tilt]');
  const rmLine = $('.rm-line');
  let ticking = false;
  const update = () => {
    ticking = false;
    const h = vh();

    const dr = device.parentElement.getBoundingClientRect();
    device.style.setProperty('--p', reduced ? '1' : clamp(1 - (dr.top - h * 0.12) / (h * 0.55)).toFixed(3));

    const wr = words.getBoundingClientRect();
    const wp = clamp((h * 0.85 - wr.top) / (wr.height + h * 0.35));
    const lit = Math.round(wp * wordEls.length);
    wordEls.forEach((w, i) => w.classList.toggle('on', i < lit));

    const ar = anatomy.getBoundingClientRect();
    const ap = clamp(-ar.top / (ar.height - h));
    vis.style.setProperty('--ap', ap.toFixed(3));
    setStep(Math.min(5, Math.floor(ap * 6)));

    const rr = rmLine.getBoundingClientRect();
    rmLine.style.setProperty('--rp', clamp((h * 0.9 - rr.top) / (h * 0.5)).toFixed(3));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();

  // ---------- compare switch ----------
  const sw = $('.switch');
  const stage = $('.compare-stage');
  const setView = (view) => {
    sw.dataset.state = view;
    stage.dataset.state = view;
    $$('button', sw).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === view)));
    $('.view-tracker', stage).setAttribute('aria-hidden', String(view !== 'tracker'));
    $('.view-dm', stage).setAttribute('aria-hidden', String(view !== 'defimap'));
    if (view === 'defimap') $$('.view-dm .hb-t i', stage).forEach((i) => {
      i.style.animation = 'none'; void i.offsetWidth; i.style.animation = '';
    });
  };
  $$('button', sw).forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));

  // ---------- product tabs (arrow keys move focus) ----------
  const tabs = $$('.tabs [role="tab"]');
  const selectTab = (tab) => tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    $('#' + t.getAttribute('aria-controls')).hidden = !on;
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(next); next.focus();
    });
  });
  selectTab(tabs[0]);

  $('#year').textContent = new Date().getFullYear();
})();
