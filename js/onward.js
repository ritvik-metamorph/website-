// The way on (19 Nov; the user: "at the end of each section… before the footer… there should be a
// recommendation… it gives a CTA that you can go to this section as well… when someone is done exploring most
// of the sections… the last section before creative corner… then creative corner recommendation will be there…
// obvious recommendations, upselling"). At the head of every page's foot, before the site index: one page
// offered as the next. Which one: the first place on the tour of the site, after this one, that the visitor
// has not yet seen on this visit. The tour goes home, about, (the simple site's services,) sectors, the
// investor corner, and the creative corner last; once every page has been seen, Talk to us, with the
// founders' coins. Its name large with its word that turns, one line of what is there, and a picture of it,
// all one link. The page it names starts coming in the background as the band nears the screen, and at once
// when it is pointed at or touched (js/menu.js's warm()), so the change is quick.
// It sits on the foot's own ground (js/mothermap.js reads it off the end of the page), ink on paper, light on
// the night.

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const NS = 'http://www.w3.org/2000/svg';

// the tour of each site, in order, and where each place is
const TOUR = {
  light: ['home', 'about', 'sectors', 'investors', 'creative'],
  ink: ['home', 'about', 'services', 'sectors', 'investors', 'creative'],
};
const FILE = {
  light: { home: 'index.html', about: 'about.html', sectors: 'sectors.html', investors: 'investors.html', creative: 'creative.html' },
  ink: { home: 'ink.html', about: 'ink-about.html', services: 'ink-services.html', sectors: 'ink-sectors.html', investors: 'ink-investors.html', creative: 'creative.html' },
};
// what each is: its name (the word in the italic turns), one line (the menu's own lines where it has them;
// copy for review), and its picture: a still from the site's own scenes, the founder's grid drawn, a piece
// from the corner (a different one each day), or the founders' coins
const PLACE = {
  home: { name: ['Where it ', 'begins'], line: 'The way in, what we do, and the people who do it.', pic: 'assets/ink/film-5-flight.jpg' },
  about: { name: ['The ', 'firm'], line: 'Who we are, why we began, and what we hold to.', pic: 'assets/ink/name.jpg' },
  services: { name: ['What we ', 'do'], line: 'Fundraising and readiness, wealth, strategy and financial services, for founders and their families.', pic: 'assets/ink/note-3-wings.jpg' },
  sectors: { name: ['Forty-eight ', 'sectors'], line: 'Twenty-seven disciplines across forty-eight sectors, and what each one changes.', grid: true },
  investors: { name: ['The investor ', 'corner'], line: 'How money becomes wealth: where each rupee goes, and what it builds.', pic: 'assets/ink/menu-investors.jpg' },
  creative: { name: ['The creative ', 'corner'], line: 'Upcoming artists, nine kinds of work, to discover and to hire.', art: true },
  talk: { name: ['Talk to ', 'us'], line: 'You have seen the whole of it. Tell us where you are in the change.', coins: true },
};
// (the corner's piece for the day: one of the studio designs standing in for the art)
const ART = ['01', '03', '05', '12', '16', '22', '25', '28', '31', '41'];

const SEEN = 'mm-seen';
const seenSet = () => { try { return new Set(JSON.parse(sessionStorage.getItem(SEEN) || '[]')); } catch (e) { return new Set(); } };

export function setupOnward({ foot, inner, reduced, menu, local }) {
  const root = document.documentElement;
  const here = location.pathname.split('/').pop() || 'index.html';
  let mode = '';
  try { mode = localStorage.getItem('mm-mode') || ''; } catch (e) {}
  // (the creative corner is one page for both sites: it follows the site the visitor chose)
  const ver = root.dataset.site === 'ink' || (!root.dataset.site && mode === 'ink') ? 'ink' : 'light';
  const files = FILE[ver], order = TOUR[ver];
  const at = order.find((id) => files[id] === here);

  // this page is seen (a place is the same place on either site)
  const seen = seenSet();
  if (at) { seen.add(at); try { sessionStorage.setItem(SEEN, JSON.stringify([...seen])); } catch (e) {} }

  // the next one not yet seen, from here round the tour; when all are seen, a word with the firm
  const k = at ? order.indexOf(at) : -1;
  const round = k < 0 ? order : [...order.slice(k + 1), ...order.slice(0, k)];
  const id = round.find((p) => !seen.has(p)) || 'talk';
  const P = PLACE[id];
  let href = id === 'talk' ? '#contact' : files[id];
  if (local && id !== 'talk' && /frames=timer/.test(location.search)) href += '?frames=timer';

  // ---- the band: a label, the name, its line, its picture; the whole of it one link
  const band = el('nav', 'fm-on');
  band.setAttribute('aria-label', 'Where to next');
  band.dataset.place = id;
  const a = el('a', 'fm-on-a');
  a.href = href;
  if (id === 'talk') a.dataset.soon = '';
  const head = el('h2', 'fm-on-t');
  head.dataset.turn = '';
  head.dataset.kinetic = '';
  const tail = el('span', 'fm-on-tail'); // (the turning word and the arrow kept together on one line)
  head.append(P.name[0], tail);
  tail.append(el('em', '', P.name[1]));
  const arrow = document.createElementNS(NS, 'svg');
  arrow.setAttribute('class', 'fm-on-arrow');
  arrow.setAttribute('viewBox', '0 0 40 24');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.innerHTML = '<path d="M1 12h36M27 2l10 10-10 10"/>';
  const words = el('span', 'fm-on-words');
  tail.append(arrow);
  words.append(el('span', 'fm-on-k', 'Next'), head, el('span', 'fm-on-line', P.line));
  const pic = el('span', 'fm-on-pic');
  a.append(words, pic);
  band.append(a);
  foot.insertBefore(band, inner);

  const img = (src, cls = '') => { const i = el('img', cls); i.alt = ''; i.decoding = 'async'; i.loading = 'lazy'; i.src = src; return i; };
  if (P.pic) pic.append(img(P.pic));
  else if (P.art) {
    const day = Math.floor(Date.now() / 864e5);
    pic.append(img(`assets/corner/insomniac/mid/iw-${ART[day % ART.length]}.jpg`));
  } else if (P.coins) {
    pic.classList.add('is-coins');
    pic.append(img('assets/ink/coin-ritvik.jpg', 'fm-on-coin'), img('assets/ink/coin-gurleen.jpg', 'fm-on-coin'));
  } else if (P.grid) {
    pic.classList.add('is-grid');
    drawGrid(pic);
  }

  // ---- arriving: the picture opens like a curtain from its foot, the words come up after it
  if (reduced || !('IntersectionObserver' in window)) band.classList.add('is-in');
  else {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { band.classList.add('is-in'); io.disconnect(); } }, { rootMargin: '0px 0px -18% 0px' });
    io.observe(band);
  }

  // ---- the next page comes in early: as the band nears the screen, and at once when it is wanted
  if (id !== 'talk' && menu?.warm) {
    const near = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { menu.warm(files[id], 'low'); near.disconnect(); } }, { rootMargin: '100% 0px' });
    near.observe(band);
    const now = () => menu.warm(files[id], 'high');
    a.addEventListener('pointerenter', now);
    a.addEventListener('focus', now);
    a.addEventListener('touchstart', now, { passive: true });
  }
  return { band, id };
}

// the founder's grid, drawn small: twenty-seven threads of knowledge across, forty-eight of industry down, a
// knot in its force's ink wherever a discipline decides a sector (the data is loaded only when it is needed)
async function drawGrid(box) {
  const { ATLAS } = await import('./atlas-data.js');
  const discs = [...ATLAS.disciplines].sort((x, y) => x.ring - y.ring);
  const fams = Object.keys(ATLAS.families);
  const sects = fams.flatMap((f) => ATLAS.sectors.filter((s) => s.fam === f));
  const col = new Map(sects.map((s, i) => [s.id, i]));
  const W = 1000, H = 640, pad = 8, R = discs.length, C = sects.length;
  const X = (i) => pad + (i * (W - 2 * pad)) / (C - 1), Y = (j) => pad + (j * (H - 2 * pad)) / (R - 1);
  let s = '';
  sects.forEach((sec, i) => { s += `<line class="${i === 0 || sects[i - 1].fam !== sec.fam ? 'is-strong' : ''}" x1="${X(i).toFixed(1)}" y1="0" x2="${X(i).toFixed(1)}" y2="${H}"/>`; });
  discs.forEach((d, j) => { s += `<line class="${j === 0 || discs[j - 1].ring !== d.ring ? 'is-strong' : ''}" x1="0" y1="${Y(j).toFixed(1)}" x2="${W}" y2="${Y(j).toFixed(1)}"/>`; });
  let n = 0;
  discs.forEach((d, j) => d.links.forEach((l) => {
    const i = col.get(l.s);
    if (i === undefined) return;
    n++;
    s += `<circle cx="${X(i).toFixed(1)}" cy="${Y(j).toFixed(1)}" r="7" style="fill:var(--f-${l.f})"/>`;
  }));
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'fm-on-grid');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = s;
  box.append(svg);
  return n;
}
