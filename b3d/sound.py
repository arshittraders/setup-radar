"""All sound made in code (no samples): knife whoosh + chop + board knock per vertical cut, a slicing scrape for
horizontal cuts, a counter pop that rises in pitch, a soft lo-fi bed, and a sparkle for the final count.
usage: python3 b3d/sound.py <params.json> <out.wav>"""
import json, sys, wave
import numpy as np

P = json.load(open(sys.argv[1])); SR = 44100; N = int(P['dur'] * SR) + SR
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(P['seed'])


def add(t, sig, pan=0.0, g=1.0):
    i = int(t * SR)
    if i >= N or i + len(sig) <= 0:
        return
    j = min(N, i + len(sig)); s = sig[:j - i] * g
    L[i:j] += s * (1 - max(0, pan)); R[i:j] += s * (1 + min(0, pan))


def env(n, a, d):
    x = np.arange(n) / SR
    return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / d)


def bandnoise(n, lo, hi):
    sp = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    sp[(f < lo) | (f > hi)] = 0
    x = np.fft.irfft(sp, n); return x / (np.abs(x).max() + 1e-9)


def tone(f, n, decay, a=0.002):
    x = np.arange(n) / SR; return np.sin(2 * np.pi * f * x) * env(n, a, decay)


def chop():
    n = int(0.45 * SR)
    thud = np.sin(2 * np.pi * (70 + 110 * np.exp(-np.arange(n) / SR * 35)) * np.arange(n) / SR) * env(n, 0.001, 0.09)
    crisp = bandnoise(n, 2500, 9000) * env(n, 0.0005, 0.018)
    knock = tone(210, n, 0.05) * 0.5 + tone(530, n, 0.03) * 0.25
    return 0.9 * thud + 0.55 * crisp + 0.5 * knock


def whoosh(dur):
    n = int(dur * SR); x = np.linspace(0, 1, n)
    return bandnoise(n, 400, 3000) * np.sin(np.pi * x) ** 2


def scrape(dur):
    n = int(dur * SR); x = np.linspace(0, 1, n)
    s = bandnoise(n, 1800, 7000) * (0.5 + 0.5 * np.sin(2 * np.pi * 38 * x * dur))
    return s * np.sin(np.pi * x) ** 0.7


def pop(f):
    n = int(0.25 * SR); x = np.arange(n) / SR
    return np.sin(2 * np.pi * f * x * (1 + 0.6 * np.exp(-x * 40))) * env(n, 0.001, 0.06)


# soft lo-fi bed: 4-chord pad + gentle kick/hat at 86 bpm (very quiet under the ASMR)
bpm = 86; beat = 60 / bpm; key = 48 + int(rng.integers(0, 7))
prog = [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]]
bar = beat * 4; t = 0.0; b = 0
while t < P['dur']:
    n = int(bar * SR) + 1; x = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * 440 * 2 ** ((key + iv - 69) / 12) * x) for iv in prog[b % 4])
    pad *= np.minimum(1, x / 0.4) * np.minimum(1, (bar - x) / 0.5)
    add(t, pad, 0, 0.018)
    for q in range(4):
        tk = t + q * beat
        if q % 2 == 0:
            kn = int(0.2 * SR); xx = np.arange(kn) / SR; add(tk, np.sin(2 * np.pi * (45 + 60 * np.exp(-xx * 30)) * xx) * env(kn, 0.001, 0.08), 0, 0.12)
        add(tk + beat / 2, bandnoise(int(0.04 * SR), 6000, 12000) * env(int(0.04 * SR), 0.0005, 0.01), 0.2, 0.05)
    t += bar; b += 1

for e in P['events']:
    t = e['t']
    if e['axis'] == 'z':
        add(t - 0.3, scrape(0.34), -0.2, 0.32)
        add(t, tone(1400, int(0.08 * SR), 0.02), 0.2, 0.08)
    else:
        add(t - 0.17, whoosh(0.18), 0.3, 0.22)
        add(t, chop(), 0, 0.8)
    add(t + 0.22, tone(900 + 40 * e['i'], int(0.05 * SR), 0.012), rng.uniform(-0.5, 0.5), 0.06)   # pieces settle
    add(t + 0.03, pop(520 * 2 ** (min(e['i'], 24) / 24)), 0, 0.12)   # counter tick, rising
TR = P['t_reveal']
for k, f in enumerate([784, 988, 1175, 1568]):
    add(TR + k * 0.09, tone(f, int(1.2 * SR), 0.35) * 0.6, (k - 1.5) / 3, 0.25)
add(TR, whoosh(0.6), 0, 0.2)

mix = np.stack([L, R], 1)[:int(P['dur'] * SR)]
rms = np.sqrt((mix ** 2).mean()) + 1e-9
mix = np.tanh(mix * (0.16 / rms) * 1.1) * 0.95   # ≈ -16 LUFS with a soft limiter
fade = int(0.8 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('sound ok', sys.argv[2])
