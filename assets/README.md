# assets/ — listing & marketing asset generators (optional)

Config-driven generators for the visual/marketing assets a listing needs. All read
`ship.config.json` → `assets`; all write to `<target>/dist/assets/`. Playwright is
required; the video/reel generators also need ffmpeg (`$FFMPEG`, a `ffmpeg` on PATH,
or `pip install imageio-ffmpeg`).

| Script | Output | Needs |
|---|---|---|
| `gen-images.mjs` | `social-1280x640.png` (GitHub social preview / OG — left text + optional iconified example, **verified**), `hero-16x9.png` (product image) | Playwright |
| `gen-screenshots.mjs` | `shots/NN-viewport-theme.png` — up to 12, across desktop/mobile × light/dark, stepping the demo tour | Playwright |
| `gen-video.mjs` | `demo-16x9.mp4` + `demo.gif` — 16:9 landscape demo (for 9:16 vertical/Shorts use `gen-reel`). Confirm orientation + length first → `assets.video` | Playwright + ffmpeg |
| `gen-reel.mjs` | `reel-<id>-9x16.mp4` — one short-form reel per language/hook variant | Playwright + ffmpeg |
| `gen-carousel.mjs` | `carousel/NN-<type>.png` — 1080×1350 (4:5) LinkedIn/IG slides: cover → features → CTA | Playwright |
| `gen-thumbnail.mjs` | `thumbnail-16x9.png` (2-line big text + play) and/or `thumbnail-beforeafter-16x9.png` (hook + before/after faux dashboards), one per `thumbnail.styles` | Playwright |

```bash
node assets/gen-images.mjs      <targetDir>
node assets/gen-screenshots.mjs <targetDir>
node assets/gen-video.mjs       <targetDir>
node assets/gen-reel.mjs        <targetDir>
node assets/gen-carousel.mjs    <targetDir>
node assets/gen-thumbnail.mjs   <targetDir>
```

`gen-carousel` and `gen-thumbnail` render purely from config — they need no demo page.

## The demo page — design one for the specific skill

Screenshots/video/reel need a **demo page** that shows the skill's output and auto-plays
via a `window.__startTour()` hook (step it with `#ttNext`). The approach that pays off:
**read what the skill actually does and build a bespoke page for it** — its real UI, its
real before/after — rather than reusing a generic dashboard. Set `assets.demoUrl` to the
user's real page when one exists; otherwise author a small self-contained page tailored to
the skill. **`templates/showcase.html`** (a responsive "Aurora" dashboard with a
self-contained tour) is a *reference/starting point*, not a fixed template — adapt it or
replace it. It's harmless to leave in place, but the demo should represent *this* skill.

## The social card's iconified example

`gen-images.mjs` builds the social preview as a **left text column + an optional right-side
iconified example** — a **faux dashboard** (nav + KPI cards + chart) with a **real spotlight
mask**: the spotlit card punches a hole in a dark box-shadow spread that dims the rest of the
window (the exact technique the tour uses), plus a coach-mark tooltip. Driven by
`assets.social.mock`; fill it to mirror the skill's own output. The generator **verifies**
every render: layout (nothing off-frame, headline ≤ ~210px tall, text not overlapping the
mockup) and iconification (window + ≥2 cards + the dimming mask on the spotlit card + tooltip
inside the window), and **exits non-zero** on any defect so a broken card is never shipped
silently. Omit `assets.social.mock` and the card falls back to a clean full-width text layout.

## Config (`ship.config.json` → `assets`)

```json
"assets": {
  "brand":  { "name": "Toutour", "emoji": "🧭", "accent": "#a78bfa", "accentDark": "#7c3aed", "gold": "#fbbf24", "goldDark": "#d97706" },
  "social": { "tagline": "Turn any site into a guided experience", "highlight": "guided experience", "sub": "…", "pills": ["🎭 spotlight","🌗 dark mode","MIT"],
    "mock": { "cards": [ {"label":"VISITORS","value":"48.2k"}, {"label":"SIGNUPS","value":"2,940"} ], "spotlight": 0, "tip": { "icon":"📊", "counter":"1 / 6", "text":"Your headline metrics live here — at a glance." } } },
  "hero":   { "headline": "Ship guided tours that actually pass", "highlight": "actually pass", "features": ["…","…"], "footer": "Free · MIT" },
  "demoUrl": "http://localhost:8210/",
  "video":  { "orientation": "16:9", "seconds": 15 },
  "screenshots": { "count": 6, "viewports": ["desktop","mobile"], "themes": ["light","dark"] },
  "thumbnail": { "styles": ["simple","before-after"], "title": "1 COMMAND =\nA GUIDED TOUR", "highlight": "A GUIDED TOUR", "badge": "FREE · MIT",
    "beforeAfter": { "hook": "STOP USER CHURN", "highlight": "CHURN", "sub": "Toutour creates verified onboarding tours for ANY website.", "cta": "DO THIS!", "afterLabel": "VERIFIED TOURS" } },
  "carousel": { "slides": [
    { "type": "cover",   "title": "Your app has 40 features. New users find 4.", "highlight": "find 4.", "sub": "One command turns your UI into a guided tour." },
    { "type": "feature", "n": 1, "title": "Reads your live UI", "text": "No manual step mapping." },
    { "type": "cta",     "title": "Ship it in one command", "highlight": "one command", "lic": "Free · MIT" }
  ] },
  "reel": { "variants": [
    { "id": "en-pain", "lang": "en", "captions": ["Your app has <b>40 features</b>.","New users find <b>4</b>.","So they leave. 😔","One command reads your UI…","…and builds a <span class=\"p\">guided tour</span>","step by step","dark mode · any language 🌍","accessible · <b>colorblind-safe</b> ♿","and <b>verified</b> ✓"], "endTag": "Guided tours, in one command" }
  ] }
}
```

- **video** (confirm with the user before generating a demo video): `orientation` (`"16:9"`
  landscape → `gen-video`, or `"9:16"` vertical → `gen-reel` / a Short) and target `seconds`.
  The **YouTube-description step reads these**: vertical or ≤ ~40s → no chapters + upload as a
  Short; longer 16:9 → real chapters. Always re-check the actual runtime (`ffprobe`) before
  writing timestamps — `gen-video`'s length depends on the tour's step count, so don't assume.
- **social.mock** (optional): the right-side iconified example — a faux dashboard with a real
  spotlight mask. `nav` are the top-nav labels; `cards` are mini KPI tiles (`label`, `value`,
  optional `delta`); `spotlight` is the index to emphasize (accent ring + luminance-safe white
  halo + the dark mask that dims the rest); `tip` is the coach-mark tooltip (`icon`, `counter`,
  `text`). Mirror the skill's real output. Omit to get a full-width text card.
- **thumbnail.styles** (default `["simple"]`): which YouTube thumbnails to render. `"simple"`
  = 2-line big text (use `\n` in `title` for the break) + `badge` + play affordance →
  `thumbnail-16x9.png`. `"before-after"` = a big left hook + before/after faux dashboards →
  `thumbnail-beforeafter-16x9.png`, driven by `thumbnail.beforeAfter` (`hook`, `highlight`,
  `sub`, `cta`, `afterLabel`, optional `beforeLabel`).
- **reel captions**: 9 strings — [0–2] the hook (before the tour), [3–8] over the six
  tour beats. `<b>` = gold emphasis, `<span class="p">` = accent. Add a variant per
  language (e.g. `id: "zh"` / `id: "ja"`) or per hook (pain vs data). Confirm non-English
  copy with the user before shipping it.
- **carousel slides**: `type` is `cover` | `feature` | `cta`. `highlight` gradient-tints a
  substring of the title; `feature` takes `n`+`text`; `cta` takes `lic` (+ uses
  `install`/`homepage`). Omit `carousel` and slides are derived from `social`+`hero.features`.
- **thumbnail**: `title` (+ `highlight` substring) and an optional `badge`. Falls back to
  `social.tagline` / `FREE · MIT`.
- **Launch posts** are written from `references/posts.md` (a playbook, not a script) —
  ask the user's language, English-primary.
