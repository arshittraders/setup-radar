// License helpers shared by pay.js and guru.js
const kv = require('./_kv');
const PLANS = { course: { amt: 69900, label: 'Setup Radar: Poora Course (30 lessons)' }, guru: { amt: 29900, label: 'Setup Radar: AI Guru (30 din)', days: 30 } };
function mk() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; const b = require('crypto').randomBytes(10); for (let i = 0; i < 10; i++) s += A[b[i] % A.length]; return 'SR-' + s.slice(0, 5) + '-' + s.slice(5); }
// header value: comma separated license keys -> best plan + expiry
async function plansFor(hdr) {
  const keys = String(hdr || '').split(',').map(s => s.trim().toUpperCase()).filter(k => /^SR-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(k)).slice(0, 4);
  const out = { course: false, guru: false, guruExp: 0 };
  if (!keys.length || !kv.on()) return out;
  const r = await kv.pipe(keys.map(k => ['GET', 'lic:' + k]));
  r.forEach(v => { if (!v) return; try { const o = JSON.parse(v); if (o.plan === 'course') out.course = true; if (o.plan === 'guru' && o.exp > Date.now()) { out.guru = true; out.guruExp = Math.max(out.guruExp, o.exp); } } catch (e) {} });
  return out;
}
async function issue(plan, pid, uid, amt) {
  const ex = await kv.cmd(['GET', 'pay:' + pid]);
  if (ex) return JSON.parse(ex);
  const p = PLANS[plan]; if (!p) throw new Error('plan');
  const key = mk(), now = Date.now(), rec = { plan, t: now, pid, exp: p.days ? now + p.days * 864e5 : 0 };
  const sale = JSON.stringify({ t: now, plan, amt: Math.round((amt || p.amt) / 100), uid: String(uid || '').slice(0, 8), pid: String(pid).slice(-6) });
  const out = { lic: key, plan, exp: rec.exp };
  const set = await kv.cmd(['SET', 'pay:' + pid, JSON.stringify(out), 'NX']);
  if (!set) { return JSON.parse(await kv.cmd(['GET', 'pay:' + pid])); }
  await kv.pipe([['SET', 'lic:' + key, JSON.stringify(rec)], ['INCRBY', 'rev:total', Math.round((amt || p.amt) / 100)], ['INCRBY', 'rev:' + plan, Math.round((amt || p.amt) / 100)], ['LPUSH', 'sales', sale], ['LTRIM', 'sales', 0, 499], ['INCR', 'ev:paid'], ['INCR', 'evd:' + kv.istDay() + ':paid'], ['SADD', 's:paid', uid || pid], ['SADD', 'sd:' + kv.istDay() + ':paid', uid || pid]]);
  return out;
}
module.exports = { PLANS, plansFor, issue };
