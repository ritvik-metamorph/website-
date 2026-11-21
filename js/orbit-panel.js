// The metrics panel: an orbit, a discipline or a sector, opened. A stub for the narrative pages still to be
// designed: the founder's own words, and where each discipline lands in their grid, by what it does there. Any hero
// opens it with an 'mm:open' event ({ kind: 'field', k } | { kind: 'disc', i } | { kind: 'sector', j }); each has its
// own address (#orbit/n, #discipline/id, #sector/id), so the browser's Back closes it and a shared link opens it.
// It lived inside hero 1 (js/orb.js) until 20 Nov, when heroes 1 to 6 left the page (the user kept 7 and 8): the same
// panel, the same words, on its own.
import { ATLAS } from './atlas-data.js';

const $ = (s, c = document) => c.querySelector(s);
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const firstSentence = (s) => (s.match(/^.*?[.!?](\s|$)/) || [s])[0].trim();
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

export function setupPanel({ lenis, reduced }) {
  const panel = $('.disc-panel');
  if (!panel) return null;

  // the founder's data: each sector knows the disciplines that move it
  const rings = ATLAS.rings;
  const discs = ATLAS.disciplines.map((d, i) => ({ ...d, i }));
  const byRing = rings.map((_, k) => discs.filter((d) => d.ring === k));
  const secAt = Object.fromEntries(ATLAS.sectors.map((s, i) => [s.id, i]));
  const sectors = ATLAS.sectors.map((s, i) => ({ ...s, i, links: [] }));
  discs.forEach((d) => d.links.forEach((l) => { const S = sectors[secAt[l.s]]; if (S) S.links.push({ d, f: l.f, use: l.use, eff: l.eff }); }));
  const sectorName = Object.fromEntries(sectors.map((s) => [s.id, s.name]));

  let opened = null, pushed = false, returnTo = null, hideT = 0;
  const addr = (f) => (f.kind === 'field' ? `#orbit/${f.k + 1}` : f.kind === 'disc' ? `#discipline/${discs[f.i].id}` : `#sector/${sectors[f.j].id}`);
  function forceList(links, name) {
    const ul = el('ul');
    Object.entries(ATLAS.forces).forEach(([f, info]) => {
      const ls = links.filter((l) => l.f === f);
      if (!ls.length) return;
      const li = el('li');
      li.append(el('span', 's', capital(info.label)), el('span', 'u', ls.map(name).join(', ')));
      ul.append(li);
    });
    return ul;
  }
  // a sector named in the panel opens its own page (sectors.html)
  const sectorLink = (id, text) => { const a = el('a', 'dp-go', text); a.href = `sectors.html#${id}`; return a; };
  function fillPanel(f) {
    const lands = $('.dp-lands', panel);
    lands.textContent = '';
    const note = $('.dp-note', panel);
    note.textContent = 'From the Metamorph atlas.';
    if (f.kind === 'field') {
      const k = f.k, list = byRing[k];
      const all = new Set(list.flatMap((d) => d.links.map((l) => l.s)));
      $('.dp-ring', panel).textContent = `Orbit ${ROMAN[k]}`;
      $('.dp-name', panel).textContent = rings[k].name;
      $('.dp-gist', panel).textContent = rings[k].note;
      $('.dp-count', panel).textContent = `${list.length} ${list.length === 1 ? 'discipline' : 'disciplines'}, landing in ${all.size} of ${sectors.length} sectors.`;
      list.forEach((d) => {
        const sec = el('section');
        sec.append(el('h3', null, d.name), el('p', 'dp-fnote', `${firstSentence(d.gist)} Lands in ${d.links.length} sectors.`), forceList(d.links, (l) => sectorName[l.s] || l.s));
        lands.append(sec);
      });
    } else if (f.kind === 'disc') {
      const d = discs[f.i];
      $('.dp-ring', panel).textContent = `Orbit ${ROMAN[d.ring]} · ${rings[d.ring].name}`;
      $('.dp-name', panel).textContent = d.name;
      $('.dp-gist', panel).textContent = d.gist;
      $('.dp-count', panel).textContent = `Lands in ${d.links.length} of ${sectors.length} sectors.`;
      d.links.forEach((l) => {
        const sec = el('section');
        const h = el('h3');
        h.append(sectorLink(l.s, sectorName[l.s]));
        sec.append(h, el('p', 'dp-force', capital(ATLAS.forces[l.f]?.label || l.f)), el('p', 'dp-fnote', l.use), el('p', 'dp-eff', l.eff));
        lands.append(sec);
      });
    } else {
      const S = sectors[f.j];
      $('.dp-ring', panel).textContent = `A sector · ${ATLAS.families[S.fam] || ''}`;
      $('.dp-name', panel).textContent = S.name;
      $('.dp-gist', panel).textContent = S.links.length ? `Moved by ${S.links.map((l) => l.d.name).join(', ')}.` : 'Not yet mapped in the atlas.';
      $('.dp-count', panel).textContent = `${S.links.length} ${S.links.length === 1 ? 'discipline' : 'disciplines'} act on it.`;
      note.textContent = '';
      note.append(sectorLink(S.id, `The whole of ${S.name}, on its page`));
      S.links.forEach((l) => {
        const sec = el('section');
        sec.append(el('h3', null, l.d.name), el('p', 'dp-force', `${capital(ATLAS.forces[l.f]?.label || l.f)} · orbit ${ROMAN[l.d.ring]}`), el('p', 'dp-fnote', l.use), el('p', 'dp-eff', l.eff));
        lands.append(sec);
      });
    }
    $('.dp-inner', panel).scrollTop = 0;
  }
  function open(f, { push = true } = {}) {
    if (!f || opened) return;
    clearTimeout(hideT);
    returnTo = document.activeElement;
    opened = f;
    fillPanel(f);
    if (push) { history.pushState({ hero: addr(f) }, '', addr(f)); pushed = true; }
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('is-on'));
    lenis.stop();
    $('.close', panel).focus({ preventScroll: true });
  }
  function close({ fromHistory = false } = {}) {
    if (!opened) return;
    if (pushed && !fromHistory) { pushed = false; history.back(); return; } // popstate closes it
    pushed = false;
    panel.classList.remove('is-on');
    // (hidden once its fade is done, as it was when the orb drew back behind it)
    hideT = setTimeout(() => { opened = null; panel.hidden = true; lenis.start(); returnTo?.focus?.({ preventScroll: true }); }, reduced ? 200 : 900);
  }
  const fromHash = () => {
    const h = location.hash;
    let m = h.match(/^#orbit\/([1-7])$/);
    if (m) return { kind: 'field', k: Number(m[1]) - 1 };
    m = h.match(/^#discipline\/(.+)$/);
    if (m) { const d = discs.find((q) => q.id === m[1]); return d ? { kind: 'disc', i: d.i } : null; }
    m = h.match(/^#sector\/(.+)$/);
    if (m) { const S = sectors.find((q) => q.id === m[1]); return S ? { kind: 'sector', j: S.i } : null; }
    return null;
  };
  addEventListener('popstate', () => {
    const f = fromHash();
    if (f && !opened) open(f, { push: false });
    else if (!f) close({ fromHistory: true });
  });
  $('.close', panel).addEventListener('click', () => close());
  addEventListener('mm:open', (e) => { if (e.detail) open(e.detail); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && opened) close(); });
  // a shared address opens it
  const f0 = fromHash();
  if (f0) setTimeout(() => open(f0, { push: false }), 300);
  return { open, close, get opened() { return opened; } };
}
