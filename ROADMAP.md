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

A cartoon mascot derived from the Tela Aurea Lab logo — a pangolin/lion hybrid.
**Still in discussion; do not start production.**

Direction agreed so far:

- Its name is **Telo（特羅）**.
- **Its own identity.** The mascot does not take the product palette. Tela Aurea
  Lab is a separate brand from mattye.dev and from Toutour.
- **Starts white**, drawn in grayscale and line — form and linework carry it, not
  colour. It can take colour later depending on the setting it appears in, which
  means the artwork has to be built so colour is applied rather than baked in.
- Reading in grayscale is therefore the design constraint, not an afterthought —
  conveniently the same test the reel's colour-vision check already applies.
- **Pangolin structure, lion presence.** It has pangolin armour and can curl, but
  its flexible mane plates can sway and flare to create the outward, regal read
  of a lion.
- It normally stands upright with a kaiju-like body shape and stance, but moves
  quickly and with agility rather than with heavy giant-monster steps. When
  lazy, it can hop once, curl into a ball, and roll instead.
- Its face reads as a feline from the front and a pangolin in profile: a slightly
  pointed, subtly upturned pangolin snout, with domestic-cat proportions as the
  current baseline for the nose, brow and cheeks.
- It has medium-large rounded almond eyes. Pupils are normally enlarged and
  feline in presence, but remain circular even when constricted rather than
  becoming vertical slits.
- Small rounded-triangle ears normally angle slightly upward and outward in a
  mild "airplane ear" pose; surprise or excitement brings them upright.
- The nose is small, matte and dark gray; the mouth is a minimal line. Its
  neutral expression is gently happy, with slightly raised brows and a subtle
  smile. Larger facial deformation is deliberately left open for later.
- It reads as an early teenager, roughly **12–15**, with lively curiosity,
  innocence, generosity and impulsive youthful drive.
- Its baseline proportion is **4.75 heads tall**, subject to small adjustments
  during silhouette testing for the younger age read. Its legs are short, thick
  and powerful without making its movement slow.
- Each hand and foot has **four digits total**. Fingers and toes end in small,
  pointed claw-like tips rather than large digging claws.
- The armour map is asymmetric between protective outer surfaces and expressive
  soft surfaces:
  - head scales stop at the forehead in a widow's-peak contour;
  - cheeks and abdomen are unarmoured;
  - the mane armour is present but restrained rather than strongly protruding;
  - each shoulder carries two to three larger pad-like plates;
  - back armour continues directly from the mane;
  - legs are half-wrapped, armoured outside and soft on the inner face;
  - the tail is fully armoured.
- The plate language uses **softened diamonds / shield shapes**. Mane and
  shoulder plates stay closest to the logo's diamonds; plates transition toward
  more natural pangolin teardrops across the back and tail. Corners are rounded
  with a subtly pointed tip so the armour feels grown rather than manufactured.
- Plate scale follows a clear rhythm: small at the forehead, largest at the mane
  and shoulders, medium and regularly overlapped across the back, then tapering
  smaller along the fully armoured tail.
- The grayscale hierarchy keeps the character white while separating materials:
  soft skin is near-white; armour is a slightly cooler, one-step darker
  gray-white; overlap seams and shadows use mid-gray; eyes, nose and only the
  necessary outer lines carry the darkest values.
- The master design is **line- and silhouette-led**, not detail-led. Use a small
  number of large plate groups and clean contour breaks; avoid individual-scale
  clutter, surface texture, scratches, hatching and decorative linework. The
  character must still read when reduced to a simple outline.
- Its tail starts at **0.8× body length**.
- Its hands are unarmoured. When it curls, they help preserve the hollow centre
  visible in the Tela Aurea Lab logo instead of filling the mark with scales.
- The base character is entirely natural and unclothed, with no permanent
  accessory. Props and wearable items are scene-specific additions only.
- All unarmoured regions share one consistent soft-surface material. There is
  no logo or permanent emblem on the body; brand recognition comes from the
  armour geometry and the curled transformation pose.
- It speaks. The voice will eventually contrast a cute high register with a low,
  resonant one; the switching rule is still open.

The logo remains the transformation target: its tessellated diamonds read as
pangolin scales, its radial rings as a mane, and the curled pose resolves the
character back toward the mark. Production remains blocked on a grayscale
silhouette and appearance study; do not build the reel stage or final rig yet.
