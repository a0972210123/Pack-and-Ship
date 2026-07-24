# Results tracker

`scripts/metrics.mjs` maintains a `results-tracker.md` at the repo root — a **dated
time-series** of how the launch is actually performing, so you accumulate proof over time
(the validation that justifies a paid tier, a Show HN follow-up, or a "here's what shipping
this did" post).

```bash
node scripts/metrics.mjs <targetDir>                              # append/refresh today's row
node scripts/metrics.mjs <targetDir> --set "YT views=1200, Installs=40, Pro sales=1"
node scripts/metrics.mjs <targetDir> --date 2026-07-24           # override the snapshot date
```

## How it fills in

| Source | Columns |
|---|---|
| **Auto** (best-effort GitHub API) | `⭐ Stars`, `Forks` |
| **Derived** from `launch-tracker.md` | `Listings` (live/total, counts ✅ rows) |
| **Manual / `--set`** | `YT views`, `Installs`, `Pro sales`, `Notes`, anything else |

- **One row per day.** Re-running on the same date **updates** that row (auto + `--set` values
  refresh; your other manual entries survive) — it never duplicates.
- **Append-only history.** Past days are preserved, so the table is a growth curve.
- Columns come from `ship.config.json` → `metrics.columns` (a sensible default otherwise —
  a `Pro sales` column is included automatically when the skill is paid / has a checkout).

## The GitHub fetch caveat

`metrics.mjs` uses `fetch` to read public stars/forks — this works on a normal machine. In
some sandboxed sessions (e.g. Claude Code on the web) direct `api.github.com` is blocked by a
proxy; the script degrades gracefully (leaves those blank) and prints "not reachable". In that
case fill them via the GitHub MCP tool or `--set "⭐ Stars=… , Forks=…"`.

## Config

```json
"metrics": {
  "columns": ["⭐ Stars", "Forks", "YT views", "Installs", "Listings", "Pro sales", "Notes"]
}
```

## Automation-agent shape

`--set` takes `{ column: value }` pairs — the same shape an automated reporting agent would
feed in (pull YouTube Analytics / Polar / npm numbers, call `metrics.mjs --set …` on a
schedule). The tracker is the human-readable sink; the flag is the machine interface.
