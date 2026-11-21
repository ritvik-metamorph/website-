// The Investor Corner, creative site (investors.html; css/investors.css says what it is). On the night:
// the four rings of the parts of wealth in silver and gold, the Family Wealth Picture's house drawn in
// silver lines with warm windows. What every page shares comes first (js/site.js).

import { boot } from './site.js';
import { ringsWithKey } from './wealth-rings.js';
import { wealthTool } from './wealth-tool.js';
import { setupCollection, setupRisk, setupFinder } from './wealth-parts.js';

const ctx = boot();
const { register, reduced, local } = ctx;
// (the whole page is the night: the nav takes its light tone throughout)
register({ name: 'investors', commit() {}, revert() {}, under: () => ({ tone: 'light', theme: '#0a101c' }) });

const wrap = document.querySelector('.iv-rings-wrap');
const rings = wrap ? ringsWithKey(wrap, { skin: 'light', reduced, density: 1.5 }) : null;
const tool = wealthTool(document.querySelector('.iv-tool'), { skin: 'light', reduced, rings });
// (19 Nov) the collection, the line of risk and the strategy finder
const coll = setupCollection(document.querySelector('[data-coll]'));
const risk = setupRisk(document.querySelector('[data-risk]'));
const find = setupFinder(document.querySelector('[data-find]'));
if (local) window.__investors = { rings, tool, coll, risk, find };
