# Twitch VOD chat replay -> chat activity samples (for picking the best moments).
# usage: python twitch_chat.py <vod_id> <start_sec> <end_sec> <out.json> [step_sec=8]
# For every `step` seconds we read one page of chat replay starting at that offset (public Twitch GQL,
# same call the twitch.tv player makes) and record: messages/sec + share of "reaction" messages.
import json, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

VOD, S, E, OUT = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
STEP = int(sys.argv[5]) if len(sys.argv) > 5 else 8
GQL = "https://gql.twitch.tv/gql"
CID = "kimne78kjfvjnd1iheqfa5sqpdhla9"   # public web-player client id
HASH = "b70a3591ff0f4e0313d126c6a1502d79a1c02baebb288227c582044aa76adf6a"
# laughs, hype and shock in chat (English + common Twitch emotes + Hinglish)
REACT = re.compile(r"(lo+l|lmao+|lmfao|rofl|haha|hehe|kek|omegalul|lul|xd\b|💀|😂|🤣|☠|pog|w+\b|ww+|holy|omg|wtf|bro+|no+ way|nooo+|yoo+|clip (it|that)|clipped|\?\?\?+|!!!+|insane|crazy|bhai|😭|🔥)", re.I)

def page(off):
    body = json.dumps([{"operationName": "VideoCommentsByOffsetOrCursor", "variables": {"videoID": VOD, "contentOffsetSeconds": off},
                        "extensions": {"persistedQuery": {"version": 1, "sha256Hash": HASH}}}]).encode()
    for tries in range(4):
        try:
            rq = urllib.request.Request(GQL, data=body, headers={"Client-Id": CID, "Content-Type": "text/plain;charset=UTF-8"})
            d = json.load(urllib.request.urlopen(rq, timeout=20))
            edges = ((((d[0].get("data") or {}).get("video") or {}).get("comments") or {}).get("edges")) or []
            msgs = []
            for e in edges:
                n = e.get("node") or {}
                t = n.get("contentOffsetSeconds")
                txt = "".join((f.get("text") or "") for f in ((n.get("message") or {}).get("fragments") or []))
                if t is not None: msgs.append((float(t), txt))
            return off, msgs
        except Exception as ex:
            time.sleep(1.5 * (tries + 1)); err = ex
    return off, None

offs = list(range(S, E, STEP))
with ThreadPoolExecutor(12) as ex:
    res = list(ex.map(page, offs))
samples, bad = [], 0
for off, msgs in res:
    if msgs is None: bad += 1; continue
    msgs = [m for m in msgs if m[0] >= off - 1]
    if len(msgs) < 2: samples.append([off, 0.0, 0.0]); continue
    span = max(1.0, msgs[-1][0] - msgs[0][0])
    rate = len(msgs) / span
    react = sum(1 for _, t in msgs if REACT.search(t)) / len(msgs)
    samples.append([off, round(rate, 3), round(react, 3)])
json.dump({"vod": VOD, "step": STEP, "samples": samples}, open(OUT, "w"))
print(f"chat samples {len(samples)} failed {bad} nonzero {sum(1 for s in samples if s[1] > 0)}")
