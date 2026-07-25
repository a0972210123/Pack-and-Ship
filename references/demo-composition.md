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

## Size type in relative units

Overlay text sized in `px` is baked for one viewport width. Change the safe area,
the aspect, or the recording scale and it silently overflows. Use `vw` so the
composition holds. The reel overlays use `7.4vw` for captions, `9.3vw` for the
end-card title.

The real constraint is legibility at the size people actually see. A caption that
reads on a monitor can be mush in a feed on a phone. Judge it from an extracted
frame viewed small, not from the editor.

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

## Consistency across assets

Social card, hero, screenshots, reel, carousel and thumbnail all read from the
same `ship.config.json`. Put brand values there rather than in a generator, so a
change lands everywhere at once. Where a generator needs a fallback, it should
share the default with its siblings — a per-file literal is how the same product
ends up in three slightly different purples.
