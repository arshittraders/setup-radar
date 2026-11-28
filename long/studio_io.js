// Studio bridge for long episodes (GitHub OIDC → Supabase "studio" function, same auth as studio/worker.js).
// node long/studio_io.js claim                → {"job":{...}} of kind "long" or {"job":null}
// node long/studio_io.js done <job_id> <dir>  → uploads out.mp4 + thumb.jpg, sends chapters.txt, marks the job ready
// node long/studio_io.js fail <job_id> <msg>
const fs = require('fs'), path = require('path');
const FN = process.env.STUDIO_FN || 'https://ceoehwleopykotddcxxk.supabase.co/functions/v1/studio';
async function oidc() {
  const u = process.env.ACTIONS_ID_TOKEN_REQUEST_URL, t = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!u || !t) throw new Error('no OIDC (needs permissions: id-token: write)');
  return (await (await fetch(u + '&audience=studio-worker', { headers: { Authorization: 'bearer ' + t } })).json()).value;
}
async function sup(body) {
  const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await oidc() }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ error: 'bad json ' + r.status })); if (j.error) throw new Error('studio: ' + j.error); return j;
}
async function put(url, file, ct) {
  let last = '';
  for (let i = 1; i <= 3; i++) {
    try { const fd = new FormData(); fd.append('cacheControl', '3600'); fd.append('', new Blob([fs.readFileSync(file)], { type: ct }), path.basename(file));
      const r = await fetch(url, { method: 'PUT', headers: { 'x-upsert': 'true' }, body: fd }); if (r.ok) return; last = r.status + ' ' + (await r.text()).slice(0, 200); } catch (e) { last = String(e); }
    await new Promise((x) => setTimeout(x, 4000 * i));
  }
  throw new Error('upload ' + last);
}
(async () => {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === 'claim') { const j = await sup({ action: 'w_claim', kind: 'long' }); console.log(JSON.stringify({ job: j.job || null })); return; }
  if (cmd === 'done') {
    const u = await sup({ action: 'w_upload', job_id: a });
    // 8-10 min episodes are ~200 MB → too big for Supabase storage; VIDEO_URL = public GitHub release asset (Studio's pub() accepts full URLs, ytUpload streams it)
    const VIDEO_URL = process.env.VIDEO_URL || ''; if (!VIDEO_URL) await put(u.video.url, path.join(b, 'out.mp4'), 'video/mp4');
    await put(u.thumb.url, path.join(b, 'thumb.jpg'), 'image/jpeg');
    const meta = JSON.parse(fs.readFileSync(path.join(b, 'meta.json'), 'utf8'));
    await sup({ action: 'w_done', job_id: a, video_path: VIDEO_URL || u.video.path, thumb_path: u.thumb.path, duration: meta.duration, chapters: fs.readFileSync(path.join(b, 'chapters.txt'), 'utf8'), cost: { usd: 0, steps: { long: 0 } } });
    console.log('done', a, meta.duration, 's'); return;
  }
  if (cmd === 'fail') { await sup({ action: 'w_fail', job_id: a, error: String(b || 'long render failed').slice(0, 500), cost: { usd: 0, steps: {} } }); console.log('failed', a); return; }
  throw new Error('usage: claim | done <job> <dir> | fail <job> <msg>');
})().catch((e) => { console.error(e); process.exit(1); });
