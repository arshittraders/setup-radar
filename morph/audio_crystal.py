# ASMR for the crystal cut: knife crunch while cutting, clink when the slice lands, glitter tinkle.
# usage: python audio_crystal.py dur out.wav
import sys, numpy as np, wave
SR = 44100; D = float(sys.argv[1]); N = int(SR * D); out = np.zeros(N); rng = np.random.default_rng(3)
def add(sig, at):
    i = int(at * SR); j = min(N, i + len(sig))
    if i < N: out[i:j] += sig[:j - i]
def tick(f, dec, amp):
    k = np.arange(int(SR * 0.08)) / SR; return amp * np.sin(2 * np.pi * f * k) * np.exp(-k * dec)
def clink(freq, amp):
    d = np.arange(int(SR * 1.5)) / SR; s = np.zeros_like(d)
    for k, r in enumerate([1, 2.32, 4.25, 6.63]): s += np.sin(2 * np.pi * freq * r * d) * np.exp(-d * (3 + 3 * k)) / (k + 1)
    return amp * s
t = np.arange(N) / SR
out += 0.03 * np.sin(2 * np.pi * 98 * t) + 0.02 * np.sin(2 * np.pi * 147 * t)       # warm bed
F = 30.0
for i in range(int((125 - 40) / F * 900)):            # crunchy crystal cracking while the knife goes through
    at = 40 / F + rng.uniform(0, (125 - 40) / F); add(tick(rng.uniform(1800, 7000), rng.uniform(60, 160), rng.uniform(.05, .22)), at)
add(clink(880, .35), 165 / F); add(clink(1320, .2), 170 / F)
for i in range(500):                                  # glitter rain
    at = 140 / F + rng.uniform(0, 3.5) ** 1.3; add(tick(rng.uniform(5000, 11000), 120, rng.uniform(.02, .09)), at)
out /= max(1e-6, np.abs(out).max() / 0.85); fd = int(SR * 1.0); out[-fd:] *= np.linspace(1, 0, fd)
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes())
