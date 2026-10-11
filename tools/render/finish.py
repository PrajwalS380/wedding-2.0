"""Downsample a 2x studio render (Lanczos, i.e. supersampled anti-aliasing) and save it as WebP.

Usage: python finish.py <in.png> <out.webp> <width> <height> <alpha|opaque>
Garden shots also get a pre-blurred, lightened '-soft' variant for use behind cards.
"""
import os
import sys

from PIL import Image, ImageEnhance, ImageFilter

src, dst, w, h, mode = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
im = Image.open(src)
im = im.convert('RGBA' if mode == 'alpha' else 'RGB').resize((w, h), Image.LANCZOS)
# decorative cut-outs are shown small: store them at their final web size
WEB_SIZE = {'garland': (200, 1000), 'strand': (84, 1000), 'florals-a': (640, 640), 'florals-b': (640, 640), 'lotus': (600, 392), 'seal-tassels': (360, 415), 'lamp': (220, 619)}
key = os.path.basename(dst).rsplit('.', 1)[0]
if key in WEB_SIZE:
    im = im.resize(WEB_SIZE[key], Image.LANCZOS)
if mode == 'alpha':
    im.save(dst, 'WEBP', quality=80, method=6, alpha_quality=80)
else:
    im.save(dst, 'WEBP', quality=82, method=6)
print(f'  -> {os.path.relpath(dst)} {os.path.getsize(dst) // 1024} KB')

base = os.path.basename(dst)
if base.startswith('garden-') and mode == 'opaque':
    soft = im.resize((w // 2, h // 2), Image.LANCZOS).filter(ImageFilter.GaussianBlur(10))
    soft = ImageEnhance.Brightness(soft).enhance(1.08)
    soft = ImageEnhance.Color(soft).enhance(0.92)
    sdst = dst.replace('.webp', '-soft.webp')
    soft.save(sdst, 'WEBP', quality=78, method=6)
    print(f'  -> {os.path.relpath(sdst)} {os.path.getsize(sdst) // 1024} KB')
