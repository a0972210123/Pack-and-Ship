# Roadmap

Planned work, with enough context to pick each item up cold. Nothing here is
started — an item moves out of this file when it ships.

## Brand colour keys are named after hues, not roles

**Settled, so no longer blocked:** three identities, deliberately not one.

| Identity | Palette |
|---|---|
| **mattye.dev** — the personal site | Independent. Academic indigo + cyan; it is the source. |
| **Toutour** — the product | Follows mattye.dev. |
| **Tela Aurea Lab** — the mascot and its world | Independent. See below. |

Toutour now carries the indigo palette, and the reel derives every colour from
it. What is left is cosmetic but misleading: the keys are `accent`, `accentDark`,
`gold`, `goldDark`, and `gold` currently holds a cyan. They are roles —
primary, deeper, secondary highlight — and should be named that way. Renaming
touches every generator plus each `ship.config.json`, so it wants doing in one
pass rather than opportunistically.

Also worth folding in: the four fallbacks live in `gen-reel.mjs`. The other
generators pass `brand.*` straight to their templates, so an unset key lands on
whatever that template defaults to. One shared set of defaults would make an
incomplete brand block behave the same everywhere.

### Published assets are not repainted

A palette change applies to **new** assets only. Anything already listed —
README badges, the social preview on GitHub, the Polar product image, the
screenshots on each marketplace, the published reels — stays as it is. Re-cutting
live listings to chase a colour costs review cycles and buys nothing, and the
engine's own `--tt-accent` default is product behaviour rather than marketing:
changing it repaints the tour for everyone who has already installed the skill.

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

Tela Aurea Lab's mascot, **Telo**, is a separate brand's unreleased identity and
its specification does not live in this public repo. The character bible, the
concept rounds and the design handoff are in the private Skill-Publishing-Assets
repo under `TelaAureaLab/mascot/`.

All this roadmap needs to record is the dependency: **the stage above cannot be
built until the character exists**, and the character is still in appearance
exploration — age and head-to-body ratio are open questions, not settled ones.

Do not restate the design here. A copy in a public repo goes stale against the
private source, and this one already had: it stated an age and a proportion as
decided that the handoff explicitly reopened.
