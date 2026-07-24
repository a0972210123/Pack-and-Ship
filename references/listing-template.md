# ship.config.json shape (all optional — missing values are inferred)

Place this in the target skill's root. `pack.mjs` merges it with the SKILL.md
frontmatter and the git remote. Anything absent is derived or left as a TODO in
`listing.md`.

```json
{
  "owner": "a0972210123",
  "repo": "Toutour",
  "install": "npx skills add a0972210123/Toutour",
  "homepage": "https://github.com/a0972210123/Toutour",
  "summary": "Turn any website into a guided experience — an agent skill that analyzes your UI and generates + Playwright-verifies a spotlight onboarding tour.",
  "category": "Web Development",
  "tags": ["onboarding","product-tour","ux","web-development","accessibility","i18n","playwright","frontend"],
  "demo": {
    "video": "https://youtu.be/FVTpQvh6pBk",
    "page": "https://a0972210123.github.io/Toutour/"
  },
  "price": { "amount": 0, "currency": "USD", "checkoutUrl": "" },
  "assets": {
    "logo": "listing/logo-512.png",
    "social": "listing/social-1280x640.png",
    "productImage": "listing/hero-16x9.png",
    "screenshots": ["listing/ag-d1.png","listing/ag-m1.png"]
  },
  "zip": {
    "exclude": ["node_modules", ".git", "tests", "dist", ".github"]
  }
}
```

- **price.amount 0** → free everywhere (blank price fields). Non-zero → paid: put the
  Polar/checkout URL in `price.checkoutUrl` and it flows into the FUNDING/README steps.
- **category** is used by Agensi/explainx (pick a real option, not the default).
- **assets** are referenced in `listing.md`'s manual-upload steps (they're not embedded
  in the zip unless inside the target dir).
