import Fuse from "fuse.js";
import type { Challenge } from "./challenges";

/**
 * Normalize a name for comparison: lowercase, strip diacritics,
 * remove punctuation/jr/sr, collapse whitespace.
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns true if the user's guess matches the player's name closely enough.
 * Accepts:
 *  - exact full name
 *  - last name only
 *  - listed aliases
 *  - small typos (Levenshtein-ish via Fuse)
 */
export function isCorrectGuess(guess: string, challenge: Challenge): boolean {
  const g = normalize(guess);
  if (!g) return false;

  const candidates = new Set<string>();
  const full = normalize(challenge.player);
  candidates.add(full);
  const parts = full.split(" ");
  if (parts.length > 1) candidates.add(parts[parts.length - 1]); // last name
  for (const a of challenge.aliases ?? []) candidates.add(normalize(a));

  // Cheap exact / contains check first.
  for (const c of candidates) {
    if (c === g) return true;
  }

  // Fuzzy fallback with a tight threshold so we don't take "Brady" for "Graham".
  const fuse = new Fuse([...candidates], {
    threshold: 0.25,
    ignoreLocation: true,
    minMatchCharLength: 3,
  });
  return fuse.search(g).length > 0;
}
