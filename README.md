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

You don't need a content team. Source clips are free everywhere — YouTube (`@NFL`, `@NFLFilms`, `@NFLThrowback`), Reddit (`r/nfl`), X, TikTok, NFL.com. The pipeline does the encoding + upload in one command, so the daily cost is ~2 minutes per pick.

### From a URL (smoothest — no manual download)

Install [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) once: `brew install yt-dlp`.

```bash
npm run silhouette -- \
  --url "https://www.youtube.com/watch?v=XXXXXXXXXXX" \
  --day 6 --start 754 --duration 8 --keep "#0B2265" \
  --upload --date 2026-05-15 \
  --title "Helmet Catch" --player "David Tyree" \
  --aliases "tyree,david tyree" --team "New York Giants" \
  --position "WR" --jersey 85 \
  --description "Super Bowl XLII…" --funFact "…"
```

`--start` is the second-offset into the source video where the play begins (e.g. `754` = 12:34 into a compilation). One "Top 100 plays of all time" compilation buys you a month of picks — note the timestamp for each play and run the command N times.

### From a local file

If you already downloaded the clip:

```bash
npm run silhouette -- --in raw/edelman.mp4 --day 6  ... (same flags as above)
```

### Or: visual admin tool — no CLI

Run `npm run dev`, open [`/admin`](http://localhost:3000/admin), pick the **Paste URL** tab, drop a YouTube/Reddit/X link, fill in the metadata, hit **Encode & Publish**. The route 404s in production by design (it shells out to local `ffmpeg` + `yt-dlp`), so it's safe to ship. Override with `ADMIN_ENABLE=1` if hosting behind your own auth.

### What happens under the hood

1. (URL mode) Downloads via `yt-dlp` to a temp dir
2. Encodes to a 720×1280 silhouette MP4 with the chosen jersey color re-tinted neon red
3. Extracts a first-frame poster JPG
4. Uploads both files to Supabase Storage (`picks-daily` bucket)
5. Upserts a `public.pd_challenges` row with the right publish date

The site picks it up automatically at the next page revalidation (~60s) — no redeploy needed.

Full options and three highlight modes in [SILHOUETTE.md](./SILHOUETTE.md).

> **On sources:** the silhouette is a heavy transformation (B&W + recolored, ~8s of a 3-hour broadcast, functional puzzle context). Different fair-use posture than a direct rebroadcast. Not legal advice — use the pipeline, never raw clips.

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
