#!/usr/bin/env python3
"""Cut a storyboard / comic sheet into panels.
Finds long straight horizontal/vertical edges (panel borders), closes them into a grid,
and keeps the rectangular cells. usage: crop.py board.png outdir -> P01.png.. + panels.json"""
import sys, os, json
import numpy as np, cv2

def panels(img):
    H, W = img.shape[:2]
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    light = ((g > 175) & (hsv[:, :, 1] < 60)).astype(np.uint8) * 255      # white/grey gutters
    dark = (g < 22).astype(np.uint8) * 255                                  # black gutters
    edges = cv2.Canny(cv2.GaussianBlur(g, (3, 3), 0), 40, 120)
    e = cv2.bitwise_or(cv2.bitwise_or(light, dark), edges)
    hk = cv2.getStructuringElement(cv2.MORPH_RECT, (max(40, W // 9), 1))
    vk = cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(40, H // 9)))
    hl = cv2.morphologyEx(e, cv2.MORPH_OPEN, hk); vl = cv2.morphologyEx(e, cv2.MORPH_OPEN, vk)
    lines = cv2.dilate(cv2.bitwise_or(hl, vl), np.ones((5, 5), np.uint8))
    # extend lines a little so borders close
    lines = cv2.dilate(lines, cv2.getStructuringElement(cv2.MORPH_RECT, (9, 1))); lines = cv2.dilate(lines, cv2.getStructuringElement(cv2.MORPH_RECT, (1, 9)))
    inv = cv2.bitwise_not(lines)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(inv, 4)
    out = []
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        if w < W * 0.08 or h < H * 0.07: continue
        if area < 0.7 * w * h: continue          # not rectangular
        if w * h > 0.6 * W * H: continue          # whole page
        if w / h > 4 or h / w > 4: continue
        tile = g[y:y + h, x:x + w]
        if tile.std() < 18: continue
        out.append((int(x), int(y), int(w), int(h)))
    # drop boxes contained in others
    keep = []
    for b in out:
        if not any(o != b and o[0] <= b[0] + 3 and o[1] <= b[1] + 3 and o[0] + o[2] >= b[0] + b[2] - 3 and o[1] + o[3] >= b[1] + b[3] - 3 for o in out): keep.append(b)
    return sorted(keep, key=lambda r: (r[0] // max(1, W // 3), r[1], r[0]))

def main(src, outdir):
    img = cv2.imread(src); os.makedirs(outdir, exist_ok=True)
    res = []
    for k, (x, y, w, h) in enumerate(panels(img), 1):
        pid = f'P{k:02d}'
        cv2.imwrite(os.path.join(outdir, pid + '.png'), img[y + 2:y + h - 2, x + 2:x + w - 2])
        res.append({'id': pid, 'x': x, 'y': y, 'w': w, 'h': h})
    json.dump(res, open(os.path.join(outdir, 'panels.json'), 'w'))
    print(len(res), 'panels')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
