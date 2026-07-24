# Platform field specs & gotchas

Distilled from real submissions. For each platform: the fields it asks for, the
format, and the traps. `pack.mjs` fills `listing.md` from these shapes.

## GitHub (always)

Not a marketplace — the source of truth every listing links back to.

- **SKILL.md at repo root** (portable default).
- **README**: badges (License, and a paid-add-on badge if any), a demo GIF/video,
  install command, a Pro/upsell section linking the paid checkout.
- **`.github/FUNDING.yml`**: `custom: ["<checkout url>"]` renders a **Sponsor** button
  that links OUT to your checkout — **no GitHub Sponsors / Stripe enrollment required**
  (the Stripe-free path). Requires Settings → General → Features → **Sponsorships** on.
- **Social preview**: 1280×640 image, uploaded manually in Settings → General. No API.

## Agensi (agensi.io) — paid SKILL.md marketplace

- **Upload**: a **zip that contains a SKILL.md** (root or one folder deep). A whole-repo
  GitHub download fails — it nests SKILL.md two levels down. Use `dist/<name>.zip`.
- **Fields**: Skill name; Category; one-line summary; Tags; Permissions (declare
  honestly — Terminal/Read/Write/Browser as needed, Network/Env only if used);
  Extra Details (Known Limitations, Sample Input, Sample Output); FAQ; Pricing.
- **Pricing**: Free (price blank) or One-time (min $5). **Paid needs Stripe payout** —
  unavailable in some countries (e.g. Taiwan). If so: keep it free, or contact them for
  an alternative payout, or sell the paid tier via Polar and list free here.
- **Assets**: square logo (512×512), screenshots (16:9), demo video URL. Security scan
  runs on upload — the lint's no-risky-patterns check pre-empts it.

## explainx.ai — skill submission

- **INPUT_GUARD**: rejects "html/script-like input, plain text only." The raw SKILL.md
  (with `<input>`, `role="dialog"`, etc.) is blocked. Upload/paste
  **`dist/<name>-plaintext.md`** instead (sanitized, frontmatter stripped).
- **Fields**: Skill name; Category (avoid the default — pick the closest real one);
  GitHub owner; Repo name; Install command; Summary (one-liner); Tags (comma-sep);
  **Lifetime price** (blank = free public listing; a price sells one-time access from
  your GitHub repo — a possible Stripe-free paid channel, verify their payout);
  Skill documentation (markdown, or upload .md).

## SkillRegistry (skillregistry.io, "by Autonoma")

- **No INPUT_GUARD** — paste the raw SKILL.md **body** (strip the `---…---` frontmatter;
  `pack.mjs` notes the start line).
- **Fields**: Skill name; Skill slug (optional, auto from name); Description (short);
  Skill content (the body); Homepage (repo URL); Tags (comma-sep).

## Polar (polar.sh) — paid, Merchant-of-Record

- **Stripe-free for the creator**: Polar is the MoR and pays out to your bank — the
  right paid channel when Stripe Connect isn't available to you.
- **Product**: Fixed price (e.g. $19). **Automated Benefit → File Downloads →** upload
  `dist/<name>.zip` (buyers get it automatically on purchase). Visibility **Public** so
  the product page is shareable. Add a **16:9 product image**.
- **Checkout link**: create a Checkout Link (`buy.polar.sh/...`); billing address off,
  discount codes optional. Paste the link into the repo's FUNDING.yml + README badge.
- Fee ≈ 4% + $0.40; MoR handles VAT/sales tax.

## Registries / lists worth a PR (free, high signal)

- awesome-claude-code / awesome-claude-skills style lists — open a PR adding your repo.
- Skills Directory (skillsdirectory.com) — reviewed + security-scanned; approval = trust.
- Show HN / Product Hunt — not registries, but a concentrated launch with the demo video.
