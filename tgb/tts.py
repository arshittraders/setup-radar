import asyncio, json, sys, edge_tts
E = json.load(open(sys.argv[1])); out = sys.argv[3]
async def main():
    for ep, d in E.items():
        for i, s in enumerate(d["lines"]):
            who, t = s.split("|", 1)
            if who == "T": c = edge_tts.Communicate(t, "hi-IN-SwaraNeural", rate="+12%", pitch="+45Hz")
            else: c = edge_tts.Communicate(t, "hi-IN-SwaraNeural", rate="-4%", pitch="-8Hz")
            await c.save(f"{out}/{ep}_l{i:02d}.mp3")
asyncio.run(main())
