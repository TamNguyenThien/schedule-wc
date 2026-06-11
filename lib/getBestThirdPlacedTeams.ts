import type { Standing, Team } from "@/types/worldcup";
import { sortStandings } from "./calculateStandings";

export function getBestThirdPlacedTeams(groupStandings: Record<string, Standing[]>, teams: Team[]) {
  const teamsById = new Map(teams.map((team) => [team.id, team]));

  return Object.values(groupStandings)
    .map((standings) => standings[2])
    .filter(Boolean)
    .sort((a, b) => sortStandings(a, b, teamsById))
    .slice(0, 8);
}
