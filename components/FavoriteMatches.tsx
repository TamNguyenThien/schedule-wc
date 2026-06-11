import { useMemo, useState } from "react";
import EmptyState from "./EmptyState";
import MatchCard from "./MatchCard";
import { MatchDetailModal } from "./ScheduleBoard";
import type { Match, Team } from "@/types/worldcup";

export default function FavoriteMatches({
  matches,
  teams,
  favoriteMatchIds,
  onToggleFavorite
}: {
  matches: Match[];
  teams: Team[];
  favoriteMatchIds: Set<string>;
  onToggleFavorite: (matchId: string) => void;
}) {
  const favoriteMatches = matches.filter((match) => favoriteMatchIds.has(match.id));
  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  if (favoriteMatches.length === 0) {
    return <EmptyState message="Bạn chưa có trận yêu thích nào." />;
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {favoriteMatches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            teams={teams}
            isFavorite
            onToggleFavorite={onToggleFavorite}
            onSelectMatch={setSelectedMatch}
          />
        ))}
      </div>
      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          teamsById={teamsById}
          onClose={() => setSelectedMatch(null)}
          isFavorite={favoriteMatchIds.has(selectedMatch.id)}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </>
  );
}
