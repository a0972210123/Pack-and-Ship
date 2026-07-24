# pack-and-ship 📦🚀

**Package an agent skill for GitHub and every marketplace in one pass.**

An [agent skill](SKILL.md) (universal `SKILL.md` format) that turns a skill project
into ship-ready assets: a validated layout, a distributable zip, a plain-text-safe
copy for guarded uploaders, and a **listing sheet with the exact field values for
each platform** — Agensi, explainx.ai, SkillRegistry, Polar, GitHub.

It encodes the fiddly per-platform details (explainx's INPUT_GUARD, Agensi needing
`SKILL.md` inside the zip, Polar as the Stripe-free paid channel, SkillRegistry
wanting the frontmatter-stripped body) so publishing is minutes, not an afternoon.

## Use

```bash
node scripts/lint.mjs   <targetSkillDir>   # validate — fix reds before shipping
node scripts/pack.mjs   <targetSkillDir>   # build dist/: zip + plaintext + listing.md
node scripts/sanitize.mjs <file.md>         # (just the plain-text-safe copy)
```

`dist/` then contains:

| File | Upload to |
|---|---|
| `<name>.zip` | Agensi, Polar (paid download), any registry taking a zip |
| `<name>-plaintext.md` | explainx.ai (raw SKILL.md trips its INPUT_GUARD) |
| `listing.md` | you — copy the per-platform fields; follow its checklist |

## Config (optional)

Drop a `ship.config.json` in the target skill (owner, tags, category, price, demo
links…). Anything missing is inferred from the SKILL.md frontmatter + git remote.
See [`references/listing-template.md`](references/listing-template.md).

## What it knows

[`references/platforms.md`](references/platforms.md) — the field spec and gotchas for
each marketplace, distilled from real submissions.

## Requirements

Node (built-ins only) + the `zip` CLI for packaging.

## License

[MIT](LICENSE).
