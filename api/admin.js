// Admin stats. GET with header x-admin-pass (env ADMIN_PASS). Returns funnel, daily trend, sources, payments, leads.
const { send } = require('./_u');
const kv = require('./_kv');
const limited = require('./_rl');
const crypto = require('crypto');
const eq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
module.exports = async (req, res) => {
  const pass = process.env.ADMIN_PASS;
  if (!pass) return send(res, 503, { ok: false, error: 'ADMIN_PASS set nahi hai (Vercel env var)' });
  if (limited(req, 'adm', 40, 10 * 60e3)) return send(res, 429, { ok: false });
  if (!eq(req.headers['x-admin-pass'] || '', pass)) return send(res, 401, { ok: false, error: 'wrong password' });
  if (!kv.on()) return send(res, 503, { ok: false, error: 'KV store connect nahi hai (Vercel Storage > Upstash Redis)' });
  try {
    const evs = ['land_view', 'chat_msg', 'lead', 'dl_click', 'app_open', 'lesson_start', 'lesson_done', 'quiz_pass', 'paywall_view', 'pay_click', 'paid', 'guru_q', 'guru_limit', 'cl_start', 'cl_done'];
    const days = []; for (let i = 13; i >= 0; i--) days.push(kv.istDay(Date.now() - i * 864e5));
    const c = [];
    evs.forEach(e => { c.push(['GET', 'ev:' + e]); c.push(['SCARD', 's:' + e]); });
    for (let n = 1; n <= 30; n++) { c.push(['SCARD', 's:lesson_start:' + n]); c.push(['SCARD', 's:lesson_done:' + n]); c.push(['SCARD', 's:quiz_pass:' + n]); }
    for (let n = 1; n <= 30; n++) { c.push(['SCARD', 's:cl_start:' + n]); c.push(['SCARD', 's:cl_done:' + n]); }
    days.forEach(d => ['land_view', 'dl_click', 'app_open', 'paid'].forEach(e => c.push(['SCARD', 'sd:' + d + ':' + e])));
    c.push(['HGETALL', 'src:land_view']); c.push(['HGETALL', 'src:dl_click']); c.push(['SCARD', 'users']);
    c.push(['LRANGE', 'leads', 0, 49]); c.push(['LRANGE', 'sales', 0, 49]); c.push(['GET', 'rev:total']); c.push(['GET', 'rev:course']); c.push(['GET', 'rev:guru']);
    const r = await kv.pipe(c); let i = 0;
    const tot = {}; evs.forEach(e => { tot[e] = { hits: +r[i++] || 0, uniq: +r[i++] || 0 }; });
    const les = []; for (let n = 1; n <= 30; n++) les.push({ n, start: +r[i++] || 0, done: +r[i++] || 0, quiz: +r[i++] || 0 });
    const cl = []; for (let n = 1; n <= 30; n++) cl.push({ n, start: +r[i++] || 0, done: +r[i++] || 0 });
    const trend = days.map(d => { const o = { d }; ['land_view', 'dl_click', 'app_open', 'paid'].forEach(e => { o[e] = +r[i++] || 0; }); return o; });
    const pairs = a => { const o = {}; for (let k = 0; a && k < a.length; k += 2) o[a[k]] = +a[k + 1]; return o; };
    const srcV = pairs(r[i++]), srcD = pairs(r[i++]), users = +r[i++] || 0;
    const parse = a => (a || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
    send(res, 200, { ok: true, users, tot, les, cl, trend, srcV, srcD, leads: parse(r[i++]), sales: parse(r[i++]), rev: { total: +r[i++] || 0, course: +r[i++] || 0, guru: +r[i++] || 0 } });
  } catch (e) { send(res, 502, { ok: false, error: String(e.message || e) }); }
};
