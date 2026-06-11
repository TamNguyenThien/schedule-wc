const matchKey = "wc2026.favoriteMatches";
const teamKey = "wc2026.favoriteTeams";

function readSet(key: string) {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const value = window.localStorage.getItem(key);
    return new Set<string>(value ? JSON.parse(value) : []);
  } catch {
    return new Set<string>();
  }
}

function writeSet(key: string, values: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(Array.from(values)));
}

export const favoritesStorage = {
  readMatches: () => readSet(matchKey),
  readTeams: () => readSet(teamKey),
  writeMatches: (values: Set<string>) => writeSet(matchKey, values),
  writeTeams: (values: Set<string>) => writeSet(teamKey, values)
};
