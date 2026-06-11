import seed from "@/data/worldcup2026.json";
import type { Match, Stage, Team } from "@/types/worldcup";

type Venue = {
  stadium: string;
  city: string;
  country: string;
};

export const teams = seed.teams as Team[];
const venues = seed.venues as Venue[];

const pairings = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [3, 0],
  [1, 2]
];

const knockoutStages: Array<{ stage: Stage; count: number }> = [
  { stage: "Vòng 32 đội", count: 16 },
  { stage: "Vòng 16 đội", count: 8 },
  { stage: "Tứ kết", count: 4 },
  { stage: "Bán kết", count: 2 },
  { stage: "Tranh hạng ba", count: 1 },
  { stage: "Chung kết", count: 1 }
];

const stageStartDates: Record<Stage, string> = {
  "Vòng bảng": "2026-06-11",
  "Vòng 32 đội": "2026-06-28",
  "Vòng 16 đội": "2026-07-04",
  "Tứ kết": "2026-07-09",
  "Bán kết": "2026-07-14",
  "Tranh hạng ba": "2026-07-18",
  "Chung kết": "2026-07-19"
};

const times = ["02:00", "05:00", "08:00", "23:00"];

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getGroups() {
  return Array.from(new Set(teams.map((team) => team.group)));
}

export function getTeamById(teamId?: string) {
  return teams.find((team) => team.id === teamId);
}

function getVenue(index: number) {
  return venues[index % venues.length];
}

function buildGroupMatches() {
  let matchNumber = 1;

  return getGroups().flatMap((group, groupIndex) => {
    const groupTeams = teams.filter((team) => team.group === group);

    return pairings.map(([homeIndex, awayIndex], pairingIndex) => {
      const venue = getVenue(groupIndex * pairings.length + pairingIndex);
      const order = groupIndex * pairings.length + pairingIndex;

      return {
        id: `m-${matchNumber}`,
        matchNumber: matchNumber++,
        stage: "Vòng bảng",
        group,
        homeTeamId: groupTeams[homeIndex]?.id,
        awayTeamId: groupTeams[awayIndex]?.id,
        homeScore: null,
        awayScore: null,
        date: addDays(stageStartDates["Vòng bảng"], Math.floor(order / 4)),
        time: times[order % times.length],
        stadium: venue.stadium,
        city: venue.city,
        country: venue.country,
        status: "upcoming"
      } satisfies Match;
    });
  });
}

function buildKnockoutPlaceholders(startNumber: number) {
  const matches: Match[] = [];
  let matchNumber = startNumber;

  knockoutStages.forEach((round) => {
    for (let index = 0; index < round.count; index += 1) {
      const venue = getVenue(matchNumber + index);
      matches.push({
        id: `m-${matchNumber}`,
        matchNumber,
        stage: round.stage,
        homeTeamId: undefined,
        awayTeamId: undefined,
        homeScore: null,
        awayScore: null,
        date: addDays(stageStartDates[round.stage], Math.floor(index / 4)),
        time: times[index % times.length],
        stadium: venue.stadium,
        city: venue.city,
        country: venue.country,
        status: "upcoming"
      });
      matchNumber += 1;
    }
  });

  return matches;
}

export function getInitialMatches() {
  const groupMatches = buildGroupMatches();
  return [...groupMatches, ...buildKnockoutPlaceholders(groupMatches.length + 1)];
}
