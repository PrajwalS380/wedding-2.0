"""The couple's heads in profile, drawn from proportioned, canonical heads.

Each head is traced in local units (crown to chin = 1, facing +u) from the usual profile
landmarks: brow ridge, nasion, nose bridge and tip, columella, philtrum, the two lips, the
mentolabial fold, chin, jaw and throat. `place` maps a head into the illustration (scaled,
moved and, for the bride, mirrored to face left). The features are layered like a
miniature painting: the eye socket and cheek modelled in soft washes, an almond eye with
iris, pupil, catch-light, lid crease and lashes, a shaped brow, the ear with helix,
antihelix, concha and tragus, lips in two tones, and hair laid in strands.
"""
import math

from geom import C, path, smooth


def place(points, x0, y0, s, flip=False):
    out = []
    for p in points:
        x = x0 - p[0] * s if flip else x0 + p[0] * s
        q = (round(x, 2), round(y0 + p[1] * s, 2))
        out.append(q + (p[2],) if len(p) > 2 else q)
    return out


class Head:
    def __init__(self, x0, y0, s, flip):
        self.x0, self.y0, self.s, self.flip = x0, y0, s, flip

    def P(self, pts):
        return place(pts, self.x0, self.y0, self.s, self.flip)

    def pt(self, u, v):
        return self.P([(u, v)])[0]

    def d(self, pts, closed=True):
        return smooth(self.P(pts), closed)

    def r(self, k):
        return k * self.s


# ------------------------------------------------------------------ the groom (faces right)
GROOM = Head(198.7, 106.8, 128, False)
G_PROFILE = [
    (0.885, 0.20), (0.893, 0.27), (0.906, 0.33), (0.922, 0.372), (0.919, 0.405), (0.907, 0.43),
    (0.921, 0.47), (0.948, 0.52), (0.980, 0.57), (1.010, 0.605), (1.018, 0.627), (1.002, 0.645), (0.970, 0.655), (0.940, 0.664, C),
    (0.946, 0.69), (0.952, 0.716), (0.930, 0.736, C), (0.945, 0.754), (0.941, 0.778), (0.913, 0.803), (0.912, 0.835),
    (0.924, 0.875), (0.918, 0.92), (0.886, 0.955), (0.83, 0.975), (0.76, 0.99), (0.712, 1.01), (0.692, 1.05), (0.700, 1.09), (0.692, 1.14),
    (0.690, 1.42, C), (0.270, 1.42, C), (0.288, 1.20), (0.298, 1.05), (0.282, 0.93), (0.22, 0.83), (0.12, 0.70), (0.06, 0.55),
    (0.05, 0.40), (0.10, 0.25), (0.25, 0.16), (0.50, 0.13), (0.75, 0.15),
]
G_HAIR_L = [
    (0.10, 0.28), (0.055, 0.42), (0.07, 0.56), (0.14, 0.70), (0.24, 0.80), (0.31, 0.845, C),
    (0.35, 0.76), (0.39, 0.64), (0.405, 0.52), (0.42, 0.44), (0.47, 0.395), (0.535, 0.375), (0.565, 0.40), (0.585, 0.48),
    (0.598, 0.56, C), (0.62, 0.50), (0.625, 0.40), (0.62, 0.30, C),
]
G_BEARD_L = [
    (0.585, 0.46), (0.598, 0.56), (0.625, 0.64), (0.68, 0.70), (0.75, 0.74), (0.815, 0.765), (0.86, 0.785), (0.905, 0.800, C),
    (0.918, 0.835), (0.932, 0.875), (0.928, 0.925), (0.898, 0.965), (0.84, 0.99), (0.77, 1.005), (0.70, 0.99), (0.62, 0.94),
    (0.56, 0.86), (0.53, 0.76), (0.525, 0.66), (0.535, 0.60), (0.55, 0.52), (0.56, 0.45, C),
]
G_MOUSTACHE_L = [
    (0.832, 0.762, C), (0.845, 0.732), (0.872, 0.708), (0.905, 0.692), (0.938, 0.680), (0.952, 0.690), (0.952, 0.703),
    (0.930, 0.712), (0.898, 0.722), (0.872, 0.735), (0.852, 0.750),
]
G_EYE_L = [(0.812, 0.462, C), (0.838, 0.446), (0.866, 0.440), (0.892, 0.449), (0.897, 0.455, C), (0.878, 0.467), (0.846, 0.471)]
G_BROW_L = [(0.785, 0.414, C), (0.82, 0.396), (0.862, 0.386), (0.905, 0.386), (0.926, 0.395, C), (0.900, 0.400), (0.858, 0.403), (0.818, 0.410)]
G_EAR_L = [(0.528, 0.43), (0.49, 0.412), (0.452, 0.425), (0.428, 0.47), (0.424, 0.53), (0.435, 0.585), (0.455, 0.628), (0.482, 0.652), (0.508, 0.648), (0.522, 0.62), (0.53, 0.56)]

# ------------------------------------------------------------------ the bride (faces left)
BRIDE = Head(453.3, 139, 112, True)
B_PROFILE = [
    (0.87, 0.18), (0.882, 0.25), (0.895, 0.31), (0.907, 0.358), (0.905, 0.395), (0.897, 0.425),
    (0.913, 0.47), (0.937, 0.52), (0.962, 0.565), (0.982, 0.594), (0.985, 0.614), (0.968, 0.630), (0.945, 0.638), (0.926, 0.646, C),
    (0.934, 0.670), (0.946, 0.693), (0.937, 0.707), (0.917, 0.715, C), (0.935, 0.729), (0.940, 0.750), (0.922, 0.769), (0.898, 0.785),
    (0.902, 0.82), (0.905, 0.855), (0.886, 0.89), (0.846, 0.915), (0.78, 0.935), (0.722, 0.958), (0.703, 1.00), (0.698, 1.10), (0.703, 1.25),
    (0.708, 1.50, C), (0.330, 1.50, C), (0.333, 1.25), (0.333, 1.08), (0.30, 0.95), (0.22, 0.84), (0.12, 0.70), (0.07, 0.55),
    (0.07, 0.40), (0.12, 0.26), (0.26, 0.15), (0.50, 0.11), (0.74, 0.13),
]
B_HAIR_L = [
    (0.86, 0.15), (0.872, 0.205, C), (0.835, 0.232), (0.785, 0.262), (0.735, 0.31), (0.69, 0.38), (0.662, 0.45), (0.648, 0.50, C),
    (0.61, 0.475), (0.56, 0.455), (0.50, 0.45), (0.445, 0.47), (0.40, 0.53), (0.37, 0.62), (0.345, 0.72), (0.32, 0.82), (0.27, 0.90, C),
    (0.16, 0.86), (0.08, 0.72), (0.045, 0.56), (0.05, 0.40), (0.10, 0.24), (0.24, 0.12), (0.48, 0.075), (0.72, 0.09),
]
B_EYE_L = [(0.800, 0.462, C), (0.826, 0.444), (0.856, 0.437), (0.880, 0.446), (0.888, 0.453, C), (0.868, 0.468), (0.834, 0.472)]
B_BROW_L = [(0.790, 0.405, C), (0.822, 0.386), (0.860, 0.377), (0.894, 0.381), (0.906, 0.389, C), (0.890, 0.388), (0.858, 0.386), (0.824, 0.394)]
B_EAR_L = [(0.53, 0.45), (0.50, 0.44), (0.468, 0.45), (0.45, 0.49), (0.446, 0.54), (0.455, 0.59), (0.47, 0.625), (0.492, 0.645), (0.512, 0.642), (0.524, 0.615), (0.53, 0.56)]
BUN = (0.075, 0.80, 0.15, 0.165)  # centre u, v and radii

SKIN_DEEP = '#6e3a22'


def soft(cx, cy, rx, ry, colour, opacity, blur='cp-blur3', rot=0):
    return f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="{colour}" opacity="{opacity}" filter="url(#{blur})" transform="rotate({rot} {cx:.1f} {cy:.1f})" />'


def eye(h, outline, iris_c, kohl=False, lash_len=0.016, lashes=5):
    """An almond eye in profile: white, iris (clipped to the lids), pupil, catch-light, lid line, crease, lashes."""
    out = []
    cid = 'eye-g' if not h.flip else 'eye-b'
    d = h.d(outline)
    out.append(f'<clipPath id="{cid}"><path d="{d}" /></clipPath>')
    out.append(path(d, fill='#efe3d4'))
    # the white is shaded at its back corner and under the lid
    bx, by = h.pt(outline[0][0] + 0.012, outline[0][1])
    out.append(f'<g clip-path="url(#{cid})">')
    out.append(soft(bx, by, h.r(0.03), h.r(0.02), '#b89a88', 0.6, 'cp-blur2'))
    iu, iv = outline[3][0] - 0.022, 0.455
    ix, iy = h.pt(iu, iv)
    out.append(f'<ellipse cx="{ix:.1f}" cy="{iy:.1f}" rx="{h.r(0.0125):.2f}" ry="{h.r(0.0175):.2f}" fill="{iris_c}" />')
    out.append(f'<ellipse cx="{ix:.1f}" cy="{iy:.1f}" rx="{h.r(0.0125):.2f}" ry="{h.r(0.0175):.2f}" fill="none" stroke="#1a0c06" stroke-width="{h.r(0.0025):.2f}" />')
    px, py = h.pt(iu + 0.003, iv)
    out.append(f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="{h.r(0.006):.2f}" ry="{h.r(0.0085):.2f}" fill="#0c0604" />')
    out.append(soft(ix, iy - h.r(0.012), h.r(0.02), h.r(0.008), '#2a160c', 0.55, 'cp-blur1'))
    cx, cy = h.pt(iu + 0.006, iv - 0.006)
    out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{h.r(0.0032):.2f}" fill="#fffaf0" />')
    out.append('</g>')
    # upper lid line (thicker toward the back), lower lid, crease
    upper = h.P(outline[:5])
    lower = h.P([outline[4], outline[5], outline[6], outline[0]])
    out.append(path(smooth(upper, closed=False), stroke='#1a0c06', stroke_width=f'{h.r(0.0058):.2f}', fill='none', stroke_linecap='round'))
    out.append(path(smooth(lower, closed=False), stroke='#5a3020' if not kohl else '#1a0c06', stroke_width=f'{h.r(0.0026 if not kohl else 0.0042):.2f}', fill='none', opacity=0.85))
    crease = h.P([(outline[0][0] + 0.008, outline[0][1] - 0.012), (outline[1][0], outline[1][1] - 0.016), (outline[2][0], outline[2][1] - 0.018), (outline[3][0] - 0.004, outline[3][1] - 0.012)])
    out.append(path(smooth(crease, closed=False), stroke=SKIN_DEEP, stroke_width=f'{h.r(0.0035):.2f}', fill='none', opacity=0.55, stroke_linecap='round'))
    if kohl:
        # a winged line of kajal past the outer corner
        wing = h.P([(outline[0][0] + 0.012, outline[0][1] - 0.006), (outline[0][0] - 0.004, outline[0][1] - 0.010), (outline[0][0] - 0.03, outline[0][1] - 0.022)])
        out.append(path(smooth(wing, closed=False), stroke='#140904', stroke_width=f'{h.r(0.0048):.2f}', fill='none', stroke_linecap='round'))
    # lashes, sweeping forward and up from the front half of the lid
    for i in range(lashes):
        t = 0.35 + 0.65 * i / max(1, lashes - 1)
        k = min(3, int(t * 4))
        a = outline[k]
        b = outline[min(4, k + 1)]
        f = t * 4 - k
        u = a[0] + (b[0] - a[0]) * f
        v = a[1] + (b[1] - a[1]) * f
        L = lash_len * (0.6 + 0.6 * t)
        p0 = h.pt(u, v)
        p1 = h.pt(u + L * 0.55, v - L * 0.75)
        p2 = h.pt(u + L * 1.0, v - L * 0.85)
        out.append(f'<path d="M{p0[0]:.1f},{p0[1]:.1f} Q{p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}" stroke="#140904" stroke-width="{h.r(0.0026):.2f}" fill="none" stroke-linecap="round" />')
    return ''.join(out)


def brow(h, outline, colour):
    out = [path(h.d(outline), fill=colour)]
    # individual hairs along the brow
    a, b = outline[0], outline[4]
    for i in range(14):
        t = i / 13
        u = a[0] + (b[0] - a[0]) * t
        v = a[1] + (b[1] - a[1]) * t - 0.004 * math.sin(math.pi * t) - 0.004
        p0 = h.pt(u - 0.006, v + 0.008)
        p1 = h.pt(u + 0.012, v - 0.002)
        out.append(f'<path d="M{p0[0]:.1f},{p0[1]:.1f} L{p1[0]:.1f},{p1[1]:.1f}" stroke="{colour}" stroke-width="{h.r(0.0026):.2f}" stroke-linecap="round" opacity="0.8" />')
    return ''.join(out)


def ear(h, outline, skin, lobe_jewel=None):
    out = [path(h.d(outline), fill=skin)]
    out.append(soft(*h.pt(0.488, 0.545), h.r(0.022), h.r(0.04), SKIN_DEEP, 0.55, 'cp-blur2'))
    helix = h.P([(0.505, 0.432), (0.468, 0.432), (0.442, 0.47), (0.437, 0.53), (0.447, 0.585), (0.468, 0.622)])
    out.append(path(smooth(helix, closed=False), stroke=SKIN_DEEP, stroke_width=f'{h.r(0.006):.2f}', fill='none', opacity=0.7, stroke_linecap='round'))
    anti = h.P([(0.492, 0.455), (0.468, 0.50), (0.47, 0.55), (0.487, 0.595)])
    out.append(path(smooth(anti, closed=False), stroke='#ffd7b4', stroke_width=f'{h.r(0.0045):.2f}', fill='none', opacity=0.45, stroke_linecap='round'))
    tragus = h.P([(0.522, 0.535), (0.512, 0.55), (0.52, 0.572)])
    out.append(path(smooth(tragus, closed=False), stroke=SKIN_DEEP, stroke_width=f'{h.r(0.004):.2f}', fill='none', opacity=0.6, stroke_linecap='round'))
    return ''.join(out)


def hair_strands(h, rows, colour, width, opacity, clip):
    out = [f'<g clip-path="url(#{clip})" fill="none" stroke="{colour}" stroke-width="{h.r(width):.2f}" opacity="{opacity}" stroke-linecap="round">']
    for r in rows:
        out.append(f'<path d="{smooth(h.P(r), closed=False)}" />')
    out.append('</g>')
    return ''.join(out)


def face_washes(h, sex):
    """Soft modelling of the face: socket, temple, cheekbone, cheek, nose bridge, under the nose and lip, jaw."""
    o = []
    o.append(soft(*h.pt(0.855, 0.452), h.r(0.055), h.r(0.035), '#5a2c18', 0.32, 'cp-blur3'))  # eye socket
    o.append(soft(*h.pt(0.86, 0.31), h.r(0.05), h.r(0.06), '#ffd9b5', 0.28, 'cp-blur4'))  # forehead light
    o.append(soft(*h.pt(0.78, 0.535), h.r(0.06), h.r(0.035), '#ffd2a6', 0.3, 'cp-blur4'))  # cheekbone
    o.append(soft(*h.pt(0.79, 0.62), h.r(0.07), h.r(0.055), '#c8584a' if sex == 'f' else '#a84a32', 0.28 if sex == 'f' else 0.2, 'cp-blur4'))  # cheek warmth
    o.append(soft(*h.pt(0.955, 0.535), h.r(0.012), h.r(0.05), '#ffe2c4', 0.45, 'cp-blur2', rot=-34 if not h.flip else 34))  # nose bridge
    o.append(soft(*h.pt(0.69, 0.40), h.r(0.08), h.r(0.08), '#5a2c18', 0.18, 'cp-blur4'))  # temple
    o.append(soft(*h.pt(0.62, 0.86), h.r(0.11), h.r(0.08), '#4a2412', 0.3, 'cp-blur4'))  # under the jaw
    o.append(soft(*h.pt(0.56, 1.03), h.r(0.15), h.r(0.05), '#3a1a0c', 0.38, 'cp-blur4'))  # neck under the jaw
    o.append(soft(*h.pt(0.70, 1.15), h.r(0.012), h.r(0.06), '#ffd2a8', 0.25, 'cp-blur2'))  # neck front light
    return ''.join(o)


def nose_and_lips(h, sex):
    o = []
    # ala (nostril wing) and nostril
    ala = h.P([(0.952, 0.648), (0.928, 0.640), (0.915, 0.618), (0.925, 0.598), (0.945, 0.596)])
    o.append(path(smooth(ala, closed=False), stroke=SKIN_DEEP, stroke_width=f'{h.r(0.0055):.2f}', fill='none', opacity=0.75, stroke_linecap='round'))
    o.append(soft(*h.pt(0.948, 0.646), h.r(0.012), h.r(0.006), '#2a1208', 0.8, 'cp-blur1'))
    o.append(soft(*h.pt(0.93, 0.625), h.r(0.02), h.r(0.02), '#6a3420', 0.3, 'cp-blur2'))
    # nasolabial fold
    fold = h.P([(0.905, 0.645), (0.878, 0.680), (0.858, 0.725)])
    o.append(path(smooth(fold, closed=False), stroke=SKIN_DEEP, stroke_width=f'{h.r(0.006):.2f}', fill='none', opacity=0.35, stroke_linecap='round', filter='url(#cp-blur1)'))
    if sex == 'f':
        up, lo, hi = '#a8384a', '#c04a5c', '#f2a0a8'
        upper = [(0.926, 0.646), (0.934, 0.670), (0.946, 0.693), (0.937, 0.707), (0.917, 0.715), (0.885, 0.716), (0.872, 0.712), (0.895, 0.700), (0.915, 0.685)]
        lower = [(0.917, 0.715), (0.935, 0.729), (0.940, 0.750), (0.922, 0.769), (0.898, 0.770), (0.880, 0.735), (0.872, 0.716)]
        o.append(path(h.d(upper[3:] + [(0.92, 0.692)]), fill=up))
        o.append(path(h.d(lower), fill=lo))
        o.append(soft(*h.pt(0.925, 0.742), h.r(0.012), h.r(0.006), hi, 0.75, 'cp-blur1'))
        line = h.P([(0.917, 0.715), (0.895, 0.718), (0.874, 0.714)])
        o.append(path(smooth(line, closed=False), stroke='#5a1a20', stroke_width=f'{h.r(0.004):.2f}', fill='none', stroke_linecap='round'))
    else:
        up, lo = '#8a4a3a', '#9a5646'
        upper = [(0.952, 0.705), (0.952, 0.716), (0.930, 0.736), (0.895, 0.740), (0.905, 0.722)]
        lower = [(0.930, 0.736), (0.945, 0.754), (0.941, 0.778), (0.915, 0.782), (0.895, 0.755), (0.895, 0.740)]
        o.append(path(h.d(upper), fill=up))
        o.append(path(h.d(lower), fill=lo))
        o.append(soft(*h.pt(0.93, 0.76), h.r(0.01), h.r(0.005), '#d8907c', 0.6, 'cp-blur1'))
        line = h.P([(0.930, 0.736), (0.90, 0.741), (0.87, 0.745)])
        o.append(path(smooth(line, closed=False), stroke='#3a1a10', stroke_width=f'{h.r(0.0042):.2f}', fill='none', stroke_linecap='round'))
    # shadow under the lower lip, light on the chin
    o.append(soft(*h.pt(0.905, 0.795), h.r(0.02), h.r(0.008), '#4a2010', 0.45, 'cp-blur1'))
    o.append(soft(*h.pt(0.89, 0.87), h.r(0.018), h.r(0.03), '#ffd8b4', 0.3, 'cp-blur2'))
    return ''.join(o)


# ------------------------------------------------------------------ contours for the paint pass and the clips
def groom_shapes():
    h = GROOM
    return {'g-head': h.P(G_PROFILE), 'g-hair': h.P(G_HAIR_L), 'g-beard': h.P(G_BEARD_L), 'g-moustache': h.P(G_MOUSTACHE_L)}


def bride_shapes():
    h = BRIDE
    return {'b-head': h.P(B_PROFILE), 'b-hair': h.P(B_HAIR_L)}


def bride_bun():
    cx, cy = BRIDE.pt(BUN[0], BUN[1])
    return cx, cy, BUN[2] * BRIDE.s, BUN[3] * BRIDE.s


# ------------------------------------------------------------------ the painted features
def groom_face():
    h = GROOM
    o = ['<use href="#g-head" fill="url(#cp-skin)" />']
    o.append(f'<g clip-path="url(#clip-g-head)">{face_washes(h, "m")}</g>')
    o.append(ear(h, G_EAR_L, '#9d6444'))
    # gold bali in the lobe
    lx, ly = h.pt(0.478, 0.655)
    o.append(f'<circle cx="{lx:.1f}" cy="{ly + h.r(0.012):.1f}" r="{h.r(0.014):.2f}" fill="none" stroke="url(#cp-gold-band)" stroke-width="{h.r(0.006):.2f}" />')
    o.append(f'<g clip-path="url(#clip-g-head)">{nose_and_lips(h, "m")}</g>')
    # hair at the back of the head and the sideburn, in strands
    o.append('<use href="#g-hair" fill="#1c110b" />')
    rows = [[(0.11 + 0.03 * k, 0.30), (0.08 + 0.035 * k, 0.45), (0.11 + 0.035 * k, 0.60), (0.19 + 0.03 * k, 0.74), (0.27 + 0.02 * k, 0.83)] for k in range(9)]
    rows += [[(0.47 + 0.02 * k, 0.385), (0.51 + 0.02 * k, 0.40), (0.56 + 0.01 * k, 0.47), (0.58 + 0.005 * k, 0.55)] for k in range(5)]
    o.append(hair_strands(h, rows, '#4a3424', 0.0035, 0.55, 'clip-g-hair'))
    # beard: a trimmed full beard, denser along the jaw, with the skin warming through at the cheek line
    o.append('<use href="#g-beard" fill="#22140c" />')
    beard = []
    for k in range(70):
        t = k / 69
        u = 0.55 + 0.37 * t + 0.02 * math.sin(k * 1.7)
        v = 0.62 + 0.30 * math.sin(math.pi * t * 0.8) + 0.04 * math.cos(k * 2.3)
        a = 0.6 + 0.8 * t
        beard.append([(u, v), (u + 0.006 * math.cos(a), v + 0.02)])
    o.append(hair_strands(h, beard, '#5a4030', 0.003, 0.5, 'clip-g-beard'))
    o.append(f'<g clip-path="url(#clip-g-beard)">' + soft(*h.pt(0.62, 0.66), h.r(0.04), h.r(0.08), '#8a5a3e', 0.45, 'cp-blur3', rot=-30) + '</g>')
    o.append('<use href="#g-moustache" fill="#1a0e08" />')
    mous = [[(0.85 + 0.012 * k, 0.742 - 0.006 * k), (0.865 + 0.012 * k, 0.715 - 0.004 * k)] for k in range(8)]
    o.append(hair_strands(h, mous, '#5a4030', 0.0026, 0.5, 'clip-g-moustache'))
    o.append(eye(h, G_EYE_L, '#3e2414', kohl=False, lash_len=0.012, lashes=4))
    o.append(brow(h, G_BROW_L, '#1e120b'))
    return ''.join(o)


def bride_face(rim):
    """Skin and features; `rim` is the inner rim-light helper from build_couple."""
    h = BRIDE
    o = ['<use href="#b-head" fill="url(#cp-skin-b)" />']
    o.append(f'<g clip-path="url(#clip-b-head)">{face_washes(h, "f")}</g>')
    o.append(ear(h, B_EAR_L, '#a46a4a'))
    o.append(f'<g clip-path="url(#clip-b-head)">{nose_and_lips(h, "f")}</g>')
    o.append(eye(h, B_EYE_L, '#3a2010', kohl=True, lash_len=0.02, lashes=6))
    o.append(brow(h, B_BROW_L, '#1a0f0a'))
    # bindi
    bx, by = h.pt(0.893, 0.352)
    o.append(f'<circle cx="{bx:.1f}" cy="{by:.1f}" r="{h.r(0.011):.2f}" fill="#b3122c" /><circle cx="{bx - 0.4:.1f}" cy="{by - 0.5:.1f}" r="{h.r(0.004):.2f}" fill="#ff8c9a" opacity="0.7" />')
    o.append(rim('b-head', 4, opacity=0.6))
    # hair: parted, swept back over the ear into a bun, with a sheen along the crown
    o.append('<use href="#b-hair" fill="#160c07" />')
    rows = []
    for k in range(16):
        f = k / 15
        rows.append([(0.86 - 0.18 * f, 0.18 + 0.04 * f), (0.72 - 0.2 * f, 0.20 + 0.10 * f), (0.52 - 0.2 * f, 0.30 + 0.14 * f), (0.34 - 0.16 * f, 0.50 + 0.12 * f), (0.20 - 0.08 * f, 0.72 + 0.04 * f)])
    for k in range(8):
        f = k / 7
        rows.append([(0.82 - 0.04 * f, 0.24 + 0.02 * f), (0.74 - 0.06 * f, 0.33 + 0.02 * f), (0.66 - 0.06 * f, 0.43 + 0.01 * f), (0.56 - 0.05 * f, 0.47)])
    o.append(hair_strands(h, rows, '#4a3020', 0.0032, 0.6, 'clip-b-hair'))
    o.append(f'<g clip-path="url(#clip-b-hair)">' + soft(*h.pt(0.45, 0.16), h.r(0.2), h.r(0.035), '#a07a5a', 0.4, 'cp-blur3', rot=12 if h.flip else -12) + '</g>')
    cx, cy, rx, ry = bride_bun()
    o.append(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="#160c07" />')
    o.append(f'<g fill="none" stroke="#4a3020" stroke-width="{h.r(0.003):.2f}" opacity="0.6">' + ''.join(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx * k / 6:.1f}" ry="{ry * k / 6:.1f}" />' for k in range(2, 6)) + '</g>')
    # gajra: a ring of jasmine buds round the bun
    o.append('<g>' + ''.join(f'<circle cx="{cx + (rx + 1.2) * math.cos(a):.1f}" cy="{cy + (ry + 1.2) * math.sin(a):.1f}" r="3.2" fill="url(#cp-jasmine)" /><circle cx="{cx + (rx + 1.2) * math.cos(a) - 0.8:.1f}" cy="{cy + (ry + 1.2) * math.sin(a) - 0.8:.1f}" r="1" fill="#fffef8" />' for a in [i * math.pi / 8 - math.pi * 0.55 for i in range(13)]) + '</g>')
    return ''.join(o)


def bride_jewels():
    """Maang tikka, nath with its chain, jhumka; all placed on the bride's landmarks."""
    h = BRIDE
    o = []
    # maang tikka: a chain down the parting to a pendant at the hairline
    a = h.pt(0.70, 0.10)
    b = h.pt(0.84, 0.16)
    t = h.pt(0.872, 0.232)
    o.append(f'<path d="M{a[0]:.1f},{a[1]:.1f} Q{b[0]:.1f},{b[1]:.1f} {t[0]:.1f},{t[1] - 4:.1f}" stroke="#e8c672" stroke-width="1.3" fill="none" />')
    o.append(f'<circle cx="{t[0]:.1f}" cy="{t[1]:.1f}" r="3.6" fill="url(#cp-jewel)" stroke="#f7dc94" stroke-width="1" /><circle cx="{t[0]:.1f}" cy="{t[1] + 5.6:.1f}" r="1.6" fill="#fff6e2" />')
    # nath: a pearl-strung hoop through the nostril wing, its chain sweeping back to the hair
    n = h.pt(0.935, 0.640)
    hc = (n[0] + (3.5 if h.flip else -3.5), n[1] + 7)
    o.append(f'<circle cx="{hc[0]:.1f}" cy="{hc[1]:.1f}" r="7.6" stroke="url(#cp-gold-band)" stroke-width="1.6" fill="none" />')
    o.append('<g fill="#fff6e2">' + ''.join(f'<circle cx="{hc[0] + 7.6 * math.cos(a):.1f}" cy="{hc[1] + 7.6 * math.sin(a):.1f}" r="1.05" />' for a in [math.pi * (0.25 + i * 0.13) for i in range(6)]) + '</g>')
    o.append(f'<circle cx="{hc[0] - 6.2:.1f}" cy="{hc[1] + 4.2:.1f}" r="1.9" fill="url(#cp-jewel)" />')
    e = h.pt(0.58, 0.47)
    m = h.pt(0.75, 0.64)
    o.append(f'<path d="M{hc[0] + 6:.1f},{hc[1] - 3:.1f} Q{m[0]:.1f},{m[1] + 6:.1f} {e[0]:.1f},{e[1]:.1f}" stroke="#fbeec4" stroke-width="1.3" stroke-dasharray="0.1 3.6" stroke-linecap="round" fill="none" />')
    o.append(f'<circle cx="{e[0]:.1f}" cy="{e[1]:.1f}" r="2.6" fill="url(#cp-jewel)" />')
    # jhumka from the lobe: stud, dome bell, pearl fringe
    lx, ly = h.pt(0.48, 0.655)
    o.append(f'<circle cx="{lx:.1f}" cy="{ly:.1f}" r="2.6" fill="url(#cp-jewel)" stroke="#f7dc94" stroke-width="0.8" />')
    o.append(f'<path d="M{lx:.1f},{ly + 2.6:.1f} L{lx:.1f},{ly + 6:.1f}" stroke="#e7c06a" stroke-width="1.2" />')
    o.append(f'<path d="M{lx - 7:.1f},{ly + 16:.1f} C{lx - 7:.1f},{ly + 7:.1f} {lx + 7:.1f},{ly + 7:.1f} {lx + 7:.1f},{ly + 16:.1f} L{lx + 9:.1f},{ly + 18:.1f} L{lx - 9:.1f},{ly + 18:.1f} Z" fill="url(#cp-gold-band)" />')
    o.append(f'<path d="M{lx - 5:.1f},{ly + 12:.1f} L{lx + 5:.1f},{ly + 12:.1f}" stroke="#9a7426" stroke-width="0.7" />')
    o.append('<g fill="#fff6e2">' + ''.join(f'<circle cx="{lx - 8 + i * 3.2:.1f}" cy="{ly + 20.5:.1f}" r="1.3" />' for i in range(6)) + '</g>')
    o.append(f'<circle cx="{lx:.1f}" cy="{ly + 14:.1f}" r="1.6" fill="#c4243f" />')
    return ''.join(o)
