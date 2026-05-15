"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Result = {
  /** Challenge id, e.g. "day-01". */
  id: string;
  /** Challenge date YYYY-MM-DD. */
  date: string;
  /** Final guess submitted by the user. */
  guess: string;
  correct: boolean;
  /** ms since epoch */
  playedAt: number;
  /** Number of attempts used. */
  attempts: number;
};

const STORAGE_KEY = "picks-daily/results.v1";
const EVENT_NAME = "picks-daily:results";

function safeParse(json: string | null): Record<string, Result> {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, Result>;
    }
  } catch {}
  return {};
}

// Cached snapshot so useSyncExternalStore returns a stable identity between
// reads when nothing changed (otherwise React will throw "infinite loop").
let cache: Record<string, Result> = {};
let cacheKey = "";

function readAll(): Record<string, Result> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "";
  if (raw === cacheKey) return cache;
  cacheKey = raw;
  cache = safeParse(raw);
  return cache;
}

const EMPTY: Record<string, Result> = {};

function subscribe(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT_NAME, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT_NAME, onChange);
  };
}

function writeAll(map: Record<string, Result>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(EVENT_NAME));
}

/** React hook giving live access to all stored results. */
export function useResults() {
  const results = useSyncExternalStore(
    subscribe,
    readAll,
    () => EMPTY, // server snapshot
  );

  const saveResult = useCallback((r: Result) => {
    const all = readAll();
    writeAll({ ...all, [r.id]: r });
  }, []);

  const clearAll = useCallback(() => {
    writeAll({});
  }, []);

  return { results, saveResult, clearAll };
}

/**
 * Compute current streak — the number of consecutive most-recent days
 * (by challenge date) the user has guessed correctly.
 */
export function computeStreak(results: Record<string, Result>): number {
  const correct = Object.values(results)
    .filter((r) => r.correct)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  if (correct.length === 0) return 0;

  let streak = 1;
  for (let i = 1; i < correct.length; i++) {
    const prev = new Date(correct[i - 1].date);
    const curr = new Date(correct[i].date);
    const diffDays = Math.round(
      (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 1) streak += 1;
    else break;
  }
  return streak;
}

export type StatsSummary = {
  played: number;
  correct: number;
  winRate: number; // 0..1
  currentStreak: number;
  bestStreak: number;
};

export function summarize(results: Record<string, Result>): StatsSummary {
  const all = Object.values(results);
  const played = all.length;
  const correct = all.filter((r) => r.correct).length;
  const winRate = played === 0 ? 0 : correct / played;
  const currentStreak = computeStreak(results);

  // Best streak: walk through correct results sorted ascending by date.
  const correctSorted = all
    .filter((r) => r.correct)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  let best = 0;
  let run = 0;
  let prevDate: Date | null = null;
  for (const r of correctSorted) {
    const d = new Date(r.date);
    if (!prevDate) {
      run = 1;
    } else {
      const diff = Math.round(
        (d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      run = diff === 1 ? run + 1 : 1;
    }
    prevDate = d;
    if (run > best) best = run;
  }

  return { played, correct, winRate, currentStreak, bestStreak: best };
}
