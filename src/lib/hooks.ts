"use client";

import { useCallback, useSyncExternalStore } from "react";
import { msUntilNextDay } from "./utils";

// ---------- countdown ----------

function subscribeTick(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const id = window.setInterval(onChange, 1000);
  return () => window.clearInterval(id);
}

function getCountdown(): number {
  return msUntilNextDay();
}
function getCountdownServer(): number {
  return 0;
}

/** Milliseconds until next local midnight, ticking every second on the client. */
export function useCountdown(): number {
  return useSyncExternalStore(subscribeTick, getCountdown, getCountdownServer);
}

// ---------- first-visit / tutorial ----------

const FIRST_VISIT_KEY = "picks-daily/seen-tutorial.v1";
const TUTORIAL_EVENT = "picks-daily:tutorial-seen";

function subscribeFirstVisit(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(TUTORIAL_EVENT, onChange);
  return () => window.removeEventListener(TUTORIAL_EVENT, onChange);
}

function getFirstVisit(): boolean {
  if (typeof window === "undefined") return false;
  return !window.localStorage.getItem(FIRST_VISIT_KEY);
}
function getFirstVisitServer(): boolean {
  return false;
}

/**
 * Returns `true` exactly once — the very first time the user opens the app
 * on this device. Subsequent calls (after `markSeen()`) return `false`.
 */
export function useFirstVisit(): {
  isFirstVisit: boolean;
  markSeen: () => void;
} {
  const isFirstVisit = useSyncExternalStore(
    subscribeFirstVisit,
    getFirstVisit,
    getFirstVisitServer,
  );

  const markSeen = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(FIRST_VISIT_KEY, "1");
    window.dispatchEvent(new Event(TUTORIAL_EVENT));
  }, []);

  return { isFirstVisit, markSeen };
}
