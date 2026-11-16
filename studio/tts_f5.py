# Fixed voices (IndicF5 clone of studio/voices/<voice>.wav + .txt). usage: python tts_f5.py <items.json> <outdir>
# items: [{"i": 3, "text": "...", "voice": "female"|"golu"|"bunty", "out": "a3.wav"?}] -> writes <outdir>/a3.wav (24 kHz)
import json, sys, os, time, inspect
import numpy as np, soundfile as sf, torch
torch.set_num_threads(os.cpu_count() or 4)
from transformers import AutoModel
items, out = json.load(open(sys.argv[1])), sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
def refs(v):
    return os.path.join(here, 'voices', v + '.wav'), open(os.path.join(here, 'voices', v + '.txt'), encoding='utf-8').read().strip()
t0 = time.time(); M = AutoModel.from_pretrained('ai4bharat/IndicF5', trust_remote_code=True, low_cpu_mem_usage=False); print('f5 load', round(time.time() - t0, 1), flush=True)
kw = {}
try:
    if 'nfe_step' in inspect.signature(M.forward).parameters: kw['nfe_step'] = int(os.environ.get('F5_NFE', '20'))
except Exception: pass
for it in items:
    t0 = time.time()
    ref, ref_text = refs(it.get('voice') or 'female')
    a = np.array(M(it['text'], ref_audio_path=ref, ref_text=ref_text, **kw))
    a = a.astype(np.float32) / 32768.0 if a.dtype == np.int16 else a.astype(np.float32)
    sf.write(os.path.join(out, it.get('out') or f"a{it['i']}.wav"), a, 24000)
    print('f5 line', it['i'], round(len(a) / 24000, 2), 's audio in', round(time.time() - t0, 1), 's', kw, flush=True)
