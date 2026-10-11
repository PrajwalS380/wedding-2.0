"""Builds the couple illustration (public/site/couple.svg) from anatomical contours.

Each outline is a list of points traced around a figure; points marked with 'c' are
corners, everything else is joined by a smooth centripetal Catmull-Rom spline (written
as cubic Beziers). Every garment is built in layers: base cloth with light and roundness
shading, a woven pattern (paisley buti, floral buti, leheriya stripes, sequins), soft
fold shadows, and embroidered borders whose motifs are placed one by one along each
hem's curve. The couple stands backlit by the setting sun: a warm rim of light runs
around every edge, and the bride's dupatta glows as the light passes through it.

Writes public/site/couple.svg. Usage: python tools/couple/build_couple.py
"""
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'public', 'site', 'couple.svg')
C = 'c'


# ------------------------------------------------------------------ geometry helpers
def segments(points, closed=True):
    """Cubic Bezier segments (p1, b1, b2, p2) of a centripetal Catmull-Rom spline."""
    pts = [(p[0], p[1]) for p in points]
    corner = [len(p) > 2 and p[2] == 'c' for p in points]
    n = len(pts)

    def P(i):
        return pts[i % n] if closed else pts[max(0, min(n - 1, i))]

    def dist(a, b):
        return max(math.dist(a, b) ** 0.5, 1e-4)

    out = []
    for i in range(n if closed else n - 1):
        p0, p1, p2, p3 = P(i - 1), P(i), P(i + 1), P(i + 2)
        if corner[i % n]:
            p0 = p1
        if corner[(i + 1) % n]:
            p3 = p2
        d1, d2, d3 = dist(p0, p1), dist(p1, p2), dist(p2, p3)
        b1 = tuple((d1 * d1 * p2[k] - d2 * d2 * p0[k] + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1[k]) / (3 * d1 * (d1 + d2)) for k in (0, 1))
        b2 = tuple((d3 * d3 * p1[k] - d2 * d2 * p3[k] + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2[k]) / (3 * d3 * (d3 + d2)) for k in (0, 1))
        out.append((p1, b1, b2, p2))
    return out


def smooth(points, closed=True):
    segs = segments(points, closed)
    d = [f'M{segs[0][0][0]:.1f},{segs[0][0][1]:.1f}']
    for _, b1, b2, p2 in segs:
        d.append(f'C{b1[0]:.1f},{b1[1]:.1f} {b2[0]:.1f},{b2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}')
    if closed:
        d.append('Z')
    return ' '.join(d)


def sample(points, step, closed=False):
    """Points every `step` units along the spline, with the tangent angle (degrees)."""
    poly = []
    for p1, b1, b2, p2 in segments(points, closed):
        for k in range(24):
            t = k / 24
            mt = 1 - t
            poly.append(tuple(mt ** 3 * p1[i] + 3 * mt * mt * t * b1[i] + 3 * mt * t * t * b2[i] + t ** 3 * p2[i] for i in (0, 1)))
    poly.append(segments(points, closed)[-1][3])
    out, acc, nxt = [], 0.0, 0.0
    for a, b in zip(poly, poly[1:]):
        L = math.dist(a, b)
        while L > 0 and acc + L >= nxt:
            t = (nxt - acc) / L
            out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))))
            nxt += step
        acc += L
    return out


def offset(points, d):
    """The same open polyline shifted `d` units along its normal (for parallel bands)."""
    out = []
    for i, p in enumerate(points):
        a = points[max(0, i - 1)]
        b = points[min(len(points) - 1, i + 1)]
        tx, ty = b[0] - a[0], b[1] - a[1]
        L = math.hypot(tx, ty) or 1
        out.append((p[0] - ty / L * d, p[1] + tx / L * d))
    return out


def motif_row(points, href, step, scale=1.0, flip=False):
    out = []
    for x, y, a in sample(points, step):
        out.append(f'<use href="#{href}" transform="translate({x:.1f},{y:.1f}) rotate({a + (180 if flip else 0):.0f}) scale({scale})" />')
    return ''.join(out)


def path(d, **attrs):
    a = ' '.join(f'{k.replace("_", "-")}="{v}"' for k, v in attrs.items())
    return f'<path d="{d}" {a} />'


# ------------------------------------------------------------------ the groom (left, facing right)
G_TAIL = [(214, 150, C), (206, 190), (198, 240), (192, 300), (190, 350), (194, 378, C), (206, 376, C), (206, 330), (212, 270), (220, 210), (228, 158, C)]
G_TURBAN = [(206, 156, C), (198, 132), (199, 108), (208, 88), (222, 72), (242, 61), (264, 56), (286, 58), (303, 67), (314, 82), (320, 100), (320, 118), (316, 134), (312, 143, C), (290, 140), (262, 142), (236, 147), (216, 152)]
G_HEAD = [(216, 146, C), (214, 168), (218, 190), (226, 208), (238, 224), (246, 240), (248, 272, C), (284, 276, C), (283, 262), (290, 252), (304, 247), (314, 240), (320, 230), (320, 220), (318, 215), (321, 211), (319, 207), (323, 204), (326, 200), (331, 192), (329, 184), (323, 175), (319, 167), (320, 159), (318, 150), (314, 141, C)]
G_HAIR = [(214, 150, C), (214, 168), (218, 186), (226, 202), (236, 214, C), (246, 198), (248, 178), (242, 158, C)]
G_BEARD = [(250, 214), (262, 228), (276, 236), (292, 238), (306, 234), (316, 226), (320, 218, C), (320, 226), (318, 234), (310, 243), (298, 250), (288, 254), (276, 252), (262, 244), (250, 232), (244, 220, C)]
G_BODY = [(236, 262, C), (222, 275), (209, 286), (202, 304), (199, 330), (201, 362), (206, 400), (206, 432), (202, 470), (197, 530), (191, 600), (186, 668), (182, 716, C), (214, 722), (256, 724), (296, 719), (326, 709, C), (321, 650), (316, 590), (311, 530), (308, 478), (308, 444), (312, 410), (317, 370), (319, 334), (315, 304), (303, 285), (292, 272, C)]
G_ARM = [(244, 290), (258, 284), (270, 292), (277, 318), (281, 352), (285, 384), (300, 400), (318, 406), (336, 409), (348, 411), (356, 417), (350, 425), (334, 429), (312, 428), (290, 425), (270, 411), (262, 386), (257, 352), (251, 318), (242, 300)]
G_HAND = [(326, 405), (338, 404), (349, 406), (357, 412), (358, 420), (351, 427), (338, 430), (326, 429, C)]
G_LEG_BACK = [(208, 712, C), (209, 760), (212, 820), (217, 872), (215, 886), (218, 896), (222, 909, C), (246, 909, C), (244, 892), (246, 880), (243, 830), (243, 770), (241, 714, C)]
G_LEG_FRONT = [(262, 716, C), (266, 770), (271, 830), (277, 874), (275, 888), (279, 907, C), (304, 907, C), (302, 890), (304, 876), (300, 830), (300, 776), (299, 716, C)]
G_SHOE_BACK = [(216, 906, C), (214, 926), (218, 937, C), (252, 937), (259, 927), (253, 921), (246, 909, C)]
G_SHOE_FRONT = [(276, 906, C), (274, 928), (280, 937, C), (322, 937), (334, 922), (327, 922), (314, 915), (304, 906, C)]
G_STOLE = [(228, 280, C), (207, 330), (199, 420), (198, 520), (196, 610), (192, 660, C), (212, 662, C), (216, 600), (217, 500), (215, 420), (221, 344), (242, 292, C)]
G_KALGI = [(306, 82, C), (302, 64), (296, 48), (288, 34), (278, 22), (270, 14, C), (276, 26), (284, 40), (292, 56), (299, 80, C)]

# ------------------------------------------------------------------ the bride (right, facing left)
B_HEAD = [(354, 166), (350, 178), (351, 186), (347, 194), (343, 203), (339, 210), (341, 215), (347, 217), (346, 222), (349, 225), (347, 229), (350, 233), (349, 241), (354, 249), (366, 258), (376, 264), (380, 274), (382, 288, C), (414, 288, C), (418, 268), (424, 250), (434, 228), (438, 204), (434, 182), (420, 162), (398, 152), (374, 154), (360, 160)]
B_HAIR = [(362, 160, C), (374, 154), (398, 152), (420, 162), (434, 182), (438, 204), (434, 228), (426, 246), (420, 260, C), (414, 240), (410, 216), (402, 196), (390, 180), (376, 170)]
B_TORSO = [(382, 286, C), (374, 302), (370, 322), (372, 340), (378, 352), (382, 382), (386, 422, C), (431, 422, C), (434, 390), (436, 350), (434, 318), (428, 300), (418, 290), (414, 286, C)]
B_ARM = [(396, 300), (406, 296), (414, 306), (415, 336), (413, 372), (410, 392), (397, 410), (380, 418), (362, 424), (352, 427), (346, 420), (354, 414), (372, 408), (388, 398), (396, 380), (398, 350), (396, 322)]
B_SLEEVE = [(396, 300), (406, 296), (414, 306), (415, 336), (413, 352, C), (397, 352, C), (398, 330), (396, 316)]
B_SKIRT = [(384, 420, C), (378, 470), (368, 540), (356, 620), (344, 700), (334, 780), (324, 860), (316, 936, C), (340, 944), (370, 946), (400, 942), (430, 947), (460, 944), (490, 948), (520, 940, C), (512, 880), (502, 800), (490, 720), (474, 640), (458, 560), (446, 490), (438, 440), (432, 420, C)]
B_VEIL = [(352, 166), (364, 151), (390, 140), (420, 142), (442, 156), (456, 178), (463, 206), (470, 240), (482, 288), (498, 340), (512, 396), (520, 452), (534, 520), (556, 590), (572, 660), (578, 730), (590, 800), (596, 870), (592, 936, C), (560, 944), (526, 941, C), (520, 880), (512, 820), (498, 750), (488, 690), (478, 620), (468, 550), (458, 480), (450, 410), (447, 350), (449, 300), (452, 262), (450, 232), (442, 206), (430, 186), (410, 170), (386, 164), (366, 166)]
B_VEIL_CAP = [(352, 166), (364, 151), (390, 140), (420, 142), (442, 156), (456, 178), (462, 206), (465, 232, C), (452, 210), (436, 190), (414, 176), (390, 168), (368, 166)]

# open curves used for borders and seams
VEIL_EDGE = [(352, 166), (364, 151), (390, 140), (420, 142), (442, 156), (456, 178), (463, 206), (470, 240), (482, 288), (498, 340), (512, 396), (520, 452), (534, 520), (556, 590), (572, 660), (578, 730), (590, 800), (596, 870), (592, 934)]
SKIRT_HEM = [(318, 924), (340, 931), (370, 933), (400, 929), (430, 934), (460, 931), (490, 935), (518, 927)]
SKIRT_MID = [(336, 790), (370, 797), (410, 795), (450, 798), (494, 792)]
SHERWANI_HEM = [(184, 700), (214, 706), (256, 708), (296, 703), (324, 693)]
PLACKET = [(298, 280), (304, 300), (306, 330), (305, 370), (302, 410), (302, 450), (305, 500), (309, 560), (313, 620), (318, 700)]
KALIS = [[(392, 426), (384, 560), (372, 700), (360, 840), (352, 934)], [(404, 426), (402, 580), (404, 740), (408, 940)], [(416, 426), (426, 570), (442, 720), (458, 860), (466, 942)], [(426, 426), (442, 560), (466, 720), (490, 880), (500, 940)]]
VEIL_FOLDS = [[(456, 230), (470, 330), (488, 450), (506, 580), (522, 720), (538, 860), (548, 936)], [(462, 300), (482, 400), (500, 520), (524, 650), (548, 790), (566, 930)], [(452, 360), (466, 480), (482, 600), (500, 740), (510, 880)]]
SHERWANI_FOLDS = [[(222, 300), (214, 420), (208, 540), (200, 700)], [(268, 440), (262, 560), (258, 716)], [(296, 470), (300, 600), (306, 708)], [(236, 470), (232, 600), (228, 716)]]


def garland(a, b, sag, n):
    return [(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n + sag * math.sin(math.pi * i / n)) for i in range(n + 1)]


G_MALA = garland((244, 272), (300, 280), 190, 64)
B_MALA = garland((386, 290), (420, 290), 176, 56)

ROSE, JASMINE, MARIGOLD = '#c4243f', '#fbf1dc', '#f0952a'


def mala(points, r):
    """A dense garland: two staggered rows of jasmine, with roses and marigolds woven in, each flower shaded."""
    out = []
    for row, off in ((0, -2.6), (1, 2.6)):
        for i, (x, y) in enumerate(points):
            if (i + row) % 2:
                continue
            colour = ROSE if (i // 2) % 5 == 2 else MARIGOLD if (i // 2) % 7 == 4 else JASMINE
            rr = r * (1.15 if colour != JASMINE else 1)
            grad = {ROSE: 'url(#cp-rose)', MARIGOLD: 'url(#cp-marigold)', JASMINE: 'url(#cp-jasmine)'}[colour]
            out.append(f'<circle cx="{x + off:.1f}" cy="{y:.1f}" r="{rr:.1f}" fill="{grad}" />')
            if colour == JASMINE:
                out.append(f'<circle cx="{x + off - rr * 0.25:.1f}" cy="{y - rr * 0.25:.1f}" r="{rr * 0.3:.1f}" fill="#fffef8" opacity="0.8" />')
    return ''.join(out)


# ------------------------------------------------------------------ assemble
shapes = {
    'g-tail': G_TAIL, 'g-turban': G_TURBAN, 'g-head': G_HEAD, 'g-hair': G_HAIR, 'g-beard': G_BEARD, 'g-body': G_BODY, 'g-arm': G_ARM, 'g-hand': G_HAND,
    'g-leg-b': G_LEG_BACK, 'g-leg-f': G_LEG_FRONT, 'g-shoe-b': G_SHOE_BACK, 'g-shoe-f': G_SHOE_FRONT, 'g-stole': G_STOLE, 'g-kalgi': G_KALGI,
    'b-head': B_HEAD, 'b-hair': B_HAIR, 'b-torso': B_TORSO, 'b-arm': B_ARM, 'b-sleeve': B_SLEEVE, 'b-skirt': B_SKIRT, 'b-veil': B_VEIL, 'b-veil-cap': B_VEIL_CAP,
}
defs_paths = '\n'.join(f'    <path id="{k}" d="{smooth(v)}" />' for k, v in shapes.items())
clips = '\n'.join(f'    <clipPath id="clip-{k}"><use href="#{k}" /></clipPath>' for k in shapes)


def inner_rim(k, width=5, colour='#ffd9a0', opacity=0.75):
    """A soft band of rim light just inside a shape's edge."""
    return f'<use href="#{k}" fill="none" stroke="{colour}" stroke-width="{width}" opacity="{opacity}" clip-path="url(#clip-{k})" filter="url(#cp-blur2)" />'


def shade(k, grad):
    """Roundness shading: a gradient overlay clipped to the shape."""
    return f'<use href="#{k}" fill="url(#{grad})" />'


def folds(lines, colour, width, opacity, clip):
    return f'<g fill="none" stroke="{colour}" stroke-width="{width}" opacity="{opacity}" stroke-linecap="round" clip-path="url(#clip-{clip})" filter="url(#cp-blur3)">' + ''.join(path(smooth(l, closed=False)) for l in lines) + '</g>'


# ---- groom layers
groom = []
groom.append('<use href="#g-tail" fill="url(#cp-safa)" />')
groom.append('<use href="#g-tail" fill="url(#pat-leheriya)" opacity="0.8" />')
groom.append(f'<g clip-path="url(#clip-g-tail)">{path(smooth([(190, 360), (206, 362)], closed=False), stroke="#e9c46a", stroke_width=6, fill="none")}</g>')
for k in ('g-leg-b', 'g-leg-f'):
    groom.append(f'<use href="#{k}" fill="url(#cp-churidar)" />')
    groom.append(shade(k, 'cp-round-v'))
# churidar gathers at the ankle
for (x0, x1) in ((214, 244), (276, 302)):
    for k in range(6):
        y = 862 + k * 7
        groom.append(path(f'M{x0 + 1},{y} Q{(x0 + x1) / 2},{y + 4} {x1 - 1},{y - 1}', stroke='#a8946c', stroke_width=1.3, fill='none', opacity=0.7))
for k in ('g-shoe-b', 'g-shoe-f'):
    groom.append(f'<use href="#{k}" fill="url(#cp-mojari)" />')
    groom.append(f'<use href="#{k}" fill="url(#pat-dots-gold)" opacity="0.9" />')
groom.append('<use href="#g-stole" fill="url(#cp-stole)" />')
groom.append('<use href="#g-stole" fill="url(#pat-buti-small)" opacity="0.7" />')
groom.append(f'<g clip-path="url(#clip-g-stole)">' + path(smooth([(240, 292), (219, 344), (213, 420), (215, 500), (214, 600), (210, 662)], closed=False), stroke='#e2b95c', stroke_width=5, fill='none') + '</g>')
# sherwani
groom.append('<use href="#g-body" fill="url(#cp-sherwani)" />')
groom.append('<use href="#g-body" fill="url(#pat-paisley)" opacity="0.75" />')
groom.append(shade('g-body', 'cp-round-h'))
groom.append(folds(SHERWANI_FOLDS, '#7d6844', 5, 0.35, 'g-body'))
# chest yoke of dense zardozi around the collar
groom.append(f'<g clip-path="url(#clip-g-body)"><path d="M232,262 C246,300 268,318 300,316 L318,300 L304,268 Z" fill="url(#pat-brocade)" opacity="0.95" /></g>')
# placket with buttons, hem border
groom.append(f'<g clip-path="url(#clip-g-body)">' + path(smooth(PLACKET, closed=False), stroke='url(#cp-gold-band)', stroke_width=9, fill='none') + path(smooth(PLACKET, closed=False), stroke='url(#pat-brocade)', stroke_width=7, fill='none') + '</g>')
for x, y, _ in sample(PLACKET[:6], 22):
    groom.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.6" fill="url(#cp-button)" />')
hem_band = [(x, y + 6) for x, y in SHERWANI_HEM]
groom.append(f'<g clip-path="url(#clip-g-body)">' + path(smooth(hem_band, closed=False), stroke='url(#cp-gold-band)', stroke_width=20, fill='none') + path(smooth(hem_band, closed=False), stroke='url(#pat-brocade)', stroke_width=16, fill='none') + path(smooth(offset(hem_band, -11), closed=False), stroke='#f3d68c', stroke_width=1.2, fill='none') + '</g>')
groom.append(f'<g clip-path="url(#clip-g-body)">{motif_row(offset(SHERWANI_HEM, 22), "m-paisley", 13, 0.9)}</g>')
groom.append(inner_rim('g-body', 7))
# head: skin, ear, beard, eye, brow, lips
groom.append('<use href="#g-head" fill="url(#cp-skin)" />')
groom.append(shade('g-head', 'cp-face-shade'))
groom.append('<use href="#g-hair" fill="#1c110b" />')
groom.append('<use href="#g-beard" fill="#2a1a12" opacity="0.92" />')
groom.append('<g stroke="#4a3022" stroke-width="0.9" opacity="0.7" stroke-linecap="round">' + ''.join(f'<path d="M{252 + i * 3.4},{218 + (i % 3) * 3} l{1.5 + (i % 2)},{5 + (i % 3)}" />' for i in range(19)) + '</g>')
groom.append(path('M309,203 C314,202 320,203 323,205 C318,207 312,207 309,203 Z', fill='#2a1a12'))
groom.append(path('M317,209 C319,210 320,212 318,214', stroke='#6a3a2c', stroke_width=1.6, fill='none'))
groom.append(path('M258,172 C252,172 250,184 255,193 C258,198 265,198 267,191 C268,183 265,173 258,172 Z', fill='#8a5638', stroke='#6a4028', stroke_width=1))
groom.append(path('M258,178 C255,182 256,189 260,191', stroke='#5a3420', stroke_width=1.2, fill='none'))
groom.append(path('M300,157 C306,154 313,154 318,157', stroke='#24150e', stroke_width=2.6, fill='none', stroke_linecap='round'))
groom.append(path('M303,166 C307,163 313,163 316,166 C312,168 307,168 303,166 Z', fill='#f3e6d6'))
groom.append('<circle cx="311" cy="165.6" r="1.9" fill="#2a170f" />')
groom.append(path('M302,165.5 C307,162 313,162 317,165.5', stroke='#1a0d08', stroke_width=1.3, fill='none'))
groom.append(inner_rim('g-head', 4, opacity=0.65))
# safa: stripes, pleats, sarpech, kalgi
groom.append('<use href="#g-turban" fill="url(#cp-safa)" />')
groom.append('<use href="#g-turban" fill="url(#pat-leheriya)" opacity="0.9" />')
pleats = [[(200, 122), (220, 92), (252, 70), (298, 76)], [(208, 132), (228, 106), (262, 90), (303, 104)], [(196, 100), (214, 70), (246, 54), (282, 52)], [(212, 142), (240, 124), (272, 116), (312, 124)]]
groom.append(f'<g clip-path="url(#clip-g-turban)" fill="none" stroke-linecap="round">' + ''.join(path(smooth(p, closed=False), stroke='#4a0c18', stroke_width=4, opacity=0.45) + path(smooth(offset(p, -3), closed=False), stroke='#ffd0a8', stroke_width=1.6, opacity=0.5) for p in pleats) + '</g>')
groom.append(shade('g-turban', 'cp-round-v'))
groom.append(path(smooth([(298, 72), (306, 90), (310, 110), (310, 130)], closed=False), stroke='#f6e9c8', stroke_width=4.2, stroke_dasharray='0.1 6', stroke_linecap='round', fill='none'))
groom.append('<use href="#g-kalgi" fill="url(#cp-feather)" />')
groom.append(path(smooth([(299, 78), (291, 58), (282, 40), (272, 22)], closed=False), stroke='#d9c9a8', stroke_width=0.9, fill='none'))
groom.append('<g fill="#fff6e2">' + ''.join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="1.6" />' for x, y, _ in sample([(304, 86), (296, 92), (290, 104), (292, 116)], 4.2)) + '</g>')
groom.append('<circle cx="304" cy="84" r="6" fill="url(#cp-jewel)" stroke="#f7dc94" stroke-width="1.6" />')
groom.append('<circle cx="304" cy="84" r="2.4" fill="#2f8a5a" />')
groom.append(inner_rim('g-turban', 4, opacity=0.6))
# varmala, then the arm and hand over it
groom.append(mala(G_MALA, 4.6))
groom.append('<use href="#g-arm" fill="url(#cp-sherwani)" />')
groom.append('<use href="#g-arm" fill="url(#pat-paisley)" opacity="0.75" />')
groom.append(shade('g-arm', 'cp-round-h'))
groom.append(path('M313,404 L317,429', stroke='url(#cp-gold-band)', stroke_width=7, fill='none'))
groom.append('<use href="#g-hand" fill="url(#cp-skin)" />')
groom.append(path('M338,408 C344,411 348,416 350,422 M344,407 C350,410 354,414 355,419', stroke='#6a4028', stroke_width=0.9, fill='none', opacity=0.8))
groom.append(inner_rim('g-arm', 4, opacity=0.5))

# ---- bride layers
bride = []
bride.append('<use href="#b-veil" fill="url(#cp-veil)" />')
bride.append('<use href="#b-veil" fill="url(#pat-sequin)" opacity="0.9" />')
bride.append(folds(VEIL_FOLDS, '#b0506c', 7, 0.35, 'b-veil'))
bride.append(f'<g clip-path="url(#clip-b-veil)">' + path(smooth(offset(VEIL_EDGE, 5), closed=False), stroke='url(#cp-gold-band)', stroke_width=11, fill='none') + motif_row(offset(VEIL_EDGE, 5), 'm-rosette', 10, 0.7) + '</g>')
# latkans (small tassels) at the veil's corner
for i, (x, y) in enumerate(((566, 942), (578, 944), (590, 940))):
    bride.append(f'<path d="M{x},{y - 6} L{x},{y + 2}" stroke="#d9a94e" stroke-width="1.2" /><circle cx="{x}" cy="{y + 5}" r="3.2" fill="url(#cp-button)" />')
# lehenga: base, panel shading, buti, kalis, borders
bride.append('<use href="#b-skirt" fill="url(#cp-lehenga)" />')
panels = ''.join(f'<path d="{smooth(k, closed=False)}" />' for k in KALIS)
bride.append(f'<g clip-path="url(#clip-b-skirt)" fill="none" stroke="#1f3320" stroke-width="10" opacity="0.28" filter="url(#cp-blur3)">{panels}</g>')
bride.append(f'<g clip-path="url(#clip-b-skirt)" fill="none" stroke="#c9dcb0" stroke-width="4" opacity="0.25" filter="url(#cp-blur3)">' + ''.join(f'<path d="{smooth(offset(k, 8), closed=False)}" />' for k in KALIS) + '</g>')
bride.append('<use href="#b-skirt" fill="url(#pat-buti)" opacity="0.95" />')
bride.append(f'<g clip-path="url(#clip-b-skirt)" fill="none" stroke="#e7c06a" stroke-width="1.3" stroke-dasharray="0.1 4" stroke-linecap="round">{panels}</g>')
bride.append(shade('b-skirt', 'cp-round-h-b'))
bride.append(f'<g clip-path="url(#clip-b-skirt)">' + path(smooth(SKIRT_MID, closed=False), stroke='url(#cp-gold-band)', stroke_width=10, fill='none') + motif_row(SKIRT_MID, 'm-rosette', 11, 0.62) + '</g>')
hem_up = offset(SKIRT_HEM, -14)
bride.append(f'<g clip-path="url(#clip-b-skirt)">' + path(smooth(hem_up, closed=False), stroke='url(#cp-gold-band)', stroke_width=30, fill='none') + path(smooth(hem_up, closed=False), stroke='url(#pat-brocade)', stroke_width=26, fill='none') + motif_row(hem_up, 'm-paisley', 15, 1.05) + path(smooth(offset(SKIRT_HEM, 3), closed=False), stroke='#f3d68c', stroke_width=2.4, fill='none') + path(smooth(offset(SKIRT_HEM, -32), closed=False), stroke='#f3d68c', stroke_width=1.4, fill='none') + motif_row(offset(SKIRT_HEM, -40), 'm-scallop', 9, 1.0) + '</g>')
bride.append(inner_rim('b-skirt', 7))
# blouse with embroidered neckline
bride.append('<use href="#b-torso" fill="url(#cp-blouse)" />')
bride.append('<use href="#b-torso" fill="url(#pat-brocade)" opacity="0.55" />')
bride.append(shade('b-torso', 'cp-round-h-b'))
bride.append(path(smooth([(384, 292), (390, 312), (404, 320), (420, 316), (428, 302)], closed=False), stroke='url(#cp-gold-band)', stroke_width=5, fill='none'))
bride.append(path(smooth([(386, 420), (408, 424), (431, 420)], closed=False), stroke='url(#cp-gold-band)', stroke_width=6, fill='none'))
bride.append(inner_rim('b-torso', 4, opacity=0.6))
# head: hair with parting, gajra bun, skin, eye with kohl, brows, lips, bindi
bride.append('<use href="#b-head" fill="url(#cp-skin)" />')
bride.append(shade('b-head', 'cp-face-shade-b'))
bride.append('<use href="#b-hair" fill="#1a0f0b" />')
bride.append(path(smooth([(368, 160), (392, 156), (416, 168), (430, 190)], closed=False), stroke='#3a2418', stroke_width=1.2, fill='none', opacity=0.8))
bride.append('<ellipse cx="447" cy="240" rx="17" ry="19" fill="#1a0f0b" />')
bride.append('<g>' + ''.join(f'<circle cx="{447 + 19 * math.cos(a):.1f}" cy="{240 + 20 * math.sin(a):.1f}" r="3.4" fill="url(#cp-jasmine)" />' for a in [i * math.pi / 9 - math.pi * 0.9 for i in range(14)]) + '</g>')
bride.append(path('M352,184 C356,180 363,180 368,183', stroke='#1f120b', stroke_width=2.2, fill='none', stroke_linecap='round'))
bride.append(path('M352,192 C356,189 362,189 366,192 C362,194 356,194 352,192 Z', fill='#f3e6d6'))
bride.append('<circle cx="356" cy="191.6" r="1.8" fill="#1f110a" />')
bride.append(path('M350,192 C355,187.5 362,187.5 368,191.5', stroke='#0f0805', stroke_width=1.6, fill='none'))
bride.append(path('M352,194 C357,195.5 362,195.5 366,193.5', stroke='#2a170e', stroke_width=0.8, fill='none'))
bride.append('<g stroke="#0f0805" stroke-width="0.8">' + ''.join(f'<path d="M{351 + i * 3},{190 - abs(i - 2) * 0.6} l-1.5,-2.6" />' for i in range(6)) + '</g>')
bride.append(path('M346,223 C349,222 351,223 352,225 C350,226 348,226 346,223 Z M347,229 C350,228 352,229 352,231 C350,233 348,232 347,229 Z', fill='#b0404e'))
bride.append('<circle cx="350.5" cy="177" r="1.9" fill="#b3122c" />')
bride.append(inner_rim('b-head', 4, opacity=0.6))
# jewellery: maang tikka, nath with chain, jhumka, choker and rani haar
bride.append(path('M378,154 C370,160 362,166 357,171', stroke='#e8c672', stroke_width=1.3, fill='none'))
bride.append('<circle cx="356" cy="173" r="3.4" fill="url(#cp-jewel)" stroke="#f7dc94" stroke-width="1" /><circle cx="356" cy="178.5" r="1.5" fill="#fff6e2" />')
bride.append('<circle cx="341.5" cy="224" r="8.4" stroke="url(#cp-gold-band)" stroke-width="1.7" fill="none" />')
bride.append('<g fill="#fff6e2">' + ''.join(f'<circle cx="{341.5 + 8.4 * math.cos(a):.1f}" cy="{224 + 8.4 * math.sin(a):.1f}" r="1.1" />' for a in [math.pi * (0.35 + i * 0.12) for i in range(6)]) + '</g>')
bride.append(path('M348,220 C368,228 394,222 414,210', stroke='#fbeec4', stroke_width=1.3, stroke_dasharray='0.1 3.6', stroke_linecap='round', fill='none'))
bride.append('<circle cx="414" cy="212" r="3" fill="url(#cp-jewel)" />')
bride.append(path('M406,226 C406,218 422,218 422,226 L425,237 L403,237 Z', fill='url(#cp-gold-band)'))
bride.append('<g fill="#fff6e2">' + ''.join(f'<circle cx="{404 + i * 3.6:.1f}" cy="240" r="1.4" />' for i in range(6)) + '</g>')
bride.append(path(smooth([(384, 292), (392, 300), (404, 304), (418, 302), (428, 294)], closed=False), stroke='url(#cp-gold-band)', stroke_width=6, fill='none'))
bride.append(path(smooth([(384, 293), (392, 301), (404, 305), (418, 303), (428, 295)], closed=False), stroke='#c4243f', stroke_width=2.6, stroke_dasharray='0.1 6', stroke_linecap='round', fill='none'))
bride.append(path(smooth([(386, 300), (390, 330), (404, 350), (422, 346), (434, 330)], closed=False), stroke='#fbeec4', stroke_width=3.4, stroke_dasharray='0.1 5.2', stroke_linecap='round', fill='none'))
bride.append('<path d="M404,350 C399,350 397,356 404,364 C411,356 409,350 404,350 Z" fill="url(#cp-jewel)" stroke="#f7dc94" stroke-width="1" />')
# veil over her head, in front of the hair
bride.append('<use href="#b-veil-cap" fill="url(#cp-veil)" opacity="0.85" />')
bride.append('<use href="#b-veil-cap" fill="url(#pat-sequin)" opacity="0.9" />')
bride.append(path(smooth(VEIL_EDGE[:8], closed=False), stroke='url(#cp-gold-band)', stroke_width=4, fill='none'))
# varmala, then her arm, sleeve, bangles and mehendi hand
bride.append(mala(B_MALA, 4.2))
bride.append('<use href="#b-arm" fill="url(#cp-skin)" />')
bride.append(shade('b-arm', 'cp-round-h-b'))
bride.append('<use href="#b-sleeve" fill="url(#cp-blouse)" /><use href="#b-sleeve" fill="url(#pat-brocade)" opacity="0.5" />')
bride.append(path('M397,350 L413,350', stroke='url(#cp-gold-band)', stroke_width=4.5, fill='none'))
for i, c in enumerate(('#e7c06a', '#b3122c', '#e7c06a', '#b3122c', '#e7c06a', '#f3d68c')):
    x = 382 + i * 2.8
    bride.append(f'<path d="M{x},{398 + i * 1.1} C{x + 4},{402 + i} {x + 5},{408 + i} {x + 3},{414 + i * 0.6}" stroke="{c}" stroke-width="2.2" fill="none" />')
bride.append('<g fill="#a2522a" opacity="0.7">' + ''.join(f'<circle cx="{352 + (i % 4) * 4.2:.1f}" cy="{417 + (i // 4) * 3.6:.1f}" r="0.8" />' for i in range(12)) + '</g>')
bride.append(inner_rim('b-arm', 3.5, opacity=0.5))

SVG = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 960" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
  <!-- Generated by tools/couple/build_couple.py — edit the contours and layers there, not here. -->
  <defs>
    <filter id="cp-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2" /></filter>
    <filter id="cp-blur2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2" /></filter>
    <filter id="cp-blur3" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3" /></filter>

    <!-- cloth and skin -->
    <linearGradient id="cp-sherwani" x1="0" y1="260" x2="0" y2="724" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#efe3c6" /><stop offset="0.55" stop-color="#e2cfa6" /><stop offset="1" stop-color="#c7ad80" /></linearGradient>
    <linearGradient id="cp-churidar" x1="0" y1="712" x2="0" y2="910" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#eee3cb" /><stop offset="1" stop-color="#cdbb94" /></linearGradient>
    <linearGradient id="cp-mojari" x1="0" y1="904" x2="0" y2="938" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#b8812e" /><stop offset="1" stop-color="#7a4f18" /></linearGradient>
    <linearGradient id="cp-safa" x1="0" y1="50" x2="0" y2="380" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#b8344a" /><stop offset="0.3" stop-color="#9b2335" /><stop offset="1" stop-color="#6a1424" /></linearGradient>
    <linearGradient id="cp-stole" x1="0" y1="280" x2="0" y2="662" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8e2434" /><stop offset="1" stop-color="#5c1422" /></linearGradient>
    <linearGradient id="cp-feather" x1="0" y1="14" x2="0" y2="84" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fffaf0" /><stop offset="1" stop-color="#e8d9b8" /></linearGradient>
    <linearGradient id="cp-skin" x1="0" y1="140" x2="0" y2="430" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#b47d56" /><stop offset="1" stop-color="#8f5a3a" /></linearGradient>
    <linearGradient id="cp-face-shade" x1="210" y1="0" x2="332" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3a1f12" stop-opacity="0.45" /><stop offset="0.55" stop-color="#3a1f12" stop-opacity="0" /><stop offset="1" stop-color="#ffcf9f" stop-opacity="0.18" /></linearGradient>
    <linearGradient id="cp-face-shade-b" x1="440" y1="0" x2="338" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3a1f12" stop-opacity="0.45" /><stop offset="0.55" stop-color="#3a1f12" stop-opacity="0" /><stop offset="1" stop-color="#ffcf9f" stop-opacity="0.18" /></linearGradient>
    <linearGradient id="cp-lehenga" x1="0" y1="420" x2="0" y2="948" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#86a374" /><stop offset="0.5" stop-color="#668658" /><stop offset="1" stop-color="#46613e" /></linearGradient>
    <linearGradient id="cp-blouse" x1="0" y1="284" x2="0" y2="424" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#7d9a6a" /><stop offset="1" stop-color="#5c7a4f" /></linearGradient>
    <linearGradient id="cp-veil" x1="0" y1="140" x2="0" y2="944" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd9b8" stop-opacity="0.85" /><stop offset="0.35" stop-color="#f3b3b8" stop-opacity="0.6" /><stop offset="1" stop-color="#d98a96" stop-opacity="0.7" /></linearGradient>
    <linearGradient id="cp-round-h" x1="180" y1="0" x2="330" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2a1a0c" stop-opacity="0.38" /><stop offset="0.45" stop-color="#2a1a0c" stop-opacity="0" /><stop offset="0.85" stop-color="#2a1a0c" stop-opacity="0.08" /><stop offset="1" stop-color="#2a1a0c" stop-opacity="0.3" /></linearGradient>
    <linearGradient id="cp-round-h-b" x1="520" y1="0" x2="330" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#14220f" stop-opacity="0.42" /><stop offset="0.45" stop-color="#14220f" stop-opacity="0" /><stop offset="0.85" stop-color="#14220f" stop-opacity="0.1" /><stop offset="1" stop-color="#14220f" stop-opacity="0.32" /></linearGradient>
    <linearGradient id="cp-round-v" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1208" stop-opacity="0.35" /><stop offset="0.5" stop-color="#2a1208" stop-opacity="0" /><stop offset="1" stop-color="#2a1208" stop-opacity="0.25" /></linearGradient>

    <!-- metals, jewels and flowers -->
    <linearGradient id="cp-gold-band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7dc94" /><stop offset="0.5" stop-color="#d4a94e" /><stop offset="1" stop-color="#9a7426" /></linearGradient>
    <radialGradient id="cp-button" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff2c4" /><stop offset="0.5" stop-color="#d9ac4f" /><stop offset="1" stop-color="#8a6520" /></radialGradient>
    <radialGradient id="cp-jewel" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffd0d6" /><stop offset="0.45" stop-color="#c4243f" /><stop offset="1" stop-color="#5c0a18" /></radialGradient>
    <radialGradient id="cp-jasmine" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffffff" /><stop offset="0.7" stop-color="#f6ecd4" /><stop offset="1" stop-color="#d9c9a4" /></radialGradient>
    <radialGradient id="cp-rose" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#f06a80" /><stop offset="0.6" stop-color="#c4243f" /><stop offset="1" stop-color="#7a0e22" /></radialGradient>
    <radialGradient id="cp-marigold" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffd27a" /><stop offset="0.6" stop-color="#f0952a" /><stop offset="1" stop-color="#b85f10" /></radialGradient>

    <!-- motifs -->
    <g id="m-paisley"><path d="M0,0 C3,-5 9,-4 9,1 C9,5 4,7 1,10 C1,6 -3,4 0,0 Z" fill="#e7c06a" stroke="#9a7426" stroke-width="0.6" transform="translate(-4,-5)" /><circle cx="0.5" cy="-1" r="1.2" fill="#fff2c4" /></g>
    <g id="m-rosette"><circle r="3.2" fill="#e7c06a" /><circle r="1.4" fill="#c4243f" /><g fill="#f3d68c">{''.join(f'<circle cx="{4.6 * math.cos(i * math.pi / 3):.2f}" cy="{4.6 * math.sin(i * math.pi / 3):.2f}" r="1.1" />' for i in range(6))}</g></g>
    <g id="m-scallop"><path d="M-4.5,0 A4.5,4.5 0 0,0 4.5,0" fill="none" stroke="#e7c06a" stroke-width="1.3" /><circle cy="2.4" r="0.9" fill="#f3d68c" /></g>

    <!-- woven patterns -->
    <pattern id="pat-paisley" width="22" height="26" patternUnits="userSpaceOnUse"><use href="#m-paisley" transform="translate(6,8) scale(0.6)" /><use href="#m-paisley" transform="translate(17,21) scale(0.6) rotate(18)" /><circle cx="17" cy="7" r="0.8" fill="#d9ac4f" /><circle cx="5" cy="20" r="0.8" fill="#d9ac4f" /></pattern>
    <pattern id="pat-buti" width="20" height="22" patternUnits="userSpaceOnUse"><use href="#m-rosette" transform="translate(5,6) scale(0.45)" /><use href="#m-rosette" transform="translate(15,17) scale(0.45)" /><circle cx="15" cy="5" r="0.7" fill="#f3d68c" /><circle cx="5" cy="16" r="0.7" fill="#f3d68c" /></pattern>
    <pattern id="pat-buti-small" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="0.9" fill="#e7c06a" /><circle cx="9" cy="9" r="0.9" fill="#e7c06a" /></pattern>
    <pattern id="pat-sequin" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.85" fill="#fff4d6" /><circle cx="6.5" cy="6.5" r="0.7" fill="#f3d68c" /></pattern>
    <pattern id="pat-dots-gold" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="0.8" fill="#f3d68c" /></pattern>
    <pattern id="pat-brocade" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#c99a3e" /><path d="M4,0 L8,4 L4,8 L0,4 Z" fill="none" stroke="#f6dc94" stroke-width="0.9" /><circle cx="4" cy="4" r="1" fill="#8a2030" /></pattern>
    <pattern id="pat-leheriya" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)"><rect width="9" height="2.2" fill="#e9b85a" opacity="0.85" /><rect y="4.6" width="9" height="0.9" fill="#f7d9a0" opacity="0.6" /></pattern>

{defs_paths}
{clips}
  </defs>

  <ellipse cx="380" cy="941" rx="215" ry="9" fill="#2a160e" opacity="0.32" filter="url(#cp-glow)" />

  <!-- rim light: a warm glow around every backlit edge -->
  <g fill="none" stroke="#ffcf8a" stroke-width="6" opacity="0.75" filter="url(#cp-glow)">
    <use href="#g-tail" /><use href="#g-leg-b" /><use href="#g-leg-f" /><use href="#g-shoe-b" /><use href="#g-shoe-f" /><use href="#g-body" /><use href="#g-head" /><use href="#g-turban" /><use href="#g-kalgi" /><use href="#g-arm" />
    <use href="#b-skirt" /><use href="#b-torso" /><use href="#b-head" /><use href="#b-arm" />
  </g>

  <!-- the bride (behind the groom's reaching hand) -->
  <g>{''.join(bride)}</g>
  <!-- the groom -->
  <g>{''.join(groom)}</g>
</svg>
'''

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(SVG)
print('wrote', os.path.relpath(OUT, ROOT), len(SVG) // 1024, 'KB')
