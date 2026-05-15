"use client";

import { useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GuessForm } from "@/components/guess-form";
import { ResultCard } from "@/components/result-card";
import { SilhouettePlayer } from "@/components/silhouette-player";
import { HintStrip } from "@/components/hint-strip";
import { getTodaysChallenge } from "@/lib/challenges";
import { isCorrectGuess } from "@/lib/match";
import { useResults, type Result } from "@/lib/storage";
import { formatLongDate } from "@/lib/utils";

const MAX_ATTEMPTS = 5;

export default function TodayPage() {
  const challenge = useMemo(() => getTodaysChallenge(), []);
  const { results, saveResult } = useResults();
  const stored = results[challenge.id];

  // Live attempts in the current session — once a result is committed to
  // storage, that becomes the source of truth.
  const [sessionAttempts, setSessionAttempts] = useState(0);
  const [shake, setShake] = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);

  const attempts = stored?.attempts ?? sessionAttempts;
  const locked = !!stored && (stored.correct || stored.attempts >= MAX_ATTEMPTS);

  const fireConfetti = () => {
    const burst = (origin: { x: number; y: number }) =>
      confetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 45,
        origin,
        colors: ["#ff2a2a", "#16ff7a", "#ffffff", "#ff0033"],
      });
    burst({ x: 0.2, y: 0.4 });
    setTimeout(() => burst({ x: 0.8, y: 0.4 }), 120);
    setTimeout(() => burst({ x: 0.5, y: 0.3 }), 240);
  };

  const handleGuess = (guess: string) => {
    const correct = isCorrectGuess(guess, challenge);
    const nextAttempts = attempts + 1;
    setSessionAttempts(nextAttempts);

    if (correct) {
      const result: Result = {
        id: challenge.id,
        date: challenge.date,
        guess,
        correct: true,
        attempts: nextAttempts,
        playedAt: Date.now(),
      };
      saveResult(result);
      fireConfetti();
    } else if (nextAttempts >= MAX_ATTEMPTS) {
      const result: Result = {
        id: challenge.id,
        date: challenge.date,
        guess,
        correct: false,
        attempts: nextAttempts,
        playedAt: Date.now(),
      };
      saveResult(result);
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 600);
      setShake((s) => s + 1);
    } else {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 600);
      setShake((s) => s + 1);
    }
  };

  return (
    <div className="flex flex-col gap-4 pt-2">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-end justify-between"
      >
        <div>
          <Badge variant="accent" className="mb-1">
            <Eye className="h-3 w-3" /> Today&apos;s Pick
          </Badge>
          <h1 className="font-display text-2xl leading-tight tracking-tight">
            Who&apos;s in the red?
          </h1>
          <p className="text-xs text-muted-foreground">
            {formatLongDate(challenge.date)} · {challenge.title}
          </p>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{
          opacity: 1,
          scale: 1,
          boxShadow: wrongFlash
            ? "0 0 0 2px rgba(255,48,80,0.7)"
            : "0 0 0 0px rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.3 }}
        className="rounded-3xl"
      >
        <SilhouettePlayer
          src={challenge.videoUrl}
          poster={challenge.posterUrl}
          caption="Spot the player in red"
        />
      </motion.div>

      {!locked ? (
        <>
          <HintStrip challenge={challenge} attempts={attempts} />
          <GuessForm
            onSubmit={handleGuess}
            attempts={attempts}
            shake={shake}
          />
          {attempts > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              {MAX_ATTEMPTS - attempts}{" "}
              {MAX_ATTEMPTS - attempts === 1 ? "guess" : "guesses"} left
            </p>
          )}
        </>
      ) : (
        <ResultCard challenge={challenge} result={stored!} />
      )}
    </div>
  );
}
