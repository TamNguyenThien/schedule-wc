import type { Match } from "@/types/worldcup";

export function normalizeMatchTime(time: string) {
  return time.startsWith("24:") ? `00:${time.slice(3)}` : time;
}

export function formatMatchTime(time: string) {
  return normalizeMatchTime(time);
}

export function getMatchDateTime(match: Match) {
  return new Date(`${match.date}T${normalizeMatchTime(match.time)}:00+07:00`);
}

export function compareMatchesByDateTime(a: Match, b: Match) {
  return (
    `${a.date} ${normalizeMatchTime(a.time)}`.localeCompare(
      `${b.date} ${normalizeMatchTime(b.time)}`
    ) || a.matchNumber - b.matchNumber
  );
}

export function toCalendarUtcDate(date: string, time: string, plusHours = 0) {
  const utcTime = new Date(`${date}T${normalizeMatchTime(time)}:00+07:00`);
  utcTime.setHours(utcTime.getHours() + plusHours);
  return utcTime.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
