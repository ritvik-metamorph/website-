// "The word that turns" (15 Nov): in every heading one word is set in the italic, the word that
// turns. Now it does: it arrives upright, in the heading's own sans, and as the heading comes up the
// screen it leans over and becomes its italic, word by word: a metamorphosis the size of a word.
// A heading asks for it with data-turn (css/main.css, "the word that turns"). Each word of the
// italic phrase is its own small box holding both forms on one baseline, so the line still wraps
// where it did; the upright form is pressed to the italic's width, so nothing moves around it.
// With reduced motion the headings are left exactly as they were.

const $$ = (s, c = document) => [...c.querySelectorAll(s)];

export function setupTurn({ reduced, local }) {
  const heads = $$('[data-turn]');
  if (reduced || !heads.length) return null;
  const words = [];
  heads.forEach((h) => {
    // the upright form is the heading's own face, weight and spacing
    const cs = getComputedStyle(h);
    h.style.setProperty('--turn-ff', cs.fontFamily);
    h.style.setProperty('--turn-fw', cs.fontWeight);
    h.style.setProperty('--turn-ls', cs.letterSpacing);
    $$('em', h).forEach((em) => {
      if (em.children.length) return; // (only plain words)
      // (data-turn="letters": each letter turns on its own, one after another, a change running
      // through the word; the simple site's hero, 16 Nov)
      const parts = h.dataset.turn === 'letters' ? [...em.textContent] : em.textContent.split(/( +)/);
      em.textContent = '';
      let i = 0;
      parts.forEach((p) => {
        if (!p) return;
        if (/^ +$/.test(p)) { em.append(p); return; }
        const w = document.createElement('span'), was = document.createElement('span'), is = document.createElement('span');
        w.className = 'turn-w'; was.className = 'turn-was'; is.className = 'turn-is';
        was.setAttribute('aria-hidden', 'true');
        was.textContent = is.textContent = p;
        w.style.setProperty('--i', i++);
        w.append(was, is);
        em.append(w);
        words.push({ w, was, is });
      });
    });
  });
  // the upright word pressed to the width its italic will have
  const measure = () => words.forEach(({ w, was, is }) => {
    const a = was.scrollWidth, b = is.offsetWidth;
    if (a && b) w.style.setProperty("--k", Math.min(1.16, b / a).toFixed(4)); // (pressed, or stretched a little, never far)
  });
  measure();
  document.fonts?.ready.then(measure);
  addEventListener('resize', measure);
  const turn = (h) => h.classList.add('is-turned');
  // (a heading already on screen when the page opens turns a moment after; the rest as they come up)
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    setTimeout(() => turn(e.target), performance.now() < 2500 ? 700 : 120);
  }), { rootMargin: '0px 0px -14% 0px', threshold: 0.5 });
  heads.forEach((h) => io.observe(h));
  const handle = { heads, measure, all: () => heads.forEach(turn), back: () => heads.forEach((h) => h.classList.remove('is-turned')) };
  if (local) window.__turn = handle;
  return handle;
}
