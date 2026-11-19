import json, sys, asyncio, edge_tts, os
cfg = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
async def main():
    for k, c in cfg.items():
        for i, t in enumerate(c['lines']):
            await edge_tts.Communicate(t, c['voice'], rate=c['rate'], pitch=c['pitch']).save(f"{out}/{k}{i}.mp3")
            print(k, i, 'ok')
asyncio.run(main())
