# Visual assets — provenance

Nothing on this site is a photograph, a stock image, or a crop of the design
references. The references in `docs/reference/` (supplied by the family) are
used only as the brief for composition, palette and mood; no pixels from them
ship with the site.

## Royal intro — modelled and textured in code

The intro (`src/three/`) is a real-time WebGL scene built with three.js and
React Three Fiber. It loads **no image, model or HDR files**. Every object is
geometry written in code, and every surface is a texture painted at start-up:

| Object | Geometry | Surface |
| --- | --- | --- |
| Palace doors and wall panels | boxes with baked relief | Rosewood grain, raised carving (jali lattice, cusped arch, lotus mandala, elephant, lozenges, brass bosses) and gilt inlay, painted as height / gold / groove layers on a canvas, then turned on the GPU into colour, normal and AO-roughness-metal maps (`bake/doorArt.ts`, `bake/bakers.ts`) |
| Envelope | bevelled velvet body, V-cut pocket, hinged flap with piping, rising card | Emerald velvet with gold-thread embroidery (cord border, lotus, tendrils, sequins) baked as a satin-stitch normal map with sheen (`bake/embroideryArt.ts`) |
| Wax seal and tassel | domed seal that splits along a crack line; cord, cap and 140 silk strands with a damped swing | Wax with D&V monogram relief and clear-coat (`bake/sealArt.ts`) |
| Pedestal | bevelled plinth with a gilt band | Repoussé lotus-vine frieze normal map |
| Brass lamps, diyas, urlis | lathe profiles with spouts | Brushed brass (PBR metal) |
| Flames | one instanced billboard field | Flicker shader with a matching flickering point light |
| Lotus, leaves, jasmine and marigold garlands, rose petals | per-petal / per-flower generated meshes, instanced | Vertex colour |
| Marble floor, steps, walkway | planes and boxes | Veined marble (GPU noise) |
| Garden: lawn, shrubs, hedges, palms | planes, instanced leaf cards, tube trunks | Grass (GPU noise) with broad patches and faint mowing stripes in vertex colour; leaf clusters and fronds painted on canvas |
| Tree line | four kinds of tree (rain tree, mango, ashoka, neem) as instanced cards in two rows, turned to the garden and tinted one by one | Each crown painted from thousands of leaf dabs in clumps, shaded under the low sun behind it (dark undersides, a gold rim), with ragged edges and gaps of sky (`objects/Trees.tsx`) |
| Mandap | stepped marble platform, fluted ivory columns on gilt bases with lotus capitals, carved entablature with a bell fringe, gathered silk ceiling, brass chandelier hung with jasmine, tented canopy and kalash, tied-back drapes, two cusped wedding seats, urns of roses, diyas along the step | Sheen cloth with a woven gold border, velvet, gold, carved frieze relief |
| Archway over the aisle | cusped marble arch with engaged fluted columns, bracketed cornice, gilt medallion, kalash finials, bells | Marble with carved lotus-vine relief, gilt piping |
| Flowers | garden roses built petal by petal (golden-angle spiral, rolled rims), jasmine sprays, glossy leaves, bougainvillea (cupped bracts in three, pale throats), instanced | Vertex colour with sheen and clear coat |
| Reflecting pool | water channel with sandstone coping, floating diyas and lotus, lamps along both banks | Reflective water |
| Palace in the haze | blocks, drum, onion domes, minarets, arched windows with carved frames and eaves, crenellation | Sandstone façade painted in ashlar courses with pilasters, carved panels, a lotus-medallion frieze and dentils, with matching relief; lit windows and strings of lights |
| Sky and light | sky dome shader: sun, halo, domain-warped cloud banks lit from the sun's side (gold edges, mauve undersides, a silver lining), high cirrus; detail follows the device tier. An environment cube is made from it | — |

Textures are baked once per visit (about 0.4–2 s on a laptop GPU) after the web
fonts load, because the seal monogram and the card lettering are painted into
them.

The intro's lettering ("A ROYAL INVITATION", the names, the date) and the "Tap
to open" cartouche are live HTML and SVG over the scene, so the text stays crisp,
accessible and translatable.

## Main website — stills from the same world (`public/site/`)

The section scenes are stills rendered from the intro's own 3D world by a
development-only studio page (`studio.html`, `src/three/studio/`), captured at
2× by `npm run stills` (`tools/render/stills.mjs`) and downsampled with
Lanczos filtering into WebP (`tools/render/finish.py`). The studio adds what a
live scene can't afford: 4096 px sun shadows, ambient occlusion and depth of
field.

| File | What it shows |
| --- | --- |
| `hero-wide`, `hero-tablet`, `hero-tall` | The couple on the aisle under the flowered marble archway, the mandap and palace behind (three framings) |
| `garden-*`, `garden-*-soft` | The garden at golden hour; the soft versions sit behind ivory cards |
| `mandap-wide` | The mandap: fluted columns wound with garlands, silk drapes, seats, urns of roses, chandelier |
| `venue-wide`, `venue-tall` | The illuminated palace over its reflecting pool with floating diyas |
| `dusk-wide`, `closing-*` | The palace at dusk (the fireworks play over the closing scene) |
| `lounge-wide` | The guests' lounge on the lawn: a majlis of carved diwans with velvet and embroidered silk cushions, a knotted carpet, a brass tea table, a draped canopy with lanterns and jasmine swags (`objects/Lounge.tsx`) |
| `elephant` | A carved sandstone elephant on a lotus-banded plinth, dressed with a caparison, gilt frontlet, bells and garland, lit for the night (`objects/Elephant.tsx`; the body is one metaball form polygonised by marching cubes) |
| `florals-a`, `florals-b` | Corner arrangements of garden roses, jasmine and bougainvillea |
| `lotus`, `garland`, `strand`, `lamp`, `seal-tassels` | Single objects on transparent backgrounds |

- **The couple** is a vector illustration generated by
  `tools/couple/build_couple.py` (faces in `tools/couple/faces.py`) from traced
  contours: profile heads drawn from proportioned landmarks (eyes with iris,
  lashes and kohl, brows hair by hair, ears, lips, beard and hair in strands),
  clasped hands with mehendi and a bridal chooda, woven patterns, embroidered
  borders, jewellery and garlands built motif by motif.
  `tools/couple/paint_couple.py` then relights it as rounded forms: a height
  field from every contour, folds and kalis pressed into the cloth, a warm sky
  fill, a carpet bounce, the sunset as a rim round their silhouette, contact
  shadows between layers, and specular glints on the zari. In the hero it is
  placed into the 3D scene as a card (`src/three/studio/assets/couple.webp`,
  used only by the studio), so it shares the scene's light and depth of field.
  It is an illustration, not a likeness of the couple.
- **Parchment** (`parchment.webp`) is a seamless paper texture generated by
  `tools/render/parchment.py` (frequency-shaped noise).
- **Ornaments** (frames, filigree corners, monogram, compass, cusped arch) are
  inline SVG components in `src/components/decor/`.
- **Fireworks** are drawn live on two canvases (`src/components/magic/`).

## Music (`public/audio/shubh-aagman.mp3`)

*Shubh Aagman* is an original instrumental in raga Yaman, composed and
synthesised entirely by `tools/music/compose.py` (`npm run music`). It is built
from shehnai, santoor, tanpura, dholak, string pad and temple bells. No samples
or recordings are used, so it is original to this project. Format: 128 kbps
stereo MP3, 2 min 32 s, loops seamlessly.

## Fonts

Cinzel, Cormorant Garamond, EB Garamond, Pinyon Script, Tiro Kannada and Tiro
Devanagari Hindi are licensed under the SIL Open Font License 1.1. They are
self-hosted through the Fontsource npm packages. The Kannada and Devanagari faces
are limited to their scripts' Unicode ranges (`src/styles/scripts.css`), so they
download only when that language is chosen.
