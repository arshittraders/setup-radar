// Studio bridge for the B3D night render (GitHub OIDC → Supabase "studio" function, same auth as studio/worker.js).
// node b3d/studio_io.js claim              → prints {"job":{...}} (only kind "b3d"), or {"job":null}
// node b3d/studio_io.js done <job_id> <dir> → uploads <dir>/out.mp4 + <dir>/thumb.jpg, marks the job ready
// node b3d/studio_io.js fail <job_id> <msg>
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const FN = process.env.STUDIO_FN || 'https://ceoehwleopykotddcxxk.supabase.co/functions/v1/studio';
async function oidc() {
  const u = process.env.ACTIONS_ID_TOKEN_REQUEST_URL, t = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!u || !t) throw new Error('no OIDC (needs permissions: id-token: write)');
  const r = await fetch(u + '&audience=studio-worker', { headers: { Authorization: 'bearer ' + t } }); return (await r.json()).value;
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
    await new Promise((x) => setTimeout(x, 3000 * i));
  }
  throw new Error('upload ' + last);
}
(async () => {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === 'claim') { const j = await sup({ action: 'w_claim', kind: 'b3d' }); console.log(JSON.stringify({ job: j.job || null, channel: j.channel || null })); return; }
  if (cmd === 'done') {
    const u = await sup({ action: 'w_upload', job_id: a });
    await put(u.video.url, path.join(b, 'out.mp4'), 'video/mp4'); await put(u.thumb.url, path.join(b, 'thumb.jpg'), 'image/jpeg');
    const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(b, 'out.mp4')]).toString().trim());
    await sup({ action: 'w_done', job_id: a, video_path: u.video.path, thumb_path: u.thumb.path, duration: dur, cost: { usd: 0, steps: { b3d: 0 } } });
    console.log('done', a); return;
  }
  if (cmd === 'fail') { await sup({ action: 'w_fail', job_id: a, error: String(b || 'b3d failed').slice(0, 500), cost: { usd: 0, steps: {} } }); console.log('failed', a); return; }
  throw new Error('usage: claim | done <job> <dir> | fail <job> <msg>');
})().catch((e) => { console.error(e); process.exit(1); });
