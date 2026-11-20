# Build a CC0-only sound-effects library from Openverse (api.openverse.org). CC0 = public domain: free for commercial use, no credit needed.
# Output: sfx/<category>/<category>_NN.mp3 (trimmed + loudness-normalised) and sfx/library.json (source, creator, license for every file).
import json, os, subprocess, sys, time, urllib.parse, urllib.request
CATS = {   # category: (queries, max_ms, keep)
 "whoosh":  (["whoosh", "swoosh", "swish transition", "fast whoosh"], 2500, 10),
 "impact":  (["cinematic impact", "boom hit", "impact hit", "bass drop hit"], 4000, 8),
 "riser":   (["riser", "build up tension", "reverse cymbal"], 6000, 6),
 "pop":     (["pop sound", "bubble pop", "cartoon pop"], 1500, 6),
 "click":   (["ui click", "mouse click", "button click"], 800, 5),
 "ding":    (["ding", "bell ding", "notification chime", "correct answer"], 2500, 6),
 "camera":  (["camera shutter"], 1500, 3),
 "paper":   (["page turn", "paper flip", "paper rustle"], 2500, 4),
 "type":    (["typewriter", "keyboard typing"], 4000, 4),
 "glitch":  (["glitch", "digital glitch"], 2000, 5),
 "tick":    (["clock tick", "ticking"], 4000, 3),
 "coin":    (["coin", "cash register", "coins drop"], 2500, 4),
 "drum":    (["rimshot", "drum roll", "snare hit"], 4000, 5),
 "magic":   (["magic sparkle", "chime shimmer", "fairy"], 3000, 5),
 "gong":    (["gong", "tibetan bowl"], 6000, 3),
 "horror":  (["horror sting", "creepy", "suspense hit"], 5000, 5),
 "heart":   (["heartbeat"], 6000, 2),
 "thunder": (["thunder"], 8000, 3),
 "boing":   (["boing", "cartoon spring", "slide whistle"], 2500, 5),
 "fail":    (["fail", "sad trombone", "wrong buzzer"], 4000, 4),
 "crowd":   (["crowd cheer", "applause"], 6000, 3),
 "ambience_wind":  (["wind ambience"], 30000, 2),
 "ambience_ocean": (["ocean waves"], 30000, 2),
 "ambience_fire":  (["campfire crackling", "fire crackling"], 30000, 2),
}
API = "https://api.openverse.org/v1/audio/"
lib, seen = [], set()
def get(url):
    for k in range(4):
        try:
            rq = urllib.request.Request(url, headers={"User-Agent": "KiwtechStudio-sfx/1.0"})
            return urllib.request.urlopen(rq, timeout=40).read()
        except Exception as e:
            print("retry", url[:90], e); time.sleep(4 * (k + 1))
    return None
for cat, (qs, max_ms, keep) in CATS.items():
    os.makedirs(f"sfx/{cat}", exist_ok=True); got = 0
    for qq in qs:
        if got >= keep: break
        raw = get(API + "?" + urllib.parse.urlencode({"q": qq, "license": "cc0", "page_size": 20}))
        time.sleep(3)
        if not raw: continue
        for r in json.loads(raw).get("results", []):
            if got >= keep: break
            if r.get("license") != "cc0" or r["id"] in seen: continue
            d = r.get("duration") or 0
            if not d or d > max_ms * 3: continue
            src = get(r["url"]); time.sleep(1)
            if not src or len(src) < 2000: continue
            seen.add(r["id"]); tmp = f"/tmp/{r['id']}"
            open(tmp, "wb").write(src)
            out = f"sfx/{cat}/{cat}_{got + 1:02d}.mp3"
            af = f"silenceremove=start_periods=1:start_threshold=-50dB,atrim=0:{max_ms / 1000},afade=t=out:st={max(0, max_ms / 1000 - 0.25)}:d=0.25,loudnorm=I=-16:TP=-1.5"
            p = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", af, "-ar", "44100", "-ac", "2", "-b:a", "160k", out], stdin=subprocess.DEVNULL)
            if p.returncode or not os.path.exists(out) or os.path.getsize(out) < 1500: continue
            dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], capture_output=True, text=True).stdout or 0)
            if dur < 0.08: os.remove(out); continue
            got += 1
            lib.append({"file": out, "cat": cat, "dur": round(dur, 2), "title": r.get("title"), "creator": r.get("creator"), "license": "CC0 1.0",
                        "source": r.get("foreign_landing_url"), "provider": r.get("provider"), "query": qq})
    print(cat, got)
json.dump(lib, open("sfx/library.json", "w"), indent=1, ensure_ascii=False)
print("total", len(lib))
