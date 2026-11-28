"""segs.py <voice.mp3> [n=5] → segs.json: the n spoken lines as [[start,end],...] from silence gaps (ffmpeg silencedetect)."""
import json, re, subprocess, sys
f = sys.argv[1]; n = int(sys.argv[2]) if len(sys.argv) > 2 else 5
log = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'silencedetect=noise=-35dB:d=0.3', '-f', 'null', '-'], capture_output=True, text=True).stderr
D = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).decode())
st = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', log)]; en = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', log)]
b, e = [0.0] + en, st + [D]
segs = [[round(a, 2), round(c, 2)] for a, c in zip(b, e) if c - a > 0.25]
while len(segs) > n:   # merge across the shortest gap (pauses inside a line)
    i = min(range(len(segs) - 1), key=lambda k: segs[k + 1][0] - segs[k][1]); segs[i:i + 2] = [[segs[i][0], segs[i + 1][1]]]
json.dump(segs, open('segs.json', 'w')); print('segs', segs, 'dur', round(D, 2))
