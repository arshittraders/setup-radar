// Tracked APK download: /api/dl?s=<source>&id=<anon id>. Logs the click, then redirects to the APK file.
const kv = require('./_kv');
module.exports = async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    const src = (u.searchParams.get('s') || 'direct').replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 24) || 'direct';
    const id = (u.searchParams.get('id') || 'dl' + Math.random().toString(36).slice(2, 12)).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
    if (kv.on()) {
      const d = kv.istDay();
      await kv.pipe([['INCR', 'ev:dl_click'], ['INCR', 'evd:' + d + ':dl_click'], ['SADD', 's:dl_click', id], ['SADD', 'sd:' + d + ':dl_click', id], ['HINCRBY', 'src:dl_click', src, 1], ['HSETNX', 'u:' + id, 'first', Date.now()], ['HSETNX', 'u:' + id, 'src', src], ['SADD', 'users', id]]);
    }
  } catch (e) {}
  res.statusCode = 302; res.setHeader('Location', '/apk/SetupRadar.apk'); res.setHeader('Cache-Control', 'no-store'); res.end();
};
