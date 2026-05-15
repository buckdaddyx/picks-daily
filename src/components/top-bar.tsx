"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Flame, HelpCircle } from "lucide-react";
import { useResults, computeStreak } from "@/lib/storage";
import { useFirstVisit } from "@/lib/hooks";
import { HowToPlayDialog } from "@/components/how-to-play-dialog";

export function TopBar() {
  const { results } = useResults();
  const streak = useMemo(() => computeStreak(results), [results]);
  const [howOpen, setHowOpen] = useState(false);
  const { isFirstVisit, markSeen } = useFirstVisit();
  const open = howOpen || isFirstVisit;
  const setOpen = (v: boolean) => {
    if (!v && isFirstVisit) markSeen();
    setHowOpen(v);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-7 w-7 rounded-md bg-accent flex items-center justify-center font-display text-white text-sm shadow-[0_0_18px_-4px_rgba(255,42,42,0.7)]">
            P
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-success" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-display tracking-tight">PICKS</div>
            <div className="-mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Daily
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-semibold"
            title={`Current streak: ${streak} day${streak === 1 ? "" : "s"}`}
          >
            <Flame
              className={`h-3.5 w-3.5 ${streak > 0 ? "text-accent" : "text-muted-foreground"}`}
            />
            <span className={streak > 0 ? "text-foreground" : "text-muted-foreground"}>
              {streak}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setHowOpen(true)}
            aria-label="How to play"
            className="rounded-full border border-border bg-muted/60 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
      <HowToPlayDialog open={open} onOpenChange={setOpen} />
    </header>
  );
}
