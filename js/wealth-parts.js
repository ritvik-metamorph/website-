// The Investor Corner's smaller parts (19 Nov, the user's brief; both sites): the collection of things worth
// spending on (a strip to drag or step through, opened into the whole list when asked), the line of risk (silver
// up to the normal level of risk, which is saving; gold beyond it, which is investing; the pointer reads where it
// is), and the strategy finder (what you earn and the risk you can take, one strategy for the pair). The pieces
// and the strategies are placeholders until Metamorph writes them (README).

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

// the collection's pictures that are in assets/investors/collection/ (add a name here when its JPEG arrives, e.g.
// 'craft'); a piece whose picture has not come shows its frame with "Picture to come"
const PICS = [];

// worth spending on: arrows step a card at a time; "See the whole list" lays every card out at once
export function setupCollection(root) {
  if (!root) return null;
  const row = $('.iv-coll-row', root), all = $('.iv-coll-all', root), arrows = $$('.iv-arrow', root);
  $$('img[data-pic]', root).forEach((img) => {
    if (PICS.includes(img.dataset.pic)) img.src = `assets/investors/collection/${img.dataset.pic}.jpg`;
    else img.closest('.iv-piece-pic').classList.add('is-empty');
  });
  const step = () => { const c = row.firstElementChild; return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(row).columnGap || 0) : 300; };
  const ends = () => {
    arrows[0].disabled = row.scrollLeft < 4;
    arrows[1].disabled = row.scrollLeft > row.scrollWidth - row.clientWidth - 4;
  };
  arrows.forEach((b) => b.addEventListener('click', () => row.scrollBy({ left: step() * Number(b.dataset.dir), behavior: 'smooth' })));
  row.addEventListener('scroll', ends, { passive: true });
  row.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); row.scrollBy({ left: step() * (e.key === 'ArrowRight' ? 1 : -1), behavior: 'smooth' }); } });
  // (a mouse can drag the strip as a finger would)
  let down = null;
  row.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || root.classList.contains('is-all') || e.target.closest('a')) return; down = { x: e.clientX, s: row.scrollLeft, moved: false }; row.classList.add('is-drag'); });
  addEventListener('pointermove', (e) => { if (!down) return; const d = e.clientX - down.x; if (Math.abs(d) > 4) down.moved = true; row.scrollLeft = down.s - d; });
  addEventListener('pointerup', () => { if (!down) return; down = null; row.classList.remove('is-drag'); });
  all.addEventListener('click', () => {
    const open = !root.classList.contains('is-all');
    // (the cards travel from the strip to their places in the list, and back)
    const before = new Map($$('.iv-piece', row).map((c) => [c, c.getBoundingClientRect()]));
    root.classList.toggle('is-all', open);
    all.setAttribute('aria-expanded', String(open));
    all.textContent = open ? 'Back to the strip' : 'See the whole list';
    if (!open) row.scrollLeft = 0;
    before.forEach((r, c) => {
      const n = c.getBoundingClientRect(), dx = r.left - n.left, dy = r.top - n.top;
      if (!dx && !dy) return;
      c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.19, 1, .22, 1)' });
    });
    ends();
  });
  ends();
  return { row };
}

// the line of risk: wherever the pointer is along it, the reading says which side that is; the names near it lift
export function setupRisk(root) {
  if (!root) return null;
  const bar = $('.iv-risk-bar', root), at = $('.iv-risk-at', root), read = $('.iv-risk-read', root), items = $$('.iv-risk-items li', root);
  const mark = parseFloat(bar.style.getPropertyValue('--mark')) / 100;
  const SAY = { save: 'Saving: steady and safe, there when it is needed.', invest: 'Investing: more risk, for more return.' };
  const vertical = () => getComputedStyle(root).getPropertyValue('--risk-v').trim() === '1';
  const set = (f) => {
    root.classList.toggle('is-reading', f != null);
    if (f == null) { read.textContent = ''; items.forEach((li) => li.classList.remove('is-near')); return; }
    const side = f > mark ? 'invest' : 'save';
    root.dataset.side = side;
    read.textContent = SAY[side];
    if (vertical()) at.style.transform = `translateY(${(f * bar.clientHeight).toFixed(1)}px)`;
    else at.style.transform = `translateX(${(f * bar.clientWidth).toFixed(1)}px)`;
    items.forEach((li) => li.classList.toggle('is-near', Math.abs(parseFloat(li.style.getPropertyValue('--at')) / 100 - f) < 0.07));
  };
  const where = (e) => { const r = bar.getBoundingClientRect(); return vertical() ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width; };
  root.addEventListener('pointermove', (e) => { const f = where(e); set(f >= 0 && f <= 1 ? f : null); });
  root.addEventListener('pointerdown', (e) => { const f = where(e); set(f >= 0 && f <= 1 ? f : null); });
  root.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') set(null); });
  return { set };
}

// find your strategy: three bands of earnings by three appetites for risk; each pair has its own strategy (the
// names and the words are placeholders for Metamorph to write)
const BANDS = ['up to ₹25 lakh a year', '₹25 lakh to ₹1 crore a year', 'over ₹1 crore a year'];
const RISKS = ['low', 'medium', 'high'];
const NAMES = [
  ['A safe first base', 'A steady start', 'A bold start'],
  ['Growth, carefully', 'Balanced growth', 'Growth at pace'],
  ['Wealth kept whole', 'Wealth, compounding', 'Wealth at work'],
];
const BODY = 'Metamorph’s strategy for this household goes here: what to hold, in what shares, and why. To be written by Metamorph.';

export function setupFinder(root) {
  if (!root) return null;
  const st = { band: 1, risk: 1 };
  const card = $('.iv-strat', root), forEl = $('.iv-strat-for', root), name = $('.iv-strat-name', root), body = $('.iv-strat-body', root);
  const paint = () => {
    forEl.textContent = `For a household earning ${BANDS[st.band]}, taking ${RISKS[st.risk]} risk`;
    name.textContent = NAMES[st.band][st.risk];
    body.textContent = BODY;
  };
  $$('[data-f]', root).forEach((b) => {
    b.setAttribute('aria-pressed', String(st[b.dataset.f] === Number(b.dataset.v)));
    b.addEventListener('click', () => {
      st[b.dataset.f] = Number(b.dataset.v);
      $$(`[data-f="${b.dataset.f}"]`, root).forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      // (the old strategy steps out and the new one in)
      card.classList.add('is-swap');
      setTimeout(() => { paint(); card.classList.remove('is-swap'); }, 220);
    });
  });
  paint();
  return { st };
}
