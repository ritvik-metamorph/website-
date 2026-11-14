// The About page (about.html): what every page shares (js/site.js), then the page itself
// (js/about.js).

import { boot } from './site.js';
import { setupAbout } from './about.js';

const { lenis, register, reduced, isTouch, local } = boot();
setupAbout({ lenis, register, reduced, isTouch, local });
