// Story Studio worker (GitHub Actions): claim a queued job from Supabase, plan, voice, render, upload.
// env: OIDC_S (aud studio-worker → Supabase), OIDC_V (aud setup-radar-shorts → Vercel API), ESR (optional realesrgan binary)
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const FN = process.env.STUDIO_FN || 'https://ceoehwleopykotddcxxk.supabase.co/functions/v1/studio';
const API = process.env.SHORTS_API || 'https://setup-radar.vercel.app/api/shorts';
const job = path.resolve(process.argv[2] || 'sjob');

async function oidc(aud, fallback) {
  const u = process.env.ACTIONS_ID_TOKEN_REQUEST_URL, t = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!u || !t) return fallback;
  const r = await fetch(u + '&audience=' + aud, { headers: { Authorization: 'bearer ' + t } }); const j = await r.json().catch(() => ({})); return j.value || fallback;
}
async function sup(body) {
  const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await oidc('studio-worker', process.env.OIDC_S) }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ error: 'bad json ' + r.status })); if (j.error) throw new Error('studio: ' + j.error); return j;
}
async function api(body, tries = 3) {
  for (let i = 1; ; i++) {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await oidc('setup-radar-shorts', process.env.OIDC_V) }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({ ok: false, error: 'bad json ' + r.status })); if (j.ok) return j;
    if (i >= tries) throw new Error('api: ' + JSON.stringify(j).slice(0, 300)); await new Promise(r => setTimeout(r, 5000 * i));
  }
}
// retry wrapper: long renders leave idle keep-alive sockets that the server closes
const _fetch = global.fetch;
global.fetch = async (u, o) => { let e; for (let i = 1; i <= 4; i++) { try { return await _fetch(u, o); } catch (x) { e = x; await new Promise(r => setTimeout(r, 1500 * i)); } } throw e; };
const sh = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });

// ---------- AI story part: scenes → consistent cartoon images ----------
const STYLE = 'Polished 2D Indian cartoon animation still (like a high quality Hindi kids/teen animated web series): bold clean outlines, cel shading, rich cinematic colors, expressive big eyes and faces, detailed painted backgrounds, 16:9 widescreen composition. No text, no letters, no captions, no speech bubbles, no watermark, no borders.';
const MOODS = { horror: 'Eerie spooky atmosphere: moonlit night, deep blues and teal with warm lantern-orange highlights, fog, long shadows. Scary but not gory, suitable for all ages.', story: 'Warm, bright, friendly atmosphere with soft daylight or cozy lamp light.' };
async function putFile(u, file, ct) {
  let r, last = '';
  for (let i = 1; i <= 3; i++) {
    try { const fd = new FormData(); fd.append('cacheControl', '3600'); fd.append('', new Blob([fs.readFileSync(file)], { type: ct }), path.basename(file)); r = await fetch(u, { method: 'PUT', headers: { 'x-upsert': 'true' }, body: fd }); if (r.ok) return; last = r.status + ' ' + (await r.text()).slice(0, 200); } catch (e) { last = String(e.cause || e); }
    await new Promise(x => setTimeout(x, 3000 * i));
  }
  throw new Error('upload ' + last);
}
async function aiPart(J, CH, S) {
  const O = S.outline, mood = CH.mood === 'story' ? 'story' : 'horror';
  let plan = J.plan && J.plan.scenes && J.plan.segments && J.plan.segments.length ? J.plan : null;
  if (!plan) { plan = (await api({ action: 'aiscenes', outline: O, part_no: J.part_no || 1, mood, narrator: CH.voice || 'onyx' })).plan; plan.imgs = {}; await sup({ action: 'w_update', job_id: J.id, plan }); }
  const look = k => { const c = O.characters.find(x => x.key === k); return c ? `${c.key}: ${c.look}` : ''; };
  // character sheet (once per series)
  let ref = null;
  if (S.sheet_url) { const r = await fetch(S.sheet_url); if (r.ok) ref = Buffer.from(await r.arrayBuffer()).toString('base64'); }
  if (!ref) {
    const pr = `${STYLE} ${MOODS[mood]}\nCHARACTER REFERENCE SHEET: these ${O.characters.length} characters standing side by side, full body, front view, neutral pose, evenly spaced, plain soft light-grey background, same scale, clearly separated. Exactly these designs:\n${O.characters.map((c, i) => `${i + 1}. ${c.look}${c.ghost ? ' (a ghost/spirit: pale, glowing eyes, translucent edges)' : ''}`).join('\n')}`;
    const g = await api({ action: 'image', prompt: pr, quality: 'medium' }, 2); ref = g.b64; console.log('sheet via', g.model);
    fs.writeFileSync(path.join(job, 'sheet.jpg'), Buffer.from(ref, 'base64'));
    const u = await sup({ action: 'w_upload', job_id: J.id, names: ['sheet.jpg'] }); await putFile(u['sheet.jpg'].url, path.join(job, 'sheet.jpg'), 'image/jpeg');
    await sup({ action: 'w_series', series_id: S.id, sheet_path: u['sheet.jpg'].path });
  }
  // scene images (reuse saved ones on re-render), 3 at a time
  const todo = plan.scenes.filter(sc => !(plan.imgs || {})[sc.id]);
  for (const sc of plan.scenes.filter(sc => (plan.imgs || {})[sc.id])) { const r = await fetch(plan.imgs[sc.id]); if (r.ok) fs.writeFileSync(path.join(job, 'img', sc.id + '.png'), Buffer.from(await r.arrayBuffer())); else todo.push(sc); }
  let models = new Set();
  for (let i = 0; i < todo.length; i += 3) {
    await Promise.all(todo.slice(i, i + 3).map(async sc => {
      const chars = (sc.chars || []).map(look).filter(Boolean);
      const pr = `${STYLE} ${MOODS[mood]}\nWorld: ${O.world || ''}\n${chars.length ? 'The reference image is ONLY a character model sheet: copy the exact faces, hairstyles, outfits and colors of the characters, but do NOT copy its line-up pose, plain background or composition. Show ONLY these characters (nobody else from the sheet): ' + chars.join(' | ') : 'No people in this shot unless described.'}\nSCENE: ${sc.img}`;
      const g = await api({ action: 'image', prompt: pr, ref: chars.length ? ref : null }, 3); models.add(g.model);
      fs.writeFileSync(path.join(job, 'img', sc.id + '.png'), Buffer.from(g.b64, 'base64'));
    }));
  }
  if (todo.length) {
    console.log('images', todo.length, 'via', [...models].join(','));
    const u = await sup({ action: 'w_upload', job_id: J.id, names: todo.map(sc => sc.id + '.jpg') });
    plan.imgs = plan.imgs || {};
    for (const sc of todo) { await putFile(u[sc.id + '.jpg'].url, path.join(job, 'img', sc.id + '.png'), 'image/jpeg'); plan.imgs[sc.id] = u[sc.id + '.jpg'].pub; }
    await sup({ action: 'w_update', job_id: J.id, plan });
  }
  return plan;
}

async function one() {
  const c = await sup({ action: 'w_claim' });
  if (!c.job) { console.log('no queued job'); return false; }
  const J = c.job, CH = c.channel || {};
  console.log('job', J.id, J.title, J.kind || 'board');
  fs.rmSync(job, { recursive: true, force: true });
  try {
    fs.mkdirSync(path.join(job, 'img'), { recursive: true }); fs.mkdirSync(path.join(job, 'panels'), { recursive: true });
    let plan;
    if (J.kind === 'ai') { if (!c.series) throw new Error('series missing'); plan = await aiPart(J, CH, c.series); } else {
    // 1) storyboard -> panels
    const b = await fetch(c.board_url); if (!b.ok) throw new Error('board download ' + b.status);
    fs.writeFileSync(path.join(job, 'board.png'), Buffer.from(await b.arrayBuffer()));
    sh('python3', [path.join(__dirname, 'crop.py'), path.join(job, 'board.png'), path.join(job, 'panels')]);
    const P = JSON.parse(fs.readFileSync(path.join(job, 'panels', 'panels.json'), 'utf8'));
    if (P.length < 3) throw new Error('image se panels nahi nikle (' + P.length + ') — saaf grid wali storyboard image daalo');
    // 2) plan (reuse saved plan on re-render)
    plan = J.plan && J.plan.segments && J.plan.segments.length ? J.plan : null;
    if (!plan) {
      const panels = P.map(p => { const t = path.join(job, 'panels', p.id + '.jpg'); execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(job, 'panels', p.id + '.png'), '-vf', 'scale=384:-2', '-q:v', '5', t]); return { id: p.id, b64: fs.readFileSync(t).toString('base64') }; });
      plan = (await api({ action: 'plan', story: J.story_text, title: J.title, part: J.part, mood: CH.mood || 'horror', narrator: CH.voice || 'onyx', panels })).plan;
      await sup({ action: 'w_update', job_id: J.id, plan });
    }
    // 3) enhance chosen panels
    const used = new Set([...(plan.hook ? [plan.hook.panel] : []), ...plan.segments.map(g => g.panel)]);
    for (const id of used) {
      const src = path.join(job, 'panels', id + '.png'), dst = path.join(job, 'img', id + '.png');
      let ok = false;
      if (process.env.ESR && fs.existsSync(process.env.ESR)) { try { execFileSync(process.env.ESR, ['-i', src, '-o', dst, '-n', 'realesr-animevideov3', '-s', '4'], { cwd: path.dirname(process.env.ESR), stdio: 'ignore', timeout: 300000 }); ok = fs.existsSync(dst); } catch (_) { } }
      if (!ok) execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', src, '-vf', 'scale=iw*4:ih*4:flags=lanczos,unsharp=5:5:0.8', dst]);
    }
    }
    // 4) voices — young female characters use the fixed free Indic voice (IndicF5), rest OpenAI
    const vOf = g => plan.voices[g.who] || plan.voices.N;
    const f5 = plan.segments.map((g, i) => ({ i, text: g.text, v: vOf(g) })).filter(x => x.v.engine === 'f5');
    if (f5.length && process.env.F5_PY) {
      try {
        fs.writeFileSync(path.join(job, 'f5.json'), JSON.stringify(f5.map(({ i, text }) => ({ i, text }))));
        execFileSync(process.env.F5_PY, [path.join(__dirname, 'tts_f5.py'), path.join(job, 'f5.json'), job], { stdio: 'inherit', timeout: 40 * 60e3 });
        for (const x of f5) { const w = path.join(job, `a${x.i}.wav`); if (fs.existsSync(w)) { sh('ffmpeg', ['-y', '-v', 'error', '-i', w, '-af', 'loudnorm=I=-16:TP=-1.5', '-ar', '44100', '-b:a', '160k', path.join(job, `a${x.i}.mp3`)]); x.done = true; } }
      } catch (e) { console.log('f5 failed → OpenAI fallback:', String(e.message || e).slice(0, 200)); }
    }
    for (let i = 0; i < plan.segments.length; i++) {
      if (fs.existsSync(path.join(job, `a${i}.mp3`))) continue;
      const g = plan.segments[i], v = vOf(g);
      fs.writeFileSync(path.join(job, `a${i}.mp3`), Buffer.from((await api({ action: 'tts', text: g.text, voice: v.voice, style: v.style })).mp3, 'base64'));
    }
    // 5) render
    fs.writeFileSync(path.join(job, 'story.json'), JSON.stringify(plan));
    sh('node', [path.join(__dirname, '..', 'story', 'render.js'), job]);
    // 6) upload + done
    const u = await sup({ action: 'w_upload', job_id: J.id });
    for (const [k, f, ct] of [['video', 'out.mp4', 'video/mp4'], ['thumb', 'thumb.jpg', 'image/jpeg']]) {
      console.log('upload to', new URL(u[k].url).host, new URL(u[k].url).pathname.slice(0, 60));
      let r, last = '';
      for (let i = 1; i <= 3; i++) {
        try {
          const fd = new FormData(); fd.append('cacheControl', '3600'); fd.append('', new Blob([fs.readFileSync(path.join(job, f))], { type: ct }), f);
          r = await fetch(u[k].url, { method: 'PUT', headers: { 'x-upsert': 'true' }, body: fd });
          if (r.ok) break; last = r.status + ' ' + (await r.text()).slice(0, 200);
        } catch (e) { last = String(e.cause || e); }
        await new Promise(x => setTimeout(x, 3000 * i));
      }
      if (!r || !r.ok) throw new Error('upload ' + k + ' ' + last);
    }
    const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(job, 'out.mp4')]).toString().trim());
    await sup({ action: 'w_done', job_id: J.id, video_path: u.video.path, thumb_path: u.thumb.path, duration: dur });
    console.log('done', J.id);
  } catch (e) {
    console.error(e);
    await sup({ action: 'w_fail', job_id: J.id, error: String(e.message || e).slice(0, 500) }).catch(() => { });
    process.exitCode = 1;
  }
  return true;
}
(async () => {
  // stay on duty (GitHub cron is slow): pick up new jobs within ~1 min for up to STAY minutes
  const t0 = Date.now(), STAY = Number(process.env.STAY_MIN || 0) * 60e3; let n = 0;
  for (;;) {
    if (await one()) { n++; continue; }
    if (Date.now() - t0 > STAY) break;
    await new Promise(r => setTimeout(r, 60e3));
  }
  console.log('jobs done:', n);
})().catch(e => { console.error(e); process.exit(1); });
