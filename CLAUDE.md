# CLAUDE.md — video worker repo (public: never commit secrets)

This repo renders the videos for **Kiwtech Studio**. The full handover, rules and changelog live in the private repo
**leadswalakiwtech/leadswala** → `CLAUDE.md` and `docs/HANDOVER.md`. Read those first and follow them.

- Engines: `ballsim/` (physics, quiz, hypno — `node ballsim/render.js OUT FMT SEED`, env SKIN/BRAND/HMODE), `toon/`, `horror2/`, `story/`.
- Worker: `studio/worker.js`, workflow `.github/workflows/studio.yml`. After changing code here: cancel running `studio.yml` runs, dispatch again.
- Site samples: `site-samples/` (served via jsDelivr). Ad videos for Meta: `ads/` (served via raw.githubusercontent.com).
- After any change, add a line to the Changelog in leadswala `docs/HANDOVER.md`.
