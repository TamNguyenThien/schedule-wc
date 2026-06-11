import type { Match, Standing, Team } from "@/types/worldcup";

function emptyStanding(teamId: string): Standing {
  return {
    teamId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  };
}

export function sortStandings(a: Standing, b: Standing, teamsById: Map<string, Team>) {
  return (
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    (teamsById.get(a.teamId)?.name ?? "").localeCompare(teamsById.get(b.teamId)?.name ?? "")
  );
}

export function calculateStandings(teams: Team[], matches: Match[]) {
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const table = new Map<string, Standing>();

  teams.forEach((team) => table.set(team.id, emptyStanding(team.id)));

  matches
    .filter(
      (match) =>
        match.stage === "Vòng bảng" &&
        match.homeTeamId &&
        match.awayTeamId &&
        match.homeScore !== null &&
        match.awayScore !== null
    )
    .forEach((match) => {
      const home = table.get(match.homeTeamId as string);
      const away = table.get(match.awayTeamId as string);
      if (!home || !away || match.homeScore === null || match.awayScore === null) return;

      home.played += 1;
      away.played += 1;
      home.goalsFor += match.homeScore;
      home.goalsAgainst += match.awayScore;
      away.goalsFor += match.awayScore;
      away.goalsAgainst += match.homeScore;

      if (match.homeScore > match.awayScore) {
        home.won += 1;
        home.points += 3;
        away.lost += 1;
      } else if (match.homeScore < match.awayScore) {
        away.won += 1;
        away.points += 3;
        home.lost += 1;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }
    });

  table.forEach((standing) => {
    standing.goalDifference = standing.goalsFor - standing.goalsAgainst;
  });

  return Array.from(table.values()).reduce<Record<string, Standing[]>>((groups, standing) => {
    const group = teamsById.get(standing.teamId)?.group ?? "";
    groups[group] = [...(groups[group] ?? []), standing].sort((a, b) => sortStandings(a, b, teamsById));
    return groups;
  }, {});
}
