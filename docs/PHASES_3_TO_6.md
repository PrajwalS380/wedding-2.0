# Phases 3–6 — implementation notes

## Phase 3 — the main website

The page has nine sections, in reading order: hero, invitation, Living Wedding
Calendar, Wedding Compass, celebrations, venue, guest services, RSVP, and the
closing with its footer.

- **Hero:** a still of the palace garden rendered from the intro's 3D world, in
  three framings (landscape, tablet, portrait) chosen with `<picture>`. The
  couple stand on the aisle under a flowered archway. Drifting rose petals and
  golden motes; jasmine strands; a lotus.
- **Section scenes:** each section sits on a softly blurred still of the same
  world, framed with rose and jasmine corners (`FloralFrame`). The calendar sits
  over the palace; the venue window looks onto the illuminated palace over its
  pool.
- **Header:** monogram, main sections (Compass is added at ≥ 1360 px), language
  switch, music control, RSVP pill and a menu. The menu is a full-screen sheet on
  phones and a side panel on larger screens. Focus is trapped while it's open
  and Escape closes it.
- **Facts:** every wedding fact comes from `src/config/wedding.ts`. No ceremony
  times, family names or programme have been confirmed, so the celebrations
  section says so plainly ("Not yet announced", "Not yet published on this
  invitation").

## Phase 4 — motion and atmosphere

- **Section reveals:** content rises softly into place the first time each
  section is seen (`useReveal`, `data-reveal` steps 0–2). Content is hidden only
  after the script runs, so nothing is lost if it fails. With reduced motion,
  everything shows at once.
- **Ambient:** a few petals and motes drift in the hero (a 2D canvas that pauses
  off-screen and in hidden tabs, and is off with reduced motion).
- **Compass:** the dial turns to the hovered or focused destination. The
  matching tile is marked with a gold needle tip and a maroon label, and has a
  pressed state.
- **Countdown:** each changing digit settles with a soft fade; none with reduced
  motion.
- **Magic moment:** fireworks over the palace at dusk in the closing scene. See
  below.

### The fireworks (`src/components/magic/`)

They play once, when the closing scene is mostly in view, and again with "Light
up the sky".

- **Night falls:** the scene dims to a deep blue-violet night first.
- **Rockets:** they climb with a gold spark trail and a smoke wisp.
- **Shells:** peony and chrysanthemum (two-colour stars, glittering trails),
  willow (long drooping gold), ring, crossette (stars that split) and crackle
  (stars that pop).
- **Spark physics:** sparks fall under gravity and air drag, flash white-hot,
  cool through the shell's colour to an ember, twinkle, and leave short trails.
- **Light:** each burst blooms and lights the sky and palace in its colour.
- **Smoke:** smoke drifts from each burst, and coloured smoke (rose, saffron,
  gold, emerald, violet, azure) billows up from both sides of the garden.
- **Masking:** the sky layer is masked at the roofline, so falling sparks sink
  behind the palace.
- **Safety:** about 12 s long, with bursts at least 0.45 s apart and nothing
  that strobes. It does not play automatically with reduced motion, and nothing
  runs when it isn't playing.

## Phase 5 — functionality

- **RSVP:** name, attendance, number of attendees (1–20, optional), and an
  optional message (up to 400 characters).
  - Validation is client-side and accessible; focus moves to the first problem
    and entered values are kept.
  - The reply is composed in the visitor's language
    (`src/lib/rsvp.ts`, unit-tested) and opened as `https://wa.me/919591420987?text=…`.
  - A "ready" panel says the reply reaches the family only when they tap Send,
    and offers a fallback link. Nothing is stored or sent by the website.
- **Calendar file:** `src/lib/ics.ts` builds an all-day event,
  `DTSTART;VALUE=DATE:20261115` to `DTEND;VALUE=DATE:20261117` (exclusive). It
  has no timezone, so it can never shift. Lines use CRLF, are folded at 75 octets
  and escaped. It downloads as `darshan-vathsala-wedding.ics` from the venue
  card and the closing.
- **Share:** uses the system share sheet where available, otherwise copies the
  current page URL. Confirmation appears only after the copy succeeds. No
  production URL is hard-coded.
- **Directions:** every map link uses the confirmed Google Maps URL, in a new tab
  with `noopener`.

## Phase 6 — languages and music

- **Languages:** English, ಕನ್ನಡ and हिन्दी (`src/i18n/`). The Kannada and Hindi
  dictionaries are typed against English, so a missing key fails the build, and
  a unit test also compares keys and looks for leftover English.
  - Switching is instant, with no reload. RSVP input, selections, music, and the
    visitor's place on the page are all kept.
  - The choice is remembered (`localStorage` key `w2:lang`), and
    `<html lang>`, the title and the description follow it.
  - Dates come from explicit name tables, never from the visitor's timezone.
  - The calligraphic names in the hero and intro keep their Latin lettering as
    part of the design; everywhere else the names appear in the chosen script.
- **Music:** *Shubh Aagman*, an original instrumental (see `ASSETS.md`).
  - **Default:** at your request, music is on by default for this invitation.
    This deliberately overrides the brief's "off by default".
  - **First gesture:** browsers allow sound only after a gesture, so it begins,
    fading in, with the visitor's first tap or key press (usually "Tap to open").
  - **Pausing:** the header control pauses and resumes, and a pause is
    remembered (`w2:music`).
  - **Behaviour:** there is a single audio element, playback rests while the tab
    is hidden, and failures show a translated message.
