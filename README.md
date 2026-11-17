# Metamorph Capital: the website, for review

A working draft of the Metamorph Capital website, shared for your review. It is a static site: it
runs entirely in the browser, with nothing to install. Nothing here is final, and some of the
content is placeholder (listed below).

## How to look at it

- Start on a laptop, in an up-to-date Chrome, Safari or Edge, then look again on a phone. The heroes
  and the galleries are drawn live in 3D, so a laptop shows them best.
- The site opens with "the way in": a silver cocoon that opens into a butterfly, and a choice of two
  versions. **Ink** is the simple version, for a quick read. **Light** is the creative version. You
  can switch at any time with Ink · Light at the top right.
- On the creative home page, the services are a banknote under a desk lamp that folds itself into a
  butterfly as you scroll through the four services. On the simple home page the same note is held
  beside the services, one form for each.
- The way in shows once per visit. To see it again, add `?intro` to the end of the address.

## The pages

| Page | File | What is on it |
|---|---|---|
| Home | `index.html` | The way in, the hero options, services, the team on coins |
| About | `about.html` | The firm's story, readable at three lengths, with one silver thread down the page |
| Sectors | `sectors.html` | The founder's grid of 27 disciplines and 48 sectors, woven as a loom, with a page for each sector |
| Creative corner | `creative.html` | The galleries, then the works, a chapter for each creative domain (one page for both versions) |
| Home, simple | `ink.html` | The film hero, the firm in a sentence, services, how we decide, the team, the founder's grid, the creative corner |
| About, simple | `ink-about.html` | The firm's own words from the Notion page: vision, the four stages, the deal, the practice, values, the founders |
| Sectors, simple | `ink-sectors.html` | The founder's grid drawn, then every sector as an index you can search |

Every page ends with the Metamorph signature.

## Two versions of the site

- **Ink, the simple version** (`ink.html`, `ink-about.html`, `ink-sectors.html`): for a quick read and a
  decision, still creative, light to load. Each section's type does something of its own as you read
  (on About, rest on the word Metamorph). The hero will be a film of the evolution of people; until
  then a reel of the silver cocoon becoming a butterfly stands in.
- **Light, the creative version** (`index.html`, `about.html`, `sectors.html`): for the whole vision.
- Choose on the way in, or switch at any time with Ink · Light at the top right; each page opens its
  twin in the other version. The creative corner (`creative.html`) is one page for both.

## Choices we would like from you

1. **The hero.** Seven options run one after another on the home page, each named at the top
   right (Hero 1 of 7 and so on): 1, the horizon; 2, the gathering; 3, the eyespot; 4, the
   emergence; 5, the emergence, in rings; 6, the flight; 7, the ascent. Please tell us which one
   to keep, or what you like in each.
2. **The creative corner's opening.** On a laptop, four galleries: Gallery 1, without visitors;
   Gallery 2, with visitors; Gallery 3, the pedestal; Gallery 4, the branch (the three picks caught
   in a driftwood branch; walk it slowly and watch the monarch that lives there, from the first piece
   to the last). On a phone, the gallery, the pedestal and the branch. Please pick one.
3. **The works**, under the galleries: each domain as a chapter. "See all at once", at the bottom
   right, shows every piece on one screen. Open any piece to see its room.

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
- **The metrics panel** (from an orbit, a discipline or a sector in the hero) is a placeholder for
  the metrics page.
- **Links with nowhere to go yet** (Hire, Enquire, Contact and some others) show a "coming next"
  note. We need a destination for each: an inbox, a form or a booking link.
- **The copy** is a draft for you to correct.

## Sending feedback

Name the page and the section (the hero or gallery number where there is one), and the device or
screen you used. A screenshot helps.

## Running it on your own computer

Serve the folder with any static web server, then open the address it gives. For example, from
inside this folder:

```bash
python3 -m http.server 8000
```

then open http://localhost:8000. Opening `index.html` straight from the folder does not work,
because the scripts need to be served.

## Built with

GSAP (with ScrollTrigger and CustomEase), Lenis and three.js, kept in `assets/vendor/` with their
licences (`assets/vendor/LICENSES.txt`). Fonts from Google Fonts: Inter Tight, Cormorant, Fragment
Mono, Ibarra Real Nova, Monsieur La Doulaise and Pinyon Script. The pages ask search engines not to
index this draft.
