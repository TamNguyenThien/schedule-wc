import { getInitialMatches, teams } from "@/lib/scheduleData";
import type { WorldCupProvider } from "./types";

export const mockProvider: WorldCupProvider = {
  async getWorldCupData() {
    return {
      provider: "mock",
      updatedAt: new Date().toISOString(),
      teams,
      matches: getInitialMatches()
    };
  }
};
