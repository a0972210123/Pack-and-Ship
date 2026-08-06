# ship.config.json shape (all optional — missing values are inferred)

Place this in the target skill's root. `pack.mjs` merges it with the SKILL.md
frontmatter and the git remote. Anything absent is derived or left as a TODO in
`listing.md`.

```json
{
  "owner": "matt-ye",
  "repo": "Toutour",
  "install": "npx skills add matt-ye/Toutour",
  "homepage": "https://github.com/matt-ye/Toutour",
  "summary": "Turn any website into a guided experience — an agent skill that analyzes your UI and generates + Playwright-verifies a spotlight onboarding tour.",
  "category": "Web Development",
  "tags": ["onboarding","product-tour","ux","web-development","accessibility","i18n","playwright","frontend"],
  "demo": {
    "video": "https://youtu.be/FVTpQvh6pBk",
    "page": "https://matt-ye.github.io/Toutour/"
  },
  "price": { "amount": 0, "currency": "USD", "checkoutUrl": "" },
  "funding": { "github": "matt-ye", "polar": "", "custom": [] },
  "launch": { "platforms": ["GitHub","Agensi","explainx.ai","SkillRegistry","Product Hunt","Show HN"] },
  "metrics": { "columns": ["⭐ Stars","Forks","YT views","Installs","Listings","Pro sales","Notes"] },
  "assets": { "brand": { "…": "generator block — see assets/README.md" } },
  "zip": {
    "exclude": ["node_modules", ".git", "tests", "dist", ".github"]
  }
}
```

- **price.amount 0** → free everywhere (blank price fields). Non-zero → paid: put the
  Polar/checkout URL in `price.checkoutUrl` and it flows into the FUNDING/README steps.
- **category** is used by Agensi/explainx (pick a real option, not the default).
- **funding** drives `scripts/patch-repo.mjs` (FUNDING.yml + README badge/CTA). `polar`
  or `custom[]` win over `price.checkoutUrl` for the sponsor button.
- **launch** drives `scripts/track.mjs` (the `launch-tracker.md` platform list). Polar is
  auto-included for paid skills if you don't list platforms yourself.
- **metrics** drives `scripts/metrics.mjs` (the `results-tracker.md` snapshot columns). A
  `Pro sales` column is auto-added for paid skills. See
  [`results-tracker-template.md`](results-tracker-template.md).
- **assets** is the generator block (brand / social / hero / thumbnail / carousel / reel)
  consumed by `assets/gen-*.mjs` — its full shape lives in
  [`../assets/README.md`](../assets/README.md).
