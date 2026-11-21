// The signature (14 Nov): the foot of every page, after the user's first type reference (a huge
// shaded script name behind a strip of pictures, "proper shadows"). Its composition, not its parts.
// - Metamorph signs its name across the page in a copperplate script, the engraver's hand of share
//   certificates, cheques and banknotes, and the hand thirty years of signed accounts were signed in.
//   It is shaded as silver is, light above and falling into shadow, and it throws a real shadow.
// - It is signed as you arrive: the ink runs along the name from left to right. Then it stays and
//   catches the light: the bright band on the silver follows the pointer.
// - Across its middle, four pieces from the Creative Corner, a new four each day, lie on the name
//   and cast their shadows on it. Each opens in the corner.
// - Round it, small: the firm's name, a line from the corner, and the way round the site.
// ?script=copperplate sets it in Pinyon Script, a plainer copperplate, to compare with the default
// (Monsieur La Doulaise, nearer the reference's flourish).

import { ARTISTS } from './artists.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

// four pieces for the day: the artists' newest work, in turn by the date, each from another domain,
// all of a shape that lies well in one band (4:5 to square)
function fourFor(date) {
  const all = ARTISTS.map((p) => ({ p, i: 0, w: p.works[0] }))
    .filter(({ w }) => w.image ? (w.ratio || 0.8) >= 0.7 && (w.ratio || 0.8) <= 1.05 : true);
  const day = Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 864e5);
  const out = [], seen = new Set();
  for (let k = 0; k < all.length && out.length < 4; k++) {
    const c = all[(day * 7 + k * 5) % all.length];
    if (seen.has(c.p.art) || out.includes(c)) continue;
    seen.add(c.p.art);
    out.push(c);
  }
  return out;
}

export function setupSignature({ register, reduced, isTouch }) {
  const main = document.querySelector('main');
  if (!main || document.querySelector('.sig')) return null;
  const root = document.documentElement;
  if (/[?&]script=copperplate\b/.test(location.search)) root.classList.add('script-plate');
  const here = location.pathname.split('/').pop() || 'index.html';
  const onCorner = here === 'creative.html';

  const foot = el('footer', 'sig');
  foot.setAttribute('aria-label', 'Metamorph Capital');
  const stage = el('div', 'sig-stage');
  const word = el('p', 'sig-word', 'Metamorph');
  word.setAttribute('aria-hidden', 'true');
  const top = el('p', 'sig-top');
  top.innerHTML = '<em>Metamorph Capital</em>';

  // the strip: four pieces from the corner
  const strip = el('div', 'sig-strip');
  const over = el('div', 'sig-over');
  const from = el('a', 'sig-from', 'From the creative corner');
  from.href = 'creative.html';
  const line = el('a', 'sig-line');
  line.href = 'creative.html';
  line.innerHTML = 'Artists in the middle of <em>becoming.</em>';
  over.append(from, line);
  const row = el('ul', 'sig-row');
  row.setAttribute('aria-label', 'From the creative corner, today');
  fourFor(new Date()).forEach(({ p, i, w }, k) => {
    const li = el('li', 'sig-piece');
    li.style.setProperty('--r', String(w.ratio || 0.8));
    li.style.setProperty('--k', String(k));
    const a = el('a', 'sig-pic');
    a.href = `creative.html#work/${p.slug}/${i + 1}`;
    a.setAttribute('aria-label', `${w.title}, by ${p.name}, in the creative corner`);
    const img = el('img');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    if (w.image) img.src = w.image;
    else import('./corner-parts.js').then(({ workArt }) => workArt(p, i, 600)).then((u) => { img.src = u; });
    a.append(img);
    li.append(a);
    row.append(li);
  });
  strip.append(over, row);

  // the way round, small
  const bottom = el('div', 'sig-bottom');
  const links = el('nav', 'sig-links');
  links.setAttribute('aria-label', 'The site');
  // (on the simple site, the way round stays in the simple site; the corner is one page for both)
  const ink = root.dataset.site === 'ink';
  (ink ? [['About', 'ink-about.html'], ['Services', 'ink-services.html'], ['Sectors', 'ink-sectors.html'], ['Team', 'ink-about.html#team'], ['Creative corner', 'creative.html'], ['Investor corner', 'ink-investors.html']]
    : [['About', 'about.html'], ['Services', 'index.html#services'], ['Sectors', 'sectors.html'], ['Team', 'index.html#team'], ['Creative corner', 'creative.html'], ['Investor corner', 'investors.html']])
    .forEach(([t, h]) => { const a = el('a', '', t); a.href = h; if (h === here) a.setAttribute('aria-current', 'page'); links.append(a); });
  const talk = el('a', 'sig-talk', 'Talk to us');
  talk.href = '#contact';
  talk.dataset.soon = '';
  bottom.append(el('p', 'sig-copy', `© ${new Date().getFullYear()} Metamorph Capital`), links, talk);

  stage.append(top, word, strip);
  foot.append(stage, bottom);
  main.after(foot);
  root.classList.add('has-sig');
  if (onCorner) foot.classList.add('is-corner');

  // signed as it arrives: the ink runs along the name, then the pieces are laid on it
  const sign = () => foot.classList.add('is-signed');
  if (reduced || !('IntersectionObserver' in window)) sign();
  else {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { sign(); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(stage);
  }
  // and it catches the light: the bright band on the silver follows the pointer across the page
  if (!isTouch && !reduced) {
    let tx = 50, x = 50, raf = 0;
    const tick = () => {
      x += (tx - x) * 0.08;
      word.style.setProperty('--lx', `${x.toFixed(2)}%`);
      raf = Math.abs(tx - x) > 0.05 ? requestAnimationFrame(tick) : 0;
    };
    foot.addEventListener('pointermove', (e) => {
      tx = 100 - (e.clientX / innerWidth) * 100;
      if (!raf) raf = requestAnimationFrame(tick);
    });
  }

  // its first stretch falls from the ground of whatever ends the page (a lit room, the paper, the
  // silk) into the night, so it meets no edge: read off the page just above it while that is in view
  const groundAbove = (y) => {
    let e = document.elementFromPoint(innerWidth / 2, y);
    while (e && e !== document.documentElement && e !== foot) {
      const c = getComputedStyle(e).backgroundColor;
      if (c && c !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(c)) return c;
      e = e.parentElement;
    }
    return 'transparent';
  };
  let n = 0, above = '';
  window.gsap?.ticker.add(() => {
    if (++n % 8) return;
    const t = foot.getBoundingClientRect().top;
    if (t < 2 || t > innerHeight) return;
    // (a lit room ending the page, the team's, is drawn under its section, where this cannot see it)
    const c = main.lastElementChild?.dataset.lit === 'true' ? '#0b0e15' : groundAbove(t - 2);
    if (c !== above) { above = c; foot.style.setProperty('--sig-from', c); }
  });

  // the nav over it is light, as over any night
  register({
    name: 'signature', commit() {}, revert() {},
    under: (y) => { const r = foot.getBoundingClientRect(); return r.top + innerHeight * 0.28 < y && r.bottom > y ? { lit: false, tone: 'light', theme: '#050709' } : null; },
  });
  return { foot, sign };
}
