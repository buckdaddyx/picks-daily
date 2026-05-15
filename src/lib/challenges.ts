import "server-only";
import { getSupabasePublic } from "./supabase";

export type Challenge = {
  id: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  title: string;
  /** Canonical answer (full name). */
  player: string;
  /** Other accepted aliases (last names, common spellings, etc.) */
  aliases?: string[];
  team?: string;
  position?: string;
  jersey?: number;
  videoUrl: string;
  posterUrl?: string;
  description?: string;
  funFact?: string;
};

/** Today's local date as YYYY-MM-DD. */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------- DB row → app type ----------

type Row = {
  id: string;
  publish_date: string;
  title: string;
  player: string;
  aliases: string[] | null;
  team: string | null;
  position: string | null;
  jersey: number | null;
  video_url: string;
  poster_url: string | null;
  description: string | null;
  fun_fact: string | null;
};

function fromRow(r: Row): Challenge {
  return {
    id: r.id,
    date: r.publish_date,
    title: r.title,
    player: r.player,
    aliases: r.aliases ?? undefined,
    team: r.team ?? undefined,
    position: r.position ?? undefined,
    jersey: r.jersey ?? undefined,
    videoUrl: r.video_url,
    posterUrl: r.poster_url ?? undefined,
    description: r.description ?? undefined,
    funFact: r.fun_fact ?? undefined,
  };
}

// ---------- queries ----------

/**
 * Returns today's challenge — or the most recent past one if today's hasn't
 * been seeded yet (so the game is always playable).
 *
 * RLS already filters out unpublished / future-dated rows, so the latest row
 * we see *is* the latest playable one.
 */
export async function getTodaysChallenge(): Promise<Challenge | null> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase
    .from("pd_challenges")
    .select("*")
    .order("publish_date", { ascending: false })
    .limit(1)
    .maybeSingle<Row>();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

/** All published challenges, newest first. Used by the archive grid. */
export async function getArchive(): Promise<Challenge[]> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase
    .from("pd_challenges")
    .select("*")
    .order("publish_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getChallengeById(
  id: string,
): Promise<Challenge | null> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase
    .from("pd_challenges")
    .select("*")
    .eq("id", id)
    .maybeSingle<Row>();
  if (error) throw error;
  return data ? fromRow(data) : null;
}
