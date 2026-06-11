export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

export function getGroupsFromTeams<T extends { group: string }>(teams: T[]) {
  return Array.from(new Set(teams.map((team) => team.group).filter(Boolean)));
}
