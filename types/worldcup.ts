export type Stage =
  | "Vòng bảng"
  | "Vòng 32 đội"
  | "Vòng 16 đội"
  | "Tứ kết"
  | "Bán kết"
  | "Tranh hạng ba"
  | "Chung kết";

export type MatchStatus = "upcoming" | "live" | "finished";

export type Team = {
  id: string;
  name: string;
  shortName: string;
  flag: string;
  group: string;
  confederation: string;
  coach?: TeamCoach | null;
  squad?: TeamPlayer[];
};

export type TeamCoach = {
  id?: number;
  name: string;
  dateOfBirth?: string | null;
  nationality?: string | null;
};

export type TeamPlayer = {
  id?: number;
  name: string;
  position?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  shirtNumber?: number | null;
  marketValue?: number | null;
};

export type Match = {
  id: string;
  matchNumber: number;
  stage: Stage;
  group?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  time: string;
  stadium: string;
  city: string;
  country: string;
  status: MatchStatus;
  matchUrl?: string;
};

export type Standing = {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type BracketMatch = {
  id: string;
  round: Exclude<Stage, "Vòng bảng">;
  slot: number;
  homeLabel: string;
  awayLabel: string;
  homeFlag?: string;
  awayFlag?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeSource?: string;
  awaySource?: string;
  isProjected?: boolean;
  sourceMatchId?: string;
};

export type TeamHistoryItem = {
  year: number;
  host: string;
  result: string;
};

export type TeamProfile = {
  code: string;
  aliases: string[];
  teamIds: string[];
  localName: string;
  countryCode?: string;
  flagUrl?: string;
  coach?: string;
  federation?: string;
  fifaRanking?: number;
  bestResult?: string;
  overview: string;
  history: TeamHistoryItem[];
  keyPlayers?: string[];
};
