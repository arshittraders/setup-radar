# Daily Studio refill — keep EVERY channel 2 days ahead

Goal: no active channel may ever miss a slot. Each run: check coverage, refill any channel that has
fewer videos than its slots for the next 48 h, verify, report to Himanshu (Hinglish, short).

## 0. Setup in a fresh session
- Repos: `/home/claude/setup-radar` (arshittraders/setup-radar, renderers + builders) and
  `/home/claude/leadswala` (leadswalakiwtech/leadswala, Supabase edge fn + diag SQL). Clone if missing.
- Run SQL against Supabase: write `leadswala/supabase/diag-<name>.sql` whose last statement is
  `select ... as diag`, commit + push to leadswala main, then `bash setup-radar/tools/rd.sh supabase/diag-<name>.sql`
  (prints the result). NEVER put passwords/tokens in diag SQL (repo + Actions logs are public).
- Never print or ask for tokens. Commits end with the Co-Authored-By / Claude-Session lines.

## 1. Coverage check
`supabase/diag-cov.sql` (exists) → per channel: post_times, status counts of future jobs, last scheduled.
Autopilot channels (BHOOT HOTE HE, Golu Bunty Show, Physics Royale Arena) refill themselves — only
check they have ≥1 day; if not, look at studio_jobs errors.
Manual channels you must refill: History Ek Min Mein (09:30,18:00), Gupt Gyaan (13:00,19:30),
Tingu Ki Pathshala (13:00,19:30), Clipzeno Gaming (ramp to 6/day, ≤6/day incl. Dom clips).

## 2. Making videos (manual channels)
History / Gupt Gyan (`builders/ggw`): copy builders/ggw to a work dir, add 8 Hindi lines per new
episode to `heb/eps.json` (History, energetic, facts must be accurate) or `ggb/eps.json` (Gupt Gyan,
mysterious tone) and write the same new episodes alone into `<dir>/lines.json`; push; dispatch
`edge-tts.yml` (dir=heb|ggb, tag, voice hi-IN-MadhurNeural) → download zip from release studio-debug
into `<work>/v/`. Write `ep_<id>.js` (8 scene fns, see ep_he04..07.js / ep_gg05..08.js), make `<id>/`
with `s.html` = tpl_head_he.html(+History) or tpl_head.html(Gupt) + tpl_tail.html, `ep.js`, fonts.
Add id→output name in build.js OUT map. Test frames: `node build.js <id> 3,9,15,21,27,33,40`
(check no text overlaps the title card / badges / captions), then `node build.js <id>`.
Sound effects come from `sfx/` automatically (CC0 library).
Tingu (`builders/tgw` + `tgb/eps.json`): teacher vs naughty student desi comedy for teens+adults
(channel is NOT made for kids now — keep humour adult-relatable, clean).
Clipzeno: `kick-clipdl.yml` (Dom: popular Kick clips of dasgasd3m GTA 6 streams after 18 Nov) or
`kreek-clips.yml`; render with `clip/streamer_short.py`; credit badge + #dasgasdom3 for Dom;
schedule with `tools/clipzeno_sql.py rows.tsv out.sql dom|kreek`.

## 3. Upload + schedule
Copy mp4 (<45 MB, crf 22 maxrate 4500k) to `setup-radar/ship/`, push, dispatch leadswala
`media-upload.yml` with input urls=`videos/<name>.mp4=https://raw.githubusercontent.com/arshittraders/setup-radar/main/ship/<file>`.
Insert studio_jobs (kind 'own', status 'ready', post_at = next empty slot, video_path public URL
https://ceoehwleopykotddcxxk.supabase.co/storage/v1/object/public/studio/site/videos/<name>.mp4,
plan caption/yt_title like earlier rows of that channel). Re-run diag-cov to confirm.

## 4. Report
Send Himanshu a short Hinglish summary: which channels were refilled, till when each is covered,
anything that failed. If something could not be fixed, say so plainly.

## Clipzeno clip pool notes (updated 22 Nov)
- KreekCraft VOD 2932147800 scanned ranges (kreek-raw*.zip in release studio-debug): 1800-10500 (raw7, pre-release
  countdown), 10800-14000 (raw4), 17000-26000 (raw/raw5), 26200-31800 (raw8), 32000-42000 (raw6), 42200-46000 (raw9),
  46000-74000 (raw3). Used so far: almost all good ones. Unused but weak/risky: raw3 kc7 (pills talk), raw3 kc10/11/12
  (sleep / campaign %), giveaways (raw3 kc5, raw4 kc5, raw5 kc3, raw7 kc1/kc4), raw8 kc2/kc3 + raw9 kc2 (NSFW/crude).
- 2932147800 ends at ~74080 s (fully used). Newer VODs (list with `kreek-vods.yml` → release asset
  vods-kreekcraft.txt): 2933758895 DAY 2 (41835 s), 2934981732 DAY 3 (42198 s), 2936183180 final mission (35316 s),
  2937360376 best ending (12497 s; ending = spoilers, avoid).
- DAY 2 scanned (23 Nov): 2000-12000 (kreek-d2a) and 15000-26000 (kreek-d2b). Used: d2a kc2/kc3/kc4/kc5, d2b kc1/kc2.
  Unused/skip: d2a kc1/kc8 + d2b kc7/kc8 (crude/NSFW), d2a kc6/kc7, d2b kc3-kc6 (weak menus/sleep).
- DAY 2 scanned (24 Nov): 26000-34000 (kreek-d2c), 34000-41800 (kreek-d2d) → DAY 2 fully scanned. Used: d2c kc1/kc2/kc6/kc8,
  d2d kc2/kc7. Skip: d2c kc3/kc4/kc7 + d2d kc6 (crude/NSFW). Unused OK-ish: d2c kc5, d2d kc1 (tower climb, pairs with kc2), kc3/kc4/kc5, kc8 (outro).
  Next: DAY 3 (2934981732) from 2000. Don't run >3 streamer_short.py renders in parallel (OOM kill).
- streamer_short.py: caption pages are now half-open intervals (no 1-frame double captions).
- Dom clips: dom-crying + dom-details still held ("ruckus clip limit") — ask Himanshu before scheduling them.
- DAY 3 scanned (25 Nov): 2000-12000 (kreek-d3a), 12000-22000 (kreek-d3b). Used: d3a kc3/kc4/kc6/kc8, d3b kc4/kc6.
  Skip: d3a kc5/kc7 + d3b kc8 (crude/NSFW), d3b kc3/kc7 (giveaway). Unused OK-ish: d3a kc1/kc2, d3b kc1/kc2/kc5. Next: DAY 3 from 22000.
- DAY 3 scanned (26 Nov): 22000-32000 (kreek-d3c, quiet range, low loud scores) + 32000-42100 (kreek-d3d) → DAY 3 fully
  scanned. Used: d3c kc1 (brianscar) kc2 (brokegame) kc5 (steroids) kc6 (savings), d3d kc4 (ransom) kc6 (moneytruck).
  Skip: d3c kc3 + d3d kc2/kc7/kc8 (NSFW/crude/bikini pool), d3c kc4/kc7 (giveaway). Unused weak: d3c kc8 (car + menus),
  d3d kc1 (76% / chat), kc3 (coffee), kc5 (lawyer/passports cutscene, starts with "shit"). Still unused OK-ish: d3a kc1/kc2,
  d3b kc1/kc2/kc5. Next: final-mission VOD 2936183180 from ~2000 (watch for ending spoilers), or chat-mode rescan of DAY 3.
- Hook text: no emoji (Anton font shows tofu). edge-tts flaky (NoAudioReceived): ggb/tts.py now retries per line.
- 25 Nov: Gemini prepaid credits depleted (HTTP 402) → BHOOT / Golu Bunty / Tiklu autopilot stop making new videos
  (errors are only logged, ap_note stays old). Check with diag-gm1.sql + diag-gm2.sql (key stays server-side).
- 27 Nov: final-mission VOD 2936183180 scanned 2000-12000 (kreek-fm1). Used: fm1 kc3 (proteinbar), kc7 (87percent); also used d3a kc1 (squarebutton),
  d3b kc1 (goodending). Skip fm1: kc1/kc2 (crude/NSFW), kc4/kc5 (Captain America/Marvel talk), kc6 (slurs), kc8 (giveaway). Next: 2936183180 from 12000.
- 27 Nov: Supabase project hit egress quota → 402 on storage + edge functions (no posting, media-upload fails). Until fixed, schedule jobs with
  video_path = https://raw.githubusercontent.com/arshittraders/setup-radar/main/ship/<file> (studio pub() accepts full URLs) — skip media-upload.
  Check restriction: diag-rf22.sql (net._http_response 402 count, stuck ready jobs).
- 28 Nov: final-mission VOD 2936183180 scanned 12000-22000 (kreek-fm2) + 22000-32000 (kreek-fm3). Used: fm2 kc1 (alwaysbroke), kc2 (backdoor), kc3 (itsfine), kc6 (bestending); fm3 kc5 (libertycity, cut 5-27 s before swear), kc8 (moneyglitch).
  Skip: fm2 kc7/kc8 (story spoilers + swearing), fm3 kc1/kc3/kc6 (crude), fm3 kc4/kc7 (giveaway). Unused weak: fm2 kc4 (coffee/speedrun), kc5 (dogs), fm3 kc2 (workout). Next: 2936183180 from 32000 (spoiler risk high near end) or rescan older VODs in chat mode.
