"""Paints the couple illustration as lit, rounded forms (the studio's hero stills use the result).

The vector art (build_couple.py) is drawn flat. This pass rasterises it without its painted
light and relights it the way the scene lights everything else:
 1. every contour becomes a mask; its distance field gives a rounded height (cloth over a body,
    a cheek, a sleeve), and folds, kalis and drape are pressed into the cloth;
 2. normals from those heights take a warm sky fill from the front, a rose bounce from the
    carpet, and the low sun behind the couple as a rim of light around their silhouette;
 3. layers in front cast soft contact shadows onto those behind (chin on neck, arm on chest);
 4. gold zari and jewellery get specular highlights and glints, sequins sparkle, cloth gets a
    faint weave, and skin warms where the sun shines through its edges.

Writes src/three/studio/assets/couple.webp. Usage: python tools/couple/paint_couple.py
"""
import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
WORK = os.path.join(ROOT, 'tools', 'out', 'couple')
OUT = os.path.join(ROOT, 'src', 'three', 'studio', 'assets', 'couple.webp')
S = 3  # pixels per SVG unit
W, H = 600 * S, 960 * S

os.environ['COUPLE_FLAT'] = '1'
sys.path.insert(0, HERE)
import build_couple as bc  # noqa: E402


# ------------------------------------------------------------------ rasterising
def polygon(points, closed=True):
    pts = []
    for p1, b1, b2, p2 in bc.segments(points, closed):
        for k in range(20):
            t = k / 20
            mt = 1 - t
            pts.append(tuple((mt ** 3 * p1[i] + 3 * mt * mt * t * b1[i] + 3 * mt * t * t * b2[i] + t ** 3 * p2[i]) * S for i in (0, 1)))
    return pts


def contour_mask(points):
    im = Image.new('L', (W, H), 0)
    ImageDraw.Draw(im).polygon(polygon(points), fill=255)
    return np.asarray(im) > 127


def ellipse_mask(cx, cy, rx, ry):
    im = Image.new('L', (W, H), 0)
    ImageDraw.Draw(im).ellipse([(cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S], fill=255)
    return np.asarray(im) > 127


def line_distance(lines):
    """Distance (px) from every pixel to the nearest of the given open curves."""
    im = Image.new('L', (W, H), 255)
    d = ImageDraw.Draw(im)
    for ln in lines:
        d.line(polygon(ln, closed=False), fill=0, width=2)
    return ndimage.distance_transform_edt(np.asarray(im) > 0).astype(np.float32)


def dome(mask, radius):
    """A rounded height: rises like a quarter circle of `radius` units from the edge, then flat."""
    d = ndimage.distance_transform_edt(mask).astype(np.float32)
    r = radius * S
    t = np.clip(d / r, 0, 1)
    return (r * np.sqrt(1 - (1 - t) ** 2)).astype(np.float32)


def mala_spheres(points, r):
    """Heights of a garland's flowers (the same placement as build_couple.mala), as spheres."""
    h = np.zeros((H, W), np.float32)
    m = np.zeros((H, W), bool)
    for row, off in ((0, -2.6), (1, 2.6)):
        for i, (x, y) in enumerate(points):
            if (i + row) % 2:
                continue
            jas = not ((i // 2) % 5 == 2 or (i // 2) % 7 == 4)
            rr = r * (1 if jas else 1.15) * S
            cx, cy = (x + off) * S, y * S
            x0, x1 = int(cx - rr - 2), int(cx + rr + 3)
            y0, y1 = int(cy - rr - 2), int(cy + rr + 3)
            yy, xx = np.mgrid[y0:y1, x0:x1]
            q = rr * rr - (xx - cx) ** 2 - (yy - cy) ** 2
            inside = q > 0
            hz = np.where(inside, np.sqrt(np.maximum(q, 0)), 0).astype(np.float32)
            h[y0:y1, x0:x1] = np.maximum(h[y0:y1, x0:x1], hz)
            m[y0:y1, x0:x1] |= inside
    return m, h


# ------------------------------------------------------------------ the layers, back to front
def fan(waist, hem, y0, y1, n):
    """Fold lines fanning from the waist to the hem of a flared skirt."""
    out = []
    for i in range(n):
        u = i / (n - 1)
        xa = waist[0] + (waist[1] - waist[0]) * u
        xb = hem[0] + (hem[1] - hem[0]) * u
        out.append([(xa + (xb - xa) * k / 6, y0 + (y1 - y0) * k / 6 + 4 * math.sin(k + i)) for k in range(7)])
    return out


def build_layers():
    """Yields (name, mask, height, kind) for each layer, back to front (one height in memory at a time)."""

    def shape(name, key, radius, kind):
        m = contour_mask(bc.shapes[key])
        return name, m, dome(m, radius), kind

    yy = np.arange(H, dtype=np.float32)[:, None] / S

    # the bride
    m = contour_mask(bc.B_VEIL)
    h = dome(m, 12)
    dv = line_distance(bc.VEIL_FOLDS)
    h += 5 * S * np.exp(-(dv / (7 * S)) ** 2)
    yield ('b-veil', m, h, 'sheer')

    m = contour_mask(bc.B_SKIRT)
    h = dome(m, 46)
    dk = line_distance(bc.KALIS)
    flare = np.clip((yy - 420) / 520, 0, 1)
    h -= (3 + 5 * flare) * S * np.exp(-(dk / (6 * S)) ** 2)
    df = line_distance(fan((388, 430), (334, 512), 430, 940, 9))
    h += 4 * S * flare * np.exp(-(df / (9 * S)) ** 2)
    yield ('b-skirt', m, h, 'cloth')

    # head and neck, then hair and bun, then the blouse over the neck's foot
    yield ('b-head',) + face_relief('b-head', bc.faces.BRIDE, 'f')
    yield shape('b-hair', 'b-hair', 12, 'hair')
    cx, cy, rx, ry = bc.faces.bride_bun()
    m = ellipse_mask(cx, cy, rx, ry)
    yield ('b-bun', m, dome(m, 14), 'hair')
    yield shape('b-torso', 'b-torso', 18, 'cloth')
    yield shape('b-veil-cap', 'b-veil-cap', 8, 'sheer')
    m, h = mala_spheres(bc.B_MALA, 4.2)
    yield ('b-mala', m, h, 'flower')
    yield shape('b-arm', 'b-arm', 7, 'skin')
    yield shape('b-sleeve', 'b-sleeve', 7, 'cloth')

    # the groom
    yield shape('g-tail', 'g-tail', 5, 'cloth')
    yield shape('g-leg-b', 'g-leg-b', 13, 'cloth')
    yield shape('g-leg-f', 'g-leg-f', 13, 'cloth')
    yield shape('g-shoe-b', 'g-shoe-b', 6, 'gold')
    yield shape('g-shoe-f', 'g-shoe-f', 6, 'gold')
    yield shape('g-stole', 'g-stole', 5, 'cloth')
    yield ('g-head',) + face_relief('g-head', bc.faces.GROOM, 'm')
    yield shape('g-hair', 'g-hair', 8, 'hair')
    yield shape('g-beard', 'g-beard', 6, 'hair')
    yield shape('g-moustache', 'g-moustache', 2, 'hair')
    m = contour_mask(bc.G_BODY)
    h = dome(m, 44)
    ds = line_distance(bc.SHERWANI_FOLDS)
    h -= 5 * S * np.exp(-(ds / (6 * S)) ** 2)
    yield ('g-body', m, h, 'cloth')
    m = contour_mask(bc.G_TURBAN)
    h = dome(m, 30)
    dp = line_distance([[(200, 122), (220, 92), (252, 70), (298, 76)], [(208, 132), (228, 106), (262, 90), (303, 104)], [(196, 100), (214, 70), (246, 54), (282, 52)], [(212, 142), (240, 124), (272, 116), (312, 124)]])
    h -= 3.5 * S * np.exp(-(dp / (4 * S)) ** 2)
    yield ('g-turban', m, h, 'cloth')
    yield shape('g-kalgi', 'g-kalgi', 3, 'cloth')
    m, h = mala_spheres(bc.G_MALA, 4.6)
    yield ('g-mala', m, h, 'flower')
    yield shape('g-arm', 'g-arm', 11, 'cloth')
    yield shape('g-hand', 'g-hand', 4, 'skin')
    yield shape('b-hand', 'b-hand', 3, 'skin')
    yield shape('g-thumb', 'g-thumb', 2.5, 'skin')


def face_relief(key, head, sex):
    """A head's height: the dome of its outline, plus cheekbone, brow and chin, the eye socket, and the
    step down from the jaw to the neck."""
    m = contour_mask(bc.shapes[key])
    h = dome(m, 20)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    for u, v, r, a in ((0.78, 0.55, 0.12, 0.07), (0.86, 0.38, 0.06, 0.03), (0.88, 0.88, 0.06, 0.035), (0.855, 0.452, 0.045, -0.035), (0.72, 0.72, 0.09, 0.03)):
        cx, cy = head.pt(u, v)
        R = r * head.s * S
        h += a * head.s * S * np.exp(-((xx - cx * S) ** 2 + (yy - cy * S) ** 2) / (R * R))
    del xx, yy
    jaw = [(0.45, 0.80), (0.60, 0.93), (0.75, 1.0), (0.86, 0.985)] if sex == 'm' else [(0.45, 0.80), (0.60, 0.89), (0.72, 0.95), (0.84, 0.92)]
    dj = line_distance([head.P(jaw)])
    h -= 0.045 * head.s * S * np.exp(-(dj / (0.035 * head.s * S)) ** 2)
    return m, h, 'skin'


# ------------------------------------------------------------------ colour
def to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def norm(v):
    v = np.asarray(v, np.float32)
    return v / np.linalg.norm(v)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def main():
    os.makedirs(WORK, exist_ok=True)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    flat_svg = os.path.join(WORK, 'flat.svg')
    flat_png = os.path.join(WORK, 'flat.png')
    with open(flat_svg, 'w', encoding='utf-8') as f:
        f.write(bc.SVG)
    subprocess.run(['node', os.path.join(HERE, 'render.mjs'), flat_svg, flat_png, str(W), str(H)], check=True, cwd=ROOT, shell=os.name == 'nt')
    rgba = np.asarray(Image.open(flat_png).convert('RGBA')).astype(np.float32) / 255
    alpha = rgba[..., 3]
    albedo = to_linear(rgba[..., :3])
    print('rasterised', flat_png)

    # composite normals and the topmost layer at each pixel
    N = np.zeros((H, W, 3), np.float32)
    N[..., 2] = 1
    top = np.full((H, W), -1, np.int16)
    kind_id = {'cloth': 1, 'sheer': 2, 'skin': 3, 'hair': 4, 'gold': 5, 'flower': 6}
    kmap = np.zeros((H, W), np.uint8)
    masks = []
    for i, (name, m, h, kind) in enumerate(build_layers()):
        h = ndimage.gaussian_filter(h.astype(np.float32), 1.4)
        gy, gx = np.gradient(h)
        del h
        n = np.stack([-gx, gy, np.ones_like(gx)], -1)
        del gx, gy
        n /= np.linalg.norm(n, axis=-1, keepdims=True)
        N[m] = n[m]
        del n
        top[m] = i
        kmap[m] = kind_id[kind]
        masks.append(np.asarray(Image.fromarray(m.astype(np.uint8) * 255).resize((W // 2, H // 2), Image.BILINEAR), np.float32) / 255)
    print('layers', len(masks))

    # contact shadows: everything in front of a pixel's layer darkens it near its edges
    half = (H // 2, W // 2)
    ao = np.ones((H, W), np.float32)
    front = np.zeros(half, np.float32)
    for i in range(len(masks) - 1, -1, -1):
        sel = top == i
        if sel.any() and front.any():
            occ = ndimage.gaussian_filter(front, 5 * S / 2)
            occ = ndimage.shift(occ, (2.5 * S / 2, 0.8 * S / 2), order=1)
            occ_full = np.asarray(Image.fromarray(occ).resize((W, H), Image.BILINEAR))
            ao[sel] = 1 - 0.55 * np.clip(occ_full[sel] * 1.6, 0, 1)
        front = np.maximum(front, masks[i])
    del masks
    print('contact shadows done')

    # silhouette of the whole couple: where the backlight wraps round
    union = top >= 0
    sil_d = ndimage.distance_transform_edt(union)
    sil = np.exp(-sil_d / (3.2 * S)) * union
    # in-plane outward direction at the silhouette, from the blurred union
    ub = ndimage.gaussian_filter(union.astype(np.float32), 4 * S)
    oy, ox = np.gradient(ub)
    ol = np.sqrt(ox * ox + oy * oy) + 1e-6
    out_x, out_up = -ox / ol, oy / ol  # outward, with +up
    toward_sun = np.clip(out_x * -0.55 + out_up * 0.83, -1, 1)

    nx, ny, nz = N[..., 0], N[..., 1], N[..., 2]
    Lf = norm((0.25, 0.55, 0.8))
    Lb = norm((0.0, -0.8, 0.6))
    fill = np.clip((nx * Lf[0] + ny * Lf[1] + nz * Lf[2] + 0.3) / 1.3, 0, 1)
    bounce = np.clip((nx * Lb[0] + ny * Lb[1] + nz * Lb[2] + 0.3) / 1.3, 0, 1)
    side = np.clip(1 - nz, 0, 1)  # how much a surface turns away from the viewer

    amb_c = np.array([0.95, 0.84, 0.82], np.float32) * 0.3
    fill_c = np.array([1.0, 0.9, 0.8], np.float32) * 0.82
    bounce_c = np.array([1.0, 0.55, 0.46], np.float32) * 0.22
    light = amb_c + fill[..., None] * fill_c + bounce[..., None] * bounce_c
    light *= ao[..., None]

    # rim: the sun behind them grazing the silhouette, strongest on edges that face it
    rim_w = sil * (0.45 + 0.55 * np.clip(toward_sun, 0, 1)) * (0.35 + 0.65 * side)
    is_skin = kmap == 3
    rim_c = np.where(is_skin[..., None], np.array([1.0, 0.52, 0.3], np.float32), np.array([1.0, 0.76, 0.45], np.float32))
    rim = rim_w[..., None] * rim_c * 1.25

    # gold zari and jewellery, from the art's own colours
    srgb = rgba[..., :3]
    mx = srgb.max(-1)
    mn = srgb.min(-1)
    sat = (mx - mn) / (mx + 1e-6)
    r, g, b = srgb[..., 0], srgb[..., 1], srgb[..., 2]
    hue = np.degrees(np.arctan2(math.sqrt(3) * (g - b), 2 * r - g - b)) % 360
    gold = smoothstep(0.32, 0.5, sat) * smoothstep(0.5, 0.68, mx) * np.clip(1 - np.abs(hue - 43) / 16, 0, 1)
    gold = np.maximum(gold, (kmap == 5) * 0.7)
    Hh = norm(Lf + np.array([0, 0, 1], np.float32))
    ndh = np.clip(nx * Hh[0] + ny * Hh[1] + nz * Hh[2], 0, 1)
    rng = np.random.default_rng(7)
    glint = (rng.random((H, W)) > 0.9982).astype(np.float32)
    glint = ndimage.gaussian_filter(glint, 0.9) * 9
    spec_gold = gold * (ndh ** 28 * 0.55 + glint * smoothstep(0.55, 0.95, ndh) * 0.9)
    # sequins and pearls: small bright dots on cloth sparkle
    bright = smoothstep(0.82, 0.95, mx) * (sat < 0.3) * (kmap == 2)
    spec_seq = bright * glint * 0.8
    # silk sheen
    sheen = ((kmap == 1) | (kmap == 2)) * ndh ** 10 * 0.08

    col = albedo * light + rim * (0.55 + 0.45 * albedo) + (spec_gold + spec_seq + sheen)[..., None] * np.array([1.0, 0.88, 0.66], np.float32)

    # fine texture: a woven tooth on cloth, a soft grain on skin
    grain = ndimage.gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 0.7)
    weave = (np.sin(np.arange(W)[None, :] * 2.1) * np.sin(np.arange(H)[:, None] * 2.1)).astype(np.float32)
    tex = np.where((kmap == 1) | (kmap == 2), 1 + 0.035 * grain + 0.02 * weave, np.where(kmap == 3, 1 + 0.015 * grain, 1))
    col *= tex[..., None]

    out = np.dstack([to_srgb(col), alpha])
    img = Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA')
    img.save(OUT, 'WEBP', quality=94, method=6)
    img.resize((W // 3, H // 3), Image.LANCZOS).save(os.path.join(WORK, 'painted-small.png'))
    img.save(os.path.join(WORK, 'painted.png'))
    print('wrote', os.path.relpath(OUT, ROOT), os.path.getsize(OUT) // 1024, 'KB')


if __name__ == '__main__':
    main()
