// Shared helpers for Setup Radar's Upstox backend. The token never leaves the server.
const zlib = require('zlib');
const BASE = process.env.UPSTOX_BASE || 'https://api.upstox.com';
const IDX = {
  nifty:     { key: 'NSE_INDEX|Nifty 50',   name: 'NIFTY',     seg: 'NSE_FO', file: 'NSE' },
  banknifty: { key: 'NSE_INDEX|Nifty Bank', name: 'BANKNIFTY', seg: 'NSE_FO', file: 'NSE' },
  sensex:    { key: 'BSE_INDEX|SENSEX',     name: 'SENSEX',    seg: 'BSE_FO', file: 'BSE' }
};
const ISTDATE = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

async function up(path, params) {
  const token = process.env.UPSTOX_TOKEN;
  if (!token) { const e = new Error('UPSTOX_TOKEN set nahi hai'); e.code = 'NO_TOKEN'; throw e; }
  const u = new URL(BASE + path);
  Object.entries(params || {}).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u, { headers: { Accept: 'application/json', Authorization: 'Bearer ' + token } });
  const txt = await r.text();
  let j; try { j = JSON.parse(txt); } catch (x) { j = { raw: txt.slice(0, 200) }; }
  if (!r.ok) { const e = new Error('Upstox ' + r.status + ': ' + JSON.stringify(j).slice(0, 300)); e.status = r.status; throw e; }
  return j;
}

// nearest-expiry futures key per index (from the public instrument master), cached per server instance
const futCache = {};
async function futKey(ix) {
  const env = process.env['FUT_' + ix.toUpperCase()];
  if (env) return env;
  const c = futCache[ix];
  if (c && c.exp > Date.now() + 3600e3 && c.day === ISTDATE()) return c.key;
  const d = IDX[ix];
  const r = await fetch(`https://assets.upstox.com/market-quote/instruments/exchange/${d.file}.json.gz`);
  if (!r.ok) throw new Error('Instrument file nahi mili: ' + r.status);
  const list = JSON.parse(zlib.gunzipSync(Buffer.from(await r.arrayBuffer())).toString('utf8'));
  const now = Date.now();
  const futs = list.filter(x => x.segment === d.seg && x.instrument_type === 'FUT' &&
    (x.underlying_symbol === d.name || (x.name || '').toUpperCase() === d.name) && x.expiry > now - 6 * 3600e3)
    .sort((a, b) => a.expiry - b.expiry);
  if (!futs.length) throw new Error('Futures contract nahi mila: ' + ix);
  futCache[ix] = { key: futs[0].instrument_key, exp: futs[0].expiry, day: ISTDATE(), sym: futs[0].trading_symbol };
  return futs[0].instrument_key;
}

// quotes endpoint keys data by "EXCH:SYMBOL"; match back using instrument_token
function byToken(data) {
  const m = {};
  Object.values((data && data.data) || {}).forEach(v => { if (v && v.instrument_token) m[v.instrument_token] = v; });
  return m;
}
function send(res, code, obj, cache) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache || 'no-store');
  res.end(JSON.stringify(obj));
}
function fail(res, e) { send(res, e.code === 'NO_TOKEN' ? 503 : 502, { ok: false, error: String(e.message || e) }); }

const crypto = require('crypto');
// Live Upstox data is for the owner only. Without LIVE_PASS set, or without the right x-live-pass header, the API stays closed.
function guard(handler) {
  return async (req, res) => {
    const want = process.env.LIVE_PASS || '';
    const got = String((req.headers && req.headers['x-live-pass']) || '');
    const a = Buffer.from(want), b = Buffer.from(got);
    const ok = want.length >= 6 && a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!ok) { res.statusCode = 403; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: false, error: 'live off' })); return; }
    return handler(req, res);
  };
}
module.exports = { guard, up, IDX, futKey, byToken, send, fail, ISTDATE, futCache };
