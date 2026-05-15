# Silhouette Video Pipeline

How to turn any NFL highlight clip into a Picks Daily silhouette video — and (optionally) publish it directly to Supabase in one command.

## Prereqs

```bash
brew install ffmpeg          # one-time
```

For the `--upload` flag, also set the following in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...     # Supabase dashboard → Settings → API
```

## Quick start (upload + publish in one command)

```bash
npm run silhouette -- \
  --in raw/edelman.mp4 \
  --day 6 \
  --start 12 --duration 8 \
  --keep "#002244" \
  --upload \
  --date 2026-05-15 \
  --title "Helmet Catch" \
  --player "David Tyree" \
  --aliases "tyree,david tyree" \
  --team "New York Giants" \
  --position "WR" \
  --jersey 85 \
  --description "Super Bowl XLII. He pinned the ball to his helmet against Rodney Harrison to extend the drive that ended the Patriots' perfect season." \
  --funFact "It was the second-to-last catch of his NFL career."
```

That runs ffmpeg, uploads the MP4 + poster to Supabase Storage (`picks-daily` bucket), and upserts a row in `public.pd_challenges` with the right publish date. The site picks it up at the next page revalidation (~60s) — no redeploy required.

## Local-only (no upload)

If you just want the encoded files and want to publish manually later:

```bash
npm run silhouette -- --in raw/edelman.mp4 --day 6 --start 12 --duration 8
```

Outputs:

- `public/videos/day-06.mp4` — 720×1280 H.264, no audio, fast-start
- `public/posters/day-06.jpg` — first-frame thumbnail

You can either drag those into the Supabase Storage UI, or re-run with `--upload` once the metadata is finalized.

## The three modes

### 1. `plain` — straight black-and-white silhouette

The default if you don't pass `--keep` or `--mask`. Everyone in the play turns into a dark grey silhouette. Use this when:

- the play is iconic and recognisable from movement alone (e.g. the Tyree helmet catch)
- you don't have time to fiddle with color isolation

```bash
npm run silhouette -- --in raw/clip.mp4 --day 6 --start 8 --duration 7
```

### 2. `keep` — auto-highlight by jersey color

Pass the team's jersey hex color and the script keeps those pixels visible (and recolors them to neon red), desaturating everyone else.

```bash
# Eagles green
npm run silhouette -- --in raw/dejean.mp4 --day 2 --start 18 --duration 8 \
  --keep "#004C54" --tolerance 0.22
```

Tuning:

- `--tolerance 0..1` (default `0.18`) — bigger values match a wider color range. Bump it up if the jersey is partly in shadow.
- `--blend 0..1` (default `0.05`) — softens the color edge.

**When this works:** team colors are very distinct from the field/refs/uniforms (Eagles green, Cardinals red, Steelers yellow).

**When it breaks:** opposing team has similar colors, the broadcast color-grading washes everything out, or the player is in shadow. Use `mask` mode instead.

| Team               | Suggested hex |
|--------------------|---------------|
| Patriots navy      | `#002244`     |
| Eagles midnight    | `#004C54`     |
| Cowboys silver     | `#869397`     |
| 49ers red          | `#AA0000`     |
| Chiefs red         | `#E31837`     |
| Steelers yellow    | `#FFB612`     |
| Giants blue        | `#0B2265`     |

(Actual broadcast colors drift — use a screenshot + an eyedropper for the exact value.)

### 3. `mask` — composite a hand-rotoscoped matte

The bulletproof option. You make a separate matte where the highlighted player is bright red on transparent/black; the script composites it onto the B&W base.

Workflow with any video editor:

1. Duplicate the source clip on a second track.
2. Mask out everything except the target player (rotoscope or use a tracking mask).
3. Color-key everything else to black, set the player fill to pure red `#FF2A2A`.
4. Export the matte as `raw/edelman-mask.mov` (matching duration).
5. Run:

```bash
npm run silhouette -- --in raw/edelman.mp4 --mask raw/edelman-mask.mov \
  --day 1 --start 12 --duration 8
```

This gives you precise pixel-perfect control. Worth the 10 min in DaVinci/Premiere for the headline plays.

## Tips

- **Trim aggressively.** 6–8 seconds is the sweet spot. Wordle works because it's fast.
- **Pick the action moment.** Start `~1s before` the key beat (the catch, the strip, the cut) so the user sees a tiny bit of context but the silhouette doesn't give it away.
- **Crop sells the puzzle.** The 9:16 crop centers on the middle of the frame. If the action is on a sideline, pre-crop the source in `raw/` to recenter it before running the script.
- **Preview in the app.** `npm run dev`, set today's date in `lib/challenges.ts` to today, and watch on actual mobile.

## Bulk regeneration

Re-encoding all 5 days at once:

```bash
for n in 01 02 03 04 05; do
  npm run silhouette -- --in raw/day-$n-source.mp4 --day $n --start 0 --duration 8
done
```

## Troubleshooting

| Symptom                                    | Fix                                                                    |
|--------------------------------------------|------------------------------------------------------------------------|
| `ffmpeg not found`                         | `brew install ffmpeg`                                                  |
| Output is just black                       | Source has no pixels matching `--keep`. Try wider `--tolerance` or use `plain`/`mask`. |
| Highlight is jittery / flashy              | Lower `--tolerance` and add a small `--blend` value.                   |
| Output is too dark / contrasty             | Pre-grade the source clip in `raw/` or edit the `eq=` filter in `silhouette.mjs`. |
| Want a different aspect ratio              | Change the `crop=` filter inside `buildFilter()` to `1:1` for square.  |
