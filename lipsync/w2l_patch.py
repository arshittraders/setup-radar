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
