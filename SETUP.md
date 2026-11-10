# Setup Radar: live data (Upstox) setup

Backend lives in `/api` (Vercel serverless). The Upstox token stays on the server as an environment variable. It is never put in the HTML.

## 1. Upstox Analytics Token (read-only, valid 1 year, no daily login)
1. Upstox account mein login karo, phir Upstox Developer Apps page kholo (account.upstox.com/developer/apps).
2. Ek app banao (naam kuch bhi, redirect URL `https://127.0.0.1`).
3. App ke **Analytics** tab mein "Generate token" dabao. Token copy karo. Ye sirf data padhne ke liye hai, orders nahi laga sakta.
   Note: naya token banane par purana revoke ho jata hai.

## 2. Vercel mein token daalo
1. Vercel app/website mein project `setup-radar` kholo, Settings, Environment Variables.
2. Name: `UPSTOX_TOKEN`, Value: wo token. Production tick karo, Save.
3. Deployments mein latest deployment par Redeploy karo (env var redeploy ke baad lagta hai).

## 3. Check karo
- `https://<tumhari-site>/api/health` kholo. `"ok":true` aur "Nifty <price>" dikhna chahiye.
- Site kholo: upar peele "DEMO DATA" ki jagah hara "LIVE hh:mm:ss" badge dikhega.
- Agar `ok:false` aaye, error line mujhe bhejo (token mat bhejna).

Optional env vars: `FUT_NIFTY`, `FUT_BANKNIFTY`, `FUT_SENSEX` (futures instrument key, e.g. `NSE_FO|12345`) agar auto-detect fail ho.

## Endpoints
- `/api/health`: token aur quote check
- `/api/live`: spot + futures (volume, OI, buy/sell qty) teeno index ke liye
- `/api/candles?ix=nifty`: aaj ke 1-minute candles (index price, futures volume/OI/VWAP)
- `/api/chain?ix=nifty`: real option chain (nearest expiry)

## AI Guru + male voice (OpenAI)
1. platform.openai.com par login karo, Billing mein thoda credit daalo ($5 se shuru), aur **Usage limits** mein monthly limit lagao (jaise $10) taaki bill na badhe.
2. API keys mein "Create new secret key" dabao aur key copy karo.
3. Vercel, Settings, Environment Variables: Name `OPENAI_API_KEY`, Value wo key. Save, phir Redeploy.
4. Optional: `OPENAI_MODEL` (default gpt-4o-mini), `OPENAI_VOICE` (default onyx, male), `OPENAI_TTS_MODEL` (default gpt-4o-mini-tts).

Key sirf server par rehti hai. `/api/guru` (sawaal-jawab) aur `/api/tts` (awaaz) per-IP rate limit ke saath chalte hain. Key na ho to app purane offline coach aur phone ki awaaz par chalta rahega.

## Live news + market status (same Upstox token, nothing extra to set up)
- `/api/news`: real news (last 7 days) for indices and big stocks. In live mode the Guru reads it and the AI explains it in simple Hindi. News toggle in the Guru tab turns auto-news off.
- `/api/market`: market open/closed + holiday check. When the market is closed the badge shows "BAZAAR BAND".


## Live access is owner-only
Add env var `LIVE_PASS` (6+ chars). All Upstox endpoints return 403 without it. Open `https://setup-radar.vercel.app/#lp=YOURPASS` once on your device to switch that device to live. Everyone else sees the demo market.

## Payments, stats, download page (Kiwtech)
Pages: `/download` (landing + AI chat + APK), `/admin` (stats), `/terms`. APK file: `apk/SetupRadar.apk` (tracked link `/api/dl?s=<source>`).

1. **Store (stats + licences):** Vercel project, Storage tab, create **Upstash Redis** (free), connect to this project. It adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` by itself.
2. **Razorpay (Kiwtech account):** Settings, API Keys, generate Live key. Env vars: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`. Optional webhook (backup unlock if app closes mid-payment): URL `https://<site>/api/pay?hook=1`, event `payment.captured`, secret in `RAZORPAY_WEBHOOK_SECRET`.
3. **Admin:** env var `ADMIN_PASS` (any strong password). Open `/admin`.
4. Redeploy after adding env vars.

Prices: course ₹699 once, AI Guru ₹299 for 30 days (set in `api/_lic.js`). Guru questions/day: free 5, course 12, Guru plan 150 (`QUOTA` in `api/guru.js`). Owner (`LIVE_PASS`) is unlimited.
Ad / WhatsApp links: `https://<site>/download?s=meta` or `?s=wa` (the `s` value shows in admin Source table).
