# Phase 7 — QA report

**Verdict: READY**, with the known limitations listed below. None of them
affects security, factual accuracy, core functionality or access.

Tested on Windows 11 with Microsoft Edge (Chromium) driven by Playwright, and
Lighthouse 13 on Google Chrome. Dev server: `127.0.0.1:5174`. Production build:
`vite preview` on `127.0.0.1:4180`.

## Commands and results

| Check | Command | Result |
| --- | --- | --- |
| Type check, lint, unit tests, production build | `npm run check` | PASS: 0 type errors, 0 lint problems, 40 / 40 unit tests (6 files), build succeeds |
| Smoke: intro → site, sections, links, facts, overflow, images, errors, storage blocked | `node tests/e2e/smoke.mjs <prod>` | PASS 81 / 81 |
| Intro behaviour: 3D scene, layout at 5 viewports, opening, skip, repeats, session, reduced motion, keyboard, no-WebGL and lost-context fallbacks, WebGL released | `node tests/e2e/intro.mjs` (dev hooks) | PASS 95 / 95 |
| Languages, RSVP → WhatsApp (Kannada), calendar file, share, music | `node tests/e2e/features.mjs <prod>` | PASS 23 / 23 |
| Intro text contrast (WCAG, pixel-measured) | `node tests/e2e/introcontrast.mjs` | PASS 25 / 25 |
| Frames keep flowing (6 sizes incl. landscape phone) | `node tests/e2e/introperf.mjs` | PASS 18 / 18 (39–61 fps; headless caps at ~61) |
| axe-core accessibility, intro and main page, phone and desktop | `node tests/e2e/a11y.mjs <prod> [--lang=kn\|hi]` | PASS 4 / 4 in English, Kannada and Hindi |
| Dependency audit | `npm audit`, `npm audit --omit=dev` | 0 vulnerabilities |
| Lighthouse (desktop preset), `/?nointro` | `npx lighthouse … --preset=desktop` | Performance 98 · Accessibility 100 · Best practices 100 · SEO 100 (FCP 0.4 s, LCP 1.0 s, CLS 0.002) |
| Lighthouse (mobile, simulated slow 4G), `/?nointro` | `npx lighthouse …` | Performance 76–85 across runs · Accessibility 100 · Best practices 100 · SEO 100 (FCP 1.7 s, LCP 4.1 s, CLS 0) |

The intro itself cannot be scored by Lighthouse: its live 3D scene never lets
the page go idle. Its rendering is covered by `introperf.mjs` instead.

## Acceptance checklist

| Item | Status | Evidence |
| --- | --- | --- |
| Correct repository and remote verified | PASS | `origin` → `https://github.com/PrajwalS380/wedding-2.0.git` |
| Production build succeeds | PASS | `npm run check` |
| Existing automated tests pass | PASS | all suites above |
| Royal intro and skip behaviour work | PASS | intro.mjs |
| All website sections render and navigate correctly | PASS | smoke.mjs (sections, in-page link targets), screenshots at 5 viewports |
| Wedding details are accurate | PASS | config unit tests; smoke checks the exact Maps URL; dictionary test checks dates in all languages |
| Countdown calculations are correct | PASS | `time.test.ts`: before, during and after the event, IST boundaries, controlled instants |
| WhatsApp RSVP: correct message and recipient | PASS | `rsvp.test.ts`; features.mjs checks the Kannada message and `wa.me/919591420987` |
| All-day calendar export covers 15–16 November 2026 | PASS | `ics.test.ts`; features.mjs downloads the file: `DTSTART 20261115`, `DTEND 20261117`, CRLF |
| Venue directions open the correct destination | PASS | smoke.mjs (every Maps link, `_blank` + `noopener`) |
| Share and copy-link actions work | PASS | features.mjs (copy fallback, confirmation after success); native share sheet NOT TESTED (headless has none) |
| English, Kannada and Hindi fully audited | PASS | `i18n.test.ts` (keys, empties, leftover English); features.mjs finds no English text on the Kannada page; screenshots of every section in both languages; axe in both |
| Language persistence works | PASS | features.mjs (reload keeps हिन्दी) |
| Music: on by default (your instruction), playback verified | PASS | features.mjs: no autoplay before a gesture; starts on the first tap; pause works and is remembered |
| Mobile, tablet and desktop layouts inspected | PASS | screenshots at 360, 390, 768, 1366 and 1920 px, inspected by eye |
| Keyboard accessibility and reduced motion | PASS | intro.mjs (keyboard path, reduced motion); menu focus trap; axe |
| Security checks | PASS | no secrets or credentials in source; no `dangerouslySetInnerHTML`; URLs built with `encodeURIComponent`; no analytics or third-party scripts; RSVP data leaves the device only in the WhatsApp message the guest sends |
| No known critical issues | PASS | — |
| Website 1.0 untouched | PASS | `D:\wedding_invitation` still at `16804ac`, clean working tree, remote `PrajwalS380/wedding` |
| Website 2.0 independently configurable for Vercel | PASS | static Vite build (`dist/`), no environment variables, no files outside this repository |

## Known limitations

- **Second browser engine:** NOT TESTED. Firefox is not installed on this
  machine; Edge and Chrome (both Chromium) were used.
- **Real phones:** NOT TESTED on physical devices. Phones were emulated by
  viewport, touch and user agent. Frame rates were measured in headless Edge on
  an Intel Iris Xe GPU.
- **Mobile Lighthouse performance (76–85):** the page carries rich imagery and a
  client-rendered app. First paint arrives at 1.7 s thanks to the static splash;
  the hero image is preloaded.
- **Translation wording:** the Kannada and Hindi text has not been reviewed by a
  native speaker, so linguistic review is recommended (dictionaries in
  `src/i18n/kn.ts`, `src/i18n/hi.ts`).
- **Music default:** music is on by default by your explicit instruction,
  overriding the brief's "off by default". It still starts only after a gesture,
  and a pause is remembered.
