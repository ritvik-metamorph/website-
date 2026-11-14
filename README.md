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
- The way in shows once per visit. To see it again, add `?intro` to the end of the address.

## The pages

| Page | File | What is on it |
|---|---|---|
| Home | `index.html` | The way in, the hero options, services, the team on coins |
| About | `about.html` | The firm's story, readable at three lengths, with one silver thread down the page |
| Sectors | `sectors.html` | The founder's grid of 27 disciplines and 48 sectors, woven as a loom, with a page for each sector |
| Creative corner | `creative.html` | The galleries, then the works, a chapter for each creative domain |

Every page ends with the Metamorph signature.

## Choices we would like from you

1. **The hero.** Seven options run one after another on the home page, each named at the top
   right (Hero 1 of 7 and so on): 1, the horizon; 2, the gathering; 3, the eyespot; 4, the
   emergence; 5, the emergence, in rings; 6, the flight; 7, the ascent. Please tell us which one
   to keep, or what you like in each.
2. **The creative corner's opening.** On a laptop, three galleries: Gallery 1, without visitors;
   Gallery 2, with visitors; Gallery 3, the pedestal. On a phone, the gallery and the pedestal.
   Please pick one.
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
