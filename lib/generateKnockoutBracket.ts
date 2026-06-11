import type { BracketMatch, Standing, Team } from "@/types/worldcup";
import { getBestThirdPlacedTeams } from "./getBestThirdPlacedTeams";

const round32PairingOrder = [
  [0, 31],
  [15, 16],
  [7, 24],
  [8, 23],
  [3, 28],
  [12, 19],
  [4, 27],
  [11, 20],
  [1, 30],
  [14, 17],
  [6, 25],
  [9, 22],
  [2, 29],
  [13, 18],
  [5, 26],
  [10, 21]
];

function teamLabel(teamId: string, teamsById: Map<string, Team>) {
  const team = teamsById.get(teamId);
  return team ? team.name : "TBD";
}

function teamFlag(teamId: string, teamsById: Map<string, Team>) {
  return teamsById.get(teamId)?.flag;
}

function teamSource(teamId: string, teamsById: Map<string, Team>, standing?: Standing) {
  const team = teamsById.get(teamId);
  if (!team) return "Chưa xác định";
  const place =
    standing && standing.played > 0
      ? `${standing.points} điểm, hiệu số ${standing.goalDifference >= 0 ? "+" : ""}${standing.goalDifference}`
      : "dự kiến theo thứ tự bảng";
  return `Bảng ${team.group} • ${place}`;
}

export function getQualifiedTeams(groupStandings: Record<string, Standing[]>, teams: Team[]) {
  const topTwo = Object.values(groupStandings).flatMap((standings) => standings.slice(0, 2));
  const bestThird = getBestThirdPlacedTeams(groupStandings, teams);
  return [...topTwo, ...bestThird];
}

export function generateKnockoutBracket(
  groupStandings: Record<string, Standing[]>,
  teams: Team[]
): BracketMatch[] {
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const groupsComplete = Object.values(groupStandings).every((standings) =>
    standings.every((standing) => standing.played === 3)
  );
  const qualified = getQualifiedTeams(groupStandings, teams);

  if (qualified.length < 32) return [];

  const round32 = round32PairingOrder.map(([homeIndex, awayIndex], index) => ({
    id: `r32-${index + 1}`,
    round: "Vòng 32 đội",
    slot: index + 1,
    homeLabel: teamLabel(qualified[homeIndex].teamId, teamsById),
    awayLabel: teamLabel(qualified[awayIndex].teamId, teamsById),
    homeFlag: teamFlag(qualified[homeIndex].teamId, teamsById),
    awayFlag: teamFlag(qualified[awayIndex].teamId, teamsById),
    homeTeamId: qualified[homeIndex].teamId,
    awayTeamId: qualified[awayIndex].teamId,
    homeSource: teamSource(qualified[homeIndex].teamId, teamsById, qualified[homeIndex]),
    awaySource: teamSource(qualified[awayIndex].teamId, teamsById, qualified[awayIndex]),
    isProjected: !groupsComplete
  })) satisfies BracketMatch[];

  const laterRounds = [
    { round: "Vòng 16 đội", count: 8 },
    { round: "Tứ kết", count: 4 },
    { round: "Bán kết", count: 2 },
    { round: "Tranh hạng ba", count: 1 },
    { round: "Chung kết", count: 1 }
  ] as const;

  return [
    ...round32,
    ...laterRounds.flatMap(({ round, count }) =>
      Array.from({ length: count }, (_, index) => ({
        id: `${round}-${index + 1}`,
        round,
        slot: index + 1,
        homeLabel: "TBD",
        awayLabel: "TBD",
        homeSource: `Đội thắng nhánh ${index * 2 + 1}`,
        awaySource: `Đội thắng nhánh ${index * 2 + 2}`,
        isProjected: !groupsComplete
      }))
    )
  ];
}
