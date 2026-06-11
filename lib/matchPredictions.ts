import type { Match, Team } from "@/types/worldcup";

export type MatchPrediction = {
  homeWin: number;
  draw: number;
  awayWin: number;
  confidence: number;
  favoriteLabel: string;
  handicap: string;
  projectedScore: string;
  factors: string[];
  modelVersion: string;
};

const powerRatings: Record<string, number> = {
  arg: 94,
  fra: 93,
  bra: 92,
  eng: 90,
  esp: 89,
  por: 88,
  ger: 87,
  ned: 86,
  bel: 85,
  ita: 84,
  uru: 82,
  cro: 81,
  col: 78,
  den: 77,
  sui: 76,
  mex: 75,
  usa: 74,
  jpn: 73,
  sen: 72,
  mar: 72,
  can: 70
};

const confederationBaseline: Record<string, number> = {
  UEFA: 72,
  CONMEBOL: 71,
  CONCACAF: 65,
  CAF: 64,
  AFC: 62
};

export function getMatchPrediction(match: Match, teamsById: Map<string, Team>): MatchPrediction | null {
  const home = teamsById.get(match.homeTeamId ?? "");
  const away = teamsById.get(match.awayTeamId ?? "");
  if (!home || !away) return null;

  const homeRating = getTeamRating(home);
  const awayRating = getTeamRating(away);
  const hostBoost = getHostBoost(match, home, away);
  const seededNoise = (hash(match.id) % 9) - 4;
  const delta = homeRating + hostBoost + seededNoise - awayRating;
  const drawBase = clamp(24 - Math.abs(delta) * 0.35, 14, 28);
  const homeRaw = 50 + delta * 1.45;
  const available = 100 - drawBase;
  const homeWin = clamp((homeRaw / 100) * available, 18, available - 12);
  const awayWin = available - homeWin;
  const confidence = clamp(Math.round(52 + Math.abs(delta) * 1.8), 54, 86);
  const favoriteLabel = homeWin >= awayWin ? home.name : away.name;
  const handicap = buildHandicapLabel(home, away, homeWin, awayWin);
  const projectedHomeGoals = clamp(Math.round(1.35 + delta / 28 + (hash(`${match.id}-h`) % 3) * 0.25), 0, 4);
  const projectedAwayGoals = clamp(Math.round(1.25 - delta / 30 + (hash(`${match.id}-a`) % 3) * 0.25), 0, 4);

  return {
    homeWin: Math.round(homeWin),
    draw: Math.round(drawBase),
    awayWin: Math.round(awayWin),
    confidence,
    favoriteLabel,
    handicap,
    projectedScore: `${projectedHomeGoals} - ${projectedAwayGoals}`,
    factors: buildFactors(home, away, homeRating, awayRating, hostBoost),
    modelVersion: "Mock Elo v0.1"
  };
}

function buildHandicapLabel(home: Team, away: Team, homeWin: number, awayWin: number) {
  const gap = Math.abs(homeWin - awayWin);
  const line =
    gap < 5 ? 0 :
    gap < 12 ? 0.25 :
    gap < 20 ? 0.5 :
    gap < 28 ? 0.75 :
    gap < 36 ? 1 :
    gap < 48 ? 1.25 :
    1.5;

  if (line === 0) return "Đồng banh (0)";

  const favorite = homeWin >= awayWin ? home.shortName : away.shortName;
  return `${favorite} -${line}`;
}

function getTeamRating(team: Team) {
  return powerRatings[team.id] ?? confederationBaseline[team.confederation] ?? 60;
}

function getHostBoost(match: Match, home: Team, away: Team) {
  if (match.country === "Mexico" && home.id === "mex") return 5;
  if (match.country === "Mexico" && away.id === "mex") return -5;
  if (match.country === "Canada" && home.id === "can") return 5;
  if (match.country === "Canada" && away.id === "can") return -5;
  if (match.country === "USA" && home.id === "usa") return 5;
  if (match.country === "USA" && away.id === "usa") return -5;
  return 1.5;
}

function buildFactors(home: Team, away: Team, homeRating: number, awayRating: number, hostBoost: number) {
  const factors = [
    `${home.shortName}: rating ${homeRating}`,
    `${away.shortName}: rating ${awayRating}`,
    hostBoost !== 1.5 ? "Có yếu tố chủ nhà/sân đấu" : "Lợi thế giao bóng nhẹ cho đội đứng trước"
  ];

  if (home.confederation === away.confederation) factors.push("Hai đội cùng liên đoàn, biên độ dự đoán hẹp hơn");
  else factors.push("Khác liên đoàn, model tăng độ bất định");

  return factors;
}

function hash(value: string) {
  return Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0) * 31, 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
