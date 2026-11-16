// Upload an already-rendered video into an existing studio job and mark it ready (it then posts at its post_at).
// usage (GitHub Actions, OIDC): node studio/upload-ready.js <job_id> <video.mp4>
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const FN = 'https://ceoehwleopykotddcxxk.supabase.co/functions/v1/studio';
async function tok() { const r = await fetch(process.env.ACTIONS_ID_TOKEN_REQUEST_URL + '&audience=studio-worker', { headers: { Authorization: 'bearer ' + process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN } }); return (await r.json()).value; }
async function sup(body) { const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await tok() }, body: JSON.stringify(body) }); const j = await r.json().catch(() => ({ error: 'bad json ' + r.status })); if (j.error) throw new Error(j.error); return j; }
async function put(u, file, ct) { const fd = new FormData(); fd.append('cacheControl', '3600'); fd.append('', new Blob([fs.readFileSync(file)], { type: ct }), path.basename(file)); const r = await fetch(u, { method: 'PUT', headers: { 'x-upsert': 'true' }, body: fd }); if (!r.ok) throw new Error('upload ' + r.status + ' ' + (await r.text()).slice(0, 200)); }
(async () => {
  const [id, mp4] = process.argv.slice(2);
  const thumb = path.join(path.dirname(mp4), 'thumb.jpg');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', '3', '-i', mp4, '-frames:v', '1', '-q:v', '3', thumb]);
  const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString().trim());
  const u = await sup({ action: 'w_upload', job_id: id });
  await put(u.video.url, mp4, 'video/mp4'); await put(u.thumb.url, thumb, 'image/jpeg');
  await sup({ action: 'w_done', job_id: id, video_path: u.video.path, thumb_path: u.thumb.path, duration: dur, cost: { usd: 0, steps: {} } });
  console.log('ready', id, dur);
})().catch((e) => { console.error(e); process.exit(1); });
