"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Lock, CalendarDays } from "lucide-react";
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
import { useResults } from "@/lib/storage";
import { cn, formatDate, formatLongDate } from "@/lib/utils";

export function ArchiveView({ challenges }: { challenges: Challenge[] }) {
  const { results } = useResults();
  const today = new Date();
  const [active, setActive] = useState<Challenge | null>(null);

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

      {challenges.length === 0 ? (
        <p className="rounded-2xl border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          No published challenges yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {challenges.map((c, i) => {
            const result = results[c.id];
            const released = new Date(c.date) <= today;
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                type="button"
                disabled={!released}
                onClick={() => released && setActive(c)}
                className={cn(
                  "group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-2xl border border-border bg-zinc-950 p-3 text-left transition-all",
                  released
                    ? "hover:border-accent/60 hover:scale-[1.02]"
                    : "opacity-50 cursor-not-allowed",
                )}
              >
                <ThumbnailArt status={result?.correct} />

                <div className="absolute right-2 top-2 z-10">
                  {!released ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-muted-foreground backdrop-blur">
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                  ) : result ? (
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
                  <div className="text-sm font-display leading-tight">
                    {c.title}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
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

function ThumbnailArt({ status }: { status?: boolean }) {
  const tint =
    status === true ? "#16ff7a" : status === false ? "#ff3050" : "#ff2a2a";
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black"
        aria-hidden
      />
      <svg viewBox="0 0 120 160" className="absolute inset-0 h-full w-full opacity-90">
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
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
    </div>
  );
}
