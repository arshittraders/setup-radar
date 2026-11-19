import sys, json
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
out = {}
for f in sys.argv[2:]:
    segs, _ = m.transcribe(f, word_timestamps=True, vad_filter=True)
    out[f.split('/')[-1]] = [[w.start, w.end, w.word.strip()] for s in segs for w in (s.words or [])]
    print(f, len(out[f.split('/')[-1]]))
json.dump(out, open(sys.argv[1], 'w'))
