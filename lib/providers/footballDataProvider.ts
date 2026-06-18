import type { Match, MatchStatus, Team } from "@/types/worldcup";
import type { WorldCupProvider } from "./types";

type FootballDataTeam = {
  id: number | null;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
  coach?: {
    id?: number;
    name?: string;
    dateOfBirth?: string | null;
    nationality?: string | null;
  } | null;
  squad?: Array<{
    id?: number;
    name: string;
    position?: string | null;
    dateOfBirth?: string | null;
    nationality?: string | null;
    shirtNumber?: number | null;
    marketValue?: number | null;
  }>;
};

type FootballDataMatch = {
  id: number;
  matchday?: number;
  stage?: string;
  group?: string;
  utcDate: string;
  status: string;
  homeTeam?: FootballDataTeam;
  awayTeam?: FootballDataTeam;
  score?: {
    fullTime?: {
      home: number | null;
      away: number | null;
    };
  };
  venue?: string;
};

const apiBaseUrl = "https://api.football-data.org/v4";
const vietnamTimeZone = "Asia/Ho_Chi_Minh";

function normalizeStatus(status: string): MatchStatus {
  if (["LIVE", "IN_PLAY", "PAUSED"].includes(status)) return "live";
  if (status === "FINISHED") return "finished";
  return "upcoming";
}

function normalizeStage(stage?: string): Match["stage"] {
  const value = stage?.toUpperCase() ?? "";
  if (value.includes("LAST_32")) return "Vòng 32 đội";
  if (value.includes("LAST_16")) return "Vòng 16 đội";
  if (value.includes("QUARTER")) return "Tứ kết";
  if (value.includes("SEMI")) return "Bán kết";
  if (value.includes("THIRD")) return "Tranh hạng ba";
  if (value.includes("FINAL")) return "Chung kết";
  return "Vòng bảng";
}

function teamId(team?: FootballDataTeam) {
  return team?.id ? `fd-${team.id}` : undefined;
}

function normalizeGroup(group = "") {
  return group.replace("GROUP_", "");
}

function normalizeTeam(team: FootballDataTeam, group = ""): Team {
  return {
    id: `fd-${team.id}`,
    name: team.name,
    shortName: team.tla ?? team.shortName ?? team.name.slice(0, 3).toUpperCase(),
    flag: team.crest ?? "🏆",
    group: normalizeGroup(group),
    confederation: "TBD",
    coach: team.coach?.name
      ? {
          id: team.coach.id,
          name: team.coach.name,
          dateOfBirth: team.coach.dateOfBirth,
          nationality: team.coach.nationality
        }
      : null,
    squad: team.squad?.map((player) => ({
      id: player.id,
      name: player.name,
      position: player.position,
      dateOfBirth: player.dateOfBirth,
      nationality: player.nationality,
      shirtNumber: player.shirtNumber,
      marketValue: player.marketValue
    }))
  };
}

function formatVietnamDateTime(utcDate: string) {
  const date = new Date(utcDate);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: vietnamTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  const hour = value("hour") === "24" ? "00" : value("hour");

  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${hour}:${value("minute")}`
  };
}

function normalizeMatch(match: FootballDataMatch, index: number): Match {
  const localDateTime = formatVietnamDateTime(match.utcDate);

  return {
    id: `fd-match-${match.id}`,
    matchNumber: index + 1,
    stage: normalizeStage(match.stage),
    group: match.group?.replace("GROUP_", "") ?? undefined,
    homeTeamId: teamId(match.homeTeam),
    awayTeamId: teamId(match.awayTeam),
    homeScore: match.score?.fullTime?.home ?? null,
    awayScore: match.score?.fullTime?.away ?? null,
    date: localDateTime.date,
    time: localDateTime.time,
    stadium: match.venue ?? "TBD",
    city: "TBD",
    country: "TBD",
    status: normalizeStatus(match.status)
  };
}

export const footballDataProvider: WorldCupProvider = {
  async getWorldCupData() {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (!apiKey) {
      throw new Error("Missing FOOTBALL_DATA_API_KEY");
    }

    const [matchesResponse, teamsResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/competitions/WC/matches`, {
        headers: { "X-Auth-Token": apiKey },
        next: { revalidate: 30 }
      }),
      fetch(`${apiBaseUrl}/competitions/WC/teams`, {
        headers: { "X-Auth-Token": apiKey },
        next: { revalidate: 3600 }
      })
    ]);

    if (!matchesResponse.ok) {
      throw new Error(`football-data.org matches request failed: ${matchesResponse.status}`);
    }

    const payload = (await matchesResponse.json()) as { matches: FootballDataMatch[] };
    const teamsById = new Map<string, Team>();
    const teamGroups = new Map<string, string>();

    payload.matches.forEach((match) => {
      if (match.homeTeam?.id && match.group) teamGroups.set(`fd-${match.homeTeam.id}`, match.group);
      if (match.awayTeam?.id && match.group) teamGroups.set(`fd-${match.awayTeam.id}`, match.group);
    });

    if (teamsResponse.ok) {
      const teamsPayload = (await teamsResponse.json()) as { teams: FootballDataTeam[] };
      teamsPayload.teams.forEach((team) => {
        if (team.id) teamsById.set(`fd-${team.id}`, normalizeTeam(team, teamGroups.get(`fd-${team.id}`) ?? ""));
      });
    }

    payload.matches.forEach((match) => {
      if (match.homeTeam?.id && !teamsById.has(`fd-${match.homeTeam.id}`)) {
        teamsById.set(`fd-${match.homeTeam.id}`, normalizeTeam(match.homeTeam, match.group ?? ""));
      }
      if (match.awayTeam?.id && !teamsById.has(`fd-${match.awayTeam.id}`)) {
        teamsById.set(`fd-${match.awayTeam.id}`, normalizeTeam(match.awayTeam, match.group ?? ""));
      }
    });

    return {
      provider: "football-data",
      updatedAt: new Date().toISOString(),
      teams: Array.from(teamsById.values()),
      matches: payload.matches.map(normalizeMatch)
    };
  }
};
