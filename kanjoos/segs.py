"""segs.py <voice.mp3> [n=5] [script.json] → segs.json: the n spoken lines as [[start,end],...].
Cuts are chosen among the silence gaps (ffmpeg silencedetect) so each line's share of time best matches its share of
script text (Devanagari 'hi' or 'text', tags removed) — short pauses inside a line are not mistaken for line breaks."""
import itertools, json, re, subprocess, sys
f = sys.argv[1]; n = int(sys.argv[2]) if len(sys.argv) > 2 else 5; sp = sys.argv[3] if len(sys.argv) > 3 else None
log = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'silencedetect=noise=-35dB:d=0.2', '-f', 'null', '-'], capture_output=True, text=True).stderr
D = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).decode())
st = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', log)]; en = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', log)]
runs = [[a, c] for a, c in zip([0.0] + en, st + [D]) if c - a > 0.15]   # voiced stretches
gaps = list(range(len(runs) - 1))   # cut after run i
want = None
if sp:
    try:
        L = json.load(open(sp)); w = [len(re.sub(r'\[[^\]]*\]|[^\w]', '', x.get('hi') or x.get('text') or '')) for x in L][:n]
        if len(w) == n and sum(w): want = [x / sum(w) for x in w]
    except Exception as e:
        print('script ignored:', e)
best, bs = None, 1e9
for cuts in itertools.combinations(gaps, n - 1) if len(runs) >= n else []:
    b = [-1] + list(cuts) + [len(runs) - 1]; segs = [[runs[b[k] + 1][0], runs[b[k + 1]][1]] for k in range(n)]
    tot = sum(e - s for s, e in segs)
    fit = sum(abs((e - s) / tot - want[k]) for k, (s, e) in enumerate(segs)) if want else 0
    gap = sum(runs[c + 1][0] - runs[c][1] for c in cuts)
    score = fit * 10 - gap   # match the text shares first, prefer longer pauses
    if score < bs: bs, best = score, segs
segs = [[round(s, 2), round(e, 2)] for s, e in (best or [[r[0], r[1]] for r in runs])]
json.dump(segs, open('segs.json', 'w')); print('segs', segs, 'dur', round(D, 2), 'runs', len(runs))
