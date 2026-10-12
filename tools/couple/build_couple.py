"""Builds the couple illustration (src/three/studio/assets/couple.svg) from anatomical contours.

Each outline is a list of points traced around a figure; points marked with 'c' are
corners, everything else is joined by a smooth centripetal Catmull-Rom spline (written
as cubic Beziers). Every garment is built in layers: base cloth with light and roundness
shading, a woven pattern (paisley buti, floral buti, leheriya stripes, sequins), soft
fold shadows, and embroidered borders whose motifs are placed one by one along each
hem's curve. The couple stands backlit by the setting sun: a warm rim of light runs
around every edge, and the bride's dupatta glows as the light passes through it.

Writes src/three/studio/assets/couple.svg, the vector reference; tools/couple/paint_couple.py
relights it into the couple.webp the studio uses. Usage: python tools/couple/build_couple.py
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'src', 'three', 'studio', 'assets', 'couple.svg')
# COUPLE_FLAT=1 leaves out the painted light (roundness gradients, fold shadows, rim glow):
# tools/couple/paint_couple.py relights the flat art itself.
FLAT = os.environ.get('COUPLE_FLAT') == '1'


from geom import C, motif_row, offset, path, sample, segments, smooth  # noqa: E402,F401
import faces  # noqa: E402


# ------------------------------------------------------------------ the groom (left, facing right)
G_TAIL = [(214, 150, C), (206, 190), (198, 240), (192, 300), (190, 350), (194, 378, C), (206, 376, C), (206, 330), (212, 270), (220, 210), (228, 158, C)]
G_TURBAN = [(206, 156, C), (198, 132), (199, 108), (208, 88), (222, 72), (242, 61), (264, 56), (286, 58), (303, 67), (314, 82), (320, 100), (320, 118), (316, 134), (312, 143, C), (290, 140), (262, 142), (236, 147), (216, 152)]
G_HEAD = faces.groom_shapes()['g-head']
G_HAIR = faces.groom_shapes()['g-hair']
G_BEARD = faces.groom_shapes()['g-beard']
G_MOUSTACHE = faces.groom_shapes()['g-moustache']
G_BODY = [(236, 262, C), (222, 275), (209, 286), (202, 304), (199, 330), (201, 362), (206, 400), (206, 432), (202, 470), (197, 530), (191, 600), (186, 668), (182, 716, C), (214, 722), (256, 724), (296, 719), (326, 709, C), (321, 650), (316, 590), (311, 530), (308, 478), (308, 444), (312, 410), (317, 370), (319, 334), (315, 304), (303, 285), (292, 272, C)]
G_ARM = [(244, 290), (258, 284), (270, 292), (277, 318), (281, 352), (285, 384), (300, 400), (319, 404, C), (320, 431, C), (290, 425), (270, 411), (262, 386), (257, 352), (251, 318), (242, 300)]
# the clasp: his palm under her hand, his fingers curling up round its edge, his thumb over its back
G_HAND = [(316, 410, C), (326, 415), (336, 419), (345, 420), (351, 418), (355.5, 414.5), (358.5, 416), (359, 421), (356, 426.5), (348, 430.5), (336, 432.5), (324, 432), (316, 430, C)]
G_THUMB = [(318, 413), (324, 408.5), (332, 405.5), (340, 404.6), (345.5, 405.6), (346.2, 408), (342, 409.6), (334, 410.6), (326, 414)]
G_LEG_BACK = [(208, 712, C), (209, 760), (212, 820), (217, 872), (215, 886), (218, 896), (222, 909, C), (246, 909, C), (244, 892), (246, 880), (243, 830), (243, 770), (241, 714, C)]
G_LEG_FRONT = [(262, 716, C), (266, 770), (271, 830), (277, 874), (275, 888), (279, 907, C), (304, 907, C), (302, 890), (304, 876), (300, 830), (300, 776), (299, 716, C)]
G_SHOE_BACK = [(216, 906, C), (214, 926), (218, 937, C), (252, 937), (259, 927), (253, 921), (246, 909, C)]
G_SHOE_FRONT = [(276, 906, C), (274, 928), (280, 937, C), (322, 937), (334, 922), (327, 922), (314, 915), (304, 906, C)]
G_STOLE = [(228, 280, C), (207, 330), (199, 420), (198, 520), (196, 610), (192, 660, C), (212, 662, C), (216, 600), (217, 500), (215, 420), (221, 344), (242, 292, C)]
G_KALGI = [(306, 82, C), (302, 64), (296, 48), (288, 34), (278, 22), (270, 14, C), (276, 26), (284, 40), (292, 56), (299, 80, C)]

# ------------------------------------------------------------------ the bride (right, facing left)
B_HEAD = faces.bride_shapes()['b-head']
B_HAIR = faces.bride_shapes()['b-hair']
B_TORSO = [(382, 280, C), (374, 298), (370, 320), (372, 340), (378, 352), (382, 382), (386, 422, C), (431, 422, C), (434, 390), (436, 350), (434, 318), (428, 296), (418, 284), (414, 280, C)]
B_ARM = [(396, 300), (406, 296), (414, 306), (415, 336), (413, 372), (410, 392), (397, 410), (380, 418), (364, 425.5, C), (361, 410.5, C), (372, 407), (388, 398), (396, 380), (398, 350), (396, 322)]
# her hand, palm down in his: the back of the hand, slender fingers resting across his palm
B_HAND = [(364, 410, C), (356, 410.5), (348, 411), (340, 411.6), (332, 412.4), (326.5, 413.6), (324.2, 416.2), (325.6, 418.8), (330, 419.6), (338, 420.4), (346, 422), (355, 424.6), (365, 426, C)]
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
B_MALA = garland((386, 284), (420, 284), 180, 56)

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
    'g-tail': G_TAIL, 'g-turban': G_TURBAN, 'g-head': G_HEAD, 'g-hair': G_HAIR, 'g-beard': G_BEARD, 'g-moustache': G_MOUSTACHE, 'g-body': G_BODY, 'g-arm': G_ARM, 'g-hand': G_HAND, 'g-thumb': G_THUMB, 'b-hand': B_HAND,
    'g-leg-b': G_LEG_BACK, 'g-leg-f': G_LEG_FRONT, 'g-shoe-b': G_SHOE_BACK, 'g-shoe-f': G_SHOE_FRONT, 'g-stole': G_STOLE, 'g-kalgi': G_KALGI,
    'b-head': B_HEAD, 'b-hair': B_HAIR, 'b-torso': B_TORSO, 'b-arm': B_ARM, 'b-sleeve': B_SLEEVE, 'b-skirt': B_SKIRT, 'b-veil': B_VEIL, 'b-veil-cap': B_VEIL_CAP,
}
defs_paths = '\n'.join(f'    <path id="{k}" d="{smooth(v)}" />' for k, v in shapes.items())
clips = '\n'.join(f'    <clipPath id="clip-{k}"><use href="#{k}" /></clipPath>' for k in shapes)


def inner_rim(k, width=5, colour='#ffd9a0', opacity=0.75):
    """A soft band of rim light just inside a shape's edge."""
    if FLAT:
        return ''
    return f'<use href="#{k}" fill="none" stroke="{colour}" stroke-width="{width}" opacity="{opacity}" clip-path="url(#clip-{k})" filter="url(#cp-blur2)" />'


def shade(k, grad):
    """Roundness shading: a gradient overlay clipped to the shape."""
    if FLAT:
        return ''
    return f'<use href="#{k}" fill="url(#{grad})" />'


def folds(lines, colour, width, opacity, clip):
    if FLAT:
        return ''
    return f'<g fill="none" stroke="{colour}" stroke-width="{width}" opacity="{opacity}" stroke-linecap="round" clip-path="url(#clip-{clip})" filter="url(#cp-blur3)">' + ''.join(path(smooth(l, closed=False)) for l in lines) + '</g>'


def soft_wash(cx, cy, rx, ry, colour, opacity):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{colour}" opacity="{opacity}" filter="url(#cp-blur1)" />'


def bride_hand():
    """Her hand: finger separations, nails, knuckle creases, mehendi (a mandala on the back of the hand,
    vines along the fingers, dyed fingertips) and a ring with a ruby."""
    o = ['<use href="#b-hand" fill="url(#cp-skin-b)" />']
    o.append('<g clip-path="url(#clip-b-hand)">')
    for y0, y1, x1 in ((414.6, 416.2, 344), (416.6, 418.4, 346), (418.6, 420.4, 350)):
        o.append(path(f'M{x1},{y1} C{x1 - 8},{(y0 + y1) / 2 + 0.3} {x1 - 14},{y0 + 0.4} 327,{y0}', stroke='#6e3a22', stroke_width=0.55, fill='none', opacity=0.55))
    o.append(soft_wash(345, 424, 16, 2.2, '#4a2010', 0.4))
    for x in (340, 333):
        o.append(path(f'M{x},{411.8 + (340 - x) * 0.1} C{x - 0.6},413.5 {x - 0.4},415 {x + 0.2},416', stroke='#6e3a22', stroke_width=0.5, fill='none', opacity=0.5))
    o.append(soft_wash(348, 413, 9, 1.4, '#ffd8b8', 0.4))
    m = '#7a2e10'
    o.append(f'<circle cx="355" cy="417.6" r="3.4" fill="none" stroke="{m}" stroke-width="0.55" opacity="0.8" />')
    o.append(f'<circle cx="355" cy="417.6" r="1.6" fill="{m}" opacity="0.75" />')
    o.append(''.join(f'<circle cx="{355 + 4.6 * math.cos(a):.2f}" cy="{417.6 + 4.6 * math.sin(a):.2f}" r="0.55" fill="{m}" opacity="0.75" />' for a in [i * math.pi / 5 for i in range(10)]))
    for y in (413.2, 415.6, 418):
        o.append(path(f'M348,{y + 0.6} C343,{y} 338,{y - 0.2} 331,{y + 0.1}', stroke=m, stroke_width=0.45, stroke_dasharray='1.4 0.9', fill='none', opacity=0.7))
    o.append(f'<path d="M324.5,414 C327,413.4 329,413.6 329.6,415 L329.6,419 C327,419.6 325.4,419 324.6,418 Z" fill="{m}" opacity="0.85" />')
    o.append('</g>')
    o.append('<ellipse cx="325.4" cy="415.6" rx="1.2" ry="0.9" fill="#e9b6a0" opacity="0.9" />')
    o.append(path('M338.6,411.6 L338.6,420.6', stroke='url(#cp-gold-band)', stroke_width=1.6, fill='none'))
    o.append('<circle cx="338.6" cy="411.4" r="1.5" fill="url(#cp-jewel)" stroke="#f7dc94" stroke-width="0.4" />')
    o.append(inner_rim('b-hand', 2, opacity=0.45))
    return ''.join(o)


HANDS_BRIDE = bride_hand()

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
# head and neck (the sherwani's collar covers the neck's foot)
groom.append(faces.groom_face())
groom.append(inner_rim('g-head', 4, opacity=0.65))
# sherwani
groom.append('<use href="#g-body" fill="url(#cp-sherwani)" />')
groom.append('<use href="#g-body" fill="url(#pat-paisley)" opacity="0.75" />')
groom.append(shade('g-body', 'cp-round-h'))
groom.append(folds(SHERWANI_FOLDS, '#7d6844', 5, 0.35, 'g-body'))
# chest yoke of dense zardozi around the collar
groom.append(f'<g clip-path="url(#clip-g-body)"><path d="M232,262 C246,300 268,318 300,316 L318,300 L304,268 Z" fill="url(#pat-brocade)" opacity="0.95" /></g>')
# bandhgala collar: a stiff band of brocade round the neck, piped in gold
COLLAR = [(238, 243, C), (262, 248), (290, 253, C), (294, 276, C), (264, 272), (236, 266, C)]
groom.append(path(smooth(COLLAR), fill='url(#pat-brocade)'))
groom.append(path(smooth(COLLAR), fill='none', stroke='url(#cp-gold-band)', stroke_width=1.8))
groom.append(path(smooth([(237, 254), (264, 259.5), (292, 264.5)], closed=False), stroke='#f6dc94', stroke_width=0.9, fill='none', opacity=0.8))
groom.append(path(smooth([(237.5, 249), (263, 254), (291, 259)], closed=False), stroke='#8a2030', stroke_width=1.6, stroke_dasharray='0.1 4', stroke_linecap='round', fill='none'))
# placket with buttons, hem border
groom.append(f'<g clip-path="url(#clip-g-body)">' + path(smooth(PLACKET, closed=False), stroke='url(#cp-gold-band)', stroke_width=9, fill='none') + path(smooth(PLACKET, closed=False), stroke='url(#pat-brocade)', stroke_width=7, fill='none') + '</g>')
for x, y, _ in sample(PLACKET[:6], 22):
    groom.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.6" fill="url(#cp-button)" />')
hem_band = [(x, y + 6) for x, y in SHERWANI_HEM]
groom.append(f'<g clip-path="url(#clip-g-body)">' + path(smooth(hem_band, closed=False), stroke='url(#cp-gold-band)', stroke_width=20, fill='none') + path(smooth(hem_band, closed=False), stroke='url(#pat-brocade)', stroke_width=16, fill='none') + path(smooth(offset(hem_band, -11), closed=False), stroke='#f3d68c', stroke_width=1.2, fill='none') + '</g>')
groom.append(f'<g clip-path="url(#clip-g-body)">{motif_row(offset(SHERWANI_HEM, 22), "m-paisley", 13, 0.9)}</g>')
groom.append(inner_rim('g-body', 7))
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
groom.append(inner_rim('g-arm', 4, opacity=0.5))
# the clasp: his palm and curled fingers, her hand resting in it, then his thumb over hers
groom.append('<use href="#g-hand" fill="url(#cp-skin)" />')
groom.append('<g clip-path="url(#clip-g-hand)">' + ''.join(
    path(f'M{x},{y0} C{x + 2.2},{y0 + 3} {x + 2.4},{y0 + 7} {x + 1},{y0 + 10}', stroke='#5a3020', stroke_width=0.8, fill='none', opacity=0.7)
    for x, y0 in ((351.5, 418), (354.5, 417.5), (356.5, 418.5))) + soft_wash(334, 431, 18, 2.6, '#4a2010', 0.5) + '</g>')
for x, y in ((356.8, 415.6), (358.2, 418.6)):
    groom.append(f'<ellipse cx="{x}" cy="{y}" rx="1.3" ry="0.9" fill="#d9a88a" opacity="0.8" />')
groom.append(HANDS_BRIDE)
groom.append('<use href="#g-thumb" fill="url(#cp-skin)" />')
groom.append(path('M341,405.4 C343.6,405.2 345.4,406 345.6,407.4 C344,408.2 342,408 341,405.4 Z', fill='#e2b49a', opacity=0.85))
groom.append(path('M330,407.2 C331,408.4 331,410 330.2,411', stroke='#6a4028', stroke_width=0.6, fill='none', opacity=0.6))
groom.append(inner_rim('g-thumb', 2, opacity=0.45))

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
if not FLAT:
    bride.append(f'<g clip-path="url(#clip-b-skirt)" fill="none" stroke="#1f3320" stroke-width="10" opacity="0.28" filter="url(#cp-blur3)">{panels}</g>')
    bride.append(f'<g clip-path="url(#clip-b-skirt)" fill="none" stroke="#c9dcb0" stroke-width="4" opacity="0.25" filter="url(#cp-blur3)">' + ''.join(f'<path d="{smooth(offset(k, 8), closed=False)}" />' for k in KALIS) + '</g>')
bride.append('<use href="#b-skirt" fill="url(#pat-buti)" opacity="0.95" />')
bride.append(f'<g clip-path="url(#clip-b-skirt)" fill="none" stroke="#e7c06a" stroke-width="1.3" stroke-dasharray="0.1 4" stroke-linecap="round">{panels}</g>')
bride.append(shade('b-skirt', 'cp-round-h-b'))
bride.append(f'<g clip-path="url(#clip-b-skirt)">' + path(smooth(SKIRT_MID, closed=False), stroke='url(#cp-gold-band)', stroke_width=10, fill='none') + motif_row(SKIRT_MID, 'm-rosette', 11, 0.62) + '</g>')
hem_up = offset(SKIRT_HEM, -14)
bride.append(f'<g clip-path="url(#clip-b-skirt)">' + path(smooth(hem_up, closed=False), stroke='url(#cp-gold-band)', stroke_width=30, fill='none') + path(smooth(hem_up, closed=False), stroke='url(#pat-brocade)', stroke_width=26, fill='none') + motif_row(hem_up, 'm-paisley', 15, 1.05) + path(smooth(offset(SKIRT_HEM, 3), closed=False), stroke='#f3d68c', stroke_width=2.4, fill='none') + path(smooth(offset(SKIRT_HEM, -32), closed=False), stroke='#f3d68c', stroke_width=1.4, fill='none') + motif_row(offset(SKIRT_HEM, -40), 'm-scallop', 9, 1.0) + '</g>')
bride.append(inner_rim('b-skirt', 7))
# head and neck first: the blouse covers the neck's foot
bride.append(faces.bride_face(inner_rim))
# blouse with embroidered neckline
bride.append('<use href="#b-torso" fill="url(#cp-blouse)" />')
bride.append('<use href="#b-torso" fill="url(#pat-brocade)" opacity="0.55" />')
bride.append(shade('b-torso', 'cp-round-h-b'))
NECKLINE = [(371, 303), (382, 299), (395, 291), (408, 282), (418, 276)]
bride.append(f'<g clip-path="url(#clip-b-torso)"><path d="{smooth(NECKLINE + [(430, 270), (360, 270)])}" fill="url(#cp-skin-b)" />' + path(smooth([(375, 290), (380, 298)], closed=False), stroke='#6e3a22', stroke_width=2, opacity=0.3, fill='none') + '</g>')
bride.append(path(smooth(NECKLINE, closed=False), stroke='url(#cp-gold-band)', stroke_width=5, fill='none'))
bride.append(path(smooth([(386, 420), (408, 424), (431, 420)], closed=False), stroke='url(#cp-gold-band)', stroke_width=6, fill='none'))
bride.append(inner_rim('b-torso', 4, opacity=0.6))
# jewellery on the neck and chest: choker and rani haar
CHOKER = [(373, 263), (382, 269), (394, 273), (405, 271), (413, 265)]
bride.append(path(smooth(CHOKER, closed=False), stroke='url(#cp-gold-band)', stroke_width=7, fill='none', stroke_linecap='round'))
bride.append(path(smooth(CHOKER, closed=False), stroke='#c4243f', stroke_width=2.8, stroke_dasharray='0.1 5.4', stroke_linecap='round', fill='none'))
bride.append('<g fill="#fff6e2">' + ''.join(f'<circle cx="{x:.1f}" cy="{y + 4.6:.1f}" r="1.1" />' for x, y, _ in sample(CHOKER, 3.6)) + '</g>')
HAAR = [(411, 276), (404, 300), (394, 320), (382, 334), (373, 340)]
bride.append(path(smooth(HAAR, closed=False), stroke='#fbeec4', stroke_width=3.4, stroke_dasharray='0.1 5.2', stroke_linecap='round', fill='none'))
bride.append(path(smooth([(x - 3, y + 6) for x, y in HAAR], closed=False), stroke='url(#cp-gold-band)', stroke_width=2.2, stroke_dasharray='4 2', fill='none'))
bride.append('<path d="M372,340 C367,340 365,346 372,355 C379,346 377,340 372,340 Z" fill="url(#cp-jewel)" stroke="#f7dc94" stroke-width="1" />')
bride.append(faces.bride_jewels())
# veil over her head, in front of the hair
bride.append('<use href="#b-veil-cap" fill="url(#cp-veil-cap)" />')
# soft folds radiating from the crown where the net drapes over the head
bride.append('<g clip-path="url(#clip-b-veil-cap)" fill="none" stroke="#fff0e4" stroke-width="2.4" opacity="0.35" stroke-linecap="round" filter="url(#cp-blur1)">' + ''.join(
    path(smooth([(392 + 6 * k, 141), (388 + 9 * k, 156), (382 + 13 * k, 172)], closed=False)) for k in range(-3, 6)) + '</g>')
bride.append('<use href="#b-veil-cap" fill="url(#pat-sequin)" opacity="0.9" />')
bride.append(path(smooth(VEIL_EDGE[:8], closed=False), stroke='url(#cp-gold-band)', stroke_width=4, fill='none'))
# varmala, then her arm, sleeve, bangles and mehendi hand
bride.append(mala(B_MALA, 4.2))
bride.append('<use href="#b-arm" fill="url(#cp-skin-b)" />')
bride.append(shade('b-arm', 'cp-round-h-b'))
bride.append('<use href="#b-sleeve" fill="url(#cp-blouse)" /><use href="#b-sleeve" fill="url(#pat-brocade)" opacity="0.5" />')
bride.append(path('M397,350 L413,350', stroke='url(#cp-gold-band)', stroke_width=4.5, fill='none'))
# mehendi climbing the forearm: a vine with leaves and dots
vine = [(366, 417), (374, 413.5), (382, 409.5), (390, 404), (397, 396)]
bride.append('<g clip-path="url(#clip-b-arm)">' + path(smooth(vine, closed=False), stroke='#8a3414', stroke_width=0.7, fill='none', opacity=0.75)
             + ''.join(f'<path d="M{x:.1f},{y:.1f} q2,-3 4,-1 q-2,2 -4,1 Z" fill="#8a3414" opacity="0.7" transform="rotate({a:.0f} {x:.1f} {y:.1f})" />' for x, y, a in sample(vine, 5))
             + ''.join(f'<circle cx="{x + 2.5:.1f}" cy="{y + 3:.1f}" r="0.55" fill="#8a3414" opacity="0.7" />' for x, y, a in sample(vine, 3)) + '</g>')
# the chooda: red and ivory bangles from wrist to mid-forearm, gold kadas at each end
for i in range(13):
    t = i / 12
    top = (363 + 27 * t, 410.5 - 13 * t)
    bot = (365 + 32 * t, 425.5 - 15 * t)
    c = '#e7c06a' if i in (0, 12) else '#b3122c' if i % 2 else '#f2e6cc'
    w = 2.6 if i in (0, 12) else 2.0
    mid = ((top[0] + bot[0]) / 2 - 2.4, (top[1] + bot[1]) / 2)
    bride.append(f'<path d="M{top[0]:.1f},{top[1]:.1f} Q{mid[0]:.1f},{mid[1]:.1f} {bot[0]:.1f},{bot[1]:.1f}" stroke="{c}" stroke-width="{w}" fill="none" stroke-linecap="round" />')
    if c == '#b3122c':
        bride.append(f'<path d="M{top[0]:.1f},{top[1]:.1f} Q{mid[0]:.1f},{mid[1]:.1f} {bot[0]:.1f},{bot[1]:.1f}" stroke="#f3d68c" stroke-width="0.5" stroke-dasharray="0.1 2.2" stroke-linecap="round" fill="none" />')
bride.append(inner_rim('b-arm', 3.5, opacity=0.5))

RIM = '' if FLAT else '''  <!-- rim light: a warm glow around every backlit edge -->
  <g fill="none" stroke="#ffcf8a" stroke-width="6" opacity="0.75" filter="url(#cp-glow)">
    <use href="#g-tail" /><use href="#g-leg-b" /><use href="#g-leg-f" /><use href="#g-shoe-b" /><use href="#g-shoe-f" /><use href="#g-body" /><use href="#g-head" /><use href="#g-turban" /><use href="#g-kalgi" /><use href="#g-arm" />
    <use href="#b-skirt" /><use href="#b-torso" /><use href="#b-head" /><use href="#b-arm" />
  </g>'''

SVG = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 960" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
  <!-- Generated by tools/couple/build_couple.py — edit the contours and layers there, not here. -->
  <defs>
    <filter id="cp-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2" /></filter>
    <filter id="cp-blur1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.8" /></filter>
    <filter id="cp-blur4" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" /></filter>
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
    <linearGradient id="cp-skin-b" x1="0" y1="140" x2="0" y2="430" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#bd8660" /><stop offset="1" stop-color="#9a6444" /></linearGradient>
    <linearGradient id="cp-veil-cap" x1="0" y1="140" x2="0" y2="232" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffc9c4" stop-opacity="0.62" /><stop offset="1" stop-color="#f2a2ae" stop-opacity="0.5" /></linearGradient>
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

{RIM}

  <!-- the bride (behind the groom's reaching hand) -->
  <g>{''.join(bride)}</g>
  <!-- the groom -->
  <g>{''.join(groom)}</g>
</svg>
'''

if __name__ == '__main__':
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(SVG)
    print('wrote', os.path.relpath(OUT, ROOT), len(SVG) // 1024, 'KB')
