# pack-and-ship 📦🚀

**Package an agent skill for GitHub and every marketplace in one pass.**

An [agent skill](SKILL.md) (universal `SKILL.md` format) that turns a skill project
into ship-ready assets: a validated layout, a distributable zip, a plain-text-safe
copy for guarded uploaders, and a **listing sheet with the exact field values for
each platform** — Agensi, Capafy, explainx.ai, SkillRegistry, Polar, GitHub.

It encodes the fiddly per-platform details (explainx's INPUT_GUARD, Agensi needing
`SKILL.md` inside the zip, Polar as the Stripe-free paid channel, SkillRegistry
wanting the frontmatter-stripped body) so publishing is minutes, not an afternoon.

## Use

```bash
node scripts/lint.mjs     <targetSkillDir>   # validate — fix reds before shipping
node scripts/pack.mjs     <targetSkillDir>   # build dist/: zip + plaintext + listing.md
node scripts/sanitize.mjs <file.md>          # (just the plain-text-safe copy)
node scripts/patch-repo.mjs <targetSkillDir> # wire FUNDING.yml + README badges/CTA (--check for CI)
node scripts/track.mjs    <targetSkillDir>   # maintain launch-tracker.md across a multi-day launch
node scripts/metrics.mjs  <targetSkillDir>   # append a dated results snapshot (stars/views/installs/sales)
```

`dist/` then contains:

| File | Upload to |
|---|---|
| `<name>.zip` | Agensi, Polar (paid download), any registry taking a zip |
| `<name>-plaintext.md` | explainx.ai (raw SKILL.md trips its INPUT_GUARD) |
| `listing.md` | you — copy the per-platform fields; follow its checklist |

## Marketing assets (optional)

The [`assets/`](assets/README.md) module (Playwright, + ffmpeg for video) generates the
visuals a listing converts on, all from the same `ship.config.json`:

```bash
node assets/gen-images.mjs      <dir>   # social preview 1280×640 + hero 16:9
node assets/gen-screenshots.mjs <dir>   # up to 12 shots, spread over desktop/mobile × light/dark
node assets/gen-video.mjs       <dir>   # 16:9 demo video (mp4 + gif)
node assets/gen-reel.mjs        <dir>   # 9:16 short-form reels, one per language/hook
node assets/gen-carousel.mjs    <dir>   # LinkedIn/IG carousel (1080×1350) cover→features→CTA
node assets/gen-thumbnail.mjs   <dir>   # YouTube thumbnail 16:9
```

Launch posts are written from [`references/posts.md`](references/posts.md) (a playbook,
English-primary, ask the language).

## Config (optional)

Drop a `ship.config.json` in the target skill (owner, tags, category, price, demo
links…). Anything missing is inferred from the SKILL.md frontmatter + git remote.
See [`references/listing-template.md`](references/listing-template.md).

## What it knows

[`references/platforms.md`](references/platforms.md) — the field spec and gotchas for
each marketplace, distilled from real submissions.

## Requirements

Node 18+, built-ins only — no external tools, no npm install. The archive is written
by `scripts/zip.mjs` on top of `node:zlib`, so packaging works the same on Windows,
macOS and Linux.

## License

[MIT](LICENSE).
