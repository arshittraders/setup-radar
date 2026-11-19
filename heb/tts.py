import asyncio, json, sys, edge_tts
E = json.load(open(sys.argv[1])); V = sys.argv[2]; out = sys.argv[3]
async def main():
    for ep, L in E.items():
        for i, t in enumerate(L):
            await edge_tts.Communicate(t, V, rate="+12%", pitch="+3Hz").save(f"{out}/{ep}_l{i:02d}.mp3")
asyncio.run(main())
