"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Trophy,
  Target,
  CheckCircle2,
  RotateCcw,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useResults, summarize } from "@/lib/storage";
import { CHALLENGES } from "@/lib/challenges";
import { cn } from "@/lib/utils";

export default function StatsPage() {
  const { results, clearAll } = useResults();
  const stats = useMemo(() => summarize(results), [results]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Distribution of attempts taken on correct guesses (1..5).
  const attemptBuckets = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    for (const r of Object.values(results)) {
      if (r.correct && r.attempts >= 1 && r.attempts <= 5) {
        buckets[r.attempts - 1] += 1;
      }
    }
    return buckets;
  }, [results]);

  const maxBucket = Math.max(1, ...attemptBuckets);

  return (
    <div className="flex flex-col gap-5 pt-2">
      <header>
        <Badge variant="accent" className="mb-1">
          <BarChart3 className="h-3 w-3" /> Stats
        </Badge>
        <h1 className="font-display text-2xl tracking-tight">Your Numbers</h1>
        <p className="text-xs text-muted-foreground">
          Stored locally on this device. Nothing leaves your phone.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Flame className="h-4 w-4" />}
          label="Current Streak"
          value={stats.currentStreak}
          accent
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Best Streak"
          value={stats.bestStreak}
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Correct"
          value={stats.correct}
        />
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Win Rate"
          value={`${Math.round(stats.winRate * 100)}%`}
        />
      </div>

      <section className="rounded-2xl border border-border bg-muted/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base">Guess Distribution</h2>
          <span className="text-xs text-muted-foreground">
            {stats.played} / {CHALLENGES.length} played
          </span>
        </div>
        <div className="space-y-2">
          {attemptBuckets.map((count, i) => {
            const width = (count / maxBucket) * 100;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 text-center text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-background/60">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(width, count > 0 ? 8 : 2)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.05 }}
                    className={cn(
                      "h-full rounded-md",
                      count > 0
                        ? "bg-gradient-to-r from-accent/80 to-accent"
                        : "bg-border",
                    )}
                  />
                  <span className="absolute inset-y-0 right-2 flex items-center text-xs font-semibold text-foreground">
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-muted/40 p-4">
        <h2 className="mb-2 font-display text-base">Recent Results</h2>
        {Object.keys(results).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No games played yet — head to today&apos;s pick.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {Object.values(results)
              .sort((a, b) => b.playedAt - a.playedAt)
              .slice(0, 8)
              .map((r) => {
                const c = CHALLENGES.find((x) => x.id === r.id);
                return (
                  <li
                    key={r.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {c?.title ?? r.id}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.date} · {r.attempts}{" "}
                        {r.attempts === 1 ? "try" : "tries"}
                      </div>
                    </div>
                    {r.correct ? (
                      <Badge variant="success">Win</Badge>
                    ) : (
                      <Badge variant="danger">Miss</Badge>
                    )}
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      <Button
        variant="ghost"
        size="sm"
        className="self-center text-muted-foreground"
        onClick={() => setConfirmOpen(true)}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset all stats
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset everything?</DialogTitle>
            <DialogDescription>
              This wipes your streak, history, and all results from this device.
              Can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="secondary" className="flex-1">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                clearAll();
                setConfirmOpen(false);
              }}
            >
              Reset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-2xl border bg-muted/40 p-4",
        accent ? "border-accent/40 glow-red" : "border-border",
      )}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <span className={accent ? "text-accent" : "text-foreground/70"}>
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-2 font-display text-3xl tracking-tight">{value}</div>
    </motion.div>
  );
}
