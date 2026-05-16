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
    page.tsx                  # Today / home — video + guess flow
    archive/page.tsx          # Past days grid + replay modal
    stats/page.tsx            # Streak, win rate, distribution
    admin/page.tsx            # Visual upload tool (dev-only)
    admin/api/publish/route.ts# POST handler — runs ffmpeg + uploads to Supabase
    layout.tsx                # Top bar + bottom nav shell
    globals.css               # Theme tokens
  components/
    silhouette-player.tsx     # 9:16 vertical player with custom controls
    guess-form.tsx            # Input + submit + shake on wrong guess
    result-card.tsx           # Reveal name, fun fact, share button
    top-bar.tsx               # Logo, streak counter, how-to-play
    bottom-nav.tsx            # Today | Archive | Stats
    admin-upload-form.tsx     # Drag-drop + form for /admin
    ui/                       # button, input, dialog, badge, textarea, select
  lib/
    challenges.ts             # Supabase data layer (server-only)
    supabase.ts               # Anon-key client
    teams.ts                  # NFL primary colors + position list
    match.ts                  # Fuzzy guess matching (last name, aliases, typos)
    storage.ts                # useResults() hook + streak/stats helpers
    utils.ts                  # cn(), date formatters, countdown
  proxy.ts                    # Hides /admin/* in production
public/
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

### Or: use the visual admin tool

Don't want to remember the CLI? Run `npm run dev` and open [`http://localhost:3000/admin`](http://localhost:3000/admin):

- Drag-drop a source MP4
- Pick the team (autofills the keep-color hex)
- Tweak start / duration / tolerance
- Fill in metadata (title, player, aliases, position, jersey, description, fun fact)
- Hit **Encode & Publish** — runs the same pipeline above and shows the live links

The route 404s in production by design (it shells out to a local `ffmpeg` binary that doesn't exist on Vercel Functions), so it's safe to ship. To enable on a self-hosted Node server, set `ADMIN_ENABLE=1` and put the route behind your own auth.

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
