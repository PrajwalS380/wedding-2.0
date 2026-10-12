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
| Couple | Generated vector illustration (`tools/couple/build_couple.py`, faces in `faces.py`), relit as rounded forms by `paint_couple.py`, set into the 3D scene as a card |
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
| Sunset sky and clouds | warm glowing sky, soft clouds | gradient dome with sun disc and halo; domain-warped cloud banks lit from the sun's side (gold edges, mauve undersides, silver lining near the sun) and high cirrus; detail by device tier, drawn after the scene so hidden sky costs nothing | PASS | **Rebuilt after Phase 9** |
| Distant palace | domes and minarets in haze | palace with onion dome, chhatris, minarets, lit arches with carved frames and eaves, a painted sandstone façade (ashlar, pilasters, carved panels, lotus-medallion frieze, dentils) with relief, strings of lights, hazed | PASS | Façade detail **added after Phase 9** |
| Trees beyond the lawn | soft, leafy tree line | four kinds of tree painted leaf-clump by leaf-clump, backlit with a gold rim, in two rows of depth (were flat silhouettes) | PASS | **Rebuilt after Phase 9** (`Trees.tsx`) |
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
| Couple illustration | PASS (style differs) | **Redrawn after Phase 9:** anatomical profile heads (brow, nasion, nose with nostril wing, philtrum, two-tone lips, chin, jaw, throat), almond eyes with iris, catch-light, lid crease and lashes (kohl wing for the bride), brows hair by hair, ears with helix and tragus, beard and hair in strands, a bandhgala collar, clasped hands with mehendi, a ring and a red-and-ivory chooda. Then relit as rounded forms: cloth folds and kalis pressed in, sky fill, carpet bounce, a sunset rim round the silhouette, contact shadows, glints on the zari. The reference couple embraces in a 3/4 view; ours stand in profile in the miniature-painting manner |
| Lamps, shrubs, marigold borders | PASS | — |
| Lawn | PASS | Broad patches and faint mowing stripes (were a flat green) |
| "Scroll to explore" cue on wide screens | PASS | **Fixed:** it sat unreadable over grass; now on a soft pool of light |
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
| Ornate arch framing the dial | PARTIAL → **fixed in Phase 9** | Gilded jharokha niche drawn behind the dial (`CompassArch`) |
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
| Lounge scene below the cards (reference) | PASS | **Added after Phase 9:** a majlis on the lawn under a draped canopy: carved diwans with velvet mattresses, embroidered silk cushions and tasselled bolsters, a knotted carpet, a brass tea table, lanterns, jasmine swags and lamps (`Lounge.tsx`, `lounge-wide`) |

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
| Foreground flowers and lotus pond, stone elephant (reference) | PASS | Dusk-toned flower corners (Phase 9) and **a carved sandstone elephant on a lotus-banded plinth, with caparison, frontlet, bells and garland** (`Elephant.tsx`); the long pool with lotus and diyas shows on phones. No separate foreground pond |
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

- **P3 — couple pose:** the reference shows an embrace in 3/4 view; ours is a
  profile pair holding hands (kept: it reads as a miniature painting and avoids
  inventing a likeness).
- **P3 — mobile floor:** planar marble reflections, if budget allows.
- **P3 — closing foreground pond:** the pool shows on phones; on wide screens the
  closing frames the sky and palace instead.

No P0, P1 or P2 findings remain.

## Rendering note

Large stills are rendered at 1.5× with half-resolution ambient occlusion and
2048 px shadows (`npm run stills -- --dsf=1.5 --lite`) on this laptop GPU, and
downsampled; the difference from 2× is not visible at display size. A failed
or blank frame never replaces an existing still.
