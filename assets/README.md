# assets/ — listing & marketing asset generators (optional)

Config-driven generators for the visual/marketing assets a listing needs. All read
`ship.config.json` → `assets`; all write to `<target>/dist/assets/`. Playwright is
required; the video/reel generators also need ffmpeg (`$FFMPEG`, a `ffmpeg` on PATH,
or `pip install imageio-ffmpeg`).

| Script | Output | Needs |
|---|---|---|
| `gen-images.mjs` | `social-1280x640.png` (GitHub social preview / OG), `hero-16x9.png` (product image) | Playwright |
| `gen-screenshots.mjs` | `shots/NN-viewport-theme.png` — up to 65, across desktop/mobile × light/dark, stepping the demo tour | Playwright |
| `gen-video.mjs` | `demo-16x9.mp4` + `demo.gif` — landscape demo recording | Playwright + ffmpeg |
| `gen-reel.mjs` | `reel-<id>-9x16.mp4` — one short-form reel per language/hook variant | Playwright + ffmpeg |
| `gen-carousel.mjs` | `carousel/NN-<type>.png` — 1080×1350 (4:5) LinkedIn/IG slides: cover → features → CTA | Playwright |
| `gen-thumbnail.mjs` | `thumbnail-16x9.png` — YouTube thumbnail (big text + play affordance) | Playwright |

```bash
node assets/gen-images.mjs      <targetDir>
node assets/gen-screenshots.mjs <targetDir>
node assets/gen-video.mjs       <targetDir>
node assets/gen-reel.mjs        <targetDir>
node assets/gen-carousel.mjs    <targetDir>
node assets/gen-thumbnail.mjs   <targetDir>
```

`gen-carousel` and `gen-thumbnail` render purely from config — they need no demo page.

## The demo page

Screenshots/video/reel need a **demo page** — a page that shows your skill's output
and auto-plays via a `window.__startTour()` hook. Set `assets.demoUrl` to your own
served page, or omit it to use the bundled **`templates/showcase.html`** (a responsive
"Aurora" dashboard with a self-contained spotlight tour) as a starting point to adapt.

## Config (`ship.config.json` → `assets`)

```json
"assets": {
  "brand":  { "name": "Toutour", "emoji": "🧭", "accent": "#a78bfa", "accentDark": "#7c3aed", "gold": "#fbbf24", "goldDark": "#d97706" },
  "social": { "tagline": "Turn any site into a guided experience", "highlight": "guided experience", "sub": "…", "pills": ["🎭 spotlight","🌗 dark mode","MIT"] },
  "hero":   { "headline": "Ship guided tours that actually pass", "highlight": "actually pass", "features": ["…","…"], "footer": "Free · MIT" },
  "demoUrl": "http://localhost:8210/",
  "screenshots": { "count": 6, "viewports": ["desktop","mobile"], "themes": ["light","dark"] },
  "thumbnail": { "title": "1 COMMAND = A GUIDED TOUR", "highlight": "GUIDED TOUR", "badge": "FREE · MIT" },
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
