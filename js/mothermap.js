// The foot of every page (18 Nov, later; the file keeps its first name, the mother map). The user, after the
// transmission: "dont copy, build smthng of our own and footer should end in 3/4th of page, we dont want a separate
// section for a footer, put a site index too". So it is not a section of its own: it carries on the ground the page
// ends on, under one hairline, and is never taller than three quarters of a screen.
// - The site index: every page of this site, one column a page, and the places on each.
// - Under it the company's wordmark, large: Metamorph, set in type until the client's logo arrives. (Its letters
//   re-sorted into "Mother map" for a while; the user: "just the wordmark of the company no mothermap thing".)
// - The way in's butterfly comes back and settles on its h (js/foot-butterfly.js).
// - The last line: ©, and back to the top.
// - Above it all (19 Nov), the way on: the next page to see (js/onward.js).
// The transmission before it (js/transmission.js) shows with ?foot=transmission, the signature with ?foot=signature.
import { setupFootButterfly } from './foot-butterfly.js';
import { setupOnward } from './onward.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

// the index: [page, address, [[place, address], ...]] for each site
const CORNER = ['Creative corner', 'creative.html', [['The works', 'creative.html#works'], ['Saved', 'creative.html#saved']]];
const INDEX = {
  light: [
    ['Home', 'index.html', [['The way in', 'index.html?intro'], ['Services', 'index.html#services'], ['Team', 'index.html#team']]],
    ['About', 'about.html', [['Our story', 'about.html#story'], ['Four stages', 'about.html#stages'], ['The thread', 'about.html#thread'], ['How we decide', 'about.html#decide'], ['Who we are', 'about.html#who']]],
    ['Sectors', 'sectors.html', [['The loom', 'sectors.html#loom'], ['By family', 'sectors.html#families'], ['What the grid shows', 'sectors.html#finds']]],
    CORNER,
    ['Investor corner', 'investors.html', [['Four rings', 'investors.html'], ['Spending', 'investors.html#spend'], ['Saving or investing', 'investors.html#keep'], ['The wealth picture', 'investors.html#picture']]],
  ],
  ink: [
    // (21 Nov: the simple home is the hero alone; its firm, services, conditions and team are on About, Services, Sectors)
    ['Home', 'ink.html', []],
    ['About', 'ink-about.html', [['Our story', 'ink-about.html#story'], ['Four stages', 'ink-about.html#stages'], ['The deal', 'ink-about.html#deal'], ['The practice', 'ink-about.html#practice'], ['Values', 'ink-about.html#values'], ['Who we are', 'ink-about.html#who'], ['Team', 'ink-about.html#team']]],
    ['Services', 'ink-services.html', [['Fundraising', 'ink-services.html#ikv-1'], ['Wealth management', 'ink-services.html#ikv-2'], ['Strategy', 'ink-services.html#ikv-3'], ['Financial services', 'ink-services.html#ikv-4']]],
    ['Sectors', 'ink-sectors.html', [['The grid', 'ink-sectors.html'], ['By family', 'ink-sectors.html#families']]],
    CORNER,
    ['Investor corner', 'ink-investors.html', [['Four rings', 'ink-investors.html'], ['Spending', 'ink-investors.html#spend'], ['Saving or investing', 'ink-investors.html#keep'], ['The wealth picture', 'ink-investors.html#picture']]],
  ],
};

const NAME = 'Metamorph'; // (the wordmark, typeset until the client's logo arrives)

export function setupMotherMap({ register, reduced, lenis, menu, local }) {
  const main = document.querySelector('main');
  // (a page may go without it: the simple home, one screen, data-foot="none" on its main)
  if (!main || main.dataset.foot === 'none' || document.querySelector('.fm, .tx, .sig')) return null;
  const { gsap } = window;
  const root = document.documentElement;
  const here = location.pathname.split('/').pop() || 'index.html';
  const pages = INDEX[root.dataset.site === 'ink' ? 'ink' : 'light'];

  const foot = el('footer', 'fm');
  foot.setAttribute('aria-label', 'Metamorph Capital: the site');
  const inner = el('div', 'fm-in');

  // ---- the index
  const index = el('nav', 'fm-index');
  index.setAttribute('aria-label', 'Site index');
  index.style.setProperty('--fm-cols', pages.length);
  const lead = el('div', 'fm-lead');
  lead.append(el('p', 'fm-say', 'Investment banking and advisory for founders, backed by a 30-year chartered accountancy practice.'));
  const talk = el('a', 'fm-talk', 'Talk to us');
  talk.href = '#contact';
  talk.dataset.soon = '';
  lead.append(talk);
  index.append(lead);
  const targets = [];
  pages.forEach(([name, href, places]) => {
    const col = el('div', 'fm-col');
    const h = el('h3');
    const a = el('a', '', name);
    a.href = href;
    if (href === here) a.setAttribute('aria-current', 'page');
    h.append(a);
    const ul = el('ul');
    places.forEach(([t, ph]) => {
      const li = el('li');
      const pa = el('a', '', t);
      pa.href = ph;
      const [file, id] = ph.split('#');
      if (file === here && id) targets.push(id);
      li.append(pa);
      ul.append(li);
    });
    col.append(h, ul);
    index.append(col);
  });

  // ---- the wordmark (a letter a span only so the butterfly can find the h)
  const word = el('p', 'fm-word');
  word.setAttribute('role', 'img'); // (read as one name, the company's mark)
  word.setAttribute('aria-label', 'Metamorph');
  const letters = [...NAME].map((ch) => { const s = el('span', 'fm-l', ch); s.setAttribute('aria-hidden', 'true'); word.append(s); return s; });

  // ---- the last line
  const last = el('div', 'fm-last');
  const top = el('button', 'fm-top', 'Back to the top');
  top.type = 'button';
  last.append(el('p', 'fm-copy', `© ${new Date().getFullYear()} Metamorph Capital`), top);

  inner.append(index, word, last);
  foot.append(inner);
  // the way on, before the index: the next page to see (js/onward.js)
  setupOnward({ foot, inner, reduced, menu, local });
  main.after(foot);
  root.classList.add('has-sig');

  // the butterfly that comes back, on the h
  const fly = setupFootButterfly({ foot, word, h: letters[8], reduced, live: root.dataset.site !== 'ink' });

  // ---- the name is set as large as the line allows, never so large the foot passes three quarters of a screen
  const fit = () => {
    word.style.fontSize = '100px';
    const w = letters[letters.length - 1].getBoundingClientRect().right - letters[0].getBoundingClientRect().left || 1;
    const room = word.clientWidth * 0.99;
    const rest = inner.offsetHeight - word.offsetHeight; // (the index and the last line; the way on above them is not counted)
    const byH = Math.max(48, (innerHeight * 0.75 - rest) / 1.02);
    word.style.fontSize = `${Math.floor(Math.min((100 * room) / w, byH))}px`;
    fly.layout();
  };

  // ---- moving: back to the top, and to a place on this page, travel there; a place on another page is found
  // once that page has laid itself out
  top.addEventListener('click', () => lenis.scrollTo(0, { duration: reduced ? 0 : 2.2 }));
  index.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const [file, id] = a.getAttribute('href').split('#');
    const t = file === here && id && document.getElementById(id);
    if (!t) return;
    e.preventDefault();
    history.replaceState(history.state, '', `#${id}`);
    lenis.scrollTo(t, { duration: reduced ? 0 : 1.8 });
  });
  const arrive = location.hash.slice(1);
  if (arrive && targets.includes(arrive)) {
    const go = () => { window.ScrollTrigger?.refresh(); const t = document.getElementById(arrive); if (t) lenis.scrollTo(t, { immediate: true, force: true }); };
    if (document.readyState === 'complete') setTimeout(go, 300);
    else addEventListener('load', () => setTimeout(go, 300), { once: true });
  }

  // ---- its ground is the page's own: read off whatever ends the page, so there is no edge; ink on paper,
  // light on night
  // (19 Nov, the user: "Why is the footer getting grayish when you reach the bottom"; since the nav's tab became glass,
  // the foot, reading the ground just above its top as that top passed under the tab, took the tab's see-through night
  // for the page's and kept it: grey over the paper. So only a solid colour is a ground, and what is fixed over the page,
  // the nav and the change-of-version button, is looked through)
  const opaque = (c) => {
    if (!c || c === 'transparent') return false;
    const v = (c.match(/rgba?\(([^)]+)\)/) || [])[1];
    if (!v) return false;
    const p = v.split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    return p.length < 4 || p[3] >= 0.98;
  };
  const fixedOver = (el) => !!el.closest('.nav, .vx, .mn, .toast') || getComputedStyle(el).position === 'fixed';
  const groundAbove = (y) => {
    let e = document.elementsFromPoint(innerWidth / 2, y).find((el) => !fixedOver(el)) || null;
    while (e && e !== document.documentElement && e !== foot) {
      const c = getComputedStyle(e).backgroundColor;
      if (opaque(c)) return c;
      e = e.parentElement;
    }
    // (then the body's, then the page's own root, which is where the night is painted on several pages)
    const b = getComputedStyle(document.body).backgroundColor;
    if (opaque(b)) return b;
    const h = getComputedStyle(document.documentElement).backgroundColor;
    return opaque(h) ? h : '';
  };
  // the page's last section: not something floating that was added at the end of it (the Corner's saved chip, slate
  // blue, was read as the page's end and turned the foot grey-blue)
  const lastSection = () => [...main.children].reverse().find((e) => { const p = getComputedStyle(e).position; return p !== 'fixed' && p !== 'absolute' && e.offsetHeight > 0; }) || null;
  const light = (c) => {
    const m = c.match(/[\d.]+/g);
    if (!m) return false;
    const [r, g, b] = m.map(Number);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 140;
  };
  let n = 0, ground = null, paper = false;
  const look = () => {
    const t = foot.getBoundingClientRect().top;
    if (t > innerHeight || t < 2) return;
    const c = lastSection()?.dataset.lit === 'true' ? 'rgb(11, 14, 21)' : groundAbove(t - 2);
    // (a read that finds no solid ground keeps the last good one, never a see-through foot)
    if (!c || c === ground) return;
    ground = c;
    foot.style.setProperty('--fm-ground', c || 'transparent');
    paper = !!c && light(c);
    foot.classList.toggle('is-paper', paper);
  };
  // (a first guess from the last section itself, so it never shows a wrong ground before it is read; then read
  // again as the page moves)
  const endSection = lastSection();
  const lastBg = endSection && getComputedStyle(endSection).backgroundColor;
  if (opaque(lastBg)) { ground = lastBg; foot.style.setProperty('--fm-ground', lastBg); paper = light(lastBg); foot.classList.toggle('is-paper', paper); }
  gsap.ticker.add(() => { if (!(++n % 10)) look(); });
  lenis.on('scroll', () => { if (foot.getBoundingClientRect().top < innerHeight) look(); });

  // (refit only when the width or the screen's height changes: the fit itself changes the foot's height)
  let lastW = 0, lastH = 0;
  const refit = () => { const w = inner.clientWidth, h = innerHeight; if (w === lastW && h === lastH) return; lastW = w; lastH = h; fit(); };
  if ('ResizeObserver' in window) new ResizeObserver(refit).observe(inner);
  addEventListener('resize', refit);
  document.fonts?.ready.then(fit);
  refit();

  // the nav over it takes its tone
  register({
    name: 'mothermap', commit() {}, revert() {},
    under: (y) => { const r = foot.getBoundingClientRect(); return r.top < y && r.bottom > y ? { lit: false, tone: paper ? 'dark' : 'light', theme: ground || '#0a101c' } : null; },
  });
  return { foot, sign: () => {}, turn: () => {}, fit };
}
