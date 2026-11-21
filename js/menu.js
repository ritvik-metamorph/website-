// The way round the site (18 Nov; the user, after weighing a dropdown against a full-screen menu: "go
// with the full screen menu", the nav "the attached version… menu on the left, logo in the center,
// talk to us in the right", and the change of version "something different from the navbar so that it
// can attract significant attention"). Three parts, all made here; boot() calls setupMenu().
//
// - The menu: Menu opens the whole screen to four places (the firm, expertise, the two corners), each
//   with one line saying what it is; the place under the pointer (or the finger, or the keyboard) shows
//   more on the right, with a still of it. It is a dialog: Escape or Close shuts it, focus stays in it.
// - The way in to a place: the moment a visitor shows interest (the menu opening, a place pointed at)
//   its page starts coming in the background: its HTML, then the scripts, styles and first pictures it
//   names, and the modules those import. Choosing it, the menu keeps the chosen name and lets the rest
//   go, and the page is left once the next one is in hand, or after 0.7 s at most, never longer; the
//   browser's page change (css/main.css) carries the night of the menu into the next page. The menu is
//   not a loading screen: a page opened any other way arrives the same.
// - The change of version: a button of its own, bottom left, a piece of the other version (on a simple
//   page the night with its light; on a creative page the paper with its ink), its lens a window onto
//   it. Choosing it, that world opens out from the button over the whole screen while the twin page
//   comes in, then the twin arrives.

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// each version's pages
const PAGES = {
  light: { home: 'index.html', about: 'about.html', team: 'index.html#team', services: 'index.html#services', sectors: 'sectors.html', creative: 'creative.html', investors: 'investors.html' },
  ink: { home: 'ink.html', about: 'ink-about.html', team: 'ink-about.html#team', services: 'ink-services.html', sectors: 'ink-sectors.html', creative: 'creative.html', investors: 'ink-investors.html' },
};
// the four places (copy for review; nothing in it is invented: the practice's thirty years, the
// founder's 48 sectors and the corner's nine kinds of work are the site's own facts)
const PLACES = [
  { id: 'firm', name: 'The firm', go: 'about', subs: [['About', 'about'], ['The team', 'team']], pic: 'assets/ink/name.jpg',
    line: 'Who we are, why we began, and what we hold to.', more: 'Our story, a practice of thirty years behind us, and the people who do the work.' },
  { id: 'expertise', name: 'Expertise', go: 'services', subs: [['Services', 'services'], ['Sectors', 'sectors']], pic: 'assets/ink/note-3-wings.jpg',
    line: 'What we do for founders and their families.', more: 'Fundraising and readiness, strategy, financial services and wealth, across forty-eight sectors.' },
  { id: 'creative', name: 'Creative corner', go: 'creative', pic: 'assets/corner/insomniac/thumb/iw-01.jpg', art: true,
    line: 'Upcoming artists, nine kinds of work, to discover and to hire.', more: 'The art of the day, the week and the month, then every piece, domain by domain.' },
  { id: 'investors', name: 'Investor corner', go: 'investors', pic: 'assets/ink/menu-investors.jpg',
    line: 'How money becomes wealth: where each rupee goes, and what it builds.', more: 'The four rings of a household’s money, and your family’s wealth picture.' },
];

export function setupMenu({ lenis, reduced, isTouch, local, setMode, savedMode, site, twin }) {
  const nav = $('.nav'), btn = $('.nav-menu');
  if (!nav || !btn) return { warm() {} };
  const keep = local && /frames=timer/.test(location.search) ? 'frames=timer' : '';
  const ver = site || (savedMode() === 'ink' ? 'ink' : 'light');
  const P = PAGES[ver];
  const here = location.pathname.split('/').pop() || 'index.html';
  const url = (key) => P[key];
  const isHere = (href) => href.split('#')[0] === here;
  const withKeep = (href) => {
    if (!keep) return href;
    const u = new URL(href, location.href);
    u.searchParams.set('frames', 'timer');
    return u.pathname.split('/').pop() + u.search + u.hash;
  };

  // ---------------------------------------------------------------- the way in: bringing a page in early
  // (a plain fetch, so it works in Safari too, which ignores the prefetch hint; the server's cache keeps
  // what came for the visit. Only this site's own files, a page's own and what its modules import)
  const got = new Map();
  const grab = (u, priority) => {
    const abs = new URL(u, location.href);
    if (abs.origin !== location.origin) return Promise.resolve('');
    const k = abs.pathname;
    if (!got.has(k)) got.set(k, fetch(abs.pathname, { priority, credentials: 'same-origin' }).then((r) => (r.ok ? r.text() : '')).catch(() => ''));
    return got.get(k);
  };
  const IMPORTS = /(?:import|from)\s*['"](\.{1,2}\/[^'"]+\.js)['"]/g;
  const grabModule = async (u, priority, depth) => {
    const text = await grab(u, priority);
    if (!text || depth <= 0) return;
    const base = new URL(u, location.href), next = [];
    for (const m of text.matchAll(IMPORTS)) next.push(new URL(m[1], base).pathname);
    await Promise.all(next.slice(0, 16).map((n) => grabModule(n, priority, depth - 1)));
  };
  const warmed = new Map();
  const warm = (href, priority = 'low') => {
    const page = href.split('#')[0];
    if (!page || page === here) return Promise.resolve();
    const k = page + (priority === 'high' ? '!' : '');
    if (warmed.has(k)) return warmed.get(k);
    const job = grab(page, priority).then((html) => {
      if (!html) return;
      const doc = new DOMParser().parseFromString(html, 'text/html'), base = new URL(page, location.href), jobs = [];
      // (whole addresses, so grab() can tell another site's file, the fonts, from ours and leave it alone)
      $$('link[rel="stylesheet"][href], link[rel="modulepreload"][href]', doc).forEach((l) => jobs.push(grab(new URL(l.getAttribute('href'), base).href, priority)));
      $$('script[type="module"][src]', doc).forEach((s) => jobs.push(grabModule(new URL(s.getAttribute('src'), base).pathname, priority, 3)));
      $$('script[src]:not([type="module"])', doc).forEach((s) => jobs.push(grab(new URL(s.getAttribute('src'), base).href, priority)));
      $$('img[src]:not([loading="lazy"])', doc).slice(0, 6).forEach((i) => jobs.push(grab(new URL(i.getAttribute('src'), base).href, priority)));
      return Promise.all(jobs);
    });
    warmed.set(k, job);
    return job;
  };

  // ---------------------------------------------------------------- the menu
  const mn = el('div', 'mn');
  mn.id = 'mn';
  mn.setAttribute('role', 'dialog');
  mn.setAttribute('aria-modal', 'true');
  mn.setAttribute('aria-label', 'Menu');
  mn.inert = true;
  const inner = el('div', 'mn-in'), list = el('ol', 'mn-list'), side = el('div', 'mn-side');
  const pic = el('div', 'mn-pic'), picA = el('img'), picB = el('img');
  picA.alt = picB.alt = '';
  pic.append(picA, picB);
  const sk = el('p', 'mn-k mn-swap'), sLine = el('p', 'mn-line mn-swap'), sMore = el('p', 'mn-more mn-swap'), sSubs = el('p', 'mn-subs mn-swap');
  side.append(pic, sk, sLine, sMore, sSubs);
  side.setAttribute('aria-live', 'polite');
  const foot = el('div', 'mn-foot');
  const talk = el('a', 'mn-talk', 'Talk to us');
  talk.href = '#contact'; talk.dataset.soon = '';
  const homeA = el('a', 'mn-home', 'Home');
  homeA.href = url('home');
  foot.append(talk, homeA, el('span', 'mn-c', `© ${new Date().getFullYear()} Metamorph Capital`));
  inner.append(list, side, foot);
  mn.append(inner);
  const items = PLACES.map((p, i) => {
    const li = el('li', 'mn-item');
    li.style.setProperty('--i', i);
    const a = el('a', 'mn-go');
    a.href = url(p.go);
    a.append(el('span', 'mn-n', String(i + 1).padStart(2, '0')), el('span', 'mn-name', p.name));
    const lineM = el('p', 'mn-line-m', p.line);
    li.append(a, lineM);
    if (p.subs) {
      const subsM = el('p', 'mn-subs-m');
      p.subs.forEach(([t, k]) => { const s = el('a', '', t); s.href = url(k); subsM.append(s); });
      li.append(subsM);
    }
    const on = p.go && [p.go, ...(p.subs || []).map((s) => s[1])].some((k) => isHere(url(k)) && !url(k).includes('#'));
    if (on) a.setAttribute('aria-current', 'page');
    list.append(li);
    return { p, li, a };
  });
  document.body.append(mn);
  const preload = (src) => { const i = new Image(); i.src = src; };

  let open = false, shown = null, front = picA, wasStopped = false, going = false;
  const select = (it, { quiet = false } = {}) => {
    if (!it || shown === it) return;
    shown = it;
    items.forEach((x) => x.li.classList.toggle('is-on', x === it));
    mn.classList.add('has-on');
    warm(url(it.p.go), 'high');
    it.p.subs?.forEach(([, k]) => warm(url(k), 'low'));
    const fill = () => {
      sk.textContent = `${String(PLACES.indexOf(it.p) + 1).padStart(2, '0')}  ${it.p.name}`;
      sLine.textContent = it.p.line;
      sMore.textContent = it.p.more;
      sSubs.textContent = '';
      it.p.subs?.forEach(([t, k]) => { const s = el('a', '', t); s.href = url(k); sSubs.append(s); });
      side.classList.remove('is-swapping');
    };
    // the still: the one behind takes the new picture and comes forward when it has it
    const back = front === picA ? picB : picA;
    back.classList.toggle('is-art', !!it.p.art);
    back.onload = () => { back.classList.add('is-on'); front.classList.remove('is-on'); front = back; };
    back.src = it.p.pic;
    if (quiet || reduced) fill();
    else { side.classList.add('is-swapping'); setTimeout(fill, 160); }
  };
  items.forEach((it) => {
    it.li.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') select(it); });
    it.a.addEventListener('focus', () => select(it));
  });

  // the focus kept to the menu, the button that closes it and the change of version
  const focusables = () => [btn, ...$$('a, button', mn).filter((n) => n.offsetParent !== null), $('.vx')].filter(Boolean);
  const onKey = (e) => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); btn.focus(); return; }
    if (e.key !== 'Tab') return;
    // (every Tab is kept here: the page behind is out of reach while the menu is open)
    const f = focusables(), i = f.indexOf(document.activeElement);
    e.preventDefault();
    f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
  };
  addEventListener('keydown', onKey);

  function setOpen(want, { instant = false, kbd = false } = {}) {
    if (want === open) return;
    open = want;
    mn.classList.toggle('is-instant', instant || reduced);
    document.documentElement.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    const t = $('.nav-menu-t', btn);
    if (t) t.textContent = open ? 'Close' : 'Menu';
    btn.setAttribute('aria-label', open ? 'Close the menu' : 'Open the menu');
    mn.inert = !open;
    if (open) {
      wasStopped = lenis.isStopped; lenis.stop();
      // the place this page belongs to is shown first; and every place's page starts coming, quietly
      const mine = items.find((x) => x.a.hasAttribute('aria-current')) || items[0];
      shown = null; select(mine, { quiet: true });
      items.forEach((x) => warm(url(x.p.go), 'low'));
      PLACES.forEach((p) => preload(p.pic));
      if (kbd) requestAnimationFrame(() => mine.a.focus({ preventScroll: true })); // (from the keyboard, focus goes in)
    } else {
      if (!wasStopped) lenis.start();
      mn.classList.remove('is-going', 'has-on');
      items.forEach((x) => x.li.classList.remove('is-on'));
      going = false;
    }
  }
  btn.addEventListener('click', (e) => setOpen(!open, { kbd: e.detail === 0 }));

  // choosing a place
  async function go(href, it) {
    if (going) return;
    if (isHere(href)) {
      // on this page already: close, then glide to it
      setOpen(false);
      const hash = href.split('#')[1];
      const target = hash && document.getElementById(hash);
      if (target) setTimeout(() => lenis.scrollTo(target, { duration: reduced ? 0 : 1.4 }), reduced ? 0 : 320);
      return;
    }
    going = true;
    if (it) select(it, { quiet: true });
    mn.classList.add('is-going');
    const ready = warm(href, 'high');
    // (the chosen name held for a breath; leave when the page is in hand, or at 0.7 s at most)
    await Promise.all([wait(reduced ? 0 : 280), Promise.race([ready, wait(700)])]);
    location.assign(withKeep(href));
  }
  mn.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || a.hasAttribute('data-soon')) return;
    const href = a.getAttribute('href');
    if (!href || /^(https?:|mailto:|tel:)/.test(href)) return;
    e.preventDefault();
    go(href, items.find((x) => x.a === a || x.li.contains(a)));
  });
  // (back to a page kept by the browser, the menu is found closed)
  addEventListener('pageshow', (e) => { if (e.persisted) { setOpen(false, { instant: true }); vxReset(); } });

  // ---------------------------------------------------------------- the change of version
  let target = (site ? (site === 'light' ? 'ink' : 'light') : (savedMode() === 'light' ? 'ink' : 'light'));
  const vx = el('button', `vx vx-to-${target}`);
  vx.type = 'button';
  const lens = el('span', 'vx-lens');
  lens.setAttribute('aria-hidden', 'true');
  lens.append(el('i', 'vx-glow'));
  const label = el('span', 'vx-t');
  // (placeholder copy: the user will write the words; "Light" and "Ink" are the version's own names)
  vx.append(lens, label);
  const word = () => {
    label.textContent = '';
    label.append(document.createTextNode('Enter '), el('em', '', target === 'light' ? 'Light' : 'Ink'));
    vx.className = `vx vx-to-${target}`;
    vx.setAttribute('aria-label', target === 'light' ? 'Enter Light, the creative version of the site' : 'Enter Ink, the simple version of the site');
  };
  word();
  document.body.append(vx);
  // (it shows itself once, a little after the page arrives: its lens opens and settles)
  if (!reduced) setTimeout(() => vx.classList.add('is-hello'), 2400);
  const wipe = el('div', `vx-wipe vx-wipe-${target}`);
  wipe.setAttribute('aria-hidden', 'true');
  document.body.append(wipe);
  function vxReset() { wipe.classList.remove('is-on'); vx.classList.remove('is-going'); }
  let vxGoing = false;
  if (twin) vx.addEventListener('pointerenter', () => warm(twin, 'high'));
  vx.addEventListener('click', async () => {
    if (vxGoing) return;
    if (!twin) { setMode(target === 'light'); target = target === 'light' ? 'ink' : 'light'; word(); return; } // (a page both versions share)
    vxGoing = true;
    try { localStorage.setItem('mm-mode', target); } catch (e) {}
    const r = vx.getBoundingClientRect();
    wipe.style.setProperty('--x', `${r.left + 26}px`);
    wipe.style.setProperty('--y', `${r.top + r.height / 2}px`);
    const ready = warm(twin, 'high');
    if (open) setOpen(false, { instant: true });
    requestAnimationFrame(() => { wipe.classList.add('is-on'); vx.classList.add('is-going'); });
    await Promise.all([wait(reduced ? 0 : 620), Promise.race([ready, wait(900)])]);
    const u = new URL(twin, location.href);
    if (keep) u.searchParams.set('frames', 'timer');
    if (location.hash && !u.hash) u.hash = location.hash;
    location.assign(u.pathname.split('/').pop() + u.search + u.hash);
  });

  if (local) window.__menu = { open: () => setOpen(true), close: () => setOpen(false), warm, got, items, vx };
  return { warm, open: () => setOpen(true), close: () => setOpen(false) };
}
