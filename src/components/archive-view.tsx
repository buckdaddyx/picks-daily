"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Lock,
  CalendarDays,
  Clock,
  Trophy,
  Inbox,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SilhouettePlayer } from "@/components/silhouette-player";
import type { Challenge } from "@/lib/challenges";
import { useResults, type Result } from "@/lib/storage";
import { cn, formatDate, formatLongDate } from "@/lib/utils";

type Filter = "all" | "solved" | "missed" | "unplayed";

export function ArchiveView({ challenges }: { challenges: Challenge[] }) {
  const { results } = useResults();
  const [active, setActive] = useState<Challenge | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  // Bucket once: anything with a publish_date <= today is "released".
  // Computed with a stable `now` snapshot so the renderer stays pure.
  const { released, upcoming } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const r: Challenge[] = [];
    const u: Array<Challenge & { __daysAway: number }> = [];
    for (const c of challenges) {
      const cms = new Date(c.date).getTime();
      if (cms <= todayMs) {
        r.push(c);
      } else {
        const daysAway = Math.max(
          1,
          Math.ceil((cms - todayMs) / (1000 * 60 * 60 * 24)),
        );
        u.push(Object.assign({ __daysAway: daysAway }, c));
      }
    }
    r.sort((a, b) => b.date.localeCompare(a.date));
    u.sort((a, b) => a.date.localeCompare(b.date));
    return { released: r, upcoming: u };
  }, [challenges]);

  // Counts drive the filter chips and double as quick stats.
  const counts = useMemo(() => {
    let solved = 0;
    let missed = 0;
    let unplayed = 0;
    for (const c of released) {
      const r = results[c.id];
      if (!r) unplayed++;
      else if (r.correct) solved++;
      else missed++;
    }
    return { all: released.length, solved, missed, unplayed };
  }, [released, results]);

  const filtered = useMemo(() => {
    if (filter === "all") return released;
    return released.filter((c) => {
      const r = results[c.id];
      if (filter === "unplayed") return !r;
      if (filter === "solved") return r?.correct === true;
      return r?.correct === false;
    });
  }, [released, filter, results]);

  const groups = useMemo(() => groupByMonth(filtered), [filtered]);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <header>
        <Badge variant="accent" className="mb-1">
          <CalendarDays className="h-3 w-3" /> Archive
        </Badge>
        <h1 className="font-display text-2xl tracking-tight">All-Time Picks</h1>
        <p className="text-xs text-muted-foreground">
          Replay any past day. Locked cards unlock on their release date.
        </p>
      </header>

      {released.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <FilterChip
            label="All"
            count={counts.all}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterChip
            label="Solved"
            icon={<Check className="h-3 w-3" />}
            tone="success"
            count={counts.solved}
            active={filter === "solved"}
            onClick={() => setFilter("solved")}
          />
          <FilterChip
            label="Missed"
            icon={<X className="h-3 w-3" />}
            tone="danger"
            count={counts.missed}
            active={filter === "missed"}
            onClick={() => setFilter("missed")}
          />
          <FilterChip
            label="To play"
            icon={<Sparkles className="h-3 w-3" />}
            count={counts.unplayed}
            active={filter === "unplayed"}
            onClick={() => setFilter("unplayed")}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <FilterEmptyState filter={filter} hasReleased={released.length > 0} />
      ) : (
        groups.map((g) => (
          <section key={g.key} className="flex flex-col gap-3">
            <MonthHeader label={g.label} count={g.items.length} />
            <div className="grid grid-cols-2 gap-3">
              {g.items.map((c, i) => (
                <ChallengeCard
                  key={c.id}
                  c={c}
                  i={i}
                  result={results[c.id]}
                  onClick={() => setActive(c)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {upcoming.length > 0 && (
        <section className="flex flex-col gap-3">
          <MonthHeader
            icon={<Clock className="h-3 w-3" />}
            label="Coming up"
            count={upcoming.length}
          />
          <div className="grid grid-cols-2 gap-3">
            {upcoming.map((c, i) => (
              <UpcomingCard
                key={c.id}
                c={c}
                i={i}
                daysAway={c.__daysAway}
              />
            ))}
          </div>
        </section>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-md">
          {active && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="text-xl">{active.title}</DialogTitle>
                    <DialogDescription>
                      {formatLongDate(active.date)}
                    </DialogDescription>
                  </div>
                  {results[active.id] ? (
                    results[active.id].correct ? (
                      <Badge variant="success">
                        <Check className="h-3 w-3" /> Correct
                      </Badge>
                    ) : (
                      <Badge variant="danger">
                        <X className="h-3 w-3" /> Missed
                      </Badge>
                    )
                  ) : (
                    <Badge variant="outline">Unplayed</Badge>
                  )}
                </div>
              </DialogHeader>

              <SilhouettePlayer
                src={active.videoUrl}
                poster={active.posterUrl}
                caption="Replay"
                autoPlay
              />

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Answer</span>
                  <span className="font-display text-base">
                    {active.player}
                  </span>
                </div>
                {active.description && (
                  <p className="text-foreground/85">{active.description}</p>
                )}
                {results[active.id] && !results[active.id].correct && (
                  <p className="text-center text-xs text-muted-foreground">
                    You guessed:{" "}
                    <span className="font-semibold text-foreground">
                      {results[active.id].guess}
                    </span>
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- internal pieces ----------

function MonthHeader({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="sticky top-14 z-30 -mx-4 flex items-center justify-between border-b border-border/40 bg-background/85 px-4 py-2 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-[10px] font-semibold text-muted-foreground/80">
        {count} {count === 1 ? "pick" : "picks"}
      </span>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  icon,
  tone = "default",
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "danger";
}) {
  const toneClasses =
    tone === "success"
      ? "border-success/40 bg-success/10 text-success hover:bg-success/15"
      : tone === "danger"
        ? "border-danger/40 bg-danger/10 text-danger hover:bg-danger/15"
        : "border-border bg-muted/40 text-foreground hover:bg-muted/70";
  const activeClasses =
    tone === "success"
      ? "ring-1 ring-success/60 bg-success/20"
      : tone === "danger"
        ? "ring-1 ring-danger/60 bg-danger/20"
        : "ring-1 ring-accent/60 bg-accent/15 text-accent border-accent/40";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        toneClasses,
        active && activeClasses,
      )}
    >
      {icon}
      <span>{label}</span>
      <span
        className={cn(
          "ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
          active ? "bg-background/40" : "bg-background/60 text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ChallengeCard({
  c,
  i,
  result,
  onClick,
}: {
  c: Challenge;
  i: number;
  result?: Result;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(i, 6) * 0.04 }}
      type="button"
      onClick={onClick}
      className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-2xl border border-border bg-zinc-950 p-3 text-left transition-all hover:border-accent/60 hover:scale-[1.02]"
    >
      <ThumbnailArt
        status={result?.correct}
        poster={c.posterUrl}
      />

      <div className="absolute right-2 top-2 z-10">
        {result ? (
          result.correct ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success/20 text-success ring-1 ring-success/40 backdrop-blur">
              <Check className="h-4 w-4" />
            </span>
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-danger/20 text-danger ring-1 ring-danger/40 backdrop-blur">
              <X className="h-4 w-4" />
            </span>
          )
        ) : (
          <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur">
            New
          </span>
        )}
      </div>

      <div className="relative z-10">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {formatDate(c.date)}
        </div>
        <div className="text-sm font-display leading-tight">{c.title}</div>
        {result?.correct && (
          <div className="mt-0.5 truncate text-[10px] font-semibold text-success/90">
            {c.player}
          </div>
        )}
      </div>
    </motion.button>
  );
}

function UpcomingCard({
  c,
  i,
  daysAway,
}: {
  c: Challenge;
  i: number;
  daysAway: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(i, 6) * 0.04 }}
      className="relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-2xl border border-dashed border-border/70 bg-zinc-950/60 p-3 text-left opacity-80"
    >
      <ThumbnailArt status={undefined} dim />
      <div className="absolute right-2 top-2 z-10">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-muted-foreground backdrop-blur">
          <Lock className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="relative z-10">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          in {daysAway} day{daysAway === 1 ? "" : "s"}
        </div>
        <div className="text-sm font-display leading-tight text-muted-foreground">
          {formatDate(c.date)}
        </div>
      </div>
    </motion.div>
  );
}

function FilterEmptyState({
  filter,
  hasReleased,
}: {
  filter: Filter;
  hasReleased: boolean;
}) {
  if (!hasReleased) {
    return (
      <EmptyBox
        icon={<Inbox className="h-5 w-5" />}
        title="No published picks yet"
        body="Check back soon — the first daily drop is brewing."
      />
    );
  }
  if (filter === "solved") {
    return (
      <EmptyBox
        icon={<Trophy className="h-5 w-5" />}
        title="No solved picks yet"
        body="Take a swing at today's pick to start your collection."
      />
    );
  }
  if (filter === "missed") {
    return (
      <EmptyBox
        icon={<Sparkles className="h-5 w-5" />}
        title="Spotless record"
        body="No missed picks. Keep it going."
      />
    );
  }
  if (filter === "unplayed") {
    return (
      <EmptyBox
        icon={<Check className="h-5 w-5" />}
        title="All caught up"
        body="You've taken a guess on every released day."
      />
    );
  }
  return null;
}

function EmptyBox({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-muted/40 p-6 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 text-muted-foreground">
        {icon}
      </span>
      <div className="font-display text-sm">{title}</div>
      <p className="max-w-[24ch] text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

function ThumbnailArt({
  status,
  poster,
  dim,
}: {
  status?: boolean;
  poster?: string;
  dim?: boolean;
}) {
  // Use the real silhouette poster only when it's a fully-qualified URL
  // (i.e. came from Supabase Storage via --upload). Seed/relative paths
  // wouldn't actually resolve, so we fall through to the generated SVG and
  // never paint a broken-image icon. If a real poster errors at runtime we
  // also swap back to the fallback.
  const [posterFailed, setPosterFailed] = useState(false);
  const isAbsolute = !!poster && /^https?:\/\//i.test(poster);
  const showPoster = isAbsolute && !posterFailed;

  return (
    <div className={cn("absolute inset-0", dim && "opacity-50")}>
      <div
        className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black"
        aria-hidden
      />
      {showPoster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          loading="lazy"
          onError={() => setPosterFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <FallbackPlayerArt status={status} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
    </div>
  );
}

function FallbackPlayerArt({ status }: { status?: boolean }) {
  const tint =
    status === true ? "#16ff7a" : status === false ? "#ff3050" : "#ff2a2a";
  return (
    <svg
      viewBox="0 0 120 160"
      className="absolute inset-0 h-full w-full opacity-90"
    >
      {[20, 40, 60, 80, 100, 120, 140].map((y) => (
        <line
          key={y}
          x1="0"
          x2="120"
          y1={y}
          y2={y}
          stroke="#1a1a1a"
          strokeWidth="1"
        />
      ))}
      <g fill={tint} opacity={0.95}>
        <circle cx="60" cy="55" r="9" />
        <path d="M40 105 Q60 75 80 105 L78 125 Q60 117 42 125 Z" />
        <rect x="46" y="120" width="8" height="22" rx="3" />
        <rect x="66" y="120" width="8" height="22" rx="3" />
      </g>
      <g fill="#3a3a3a">
        <circle cx="25" cy="50" r="6" />
        <rect x="21" y="56" width="8" height="16" rx="3" />
        <circle cx="95" cy="50" r="6" />
        <rect x="91" y="56" width="8" height="16" rx="3" />
      </g>
    </svg>
  );
}

function groupByMonth(items: Challenge[]): Array<{
  key: string;
  label: string;
  items: Challenge[];
}> {
  const map = new Map<string, Challenge[]>();
  for (const c of items) {
    const key = c.date.slice(0, 7); // YYYY-MM
    const arr = map.get(key) ?? [];
    arr.push(c);
    map.set(key, arr);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, list]) => ({
      key,
      label: monthLabel(key),
      items: list,
    }));
}

function monthLabel(yyyymm: string): string {
  // Format YYYY-MM as "May 2026" without timezone surprises.
  const [y, m] = yyyymm.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
