// Anonymous usage events. POST {id, e, n?, src?} -> counters + unique sets. No personal data.
const { send } = require('../api/_u');
const kv = require('../api/_kv');
const limited = require('../api/_rl');
const OK = new Set(['land_view', 'chat_msg', 'dl_click', 'app_open', 'lesson_start', 'lesson_done', 'quiz_pass', 'paywall_view', 'pay_click', 'paid', 'guru_q', 'guru_limit', 'cl_start', 'cl_done']);
module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (!kv.on()) return send(res, 200, { ok: false, off: true });
  if (limited(req, 'ev', 120, 10 * 60e3)) return send(res, 429, { ok: false });
  try {
    let b = req.body; if (typeof b === 'string') b = JSON.parse(b || '{}'); if (!b || typeof b !== 'object') b = {};
    const id = String(b.id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24), e = String(b.e || '');
    if (id.length < 8 || !OK.has(e)) return send(res, 400, { ok: false });
    const src = String(b.src || 'direct').replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 24) || 'direct';
    const n = Math.max(0, Math.min(30, parseInt(b.n, 10) || 0)), d = kv.istDay(), now = Date.now();
    const c = [
      ['INCR', 'ev:' + e], ['INCR', 'evd:' + d + ':' + e], ['SADD', 's:' + e, id], ['SADD', 'sd:' + d + ':' + e, id],
      ['HSETNX', 'u:' + id, 'first', now], ['HSET', 'u:' + id, 'last', now], ['HSETNX', 'u:' + id, 'src', src], ['SADD', 'users', id]
    ];
    if (n && (e === 'lesson_start' || e === 'lesson_done' || e === 'quiz_pass' || e === 'cl_start' || e === 'cl_done')) {
      c.push(['SADD', 's:' + e + ':' + n, id]);
      if (e === 'lesson_done') c.push(['HSET', 'u:' + id, 'lesson', n]);
    }
    if (e === 'paid') c.push(['HSET', 'u:' + id, 'paid', now]);
    if (e === 'dl_click' || e === 'land_view') c.push(['HINCRBY', 'src:' + e, src, 1]);
    await kv.pipe(c);
    send(res, 200, { ok: true });
  } catch (x) { send(res, 200, { ok: false }); }
};
