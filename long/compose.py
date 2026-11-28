"""Compose one 8–10 min 16:9 episode from rendered portrait chapters (ballsim/render.js with ENDCARD=0 MUSIC=0 HOOK=0).
usage: python3 long/compose.py <plan.json> <chapters_dir> <out_dir> <brand>
Out: out.mp4 (1920x1080), thumb.jpg, chapters.txt (YouTube chapter list), meta.json
Layout like the long "satisfying simulations" compilations: simulation in a centre panel, left = "03 — rule text"
(CAPS words red), right = UP NEXT, top = series/episode, bottom = progress bar. One music bed made in code."""
import json, os, re, subprocess, sys, wave
import numpy as np

plan = json.load(open(sys.argv[1])); CH, OUT, BRAND = sys.argv[2], sys.argv[3], sys.argv[4].upper()
os.makedirs(OUT, exist_ok=True)
TMP = os.path.join(OUT, 'tmp'); os.makedirs(TMP, exist_ok=True)
INTRO, OUTRO, MIN_T, MAX_T = 4.0, 10.0, float(os.environ.get('LONG_MIN', 480)), 10 * 60
FONT = 'DejaVu Sans'


def sh(*a):
    subprocess.run(a, check=True)


def dur(p):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).decode().strip())


# ---- pick chapters (in order) to land between 8 and 10 minutes ----
have = []
for c in plan['chapters']:
    p = os.path.join(CH, f"ch_{c['i']}.mp4")
    if os.path.exists(p):
        have.append({**c, 'src': p, 'dur': dur(p)})
use, tot = [], INTRO + OUTRO
for c in have:
    if tot + c['dur'] > MAX_T and tot >= MIN_T:
        break
    if tot + c['dur'] > MAX_T:
        continue
    use.append(c); tot += c['dur']
seen = {}
for c in use:   # "Round 2" only when round 1 is really in this episode (a chapter can be skipped)
    seen[c['format']] = seen.get(c['format'], 0) + 1
    c['short'] = c['short'].split(' (Round')[0] + (f" (Round {seen[c['format']]})" if seen[c['format']] > 1 else '')
print(f'{len(use)}/{len(have)} chapters, {tot / 60:.1f} min')
if len(use) < int(os.environ.get('LONG_MINCH', 6)):
    sys.exit('too few chapters rendered')

# ---- segments: portrait clip in a 1920x1080 frame (thin frame line), soft fades ----
segs = []
for k, c in enumerate(use):
    d = c['dur']; o = os.path.join(TMP, f'seg_{k}.mp4')
    sh('ffmpeg', '-y', '-v', 'error', '-i', c['src'], '-filter_complex',
       f"color=c=0x07070b:s=1920x1080:r=30:d={d:.3f},drawbox=x=653:y=0:w=614:h=1080:color=white@0.10:t=3[bg];"
       f"[0:v]scale=608:1080,setsar=1,fps=30[c];[bg][c]overlay=656:0:shortest=1,fade=t=in:st=0:d=0.3,fade=t=out:st={max(0, d - 0.3):.3f}:d=0.3,format=yuv420p[v];"
       f"[0:a]aresample=44100,aformat=channel_layouts=stereo,afade=t=in:st=0:d=0.2,afade=t=out:st={max(0, d - 0.3):.3f}:d=0.3[a]",
       '-map', '[v]', '-map', '[a]', '-t', f'{d:.3f}', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', o)
    segs.append(o)


def card(src, at, length, o):
    fr = os.path.join(TMP, os.path.basename(o) + '.png')
    sh('ffmpeg', '-y', '-v', 'error', '-ss', f'{at:.2f}', '-i', src, '-frames:v', '1', fr)
    sh('ffmpeg', '-y', '-v', 'error', '-loop', '1', '-t', f'{length}', '-i', fr, '-f', 'lavfi', '-t', f'{length}', '-i', 'anullsrc=r=44100:cl=stereo',
       '-filter_complex', '[0:v]scale=1920:-2,crop=1920:1080,boxblur=24:2,eq=brightness=-0.32:saturation=1.2,fps=30,format=yuv420p,fade=t=in:st=0:d=0.4[v]',
       '-map', '[v]', '-map', '1:a', '-t', f'{length}', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', o)


card(use[0]['src'], min(12, use[0]['dur'] * 0.6), INTRO, os.path.join(TMP, 'intro.mp4'))
card(use[-1]['src'], use[-1]['dur'] - 0.5, OUTRO, os.path.join(TMP, 'outro.mp4'))
parts = [os.path.join(TMP, 'intro.mp4')] + segs + [os.path.join(TMP, 'outro.mp4')]
with open(os.path.join(TMP, 'list.txt'), 'w') as f:
    f.write(''.join(f"file '{os.path.abspath(p)}'\n" for p in parts))
body = os.path.join(TMP, 'body.mp4')
sh('ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', os.path.join(TMP, 'list.txt'), '-c', 'copy', body)
TOTAL = dur(body)

# ---- timeline ----
t = INTRO; marks = []
for c in use:
    marks.append((t, t + c['dur'], c)); t += c['dur']
T_OUT = t


def ts(x):
    x = max(0.0, x); return f'{int(x // 3600)}:{int(x % 3600 // 60):02d}:{x % 60:05.2f}'


def mmss(x):
    x = int(x); return f'{x // 60}:{x % 60:02d}'


def wrap(s, n):
    out, cur = [], ''
    for w in s.split():
        if cur and len(cur) + 1 + len(w) > n:
            out.append(cur); cur = w
        else:
            cur = (cur + ' ' + w).strip()
    return out + ([cur] if cur else [])


RED, WHITE, GREY = r'\c&H3B3BFF&', r'\c&HFFFFFF&', r'\c&HA0A0A0&'


def redcaps(line):   # CAPS words (2+ letters) → red
    return re.sub(r'\b([A-Z][A-Z0-9,]{1,}[A-Z0-9]?)\b', lambda m: '{' + RED + '}' + m.group(1) + '{' + WHITE + '}', line)


EP, N = plan['episode'], len(use)
ev = []
ev.append(f"Dialogue: 2,{ts(0.2)},{ts(INTRO)},C,,0,0,0,,{{\\an5\\pos(960,430)\\fad(300,250)\\fs86}}SATISFYING PHYSICS{{\\fs86}}\\NSIMULATIONS")
ev.append(f"Dialogue: 2,{ts(0.5)},{ts(INTRO)},C,,0,0,0,,{{\\an5\\pos(960,640)\\fad(300,250)\\fs60{RED}}}EPISODE {EP}")
ev.append(f"Dialogue: 2,{ts(0.9)},{ts(INTRO)},C,,0,0,0,,{{\\an5\\pos(960,740)\\fad(300,250)\\fs34{GREY}}}{N} ANIMATIONS  ·  WATCH TILL THE END")
for k, (a, b, c) in enumerate(marks):
    lines = wrap(c['line1'], 19) + wrap(c['line2'], 19)
    txt = '\\N'.join(redcaps(l) for l in lines)
    ev.append(f"Dialogue: 1,{ts(a + 0.15)},{ts(b - 0.1)},L,,0,0,0,,{{\\an4\\pos(70,540)\\fad(250,200)}}{{\\fs30{RED}}}{k + 1:02d} —\\N{{\\fs48{WHITE}}}{txt}")
    nxt = marks[k + 1][2]['short'] if k + 1 < len(marks) else f'EPISODE {EP + 1}  ·  {plan["next"]}'
    ev.append(f"Dialogue: 1,{ts(a + 0.15)},{ts(b - 0.1)},R,,0,0,0,,{{\\an6\\pos(1850,540)\\fad(250,200)}}{{\\fs24{GREY}}}UP NEXT\\N{{\\fs34{WHITE}}}" + '\\N'.join(wrap(nxt.upper(), 16)))
    ev.append(f"Dialogue: 1,{ts(a)},{ts(b)},S,,0,0,0,,{{\\an9\\pos(1860,40){GREY}}}{k + 1:02d} / {N:02d}")
ev.append(f"Dialogue: 1,{ts(INTRO)},{ts(T_OUT)},S,,0,0,0,,{{\\an7\\pos(60,40){GREY}}}{BRAND}  ·  EPISODE {EP}")
ev.append(f"Dialogue: 2,{ts(T_OUT + 0.3)},{ts(TOTAL)},C,,0,0,0,,{{\\an5\\pos(960,420)\\fad(400,0)\\fs70}}THANKS FOR WATCHING")
ev.append(f"Dialogue: 2,{ts(T_OUT + 0.8)},{ts(TOTAL)},C,,0,0,0,,{{\\an5\\pos(960,560)\\fad(400,0)\\fs50{RED}}}NEXT EPISODE  ·  {plan['next']}")
ev.append(f"Dialogue: 2,{ts(T_OUT + 1.3)},{ts(TOTAL)},C,,0,0,0,,{{\\an5\\pos(960,680)\\fad(400,0)\\fs36{GREY}}}SUBSCRIBE SO YOU DON'T MISS IT")
ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: L,{FONT},48,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,4,0,0,0,1
Style: R,{FONT},34,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,6,0,0,0,1
Style: S,{FONT},24,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,1,0,1,0,0,7,0,0,0,1
Style: C,{FONT},80,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,1,0,1,3,2,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""" + '\n'.join(ev) + '\n'
open(os.path.join(TMP, 'o.ass'), 'w').write(ass)

# ---- music bed (code-made, calm lo-fi; changes chords every section) ----
SR = 44100; NS = int(TOTAL * SR) + SR; bed = np.zeros((NS, 2))
rng = np.random.default_rng(plan['seed']); key = 45 + int(rng.integers(0, 7)); bpm = 78 + int(rng.integers(0, 10)); beat = 60 / bpm
PROGS = [[[0, 7, 12, 16], [9, 16, 19, 24], [5, 12, 16, 21], [7, 14, 19, 23]], [[0, 7, 15, 19], [8, 15, 19, 24], [3, 10, 15, 19], [10, 17, 22, 26]],
         [[2, 9, 14, 17], [7, 14, 17, 23], [0, 7, 12, 16], [9, 16, 19, 24]]]
hz = lambda m: 440 * 2 ** ((m - 69) / 12)


def addb(i, sig, gl=1.0, gr=1.0):
    if i >= NS or len(sig) == 0:
        return
    j = min(NS, i + len(sig)); bed[i:j, 0] += sig[:j - i] * gl; bed[i:j, 1] += sig[:j - i] * gr

bar = 4 * beat; nb = int(TOTAL / bar) + 1
for b in range(nb):
    prog = PROGS[(b // 16) % len(PROGS)]; ch = prog[b % 4]; t0 = b * bar; i0 = int(t0 * SR); n = int(bar * SR) + int(0.6 * SR)
    x = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * hz(key + iv) * x + 0.3 * np.sin(2 * np.pi * 0.2 * x)) for iv in ch) / 4
    env = np.minimum(1, x / 0.8) * np.clip((bar + 0.6 - x) / 0.8, 0, 1)
    sub = np.sin(2 * np.pi * hz(key - 12 + ch[0]) * x) * np.exp(-x * 0.9) * 0.5
    seg = (pad * env * 0.5 + sub * env)
    addb(i0, seg, 0.9, 1.0)
    for q in range(8):   # soft plucked arpeggio
        tq = t0 + q * beat / 2; iq = int(tq * SR); m = key + 12 + ch[[0, 1, 2, 3, 2, 1, 3, 2][q]]; nn = int(0.6 * SR); xx = np.arange(nn) / SR
        pl = np.sin(2 * np.pi * hz(m) * xx) * np.exp(-xx * 6) * 0.22; pan = 0.3 * (1 if q % 2 else -1)
        addb(iq, pl, 1 - pan, 1 + pan)
    if b >= 2 and (b // 8) % 4 != 3:   # gentle kick/hat, drops out every 4th section
        for q in range(4):
            tk = t0 + q * beat; ik = int(tk * SR); nk = int(0.25 * SR); xk = np.arange(nk) / SR
            kk = np.sin(2 * np.pi * (50 + 50 * np.exp(-xk * 30)) * xk) * np.exp(-xk * 14) * (0.55 if q % 2 == 0 else 0.0)
            hh = rng.standard_normal(int(0.05 * SR)) * np.exp(-np.arange(int(0.05 * SR)) / SR * 90) * 0.05
            addb(ik, kk); addb(int((tk + beat / 2) * SR), hh)
bed = bed[:int(TOTAL * SR)]
fade = int(3 * SR); bed[:int(1.5 * SR)] *= np.linspace(0, 1, int(1.5 * SR))[:, None]; bed[-fade:] *= np.linspace(1, 0, fade)[:, None]
bed = bed / (np.abs(bed).max() + 1e-9) * 0.9
with wave.open(os.path.join(TMP, 'bed.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((bed * 32767).astype('<i2').tobytes())

# ---- final: subtitles + progress bar + music under the simulation sounds ----
out = os.path.join(OUT, 'out.mp4')
sh('ffmpeg', '-y', '-v', 'error', '-i', body, '-i', os.path.join(TMP, 'bed.wav'), '-f', 'lavfi', '-i', 'color=c=0xff3b3b:s=1920x6:r=30',
   '-filter_complex', f"[0:v]ass={os.path.join(TMP, 'o.ass')}[s];[s][2:v]overlay=x='-W+W*t/{TOTAL:.3f}':y=1074:shortest=1[v];"
   f"[1:a]volume=0.16[m];[0:a][m]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=11[a]",
   '-map', '[v]', '-map', '[a]', '-t', f'{TOTAL:.3f}', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-maxrate', '9M', '-bufsize', '18M',
   '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-movflags', '+faststart', out)
# thumbnail: the busiest moment of a "full" chapter
pick = next((m for m in marks if m[2]['format'] in ('overflow', 'plinko', 'takeover', 'grow')), marks[0])
sh('ffmpeg', '-y', '-v', 'error', '-ss', f'{pick[0] + pick[2]["dur"] * 0.8:.2f}', '-i', out, '-frames:v', '1', '-vf', 'scale=1280:720', '-q:v', '3', os.path.join(OUT, 'thumb.jpg'))
chap = ['0:00 Intro'] + [f"{mmss(a)} {k + 1:02d} — {c['short']}" for k, (a, b, c) in enumerate(marks)] + [f'{mmss(T_OUT)} Next episode']
open(os.path.join(OUT, 'chapters.txt'), 'w').write('\n'.join(chap) + '\n')
json.dump({'duration': round(dur(out), 2), 'chapters': len(use), 'formats': [c['format'] for c in use]}, open(os.path.join(OUT, 'meta.json'), 'w'))
print('\n'.join(chap)); print('done', out, f'{dur(out) / 60:.2f} min')
