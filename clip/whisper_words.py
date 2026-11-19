import sys, json, subprocess, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
out = {}
for f in sys.argv[2:]:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout
    audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0
    segs, _ = m.transcribe(audio, word_timestamps=True, vad_filter=True)
    k = f.split('/')[-1]; out[k] = [[w.start, w.end, w.word.strip()] for s in segs for w in (s.words or [])]
    print(k, len(out[k]))
json.dump(out, open(sys.argv[1], 'w'))
