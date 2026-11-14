// The Creative Corner's own page (creative.html): what every page shares (js/site.js), then the
// corner itself (js/corner.js).

import { boot } from './site.js';
import { setupCorner } from './corner.js';

const { lenis, register, reduced, isTouch, local, say } = boot();
setupCorner({ lenis, register, reduced, isTouch, local, say });
