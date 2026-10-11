# Phase 2 — Royal intro: implementation notes

## Scene

Reference A is rebuilt as a real-time 3D scene (`src/three/`, see
`docs/ASSETS.md` for how each object is made). It is lazy-loaded, so the main
site bundle does not pay for it.

The camera stands in a candle-lit palace vestibule, close to a gilded
pedestal. On it rests the emerald velvet envelope, sealed with the D&V wax seal
and hung with a gold tassel. Carved rosewood doors stand ajar behind it, and
through them the sunset garden runs down a velvet-carpeted marble aisle to the
mandap and an illuminated palace. Brass lamp stands, diyas, lotus urlis, jasmine
garlands and falling rose petals frame the shot.

- **Framing** (`framing()` in `IntroWorld.tsx`) is chosen per screen shape:
  - Portrait phones use a closer, taller view.
  - Wide screens move the camera back so the envelope sits mid-frame.
  - Props near the edges (lamp stands, urlis) are placed from the visible width,
    so they stay in frame on narrow phones.
- **Lettering** is HTML over the canvas, positioned per breakpoint so it never
  covers the envelope. This is checked by `tests/e2e/intro.mjs` against the
  envelope's projected screen rectangle. A soft haze of warm light behind the
  title keeps it legible over the doors and the lit palace (contrast ≥ 7:1,
  `tests/e2e/introcontrast.mjs`).
- **Short landscape screens** set the lettering beside the scene.

"Closed state" is read as the sealed, unopened invitation. The doors stand
slightly ajar, as in Reference A, then swing wide when the invitation opens.

## Opening sequence (one GSAP timeline, about 4.6 s)

| t (s) | |
| --- | --- |
| 0.0 | the envelope gives under the touch; the lettering fades |
| 0.42 | the wax seal cracks along its line; the tassel swings |
| 0.5–1.55 | the flap lifts over its hinge, showing its lining; warm light rises from inside |
| 1.05 | the invitation card rises out of the pocket |
| 1.2–2.9 | the palace doors swing wide |
| 1.6–3.9 | a crane move: the camera lifts clear of the envelope, passes through the doorway and glides down the aisle toward the mandap |
| 2.65–4.05 | light fills the frame and turns to the website's ivory |
| 4.05–4.6 | the intro fades, revealing the real hero underneath; focus moves to its heading |

Repeated taps are ignored once the sequence starts. A tap during the fade-in
hands over smoothly to the timeline. The intro is a modal dialog, and the page
behind it is `inert` until it finishes.

## Skip, reload and session

- **Skip intro** (top right; keyboard, mouse and touch) and **Escape** cancel
  any running timeline and fade to the site in 0.35 s.
- The intro shows on the first visit of a browsing session. Once it has been
  opened or skipped, a refresh goes straight to the site (`sessionStorage` key
  `w2:intro`).
- `?intro` forces the intro. `?nointro`, or a deep link such as `#venue`, skips
  it.
- If storage is blocked, the intro simply shows.

## Fallbacks — never a blank screen

- **No WebGL**, the 3D code failing to load, or a render error: the lettering
  and button appear over a warm painted gradient, and opening goes straight to
  the site.
- **GPU context lost** while the intro is showing: the scene is dropped and the
  same painted fallback takes over, with the text intact.
- A loader ("Preparing your invitation…") shows while fonts load and textures
  bake. The scene is revealed after 9 s at most, whatever happens.

## Performance

- **Quality tiers** (`quality.ts`) are picked from device memory, CPU cores and
  pointer type. They scale pixel ratio, shadows, reflections, depth of field
  and petal count.
- **Pixel budget:** each tier caps the render-target size, so large screens
  render slightly below native resolution instead of dropping frames.
  PerformanceMonitor steps resolution down further if the GPU falls behind.
- **Instancing** draws repeated objects (flames, lamps, garland flowers, leaves,
  petals, palace lights) in a few draw calls. The scene is about 290–350 draw
  calls and 0.4–0.5 M triangles.
- **Measured** in headless Edge on an Intel Iris Xe laptop GPU: 47–61 fps idle
  and during the opening, at 360 × 800 through 1920 × 1080 and on a landscape
  phone (`tests/e2e/introperf.mjs`).
- **Cleanup:** when the intro ends, the canvas unmounts and the WebGL context
  is released (checked by the tests).

## Reduced motion

There is no camera move and no door swing. Tapping shows the flap open and the
card risen, then fades to the site in about a second.

## Development tools

These are dev server only:
- `node tests/e2e/worldshot.mjs --t=0.8,1.6,2.4,3.0` saves frames of the
  sequence.
- `node tests/e2e/worldperf.mjs` reports fps, draw calls and triangles.
- `?quality=low|medium|high|ultra`, `?nopost` and `?nogarden` help with
  profiling.
