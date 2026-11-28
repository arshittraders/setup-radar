# Kanjoos Uncle (3D, Meshy rig) — first test pipeline
- Model: Meshy Pro (account arshittraders), glb + Mixamo skeleton + 7 clips (Idle, Talk_with_Hands_Open, Talk_Passionately, Stand_Talking_Angry, Headache_Relief, Walking, Running). glb NOT in repo (keep private); copy as `ku.glb` next to page.html.
- Voice: ElevenLabs "Danish Khan – Expressive, Dramatic Voice", Eleven v4, Devanagari script with tags [excited]/[sighs]/[angry]/[sarcastic]/[smug]. Line timings = silence gaps (verify with align.yml whisper).
- Render: `node serve.js &` then `FULL=voice.mp3 SEGS=segs.json node render.js x bg.png out.mp4` (three.js + swiftshader, ~0.8 s/frame). Mouth = 2D overlay anchored to Head bone, opened by audio RMS. Per-clip hips yaw is auto-corrected so he faces camera.
- Background: Gemini gm_img 9:16 living room.
