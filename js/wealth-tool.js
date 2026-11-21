// The Family Wealth Picture, put together (17 Nov; the Investor Corner, both sites): the controls on the
// left, the home on the right, the answer under it; the four rings at the top of the page (js/wealth-rings.js)
// take the household's shares. The arithmetic is js/wealth-model.js.
// Since 19 Nov (the user's brief): no rupee figures in the answer, only the picture and words; the picture is the
// painted home (js/wealth-painted.js) once its paintings are in assets/investors/home/, the 3D home until then
// (?home=3d keeps it, ?home=painted shows the painted one with stand-ins, ?house=line the line drawing).
// Since 19 Nov (later, the audit against the Notion): the client's newer calculator's levers, whole. Every earner
// and where their money comes from; the family, with children today and those likely in the next five years;
// spending as the client's three, each estimated from its choices (home, city and schooling; lifestyle; vehicle
// and big buys) and each settable by hand; saving and investing a year; the risk; what is already held. Under
// the picture, the client's eight things it shows, in words.

import { FAMILY, RISK_SAY, income, spends, familyAt, familyScene, rupees } from './wealth-model.js';
import { createHouse } from './wealth-house.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clone = (o) => JSON.parse(JSON.stringify(o));
// (the amounts' sliders run on a curve, so a few lakh and a few crore both fit)
const AMT = { to: (v) => 300 * Math.pow(v / 1000, 2), from: (l) => Math.sqrt(Math.max(0, l) / 300) * 1000 };
const HELD = { to: (v) => 1000 * Math.pow(v / 1000, 2), from: (l) => Math.sqrt(Math.max(0, l) / 1000) * 1000 };
const tidy = (l) => (l < 10 ? Math.round(l * 10) / 10 : l < 100 ? Math.round(l * 2) / 2 : Math.round(l));
const FROM = [['salary', 'Salary'], ['business', 'Business'], ['rent', 'Rental']];
// (which spend each choice estimates)
const GROUP = { home: 'utility', city: 'utility', school: 'utility', life: 'experience', vehicle: 'royal', big: 'royal' };

export function wealthTool(root, { skin, reduced, rings } = {}) {
  if (!root) return null;
  const st = clone(FAMILY);
  const canvas = $('.iv-house', root);
  let house = null, lastShow = null;
  const line = () => { house = createHouse(canvas, { skin, reduced }); canvas.classList.add('is-line'); if (lastShow) house.show(...lastShow); };
  const q = new URLSearchParams(location.search), want = q.get('home');
  const home3d = () => import('./wealth-home.js').then((m) => { house = m.createHome(canvas, { skin, reduced }); if (!house) line(); else if (lastShow) house.show(...lastShow); }).catch(() => line());
  if (q.get('house') === 'line') line();
  else if (want === '3d') home3d();
  else {
    import('./wealth-painted.js').then(async (m) => {
      if (want !== 'painted' && !(await m.hasPaintings())) return home3d();
      house = m.createPainted(canvas, { skin, reduced });
      if (!house) return home3d();
      canvas.classList.add('is-painted');
      if (lastShow) house.show(...lastShow);
    }).catch(() => home3d());
  }

  // ---- the earners: each with where their money comes from and how much; up to four
  const box = $('[data-earners]', root), add = $('[data-add]', root);
  function earners() {
    box.innerHTML = st.earners.map((m, i) => `
      <div class="iv-earner">
        <p class="iv-earner-h"><b>Earner ${i + 1}</b>${st.earners.length > 1 ? `<button type="button" class="iv-rm" data-rm="${i}">Remove</button>` : ''}</p>
        <div class="iv-seg" role="group" aria-label="Earner ${i + 1}: where it comes from">${FROM.map(([v, t]) => `<button type="button" data-from="${i}" data-v="${v}" aria-pressed="${m.from === v}">${t}</button>`).join('')}</div>
        <label class="iv-row is-wide"><input type="range" data-amt="${i}" min="0" max="1000" step="1" aria-label="Earner ${i + 1}, a year"><output data-earner="${i}"></output></label>
      </div>`).join('');
    $$('[data-amt]', box).forEach((inp) => {
      const i = +inp.dataset.amt;
      inp.value = AMT.from(st.earners[i].amt);
      inp.addEventListener('input', () => { st.earners[i].amt = Math.max(0.5, tidy(AMT.to(+inp.value))); update(); });
    });
    $$('[data-from]', box).forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.from;
      st.earners[i].from = b.dataset.v;
      $$(`[data-from="${i}"]`, box).forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      update();
    }));
    $$('[data-rm]', box).forEach((b) => b.addEventListener('click', () => { st.earners.splice(+b.dataset.rm, 1); earners(); update(); }));
    add.hidden = st.earners.length >= 4;
  }
  add.addEventListener('click', () => { if (st.earners.length < 4) { st.earners.push({ from: 'salary', amt: 6 }); earners(); update(); } });
  earners();

  // ---- the three spends: estimated from their choices, or set by hand (then "Use the estimate" brings it back)
  const spendIn = {};
  ['utility', 'experience', 'royal'].forEach((k) => {
    const inp = $(`input[name="${k}"]`, root);
    spendIn[k] = inp;
    inp.addEventListener('input', () => { st.own[k] = tidy(AMT.to(+inp.value)); update(); });
  });
  $$('[data-est]', root).forEach((e) => e.addEventListener('click', (ev) => {
    if (!ev.target.closest('button')) return;
    st.own[e.dataset.est] = null;
    update();
  }));
  // ---- saving, investing, what is held
  const saveIn = $('input[name="save"]', root), investIn = $('input[name="invest"]', root), heldIn = $('input[name="held"]', root);
  saveIn.value = AMT.from(st.save); investIn.value = AMT.from(st.invest); heldIn.value = HELD.from(st.held);
  saveIn.addEventListener('input', () => { st.save = tidy(AMT.to(+saveIn.value)); update(); });
  investIn.addEventListener('input', () => { st.invest = tidy(AMT.to(+investIn.value)); update(); });
  heldIn.addEventListener('input', () => { st.held = tidy(HELD.to(+heldIn.value)); update(); });

  // ---- the family: adults, children today, children likely in the next five years
  const LIM = { adults: [1, 4], kidsNow: [0, 4], kidsNext: [0, 4] };
  const steps = $$('[data-step]', root);
  const stepState = () => steps.forEach((b) => { const k = b.dataset.step, d = Number(b.dataset.d); b.disabled = d < 0 ? st[k] <= LIM[k][0] : st[k] >= LIM[k][1]; });
  steps.forEach((b) => b.addEventListener('click', () => { const k = b.dataset.step; st[k] = Math.min(LIM[k][1], Math.max(LIM[k][0], st[k] + Number(b.dataset.d))); stepState(); update(); }));
  stepState();

  // ---- choices of one among a few (a choice that estimates a spend hands it back to the estimate)
  $$('[data-k]', root).forEach((b) => {
    b.setAttribute('aria-pressed', String(String(st[b.dataset.k]) === b.dataset.v));
    b.addEventListener('click', () => {
      const k = b.dataset.k;
      st[k] = k === 'year' ? Number(b.dataset.v) : b.dataset.v;
      if (GROUP[k]) st.own[GROUP[k]] = null;
      $$(`[data-k="${k}"]`, root).forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      update();
    });
  });

  const out = (k, v) => $$(`[data-out="${k}"]`, root).forEach((e) => { e.textContent = v; });
  const tags = $('[data-tags]', root);
  let queued = false;
  function update() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const E = income(st), sp = spends(st);
      // the controls say their amounts
      out('earn', rupees(E));
      st.earners.forEach((m, i) => { const o = $(`[data-earner="${i}"]`, root); if (o) o.textContent = rupees(m.amt); });
      ['utility', 'experience', 'royal'].forEach((k) => {
        out(k, rupees(sp[k]));
        if (document.activeElement !== spendIn[k]) spendIn[k].value = AMT.from(sp[k]);
        const est = $(`[data-est="${k}"]`, root);
        est.innerHTML = st.own[k] != null ? 'your figure <button type="button">Use the estimate</button>' : `estimated ${rupees(sp.est[k])}`;
      });
      out('essential', `Essential ${rupees(sp.utility)} · non-essential ${rupees(sp.experience + sp.royal)}`);
      out('save', rupees(st.save)); out('invest', rupees(st.invest)); out('held', rupees(st.held));
      out('riskSay', RISK_SAY[st.risk]);
      out('adults', String(st.adults)); out('kidsNow', String(st.kidsNow)); out('kidsNext', String(st.kidsNext));
      // where each rupee goes this year: the parts as wide as their amounts, against what is earned
      const planned = sp.total + st.save + st.invest, gap = E - planned, den = Math.max(E, planned, 0.01);
      const part = { utility: sp.utility, experience: sp.experience, royal: sp.royal, save: st.save, invest: st.invest, idle: Math.max(0, gap) };
      $$('[data-part]', root).forEach((e) => { e.style.flexGrow = String(Math.max(0.0001, part[e.dataset.part] / den)); });
      root.classList.toggle('has-over', gap < -0.05);
      out('balance', gap < -0.05
        ? `You plan to use ${rupees(-gap)} more than you earn. Saving and investing are trimmed first, then it comes out of what is held.`
        : gap > 0.05 ? `${rupees(gap)} of what you earn has no plan yet. It sits idle.` : 'Every rupee has a job.');
      // the picture at the chosen year, and its words
      const N = st.year, p = familyAt(st, N), sc = familyScene(st, p, N);
      out('say', sc.say);
      tags.innerHTML = sc.tags.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
      root.classList.toggle('has-debt', sc.debt);
      // (what the pictures read: the year in today's rupees, and how the spending divides)
      const pv = { earn: p.rE, spend: p.Sp / p.d, safe: Math.max(0, p.rSafe), invested: Math.max(0, p.rInv), idle: Math.max(0, p.rIdle), debt: Math.max(0, -p.rIdle), wealth: p.rW };
      const sum = Math.max(0.01, p.rUtil + p.rEnt + p.rRoyal);
      const mix = { utility: p.rUtil / sum, experience: p.rEnt / sum, royal: p.rRoyal / sum };
      lastShow = [pv, mix, p.rE, sc];
      house?.show(pv, mix, p.rE, sc);
      const e = Math.max(0.01, E);
      rings?.set({ spend: Math.min(1, sp.total / e), invest: Math.min(1, st.invest / e), save: Math.min(1, (st.save + Math.max(0, gap) * 0.5) / e) });
    });
  }
  update();
  return { st, update, get house() { return house; } };
}
