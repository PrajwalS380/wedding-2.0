# Darshan & Vathsala — Wedding Website 2.0

The royal-invitation edition of Darshan & Vathsala's wedding website: a cinematic
palace-door intro with an emerald velvet invitation, followed by a romantic
Indian royal-garden website (invitation, Living Wedding Calendar, Wedding
Compass, celebrations, venue, guest services, WhatsApp RSVP and closing).

**Wedding:** Sunday 15 & Monday 16 November 2026 · Bapuji Samudhaya Bhavan,
Shamanur Road, Siddaveerappa Layout, Shamanur, Davangere, Karnataka 577004.

---

## Project identity — independent from Website 1.0

| | Website 2.0 (this project) | Website 1.0 (separate, untouched) |
| --- | --- | --- |
| Repository | https://github.com/PrajwalS380/wedding-2.0.git | https://github.com/PrajwalS380/wedding |
| Local folder | `Downloads/Wedding website 2.0` (its own Git repository) | `D:\wedding_invitation` |
| Dev server | http://127.0.0.1:5174 | http://127.0.0.1:5173 |
| Vercel | its own, separate Vercel project (set up at deployment) | `thedarshanandvathsala` |

Nothing in this repository references, imports or deploys Website 1.0. This
folder sits inside a larger home-directory Git repository on the development
machine; it is a **separate, nested repository** with its own history and its
own `origin` remote, so commits here never touch the outer repository.

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · GSAP (animation timelines) ·
self-hosted fonts via Fontsource (Cinzel, Cormorant Garamond, EB Garamond,
Pinyon Script). No backend, no database, no analytics, no environment variables.

## Scripts

```bash
npm install
npm run dev          # http://127.0.0.1:5174
npm run check        # type-check + lint + unit tests + production build
npm run test         # unit tests (Vitest): dates, countdown, confirmed facts
npm run test:e2e     # browser checks against the dev server (needs Microsoft Edge)
npm run shots        # screenshots of the intro and every section at 5 viewports
npm run build && npm run preview   # production build on http://127.0.0.1:4180
```

The browser checks use `playwright-core` with the locally installed Microsoft
Edge (`channel: 'msedge'`) — no browser download. Point them elsewhere with
`BASE_URL=https://… npm run test:e2e`.

## Where things live

```
src/
  config/wedding.ts     every confirmed fact: names, dates, venue, Maps URL, phone
  config/sections.ts    section ids + labels (navigation, compass)
  lib/time.ts           IST wedding clock: phases, countdown (pure, unit-tested)
  lib/format.ts         date display from explicit tables (no timezone shifts)
  lib/browser.ts        storage that never throws, reduced motion, section scrolling
  components/intro/     the royal invitation intro (dialog over the real page)
  components/layout/    header + phone menu
  components/sections/  hero, invitation, calendar, compass, celebrations,
                        venue, guest services, RSVP, closing / footer
  components/ui/        buttons, monogram, ornaments, icons, section heading
  styles/index.css      design tokens (colour, type, motion, layout, shadows)
docs/reference/         the two approved design references (A: intro, B: website)
tests/e2e/              browser checks (smoke, accessibility, screenshots)
```

## Content rules

- Only confirmed details appear. Ceremony times, family names and an event
  programme are **not** confirmed, so the site never states them; the
  celebrations section says the programme has not been published yet.
- Dates are all-day dates in India Standard Time (UTC+05:30). The countdown runs
  to 00:00 IST on 15 November 2026 and is computed, never hard-coded.
- RSVP is WhatsApp-only: the site prepares a message to +91 95914 20987 and the
  guest sends it themselves. Nothing is stored or transmitted by the site.

## Intro behaviour

The intro is a modal dialog over the real page (the page behind it is `inert`).
It shows on the first visit of a browsing session; after the guest opens or
skips it, refreshing in the same session goes straight to the site
(`sessionStorage` key `w2:intro`). If storage is unavailable the intro simply
shows again — never a blank screen. `?intro` forces it, `?nointro` or a deep
link such as `#venue` skips it.
