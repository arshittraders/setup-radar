// Turn a backtest result (shorts/backtest.js) into a short's script: honest numbers, no tips.
const MON = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
const MONR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const hd = d => { const [, m, dd] = d.split('-').map(Number); return `${dd} ${MON[m - 1]}`; };
const rd = d => { const [, m, dd] = d.split('-').map(Number); return `${dd} ${MONR[m - 1]}`; };
const abs = Math.abs;

function build(B, day) {
  const st = B.setup, months = Math.max(1, Math.round(B.tradingDays / 21));
  const plus = B.net > 0, pf = B.losses ? (B.wins * B.avgWin) / abs(B.losses * B.avgLoss || 1) : 9;
  const exitHi = r => r === 'TGT' ? 'target लगा' : r === 'SL' ? 'stop loss लगा' : 'सवा तीन बजे exit हुआ';
  const sideHi = d => d > 0 ? 'buy' : 'sell';
  const scenes = [];
  scenes.push({ vis: 'hook', show: `${B.n} baar bana… kitni baar jeeta?`, sub: st.name,
    say: `${st.name}। पिछले ${months} महीने में Nifty पर ये setup ${B.n} बार बना। लेकिन कितनी बार सच में पैसा बना? आख़िर तक देखो!` });
  scenes.push({ vis: 'rules', tag: 'NIYAM', show: st.short, rules: st.rules, say: st.rulesSay });
  scenes.push({ vis: 'stats', tag: 'RESULT', show: `${B.winPct}% jeet`, sub: `${B.n} trade · ${rd(B.from)} – ${rd(B.to)}`,
    say: `अब result। ${B.n} trades में ${B.wins} जीते और ${B.losses} हारे, यानी ${B.winPct} प्रतिशत जीत। Target ${B.tgtHits} बार लगा, stop loss ${B.slHits} बार।` });
  scenes.push({ vis: 'money', tag: plus ? 'NET PLUS' : 'NET MINUS', show: `${plus ? '+' : '−'}${abs(B.net)} points`, sub: `Brokerage + slippage (${B.costPts} pts/trade) jodkar`,
    say: `Average जीत ${Math.round(B.avgWin)} points की, और average हार ${Math.round(abs(B.avgLoss))} points की। खर्चा जोड़कर कुल ${plus ? 'फ़ायदा' : 'नुकसान'} ${abs(B.net)} points। और एक बार लगातार ${B.maxLossStreak} trades हारे भी।` });
  if (B.exWin) scenes.push({ vis: 'chart', ex: 'win', tag: 'JEET ✅', show: `${rd(B.exWin.d)}: +${Math.round(B.exWin.pts)} pts`, sub: `${B.exWin.dir > 0 ? 'BUY' : 'SELL'} @ ${B.exWin.entry}`,
    say: `ये देखो ${hd(B.exWin.d)} का दिन। यहाँ ${sideHi(B.exWin.dir)} की entry बनी, और ${exitHi(B.exWin.res)}। ${Math.round(B.exWin.pts)} points का फ़ायदा।` });
  if (B.exLoss) scenes.push({ vis: 'chart', ex: 'loss', tag: 'HAAR ❌', show: `${rd(B.exLoss.d)}: ${Math.round(B.exLoss.pts)} pts`, sub: `${B.exLoss.dir > 0 ? 'BUY' : 'SELL'} @ ${B.exLoss.entry}`,
    say: `और ये ${hd(B.exLoss.d)}। Setup बिल्कुल वैसा ही बना, लेकिन ${exitHi(B.exLoss.res)}, ${Math.round(abs(B.exLoss.pts))} points का नुकसान। हर setup में ऐसे दिन आते हैं।` });
  let verdict, vsay;
  if (plus && pf >= 1.3) { verdict = 'Kaam karta hai ✅'; vsay = `सीख: ये setup data में काम करता दिखा, लेकिन ${100 - B.winPct} प्रतिशत बार हार भी है। Stop loss के बिना कभी नहीं।`; }
  else if (plus) { verdict = 'Thoda sa plus ⚖️'; vsay = `सीख: फ़ायदा बहुत कम है, brokerage बढ़ा तो ये minus में जा सकता है। इसे अकेले नहीं, किसी filter के साथ देखो।`; }
  else { verdict = 'Akele kaam nahi karta ❌'; vsay = `सीख: इतना famous setup, लेकिन अकेले इस्तेमाल किया तो नुकसान। Trend या time का filter जोड़े बिना इसे मत चलाओ।`; }
  scenes.push({ vis: 'verdict', tag: 'SEEKH', show: verdict, sub: 'Sirf shiksha ke liye · Tip nahi', ok: plus && pf >= 1.3 ? 1 : plus ? 0 : -1,
    say: vsay + ' ये सिर्फ़ सीखने के लिए है, कोई tip नहीं।' });
  return {
    kind: 'setup', day, setup_id: st.id, topic: st.name, short: st.short, badge: 'SETUP ' + String(day).padStart(2, '0'), title: `${st.short} ka Report Card`,
    bt: { n: B.n, wins: B.wins, losses: B.losses, winPct: B.winPct, tgtHits: B.tgtHits, slHits: B.slHits, timeExits: B.timeExits, avgWin: B.avgWin, avgLoss: B.avgLoss, net: B.net, maxL: B.maxLossStreak, from: rd(B.from), to: rd(B.to), cost: B.costPts },
    exWin: B.exWin, exLoss: B.exLoss, verdict, scenes,
  };
}
module.exports = { build };
