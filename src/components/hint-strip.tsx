"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Challenge } from "@/lib/challenges";

type Props = {
  challenge: Challenge;
  attempts: number;
};

type Hint = {
  unlockAt: number; // attempt count after which this hint unlocks
  label: string;
  value: string | undefined;
};

/**
 * A row of progressive hints. They unlock as the user uses up attempts.
 * Each hint that doesn't have a value (e.g. challenge missing position) is
 * silently skipped so the row doesn't show empty placeholders.
 */
export function HintStrip({ challenge, attempts }: Props) {
  const hints: Hint[] = [
    { unlockAt: 1, label: "Position", value: challenge.position },
    { unlockAt: 2, label: "Team", value: challenge.team },
    { unlockAt: 3, label: "Jersey", value: challenge.jersey ? `#${challenge.jersey}` : undefined },
  ].filter((h) => !!h.value) as Hint[];

  if (hints.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <Lightbulb className="h-4 w-4 shrink-0 text-muted-foreground" />
      {hints.map((h) => {
        const unlocked = attempts >= h.unlockAt;
        return (
          <AnimatePresence key={h.label} mode="popLayout">
            <motion.div
              layout
              initial={false}
              animate={{
                scale: unlocked ? 1 : 0.96,
              }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
                unlocked
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
              title={
                unlocked
                  ? `${h.label}: ${h.value}`
                  : `Unlocks after ${h.unlockAt} wrong guess${h.unlockAt === 1 ? "" : "es"}`
              }
            >
              {!unlocked && <Lock className="h-3 w-3" />}
              <span className="opacity-80">{h.label}:</span>
              <span>{unlocked ? h.value : "•••"}</span>
            </motion.div>
          </AnimatePresence>
        );
      })}
    </div>
  );
}
