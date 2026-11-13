// Build one short end-to-end: fetch script + voice from /api/shorts, then render.
// usage: OIDC=<token> node shorts/make.js <lesson|candle|news> <day> <outdir>
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const API = process.env.SHORTS_API || 'https://setup-radar.vercel.app/api/shorts';
const [kind, dayArg, outArg] = process.argv.slice(2);
const day = Number(dayArg) || 1;
const out = path.resolve(outArg || 'job');
fs.mkdirSync(out, { recursive: true });

async function call(body, tries = 3) {
  for (let i = 1; ; i++) {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.OIDC }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({ ok: false, error: 'bad json ' + r.status }));
    if (j.ok) return j;
    if (i >= tries) throw new Error(JSON.stringify(j).slice(0, 400));
    await new Promise(r => setTimeout(r, 4000 * i));
  }
}

(async () => {
  let S, sources;
  if (kind === 'news') { const j = await call({ action: 'news' }); S = j.script; sources = j.sources; }
  else {
    const fixed = path.join(__dirname, 'scripts', `${kind}-${String(day).padStart(2, '0')}.json`);
    if (fs.existsSync(fixed)) {
      const CUR = require('./curriculum.json'), c = (kind === 'candle' ? CUR.candles : CUR.lessons)[day - 1];
      S = { kind, day, topic: c.t, bias: c.bias, shape: c.shape, badge: (kind === 'candle' ? 'CANDLE ' : 'LESSON ') + String(day).padStart(2, '0') + ' / 90', ...JSON.parse(fs.readFileSync(fixed, 'utf8')) };
    } else S = (await call({ action: 'script', kind, day })).script;
  }
  if (!Array.isArray(S.scenes) || S.scenes.length < 3) throw new Error('bad script');
  S.scenes = S.scenes.slice(0, 7);

  const nx = day + 1;
  const fixedOutro = S.outroSay;
  if (kind === 'lesson') { S.next = day < 90 ? `Kal: Lesson ${nx}/90 🔥` : '90 din poore! 🎉'; S.outroSay = day < 90 ? `रोज़ एक नया lesson। Follow करो और Setup Radar app free में download करो, link bio में है। कल मिलते हैं Lesson ${nx} में!` : `बधाई हो, आपने 90 दिन पूरे किए! Setup Radar app पर practice जारी रखो, link bio में है।`; }
  else if (kind === 'candle') { S.next = day < 90 ? `Kal: Candle ${nx}/90 🕯️` : '90 candles poori! 🎉'; S.outroSay = day < 90 ? `ऐसे ही रोज़ एक नई candle सीखो। Follow करो, और Setup Radar app free में, link bio में। कल मिलते हैं Candle ${nx} में!` : `90 candles पूरी! Setup Radar app पर chart practice जारी रखो, link bio में है।`; }
  else { S.next = 'Roz subah 8:30 baje 📰'; S.outroSay = `ऐसी ही रोज़ की market news के लिए follow करो। F&O सीखना है तो Setup Radar app free में, link bio में है।`; }

  if (fixedOutro) S.outroSay = fixedOutro;
  const V = { voice: process.env.VOICE || undefined, style: process.env.STYLE || undefined };
  for (let i = 0; i < S.scenes.length; i++) {
    const j = await call({ action: 'tts', text: S.scenes[i].say, ...V });
    fs.writeFileSync(path.join(out, `a${i}.mp3`), Buffer.from(j.mp3, 'base64'));
  }
  fs.writeFileSync(path.join(out, 'outro.mp3'), Buffer.from((await call({ action: 'tts', text: S.outroSay, ...V })).mp3, 'base64'));
  fs.writeFileSync(path.join(out, 'script.json'), JSON.stringify(S, null, 1));
  if (sources) fs.writeFileSync(path.join(out, 'sources.json'), JSON.stringify(sources, null, 1));
  execFileSync('node', [path.join(__dirname, 'render.js'), out], { stdio: 'inherit' });
  // caption file for posting
  const seo = require('./seo').build(S);
  fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify({ kind, day: S.day, ...seo }, null, 1));
  console.log('TITLE:', S.title);
})().catch(e => { console.error(e); process.exit(1); });
