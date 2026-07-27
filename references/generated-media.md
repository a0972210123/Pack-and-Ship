# Generated media — licence, disclosure and review

For when a listing needs a voice-over, a music bed or an image that no generator
in `assets/` produces. The traps here are legal and reputational rather than
technical, and they are cheap to avoid before generating and expensive after.

Distilled from research done for a separate video project; every claim below has
a primary source linked, and prices and licences are snapshots that need
re-checking before they are relied on.

## ⚠️ Check the licence of the exact model revision

**The same model family can be commercial and non-commercial depending on which
variant you pull.** This is the single most likely way a listing asset becomes
unusable after the work is done.

| Model | Licence | Commercial use |
|---|---|---|
| [FLUX.1 schnell](https://github.com/black-forest-labs/flux) | Apache-2.0 | Yes |
| [FLUX.2 klein 4B](https://github.com/black-forest-labs/flux2) | Apache-2.0 | Yes |
| FLUX `dev`, FLUX.2 9B variants | Non-commercial | **No**, unless separately licensed |
| [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5) (music) | MIT | Yes |
| [VoxCPM / VoxCPM2](https://github.com/OpenBMB/VoxCPM) (TTS) | Apache-2.0, code and weights | Yes |

A marketplace listing is commercial use even when the skill itself is free. Pin
the revision you actually used — not the family name — and record it.

Prefer the official upstream repository over a fork, even your own. A fork that
matched upstream when you checked it is not a guarantee it still does.

## Disclose generated content where the platform requires it

- [YouTube: disclosing generated or altered content](https://support.google.com/youtube/answer/14328491)
  — realistic synthetic scenes and AI-generated audio need an explicit
  disclosure decision per upload, not a blanket policy.
- [YouTube channel monetization policies](https://support.google.com/youtube/answer/1311392?hl=en-EN)
- [Shorts analytics guidance](https://support.google.com/youtube/answer/12942217?co=YOUTUBE._YTVideoType%3Dshorts&hl=en)
  — `engagedViews`, average view percentage and average view duration are the
  retention diagnostics for Shorts; click-through rate matters far less there
  than on search, channel and long-form surfaces.

ACE-Step's own documentation warns that generated music can land unintentionally
close to existing work, and asks for an originality review. Treat that as a
requirement, not advice.

This connects to the line in `copy-strategy.md`: an undisclosed synthetic asset is
the same category of problem as an unsourced number.

## Generated output is a candidate, not an asset

The rule that made the difference on a real project: **generated speech and
images are reviewable candidates until a human approves them.** Nothing goes into
a package because the pipeline produced it.

Practically, that means recording per asset:

- source model, revision and SHA-256;
- generation parameters, so the result can be reproduced;
- licence;
- for a cloned or designed voice, the consent that permits it;
- the disclosure decision;
- approval state, and expiry if the approval was conditional.

Never fine-tune or clone a specific person's voice without explicit consent, and
evaluate zero-shot cloning before considering fine-tuning at all.

## Rough resource expectations

Useful only for deciding whether local generation is worth attempting. Published
inference figures, not measurements:

| Task | Model | Approx. VRAM |
|---|---|---|
| TTS | VoxCPM2 (48 kHz) | 8 GB |
| TTS fallback | VoxCPM1.5 | 6 GB |
| Music | ACE-Step 1.5 2B | 6–8 GB |
| Music, premium | ACE-Step 1.5 XL | 20 GB recommended |
| Images | FLUX.2 klein 4B | ~13 GB |

An 8 GB laptop GPU can reach VoxCPM2 but sits at the limit: generate one at a
time, and on Windows expect to disable compile-time optimisation, since Triton
and `torch.compile` support is uneven there. Voice LoRA training is not a laptop
task — roughly 20 GB.

Keep a generation worker in its own environment rather than in the tool that
calls it. The version ranges that suit a model rarely match the ones that suit
your own code, and combining them makes a fragile dependency surface.

## Don't ask a model to redraw something exact

When a generated scene has to contain a precise artefact — a diagram, a UI, a
pattern with real structure — do not hand a model a loose reference and ask for
the finished thing. It will produce something that looks right and is wrong in
the details that matter.

Composite instead: keep the real vector artwork as a locked layer, generate only
the surroundings, then diff the result against the source and reject candidates
that altered it. On the project this came from, the model returned a centre that
read as knitted lace rather than a buildable woven path, and only an overlay
comparison made that obvious.
