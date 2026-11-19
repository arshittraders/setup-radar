# loudness peaks from ebur128 momentary log -> top windows. usage: peaks.py ebur.log offset_sec n win
import re, sys
off, n, win = float(sys.argv[2]), int(sys.argv[3]), float(sys.argv[4])
pts = [(float(t), float(m)) for t, m in re.findall(r't:\s*([\d.]+).*?M:\s*(-?[\d.]+)', open(sys.argv[1]).read())]
# score = loudness over a 12s span vs. 2-min rolling median (reaction spikes)
import statistics
sc = []
for i, (t, m) in enumerate(pts):
    if i % 10: continue
    seg = [x for _, x in pts[max(0, i - 600):i + 600]]; med = statistics.median(seg) if seg else m
    peak = max(x for _, x in pts[i:i + 120]) if i + 120 < len(pts) else m
    sc.append((peak - med, t))
sc.sort(reverse=True); picked = []
for s, t in sc:
    if all(abs(t - p) > win * 2.5 for _, p in picked): picked.append((s, t))
    if len(picked) >= n: break
for s, t in sorted(picked, key=lambda x: x[1]):
    print(int(off + t - win * 0.55), round(s, 1))
