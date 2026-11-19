# Best moments from chat hype + loudness. Output lines: "<clip_start_sec> <score> <why>" (same first 2 cols as peaks.py)
# usage: smartpeaks.py ebur.log chat.json offset n win [mode=combined|chat|audio]
import json, re, statistics, sys
LOG, CHAT, off, n, win = sys.argv[1], sys.argv[2], float(sys.argv[3]), int(sys.argv[4]), float(sys.argv[5])
mode = sys.argv[6] if len(sys.argv) > 6 else "combined"
CHAT_LAG = 7.0   # viewers type a few seconds after the moment happens

def loud_curve():   # absolute sec -> (peak loudness over next 12s) - (2 min median)
    try: pts = [(float(t), float(m)) for t, m in re.findall(r't:\s*([\d.]+).*?M:\s*(-?[\d.]+)', open(LOG).read())]
    except Exception: return {}
    out = {}
    for i, (t, m) in enumerate(pts):
        if i % 10: continue
        seg = [x for _, x in pts[max(0, i - 600):i + 600]]; med = statistics.median(seg) if seg else m
        peak = max(x for _, x in pts[i:i + 120]) if i + 120 < len(pts) else m
        out[int(off + t)] = peak - med
    return out

def chat_curve():   # absolute sec (moment, lag-corrected) -> hype ratio vs rolling median
    try: S = json.load(open(CHAT))["samples"]
    except Exception: return {}
    if sum(1 for s in S if s[1] > 0) < 20: return {}
    rates = [s[1] for s in S]; out = {}
    for i, (t, r, re_) in enumerate(S):
        w = rates[max(0, i - 40):i + 40]; med = statistics.median(w) or 0.1
        nxt = S[i:i + 3]   # ~25s of chat after the moment
        hype = max(x[1] for x in nxt) / med
        react = max(x[2] for x in nxt)
        out[int(t - CHAT_LAG)] = hype * (0.6 + react)
    return out

def norm(d):
    if not d: return {}
    v = sorted(d.values()); lo, hi = v[len(v) // 10], v[-1]
    return {k: max(0.0, (x - lo) / ((hi - lo) or 1)) for k, x in d.items()}

L, C = norm(loud_curve()), norm(chat_curve())
if mode == "audio" or not C: C = {}; src = "audio"
elif mode == "chat" or not L: L = {}; src = "chat"
else: src = "chat+audio"
near = lambda d, t, r: max([v for k, v in d.items() if abs(k - t) <= r] or [0.0])
times = sorted(set(L) | set(C))
sc = []
for t in times[::1]:
    c, l = near(C, t, 6), near(L, t, 6)
    s = (c + 0.6 * l) if src == "chat+audio" else (c or l)
    sc.append((s, t, c, l))
sc.sort(reverse=True); picked = []
for s, t, c, l in sc:
    if all(abs(t - p[1]) > win * 2.5 for p in picked): picked.append((s, t, c, l))
    if len(picked) >= n: break
print(f"# source={src} chat_points={len(C)} audio_points={len(L)}", file=sys.stderr)
for s, t, c, l in sorted(picked, key=lambda x: x[1]):
    print(int(max(0, t - win * 0.45)), round(s, 2), f"chat={c:.2f},loud={l:.2f}")
