import asyncio, json, sys, edge_tts
E = json.load(open(sys.argv[1])); V = sys.argv[2]; out = sys.argv[3]
async def main():
    for ep, L in E.items():
        for i, t in enumerate(L):
            for k in range(5):   # edge-tts sometimes returns no audio: retry, then fail loudly with the line
                try:
                    await edge_tts.Communicate(t, V, rate="-6%", pitch="-6Hz").save(f"{out}/{ep}_l{i:02d}.mp3"); break
                except edge_tts.exceptions.NoAudioReceived:
                    print("retry", ep, i, k, t, flush=True); await asyncio.sleep(3 + 4 * k)
            else: raise SystemExit(f"no audio: {ep} {i} {t}")
asyncio.run(main())
