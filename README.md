# Picks Daily

A daily NFL silhouette guess-the-player game. Watch a black & white clip of a famous play with the key player highlighted in neon red, type your guess, build your streak.

> Wordle meets NFL highlights.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** with a custom dark sports theme (deep blacks, neon red & green)
- **Radix UI** primitives wrapped in shadcn-style components
- **Framer Motion** for entrance & shake animations
- **lucide-react** icons
- **canvas-confetti** for win celebrations
- **fuse.js** for forgiving fuzzy matching on player names
- **localStorage** only — no backend required for the MVP
- PWA-ready (manifest, theme color, safe-area, mobile-first)

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000> on your phone (or Chrome devtools mobile view).

## Project structure

```
src/
  app/
    page.tsx              # Today / home — video + guess flow
    archive/page.tsx      # Past days grid + replay modal
    stats/page.tsx        # Streak, win rate, distribution
    layout.tsx            # Top bar + bottom nav shell
    globals.css           # Theme tokens
  components/
    silhouette-player.tsx # 9:16 vertical player with custom controls
    guess-form.tsx        # Input + submit + shake on wrong guess
    result-card.tsx       # Reveal name, fun fact, share button
    top-bar.tsx           # Logo, streak counter, how-to-play
    bottom-nav.tsx        # Today | Archive | Stats
    how-to-play-dialog.tsx
    ui/                   # button, input, dialog, badge primitives
  lib/
    challenges.ts         # Seed data — add new days here
    match.ts              # Fuzzy guess matching (last name, aliases, typos)
    storage.ts            # useResults() hook + streak/stats helpers
    utils.ts              # cn(), date formatters
public/
  videos/                 # Drop day-XX.mp4 silhouette clips here
  posters/                # Optional static frame thumbnails
  favicon.svg
  manifest.webmanifest
```

## Adding a new daily play

The whole pipeline is one command:

```bash
npm run silhouette -- \
  --in raw/edelman.mp4 \
  --day 6 --start 12 --duration 8 --keep "#002244" \
  --upload --date 2026-05-15 \
  --title "Helmet Catch" --player "David Tyree" \
  --aliases "tyree,david tyree" --team "New York Giants" \
  --position "WR" --jersey 85 \
  --description "Super Bowl XLII…" --funFact "…"
```

That:

1. Encodes the source clip to a 720×1280 silhouette MP4 (with the player isolated in neon red).
2. Extracts a first-frame poster JPG.
3. Uploads both files to Supabase Storage (`picks-daily` bucket).
4. Upserts a `public.pd_challenges` row with the right publish date.

The site picks it up automatically at the next page revalidation (~60s) — no redeploy needed.

Full options and three highlight modes in [SILHOUETTE.md](./SILHOUETTE.md).

### Where the videos & data live

| What | Where |
|---|---|
| Challenge metadata | Supabase Postgres → `public.pd_challenges` |
| Silhouette MP4s + posters | Supabase Storage → `picks-daily` bucket (public read) |
| User streaks & results | `localStorage` on the user's device (no backend) |

The DB row knows the public URL of the file in Storage, so the app fetches a single row and the `<video>` tag streams from Supabase's CDN. Edit titles / fun facts / aliases in the dashboard without a code push.

The `Today` page automatically shows the row with the most recent `publish_date <= current_date` (RLS hides future rows from the public anon key), so you can schedule weeks of content in advance.

## Game rules

- 5 attempts per day.
- Fuzzy matching forgives last-names-only, common nicknames, and small typos.
- Confetti on a win, red-screen shake on misses.
- Solving today extends your streak. Missing or skipping a day breaks it.

## Roadmap (post-MVP)

- Real backend (Supabase) so streaks survive across devices
- Daily push reminder
- Difficulty modes (jersey hidden / no team uniform)
- Friends leaderboard
