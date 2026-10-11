# Phase 9 — forensic visual audit against Reference A and Reference B

**Method.** Each page was captured at 390 × 844 and 1366 × 768 (plus 360, 768
and 1920 for the hero and intro) with `tests/e2e/shots.mjs`,
`tests/e2e/worldshot.mjs` and the studio renders, in the same state as the
reference: the intro at rest, each section scrolled to its top. The captures were
compared side by side with `docs/reference/reference-a-royal-intro.jpg` and
`docs/reference/reference-b-website.webp`.

**Statuses:**
- **PASS** — matches the reference closely enough.
- **PARTIAL** — present, but visibly different or less rich.
- **FAIL** — missing.
- **N/A (policy)** — the reference shows something this site must not invent.

**Priority:** P0 broken; P1 major mismatch; P2 material, lighting or
composition; P3 polish.

## Rendering strategy (as found)

| Layer | Technique |
| --- | --- |
| Royal intro | Live WebGL scene (three.js / R3F); every object modelled in code, textures baked on the GPU at start-up |
| Section scenes | Stills rendered from the same 3D world with sun shadows, ambient occlusion and depth of field (`npm run stills`) |
| Couple | Generated vector illustration (`tools/couple/build_couple.py`), set into the 3D scene as a card |
| Ornament, cards, controls | SVG and CSS; generated parchment texture |
| Fireworks, petals | 2D canvas, paused off-screen |

## Reference A — royal intro

| Object | Reference | Implementation | Status | Correction / note |
| --- | --- | --- | --- | --- |
| Left and right palace doors | dark carved wood, gold inlay | rosewood with relief carving (jali lattice, cusped arch, lotus mandala on a raised disc, caparisoned elephant, lozenges), gilt beading and bosses; normal, AO and roughness maps | PASS | — |
| Carving depth and occlusion | deep relief | height-to-normal plus cavity AO baked per pixel | PASS | — |
| Gold edges and hardware | gilt edges, ring handles | gilt beads and strips, brass ring handles, threshold | PASS | — |
| Jasmine garlands | heavy white strands | toran swags and strands of five-petal flowers, buds and leaves with rose and marigold accents (instanced) | PASS | Buds lightened to 40 triangles for performance; same look |
| Flowers at the doorway corners | roses, greenery at the top corners | garden roses (petal by petal), jasmine sprays, glossy leaves and bougainvillea at both upper corners, anchored to the visible frame on every screen | PASS | **Added in Phase 9** (`FloralCorner` in `Vestibule.tsx`) |
| Sunset sky and clouds | warm glowing sky, soft clouds | gradient dome with sun disc, halo and banded clouds | PARTIAL (P3) | Clouds are thinner and less painterly than the reference |
| Distant palace | domes and minarets in haze | palace with onion dome, chhatris, minarets, lit arches, strings of lights, hazed | PASS | — |
| Mandap through the doors | flower-hung mandap | fluted columns wound with garlands, carved entablature, bell fringe, gathered silk ceiling, chandelier, drapes, seats, rose urns, diyas | PASS | **Detailed in Phase 9** (`Mandap.tsx`) |
| Brass lamps and flames | kuthuvilakku lamps | lathe-turned brass lamps, five flickering flames each, warm local light | PASS | — |
| Lotus flowers | pink lotus in urlis | three rings of cupped, colour-graded petals, pod and stamens, pads | PASS | — |
| Marble floor and reflections | polished marble | veined marble with environment reflections; planar reflection on the ultra tier | PARTIAL (P3) | Planar reflection is costly on phones; the env-mapped floor is kept |
| Rose petals | floating petals | falling, tumbling petals plus petals resting on the floor | PASS | — |
| Envelope | emerald velvet, gold embroidery | velvet with sheen; embroidered cord border, lotus, tendrils and sequins as a satin-stitch normal map; gold piping; opening flap and lining | PASS | — |
| D&V wax seal | red and gold seal | domed wax with D&V relief, rim and clear coat; cracks open | PASS | — |
| Tassel | full gold tassel | cord, cap, ball and 140 strands with a damped swing | PASS | — |
| Title, names, date | as specified | exact text; contrast 7:1 or better (measured) | PASS | — |
| Tap-to-open button | emerald cartouche | SVG cartouche, pulse, hover and focus glow | PASS | — |

## Reference B — main website

### 1. Hero

| Object | Status | Note |
| --- | --- | --- |
| Palace garden scene (archway, palace, mandap) | PASS | Marble cusped archway with fluted columns, carved band, gilt medallion, bells and bougainvillea; palace and mandap behind; three framings |
| Couple illustration | PARTIAL (P2) | Embroidered sherwani (paisley weave, brocade yoke, buttoned placket, hem band), leheriya safa with sarpech and kalgi, a sage lehenga with buti, kalis and zardozi borders, a sequinned dupatta, jewellery and varmalas. The reference couple is painterly and embracing, with fuller facial detail; ours are stylised in profile. Kept as the approved illustrated concept. |
| Lamps, shrubs, marigold borders | PASS | — |
| Water channel with reflected lamps (reference foreground) | PARTIAL (P3) | Our hero shows the aisle; the pool appears in the venue scene |
| Petals and light | PASS | Drifting petals and motes (canvas, paused off-screen) |
| Typography, monogram, CTA, scroll cue, navigation | PASS | — |

### 2. Invitation

| Object | Status | Note |
| --- | --- | --- |
| Parchment scroll, rollers, knobs, tassels | PASS | Generated paper texture, gilt rollers |
| Mandap emblem, dividers, wording hierarchy | PASS | — |
| Wax seal with silk tassels | PASS | Rendered from the 3D seal and tassel models |
| Flowers around the scroll | PASS | Rose corners top and bottom, jasmine strands at the edges. **Bottom corners added in Phase 9** |
| Lamps beside the scroll | PASS (desktop) | Hidden on phones for space |

### 3. Living Wedding Calendar

| Object | Status | Note |
| --- | --- | --- |
| Date cards (jharokha lanterns), active state | PASS | — |
| Countdown card, figures, separators | PASS | Digits settle with a soft fade |
| Background (palace, pool, trees) | PASS | — |
| Lotus and lamp in the foreground | PASS | — |

### 4. Wedding Compass

| Object | Status | Note |
| --- | --- | --- |
| Compass dial, needle, emblem, cardinal letters | PASS | Turns to the hovered or focused destination |
| Ornate arch framing the dial | PARTIAL → **fixed in Phase 9** | Gilded cusped arch drawn behind the dial (`CuspedArch`) |
| Four destination tiles, icons, active state | PASS | Gold needle-tip marker on the active tile |
| Flowers | PASS | Four corners |

### 5. Celebrations

| Object | Status | Note |
| --- | --- | --- |
| Day selectors | PASS | — |
| Day panel | PASS | — |
| Named events with descriptions (reference: "Welcoming our guests", "Traditional rituals", "Family get-together") | N/A (policy) | Not confirmed by the family; the panel says timings and programme are not yet published |
| Mandap scene | PASS | Detailed mandap still |

### 6. Venue

| Object | Status | Note |
| --- | --- | --- |
| Palace view in an arched window | PASS | Illuminated palace over its reflecting pool with floating diyas |
| Address card, directions, map, add-to-calendar | PASS | — |
| Flowers and lamps | PASS | Four floral corners; brass lamp |

### 7. Guest Services

| Object | Status | Note |
| --- | --- | --- |
| Four cards (travel and stay, local guide, etiquette, need help) | PASS | Honest content; Call and WhatsApp on the confirmed number |
| Lounge scene below the cards (reference) | PARTIAL (P3), substituted | A lamp-lit dusk view of the garden in an arched window |

### 8. RSVP

| Object | Status | Note |
| --- | --- | --- |
| Paper card, heading, rule | PASS | — |
| Inputs, radio choices (selected and unselected), attendees, message | PASS | Custom maroon check state; validation messages |
| WhatsApp button, helper, ready state, privacy note | PASS | — |
| Flowers around the card | PASS | Four corners. **Bottom corners added in Phase 9** |

### 9. Closing and footer

| Object | Status | Note |
| --- | --- | --- |
| Dusk scene with the lit palace | PASS | — |
| Names, blessing, message, rule | PASS | — |
| Share, directions, add to calendar (plus RSVP) | PASS | — |
| Foreground flowers and lotus pond, stone elephant (reference) | PARTIAL (P3) | Dusk-toned flower corners **added in Phase 9**; no pond or statue |
| Footer emblem, credit, back to top | PASS | — |
| Magic moment: fireworks and coloured smoke | PASS | Requested by you; plays once when the scene is in view, replayable |

### Header, menu and controls

| Object | Status | Note |
| --- | --- | --- |
| Monogram, section links, active state | PASS | — |
| Language pill (EN · ಕನ್ನಡ · हिन्दी), music control, menu | PASS | Matches the reference's header cluster |
| Menu sheet / side panel | PASS | Not shown in the reference; inspected separately |

## Motion and interaction

| Item | Status | Evidence |
| --- | --- | --- |
| Intro opening (seal, flap, card, doors, crane move, light) | PASS | `intro.mjs`; frame captures through the timeline |
| Skip, Escape, repeated taps, reload, session | PASS | `intro.mjs` |
| Section reveals, compass, countdown, menu | PASS | Inspected; reduced motion shows everything at once |
| Language switching keeps state and place | PASS | `features.mjs` |
| Fireworks: timing, no strobing, off-screen idle | PASS | Deterministic frame captures (`window.__fireworks.seekTo` in dev) |
| Animations pause off-screen | PASS | Petals and fireworks stop; the intro canvas unmounts when finished |

## Assets

| Asset | Resolution | Note |
| --- | --- | --- |
| Hero, garden, mandap, venue, closing stills | rendered at 2×, Lanczos down to 900–1920 px wide | WebP, 7–244 KB; no compression artefacts visible at display size |
| Floral corners, lotus, garland, strand, lamp, seal | stored at about 2× their display size | WebP with alpha, clean edges (no halos on ivory or dusk) |
| Couple | vector | 72 KB SVG |
| Music | 128 kbps MP3 | 2.4 MB, loaded only when played |

## Remaining, ranked

- **P2 — couple illustration:** facial detail and a more natural, painterly
  rendering. A further illustration pass would be needed, keeping the approved
  concept.
- **P3 — sky:** richer, more painterly clouds in the sunset sky.
- **P3 — closing foreground:** a lotus pond and stone elephant, as in the
  reference.
- **P3 — guest services:** a lounge scene in place of the garden window.
- **P3 — mobile floor:** planar marble reflections, if budget allows.

No P0 or P1 findings remain.
