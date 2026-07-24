---
name: pack-and-ship
description: Package an agent skill for GitHub and every marketplace in one pass — validate the SKILL.md, build the distributable zip, produce a plain-text-safe copy for guarded uploaders, and generate a ready-to-paste listing sheet with the exact field values for each platform (Agensi, explainx.ai, SkillRegistry, Polar, GitHub). Use when the user wants to publish, list, distribute, or ship a skill, or asks to prepare marketplace/upload assets or a release zip for a SKILL.md project.
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

Report what you generated and the exact remaining manual steps. Never claim a listing
is live — you prepared the assets; the human submits.

## Optional — generate listing & marketing assets

Most listings convert far better with visuals. The `assets/` module (Playwright, and
ffmpeg for video) generates them from the same `ship.config.json` → `assets` block
(see `assets/README.md`). Offer these; run the ones the user wants:

- `node assets/gen-images.mjs <dir>` — **social preview** (1280×640, for GitHub
  Settings) + **hero 16:9** (product image for Polar/marketplace).
- `node assets/gen-screenshots.mjs <dir>` — up to **65 screenshots** across
  desktop/mobile × light/dark, stepping the demo.
- `node assets/gen-video.mjs <dir>` — **16:9 demo video** (mp4 + gif) for YouTube/README.
- `node assets/gen-reel.mjs <dir>` — **9:16 short-form reels**, one per language/hook
  variant (ask which languages — English-primary; add others like 繁中 / 日本語 on
  request, and confirm non-English caption copy before shipping it).
- `node assets/gen-carousel.mjs <dir>` — **LinkedIn/Instagram carousel** (1080×1350,
  4:5), one PNG per slide: cover → features → CTA. Falls back to `assets.social` +
  `assets.hero.features` if no explicit `assets.carousel.slides`.
- `node assets/gen-thumbnail.mjs <dir>` — **16:9 YouTube thumbnail** (big text + play
  affordance) from `assets.thumbnail` (or `assets.social.tagline`).

These need a **demo page** that auto-plays via `window.__startTour()` — point
`assets.demoUrl` at the user's page, or adapt the bundled `assets/templates/showcase.html`.
(Carousel and thumbnail render from config only — no demo page needed.)

## Optional — write launch posts

When asked, write platform-tailored launch posts following `references/posts.md`
(X, LinkedIn, Instagram, Facebook, Threads, Reddit, Product Hunt). Ask which languages
(default English-primary). This is a playbook you fill from the config + the skill's
real differentiators — not a script. Output a `posts.md` with one section per platform.

## Notes

- Keep free and paid packages **aligned**: the same zip serves the paid download and
  any registry listing, and a paid add-on should bundle a working SKILL.md (vendor the
  free engine so it runs standalone).
- Re-running is safe and idempotent — `dist/` is rebuilt each time.
- Asset generators need Playwright (`npm i -D playwright`) and, for video/reel, ffmpeg.
