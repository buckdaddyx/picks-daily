import { NextResponse, type NextRequest } from "next/server";
import { spawn } from "node:child_process";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ROOT = process.cwd();
const SCRIPT = resolve(ROOT, "scripts/silhouette.mjs");

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.ADMIN_ENABLE !== "1") {
    return err("Admin disabled in production", 404);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch (e) {
    return err(`Bad form data: ${(e as Error).message}`);
  }

  const file = form.get("file");
  const urlSource = String(form.get("url") ?? "").trim();
  const hasFile = file instanceof File && file.size > 0;
  const hasUrl = !!urlSource;
  if (!hasFile && !hasUrl) {
    return err("Provide either a source file or a URL");
  }
  if (hasUrl && !/^https?:\/\//i.test(urlSource)) {
    return err("URL must start with http:// or https://");
  }

  const day = String(form.get("day") ?? "").trim();
  const date = String(form.get("date") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const player = String(form.get("player") ?? "").trim();
  if (!day || !date || !title || !player) {
    return err("day, date, title and player are required");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return err(
      "Missing SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_URL) in .env.local",
      500,
    );
  }

  // For file uploads: persist to a temp file the CLI can read.
  // For URL mode: let the CLI's --url handler download via yt-dlp itself.
  const workDir = join(tmpdir(), "picks-daily", randomUUID());
  await mkdir(workDir, { recursive: true });

  let sourcePath: string | null = null;
  if (hasFile) {
    const ext = inferExt(file.type, file.name);
    sourcePath = join(workDir, `source.${ext}`);
    await writeFile(sourcePath, Buffer.from(await file.arrayBuffer()));
  }

  // Build CLI args matching scripts/silhouette.mjs.
  const args: string[] = [
    SCRIPT,
    ...(sourcePath ? ["--in", sourcePath] : ["--url", urlSource]),
    "--day", day,
    "--start", String(form.get("start") ?? 0),
    "--duration", String(form.get("duration") ?? 8),
    "--upload",
    "--date", date,
    "--title", title,
    "--player", player,
  ];

  const mode = String(form.get("mode") ?? "plain");
  if (mode === "keep") {
    const keep = String(form.get("keep") ?? "").trim();
    if (!keep) {
      if (sourcePath) await cleanup(sourcePath);
      return err("--keep mode requires a hex color");
    }
    args.push("--keep", keep);
    const tol = form.get("tolerance");
    if (tol) args.push("--tolerance", String(tol));
  }

  const passOptional = (name: string, formKey = name) => {
    const v = String(form.get(formKey) ?? "").trim();
    if (v) args.push(`--${name}`, v);
  };
  passOptional("aliases");
  passOptional("team");
  passOptional("position");
  passOptional("jersey");
  passOptional("description");
  passOptional("funFact", "funFact");

  // yt-dlp can take a while on long YouTube videos. Bump the timeout
  // generously; route handler's maxDuration above caps us at 120s.
  const cliResult = await runScript(args);
  if (sourcePath) await cleanup(sourcePath);

  if (cliResult.code !== 0) {
    return err(
      `Pipeline failed (exit ${cliResult.code}). Last lines:\n${cliResult.tail}`,
      500,
    );
  }

  const id = `day-${day.padStart(2, "0")}`;
  const base = `${supabaseUrl}/storage/v1/object/public/picks-daily`;
  return NextResponse.json({
    id,
    videoUrl: `${base}/videos/${id}.mp4`,
    posterUrl: `${base}/posters/${id}.jpg`,
  });
}

function inferExt(mime: string, name: string): string {
  const fromName = name.toLowerCase().split(".").pop();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  if (mime === "video/quicktime") return "mov";
  if (mime === "video/webm") return "webm";
  return "mp4";
}

function runScript(
  args: string[],
): Promise<{ code: number; tail: string }> {
  return new Promise((resolveP) => {
    const child = spawn(process.execPath, args, {
      cwd: ROOT,
      env: process.env,
    });
    const lines: string[] = [];
    const collect = (data: Buffer) => {
      lines.push(data.toString());
      // Keep memory bounded.
      if (lines.length > 200) lines.splice(0, lines.length - 200);
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.on("close", (code) =>
      resolveP({
        code: code ?? 1,
        tail: lines.join("").split("\n").slice(-15).join("\n"),
      }),
    );
    child.on("error", (e) =>
      resolveP({ code: 1, tail: `spawn error: ${e.message}` }),
    );
  });
}

async function cleanup(path: string) {
  try {
    await unlink(path);
  } catch {
    /* best effort */
  }
}
