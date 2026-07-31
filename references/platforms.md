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

## Capafy (capafy.ai) — Agent marketplace, publishes via its own CLI skill

Different shape from every other platform here: **it lists Agents, not bare skills.**
No web upload form — you install its publisher skill and drive it from your agent.

- **Install the publisher**: download `https://api.capafy.ai/public/capafy-publisher.zip`
  and extract **into** `~/.claude/skills/` (Codex: `~/.codex/skills/`). **Do not pre-create
  the `capafy-publisher/` folder** — you get `capafy-publisher/capafy-publisher/` and it
  breaks. Verify `~/.claude/skills/capafy-publisher/SKILL.md` exists.
- **Auth is email OTP, not an API key**: `login-init` → code arrives by email → `login-verify`.
  The token lands in `<skill root>/config.json`. `CAPAFY_ACCESS_TOKEN` overrides it and is
  the cleanest path — it keeps the token out of shell history and agent transcripts.
- **Consent gate**: the skill refuses to run `login-init` until you have been shown the
  ToS + privacy policy and given *explicit* agreement. "ok" / "go" / "continue" are
  rejected by design.
- **Payload shape** — this is the field spec:
  `{title, description, skills[]{path, name, purpose}, plugins[], crons[]}`.
  `purpose` (why this skill is in the bundle) has no equivalent on other platforms —
  budget copy for it. `path`/`name` must be **verbatim from the Phase A candidates**.
- **Two-phase publish**: `publish-init --env claude_code --runtime-dir <session project root>`
  with no `--selections` first, to get real candidates; then write
  `.temp/confirmed-selections.json` and rerun with `--selections-file`. Add `--skill-dir`
  only to pin one skill root (must contain SKILL.md; a parent `skills/` dir is rejected).
- **Three web confirmation pages**: file contents → hosted keys → final submit. Enforced
  server-side, so the flow cannot skip them. **The creator must click the final submit** —
  an agent may not, and must not claim it submitted until you say you did.
- `publish-status` is **local `.temp/` state only** (`status_scope: local_only`). For real
  review status use `publish-remote-status --agent-id`; find IDs with `publish-list`.

### Gotchas that cost real risk

- **The packager reads the filesystem, not `.gitignore`.** Everything sitting in the skill
  directory ships, whether or not git tracks it. On the first Toutour run that meant
  `dist/` (7.1 MB of build output plus three reel videos), `ship.config.json`, and — the
  one that actually matters — `launch-tracker.md` and `results-tracker.md`, i.e. the
  private listing progress and the Pro sales figures, all staged for delivery to buyers.
  The first web confirmation page is skill-level, not file-level, so **there is no way to
  drop them from the browser**. The fix is upstream: move them out of the source directory,
  rerun `publish-configure` to re-stage, then move them back. Staging fell from 9.0 MB to
  2.0 MB. **Always list the staging directory before `publish-ship`** — it is at
  `<publisher skill>/.temp/staging`, and it is the last place the truth is visible.
- **`.env` is NOT excluded from the package.** Its exclusion lists for credential
  basenames and name patterns are literally empty; it relies on keyword-based redaction
  of detected secrets instead. A variable whose *name* carries no secret-ish keyword
  (`ACME_PROD=9f2a…`) is never detected and ships in the zip. **Inspect the skill tree by
  hand before publishing** and always accept the opt-in **deep scan** — it is the only
  layer that catches these.
- **"Run online" hosting uploads real provider API keys in plaintext** so the hosted agent
  can run. That is the model, not a bug — but review the hosted-keys page and strip
  anything you don't intend to hand over. A purely client-side skill should need none.
- **`login-verify` prints the access token to stdout**, so it lands in your terminal and
  agent transcript. Scrub logs before sharing, or use `CAPAFY_ACCESS_TOKEN`.
- **The publisher self-updates and runs `pip install`** from a bundle it downloads; the
  download host is not allowlisted and the sha256 check is skipped when the manifest omits
  the field. Installing it is an ongoing trust relationship, not a one-time review.
- **Windows**: the `chmod 0600` on `config.json` silently no-ops, so the token sits in a
  plaintext file with default ACLs. Don't sync that folder to cloud storage.
- Errors: read `developer_next_steps` / `failed_step` in the payload. **Do not** rerun
  `publish-init` or reach for `--reset-local-state` to "fix" a failed upload — that only
  clears local staging and does not abandon the platform-side agent.
- Paths: Windows-native (`C:\Users\me\project`) is fine; from WSL pass `/mnt/c/...`. No
  auto-translation.

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
