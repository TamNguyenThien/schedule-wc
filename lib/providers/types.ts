import type { Match, Team } from "@/types/worldcup";

export type WorldCupData = {
  provider: "mock" | "football-data";
  updatedAt: string;
  teams: Team[];
  matches: Match[];
};

export type WorldCupProvider = {
  getWorldCupData: () => Promise<WorldCupData>;
};
