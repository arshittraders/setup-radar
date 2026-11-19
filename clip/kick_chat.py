# Kick VOD chat replay -> chat activity samples, same format as twitch_chat.py
# usage: python kick_chat.py <channel_id> <vod_start "YYYY-MM-DD HH:MM:SS" UTC> <start_sec> <end_sec> <out.json> [step=8]
import json, re, sys, time
from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor
from curl_cffi import requests

CID, T0, S, E, OUT = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
STEP = int(sys.argv[6]) if len(sys.argv) > 6 else 8
base = datetime.strptime(T0, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
REACT = re.compile(r"(lo+l|lmao+|lmfao|rofl|haha|hehe|kek|omegalul|lul|xd\b|💀|😂|🤣|☠|pog|\bw+\b|holy|omg|wtf|bro+|no+ way|nooo+|yoo+|clip (it|that)|clipped|\?\?\?+|!!!+|insane|crazy|😭|🔥|emote:\d+:(kekw|lul|omegalul|pog|icant|lmao)\w*)", re.I)

def page(off):
    t = (base + timedelta(seconds=off)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    for k in range(4):
        try:
            r = requests.get(f"https://kick.com/api/v2/channels/{CID}/messages", params={"start_time": t}, impersonate="chrome", timeout=20)
            d = r.json(); msgs = (d.get("data") or {}).get("messages") or []
            out = []
            for m in msgs:
                ts = datetime.fromisoformat(m["created_at"].replace("Z", "+00:00"))
                out.append(((ts - base).total_seconds(), m.get("content") or ""))
            return off, sorted(out)
        except Exception:
            time.sleep(1.5 * (k + 1))
    return off, None

with ThreadPoolExecutor(10) as ex:
    res = list(ex.map(page, range(S, E, STEP)))
samples, bad = [], 0
for off, msgs in res:
    if msgs is None: bad += 1; continue
    msgs = [m for m in msgs if off - 1 <= m[0] <= off + 60]
    if len(msgs) < 2: samples.append([off, 0.0, 0.0]); continue
    span = max(1.0, msgs[-1][0] - msgs[0][0])
    samples.append([off, round(len(msgs) / span, 3), round(sum(1 for _, x in msgs if REACT.search(x)) / len(msgs), 3)])
json.dump({"step": STEP, "samples": samples}, open(OUT, "w"))
print(f"chat samples {len(samples)} failed {bad} nonzero {sum(1 for s in samples if s[1] > 0)}")
