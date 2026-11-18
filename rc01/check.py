import json, sys, glob
from faster_whisper import WhisperModel
m = WhisperModel("medium", device="cpu", compute_type="int8")
L = json.load(open(sys.argv[1])); out = []
for i, f in enumerate(sorted(glob.glob("out/l*.mp3"))):
    segs, _ = m.transcribe(f, language="hi", beam_size=5)
    out.append({"i": i, "script": L[i], "heard": " ".join(s.text.strip() for s in segs)})
json.dump(out, open("out/check.json", "w"), ensure_ascii=False, indent=1)
