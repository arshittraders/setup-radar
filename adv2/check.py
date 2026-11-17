import json
from faster_whisper import WhisperModel
m = WhisperModel("medium", device="cpu", compute_type="int8")
segs, _ = m.transcribe("out/l00.mp3", language="hi", beam_size=5, word_timestamps=True, initial_prompt="Kiwtech Studio, YouTube, Instagram, Facebook, 699, 199, 500, channel, reels, AI, setup, automation")
w = [{"w": x.word.strip(), "s": round(x.start, 2), "e": round(x.end, 2)} for s in segs for x in s.words]
json.dump(w, open("out/check.json", "w"), ensure_ascii=False)
