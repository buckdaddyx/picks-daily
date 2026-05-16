#!/usr/bin/env node
/* eslint-disable */
/**
 * silhouette.mjs — Picks Daily silhouette video pipeline.
 *
 * Takes a normal NFL highlight clip and outputs a 9:16 black-and-white
 * silhouetted MP4 (+ poster JPG) ready to drop into /public/videos.
 *
 * Three modes:
 *   1) plain  — straight desaturate + crop (no highlight)
 *   2) keep   — keep pixels matching --color (jersey color), force them to neon red
 *   3) mask   — composite a user-supplied red-mask video/image on top of the B&W base
 *
 * Examples:
 *   node scripts/silhouette.mjs --in raw/edelman.mp4 --day 1 --start 12 --duration 8
 *   node scripts/silhouette.mjs --in raw/dejean.mp4 --day 2 --keep "#16a34a" --tolerance 0.22
 *   node scripts/silhouette.mjs --in raw/graham.mp4 --day 5 --mask raw/graham-mask.mov
 *
 * Requires: ffmpeg (>= 5). Install with `brew install ffmpeg`.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Load .env.local for SUPABASE_* vars used by --upload.
loadDotenv(resolve(ROOT, ".env.local"));

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.day || (!args.in && !args.url)) {
  printUsage();
  process.exit(args.help ? 0 : 1);
}

const day = String(args.day).padStart(2, "0");

// Resolve the input — either a local file (--in) or a remote URL we download
// with yt-dlp into a temp directory (--url). Both code paths converge on a
// single `inPath` that the rest of the pipeline treats identically.
let inPath;
let cleanupTmp = null;
if (args.url) {
  const tmpDir = join(tmpdir(), "picks-daily-dl", randomUUID());
  mkdirSync(tmpDir, { recursive: true });
  inPath = await downloadWithYtDlp(args.url, tmpDir);
  cleanupTmp = () => {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  };
} else {
  inPath = resolve(args.in);
}
if (!existsSync(inPath)) die(`Input not found: ${inPath}`);

const VIDEO_OUT = resolve(ROOT, "public/videos", `day-${day}.mp4`);
const POSTER_OUT = resolve(ROOT, "public/posters", `day-${day}.jpg`);
mkdirSync(dirname(VIDEO_OUT), { recursive: true });
mkdirSync(dirname(POSTER_OUT), { recursive: true });

const startSec = Number(args.start ?? 0);
const durationSec = Number(args.duration ?? 8);
const fps = Number(args.fps ?? 30);
const tolerance = Number(args.tolerance ?? 0.18); // 0..1
const blend = Number(args.blend ?? 0.05);

const mode = args.mask ? "mask" : args.keep ? "keep" : "plain";

console.log("\n— Picks Daily silhouette —");
console.log(`  in:        ${inPath}`);
console.log(`  out:       ${relativeToRoot(VIDEO_OUT)}`);
console.log(`  poster:    ${relativeToRoot(POSTER_OUT)}`);
console.log(`  mode:      ${mode}`);
console.log(`  start/dur: ${startSec}s + ${durationSec}s @ ${fps}fps`);
if (mode === "keep") console.log(`  keep:      ${args.keep} (tol ${tolerance})`);
if (mode === "mask") console.log(`  mask:      ${args.mask}`);
console.log("");

const filter = buildFilter({ mode, args, tolerance, blend });

await runFfmpeg(buildFfmpegArgs({
  inPath,
  maskPath: args.mask ? resolve(args.mask) : null,
  startSec,
  durationSec,
  fps,
  filter,
  outPath: VIDEO_OUT,
}));

await runFfmpeg([
  "-y",
  "-ss", "0.5",
  "-i", VIDEO_OUT,
  "-frames:v", "1",
  "-update", "1",
  "-q:v", "3",
  POSTER_OUT,
]);

console.log("\n✓ ffmpeg done.");
console.log(`  video:  ${relativeToRoot(VIDEO_OUT)}`);
console.log(`  poster: ${relativeToRoot(POSTER_OUT)}`);

if (args.upload) {
  await uploadToSupabase({ day, args, videoPath: VIDEO_OUT, posterPath: POSTER_OUT });
} else {
  console.log("\nSkip --upload? Drop these files into Supabase Storage manually,");
  console.log("or insert a pd_challenges row pointing at /videos/day-XX.mp4.");
}

if (cleanupTmp) cleanupTmp();

// ---------- helpers ----------

function buildFilter({ mode, args, tolerance, blend }) {
  // Common base: crop centered to 9:16, force fps & SAR, mild contrast pop.
  const base = [
    "scale=-2:1280:flags=lanczos",
    "crop=w='min(in_w,in_h*9/16)':h='min(in_h,in_w*16/9)':x='(in_w-out_w)/2':y='(in_h-out_h)/2'",
    "scale=720:1280:flags=lanczos",
    `fps=${args.fps ?? 30}`,
    "setsar=1",
    "eq=contrast=1.15:brightness=-0.02:saturation=1.0",
  ].join(",");

  if (mode === "plain") {
    // Just B&W silhouette — no highlight.
    return `[0:v]${base},format=gray,format=yuv420p[v]`;
  }

  if (mode === "keep") {
    const hex = normalizeHex(args.keep);
    // Two streams: grayscale base, and color-held layer recolored to neon red.
    // colorhold = "remove color from anything NOT matching this color" → opposite of colorkey.
    // We then force the held pixels to a flat neon red using lutrgb on saturated areas.
    return [
      `[0:v]${base},split=2[base][col]`,
      `[base]format=gray,format=yuv420p[bw]`,
      `[col]colorhold=color=${hex}:similarity=${tolerance}:blend=${blend},` +
        // Anything still colored becomes pure neon red, anything desaturated becomes transparent.
        // Trick: convert to YUV, then key out gray, then recolor.
        `format=yuva420p,colorchannelmixer=aa=1,` +
        `geq=` +
          `'r=if(gt(hypot(r(X,Y)-${hex2dec(hex).r},g(X,Y)-${hex2dec(hex).g})+abs(b(X,Y)-${hex2dec(hex).b}),120),0,255)':` +
          `g=0:b=42:` +
          `a='if(gt(hypot(r(X,Y)-${hex2dec(hex).r},g(X,Y)-${hex2dec(hex).g})+abs(b(X,Y)-${hex2dec(hex).b}),120),0,255)'` +
        `[red]`,
      `[bw][red]overlay=shortest=1:format=auto[v]`,
    ].join(";");
  }

  // mask mode — user supplies a separate matte where red = highlight.
  return [
    `[0:v]${base},format=gray,format=yuv420p[bw]`,
    `[1:v]scale=720:1280:flags=lanczos,fps=${args.fps ?? 30},setsar=1,` +
      `colorchannelmixer=rr=1:rg=0:rb=0:gr=0:gg=0:gb=0:br=0:bg=0:bb=0:aa=1,` +
      `format=yuva420p[mask]`,
    `[bw][mask]overlay=shortest=1:format=auto[v]`,
  ].join(";");
}

function buildFfmpegArgs({ inPath, maskPath, startSec, durationSec, fps, filter, outPath }) {
  const a = [
    "-y",
    "-ss", String(startSec),
    "-i", inPath,
  ];
  if (maskPath) {
    a.push("-ss", String(startSec), "-i", maskPath);
  }
  a.push(
    "-t", String(durationSec),
    "-filter_complex", filter,
    "-map", "[v]",
    "-an",
    "-r", String(fps),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-preset", "medium",
    "-crf", "20",
    "-movflags", "+faststart",
    outPath,
  );
  return a;
}

function runFfmpeg(ffmpegArgs) {
  return new Promise((resolveP, rejectP) => {
    const child = spawn("ffmpeg", ffmpegArgs, { stdio: "inherit" });
    child.on("error", (err) => rejectP(err));
    child.on("exit", (code) => {
      if (code === 0) resolveP();
      else rejectP(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

async function downloadWithYtDlp(url, dir) {
  console.log(`\n→ Downloading source via yt-dlp\n  url: ${url}\n`);
  // Force a single MP4 (re-encode if necessary) so the rest of the pipeline
  // doesn't have to think about container/codec variation across sites.
  const out = join(dir, "source.%(ext)s");
  await new Promise((resolveP, rejectP) => {
    const child = spawn(
      "yt-dlp",
      [
        "-f", "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best",
        "--no-playlist",
        "--merge-output-format", "mp4",
        "-o", out,
        url,
      ],
      { stdio: "inherit" },
    );
    child.on("error", (err) =>
      rejectP(
        err.code === "ENOENT"
          ? new Error(
              "yt-dlp not found. Install with `brew install yt-dlp` (or pip install yt-dlp).",
            )
          : err,
      ),
    );
    child.on("exit", (code) => {
      if (code === 0) resolveP();
      else rejectP(new Error(`yt-dlp exited with code ${code}`));
    });
  });
  const downloaded = join(dir, "source.mp4");
  if (!existsSync(downloaded)) {
    die(`yt-dlp did not produce ${downloaded}`);
  }
  return downloaded;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--help" || t === "-h") out.help = true;
    else if (t.startsWith("--")) {
      const key = t.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        out[key] = true;
      } else {
        out[key] = next;
        i += 1;
      }
    }
  }
  return out;
}

function printUsage() {
  console.log(`
Usage:
  node scripts/silhouette.mjs --in <input.mp4>  --day <N> [options]
  node scripts/silhouette.mjs --url <video-url> --day <N> [options]

Options:
  --in <path>          Local source file
  --url <url>          YouTube / Reddit / Twitter / etc URL — downloaded via
                       yt-dlp into a temp dir, then encoded as if local.
                       Requires \`yt-dlp\` on PATH (\`brew install yt-dlp\`).
  --start <sec>        Start offset into the source clip (default 0)
  --duration <sec>     Output length (default 8)
  --fps <n>            Output FPS (default 30)
  --keep <#hex>        Jersey color to keep + recolor neon red (e.g. "#004C54")
  --tolerance <0..1>   Color match tolerance for --keep (default 0.18)
  --blend <0..1>       Color edge blend for --keep (default 0.05)
  --mask <path>        Mask video/image (red pixels = highlight)
  --upload             After encoding, push to Supabase Storage + upsert
                       the pd_challenges row. Requires the env vars below.
  --date <YYYY-MM-DD>  Publish date for the challenge row (with --upload)
  --title <str>        Challenge title (with --upload)
  --player <str>       Canonical player name (with --upload)
  --aliases <a,b,c>    Comma-separated aliases (with --upload)
  --team <str>         Team (with --upload)
  --position <str>     Position abbreviation (with --upload)
  --jersey <n>         Jersey number (with --upload)
  --description <str>  Play description (with --upload)
  --funFact <str>      Fun fact (with --upload)
  --help               Show this message

Modes:
  plain   omit both --keep and --mask → straight B&W silhouette
  keep    --keep "#RRGGBB"           → keeps jersey color, paints it neon red
  mask    --mask raw/foo.mov          → composites supplied red mask on B&W

Env vars (for --upload, in .env.local):
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
`);
}

async function uploadToSupabase({ day, args, videoPath, posterPath }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    die("--upload requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  if (!args.date) die("--upload requires --date YYYY-MM-DD");
  if (!args.title) die("--upload requires --title");
  if (!args.player) die("--upload requires --player");

  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

  const id = `day-${day}`;
  const videoKey = `videos/${id}.mp4`;
  const posterKey = `posters/${id}.jpg`;

  console.log("\n→ Uploading to Supabase…");
  await uploadFile(sb, videoKey, videoPath, "video/mp4");
  console.log(`  ✓ storage: ${videoKey}`);
  await uploadFile(sb, posterKey, posterPath, "image/jpeg");
  console.log(`  ✓ storage: ${posterKey}`);

  const videoUrl = sb.storage.from("picks-daily").getPublicUrl(videoKey).data.publicUrl;
  const posterUrl = sb.storage.from("picks-daily").getPublicUrl(posterKey).data.publicUrl;

  const aliases = args.aliases
    ? String(args.aliases).split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const row = {
    id,
    publish_date: args.date,
    title: args.title,
    player: args.player,
    aliases,
    team: args.team ?? null,
    position: args.position ?? null,
    jersey: args.jersey ? Number(args.jersey) : null,
    video_url: videoUrl,
    poster_url: posterUrl,
    description: args.description ?? null,
    fun_fact: args.funFact ?? null,
    is_published: true,
  };

  const { error } = await sb
    .from("pd_challenges")
    .upsert(row, { onConflict: "id" });
  if (error) die(`Upsert failed: ${error.message}`);
  console.log(`  ✓ db row upserted: ${id} (publishes ${args.date})`);
  console.log(`\n🎉 Live at the next site rebuild — or instantly if revalidate hits.`);
}

async function uploadFile(sb, key, path, contentType) {
  const buf = readFileSync(path);
  const { error } = await sb.storage
    .from("picks-daily")
    .upload(key, buf, { contentType, upsert: true });
  if (error) die(`Storage upload failed for ${key}: ${error.message}`);
}

function loadDotenv(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

function die(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function relativeToRoot(p) {
  return p.replace(ROOT + "/", "");
}

function normalizeHex(h) {
  if (!h) die("Missing --keep color");
  let s = String(h).trim().replace(/^#/, "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(s)) die(`Bad hex color: ${h}`);
  return `0x${s.toUpperCase()}`;
}

function hex2dec(hex) {
  const s = hex.replace(/^0x/, "");
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  };
}
