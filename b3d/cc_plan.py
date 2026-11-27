"""Cutting Cubes — shared timeline (pure Python, no deps).
Used by the Blender scene (b3d/cutting_cubes.py), the sound (b3d/sound.py) and the text overlay (b3d/overlay.py),
so every knife hit, counter change and sound lands on exactly the same frame.
"""
import random

FPS = 30
DUR = 45.0
FRAMES = int(FPS * DUR)          # 1350
T_FIRST = 2.2                    # first knife hit
T_LAST = 39.0                    # last knife hit
T_REVEAL = 40.2                  # cubes spread out + "N CUBES!"

MATERIALS = ['cheese', 'soap', 'jelly', 'marble', 'wood', 'chocolate', 'clay', 'crystal', 'rainbow', 'cake']
MAT_NAME = {'cheese': 'CHEESE', 'soap': 'SOAP', 'jelly': 'JELLY', 'marble': 'MARBLE', 'wood': 'WOOD', 'chocolate': 'CHOCOLATE',
            'clay': 'CLAY', 'crystal': 'CRYSTAL', 'rainbow': 'RAINBOW', 'cake': 'LAYER CAKE'}
GRIDS = [(6, 6, 5), (7, 6, 5), (7, 7, 4), (8, 6, 4), (6, 6, 6), (7, 7, 5)]


def make(seed, material=None):
    r = random.Random(int(seed))
    nx, ny, nz = GRIDS[r.randrange(len(GRIDS))]
    mat = material or MATERIALS[r.randrange(len(MATERIALS))]
    cuts = [('x', b) for b in range(1, nx)] + [('y', b) for b in range(1, ny)] + [('z', b) for b in range(1, nz)]
    order = r.choice(['xyz', 'yxz', 'zxy'])   # which direction gets cut first
    cuts.sort(key=lambda c: order.index(c[0]))
    n = len(cuts)
    # hits accelerate a little: gaps shrink from 1.25x to 0.8x of the average
    w = [1.25 - 0.45 * i / max(1, n - 2) for i in range(n - 1)]
    span, tot = T_LAST - T_FIRST, sum(w) or 1
    times = [T_FIRST]
    for x in w:
        times.append(times[-1] + span * x / tot)
    cnt = {'x': 1, 'y': 1, 'z': 1}
    events = []
    for i, (ax, b) in enumerate(cuts):
        cnt[ax] += 1
        events.append({'i': i, 'axis': ax, 'b': b, 't': round(times[i], 4), 'cuts': i + 1, 'cubes': cnt['x'] * cnt['y'] * cnt['z']})
    hue = r.random()
    return {
        'seed': int(seed), 'nx': nx, 'ny': ny, 'nz': nz, 'size': round(1.4 / max(nx, ny, nz), 4), 'material': mat, 'mat_name': MAT_NAME[mat],
        'hue': hue, 'bg_hue': (hue + 0.5 + r.uniform(-0.12, 0.12)) % 1.0, 'cam_side': r.choice([-1, 1]), 'cam_h': r.uniform(0.85, 1.15),
        'events': events, 'total': nx * ny * nz, 'fps': FPS, 'dur': DUR, 'frames': FRAMES, 't_reveal': T_REVEAL,
        'knife_style': r.randrange(3), 'board_style': r.randrange(3),
    }


if __name__ == '__main__':
    import json, sys
    print(json.dumps(make(sys.argv[1] if len(sys.argv) > 1 else 7), indent=1))
