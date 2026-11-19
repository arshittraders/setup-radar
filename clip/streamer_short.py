# Streamer clip -> 9:16 short: facecam top, gameplay bottom, creator overlay, word-synced captions, hook.
# usage: python streamer_short.py src.mp4 words.json key ss to "HOOK" overlay.png out.mp4
import sys, json, subprocess, os, re
from PIL import Image, ImageDraw, ImageFont
src, wj, key, ss, to, hook, ovp, out = sys.argv[1:9]; FACE = sys.argv[9] if len(sys.argv) > 9 else '280:182:0:95'; GX = sys.argv[10] if len(sys.argv) > 10 else '300'; ss, to = float(ss), float(to)
here = os.path.dirname(os.path.abspath(__file__)); ANTON = os.path.join(here, 'anton.woff2')
work = out + '_w'; os.makedirs(work, exist_ok=True)
W = json.load(open(wj)).get(key, [])
def png(path, words, size, hl_idx=-1, maxw=980, col=(255, 255, 255), hcol=(255, 214, 0)):
    f = ImageFont.truetype(ANTON, size); sp = f.getlength(' '); lines, cur, w = [], [], 0
    for i, wd in enumerate(words):
        lw = f.getlength(wd)
        if cur and w + sp + lw > maxw: lines.append(cur); cur, w = [], 0
        cur.append((i, wd, lw)); w += (sp if len(cur) > 1 else 0) + lw
    if cur: lines.append(cur)
    lh = int(size * 1.15); im = Image.new('RGBA', (1080, lh * len(lines) + 40), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for li, ln in enumerate(lines):
        tw = sum(x[2] for x in ln) + sp * (len(ln) - 1); x = (1080 - tw) / 2
        for i, wd, lw in ln:
            d.text((x, 20 + li * lh), wd, font=f, fill=hcol if i == hl_idx else col, stroke_width=10, stroke_fill=(0, 0, 0)); x += lw + sp
    im.save(path)
# caption events: 3-word pages, current word highlighted
BAD = {'SHIT': 'SH*T', 'FUCK': 'F*CK', 'FUCKING': 'F*CKING', 'BITCH': 'B*TCH', 'NUDES': 'N*DES'}
def cen(w): k = re.sub(r'[^A-Z]', '', w); return w.replace(k, BAD[k]) if k in BAD else w
ws = [(s - ss, e - ss, cen(re.sub(r'[^\w\'!?.,-]', '', t).upper())) for s, e, t in W if s >= ss - .05 and e <= to + .05 and t.strip()]
ev = []
for p in range(0, len(ws), 3):
    page = ws[p:p + 3]
    for j, (s, e, t) in enumerate(page):
        nxt = page[j + 1][0] if j + 1 < len(page) else min(e + .35, ws[p + 3][0] if p + 3 < len(ws) else e + .6)
        fp = f'{work}/c{len(ev)}.png'; png(fp, [x[2] for x in page], 96, j); ev.append((fp, s, max(nxt, s + .08)))
png(f'{work}/hook.png', hook.upper().split(), 92, -1, 1000, (255, 214, 0))
ov = Image.open(ovp).convert('RGBA'); ov = ov.crop(ov.getbbox()); ov.thumbnail((780, 300)); ov.save(f'{work}/ov.png')
L = to - ss
inp = ['-ss', str(ss), '-t', str(L), '-i', src, '-i', f'{work}/hook.png', '-i', f'{work}/ov.png'] + sum((['-i', p] for p, _, _ in ev), [])
fc = ['[0:v]split=2[a][b]', f'[a]crop={FACE},scale=1080:702:flags=lanczos,eq=contrast=1.05:saturation=1.1[face]',
      f'[b]crop=640:720:{GX}:0,scale=1080:1215:flags=lanczos,eq=contrast=1.05:saturation=1.12[game]',
      'color=c=black:s=1080x1920:r=60[bg]', '[bg][face]overlay=0:0:shortest=1[v0]', '[v0][game]overlay=0:705[v1]',
      'drawbox=x=0:y=700:w=1080:h=6:color=0xffd600@1:t=fill'.join(['[v1]', '[v2]']),
      "[v2][2:v]overlay=(W-w)/2:620[v3]", "[v3][1:v]overlay=0:70:enable='lt(t,3.2)'[v4]"]
cur = 'v4'
for k, (p, a, b) in enumerate(ev):
    n = f'v{k + 5}'; fc.append(f"[{cur}][{k + 3}:v]overlay=0:1480:enable='between(t,{a:.2f},{b:.2f})'[{n}]"); cur = n
fc.append('[0:a]loudnorm=I=-14:TP=-1.5[aout]')
subprocess.run(['ffmpeg', '-v', 'error', '-y'] + inp + ['-filter_complex', ';'.join(fc), '-map', f'[{cur}]', '-map', '[aout]', '-r', '60', '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-maxrate', '4500k', '-bufsize', '9000k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out], check=True)
print('done', out, round(L, 1), 's', len(ev), 'caption frames')
