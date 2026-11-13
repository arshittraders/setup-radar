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
const sh = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });

(async () => {
  const c = await sup({ action: 'w_claim' });
  if (!c.job) { console.log('no queued job'); fs.writeFileSync(path.join(process.cwd(), 'NOJOB'), '1'); return; }
  const J = c.job, CH = c.channel || {};
  console.log('job', J.id, J.title);
  try {
    fs.mkdirSync(path.join(job, 'img'), { recursive: true }); fs.mkdirSync(path.join(job, 'panels'), { recursive: true });
    // 1) storyboard -> panels
    const b = await fetch(c.board_url); if (!b.ok) throw new Error('board download ' + b.status);
    fs.writeFileSync(path.join(job, 'board.png'), Buffer.from(await b.arrayBuffer()));
    sh('python3', [path.join(__dirname, 'crop.py'), path.join(job, 'board.png'), path.join(job, 'panels')]);
    const P = JSON.parse(fs.readFileSync(path.join(job, 'panels', 'panels.json'), 'utf8'));
    if (P.length < 3) throw new Error('image se panels nahi nikle (' + P.length + ') — saaf grid wali storyboard image daalo');
    // 2) plan (reuse saved plan on re-render)
    let plan = J.plan && J.plan.segments && J.plan.segments.length ? J.plan : null;
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
    // 4) voices
    for (let i = 0; i < plan.segments.length; i++) {
      const g = plan.segments[i], v = plan.voices[g.who] || plan.voices.N;
      fs.writeFileSync(path.join(job, `a${i}.mp3`), Buffer.from((await api({ action: 'tts', text: g.text, voice: v.voice, style: v.style })).mp3, 'base64'));
    }
    // 5) render
    fs.writeFileSync(path.join(job, 'story.json'), JSON.stringify(plan));
    sh('node', [path.join(__dirname, '..', 'story', 'render.js'), job]);
    // 6) upload + done
    const u = await sup({ action: 'w_upload', job_id: J.id });
    for (const [k, f, ct] of [['video', 'out.mp4', 'video/mp4'], ['thumb', 'thumb.jpg', 'image/jpeg']]) {
      const r = await fetch(u[k].url, { method: 'PUT', headers: { 'Content-Type': ct, 'x-upsert': 'true' }, body: fs.readFileSync(path.join(job, f)) });
      if (!r.ok) throw new Error('upload ' + k + ' ' + r.status + ' ' + (await r.text()).slice(0, 200));
    }
    const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(job, 'out.mp4')]).toString().trim());
    await sup({ action: 'w_done', job_id: J.id, video_path: u.video.path, thumb_path: u.thumb.path, duration: dur });
    console.log('done', J.id);
  } catch (e) {
    console.error(e);
    await sup({ action: 'w_fail', job_id: J.id, error: String(e.message || e).slice(0, 500) }).catch(() => { });
    process.exit(1);
  }
})().catch(e => { console.error(e); process.exit(1); });
