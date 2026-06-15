"use client";

import { useEffect, useMemo, useState } from "react";
import HeroSection from "./HeroSection";
import FeaturedMatches from "./FeaturedMatches";
import MainTabs, { type MainTab } from "./MainTabs";
import ThemeToggle from "./ThemeToggle";
import ScheduleBoard from "./ScheduleBoard";
import GroupStandings from "./GroupStandings";
import FavoriteMatches from "./FavoriteMatches";
import FavoriteTeams from "./FavoriteTeams";
import LoadingState from "./LoadingState";
import { calculateStandings } from "@/lib/calculateStandings";
import { fetchWorldCupData } from "@/lib/clientApi";
import { favoritesStorage } from "@/lib/favoritesStorage";
import { generateKnockoutBracket } from "@/lib/generateKnockoutBracket";
import { getBestThirdPlacedTeams } from "@/lib/getBestThirdPlacedTeams";
import { getInitialMatches, teams as mockTeams } from "@/lib/scheduleData";
import type { Match, Team } from "@/types/worldcup";

export default function WorldCupDashboard() {
  const [matches, setMatches] = useState<Match[]>(() => getInitialMatches());
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [activeTab, setActiveTab] = useState<MainTab>("schedule");
  const [favoriteMatchIds, setFavoriteMatchIds] = useState<Set<string>>(new Set());
  const [favoriteTeamIds, setFavoriteTeamIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setFavoriteMatchIds(favoritesStorage.readMatches());
    setFavoriteTeamIds(favoritesStorage.readTeams());
    setHydrated(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const data = await fetchWorldCupData();
        if (!isMounted) return;
        setTeams(data.teams);
        setMatches(data.matches);
        setLastUpdatedAt(data.updatedAt);
      } catch (error) {
        console.error("Cannot refresh World Cup data.", error);
      }
    }

    loadData();
    const interval = window.setInterval(loadData, 60000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  async function syncData() {
    setIsSyncing(true);

    try {
      const data = await fetchWorldCupData();
      setTeams(data.teams);
      setMatches(data.matches);
      setLastUpdatedAt(data.updatedAt);
    } catch (error) {
      console.error("Cannot sync World Cup data.", error);
    } finally {
      setIsSyncing(false);
    }
  }

  const standings = useMemo(() => calculateStandings(teams, matches), [matches, teams]);
  const bestThirdIds = useMemo(
    () => new Set(getBestThirdPlacedTeams(standings, teams).map((standing) => standing.teamId)),
    [standings, teams]
  );
  const bracket = useMemo(() => generateKnockoutBracket(standings, teams), [standings, teams]);

  function toggleFavoriteMatch(matchId: string) {
    setFavoriteMatchIds((current) => {
      const next = new Set(current);
      if (next.has(matchId)) next.delete(matchId);
      else next.add(matchId);
      favoritesStorage.writeMatches(next);
      return next;
    });
  }

  function toggleFavoriteTeam(teamId: string) {
    setFavoriteTeamIds((current) => {
      const next = new Set(current);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      favoritesStorage.writeTeams(next);
      return next;
    });
  }

  return (
    <main className="min-h-screen">
      <div className="app-container relative z-10 space-y-4 py-3 sm:space-y-6 sm:py-4">
        <HeroSection>
          <FeaturedMatches
            matches={matches}
            teams={teams}
            favoriteMatchIds={favoriteMatchIds}
            favoriteTeamIds={favoriteTeamIds}
            onToggleFavorite={toggleFavoriteMatch}
            isSyncing={isSyncing}
            onSync={syncData}
          />
        </HeroSection>
        <MainTabs
          active={activeTab}
          onChange={setActiveTab}
          favoriteMatchesCount={favoriteMatchIds.size}
          favoriteTeamsCount={favoriteTeamIds.size}
        />
        {!hydrated ? (
          <LoadingState />
        ) : (
          <section className="min-h-[350px] rounded-3xl border border-white/10 bg-slate-950/25 p-2.5 shadow-glass backdrop-blur sm:p-4">
            {activeTab === "schedule" && (
              <ScheduleBoard
                matches={matches}
                teams={teams}
                bracket={bracket}
                favoriteMatchIds={favoriteMatchIds}
                favoriteTeamIds={favoriteTeamIds}
                onToggleFavorite={toggleFavoriteMatch}
              />
            )}
            {activeTab === "standings" && (
              <GroupStandings standings={standings} teams={teams} bestThirdIds={bestThirdIds} bracket={bracket} />
            )}
            {activeTab === "favoriteMatches" && (
              <FavoriteMatches
                matches={matches}
                teams={teams}
                favoriteMatchIds={favoriteMatchIds}
                onToggleFavorite={toggleFavoriteMatch}
              />
            )}
            {activeTab === "favoriteTeams" && (
              <FavoriteTeams teams={teams} favoriteTeamIds={favoriteTeamIds} onToggleFavorite={toggleFavoriteTeam} />
            )}
          </section>
        )}
      </div>
      <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        <ThemeToggle />
      </div>
      <footer className="relative z-10 mt-12 border-t border-white/5 px-4 py-8 text-center text-sm font-semibold uppercase tracking-wide text-slate-500/70">
        © 2026 FIFA WORLD CUP SCHEDULE DASHBOARD
      </footer>
    </main>
  );
}
