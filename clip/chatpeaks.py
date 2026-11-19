# Twitch rechat json -> busiest 40s windows (chat spikes = best moments)
import json, sys, collections
d = json.load(open(sys.argv[1])); dur = float(sys.argv[2])
cm = d.get('comments') or d if isinstance(d, list) else d.get('comments', [])
ts = []
for c in cm:
    t = c.get('content_offset_seconds') or c.get('contentOffsetSeconds')
    if t is None and 'offset' in c: t = c['offset']
    if t is not None: ts.append(float(t))
print('messages', len(ts))
B = 20; cnt = collections.Counter(int(t // B) for t in ts)
base = sorted(cnt.values())[len(cnt) // 2] if cnt else 1
win = sorted(((cnt[b] + cnt[b + 1], b) for b in cnt), reverse=True)
picked = []
for v, b in win:
    if all(abs(b - p) > 6 for _, p in picked): picked.append((v, b))
    if len(picked) >= 30: break
for v, b in sorted(picked, key=lambda x: x[1]):
    s = b * B; print(f"{int(s//3600)}:{int(s%3600//60):02d}:{int(s%60):02d}  msgs={v}  x{v/(2*base):.1f}")
