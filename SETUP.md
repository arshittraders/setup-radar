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
