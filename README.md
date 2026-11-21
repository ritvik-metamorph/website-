# Metamorph Capital: the website, for review

A working draft of the Metamorph Capital website, shared for your review. It is a static site: it
runs entirely in the browser, with nothing to install. Nothing here is final, and some of the
content is placeholder (listed below).

## How to look at it

- Start on a laptop, in an up-to-date Chrome, Safari or Edge, then look again on a phone. The heroes
  are drawn live in 3D, so a laptop shows them best.
- The site opens with "the way in": a silver cocoon that opens into a butterfly, and a choice of two
  versions. **Ink** is the simple version, for a quick read. **Light** is the creative version. You
  can switch at any time with the round button at the bottom left ("Enter Ink" or "Enter Light").
- On the creative home page, the services are a banknote under a desk lamp that folds itself into a
  butterfly as you scroll through the four services. The simple home page is one screen: the film and
  the line; everything about the firm is on the simple About.
- Menu, at the top, opens every page of the site.
- The way in shows once per visit. To see it again, add `?intro` to the end of the address.

## The pages

| Page | File | What is on it |
|---|---|---|
| Home | `index.html` | The way in, the hero options, services, the team on coins |
| About | `about.html` | The firm's story, readable at three lengths, with one silver thread down the page |
| Sectors | `sectors.html` | The founder's grid of 27 disciplines and 48 sectors, woven as a loom, with a page for each sector |
| Creative corner | `creative.html` | A walk into a museum in first person, then the works: every piece on one wall, a filter to zoom into each creative domain (one page for both versions) |
| Investor corner | `investors.html` | Where money becomes wealth: the four rings of Earn, Spend, Invest and Save; things worth spending on; saving and investing on a line of risk, where to keep savings and a strategy finder; then the Family Wealth Picture, answered by a home that grows with the family's money, in a picture and a sentence, no figures |
| Home, simple | `ink.html` | The film hero alone, one screen: who we are is on the simple About |
| About, simple | `ink-about.html` | The name's meaning as a dictionary entry, then the firm's own words from the Notion page: vision, the four services, the deal, the practice, values, the founders and the team on coins |
| Sectors, simple | `ink-sectors.html` | The founder's grid drawn, then every sector as an index you can search |
| Services, simple | `ink-services.html` | Your four services from the Notion, each a chapter that comes up over the last: the deal's three hands, the eight services, the family's wealth as rings, the founder's journey (change the working style), the statement and the practice's stamp |
| Investor corner, simple | `ink-investors.html` | The same page on paper |

Every page but the simple home ends with a suggestion of where to go next (the next part of the site you have not seen yet, the creative corner last, and Talk to us once you have seen everything), then the same foot: an index of the whole site, then the Metamorph wordmark, where the butterfly from the way in comes back to settle.

## Two versions of the site

- **Ink, the simple version** (`ink.html`, `ink-about.html`, `ink-services.html`, `ink-sectors.html`, `ink-investors.html`): for a quick read and a
  decision, still creative, light to load. Each section's type does something of its own as you read
  (on About, rest on the word Metamorph). The hero will be a film of the evolution of people; until
  then a reel of the silver cocoon becoming a butterfly stands in.
- **Light, the creative version** (`index.html`, `about.html`, `sectors.html`, `investors.html`): for the whole vision.
- Choose on the way in, or switch at any time with the round button at the bottom left; each page opens its
  twin in the other version. The creative corner (`creative.html`) is one page for both.

## Choices we would like from you

1. **The hero.** Three options run one after another on the home page, each named at the top right:
   Hero 9, the ascent in grain (from the foot of the spiral up through it, out over the crown, settling into the
   orbits; point at a discipline or a sector to see what it moves); Hero 7, the ascent (a journey up through the seven
   orbits); Hero 8, the orbits, in grain (drag to turn them, hold to open them). To see one alone, as it would be once chosen, add
   `?hero=` and its number to the address (for example `index.html?hero=8`).
2. **The creative corner's opening**: a first-person walk into a museum with your own hands in view (scroll to walk,
   drag to look round); the art of the day, the week and the month on its walls; point at one and your hand points;
   under each, a thumbs up (your hand gives one), Hire and See in detail; at the door, "Enter the gallery": your hand
   pushes it, the room goes to black and the works arrive. "Enter the gallery" at the bottom right skips straight there.
   Look up on the way. To see the hands in white cotton gloves instead, add `?hands=gloves` to the address.
3. **The works**: every piece at once on one wall, in an order that changes each
   day so no artist comes first. Choose a domain above it (Film making, Graphic design and the rest)
   and the wall zooms into that domain's work; All goes back. Open any piece: it stands alone on black, with a white card beside it (below it on a phone) that has its maker, the ways to hire or enquire, more of the maker's work and more like it.

## What is placeholder

- **The logo.** "Metamorph" in the nav is set in type until we have the logo file.
- **The team.** The names, roles, answers and joining years on the coins are invented; the
  portraits are drawn stand-ins until we have photographs.
- **The creative corner.** The artists, titles, prices and availability are invented. The artwork
  shown is our studio's own design work, standing in until the real submissions arrive. The art of
  the day, week and month are yours to choose; for now they rotate by date.
- **Sector pages.** Each sector's own write-up, numbers and the companies Metamorph has worked with
  are still to come.
- **The simple version's pictures.** Drawn by us from the site's own scenes (the cocoon and the
  butterfly, the banknote, the founders' coins), standing in for photographs. The film for the simple
  home page is still to be made.
- **The investor corner.** The calculator uses the assumptions stated in the calculator you shared
  (earnings, prices, savings and investment returns, and its steps for the home, vehicles and pets);
  the starting household is our example. Still to come from you: the pieces worth spending on (with
  photographs), the saving table's rows confirmed, the investing strategies and their earnings bands,
  and where "Have a word with us" goes. The painted picture of the home is being made; until then a
  3D home stands in.
- **The metrics panel** (from an orbit, a discipline or a sector in the hero) is a placeholder for
  the metrics page.
- **Links with nowhere to go yet** (Hire, Enquire, Contact and some others) show a "coming next"
  note. We need a destination for each: an inbox, a form or a booking link.
- **The copy** is a draft for you to correct.

## Sending feedback

Name the page and the section (the hero number where there is one), and the device or
screen you used. A screenshot helps.

## Running it on your own computer

Serve the folder with any static web server, then open the address it gives. For example, from
inside this folder:

```bash
python3 -m http.server 8000
```

then open http://localhost:8000. Opening `index.html` straight from the folder does not work,
because the scripts need to be served.

## On GitHub Pages

The folder is the whole site, ready to be a repository as it is: the pages at the top, `css/`, `js/` and `assets/`
beside them, `.nojekyll` so GitHub serves every file untouched. In the repository's Settings, under Pages, choose
Deploy from a branch, the main branch and its root (/). Every link is relative, so it works at the address GitHub
gives (`https://<name>.github.io/<repository>/`).

## Built with

GSAP (with ScrollTrigger and CustomEase), Lenis and three.js, kept in `assets/vendor/` with their
licences (`assets/vendor/LICENSES.txt`). Fonts: Open Sauce One (from Fontsource), and from Google Fonts
Cormorant, Fragment Mono, Ibarra Real Nova, Monsieur La Doulaise and Pinyon Script. The pages ask search
engines not to index this draft.
