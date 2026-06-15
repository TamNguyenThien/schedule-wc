import { Heart, MapPin } from "lucide-react";
import Link from "next/link";
import { formatMatchLocation } from "@/lib/matchDetails";
import { getMatchPrediction } from "@/lib/matchPredictions";
import { getTeamSlug } from "@/lib/teamProfiles";
import { formatDate, cn } from "@/lib/utils";
import type { Match, Team } from "@/types/worldcup";
import ScorePredictionInput from "./ScorePredictionInput";
import TeamFlag from "./TeamFlag";

type MatchCardProps = {
  match: Match;
  teams: Team[];
  isFavorite: boolean;
  userPrediction?: { home: string; away: string };
  onToggleFavorite: (matchId: string) => void;
  onPredictionChange?: (matchId: string, field: "home" | "away", value: string) => void;
  onSelectMatch?: (match: Match) => void;
};

const statusLabel = {
  upcoming: "Upcoming",
  live: "Live",
  finished: "Finished"
};

export default function MatchCard({
  match,
  teams,
  isFavorite,
  userPrediction,
  onToggleFavorite,
  onPredictionChange,
  onSelectMatch
}: MatchCardProps) {
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const home = teams.find((team) => team.id === match.homeTeamId);
  const away = teams.find((team) => team.id === match.awayTeamId);
  const prediction = getMatchPrediction(match, teamsById);

  return (
    <article
      onClick={() => onSelectMatch?.(match)}
      className={cn(
        "rounded-3xl border border-white/10 bg-white/[0.055] p-3.5 shadow-glass backdrop-blur transition hover:border-trophy-300/30 sm:p-5",
        onSelectMatch && "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-trophy-300">
            Trận {match.matchNumber}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-400 sm:gap-2">
            <span>{match.stage}</span>
            {match.group && <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-cyan-100">Group {match.group}</span>}
            <span
              className={cn(
                "rounded-full px-2 py-1 text-sm font-bold uppercase",
                match.status === "live" && "bg-red-500/20 text-red-200",
                match.status === "finished" && "bg-emerald-500/5 text-emerald-200",
                match.status === "upcoming" && "bg-white/10 text-slate-200"
              )}
            >
              {statusLabel[match.status]}
            </span>
          </div>
        </div>
        <button
          aria-label="Yêu thích trận đấu"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(match.id);
          }}
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full transition",
            isFavorite
              ? "text-slate-950"
              : "border-white/10 bg-white/5 text-slate-300 hover:border-trophy-300/60"
          )}
        >
          <Heart className={cn("h-5 w-5", isFavorite && "fill-current text-rose-700")} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:mt-5 sm:gap-3">
        <TeamBlock team={home} align="left" />
        <ScoreBlock match={match} />
        <TeamBlock team={away} align="right" />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300 sm:mt-5">
        <div className="font-bold text-white">
          {formatDate(match.date)} • {match.time}
        </div>
        {(prediction || onPredictionChange) && (
          <div className="mt-3 flex flex-col items-stretch gap-2 rounded-xl bg-white/5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            {prediction && (
              <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-200">
                Chênh lệch: {prediction.handicap}
              </span>
            )}
            {onPredictionChange && (
              <div className="inline-flex items-center justify-between gap-2 sm:justify-start">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Dự đoán</span>
                <ScorePredictionInput
                  matchId={match.id}
                  value={userPrediction}
                  onChange={onPredictionChange}
                  tone="dark"
                />
              </div>
            )}
          </div>
        )}
        <div className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-400">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-trophy-300" />
          <span>{formatMatchLocation(match)}</span>
        </div>
      </div>
    </article>
  );
}

function TeamBlock({
  team,
  align
}: {
  team?: Team;
  align: "left" | "right";
}) {
  const content = (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <TeamFlag flag={team?.flag} className="h-9 w-9 text-2xl sm:h-10 sm:w-10 sm:text-3xl" />
      <div className="mt-2 truncate text-sm font-black text-white sm:text-base">{team?.name ?? "TBD"}</div>
      <div className="text-xs font-bold text-slate-400">{team?.shortName ?? "TBD"}</div>
    </div>
  );

  if (!team) return content;

  return (
    <Link
      href={`/teams/${getTeamSlug(team)}`}
      onClick={(event) => event.stopPropagation()}
      className="min-w-0 transition hover:opacity-80"
    >
      {content}
    </Link>
  );
}

function ScoreBlock({ match }: { match: Match }) {
  return (
    <div className="rounded-2xl border border-trophy-300/20 bg-trophy-300/10 px-3 py-2 text-center text-lg font-black text-trophy-100 sm:px-4 sm:py-3 sm:text-xl">
      {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
    </div>
  );
}
