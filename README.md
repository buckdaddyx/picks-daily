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

You have two paths:

**Path A — let the pipeline do the work.** Drop the source highlight clip into `raw/`, then:

```bash
npm run silhouette -- --in raw/edelman.mp4 --day 1 --start 12 --duration 8 \
  --keep "#002244"          # optional: jersey color → neon-red highlight
```

That outputs `public/videos/day-01.mp4` + `public/posters/day-01.jpg`. Full guide and tuning options in [SILHOUETTE.md](./SILHOUETTE.md).

**Path B — hand-deliver the MP4.** Export your own 9:16 silhouette MP4 (≤ 10s, muted-friendly) and drop it into `public/videos/day-06.mp4` directly.

Either way, append a new entry to `CHALLENGES` in [`src/lib/challenges.ts`](./src/lib/challenges.ts):

```ts
{
  id: "day-06",
  date: "2026-05-15",
  title: "Helmet Catch",
  player: "David Tyree",
  aliases: ["tyree", "david tyree"],
  team: "New York Giants",
  videoUrl: "/videos/day-06.mp4",
  posterUrl: "/posters/day-06.jpg",
  description: "Super Bowl XLII...",
  funFact: "It was the second-to-last catch of his NFL career.",
}
```

The `Today` page automatically shows the entry whose `date` matches today (in the user's local timezone), and falls back to the most recent past entry otherwise.

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
