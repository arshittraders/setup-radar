import json, sys
from faster_whisper import WhisperModel
L = json.load(open(sys.argv[1])); m = WhisperModel("medium", device="cpu", compute_type="int8"); R = []
for i, s in enumerate(L):
    segs, _ = m.transcribe(f"out/l{i:02d}.mp3", language="hi"); R.append({"i": i, "want": s.split("|",1)[1], "heard": " ".join(x.text for x in segs).strip()})
json.dump(R, open("out/check.json", "w"), ensure_ascii=False)
