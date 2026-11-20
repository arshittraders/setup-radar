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
