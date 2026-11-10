// Tiny Upstash/Vercel-KV REST client (no SDK). Env: KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/TOKEN)
const URL_ = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOK = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const on = () => !!(URL_() && TOK());
async function cmd(args) { const r = await pipe([args]); return r[0]; }
async function pipe(cmds) {
  if (!on()) { const e = new Error('KV not configured'); e.code = 'NO_KV'; throw e; }
  const r = await fetch(URL_().replace(/\/$/, '') + '/pipeline', {
    method: 'POST', headers: { Authorization: 'Bearer ' + TOK(), 'Content-Type': 'application/json' }, body: JSON.stringify(cmds)
  });
  if (!r.ok) throw new Error('KV ' + r.status);
  const j = await r.json();
  return j.map(x => { if (x.error) throw new Error('KV: ' + x.error); return x.result; });
}
const istDay = (d) => new Date((d || Date.now()) + 5.5 * 3600e3).toISOString().slice(0, 10);
module.exports = { on, cmd, pipe, istDay };
