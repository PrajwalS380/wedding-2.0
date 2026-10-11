"""
Shubh Aagman ("an auspicious arrival") — an original instrumental for
Darshan & Vathsala's Website 2.0 invitation.

Composed and synthesised entirely by this script (no samples, no recordings),
so the resulting audio is original to this project and free to use on the site.

Raga Yaman (S R G M# P D N), the romantic evening raga of North Indian weddings;
Sa = C#4, 76 bpm, keherwa taal (8 beats).

    0:00  temple bell, tanpura drone and a string pad swell
    0:08  shehnai alaap: slow phrases with meend (glides) over the drone
    0:38  santoor and dholak enter; shehnai melody A
    1:13  melody B climbs to the upper Sa
    1:44  melody A returns, strings fuller
    2:12  coda: the shehnai settles on Sa, the drone fades for a seamless loop

Usage:  python tools/music/compose.py  ->  public/audio/shubh-aagman.mp3
Needs:  numpy, scipy, lameenc
"""
from __future__ import annotations

import os
import sys

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
BPM = 76.0
BEAT = 60.0 / BPM
TOTAL = 152.0
SA = 277.18  # C#4
rng = np.random.default_rng(1511202616)

# Yaman in just intonation (semitones from Sa -> ratio)
RATIO = {0: 1.0, 2: 9 / 8, 4: 5 / 4, 6: 45 / 32, 7: 3 / 2, 9: 5 / 3, 11: 15 / 8}


def hz(semi: float) -> float:
    octave, deg = divmod(int(round(semi)), 12)
    return SA * RATIO[deg] * 2.0 ** octave


N = int(TOTAL * SR)
L = np.zeros(N)
R = np.zeros(N)


def place(sig: np.ndarray, start: float, gain: float = 1.0, pan: float = 0.0) -> None:
    i = int(start * SR)
    if i < 0:
        sig, i = sig[-i:], 0
    if i >= N:
        return
    sig = sig[: N - i] * gain
    a = (pan + 1) * np.pi / 4
    L[i : i + len(sig)] += sig * np.cos(a)
    R[i : i + len(sig)] += sig * np.sin(a)


def env(n: int, attack: float, release: float) -> np.ndarray:
    e = np.ones(n)
    a = min(n, int(attack * SR))
    r = min(n - a, int(release * SR))
    if a:
        e[:a] = np.linspace(0, 1, a) ** 1.5
    if r:
        e[n - r :] *= np.linspace(1, 0, r) ** 1.2
    return e


def lowpass(x: np.ndarray, f: float, order: int = 2) -> np.ndarray:
    return sosfilt(butter(order, f / (SR / 2), 'low', output='sos'), x)


def bandpass(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    return sosfilt(butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band', output='sos'), x)


# ------------------------------------------------------------------ instruments
def tanpura(f: float, dur: float = 4.6) -> np.ndarray:
    """A plucked tanpura string: rich harmonics that shimmer and swap (jawari)."""
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for k in range(1, 24):
        amp = k ** -0.85
        shimmer = 0.55 + 0.45 * np.sin(2 * np.pi * (0.22 + 0.07 * k) * t + rng.uniform(0, 6.28)) * np.exp(-t / (1.2 + 0.08 * k))
        out += amp * shimmer * np.sin(2 * np.pi * f * k * (1 + 0.0004 * rng.standard_normal()) * t)
    return out * np.exp(-t / 2.6) * env(len(t), 0.004, 0.6)


def bell(f: float = 880.0, dur: float = 6.0) -> np.ndarray:
    """A brass temple bell: inharmonic partials, each decaying at its own rate."""
    t = np.arange(int(dur * SR)) / SR
    parts = [(1.0, 1.0, 3.2), (2.32, 0.6, 2.1), (4.25, 0.35, 1.3), (6.63, 0.22, 0.8), (8.9, 0.12, 0.5), (0.5, 0.25, 4.0)]
    out = sum(a * np.sin(2 * np.pi * f * r * t + rng.uniform(0, 6)) * np.exp(-t / d) * (1 + 0.15 * np.sin(2 * np.pi * 2.3 * t)) for r, a, d in parts)
    return out * env(len(t), 0.002, 0.8)


def santoor(f: float, dur: float = 2.6, bright: float = 1.0) -> np.ndarray:
    """A hammered string course: two slightly detuned Karplus-Strong strings."""
    n = int(dur * SR)
    out = np.zeros(n)
    for detune in (1.0, 1.0018):
        period = int(SR / (f * detune))
        buf = rng.uniform(-1, 1, period)
        buf = lowpass(buf, 6000 * bright) if period > 8 else buf
        y = np.zeros(n)
        y[:period] = buf
        decay = 0.4985
        for i in range(period, n):
            y[i] = decay * (y[i - period] + y[i - period + 1 if i - period + 1 < i else i - period])
        out += y
    return out * env(n, 0.001, 0.4) * 0.6


def shehnai_phrase(notes: list[tuple[float, float]], start_gap: float = 0.0, vib: float = 1.0) -> np.ndarray:
    """
    A legato shehnai line. `notes` are (semitone, beats); pitch glides between notes
    (meend), vibrato blooms on held notes, and the reed's nasal colour comes from
    emphasising the harmonics near two formants.
    """
    durs = [b * BEAT for _, b in notes]
    total = sum(durs) + 0.4
    n = int(total * SR)
    t = np.arange(n) / SR
    target = np.zeros(n)
    pos = 0
    onsets = []
    for (semi, _), d in zip(notes, durs):
        k = int(d * SR)
        target[pos : pos + k] = np.log2(hz(semi))
        onsets.append(pos)
        pos += k
    target[pos:] = target[pos - 1]
    # glide toward each new note (one-pole smoothing on log pitch = meend)
    smooth = np.copy(target)
    a = np.exp(-1 / (0.045 * SR))
    for i in range(1, n):
        smooth[i] = a * smooth[i - 1] + (1 - a) * target[i]
    # vibrato that grows on longer notes
    since = np.zeros(n)
    for o in onsets:
        since[o:] = np.arange(n - o) / SR
    depth = vib * 0.006 * np.clip((since - 0.25) / 0.6, 0, 1)
    pitch = 2 ** smooth * (1 + depth * np.sin(2 * np.pi * 5.6 * t + 0.3 * np.sin(2 * np.pi * 0.7 * t)))
    phase = 2 * np.pi * np.cumsum(pitch) / SR
    out = np.zeros(n)
    f0 = float(np.median(pitch))
    for k in range(1, 16):
        fk = f0 * k
        formant = 1.0 + 1.6 * np.exp(-((fk - 1150) / 420) ** 2) + 0.9 * np.exp(-((fk - 2650) / 600) ** 2)
        out += (k ** -0.7) * formant * np.sin(k * phase)
    breath = bandpass(rng.standard_normal(n), 1800, 5200) * 0.04
    # gentle tonguing at each note start and a phrase envelope
    accent = np.ones(n)
    for o in onsets[1:]:
        w = min(int(0.05 * SR), n - o)
        accent[o : o + w] *= 0.82 + 0.18 * np.linspace(0, 1, w)
    sig = (out + breath) * accent * env(n, 0.09, 0.35)
    return lowpass(sig, 5200)


def strings_pad(chord: list[float], dur: float) -> np.ndarray:
    """A soft bowed-string pad: detuned saws, lowpassed, slow swell."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for semi in chord:
        f = hz(semi)
        for d in (-0.004, 0.0, 0.0045):
            ph = 2 * np.pi * f * (1 + d) * t + rng.uniform(0, 6)
            out += sum(np.sin(k * ph) / k for k in range(1, 9))
    return lowpass(out, 1400) * env(n, 2.2, 2.4) / (len(chord) * 3)


def dholak(kind: str) -> np.ndarray:
    """dha (bass membrane), na (bright rim), ti (light tap)."""
    if kind == 'dha':
        dur = 0.5
        t = np.arange(int(dur * SR)) / SR
        f = 70 + 60 * np.exp(-t / 0.05)
        body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
        top = np.sin(2 * np.pi * 410 * t) * np.exp(-t / 0.09) * 0.5
        click = bandpass(rng.standard_normal(len(t)), 1500, 5000) * np.exp(-t / 0.006) * 0.4
        return body + top + click
    dur = 0.22
    t = np.arange(int(dur * SR)) / SR
    f = 620 if kind == 'na' else 880
    tone = np.sin(2 * np.pi * f * t) * np.exp(-t / (0.06 if kind == 'na' else 0.035))
    click = bandpass(rng.standard_normal(len(t)), 2500, 7000) * np.exp(-t / 0.004) * 0.5
    return (tone + click) * (0.8 if kind == 'na' else 0.45)


# ------------------------------------------------------------------ the score
S, Re, G, Mt, P, D, Ni = 0, 2, 4, 6, 7, 9, 11
s_ = lambda x: x - 12  # lower octave
S2, Re2, G2 = 12, 14, 16

# tanpura: P S' S' S, every 2.6 s, through the whole piece (fading at the ends)
t0 = 0.4
while t0 < TOTAL - 3:
    for i, semi in enumerate((s_(P), S, S, s_(S))):
        place(tanpura(hz(semi)), t0 + i * 0.62, 0.16, pan=-0.35 + 0.23 * i)
    t0 += 2.6

place(bell(1244.5, 7), 0.15, 0.22, pan=0.25)
place(bell(830.6, 7), 1.6, 0.14, pan=-0.3)
place(strings_pad([s_(S), s_(P), S, G], 12.0), 0.0, 0.5)

# alaap (free rhythm)
alaap = [
    [(s_(Ni), 1.0), (Re, 1.5), (S, 3.0)],
    [(s_(Ni), 0.8), (s_(D), 0.8), (s_(Ni), 1.0), (Re, 1.2), (G, 2.5), (Re, 0.8), (S, 2.5)],
    [(G, 1.0), (Mt, 1.0), (P, 2.2), (Mt, 0.8), (G, 1.0), (Re, 1.0), (G, 1.6), (Re, 0.8), (S, 3.2)],
]
t = 8.0
for ph in alaap:
    sig = shehnai_phrase(ph, vib=1.2)
    place(sig, t, 0.33, pan=0.05)
    t += len(sig) / SR + 1.4

# rhythmic section: santoor, dholak (keherwa), melody
sec = 38.0
bars = int((TOTAL - 14 - sec) / (8 * BEAT))
keherwa = ['dha', 'ti', 'na', 'ti', 'na', 'ti', 'dha', 'na']
for b in range(bars):
    for k, stroke in enumerate(keherwa):
        tt = sec + (b * 8 + k) * BEAT + rng.normal(0, 0.006)
        place(dholak(stroke), tt, 0.3 if stroke == 'dha' else 0.22, pan=-0.1)
        if k % 2 == 1:
            place(dholak('ti'), tt + BEAT / 2, 0.08, pan=-0.1)

# santoor: rolling arpeggios on the chord tones of each bar
progression = [[S, G, P, S2], [Re, Mt, D, Re2], [s_(Ni), Re, Mt, P], [S, G, P, G2]]
for b in range(bars):
    chord = progression[b % 4]
    for k in range(8):
        tt = sec + (b * 8 + k) * BEAT
        note = chord[(k * 3 + b) % 4]
        place(santoor(hz(note), 1.8), tt, 0.13, pan=0.4)
        if k in (0, 4):
            place(santoor(hz(note - 12), 2.2, 0.7), tt + BEAT * 0.5, 0.08, pan=0.45)

A = [(s_(Ni), 1), (Re, 1), (G, 2), (Re, 1), (G, 1), (Mt, 1), (P, 3), (Mt, 1), (G, 1), (Re, 1), (S, 2), (s_(Ni), 1), (Re, 1), (S, 4)]
B = [(G, 1), (Mt, 1), (D, 2), (Ni, 2), (S2, 3), (Ni, 1), (D, 1), (P, 1), (Mt, 1), (G, 1), (Mt, 1), (D, 1), (Ni, 2), (Re2, 2), (S2, 4), (Ni, 1), (D, 1), (P, 2), (Mt, 1), (G, 1), (Re, 2), (S, 4)]
melody_starts = [(sec + 8 * BEAT, A, 0.36), (sec + 26 * BEAT, A, 0.36), (73.0, B, 0.38), (104.0, A, 0.38), (104.0 + 18 * BEAT, A, 0.36)]
for start, line, g in melody_starts:
    place(shehnai_phrase(line), start, g, pan=0.05)

for i, chord in enumerate([[s_(S), s_(P), S, G], [s_(D), Re, Mt, D], [s_(S), s_(P), S, G]]):
    place(strings_pad(chord, 16.0), 98.0 + i * 12.0, 0.45)

# coda
coda = 133.5
place(shehnai_phrase([(G, 1), (Re, 1), (s_(Ni), 1), (Re, 1.5), (S, 6)], vib=1.3), coda, 0.34)
place(bell(1244.5, 8), coda + 7.2, 0.18, pan=-0.2)
place(strings_pad([s_(S), s_(P), S, G], 16.0), coda - 2.0, 0.42)

# ------------------------------------------------------------------ space and master
def reverb_ir(seconds: float, seed: int) -> np.ndarray:
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-t / (seconds / 5.5))
    ir = lowpass(ir, 6500)
    ir[: int(0.012 * SR)] = 0
    return ir / np.sqrt(np.sum(ir ** 2))


wetL = fftconvolve(L, reverb_ir(2.4, 1))[:N]
wetR = fftconvolve(R, reverb_ir(2.4, 2))[:N]
outL = L * 0.82 + wetL * 0.42
outR = R * 0.82 + wetR * 0.42
# a gentle high shelf of air and low cut
outL = sosfilt(butter(2, 40 / (SR / 2), 'high', output='sos'), outL)
outR = sosfilt(butter(2, 40 / (SR / 2), 'high', output='sos'), outR)
# fade in/out for a seamless loop (both ends rest on the drone)
fade = env(N, 1.5, 4.0)
outL *= fade
outR *= fade
peak = max(np.max(np.abs(outL)), np.max(np.abs(outR)))
rms = np.sqrt(np.mean(np.concatenate([outL, outR]) ** 2))
gain = min(0.89 / peak, 10 ** (-18 / 20) / rms)
outL *= gain
outR *= gain
print(f'peak {20 * np.log10(peak * gain):.1f} dBFS, rms {20 * np.log10(rms * gain):.1f} dBFS')

pcm = np.empty(2 * N, dtype=np.int16)
pcm[0::2] = np.clip(outL * 32767, -32768, 32767).astype(np.int16)
pcm[1::2] = np.clip(outR * 32767, -32768, 32767).astype(np.int16)

root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
out_dir = os.path.join(root, 'public', 'audio')
os.makedirs(out_dir, exist_ok=True)
if '--wav' in sys.argv:
    import wave

    with wave.open(os.path.join(root, 'tools', 'out', 'shubh-aagman.wav'), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())

import lameenc  # noqa: E402

enc = lameenc.Encoder()
enc.set_bit_rate(128)
enc.set_in_sample_rate(SR)
enc.set_channels(2)
enc.set_quality(2)
mp3 = enc.encode(pcm.tobytes()) + enc.flush()
path = os.path.join(out_dir, 'shubh-aagman.mp3')
with open(path, 'wb') as fh:
    fh.write(mp3)
print(f'wrote {os.path.relpath(path, root)} ({len(mp3) / 1024:.0f} KB)')
np.save(os.path.join(root, 'tools', 'out', 'mix-preview.npy'), np.stack([outL[:: SR // 200], outR[:: SR // 200]]))
