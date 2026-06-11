import { useMemo, useState } from "react";
import { getGroupsFromTeams } from "@/lib/utils";
import TeamCard from "./TeamCard";
import EmptyState from "./EmptyState";
import type { Team } from "@/types/worldcup";

export default function FavoriteTeams({
  favoriteTeamIds,
  teams,
  onToggleFavorite
}: {
  favoriteTeamIds: Set<string>;
  teams: Team[];
  onToggleFavorite: (teamId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("Tất cả");

  const filteredTeams = useMemo(() => {
    return teams
      .filter((team) => {
        const matchesSearch = team.name.toLowerCase().includes(search.toLowerCase());
        const matchesGroup = group === "Tất cả" || team.group === group;
        return matchesSearch && matchesGroup;
      })
      .sort((a, b) => {
        const favoriteDelta = Number(favoriteTeamIds.has(b.id)) - Number(favoriteTeamIds.has(a.id));
        return favoriteDelta || a.name.localeCompare(b.name);
      });
  }, [favoriteTeamIds, group, search, teams]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-[28px] border border-white/10 bg-white/[0.045] p-4 md:grid-cols-[1fr_190px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm đội yêu thích..."
          className="h-12 rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm font-semibold text-white outline-none"
        />
        <select
          value={group}
          onChange={(event) => setGroup(event.target.value)}
          className="h-12 rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm font-bold text-white outline-none"
        >
          <option>Tất cả</option>
          {getGroupsFromTeams(teams).map((item) => (
            <option key={item} value={item}>
              Group {item}
            </option>
          ))}
        </select>
      </div>
      {filteredTeams.length === 0 ? (
        <EmptyState message="Không tìm thấy đội phù hợp." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              isFavorite={favoriteTeamIds.has(team.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
