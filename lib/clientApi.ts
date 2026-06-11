import type { WorldCupData } from "./providers/types";

export async function fetchWorldCupData(): Promise<WorldCupData> {
  const response = await fetch("/api/worldcup", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Cannot load World Cup data: ${response.status}`);
  }

  return response.json() as Promise<WorldCupData>;
}
