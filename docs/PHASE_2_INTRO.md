# Phase 2 — Royal intro: implementation notes

## Scene

Reference A is rebuilt as a layered 2.5-D scene inside a stage that keeps the
painting's 864 × 1536 proportions and fills the screen height
(`src/components/intro/`):

back → front: backdrop (sky, palace, mandap, garden) · sunlight rays · two
palace doors (hinged at their outer edges) · jasmine garland frames ·
envelope (inside → glow → invitation card → velvet pocket + pedestal → flap with
the top half of the wax seal, lining on its back) · brass lamp stands ·
flickering flame glows · foreground diyas and lotus bowls · petals and gold dust
(canvas) · live text and the "Tap to open" cartouche.

- **Phones:** the stage is wider than the screen and is cropped evenly at the
  door edges; nothing important is cut.
- **Tablets / desktops:** the doorway stands in a candle-lit palace hall built
  from the same painting's carved panels, garlands and lamps, falling into
  shadow away from the door.
- **Short landscape screens:** the scene keeps the left of the screen and the
  invitation text sits beside it.

## Opening sequence (one GSAP timeline, ≈ 4.5 s)

| t (s) | |
| --- | --- |
| 0.0 | the envelope gives under the touch, the seal warms, the lettering fades |
| 0.4 | the wax seal cracks (gold sparks); its top half lifts |
| 0.5–1.5 | the flap rotates open over its hinge; the lining shows; warm light rises |
| 1.05 | the invitation card rises out of the pocket |
| 1.2–2.9 | the palace doors swing wide, shading as they turn |
| 1.75–3.75 | the camera moves through the doorway; foreground lamps pass by; petals stream past |
| 2.4–3.95 | light spills through the doorway and turns to the website's ivory |
| 3.95–4.5 | the intro fades, revealing the real hero underneath (focus moves to its heading) |

Repeated taps are ignored once the sequence starts. The intro is a modal
dialog; the page behind it is `inert` until it finishes.

## Skip, reload and session

- **Skip intro** (top right, keyboard and touch) and **Escape** cancel any running
  timeline and fade to the site in 0.35 s.
- Shown on the first visit of a browsing session; once opened or skipped,
  refreshing goes straight to the site (`sessionStorage` key `w2:intro`).
  `?intro` forces it, `?nointro` or a deep link (e.g. `#venue`) skips it.
- If storage is blocked, the intro simply shows. If the scene images fail to
  load, the text and button still appear over a warm gradient and opening goes
  straight to the site — never a blank screen. A loader shows while the first
  images decode (6 s cap).

## Reduced motion

No camera move, door swing, flicker or petals: tapping shows the flap open and
the card risen, then fades to the site in under a second.

## Rendering safeguards

Three Chromium compositor stalls were found and designed out (each froze all
painting while the page stayed responsive):
1. `transform-style: preserve-3d` on the doors combined with their shading
   pseudo-element.
2. A CSS `filter` glow on the focused "Tap to open" button inside a fading
   parent.
3. SVG gradients in bounding-box units on zero-height / zero-width ornament
   strokes.

`tests/e2e/introperf.mjs` guards against regressions at every viewport,
including a landscape phone and the keyboard path.
