// One serverless function for the small endpoints (Vercel Hobby allows only 12 functions).
// vercel.json rewrites /api/ev, /api/dl, /api/lead, /api/sales, /api/admin, /api/hist to /api/hub?r=<name>
const R = { ev: require('../lib/ev'), dl: require('../lib/dl'), lead: require('../lib/lead'), sales: require('../lib/sales'), admin: require('../lib/admin'), hist: require('../lib/hist'), shorts: require('../lib/shorts') };
module.exports = (req, res) => {
  const u = new URL(req.url, 'http://x'), r = u.searchParams.get('r') || '';
  if (!Object.prototype.hasOwnProperty.call(R, r)) { res.statusCode = 404; res.setHeader('Content-Type', 'application/json'); return res.end('{"ok":false}'); }
  u.searchParams.delete('r');
  req.url = '/api/' + r + (u.searchParams.toString() ? '?' + u.searchParams.toString() : '');
  return R[r](req, res);
};
