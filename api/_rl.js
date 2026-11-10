// tiny best-effort per-IP rate limit (per server instance) to protect the OpenAI bill
const hits = new Map();
module.exports = function limited(req, bucket, max, windowMs) {
  const ip = String((req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')).split(',')[0].trim();
  const k = bucket + '|' + ip, now = Date.now();
  const arr = (hits.get(k) || []).filter(t => now - t < windowMs);
  arr.push(now); hits.set(k, arr);
  if (hits.size > 5000) for (const [kk, v] of hits) if (!v.length || now - v[v.length - 1] > windowMs) hits.delete(kk);
  return arr.length > max;
};
