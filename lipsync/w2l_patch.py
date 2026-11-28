# Wav2Lip: frames with no detected face reuse the last good box (cartoon faces, hands over face, end cards) instead of crashing.
import re, sys
p = sys.argv[1]; s = open(p).read()
s2 = re.sub(r"(\n(\s*)if rect is None:\n)\s*cv2\.imwrite\([^\n]*\n\s*raise ValueError\([^\n]*\n",
            lambda m: m.group(1) + m.group(2) + "\trect = last_rect if last_rect is not None else [image.shape[1]//3, image.shape[0]//4, 2*image.shape[1]//3, image.shape[0]//2]\n" + m.group(2) + "last_rect = rect\n", s)
s2 = s2.replace("\tresults = []\n\tpady1, pady2, padx1, padx2 = args.pads", "\tresults = []\n\tlast_rect = None\n\tpady1, pady2, padx1, padx2 = args.pads", 1)
open(p, 'w').write(s2); print('patched', s2 != s, 'last_rect = None' in s2)
# Detect faces on a 1/3-size copy (fast) but keep the full-res frames for lip-sync output.
s3 = open(p).read()
old = "predictions.extend(detector.get_detections_for_batch(np.array(images[i:i + batch_size])))"
new = ("_ds = 3; _sm = np.array([cv2.resize(im, (im.shape[1]//_ds, im.shape[0]//_ds)) for im in images[i:i + batch_size]]); "
       "predictions.extend([None if r is None else [int(r[0]*_ds), int(r[1]*_ds), int(r[2]*_ds), int(r[3]*_ds)] for r in detector.get_detections_for_batch(_sm)])")
if old in s3: s3 = s3.replace(old, new); open(p, 'w').write(s3); print('fast-detect patched')
else: print('fast-detect pattern NOT found')
# Paste back ONLY the mouth: soft elliptical mask on the lower-middle of the face box, colour-matched to the original skin,
# sharpened a little. Eyes, nose, hair stay the original crisp render.
s4 = open(p).read()
old4 = "f[y1:y2, x1:x2] = p"
new4 = ("_h, _w = p.shape[:2]; _yy, _xx = np.mgrid[0:_h, 0:_w]; "
        "_m = 1 - np.clip(np.sqrt(((_xx - _w*0.5)/(_w*0.30))**2 + ((_yy - _h*0.74)/(_h*0.19))**2), 0, 1); _m = np.clip(_m*2.2, 0, 1)[..., None]; "
        "_o = f[y1:y2, x1:x2].astype(np.float32); _p = p.astype(np.float32); _r = (_m[..., 0] > 0.05); "
        "_p = _p - _p[_r].mean(0) + _o[_r].mean(0) if _r.sum() > 20 else _p; "
        "_p = cv2.addWeighted(_p, 1.6, cv2.GaussianBlur(_p, (0, 0), 2.0), -0.6, 0); "
        "f[y1:y2, x1:x2] = np.clip(_o*(1-_m) + _p*_m, 0, 255).astype(np.uint8)")
if old4 in s4: s4 = s4.replace(old4, new4); open(p, 'w').write(s4); print('mouth-only paste patched')
else: print('mouth-only pattern NOT found')
