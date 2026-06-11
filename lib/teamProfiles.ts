import profiles from "@/data/teamProfiles.json";
import type { Match, Team, TeamProfile } from "@/types/worldcup";

const typedProfiles = profiles as TeamProfile[];

const slugOverrides: Record<string, string> = {
  ARG: "ar",
  BRA: "br",
  CAN: "ca",
  FRA: "fr",
  JPN: "jp",
  KOR: "kr",
  MEX: "mx",
  USA: "us"
};

export function getTeamSlug(team: Team) {
  const profile = getProfileByTeam(team);
  return profile?.code ?? slugOverrides[team.shortName] ?? team.shortName.toLowerCase();
}

export function getProfileByTeam(team: Team) {
  const normalizedName = normalize(team.name);
  const shortName = normalize(team.shortName);

  return typedProfiles.find(
    (profile) =>
      profile.teamIds.includes(team.id) ||
      profile.aliases.some((alias) => normalize(alias) === shortName || normalize(alias) === normalizedName)
  );
}

export function resolveTeamProfile(code: string, teams: Team[]) {
  const normalizedCode = normalize(code);
  const profile = typedProfiles.find(
    (item) => normalize(item.code) === normalizedCode || item.aliases.some((alias) => normalize(alias) === normalizedCode)
  );

  const team =
    teams.find((item) => profile?.teamIds.includes(item.id)) ??
    teams.find((item) => normalize(item.shortName) === normalizedCode) ??
    teams.find((item) => normalize(item.name) === normalizedCode) ??
    (profile
      ? teams.find((item) => profile.aliases.some((alias) => normalize(alias) === normalize(item.shortName)))
      : undefined);

  if (!team) return null;

  return {
    team,
    profile: profile ?? createFallbackProfile(code, team)
  };
}

export function getTeamMatches(teamId: string, matches: Match[]) {
  return matches.filter((match) => match.homeTeamId === teamId || match.awayTeamId === teamId);
}

function createFallbackProfile(code: string, team: Team): TeamProfile {
  return {
    code,
    aliases: [team.shortName.toLowerCase(), team.name.toLowerCase()],
    teamIds: [team.id],
    localName: team.name,
    flagUrl: team.flag.startsWith("http") ? team.flag : undefined,
    federation: team.confederation !== "TBD" ? team.confederation : undefined,
    bestResult: "Đang cập nhật",
    overview: `${team.name} góp mặt trong dữ liệu lịch thi đấu World Cup 2026. Hồ sơ chi tiết, đội hình và thông tin lịch sử sẽ được bổ sung khi nguồn dữ liệu chính thức được cập nhật đầy đủ hơn.`,
    history: [],
    keyPlayers: []
  };
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
