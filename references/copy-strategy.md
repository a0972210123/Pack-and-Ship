# Writing the copy — what each surface rewards

Assets get judged in three different states of mind, and copy that works in one
is wrong in another. Decide which surface you are writing for before you write a
word; most bad marketing copy is good copy aimed at the wrong surface.

## The three surfaces

### Feeds — the reader was not looking for you

Instagram, X, LinkedIn, Threads, Facebook. Reels, carousels, launch posts. The
reader is scrolling past and owes you nothing.

What earns attention here:

- **Lead with the problem, not the product.** "Your app has 40 features. New
  users find 4." beats "Introducing a skill that generates onboarding tours."
- **Contrast.** Before and after is doing the work, and it suits a demo
  naturally — the thing was missing, now it is there.
- **Name the cost of the status quo.** Not scare tactics; the honest price of
  doing nothing, which for an unexplained interface is users who never find the
  feature.
- **Move in the first second.** Covered in `demo-composition.md`.

### Marketplaces — the reader is already searching

Agensi, Capafy, explainx.ai, SkillRegistry. The reader arrived with an intent
and typed something. Nobody browses a skill marketplace for entertainment.

What earns installs here is the opposite of a feed:

- **Be findable, not intriguing.** A title that withholds what the thing does is
  a title that does not match a search. Say the job plainly.
- **State when to reach for it.** This is what `lint.mjs` already enforces on the
  frontmatter description — "use when …" is not box-ticking, it is the line that
  decides whether a search matches you.
- **Category and tags are search surface**, not metadata. Pick the closest real
  category rather than the default.
- Curiosity gaps, withheld payoffs and deliberately provocative angles — the
  staples of feed writing — actively hurt here.

### Repos and listings under evaluation — the reader is deciding

GitHub, the README, the docs. Someone is now weighing whether to trust this.

- **Proof over adjectives.** A demo that runs, a test that passes, a license that
  is clear.
- **State the limits.** Known limitations read as confidence, and the reader will
  find them anyway.
- **No unsourced numbers.** See below.

## The line we do not cross

Techniques that hold attention are legitimate for **making real value clear**.
They are not licence to invent value.

Allowed: naming a genuine pain, showing a real before and after, being blunt
about what doing nothing costs, leading with the strongest true fact.

Not allowed, ever:

- Overstating what the thing does, or implying capabilities it lacks
- Manufactured scarcity or urgency — no fake deadlines, no invented demand
- Performance or outcome claims without a source. If a number appears in copy,
  it must be traceable; if it cannot be traced, it does not ship.
- Borrowed credibility — implying endorsement, adoption or affiliation that is
  not real

The reason is not squeamishness. The owner's standing as a practitioner is the
most durable asset in this project, and it is spent, not lent: a single inflated
claim costs more trust than a launch gains attention. Copy that would embarrass
its author in front of a colleague does not go out, however well it converts.

When a draft needs a number to work and no source exists, the fix is a different
sentence, not a softer number.

## Sequencing — do not optimise a funnel with nothing in it

Conversion work assumes traffic. Before there is any, the constraint is
distribution, and the honest move is to ship the listings and posts already
drafted rather than refine the ones nobody has seen.

`metrics.mjs` snapshots dated rows precisely so this stops being a matter of
opinion. Let it accumulate, then let it say which surface is actually leaking.
A/B testing a listing against near-zero traffic measures noise.
