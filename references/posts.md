# Launch-post playbook (per platform)

Social copy is creative, not scriptable — so this is a **playbook the agent fills**,
not a generator. When asked to write launch posts, produce one tailored post per
requested platform using the rules below, drawing facts from `ship.config.json`
(name, summary, install, demo video/page, tags) and the skill's real differentiators.

**Language**: ask which languages to produce; default **English-primary** (add others
like 繁中 only if requested). Keep the install command and URLs in Latin in every language.

## Universal rules

- **Hook in line 1** — a pain question or a bold number. Never open with "Introducing…".
- Put the **install command / link in the first 2 lines** so skimmers can act.
- One idea per post; show the transformation, not a feature list.
- Attach the demo GIF/video where the platform supports it (autoplay beats a link).
- Be honest: "free & MIT", real limitations if relevant. No fake metrics.

## Per platform

### X / Twitter  (~280 chars, thread-friendly)
- 1 hook line → 1 what-it-does line → install command → link. Emoji sparingly.
- Optional 2-tweet thread: tweet 1 hook + video; tweet 2 the "one command" + repo.
- 1–2 hashtags max (#buildinpublic #devtools). Attach the 9:16 or 16:9 video.

### LinkedIn  (professional, 3–5 short paragraphs)
- Lead with the business problem (activation/onboarding/churn), then the solution.
- Slightly more formal; a short bulleted "what you get". End with repo link + "free, MIT".
- 3–5 hashtags at the end (#UX #WebDevelopment #OpenSource #DeveloperTools).

### Instagram  (visual-first, caption + hashtags)
- The reel/GIF is the star; caption is a punchy hook + 1–2 lines + CTA "link in bio".
- 8–15 hashtags in a trailing block. Vertical 9:16 asset.

### Facebook  (conversational)
- Similar to LinkedIn but warmer/shorter; a question hook works well. Link + video.

### Threads  (casual, conversational, low-hashtag)
- Like X but more human/relaxed; 1 hook + 1 detail + link. 0–1 hashtag.

### Reddit  (NO marketing voice — this is the trap)
- Pick the right subreddit (r/webdev, r/SideProject, r/opensource, r/programming per rules).
- Title = plain, specific, no hype ("I built an agent skill that adds & verifies
  onboarding tours — free/MIT"). Body = the story + what problem it solves + honest
  limitations + link. Engage in comments. Read each sub's self-promo rules first.

### Product Hunt  (launch page + first comment)
- Tagline ≤60 chars; description = problem → solution → what's free.
- Maker's first comment: why you built it, the demo, ask for feedback. Gallery = the
  hero 16:9 + screenshots + video. Line up a few supporters for launch day.

## Output format

Return a `posts.md` with one clearly-labeled section per requested platform (and per
language), ready to copy-paste, plus a one-line note on which asset to attach to each.
