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
  Unused/skip: d2a kc1/kc8 + d2b kc7/kc8 (crude/NSFW), d2a kc6/kc7, d2b kc3-kc6 (weak menus/sleep). Next: DAY 2 26000-41800, then DAY 3.
- streamer_short.py: caption pages are now half-open intervals (no 1-frame double captions).
- Dom clips: dom-crying + dom-details still held ("ruckus clip limit") — ask Himanshu before scheduling them.
