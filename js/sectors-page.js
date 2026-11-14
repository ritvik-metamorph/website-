// The Sectors page (sectors.html): what every page shares (js/site.js), then the page itself
// (js/sectors.js).

import { boot } from './site.js';
import { setupSectors } from './sectors.js';

const { lenis, register, reduced, isTouch, local } = boot();
setupSectors({ lenis, register, reduced, isTouch, local });
