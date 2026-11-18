import asyncio, json, sys, edge_tts
L = json.load(open(sys.argv[1])); out = sys.argv[3]
async def main():
    for i, s in enumerate(L):
        who, t = s.split("|", 1)
        if who == "T": c = edge_tts.Communicate(t, "hi-IN-SwaraNeural", rate="+12%", pitch="+45Hz")
        else: c = edge_tts.Communicate(t, "hi-IN-SwaraNeural", rate="-4%", pitch="-8Hz")
        await c.save(f"{out}/l{i:02d}.mp3")
asyncio.run(main())
