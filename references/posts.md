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

### YouTube  (the description box under the demo video)
The description is a discovery + traffic-driving surface, not an afterthought. YouTube shows
only the **first ~2–3 lines** above the "…more" fold, so front-load them.

**Use the video's orientation + runtime** (confirmed when the video was generated, stored in
`assets.video`, and re-checked with `ffprobe`). They decide the shape of the description:
- **9:16 vertical, or ≤ ~40s** → it's a **Short**: no chapters, a one-line "In this Ns demo: …"
  summary instead, tighter copy.
- **16:9 and ≥ ~40s** → a standard upload that can carry real chapters (rules below).

- **Line 1**: the hook (same pain/number as the video's cold open).
- **Lines 2–3**: one sentence on what the skill does + the **primary link** (put it above the
  fold so it's clickable without expanding).
- Then a short paragraph expanding the value, and a **"What you get"** bullet list.
- **Links block** — this is the point of the description. **Ask the user which links to
  include** (see "Links block" below); at minimum the repo link. Label each link.
- **Chapters** (optional — and easy to get wrong): YouTube only turns timestamps into
  clickable chapters when **all** of these hold, else it silently ignores every one:
  1. first timestamp is exactly `0:00`;
  2. **≥ 3** timestamps, in ascending order;
  3. each chapter is **≥ 10 seconds** long;
  4. **every timestamp is within the actual video runtime**;
  5. each line is a **single start timestamp + space + title** — never a range (`0:00-0:17` is
     invalid; you don't write the end time, YouTube derives it from the next line).
  Consequence: chapters need a video of **~40s or longer**. **Check the real runtime first**
  (`ffprobe`/`ffmpeg -i`) — if the demo is short (≤ ~40s), DON'T emit chapters at all; replace
  them with a one-line "In this Ns demo: …" summary, and consider uploading as a Short.
- Close with a one-line "free & MIT" (or the price) and 3–5 plain hashtags.
- Keep install commands / URLs in Latin in every language.

## Links block  (ask before including)

The description and post CTAs drive traffic — but **which destinations is the user's call**.
Ask, and default to the simplest (the repo link) if they don't care:

- **Free**: GitHub repo (always safe), live demo page, install command.
- **Paid / support**: a checkout, sponsor, or paid-add-on link — include **only if the user
  opts in**. Never add a money link uninvited.

Render it as a short labelled list, e.g.:

```
▸ Repo & docs:  https://github.com/<owner>/<repo>
▸ Install:      npx skills add <owner>/<repo>
▸ Support / Pro: <checkout url>
```

## Output format

Return a `posts.md` with one clearly-labeled section per requested platform (and per
language), ready to copy-paste, plus a one-line note on which asset to attach to each.
Include the **YouTube description** section whenever there's a demo video — it's the one
"post" that keeps working long after launch day.

Keep each section as an explicit **`{ caption, platform, asset(s), notes }`** unit — one post,
its copy, the file(s) it attaches, and how to use it. That's both what a novice needs to act
without guessing and the exact interface a future automated posting agent consumes. When you
hand assets to the user, deliver the real files as downloads (collected in one batch), not
inline previews — you don't know if they're on desktop or mobile.
