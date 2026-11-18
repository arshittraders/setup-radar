# ASMR bed for the morph video: soft pad + metallic clink + chain rattle on each landing.
# usage: python audio.py segs.json out.wav   (segs.json = [{"start":s,"dur":d,"faces":n}, ...])
import json, sys, numpy as np, wave
SR = 44100
segs = json.load(open(sys.argv[1])); total = sum(s['dur'] for s in segs)
N = int(SR * total); out = np.zeros(N)
rng = np.random.default_rng(7)
t = np.arange(N) / SR
# pad: two detuned soft sines with slow swell
for f, a in [(110, .05), (164.8, .035), (220.4, .02)]:
    out += a * np.sin(2 * np.pi * f * t) * (0.6 + 0.4 * np.sin(2 * np.pi * t / 7))
def add(sig, at):
    i = int(at * SR); j = min(N, i + len(sig)); out[i:j] += sig[:j - i]
def clink(freq, amp):
    d = np.arange(int(SR * 1.2)) / SR; s = np.zeros_like(d)
    for k, r in enumerate([1, 2.76, 5.40, 8.93]):
        s += np.sin(2 * np.pi * freq * r * d) * np.exp(-d * (6 + 4 * k)) / (k + 1)
    return amp * s
def rattle(dense, amp):
    d = np.arange(int(SR * 0.9)) / SR; s = np.zeros_like(d)
    n = int(20 + dense * 60)
    for _ in range(n):
        at = rng.uniform(0, 0.75) ** 1.6; f = rng.uniform(2500, 6500)
        k = np.arange(int(SR * 0.05)) / SR
        g = np.sin(2 * np.pi * f * k) * np.exp(-k * 90) * rng.uniform(.3, 1)
        i = int(at * SR); s[i:i + len(g)] += g[:len(s) - i]
    return amp * s / max(1, n ** .5) * 3
for i, sg in enumerate(segs):
    lv = min(1, np.log2(max(4, sg['faces'])) / 16)
    add(clink(520 + i * 40, .10), sg['start'] + 0.05)          # "next one" tick
    add(rattle(lv, .35), sg['start'] + 0.38)                     # mesh lands
    add(clink(1250 - i * 60, .12), sg['start'] + 0.40)
out /= max(1e-6, np.abs(out).max() / 0.85)
fade = int(SR * 1.2); out[-fade:] *= np.linspace(1, 0, fade)
pcm = (out * 32767).astype(np.int16)
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('audio', total, 's')
