"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  Film,
  Wand2,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TEAM_COLORS, POSITIONS } from "@/lib/teams";
import { cn } from "@/lib/utils";

type Mode = "plain" | "keep";

type PublishResult =
  | { status: "idle" }
  | { status: "uploading"; pct: number }
  | { status: "processing" }
  | { status: "success"; videoUrl: string; posterUrl: string; id: string }
  | { status: "error"; message: string };

export function AdminUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("keep");
  const [teamPreset, setTeamPreset] = useState<string>("");
  const [keepHex, setKeepHex] = useState("#002244");
  const [tolerance, setTolerance] = useState(0.18);
  const [start, setStart] = useState(0);
  const [duration, setDuration] = useState(8);

  const [day, setDay] = useState("");
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [player, setPlayer] = useState("");
  const [aliases, setAliases] = useState("");
  const [team, setTeam] = useState("");
  const [position, setPosition] = useState("");
  const [jersey, setJersey] = useState("");
  const [description, setDescription] = useState("");
  const [funFact, setFunFact] = useState("");

  const [result, setResult] = useState<PublishResult>({ status: "idle" });

  const handleFileSelect = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setResult({ status: "error", message: "Please select a video file." });
      return;
    }
    setFile(f);
    setResult({ status: "idle" });
  };

  const handleTeamPreset = (teamName: string) => {
    setTeamPreset(teamName);
    if (!teamName) return;
    const t = TEAM_COLORS.find((x) => x.team === teamName);
    if (t) {
      setKeepHex(t.hex);
      if (!team) setTeam(t.team);
    }
  };

  const submit = async () => {
    if (!file) {
      setResult({ status: "error", message: "Pick a source video first." });
      return;
    }
    if (!day || !date || !title || !player) {
      setResult({
        status: "error",
        message: "Day, date, title, and player are required.",
      });
      return;
    }

    setResult({ status: "uploading", pct: 0 });

    const fd = new FormData();
    fd.append("file", file);
    fd.append("mode", mode);
    if (mode === "keep") {
      fd.append("keep", keepHex);
      fd.append("tolerance", String(tolerance));
    }
    fd.append("start", String(start));
    fd.append("duration", String(duration));
    fd.append("day", day);
    fd.append("date", date);
    fd.append("title", title);
    fd.append("player", player);
    fd.append("aliases", aliases);
    fd.append("team", team);
    fd.append("position", position);
    fd.append("jersey", jersey);
    fd.append("description", description);
    fd.append("funFact", funFact);

    try {
      // Use XHR so we can show real upload progress.
      const res = await uploadWithProgress(
        "/admin/api/publish",
        fd,
        (pct) => setResult({ status: "uploading", pct }),
        () => setResult({ status: "processing" }),
      );
      setResult({
        status: "success",
        id: res.id,
        videoUrl: res.videoUrl,
        posterUrl: res.posterUrl,
      });
    } catch (e) {
      setResult({
        status: "error",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  const busy =
    result.status === "uploading" || result.status === "processing";

  return (
    <div className="flex flex-col gap-5 pt-2">
      <header>
        <Badge variant="accent" className="mb-1">
          <Wand2 className="h-3 w-3" /> Admin
        </Badge>
        <h1 className="font-display text-2xl tracking-tight">Publish a new pick</h1>
        <p className="text-xs text-muted-foreground">
          Drop a source clip, set the highlight, fill in metadata. We&apos;ll
          run ffmpeg, upload to Supabase, and insert the row.
        </p>
      </header>

      {/* Section 1: Source file */}
      <Section icon={<Film className="h-4 w-4" />} title="Source clip">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFileSelect(e.dataTransfer.files[0] ?? null);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 text-center transition-colors",
            dragOver && "border-accent bg-accent/10",
            file && "border-success/50 bg-success/5",
          )}
        >
          {file ? (
            <>
              <CheckCircle2 className="h-6 w-6 text-success" />
              <div className="text-sm font-semibold">{file.name}</div>
              <div className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB · click to swap
              </div>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm font-semibold">
                Drag a video, or click to browse
              </div>
              <div className="text-xs text-muted-foreground">
                MP4 / MOV / WebM — anything ffmpeg can read
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />
        </div>
      </Section>

      {/* Section 2: Encoding */}
      <Section icon={<Wand2 className="h-4 w-4" />} title="Highlight & trim">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mode">
            <Select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              <option value="keep">Keep jersey color</option>
              <option value="plain">Plain B&W (no highlight)</option>
            </Select>
          </Field>
          <Field label="Team preset">
            <Select
              value={teamPreset}
              onChange={(e) => handleTeamPreset(e.target.value)}
            >
              <option value="">— select to autofill —</option>
              {TEAM_COLORS.map((t) => (
                <option key={t.team} value={t.team}>
                  {t.team}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {mode === "keep" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Keep color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={keepHex}
                  onChange={(e) => setKeepHex(e.target.value)}
                  className="h-12 w-12 cursor-pointer rounded-xl border border-border bg-muted/60"
                />
                <Input
                  value={keepHex}
                  onChange={(e) => setKeepHex(e.target.value)}
                  className="font-mono"
                  maxLength={7}
                />
              </div>
            </Field>
            <Field label={`Tolerance: ${tolerance.toFixed(2)}`}>
              <input
                type="range"
                min={0.05}
                max={0.6}
                step={0.01}
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="h-12 w-full accent-accent"
              />
            </Field>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start (sec)">
            <Input
              type="number"
              min={0}
              step={0.1}
              value={start}
              onChange={(e) => setStart(Number(e.target.value))}
            />
          </Field>
          <Field label="Duration (sec)">
            <Input
              type="number"
              min={1}
              max={20}
              step={0.5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </Field>
        </div>
      </Section>

      {/* Section 3: Metadata */}
      <Section icon={<Tag className="h-4 w-4" />} title="Metadata">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Day #">
            <Input
              type="number"
              min={1}
              placeholder="6"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </Field>
          <Field label="Publish date">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Title">
          <Input
            placeholder="Helmet Catch"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Player (canonical)">
            <Input
              placeholder="David Tyree"
              value={player}
              onChange={(e) => setPlayer(e.target.value)}
            />
          </Field>
          <Field label="Aliases (comma sep.)">
            <Input
              placeholder="tyree, david tyree"
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Team">
          <Input
            placeholder="New York Giants"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Position">
            <Select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            >
              <option value="">—</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Jersey #">
            <Input
              type="number"
              min={0}
              max={99}
              placeholder="85"
              value={jersey}
              onChange={(e) => setJersey(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Description">
          <Textarea
            placeholder="Super Bowl XLII…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label="Fun fact">
          <Textarea
            placeholder="It was the second-to-last catch of his career."
            value={funFact}
            onChange={(e) => setFunFact(e.target.value)}
          />
        </Field>
      </Section>

      {/* Status / submit */}
      <div className="sticky bottom-20 z-10 mt-2">
        {result.status === "error" && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{result.message}</span>
          </div>
        )}

        {result.status === "uploading" && (
          <StatusBar
            label={`Uploading source… ${result.pct}%`}
            pct={result.pct}
          />
        )}
        {result.status === "processing" && (
          <StatusBar label="Encoding silhouette + uploading to Supabase…" pulse />
        )}
        {result.status === "success" && (
          <SuccessCard result={result} />
        )}

        <Button
          onClick={submit}
          disabled={busy}
          size="lg"
          className="w-full"
          variant={result.status === "success" ? "success" : "default"}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Working…
            </>
          ) : result.status === "success" ? (
            "Publish another"
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Encode & Publish
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4">
      <h2 className="flex items-center gap-2 text-sm font-display tracking-tight">
        <span className="text-accent">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function StatusBar({
  label,
  pct,
  pulse,
}: {
  label: string;
  pct?: number;
  pulse?: boolean;
}) {
  return (
    <div className="mb-3 rounded-xl border border-accent/40 bg-accent/10 p-3">
      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
        <span className="text-foreground">{label}</span>
        {typeof pct === "number" && (
          <span className="text-muted-foreground">{pct}%</span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/60">
        <div
          className={cn(
            "h-full bg-gradient-to-r from-accent/70 to-accent",
            pulse && "animate-pulse",
          )}
          style={{ width: `${pct ?? 50}%` }}
        />
      </div>
    </div>
  );
}

function SuccessCard({
  result,
}: {
  result: Extract<PublishResult, { status: "success" }>;
}) {
  return (
    <div className="mb-3 flex items-start gap-3 rounded-xl border border-success/40 bg-success/10 p-3 text-sm">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
      <div className="flex-1">
        <div className="font-semibold text-success">Published {result.id}</div>
        <div className="mt-1 flex flex-wrap gap-3 text-xs">
          <a
            className="inline-flex items-center gap-1 text-foreground hover:text-accent"
            href={result.videoUrl}
            target="_blank"
            rel="noreferrer"
          >
            video <ExternalLink className="h-3 w-3" />
          </a>
          <a
            className="inline-flex items-center gap-1 text-foreground hover:text-accent"
            href={result.posterUrl}
            target="_blank"
            rel="noreferrer"
          >
            poster <ExternalLink className="h-3 w-3" />
          </a>
          <Link
            className="inline-flex items-center gap-1 text-foreground hover:text-accent"
            href="/"
          >
            view live <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function uploadWithProgress(
  url: string,
  body: FormData,
  onUpload: (pct: number) => void,
  onProcessing: () => void,
): Promise<{ id: string; videoUrl: string; posterUrl: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onUpload(pct);
        if (pct >= 100) onProcessing();
      }
    };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(json);
        else reject(new Error(json.error ?? `HTTP ${xhr.status}`));
      } catch {
        reject(new Error(`Bad response (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(body);
  });
}
