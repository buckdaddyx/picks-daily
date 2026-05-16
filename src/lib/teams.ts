/**
 * Common NFL team primary colors. Used by the admin tool to one-click set
 * the --keep hex without an eyedropper. Broadcast color-grading drifts these
 * a lot, so use them as starting points and tune --tolerance as needed.
 */
export const TEAM_COLORS: Array<{ team: string; hex: string }> = [
  { team: "Arizona Cardinals", hex: "#97233F" },
  { team: "Atlanta Falcons", hex: "#A71930" },
  { team: "Baltimore Ravens", hex: "#241773" },
  { team: "Buffalo Bills", hex: "#00338D" },
  { team: "Carolina Panthers", hex: "#0085CA" },
  { team: "Chicago Bears", hex: "#0B162A" },
  { team: "Cincinnati Bengals", hex: "#FB4F14" },
  { team: "Cleveland Browns", hex: "#311D00" },
  { team: "Dallas Cowboys", hex: "#869397" },
  { team: "Denver Broncos", hex: "#FB4F14" },
  { team: "Detroit Lions", hex: "#0076B6" },
  { team: "Green Bay Packers", hex: "#203731" },
  { team: "Houston Texans", hex: "#03202F" },
  { team: "Indianapolis Colts", hex: "#002C5F" },
  { team: "Jacksonville Jaguars", hex: "#101820" },
  { team: "Kansas City Chiefs", hex: "#E31837" },
  { team: "Las Vegas Raiders", hex: "#000000" },
  { team: "Los Angeles Chargers", hex: "#0080C6" },
  { team: "Los Angeles Rams", hex: "#003594" },
  { team: "Miami Dolphins", hex: "#008E97" },
  { team: "Minnesota Vikings", hex: "#4F2683" },
  { team: "New England Patriots", hex: "#002244" },
  { team: "New Orleans Saints", hex: "#D3BC8D" },
  { team: "New York Giants", hex: "#0B2265" },
  { team: "New York Jets", hex: "#125740" },
  { team: "Philadelphia Eagles", hex: "#004C54" },
  { team: "Pittsburgh Steelers", hex: "#FFB612" },
  { team: "San Francisco 49ers", hex: "#AA0000" },
  { team: "Seattle Seahawks", hex: "#002244" },
  { team: "Tampa Bay Buccaneers", hex: "#D50A0A" },
  { team: "Tennessee Titans", hex: "#0C2340" },
  { team: "Washington Commanders", hex: "#5A1414" },
];

export const POSITIONS = [
  "QB", "RB", "FB", "WR", "TE", "OL", "C", "G", "T",
  "DE", "DT", "NT", "LB", "OLB", "ILB", "MLB",
  "CB", "S", "FS", "SS",
  "K", "P", "LS", "KR", "PR",
] as const;

export type Position = (typeof POSITIONS)[number];
