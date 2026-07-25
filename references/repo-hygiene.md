# Repo hygiene — what ships, what stays private

Every item here comes from something that actually went wrong on a real launch.
Read it before the first package of a new skill; the failures are quiet ones.

## The root cause: a session with only one repo to write into

An agent working on a skill's launch produces launch posts, per-platform listing
copy, channel research, and trackers. If the only repo it can write to is the
product repo, all of that lands there — and the product repo is public, and its
contents go inside marketplace packages.

**Give marketing material its own private repo before the first launch**, one
folder per skill. Then the split is obvious to whoever works on it next instead
of being a judgement call made under time pressure.

```
<assets-repo>/<Skill>/
├── copy/         launch posts, per-platform listing copy, channel research
├── trackers/     launch-tracker.md, results-tracker.md
├── images/       social cards, thumbnails, packaged zips
└── video/        demos and reels
```

## Three files cannot move, and that is fine

`ship.config.json`, `launch-tracker.md` and `results-tracker.md` are read and
written **at the product-repo root** by these scripts, which have no option to
look elsewhere:

| File | Read by | Written by |
|---|---|---|
| `ship.config.json` | `pack`, `track`, `metrics`, `patch-repo`, all six asset generators | — |
| `launch-tracker.md` | `metrics` (derives the listings count) | `track` |
| `results-tracker.md` | — | `metrics` |

Leave them at the root and **`.gitignore` them**. That makes them private
without displacing them, and nothing breaks. Keep backups in the assets repo and
refresh after edits — the copies drift.

### ⚠️ Moving a tracker loses your launch history, silently

`track.mjs` does not fail when `launch-tracker.md` is absent. It writes a fresh
blank tracker, reports every platform as newly added, and the recorded
statuses — which platforms are live, which are in review, every note — are gone.
It now prints a warning when it starts from scratch. Heed it.

## ship.config.json is marketing copy, not just config

Its `assets` block holds social taglines, reel scripts in every language, the
thumbnail hooks and the carousel text — including variants not published yet.
None of it is useful to someone installing the skill. Put `ship.config.json` in
`zip.exclude`, along with `.gitignore`.

## `.gitignore` does not protect the package

A marketplace publisher packages a **directory**, and it need not read
`.gitignore` at all — Capafy's, for one, does not, and its exclusion lists cover
neither `dist/` nor `marketing/`. Worse, its credential-basename and name-pattern
exclusion sets are empty: `.env` is not excluded, and is instead handled by
keyword-based redaction that misses any variable whose *name* carries no
secret-ish keyword. `ACME_PROD=9f2a4c1e` ships.

**Build the package from a clean tree, not from the working repo.** `pack.mjs`
already produces exactly that — `dist/<name>.zip` honours `zip.exclude`. Unzip it
and point the publisher at the result, so what ships is a set you have seen.

Belt and braces: `.gitignore` `.env`, `.env.*`, `*.pem`, `*.key` in every skill
repo, and accept the deep-scan prompt when a publisher offers one.

## Audit before the first listing

- `git log --all --diff-filter=A --name-only --pretty=format: | sort -u` — every
  path ever committed, including ones deleted since.
- `git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)'`
  — find large blobs, and anything that should never have been committed.
- Read `docs/` with fresh eyes. Feasibility notes and channel research read as
  documentation but often carry pricing, margins, payout arrangements and
  competitive strategy. That belongs in the private repo.
- Check `.github/` — `FUNDING.yml`, workflows, and nothing else.

**Removing a file does not remove it from history.** It stays retrievable from
earlier commits. If something genuinely sensitive was committed, the cleanup is
a history rewrite and a force push, which is a separate decision — not something
to slip into a tidy-up commit.

## Cross-platform traps

- **Derive paths with `fileURLToPath`, never `new URL('.', import.meta.url).pathname`.**
  The latter is percent-encoded and keeps a leading slash before the Windows
  drive letter, so a repo under a path containing a space resolves to
  `D:\D:\...Skill%20Space\...`. CI on Linux checks out to a space-free path where
  the two forms agree, so the suite stays green while being unrunnable locally.
- **Do not shell out to POSIX tools.** `zip(1)` does not exist on Windows.
  Packaging uses `scripts/zip.mjs` on `node:zlib` instead.
- **Strip `\r` when parsing.** A Windows checkout with `core.autocrlf=true` gives
  CRLF, which breaks naive frontmatter and table parsing.
- **ffmpeg wants `0xRRGGBB`,** not the `#RRGGBB` every config file is written in.

## Vertical video is not full-bleed

Reels, Shorts and TikTok draw their own chrome over the frame: a header at the
top, the caption and audio strip along the bottom, an action rail down the right,
and on Instagram an avatar that juts into the lower right. Content placed there
is covered — which is only discovered after publishing.

`gen-reel.mjs` composes inside a safe area and turns the remainder into a
deliberate border. Defaults are in `VERTICAL_SAFE_AREA` (`assets/lib/render.mjs`)
and are generous at the bottom, where the overlays are worst; override per
project with `assets.reel.safeArea`, `.background` and `.border`.

Size overlay text in `vw`, not `px`. Pixel sizes baked for one viewport width
overflow silently as soon as the safe area changes.
