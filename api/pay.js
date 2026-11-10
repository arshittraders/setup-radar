// Razorpay payments (Kiwtech's Razorpay account). Env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, optional RAZORPAY_WEBHOOK_SECRET.
// POST {a:'order',plan,id} | {a:'verify',order_id,payment_id,signature,plan,id} | {a:'check',lic} | {a:'restore',q}; POST ?hook=1 = Razorpay webhook
const crypto = require('crypto');
const { send } = require('./_u');
const kv = require('./_kv');
const limited = require('./_rl');
const { PLANS, issue, plansFor } = require('./_lic');
const RZ = process.env.RAZORPAY_BASE || 'https://api.razorpay.com';
const hm = (secret, s) => crypto.createHmac('sha256', secret).update(s).digest('hex');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
async function raw(req) { if (req.rawBody) return String(req.rawBody); if (typeof req.body === 'string') return req.body; return JSON.stringify(req.body || {}); }
module.exports = async (req, res) => {
  const KID = process.env.RAZORPAY_KEY_ID, KS = process.env.RAZORPAY_KEY_SECRET;
  if (req.method === 'GET') return send(res, 200, { ok: !!(KID && KS && kv.on()), razorpay: !!(KID && KS), kv: kv.on() });
  if (!KID || !KS) return send(res, 503, { ok: false, error: 'Payment abhi shuru nahi hua (RAZORPAY keys set nahi)' });
  if (!kv.on()) return send(res, 503, { ok: false, error: 'Store connect nahi hai' });
  const u = new URL(req.url, 'http://x');
  try {
    if (u.searchParams.get('hook')) {
      const ws = process.env.RAZORPAY_WEBHOOK_SECRET; const body = await raw(req);
      if (!ws || !same(req.headers['x-razorpay-signature'] || '', hm(ws, body))) return send(res, 401, { ok: false });
      const ev = JSON.parse(body); const p = ev.payload && ev.payload.payment && ev.payload.payment.entity;
      if (ev.event === 'payment.captured' && p && p.notes && PLANS[p.notes.plan]) await issue(p.notes.plan, p.id, p.notes.uid, p.amount);
      return send(res, 200, { ok: true });
    }
    if (limited(req, 'pay', 40, 10 * 60e3)) return send(res, 429, { ok: false, error: 'Thodi der baad try karo' });
    let b = req.body; if (typeof b === 'string') b = JSON.parse(b || '{}'); if (!b || typeof b !== 'object') b = {};
    const plan = PLANS[b.plan] ? b.plan : '';
    if (b.a === 'order') {
      if (!plan) return send(res, 400, { ok: false, error: 'plan galat' });
      const uid = String(b.id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
      const r = await fetch(RZ + '/v1/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(KID + ':' + KS).toString('base64') }, body: JSON.stringify({ amount: PLANS[plan].amt, currency: 'INR', receipt: 'sr_' + Date.now(), notes: { plan, uid, app: 'setup-radar' } }) });
      const j = await r.json();
      if (!r.ok) return send(res, 502, { ok: false, error: 'Razorpay: ' + String((j.error && j.error.description) || r.status).slice(0, 160) });
      await kv.pipe([['INCR', 'ev:pay_click'], ['INCR', 'evd:' + kv.istDay() + ':pay_click'], ['SADD', 's:pay_click', uid || j.id]]);
      return send(res, 200, { ok: true, key: KID, order_id: j.id, amount: j.amount, plan, name: 'Kiwtech · Setup Radar', description: PLANS[plan].label });
    }
    if (b.a === 'verify') {
      const oid = String(b.order_id || ''), pid = String(b.payment_id || '');
      if (!plan || !/^order_/.test(oid) || !/^pay_/.test(pid) || !same(b.signature || '', hm(KS, oid + '|' + pid))) return send(res, 400, { ok: false, error: 'Payment verify nahi hua' });
      const o = await issue(plan, pid, String(b.id || '').slice(0, 24));
      return send(res, 200, { ok: true, ...o });
    }
    if (b.a === 'check') { const p = await plansFor(b.lic); return send(res, 200, { ok: true, ...p }); }
    if (b.a === 'restore') {
      const q = String(b.q || '').trim();
      if (/^pay_/.test(q)) { const x = await kv.cmd(['GET', 'pay:' + q]); if (x) return send(res, 200, { ok: true, ...JSON.parse(x) }); }
      const k = q.toUpperCase(); if (/^SR-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(k)) { const v = await kv.cmd(['GET', 'lic:' + k]); if (v) { const o = JSON.parse(v); return send(res, 200, { ok: true, lic: k, plan: o.plan, exp: o.exp }); } }
      return send(res, 404, { ok: false, error: 'Key ya payment id nahi mili' });
    }
    send(res, 400, { ok: false });
  } catch (e) { send(res, 502, { ok: false, error: String(e.message || e).slice(0, 160) }); }
};
