# Composing a product demo — rules that survived contact

For any demo asset that shows a product working: a skill, a website, an app.
Every rule here was found by rendering something, looking at it, and finding it
wrong. Follow them and separate assets look like they belong to one product.

## The first rule: look at the output

Encoding successfully is not evidence of anything. A video can be the right
resolution, the right length, and still have the caption sitting on top of the
app's navigation, or a highlight pointing at the wrong element.

**Extract frames and look at them** — at the beginning, at each beat, and at the
end:

```bash
for t in 2 10 16 21; do ffmpeg -y -loglevel error -ss $t -i out.mp4 -frames:v 1 f$t.png; done
```

Check each one against what the copy claims is happening at that moment. That is
how the misaligned spotlight below was caught; nothing in the toolchain errored.

## Compose for the box the platform leaves you

Vertical feeds draw their own UI over the frame — a header, the caption and audio
strip, an action rail down the right, and on Instagram an avatar in the lower
right. Full-bleed composition means content lands under all of it.

Reserve a safe area and let the remainder become a deliberate border. Defaults in
`VERTICAL_SAFE_AREA` (`assets/lib/render.mjs`) leave **90% × 80%** of the frame,
weighted to the bottom where the overlays are worst. This is a trade — 13% at the
bottom is thinner than Instagram's caption strip on some devices — so raise
`bottom` when the lower edge carries anything that must survive.

The same thinking applies to a website screenshot going into a listing gallery,
or an app store screenshot: know what the host draws on top before composing.

## Give text its own space, do not float it over the product

An overlay caption collides with whatever the product has along that edge — a nav
bar, a toolbar, a status row. Two sets of text on top of each other are
unreadable no matter how heavy the scrim.

Reserve a band and move the product out of it. `assets.reel.caption` takes
`{ position, height, mask }`; the mask is a semi-transparent scrim, dark or
light, feathered on the edge facing the product so it reads as a scrim rather
than a letterbox bar.

### ⚠️ Reserve the space with padding, never a transform

A transformed `body` becomes the containing block for its `position: fixed`
descendants. Spotlight tours, modals, toasts and drawers all live there. The
element measures its target with `getBoundingClientRect` — which already includes
the transform — and then the fixed overlay is offset by the transform *again*.
The highlight lands one band-height away from the thing it is pointing at, and
nothing warns you.

`padding` shifts layout without changing how fixed positioning resolves, so the
measurement and the overlay still agree. Verified both ways: the transform put
the spotlight on the wrong cards; padding put it back on the right ones.

Cost either way: a child with `min-height: 100vh` still measures against the full
viewport, so the bottom band's worth of page is clipped. Acceptable for
top-anchored content — check it is, for yours.

Overlays that must ignore the reservation — the caption band, an end card —
mount on `document.documentElement`, not `body`, or they get shifted with the
page they are supposed to sit clear of.

## Earn the first second

A feed is scrolled past, not watched. Whatever happens in the first second
decides whether there is a second one, and a still frame there is a scroll.

- **Cut the dead lead-in.** Screen recording starts when the browser context
  does, but nothing can happen until the page has loaded and overlays are
  injected — around a second of frozen frame, sitting exactly where it costs
  most. Measure that gap and trim it off the front (`trimStart` on `webmToMp4`).
  Leave roughly 300ms of the product visible so the opening line lands on
  something rather than on nothing.
- **Enter with movement, not a fade.** The band drops in, the first line pops
  with an overshoot and settles, the next two cut in from alternating sides. A
  polite cross-fade reads as nothing happening.
- **Then stop.** Once the product is on screen, motion competes with the thing
  it is pointing at. Hook hard for a second, then let the demo breathe — the
  tour beats use a plain fade on purpose.

## Pacing is two dials, and they set the tone

Everything about rhythm lives in `TIMING` in `gen-reel.mjs`, overridable per
project as `assets.reel.beats`. Two numbers decide how a reel feels:

| Dial | What it controls | Current |
|---|---|---|
| `gap` | Interval between beats — the energy. Shorter is urgent and holds attention; longer is easier to read and more composed. | 1950ms |
| `lag` | How far the caption trails its action — the sense of cause and effect. | 150ms |
| `beat0` | Where the first beat sits. Must clear the tour's 350ms entrance, or beat one breaks the rhythm every other beat keeps. | 6000ms |

**`lag` matters more than its size suggests.** It is what makes a beat read as
*action, then label*: the step advances, and the caption arrives just behind to
name what you have already seen move. A caption that leads its action, or lands
with it, loses the causality and reads as two things happening at once.

The failure worth remembering is not a wrong number but an inconsistent rule.
Beat one once trailed its action by 1580ms while every other beat trailed by
180ms — the opening spotlight sat lit for over a second with nothing naming it.
Each beat individually looked defensible; only the comparison showed the break.

Starting points by tone — only 1950/150 has been verified by render, the rest
are extrapolation:

- **Punchy, hook-driven**: `gap` 1700–1900
- **Current baseline**: `gap` 1950, `lag` 150 — 9 captions in 20.8s
- **Explanatory, teaching**: `gap` 2200–2500, so a line can be read before it changes

Change `gap` alone; the end card and the recording length are both derived from
it. Never adjust a duration to compensate.

## Derive the timeline from the content, never hard-code it

Beat timings written out by hand drift the moment the copy changes. This is not
hypothetical: the reel timeline listed nine captions but only advanced the tour
three times, so the last three lines played over a tour frozen on step 4 of 6 —
the copy claiming verification while the screen sat mid-walkthrough.

Compute the beats from the caption list, advance one step per beat, and derive
the recording length from the same numbers. One source, and the caption count,
the step count and the run time cannot disagree.

## Size type in relative units

Overlay text sized in `px` is baked for one viewport width. Change the safe area,
the aspect, or the recording scale and it silently overflows. Use `vw` so the
composition holds. The reel overlays use `7.4vw` for captions, `9.3vw` for the
end-card title.

The real constraint is legibility at the size people actually see. A caption that
reads on a monitor can be mush in a feed on a phone. Judge it from an extracted
frame viewed small, not from the editor.

**Check every language, not just the one you composed in.** The same font size
buys far fewer characters in Latin script than in CJK, so a band tuned on Chinese
copy clips the English. Worse, it does not wrap: a flex item defaults to
`min-width: auto` and refuses to shrink below its content, so the line runs
straight past the edges and gets cut. `min-width: 0` on the text element is what
lets it wrap at all — and a scale-up entrance animation grows from the centre, so
keep the overshoot under about 1.07 or a full line clips at the peak. Belt and
braces: measure after setting the text and step the size down if it still
outgrows its box.

## Record at the size you compose for

Do not record full-bleed and scale into the safe box afterwards — the aspect
ratios differ and you get either distortion or a second letterbox inside the
first. Size the recording viewport to the visible box and scale up cleanly.

## ffmpeg specifics

- Colours are `0xRRGGBB` or a name. `#RRGGBB`, which is what every config file
  and brand palette is written in, is rejected. `render.mjs` normalizes it.
- Keep every dimension even, or `yuv420p` encoding fails.
- Fit-and-pad without distortion:
  `scale=W:H:force_original_aspect_ratio=decrease,pad=…`

## Iterate on one variant

Each reel is real-time recording — around 25 seconds each. Re-rendering every
language variant to inspect one composition change wastes minutes per look.
`gen-reel.mjs --only <id>` records a single variant.

## Contrast, and themes that are actually responsive

Run it, do not eyeball it:

```bash
node assets/check-contrast.mjs [targetDir | url]     # exits non-zero on failures
```

It renders the page in every theme and measures each piece of visible text
against what is really behind it, to WCAG AA. On the demo template it found four
distinct failures where a careful look had found one.

**The failure that keeps recurring: a rule that sets `background` but not
`color` on a form control.** Buttons, inputs, selects and textareas do **not**
inherit colour — the browser gives them its own default. That default happens to
suit one theme, so the control looks right in the one you developed in and turns
invisible in the other. It survives review because nobody reads a stylesheet
hunting for an absence. Real example: a `?` button at **1.17:1** in dark mode,
black glyph on a near-black surface, while its neighbour survived only because
its label was an emoji, which carries its own colour.

The others are worth knowing too:

- **Dark is not the light palette dimmed.** Accents usually *lighten* in dark
  mode, so white-on-accent that passed in light mode fails — a primary button at
  2.72:1. Give it an `--on-accent` token that flips with the theme.
- **Status colours need theme variants.** A green that reads on white is too
  light for it (3.3:1), and a red that reads on white is too dark for a dark
  surface (3.73:1). Put them in variables, not literals.

A checker only sees what is rendered, so run it with the interface in its states
— tour open, modal open, menu expanded — not just at rest.

## SVG is not HTML — do not reach for HTMLElement conveniences

A demo that switches between variants inside an inline SVG will look like it
works long after it has stopped working. `hidden` is an **HTMLElement** IDL
property: on an SVG `<g>`, `el.hidden = false` sets a plain JS expando and never
touches the attribute. CSS `[hidden]` rules and `querySelector(':not([hidden])')`
read the attribute, so the two disagree silently — no error, no warning.

It stays hidden because the *first* variant still appears to toggle correctly,
usually because some other rule (`opacity: 0` on the unselected group) is doing
the real hiding. The bug only surfaces when a third variant is added and refuses
to appear.

Manipulate the attribute directly inside SVG:

```js
off ? g.setAttribute('hidden', '') : g.removeAttribute('hidden')
```

Same caution for any HTML convenience you did not check: SVG elements only
guarantee the SVGElement interface.

**Verify the switch, not just the render.** Assert which variant is actually
visible after a programmatic click, in the same automated pass that takes the
screenshots — otherwise you are reviewing the same frame three times and calling
it a comparison.

## Demonstrate the claim, do not assert it

Marketing copy that says "colour-blind safe" over an unchanged screen is an
assertion. Give the demo a way to show it: a grayscale toggle is the harshest
test available, because stripping every hue proves the interface reads by
luminance alone, which covers any colour vision. The showcase template exposes
`window.__setCvd(bool)`, and `assets.reel.beats.cvdOn` points it at whichever
beat makes the claim.

Apply such a filter to `<html>`. A CSS `filter` makes its element the containing
block for `position: fixed` descendants — the same trap as `transform` — and
`<html>` is the one box where that changes nothing.

## Consistency across assets

Social card, hero, screenshots, reel, carousel and thumbnail all read from the
same `ship.config.json`. Put brand values there rather than in a generator, so a
change lands everywhere at once. Where a generator needs a fallback, it should
share the default with its siblings — a per-file literal is how the same product
ends up in three slightly different purples.
