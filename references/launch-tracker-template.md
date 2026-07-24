# Launch tracker

`scripts/track.mjs` generates and refreshes a `launch-tracker.md` at your repo
root so you always know what's submitted, live, or still waiting. It's the
single source of truth for a multi-platform launch that plays out over days.

```bash
node scripts/track.mjs [targetDir=.]
```

- **Idempotent.** Re-running keeps every row you've edited and only appends
  platforms it doesn't already have. Edit `Status`/`Date`/`Link`/`Notes` freely;
  they survive the next run.
- Rows come from `ship.config.json` → `launch.platforms`. If absent, a default
  set is used (GitHub, Agensi, explainx.ai, SkillRegistry, awesome-list PR,
  Product Hunt, Show HN — plus Polar when the skill is paid).
- Extra platforms you add to the table by hand are preserved even if they're not
  in the config.

## Status legend

| Symbol | Meaning |
|---|---|
| ⬜ todo | not submitted yet |
| 🟡 submitted / in review | uploaded, awaiting approval |
| ✅ live | publicly listed |
| ❌ rejected | bounced — see Notes |
| ➖ n/a | doesn't apply (e.g. Polar for a free skill) |

## Config

```json
"launch": {
  "platforms": ["GitHub", "Agensi", "explainx.ai", "SkillRegistry", "Product Hunt", "Show HN"]
}
```

Fill `Date` when you submit and again when it goes live; paste the public listing
URL into `Link`. This table is what you scan before a launch-day check-in.
