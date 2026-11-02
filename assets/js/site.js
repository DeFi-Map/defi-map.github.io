(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav: border on scroll, mobile menu, active section link.
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));

  // Reveal on scroll, staggered within a group.
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const sibs = $$('.reveal', e.target.parentElement);
      e.target.style.transitionDelay = `${Math.min(sibs.indexOf(e.target), 7) * 70}ms`;
      e.target.classList.add('in');
      reveal.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  $$('.reveal').forEach((el) => reveal.observe(el));

  // Hero waterfall and count-up.
  const wf = $('.wf');
  const countUp = (el) => {
    const end = Number(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    if (reduced) return;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min((t - t0) / 1100, 1);
      const v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = prefix + v.toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  requestAnimationFrame(() => {
    wf.classList.add('on');
    $$('[data-count]').forEach(countUp);
  });

  // Same position, two views.
  const sw = $('.switch');
  const stage = $('.compare-stage');
  const setView = (view) => {
    sw.dataset.state = view;
    stage.dataset.state = view;
    $$('button', sw).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === view)));
    $('.view-tracker', stage).setAttribute('aria-hidden', String(view !== 'tracker'));
    $('.view-dm', stage).setAttribute('aria-hidden', String(view !== 'defimap'));
    // Restart bar animation so the breakdown "builds" each time it is shown.
    if (view === 'defimap') $$('.view-dm .dm-track i', stage).forEach((i) => {
      i.style.animation = 'none'; void i.offsetWidth; i.style.animation = '';
    });
  };
  $$('button', sw).forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  setView('defimap');

  // Product screen tabs (arrow keys move between tabs).
  const tabs = $$('.tabs [role="tab"]');
  const selectTab = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
  };
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
