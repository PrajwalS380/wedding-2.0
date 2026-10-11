"""A seamless handmade-paper texture for the site's ivory cards (public/site/parchment.webp).

Noise is shaped in the frequency domain, so every layer wraps perfectly at the tile edges:
broad mottling, a fine grain, and a few long fibres laid in the pulp.
Usage: python tools/render/parchment.py
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
N = 512
rng = np.random.default_rng(7)
fy = np.fft.fftfreq(N)[:, None]
fx = np.fft.fftfreq(N)[None, :]
f = np.sqrt(fx * fx + fy * fy)


def band(scale, power):
    noise = np.fft.fft2(rng.standard_normal((N, N)))
    shaped = noise * np.exp(-(f * scale) ** 2) * (f + 1e-3) ** -power
    out = np.real(np.fft.ifft2(shaped))
    return (out - out.mean()) / (out.std() + 1e-9)


mottle = band(28, 0.5)
cloud = band(9, 0.3)
grain = band(1.2, 0.0)
# fibres: anisotropic noise stretched along one axis, kept sparse
fib = np.fft.fft2(rng.standard_normal((N, N))) * np.exp(-((fx * 2.5) ** 2 + (fy * 60) ** 2) * 40)
fib = np.real(np.fft.ifft2(fib))
fib = np.clip((fib - fib.mean()) / fib.std() - 2.2, 0, None)

# mostly even paper: faint broad mottling, a soft cloud, fine grain, the odd fibre
shade = 0.35 * mottle + 0.25 * cloud + 0.18 * grain - 0.6 * fib
base = np.array([247, 237, 216], dtype=np.float64)
warm = np.array([236, 219, 186], dtype=np.float64)
t = np.clip(0.32 - 0.16 * shade, 0, 1)[..., None]
rgb = base * (1 - t) + warm * t
img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), 'RGB')
out = os.path.join(ROOT, 'public', 'site', 'parchment.webp')
img.save(out, 'WEBP', quality=90, method=6)
print('wrote', os.path.relpath(out, ROOT), os.path.getsize(out) // 1024, 'KB')
