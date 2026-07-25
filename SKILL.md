---
name: pack-and-ship
description: Package an agent skill for GitHub and every marketplace in one pass — validate the SKILL.md, build the distributable zip, produce a plain-text-safe copy for guarded uploaders, and generate a ready-to-paste listing sheet with the exact field values for each platform (Agensi, Capafy, explainx.ai, SkillRegistry, Polar, GitHub). Use when the user wants to publish, list, distribute, or ship a skill, or asks to prepare marketplace/upload assets or a release zip for a SKILL.md project.
---

# pack-and-ship — package a skill for GitHub + every marketplace

Given a skill project (a directory with a `SKILL.md`), you produce everything
needed to ship it: a validated repo layout, a distributable zip, a plain-text-safe
copy for guarded uploaders, and a filled listing sheet with per-platform field
values. This encodes the hard-won details of each marketplace so publishing is a
5-minute job, not an afternoon.

## Inputs

- A target skill directory (default: current repo). It should contain `SKILL.md`.
- Optional `ship.config.json` in that directory (see `references/listing-template.md`
  for the shape). Anything missing is derived from the `SKILL.md` frontmatter and
  git remote. If it's absent, offer to create one from what you can infer.

## Phase 1 — Validate (fix before shipping)

Run `node scripts/lint.mjs <targetDir>`. It checks the things marketplaces reject on:

- `SKILL.md` exists **at the repo root** (registries and Agensi detect root first;
  one folder deep also works but root is the portable default — move it if nested).
- Valid YAML frontmatter: `name` is a lowercase slug; `description` is 100–1024
  chars and says **when to trigger** ("Use when …").
- A license file exists (MIT for a free listing; a commercial license for paid).
- No risky imperative patterns in the body (remote fetch-and-run, credential/secret
  handling) — marketplaces with security scans (Skills Directory, Agensi) reject these.

Fix every failure and re-run until green. Do not ship a red lint.

Then read **`references/repo-hygiene.md`** and check the repo against it, because
the lint cannot see any of this. It covers what must stay private and what may go
public, the three files that have to live at the repo root and be gitignored
rather than moved, why `.gitignore` does not protect a marketplace package, and
the audit commands for finding things that were committed and should not have
been. On a first launch, do this before anything is uploaded — a public repo and
a shipped package are both hard to take back.

## Phase 2 — Interview (only what changes the output)

Ask, unless `ship.config.json` already answers it:

1. **Free or paid?** Free → MIT, price blank everywhere. Paid → which channel handles
   money (Polar is the Stripe-free option for creators who can't use Stripe, e.g.
   Taiwan); the zip is delivered as the purchase.
2. **Which platforms this round?** (GitHub is always; then Agensi, explainx.ai,
   SkillRegistry, Polar — see `references/platforms.md`.)
3. **Category / tags / one-line summary** — if not already in the config.

## Phase 3 — Package

Run `node scripts/pack.mjs <targetDir>`. It writes to `<targetDir>/dist/`:

- **`<name>.zip`** — the distributable skill (SKILL.md at zip root, supporting files
  included, `node_modules`/`.git`/`tests`/`dist` excluded). This one file is what you
  upload to Agensi, SkillRegistry (if it takes a zip), and Polar (as the paid download).
- **`<name>-plaintext.md`** — the SKILL.md body with HTML/attribute tokens neutralized
  (`<input>` → `input`, `role="dialog"` → `role=dialog`) and frontmatter stripped, for
  uploaders that run an INPUT_GUARD and reject "html/script-like input" (explainx.ai).
- **`listing.md`** — a ready-to-paste sheet with the exact field values for every
  platform, filled from the config + frontmatter.

You can also run the pieces alone: `scripts/sanitize.mjs <file>` for just the
plain-text copy.

## Phase 4 — Submit (the manual last mile)

Follow the checklist `pack.mjs` prints and the per-platform notes in
`references/platforms.md`. Some steps have no API and must be done in the browser:

- **GitHub**: commit the repo; add the README badges + `.github/FUNDING.yml` (custom
  URL → your paid checkout, no Stripe enrollment needed); upload a 1280×640 **social
  preview** in Settings → General (manual). Enable **Sponsorships** in Settings so the
  FUNDING button appears.
- **Agensi**: upload `<name>.zip` (must contain SKILL.md); fill fields from `listing.md`;
  Free listing = price blank. Paid listing needs Stripe payout — if unavailable, keep
  it free-with-external-purchase or wait on their alternative-payout reply.
- **explainx.ai**: upload/paste `<name>-plaintext.md` (the guard rejects the raw
  SKILL.md); price blank for free.
- **SkillRegistry**: paste the SKILL.md **body** (no frontmatter); fill name/desc/tags.
- **Polar** (paid): create a Fixed-price product, attach `<name>.zip` as a File
  Download benefit, set visibility Public, add the 16:9 product image; copy the
  checkout link back into the repo's FUNDING.yml + README badge.

To wire the "get it / sponsor" links into the repo automatically, run
`node scripts/patch-repo.mjs <dir>` — it writes `.github/FUNDING.yml` and an idempotent
README badge + call-to-action block from the config's `price.checkoutUrl` / `funding`
(re-run with `--check` in CI to fail on drift). To keep score across a multi-day launch,
run `node scripts/track.mjs <dir>` — it maintains a `launch-tracker.md` at the repo root
(⬜ todo · 🟡 in review · ✅ live · ❌ rejected), keeping every row you've edited and only
appending platforms it doesn't have (`references/launch-tracker-template.md`).

## Optional — measure results (accumulate the proof)

A launch isn't done when you submit — the point is what it *did*. `node scripts/metrics.mjs
<dir>` appends a **dated snapshot** to `results-tracker.md` (a time-series growth curve):
`⭐ Stars`/`Forks` auto (best-effort GitHub API), `Listings` live/total derived from
`launch-tracker.md`, and `YT views`/`Installs`/`Pro sales`/… filled by hand or with
`--set "col=value, …"`. One row per day (re-running refreshes it, never duplicates). Log a
**baseline before you launch**, then re-run as numbers come in — that accumulated evidence is
what justifies a paid tier or a follow-up post (`references/results-tracker-template.md`).
Note: in sandboxed sessions where `api.github.com` is proxy-blocked, fill stars/forks via the
GitHub MCP tool or `--set`.

Report what you generated and the exact remaining manual steps. Never claim a listing
is live — you prepared the assets; the human submits.

## Optional — generate listing & marketing assets

Most listings convert far better with visuals. The `assets/` module (Playwright, and
ffmpeg for video) generates them from the same `ship.config.json` → `assets` block
(see `assets/README.md`). Offer these; run the ones the user wants:

- `node assets/gen-images.mjs <dir>` — **social preview** (1280×640, for GitHub
  Settings) + **hero 16:9** (product image for Polar/marketplace). The social card
  pairs a **left text column** with an optional **iconified example** on the right — a
  **faux dashboard with a real spotlight mask** (the spotlit card dims the rest of the
  window, the same box-shadow-hole the tour uses) + a coach-mark tooltip, configured via
  `assets.social.mock`. The generator **verifies** the result — layout (nothing off-frame,
  headline not over-tall, text not colliding with the mockup) and iconification (window +
  ≥2 cards + the dimming mask + tooltip inside the window) — and exits non-zero on a defect,
  so a broken card never ships silently.
- `node assets/gen-screenshots.mjs <dir>` — up to **12 screenshots** across
  desktop/mobile × light/dark, stepping the demo.
- `node assets/gen-video.mjs <dir>` — **demo video** (mp4 + gif) for YouTube/README.
  **Before generating a demo video, confirm two things with the user:** (1) **orientation** —
  **16:9 landscape** (`gen-video`, standard watch page / README) or **9:16 vertical**
  (`gen-reel`, a YouTube Short / IG-TikTok); (2) **target length**. Record both in
  `assets.video` (`orientation`, `seconds`) — the **YouTube-description step reads them**: a
  clip ≤ ~40s or vertical means **no chapters** and upload-as-a-Short, while a longer 16:9 clip
  can carry real chapters. After recording, verify the actual runtime (`ffprobe`/`ffmpeg -i`)
  before writing timestamps — never assume the length.
- `node assets/gen-reel.mjs <dir>` — **9:16 short-form reels**, one per language/hook
  variant (ask which languages — English-primary; add others like 繁中 / 日本語 on
  request, and confirm non-English caption copy before shipping it).
- `node assets/gen-carousel.mjs <dir>` — **LinkedIn/Instagram carousel** (1080×1350,
  4:5), one PNG per slide: cover → features → CTA. Falls back to `assets.social` +
  `assets.hero.features` if no explicit `assets.carousel.slides`.
- `node assets/gen-thumbnail.mjs <dir>` — **16:9 YouTube thumbnail(s)** from
  `assets.thumbnail.styles`: `"simple"` (2-line big text + play affordance) and/or
  `"before-after"` (a big hook + before/after faux dashboards showing the skill's payoff).

These need a **demo page** that auto-plays via `window.__startTour()`. The best results
come from **reading what the target skill actually does and designing a bespoke demo page
for it** — a page that shows *this* skill's output, not a generic dashboard. Point
`assets.demoUrl` at the user's real page when they have one; otherwise author a small
self-contained page tailored to the skill (its real UI, its real before/after) and expose
`window.__startTour()` + the `#ttNext` stepping hook. `assets/templates/showcase.html` is a
**reference/starting point** (a responsive "Aurora" dashboard with a self-contained tour),
not a fixed template — adapt it or replace it. Likewise fill `assets.social.mock` to mirror
the skill's own output (labels/values/tooltip copy) so the social card demonstrates the real
thing. (Carousel and thumbnail render from config only — no demo page needed.)

## Deliver ready-to-ship assets (don't leave them scattered as previews)

You don't know whether the user is on desktop or mobile — and an **inline preview is not a
downloadable file on mobile**. So when assets are ready to ship:

- **Hand over the real files as downloads**, not inline previews. Collect them from `dist/` and
  deliver them in **one batch per set** (all carousel slides together, the chosen reel, the
  thumbnails) so nothing is scattered across the conversation for the user to hunt down.
- **Pair every asset with its copy + a short how-to** in the chat: the ready-to-paste caption,
  the post order (carousel 01→05), the aspect ratio, and what attaches where. A first-time user
  should be able to act without reverse-engineering anything.
- Keep that **asset ↔ copy ↔ platform** pairing structured and explicit — it's the same shape a
  future automated posting agent consumes: each post = `{ assets[], caption, platform, notes }`.

## Optional — write launch posts

When asked, write platform-tailored launch posts following `references/posts.md`
(X, LinkedIn, Instagram, Facebook, Threads, Reddit, Product Hunt, and the **YouTube
video-description box**). Ask which languages (default English-primary). This is a playbook
you fill from the config + the skill's real differentiators — not a script. Output a
`posts.md` with one section per platform. The links that drive traffic are the user's call:
**ask which links to include** (repo is always safe; demo/install are free; a checkout /
sponsor / paid-add-on link only if they opt in) — never add a money link uninvited.

## Notes

- Keep free and paid packages **aligned**: the same zip serves the paid download and
  any registry listing, and a paid add-on should bundle a working SKILL.md (vendor the
  free engine so it runs standalone).
- Re-running is safe and idempotent — `dist/` is rebuilt each time.
- Asset generators need Playwright (`npm i -D playwright`) and, for video/reel, ffmpeg.
- **Point a publisher at a clean tree, never at the working repo.** Some packagers
  ignore `.gitignore` entirely and exclude neither `dist/` nor a `marketing/`
  folder; at least one also ships `.env`. Unzip `dist/<name>.zip` and publish that,
  so the file set is one you have looked at.
- **`track.mjs` only reads the tracker at the repo root.** If it has been moved,
  the script writes a blank one and the recorded launch status is gone. It warns
  when it starts from scratch — do not scroll past it.
- Reels and Shorts are composed inside a safe area (`assets.reel.safeArea`), since
  the feeds draw their own UI over the top, bottom and right of the frame.
  `references/repo-hygiene.md` has the reasoning and the other cross-platform traps.
