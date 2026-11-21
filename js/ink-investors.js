// The Investor Corner, simple site (ink-investors.html; css/investors.css says what it is; js/ink.js what
// the simple site is). On paper: the four rings of the parts of wealth in ink grain, lighter than the
// creative site's, and the Family Wealth Picture's house engraved in ink.

import { inkPage } from './ink.js';
import { ringsWithKey } from './wealth-rings.js';
import { wealthTool } from './wealth-tool.js';
import { setupCollection, setupRisk, setupFinder } from './wealth-parts.js';

const { reduced, local } = inkPage();
const wrap = document.querySelector('.iv-rings-wrap');
const rings = wrap ? ringsWithKey(wrap, { skin: 'ink', reduced, density: 0.8 }) : null;
const tool = wealthTool(document.querySelector('.iv-tool'), { skin: 'ink', reduced, rings });
// (19 Nov) the collection, the line of risk and the strategy finder
const coll = setupCollection(document.querySelector('[data-coll]'));
const risk = setupRisk(document.querySelector('[data-risk]'));
const find = setupFinder(document.querySelector('[data-find]'));
if (local) window.__investors = { rings, tool, coll, risk, find };
