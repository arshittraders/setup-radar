import asyncio, json, sys, edge_tts
L = json.load(open(sys.argv[1])); V = sys.argv[2]; out = sys.argv[3]
async def main():
    for i, t in enumerate(L):
        c = edge_tts.Communicate(t, V, rate="-6%", pitch="-6Hz")
        await c.save(f"{out}/l{i:02d}.mp3")
asyncio.run(main())
