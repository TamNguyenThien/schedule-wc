import type { Match, Team } from "@/types/worldcup";

export type TeamFormResult = "W" | "D" | "L";

export function getTeamsById(teams: Team[]) {
  return new Map(teams.map((team) => [team.id, team]));
}

export function getMatchTitle(match: Match, teamsById: Map<string, Team>) {
  const home = teamsById.get(match.homeTeamId ?? "")?.name ?? "TBD";
  const away = teamsById.get(match.awayTeamId ?? "")?.name ?? "TBD";
  return `${home} vs ${away}`;
}

export function getMatchDateTime(match: Match) {
  return new Date(`${match.date}T${match.time}:00+07:00`);
}

export function formatFullDateTime(match: Match) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(getMatchDateTime(match));
}

export function toCalendarUtcDate(date: string, time: string, plusHours = 0) {
  const utcTime = new Date(`${date}T${time}:00+07:00`);
  utcTime.setHours(utcTime.getHours() + plusHours);
  return utcTime.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildGoogleCalendarUrl(match: Match, teamsById: Map<string, Team>) {
  const title = getMatchTitle(match, teamsById);
  const start = toCalendarUtcDate(match.date, match.time);
  const end = toCalendarUtcDate(match.date, match.time, 2);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `World Cup 2026: ${title}`,
    dates: `${start}/${end}`,
    details: `${match.stage}${match.group ? ` - Bảng ${match.group}` : ""}`,
    location: `${match.stadium}, ${match.city}, ${match.country}`
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function openGoogleCalendar(match: Match, teamsById: Map<string, Team>) {
  window.open(buildGoogleCalendarUrl(match, teamsById), "_blank", "noopener,noreferrer");
}

export function downloadMatchIcs(match: Match, teamsById: Map<string, Team>) {
  const title = getMatchTitle(match, teamsById);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WC2026 Dashboard//Match Reminder//VI",
    "BEGIN:VEVENT",
    `UID:${match.id}@wc2026.local`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART:${toCalendarUtcDate(match.date, match.time)}`,
    `DTEND:${toCalendarUtcDate(match.date, match.time, 2)}`,
    `SUMMARY:World Cup 2026: ${title}`,
    `DESCRIPTION:${match.stage}${match.group ? ` - Bảng ${match.group}` : ""}`,
    `LOCATION:${match.stadium}, ${match.city}, ${match.country}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `wc2026-${match.matchNumber}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

export function getHeadToHead(match: Match, matches: Match[]) {
  if (!match.homeTeamId || !match.awayTeamId) return [];
  return matches
    .filter(
      (item) =>
        item.id !== match.id &&
        item.homeTeamId &&
        item.awayTeamId &&
        new Set([item.homeTeamId, item.awayTeamId]).has(match.homeTeamId as string) &&
        new Set([item.homeTeamId, item.awayTeamId]).has(match.awayTeamId as string)
    )
    .sort((a, b) => getMatchDateTime(b).getTime() - getMatchDateTime(a).getTime());
}

export function getRecentForm(teamId: string | undefined, matches: Match[], limit = 5) {
  if (!teamId) return [];
  return matches
    .filter(
      (match) =>
        (match.homeTeamId === teamId || match.awayTeamId === teamId) &&
        match.homeScore !== null &&
        match.awayScore !== null
    )
    .sort((a, b) => getMatchDateTime(b).getTime() - getMatchDateTime(a).getTime())
    .slice(0, limit)
    .map((match) => {
      const isHome = match.homeTeamId === teamId;
      const goalsFor = isHome ? match.homeScore ?? 0 : match.awayScore ?? 0;
      const goalsAgainst = isHome ? match.awayScore ?? 0 : match.homeScore ?? 0;
      const result: TeamFormResult = goalsFor > goalsAgainst ? "W" : goalsFor < goalsAgainst ? "L" : "D";
      return { match, result };
    });
}
