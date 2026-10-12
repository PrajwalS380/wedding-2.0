"""Spline and path helpers shared by the couple builders."""
import math

C = 'c'


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
