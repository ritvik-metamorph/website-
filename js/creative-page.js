// The Creative Corner's own page (creative.html): what every page shares (js/site.js), then the
// corner itself (js/corner.js).

import { boot } from './site.js';
import { setupCorner } from './corner.js';

const { lenis, register, reduced, isTouch, local, say, kinetic } = boot();
setupCorner({ lenis, register, reduced, isTouch, local, say });
// living type (js/kinetic.js) for the headings the works build: the opening's title and each chapter's name
const quicken = () => kinetic.add('.cw-title, .cw-dom');
quicken();
addEventListener('load', () => setTimeout(quicken, 600), { once: true });
