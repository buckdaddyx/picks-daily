export type Challenge = {
  id: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  title: string;
  /** Canonical answer (full name). */
  player: string;
  /** Other accepted aliases (last names, common spellings, etc.) */
  aliases?: string[];
  team: string;
  /** Position abbreviation, e.g. "WR", "RB", "DE". Used by the hint system. */
  position?: string;
  /** Jersey number, used by the hint system. */
  jersey?: number;
  videoUrl: string;
  /** Static silhouette frame used in archive cards / loading state. */
  posterUrl?: string;
  description: string;
  funFact: string;
};

/**
 * Seed challenges. Add new days here — the app will automatically pick the
 * one whose `date` matches today (in the user's local timezone), and fall
 * back to the most recent past challenge otherwise.
 *
 * Replace `videoUrl` with the real silhouette MP4 once it's exported.
 * Suggested location: /public/videos/day-XX.mp4 (vertical 9:16).
 */
export const CHALLENGES: Challenge[] = [
  {
    id: "day-01",
    date: "2026-05-10",
    title: "The Super Bowl Catch",
    player: "Julian Edelman",
    aliases: ["edelman", "julian edelman", "jules"],
    team: "New England Patriots",
    position: "WR",
    jersey: 11,
    videoUrl: "/videos/day-01.mp4",
    posterUrl: "/posters/day-01.jpg",
    description:
      "Down 28-3 in Super Bowl LI, this Patriots receiver pinned the ball against a defender's leg, fingertips inches from the turf, sparking the greatest comeback in NFL history.",
    funFact:
      "The catch was reviewed for nearly two minutes — replay officials confirmed the ball never touched the ground.",
  },
  {
    id: "day-02",
    date: "2026-05-11",
    title: "Super Bowl Pick Six",
    player: "Cooper DeJean",
    aliases: ["dejean", "cooper dejean", "quinyon dejean"],
    team: "Philadelphia Eagles",
    position: "CB",
    jersey: 33,
    videoUrl: "/videos/day-02.mp4",
    posterUrl: "/posters/day-02.jpg",
    description:
      "Super Bowl LIX. The rookie corner jumped a Mahomes route on his 22nd birthday and took it 38 yards to the house — flipping the game wide open.",
    funFact:
      "He became the first player in NFL history to score a Super Bowl touchdown on his birthday.",
  },
  {
    id: "day-03",
    date: "2026-05-12",
    title: "The Catch That Wasn't",
    player: "Dez Bryant",
    aliases: ["dez", "dez bryant", "bryant"],
    team: "Dallas Cowboys",
    position: "WR",
    jersey: 88,
    videoUrl: "/videos/day-03.mp4",
    posterUrl: "/posters/day-03.jpg",
    description:
      "2014 Divisional round vs. Green Bay. He went up over Sam Shields, came down at the 1-yard line… and watched it overturned. The 'Calvin Johnson rule' robbed Dallas.",
    funFact:
      "The NFL rewrote the catch rule less than three years later — partly because of this play.",
  },
  {
    id: "day-04",
    date: "2026-05-13",
    title: "32-Yard Dagger",
    player: "Ezekiel Elliott",
    aliases: ["zeke", "ezekiel elliott", "elliott"],
    team: "Dallas Cowboys",
    position: "RB",
    jersey: 21,
    videoUrl: "/videos/day-04.mp4",
    posterUrl: "/posters/day-04.jpg",
    description:
      "Dallas vs. Pittsburgh, 2016. With 9 seconds left and the Cowboys down 1, the rookie running back hit a cutback lane and sprinted untouched for the game winner.",
    funFact:
      "He celebrated by leaping into the giant Salvation Army red kettle behind the end zone — earning a 'goodwill' fine from the league.",
  },
  {
    id: "day-05",
    date: "2026-05-14",
    title: "Strip Sack on Brady",
    player: "Brandon Graham",
    aliases: ["graham", "brandon graham", "bg"],
    team: "Philadelphia Eagles",
    position: "DE",
    jersey: 55,
    videoUrl: "/videos/day-05.mp4",
    posterUrl: "/posters/day-05.jpg",
    description:
      "Super Bowl LII, fourth quarter. The veteran defensive end ripped through the line, knocked the ball loose from Tom Brady, and effectively sealed Philly's first-ever Lombardi.",
    funFact:
      "It was Graham's only sack of the entire postseason — and it came at the perfect moment.",
  },
];

/** Returns a challenge by date (YYYY-MM-DD) or `undefined`. */
export function getChallengeByDate(date: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.date === date);
}

/** Returns a challenge by id. */
export function getChallengeById(id: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

/** Today's local date as YYYY-MM-DD. */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Returns today's challenge if seeded, otherwise the most recent past one
 * (so the game always has something to play).
 */
export function getTodaysChallenge(): Challenge {
  const today = todayISO();
  const exact = getChallengeByDate(today);
  if (exact) return exact;
  const past = CHALLENGES.filter((c) => c.date <= today).sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );
  return past[0] ?? CHALLENGES[CHALLENGES.length - 1];
}

/** All challenges sorted newest first — handy for the archive grid. */
export function getArchive(): Challenge[] {
  return [...CHALLENGES].sort((a, b) => (a.date < b.date ? 1 : -1));
}
