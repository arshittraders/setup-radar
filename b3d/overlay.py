"""CUTS (top) / CUBES (bottom) counters + intro + final count as an .ass subtitle file (burned in by ffmpeg/libass).
usage: python3 b3d/overlay.py <params.json> <out.ass>"""
import json, sys

P = json.load(open(sys.argv[1]))


def ts(t):
    t = max(0.0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f'{h}:{m:02d}:{s:05.2f}'


POP = r'{\fscx70\fscy70\t(0,110,\fscx118\fscy118)\t(110,240,\fscx100\fscy100)}'
head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Top,Anton,150,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,2,0,1,7,4,8,40,40,110,1
Style: Bot,Anton,150,&H0040D8FF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,2,0,1,7,4,2,40,40,150,1
Style: Mid,Anton,96,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,2,0,1,7,4,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ev = P['events']; end = P['dur']; TR = P['t_reveal']
lines = []
marks = [(0.0, 0, 1)] + [(e['t'], e['cuts'], e['cubes']) for e in ev]
for i, (t, cuts, cubes) in enumerate(marks):
    t2 = marks[i + 1][0] if i + 1 < len(marks) else TR
    pop = POP if i else ''
    lines.append(f'Dialogue: 1,{ts(t)},{ts(t2)},Top,,0,0,0,,{{\\fs64}}CUTS\\N{pop}{{\\fs150}}{cuts}')
    lines.append(f'Dialogue: 1,{ts(t)},{ts(t2)},Bot,,0,0,0,,{pop}{{\\fs150}}{cubes}\\N{{\\fs64\\c&HFFFFFF&}}CUBES')
lines.append(f'Dialogue: 2,{ts(0.15)},{ts(2.1)},Mid,,0,0,0,,{{\\fad(200,250)\\pos(540,700)}}{P["mat_name"]} BLOCK\\N{{\\fs60}}HOW MANY CUBES?')
lines.append(f'Dialogue: 2,{ts(TR)},{ts(end)},Mid,,0,0,0,,{{\\pos(540,330)\\fs150\\c&H40D8FF&}}{POP}{P["total"]} CUBES!')
lines.append(f'Dialogue: 2,{ts(TR + 0.6)},{ts(end)},Mid,,0,0,0,,{{\\fad(300,0)\\pos(540,1700)\\fs64}}FROM {len(ev)} CUTS')
open(sys.argv[2], 'w').write(head + '\n'.join(lines) + '\n')
print('overlay', len(lines), 'lines')
