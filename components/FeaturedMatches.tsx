"use client";

import { useEffect, useMemo, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import type { Match, Team } from "@/types/worldcup";
import { Clock3, Heart, RefreshCw } from "lucide-react";
import { getMatchPrediction } from "@/lib/matchPredictions";
import { MatchDetailModal } from "./ScheduleBoard";
import TeamFlag from "./TeamFlag";

type FeaturedTab = "hot" | "near" | "favorite";

const tabs: Array<{ id: FeaturedTab; label: string }> = [
  { id: "hot", label: "Hot nhất" },
  { id: "near", label: "Cận kề" },
  { id: "favorite", label: "Yêu thích" }
];

const hotTeamIds = new Set(["arg", "bra", "fra", "eng", "por", "esp", "ger", "mex", "usa", "can"]);

export default function FeaturedMatches({
  matches,
  teams,
  favoriteMatchIds,
  favoriteTeamIds,
  onToggleFavorite,
  isSyncing,
  onSync
}: {
  matches: Match[];
  teams: Team[];
  favoriteMatchIds: Set<string>;
  favoriteTeamIds: Set<string>;
  onToggleFavorite: (matchId: string) => void;
  isSyncing: boolean;
  onSync: () => void;
}) {
  const [active, setActive] = useState<FeaturedTab>("hot");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const featured = useMemo(() => {
    const upcoming = [...matches]
      .filter((match) => match.status !== "finished" && getMatchTime(match).getTime() >= now)
      .sort(compareMatchDate);

    if (active === "favorite") {
      return matches.filter((match) => favoriteMatchIds.has(match.id)).slice(0, 3);
    }

    if (active === "near") {
      return upcoming.slice(0, 3);
    }

    return upcoming
      .filter((match) => hotTeamIds.has(match.homeTeamId ?? "") || hotTeamIds.has(match.awayTeamId ?? ""))
      .slice(0, 3);
  }, [active, favoriteMatchIds, matches, now]);

  return (
    <div className="group relative flex min-w-[380px] flex-col items-center justify-center overflow-hidden rounded-[24px]  bg-white/5 p-6 text-center shadow-glass backdrop-blur-md transition-all duration-500 sm:min-w-[380px] sm:p-8">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent opacity-60 transition-transform duration-500 group-hover:scale-110" />
      <span className="relative mb-4 block text-sm font-black uppercase tracking-widest text-amber-400">
        {active === "near" ? "⏱ TRẬN TIẾP THEO" : active === "favorite" ? "★ TRẬN YÊU THÍCH" : "🔥 TRẬN ĐẤU HOT NHẤT 🔥"}
      </span>
      {featured.length === 0 ? (
        <div className="relative py-6 text-xs font-bold text-slate-400">Đang cập nhật lịch thi đấu...</div>
      ) : (
        <div className="relative w-full space-y-3">
          {featured.slice(0, 1).map((match) => (
            <CompactFeaturedMatch
              key={match.id}
              match={match}
              teams={teams}
              isFavorite={favoriteMatchIds.has(match.id)}
              onToggleFavorite={onToggleFavorite}
              onSelectMatch={setSelectedMatch}
            />
          ))}
        </div>
      )}
      <div className="relative mt-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 p-1 shadow-glass backdrop-blur-md">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-bold transition",
              active === tab.id
                ? "tab-active-text bg-amber-500 shadow-glow"
                : "text-slate-400 hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onSync}
        disabled={isSyncing}
        className="relative mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-black uppercase tracking-wider text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-wait disabled:opacity-70"
      >
        <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
        {isSyncing ? "Đang cập nhật" : "Cập nhật dữ liệu"}
      </button>
      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          teamsById={teamsById}
          onClose={() => setSelectedMatch(null)}
          isFavorite={favoriteMatchIds.has(selectedMatch.id)}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </div>
  );
}

function CompactFeaturedMatch({
  match,
  teams,
  isFavorite,
  onToggleFavorite,
  onSelectMatch
}: {
  match: Match;
  teams: Team[];
  isFavorite: boolean;
  onToggleFavorite: (matchId: string) => void;
  onSelectMatch: (match: Match) => void;
}) {
  const home = teams.find((team) => team.id === match.homeTeamId);
  const away = teams.find((team) => team.id === match.awayTeamId);
  const prediction = getMatchPrediction(match, new Map(teams.map((team) => [team.id, team])));

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelectMatch(match)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectMatch(match);
        }
      }}
      className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-amber-400/40 hover:bg-white/10"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-black uppercase tracking-widest text-slate-400">
          Trận {match.matchNumber} • {match.stage}
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(match.id);
          }}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full border transition",
            isFavorite
              ? "border-amber-400 bg-amber-400 text-slate-950"
              : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
          )}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </button>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <CompactTeam name={home?.shortName ?? "TBD"} flag={home?.flag} />
        <div className="rounded-xl bg-black/20 px-3 py-2 text-center text-base font-black text-amber-300">
          {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
        </div>
        <CompactTeam name={away?.shortName ?? "TBD"} flag={away?.flag} align="right" />
      </div>
      <div className="mt-3 truncate text-center text-sm font-bold text-slate-400">
        {formatDate(match.date)} • {match.time}
      </div>
      {prediction && (
        <div className="mt-3 text-center">
          <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-200">
            Chênh lệch: {prediction.handicap}
          </span>
        </div>
      )}
      <MatchCountdown match={match} />
    </article>
  );
}

function CompactTeam({ name, flag, align = "left" }: { name: string; flag?: string; align?: "left" | "right" }) {
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <TeamFlag flag={flag} className="h-8 w-8 text-2xl" />
      <div className="mt-1 truncate text-xs font-black text-white">{name}</div>
    </div>
  );
}

function MatchCountdown({ match }: { match: Match }) {
  const [now, setNow] = useState(() => Date.now());
  const target = useMemo(() => getMatchTime(match).getTime(), [match]);
  const remaining = target - now;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const units = getCountdownUnits(remaining);

  return (
    <div className="mt-3 rounded-xl border border-amber-400/15 bg-amber-400/10 p-2">
      <div className="mb-2 flex items-center justify-center gap-1.5 text-sm font-black uppercase tracking-wider text-amber-300">
        <Clock3 className="h-3.5 w-3.5" />
        {remaining > 0 ? "Đếm ngược" : match.status === "live" ? "Đang diễn ra" : "Đã đến giờ bóng lăn"}
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {units.map((unit) => (
          <div key={unit.label} className="rounded-lg bg-black/20 px-2 py-1.5">
            <div className="text-sm font-black text-white">{unit.value}</div>
            <div className="mt-0.5 text-sm font-bold uppercase text-slate-400">{unit.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function compareMatchDate(a: Match, b: Match) {
  return getMatchTime(a).getTime() - getMatchTime(b).getTime() || a.matchNumber - b.matchNumber;
}

function getMatchTime(match: Match) {
  return new Date(`${match.date}T${match.time}:00+07:00`);
}

function getCountdownUnits(remaining: number) {
  const totalMinutes = Math.max(0, Math.floor(remaining / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return [
    { label: "ngày", value: String(days).padStart(2, "0") },
    { label: "giờ", value: String(hours).padStart(2, "0") },
    { label: "phút", value: String(minutes).padStart(2, "0") }
  ];
}
