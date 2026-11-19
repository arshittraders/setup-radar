# Build a 9:16 gaming short: blurred bg + centre-cropped gameplay, hook band, punchy captions, VO over ducked game audio.
# usage: python make_short.py spec.json   (spec: src, ss, to, out, tts_dir, key, hook, credit, lines[[t, caption]])
import json, sys, subprocess, os, re
from PIL import Image, ImageDraw, ImageFont
S = json.load(open(sys.argv[1])); here = os.path.dirname(os.path.abspath(__file__))
work = S['out'] + '_w'; os.makedirs(work, exist_ok=True)
ANTON = os.path.join(here, 'anton.woff2'); INTER = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'
def dur(f): return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))
def text_png(path, words, size, maxw=1000, hl=(255, 214, 0), base=(255, 255, 255), stroke=9):
    f = ImageFont.truetype(ANTON, size); sp = f.getlength(' ')
    lines, cur, w = [], [], 0
    for wd, h in words:
        lw = f.getlength(wd)
        if cur and w + sp + lw > maxw: lines.append(cur); cur, w = [], 0
        cur.append((wd, h, lw)); w += (sp if len(cur) > 1 else 0) + lw
    if cur: lines.append(cur)
    lh = int(size * 1.15); im = Image.new('RGBA', (1080, lh * len(lines) + 40), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for i, ln in enumerate(lines):
        tw = sum(x[2] for x in ln) + sp * (len(ln) - 1); x = (1080 - tw) / 2; y = 20 + i * lh
        for wd, h, lw in ln:
            d.text((x, y), wd, font=f, fill=hl if h else base, stroke_width=stroke, stroke_fill=(0, 0, 0)); x += lw + sp
    im.save(path)
# hook + credit
hs = 104
while ImageFont.truetype(ANTON, hs).getlength(S['hook'].upper()) > 1000: hs -= 4
text_png(f'{work}/hook.png', [(w, True) for w in S['hook'].upper().split()], hs, maxw=1040)
cr = Image.new('RGBA', (1080, 60), (0, 0, 0, 0)); ImageDraw.Draw(cr).text((540, 30), S['credit'], font=ImageFont.truetype(INTER, 30), fill=(255, 255, 255, 200), anchor='mm', stroke_width=2, stroke_fill=(0, 0, 0, 160)); cr.save(f'{work}/credit.png')
# captions: chunk each line into ~3 words, timed by character share of the VO duration
caps, vos = [], []
for i, (t, cap) in enumerate(S['lines']):
    mp3 = f"{S['tts_dir']}/{S['key']}{i}.mp3"; d = dur(mp3); vos.append((t, mp3))
    words = [(w.upper(), w.isupper() and len(re.sub(r'\W', '', w)) > 1) for w in cap.split()]
    chunks = [words[j:j + 3] for j in range(0, len(words), 3)]
    if len(chunks) > 1 and len(chunks[-1]) == 1: chunks[-2] += chunks.pop()
    tot = sum(len(''.join(w for w, _ in c)) for c in chunks); at = t
    for c in chunks:
        cd = d * len(''.join(w for w, _ in c)) / tot; p = f'{work}/c{len(caps)}.png'
        text_png(p, c, 92, maxw=960); caps.append((p, at, at + cd + (0.25 if c is chunks[-1] else 0))); at += cd
L = S['to'] - S['ss']
inp = ['-ss', str(S['ss']), '-t', str(L), '-i', S['src'], '-i', f'{work}/hook.png', '-i', f'{work}/credit.png']
for p, _, _ in caps: inp += ['-i', p]
for _, m in vos: inp += ['-i', m]
fc = ['[0:v]split=2[a][b]',
      '[a]scale=-2:1920,crop=1080:1920,boxblur=30:3,eq=brightness=-0.18:saturation=1.2[bg]',
      '[b]crop=900:1080:510:0,scale=1080:1296:flags=lanczos,eq=contrast=1.06:saturation=1.15[fg]',
      '[bg][fg]overlay=0:300[v0]', '[v0][1:v]overlay=0:96[v1]', '[v1][2:v]overlay=0:1858[v2]']
cur = 'v2'
for k, (p, a, b) in enumerate(caps):
    nxt = f'v{k + 3}'; fc.append(f"[{cur}][{k + 3}:v]overlay=0:1570:enable='between(t,{a:.2f},{b:.2f})'[{nxt}]"); cur = nxt
n0 = 3 + len(caps); amix = ['[0:a]volume=0.22[g]']
for k, (t, _) in enumerate(vos):
    ms = int(t * 1000); amix.append(f'[{n0 + k}:a]adelay={ms}|{ms},volume=1.6[vo{k}]')
amix.append('[g]' + ''.join(f'[vo{k}]' for k in range(len(vos))) + f'amix=inputs={len(vos) + 1}:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5[aout]')
fc += amix
cmd = ['ffmpeg', '-v', 'error', '-y'] + inp + ['-filter_complex', ';'.join(fc), '-map', f'[{cur}]', '-map', '[aout]',
       '-r', '60', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', S['out']]
subprocess.run(cmd, check=True); print('done', S['out'], L, 's,', len(caps), 'caption chunks')
