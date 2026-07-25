# Roadmap

Planned work, with enough context to pick each item up cold. Nothing here is
started — an item moves out of this file when it ships.

## Brand colours need redefining

`assets.brand` in each skill's `ship.config.json` currently carries a palette
that grew ad hoc — `accent`, `accentDark`, `gold`, `goldDark` — and the asset
generators reach for those keys directly. Toutour's purple is a placeholder, not
a decision.

Blocked on the brand identity itself being settled. When it is:

- Decide the token set before touching code. The current names describe hues
  rather than roles, which is why `gen-reel.mjs` had to invent a `bgDark`
  fallback that no config actually defines.
- Give every generator the same defaults from one place. Today each one falls
  back on its own literal, so an unset key produces a different colour depending
  on which asset you generated.
- Reel frame colour and border currently default to `brand.bgDark` and
  `brand.accent`. Whatever replaces them should keep working without per-project
  config — the point of the defaults is that a new skill looks right immediately.

## A mascot stage in the corner of the video

Reels and demo videos are currently a screen recording plus captions. The plan
is a small stage in the **bottom-right** of the composition where a mascot
performs — reacting, dancing, and eventually interacting with what is happening
on screen.

Design notes for whoever builds it:

- The safe area already reserves the bottom of the frame, and the stage has to
  sit **inside** it. Bottom-right is also where Instagram puts its action rail
  and avatar, so the stage needs to clear those or it defeats the safe area it
  is drawn inside. Check against `VERTICAL_SAFE_AREA` before choosing a corner.
- The mascot should be driven by the same caption timeline that already exists
  in `gen-reel.mjs`, so its beats land with the copy rather than looping blindly.
- "Interacting with the screen" is the expensive part. A first version can
  react to tour events (`tour_start`, `tour_step`, `tour_done`) that the engine
  already emits — pointing at the spotlight when a step opens, celebrating on
  completion — without any awareness of the page itself.
- Keep it optional and config-driven (`assets.mascot`), off by default. Not
  every skill wants a character, and a listing video must still work without one.

Depends on the character existing. See below.

## The character itself

A cartoon mascot derived from the Tela Aurea Lab logo — a pangolin/lion hybrid.
**Still in discussion; do not start production.** Direction, references and the
production route are being worked out with the owner first.
