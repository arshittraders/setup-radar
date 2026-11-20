# Python twin of sfx.js — returns ffmpeg inputs + filter to mix CC0 sound effects onto a clip.
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _lib():
    p = os.path.join(ROOT, 'sfx', 'library.json'); return json.load(open(p)) if os.path.exists(p) else []
def pick(cat, n=0):
    L = [x for x in _lib() if x['cat'] == cat]; return os.path.join(ROOT, L[n % len(L)]['file']) if L else None
def ffmpeg_mix(cues, first_input_index, base_label='[a0]', out_label='[a]'):
    """cues: [(time_sec, cat, seed, gain)] -> (extra ffmpeg '-i' args, filter_complex fragment mixing them into base_label)"""
    args, parts, labels = [], [], []
    for k, (t, cat, n, g) in enumerate(cues):
        f = pick(cat, n)
        if not f: continue
        idx = first_input_index + len(labels); args += ['-i', f]
        ms = max(0, int(t * 1000)); lab = f'[sx{k}]'
        parts.append(f'[{idx}:a]aresample=48000,volume={g},adelay={ms}|{ms}{lab}'); labels.append(lab)
    if not labels: return [], f'{base_label}anull{out_label}'
    return args, ';'.join(parts) + f';{base_label}{"".join(labels)}amix=inputs={1 + len(labels)}:duration=first:normalize=0{out_label}'
