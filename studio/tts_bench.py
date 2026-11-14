# Benchmark free Hindi TTS on the GitHub runner: Indic Parler-TTS (voice design) + IndicF5 (clone for consistency)
import time, json, os, sys, traceback
import numpy as np, soundfile as sf, torch
torch.set_num_threads(os.cpu_count() or 4)
OUT = sys.argv[1] if len(sys.argv) > 1 else 'bench'; os.makedirs(OUT, exist_ok=True)
MODE = sys.argv[2] if len(sys.argv) > 2 else 'all'
RF = f'{OUT}/bench.json'
R = json.load(open(RF)) if os.path.exists(RF) else {'cpus': os.cpu_count()}
LINES = {
  'narr':  ('रात के ठीक दो बजकर सत्रह मिनट पर... हवेली का दरवाज़ा अपने आप खुल गया।', "Rohit speaks in a deep, slow, low-pitched and mysterious voice, like a horror story narrator, with dramatic pauses. The recording is very high quality with no background noise."),
  'girl':  ('अर्जुन... मुझे बहुत डर लग रहा है, चलो यहाँ से वापस चलते हैं!', "Divya speaks in a fearful, trembling, fast and high-pitched voice, as if very scared. The recording is very high quality with no background noise."),
  'old':   ('बेटा, यह अंगूठी एक श्राप है। इसे वापस वहीं रख दो।', "Rohit speaks in a very slow, calm, deep and heavy voice like an old wise man. The recording is very high quality with no background noise."),
}
def dur(a, sr): return round(len(a) / sr, 2)
# ---- Parler ----
if MODE in ('all', 'parler'):
  try:
      from parler_tts import ParlerTTSForConditionalGeneration
      from transformers import AutoTokenizer
      t0 = time.time()
      M = ParlerTTSForConditionalGeneration.from_pretrained('ai4bharat/indic-parler-tts')
      tok = AutoTokenizer.from_pretrained('ai4bharat/indic-parler-tts'); dtok = AutoTokenizer.from_pretrained(M.config.text_encoder._name_or_path)
      R['parler_load_s'] = round(time.time() - t0, 1); sr = M.config.sampling_rate
      for k, (text, desc) in LINES.items():
          torch.manual_seed(7); t0 = time.time()
          d = dtok(desc, return_tensors='pt'); p = tok(text, return_tensors='pt')
          g = M.generate(input_ids=d.input_ids, attention_mask=d.attention_mask, prompt_input_ids=p.input_ids, prompt_attention_mask=p.attention_mask)
          a = g.cpu().numpy().squeeze(); sf.write(f'{OUT}/parler_{k}.wav', a, sr)
          R['parler_' + k] = {'gen_s': round(time.time() - t0, 1), 'audio_s': dur(a, sr)}
          print('parler', k, R['parler_' + k], flush=True)
  except Exception as e:
      R['parler_error'] = traceback.format_exc()[-1500:]; print(R['parler_error'], flush=True)
# ---- IndicF5 (clone the Parler narrator / girl as reference) ----
if MODE in ('all', 'f5'):
  try:
      from transformers import AutoModel
      t0 = time.time(); F = AutoModel.from_pretrained('ai4bharat/IndicF5', trust_remote_code=True, low_cpu_mem_usage=False); R['f5_load_s'] = round(time.time() - t0, 1)
      tests = [('narr', 'अचानक गलियारे के अंत में एक सफेद साया दिखाई दिया... और वो धीरे-धीरे उनकी ओर बढ़ने लगा।'),
               ('girl', 'नहीं अर्जुन! उस अंगूठी को मत छूना, कुछ बहुत बुरा होने वाला है!')]
      for k, text in tests:
          ref = f'{OUT}/parler_{k}.wav'
          if not os.path.exists(ref): continue
          t0 = time.time(); a = F(text, ref_audio_path=ref, ref_text=LINES[k][0])
          a = np.array(a); a = a.astype(np.float32) / 32768.0 if a.dtype == np.int16 else a.astype(np.float32)
          sf.write(f'{OUT}/f5_{k}.wav', a, 24000); R['f5_' + k] = {'gen_s': round(time.time() - t0, 1), 'audio_s': dur(a, 24000)}
          print('f5', k, R['f5_' + k], flush=True)
  except Exception as e:
      tb = traceback.format_exc(); R['f5_error'] = tb[-1500:]; print('\n'.join(l for l in tb.split('\n') if '/torch/' not in l), flush=True)
json.dump(R, open(f'{OUT}/bench.json', 'w'), ensure_ascii=False, indent=1); print(json.dumps(R, ensure_ascii=False))
