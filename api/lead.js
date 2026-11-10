// Optional lead capture from the landing page: {name, phone, src}. Stored for the admin (and your follow-up).
const { send } = require('./_u');
const kv = require('./_kv');
const limited = require('./_rl');
module.exports = async (req, res) => {
  if (!kv.on()) return send(res, 200, { ok: false, off: true });
  if (limited(req, 'lead', 6, 10 * 60e3)) return send(res, 429, { ok: false });
  try {
    let b = req.body; if (typeof b === 'string') b = JSON.parse(b || '{}'); if (!b || typeof b !== 'object') b = {};
    const phone = String(b.phone || '').replace(/\D/g, '').slice(-10);
    if (phone.length !== 10) return send(res, 400, { ok: false, error: '10 digit number daalo' });
    const rec = { t: Date.now(), name: String(b.name || '').slice(0, 40), phone, src: String(b.src || 'direct').replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 24) };
    await kv.pipe([['LPUSH', 'leads', JSON.stringify(rec)], ['LTRIM', 'leads', 0, 999], ['INCR', 'ev:lead'], ['INCR', 'evd:' + kv.istDay() + ':lead']]);
    send(res, 200, { ok: true });
  } catch (e) { send(res, 200, { ok: false }); }
};
