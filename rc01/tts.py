import asyncio, json, sys, edge_tts
L = json.load(open(sys.argv[1])); out = sys.argv[3]
async def main():
    for i, t in enumerate(L):
        await edge_tts.Communicate(t, "hi-IN-SwaraNeural", rate="+6%", pitch="+4Hz").save(f"{out}/l{i:02d}.mp3")
asyncio.run(main())
