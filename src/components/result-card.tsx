"use client";

import { motion } from "framer-motion";
import { Check, X, Share2, CalendarDays, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/countdown";
import { cn, formatLongDate } from "@/lib/utils";
import type { Challenge } from "@/lib/challenges";
import type { Result } from "@/lib/storage";

type Props = {
  challenge: Challenge;
  result: Result;
};

export function ResultCard({ challenge, result }: Props) {
  const correct = result.correct;

  const handleShare = async () => {
    const verdict = correct
      ? `got it in ${result.attempts} ${result.attempts === 1 ? "try" : "tries"} ✅`
      : "missed it ❌";
    const text = `Picks Daily — ${formatLongDate(challenge.date)}\nI ${verdict}\n\nPlay: ${typeof window !== "undefined" ? window.location.origin : ""}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Picks Daily", text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Result copied to clipboard!");
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "rounded-2xl border bg-muted/40 p-5 backdrop-blur",
        correct
          ? "border-success/40 shadow-[0_0_30px_-12px_rgba(22,255,122,0.5)]"
          : "border-danger/40 shadow-[0_0_30px_-12px_rgba(255,48,80,0.5)]",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            correct ? "bg-success/20 text-success" : "bg-danger/20 text-danger",
          )}
        >
          {correct ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {correct ? "Nailed it" : "Not quite"}
          </div>
          <div className="text-xl font-display tracking-tight">
            {challenge.player}
          </div>
        </div>
        <Badge variant="outline">{challenge.team}</Badge>
      </div>

      <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/90">
        <p>{challenge.description}</p>
        <div className="flex items-start gap-2 rounded-xl border border-border bg-background/40 p-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="text-sm text-foreground/85">
            <span className="font-semibold text-foreground">Fun fact —</span>{" "}
            {challenge.funFact}
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button onClick={handleShare} variant={correct ? "success" : "default"} className="flex-1">
          <Share2 className="h-4 w-4" />
          Share Result
        </Button>
        <Button asChild variant="secondary">
          <Link href="/archive">
            <CalendarDays className="h-4 w-4" />
            Archive
          </Link>
        </Button>
      </div>

      {!correct && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          You guessed: <span className="font-semibold text-foreground">{result.guess}</span>
        </p>
      )}

      <Countdown className="mt-4" />
    </motion.div>
  );
}
