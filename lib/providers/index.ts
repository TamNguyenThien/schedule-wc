import { footballDataProvider } from "./footballDataProvider";
import { mockProvider } from "./mockProvider";
import type { WorldCupProvider } from "./types";

export function getWorldCupProvider(): WorldCupProvider {
  if (process.env.WORLD_CUP_DATA_PROVIDER === "football-data") {
    return footballDataProvider;
  }

  return mockProvider;
}
