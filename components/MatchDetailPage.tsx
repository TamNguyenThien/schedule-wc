"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Clock, Download, Heart, MapPin, Share2, Star, Trophy, Users } from "lucide-react";
import EmptyState from "./EmptyState";
import TeamFlag from "./TeamFlag";
import ThemeToggle from "./ThemeToggle";
import { fetchWorldCupData } from "@/lib/clientApi";
import { favoritesStorage } from "@/lib/favoritesStorage";
import {
  downloadMatchIcs,
  formatFullDateTime,
  formatMatchLocation,
  getHeadToHead,
  getMatchTitle,
  getRecentForm,
  getTeamsById,
  openGoogleCalendar,
  type TeamFormResult
} from "@/lib/matchDetails";
import { getMatchPrediction, type MatchPrediction } from "@/lib/matchPredictions";
import { getTeamSlug } from "@/lib/teamProfiles";
import { cn } from "@/lib/utils";
import { getInitialMatches, teams as mockTeams } from "@/lib/scheduleData";
import type { Match, Team } from "@/types/worldcup";

export default function MatchDetailPage({ matchId }: { matchId: string }) {
  const [matches, setMatches] = useState<Match[]>(() => getInitialMatches());
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [favoriteMatchIds, setFavoriteMatchIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setFavoriteMatchIds(favoritesStorage.readMatches());

    fetchWorldCupData()
      .then((data) => {
        setTeams(data.teams);
        setMatches(data.matches);
      })
      .catch((error) => console.error("Cannot load match detail data.", error));
  }, []);

  const teamsById = useMemo(() => getTeamsById(teams), [teams]);
  const match = matches.find((item) => item.id === matchId);
  const home = teamsById.get(match?.homeTeamId ?? "");
  const away = teamsById.get(match?.awayTeamId ?? "");
  const headToHead = useMemo(() => (match ? getHeadToHead(match, matches) : []), [match, matches]);
  const homeForm = useMemo(() => getRecentForm(match?.homeTeamId, matches), [match?.homeTeamId, matches]);
  const awayForm = useMemo(() => getRecentForm(match?.awayTeamId, matches), [match?.awayTeamId, matches]);
  const prediction = useMemo(() => (match ? getMatchPrediction(match, teamsById) : null), [match, teamsById]);

  function toggleFavoriteMatch() {
    if (!match) return;
    setFavoriteMatchIds((current) => {
      const next = new Set(current);
      if (next.has(match.id)) next.delete(match.id);
      else next.add(match.id);
      favoritesStorage.writeMatches(next);
      return next;
    });
  }

  async function shareMatch() {
    if (!match) return;
    const url = window.location.href;
    const title = `World Cup 2026: ${getMatchTitle(match, teamsById)}`;

    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (!match) {
    return (
      <main className="min-h-screen py-6">
        <div className="app-container space-y-6">
          <BackLink />
          <EmptyState message="Không tìm thấy thông tin trận đấu." />
        </div>
      </main>
    );
  }

  const isFavorite = favoriteMatchIds.has(match.id);

  return (
    <main className="relative min-h-screen py-6">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[15%] top-[8%] h-[30vw] w-[30vw] rounded-full bg-rose-500/10 blur-[120px]" />
        <div className="absolute bottom-[12%] right-[10%] h-[40vw] w-[40vw] rounded-full bg-trophy-300/5 blur-[150px]" />
      </div>
      <div className="app-container space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <BackLink />
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => openGoogleCalendar(match, teamsById)} icon={CalendarDays}>
              Google Calendar
            </ActionButton>
            <ActionButton onClick={() => downloadMatchIcs(match, teamsById)} icon={Download}>
              Tải .ics
            </ActionButton>
            <ActionButton onClick={shareMatch} icon={Share2}>
              {copied ? "Đã copy" : "Chia sẻ"}
            </ActionButton>
            <button
              onClick={toggleFavoriteMatch}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-black transition",
                isFavorite
                  ? "border-rose-500/30 bg-rose-500/15 text-rose-300"
                  : "border-white/10 bg-white/5 text-white hover:border-rose-500/30 hover:text-rose-300"
              )}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
              {isFavorite ? "Đã yêu thích" : "Yêu thích"}
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.055] p-6 shadow-glass backdrop-blur sm:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-trophy-300/20 bg-trophy-300/10 px-4 py-2 text-sm font-black uppercase tracking-wider text-trophy-300">
              Trận {match.matchNumber}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-slate-300">
              {match.stage}{match.group ? ` • Bảng ${match.group}` : ""}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <DetailTeam team={home} align="right" />
            <div className="rounded-[24px] border border-white/10 bg-black/20 px-5 py-5 text-center sm:px-10">
              <div className="text-3xl font-black tracking-[0.25em] text-white">
                {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
              </div>
              <div className="mt-3 inline-flex items-center gap-2 text-sm font-black text-trophy-300">
                <Clock className="h-5 w-5" />
                {match.time}
              </div>
            </div>
            <DetailTeam team={away} />
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5 shadow-glass">
            <h2 className="inline-flex items-center gap-2 text-xl font-black text-white">
              <MapPin className="h-5 w-5 text-trophy-300" />
              Thông tin trận đấu
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <InfoBlock label="Thời gian Việt Nam" value={formatFullDateTime(match)} />
              <InfoBlock label="Trạng thái" value={match.status === "live" ? "Đang diễn ra" : match.status === "finished" ? "Đã kết thúc" : "Chưa diễn ra"} />
              <InfoBlock label="Địa điểm" value={formatMatchLocation(match)} />
            </div>
          </section>

          <PredictionPanel match={match} teamsById={teamsById} prediction={prediction} />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5 shadow-glass">
            <h2 className="inline-flex items-center gap-2 text-xl font-black text-white">
              <Users className="h-5 w-5 text-trophy-300" />
              Đối đầu
            </h2>
            <div className="mt-5 space-y-3">
              {headToHead.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-bold text-slate-400">
                  Chưa có dữ liệu đối đầu trong lịch hiện tại.
                </p>
              ) : (
                headToHead.slice(0, 3).map((item) => (
                  <MiniMatch key={item.id} match={item} teamsById={teamsById} />
                ))
              )}
            </div>
          </section>
        </div>

        <section className="grid gap-5 lg:grid-cols-2">
          <FormPanel team={home} form={homeForm} teamsById={teamsById} />
          <FormPanel team={away} form={awayForm} teamsById={teamsById} />
        </section>
      </div>
      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle />
      </div>
    </main>
  );
}

function PredictionPanel({
  match,
  teamsById,
  prediction
}: {
  match: Match;
  teamsById: Map<string, Team>;
  prediction: MatchPrediction | null;
}) {
  const home = teamsById.get(match.homeTeamId ?? "");
  const away = teamsById.get(match.awayTeamId ?? "");

  return (
    <section className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-5 shadow-glass">
      <h2 className="inline-flex items-center gap-2 text-xl font-black text-white">
        <Trophy className="h-5 w-5 text-trophy-300" />
        Dự đoán & tỉ lệ thắng
      </h2>
      {!prediction || !home || !away ? (
        <p className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-bold text-slate-400">
          Chưa đủ dữ liệu để mock dự đoán trận này.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <ProbabilityBar label={home.shortName} value={prediction.homeWin} />
            <ProbabilityBar label="Hòa" value={prediction.draw} />
            <ProbabilityBar label={away.shortName} value={prediction.awayWin} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoBlock label="Đội có lợi thế" value={prediction.favoriteLabel} />
            <InfoBlock label="Chênh lệch dự kiến" value={prediction.handicap} />
            <InfoBlock label="Tỉ số dự kiến" value={prediction.projectedScore} />
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-black uppercase tracking-wider text-slate-500">
              Độ tin cậy model • {prediction.modelVersion}
            </p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-trophy-300" style={{ width: `${prediction.confidence}%` }} />
            </div>
            <p className="mt-2 text-sm font-bold text-slate-400">{prediction.confidence}% confidence</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-black uppercase tracking-wider text-slate-500">Yếu tố model</p>
            <ul className="mt-3 space-y-2 text-sm font-bold text-slate-300">
              {prediction.factors.map((factor) => (
                <li key={factor}>• {factor}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

function ProbabilityBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-black text-white">{label}</span>
        <span className="text-lg font-black text-trophy-300">{value}%</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-rose-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white transition hover:bg-white/10">
      <ArrowLeft className="h-4 w-4" />
      Quay lại Lịch thi đấu
    </Link>
  );
}

function ActionButton({
  onClick,
  icon: Icon,
  children
}: {
  onClick: () => void;
  icon: typeof CalendarDays;
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white transition hover:bg-white/10">
      <Icon className="h-4 w-4 text-trophy-300" />
      {children}
    </button>
  );
}

function DetailTeam({ team, align = "left" }: { team?: Team; align?: "left" | "right" }) {
  const content = (
    <div className={cn("flex min-w-0 flex-col items-center", align === "right" && "text-right")}>
      <TeamFlag flag={team?.flag} className="h-16 w-24 rounded-lg text-5xl" />
      <h1 className="mt-4 max-w-full truncate text-xl font-black text-white sm:text-2xl">{team?.name ?? "TBD"}</h1>
      <p className="mt-1 text-sm font-bold uppercase tracking-wider text-slate-400">{team?.shortName ?? "TBD"}</p>
    </div>
  );

  if (!team) return content;
  return (
    <Link href={`/teams/${getTeamSlug(team)}`} className="min-w-0 transition hover:opacity-80">
      {content}
    </Link>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-base font-black text-white">{value}</p>
    </div>
  );
}

function MiniMatch({ match, teamsById }: { match: Match; teamsById: Map<string, Team> }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-black text-white">{getMatchTitle(match, teamsById)}</p>
      <p className="mt-1 text-sm font-bold text-slate-400">
        {match.homeScore ?? "-"} : {match.awayScore ?? "-"} • {formatFullDateTime(match)}
      </p>
    </div>
  );
}

function FormPanel({
  team,
  form,
  teamsById
}: {
  team?: Team;
  form: Array<{ match: Match; result: TeamFormResult }>;
  teamsById: Map<string, Team>;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5 shadow-glass">
      <h2 className="inline-flex items-center gap-2 text-xl font-black text-white">
        <Star className="h-5 w-5 text-trophy-300" />
        Phong độ gần đây {team ? `• ${team.name}` : ""}
      </h2>
      <div className="mt-5 space-y-3">
        {form.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-bold text-slate-400">
            Chưa có kết quả gần đây.
          </p>
        ) : (
          form.map(({ match, result }) => (
            <div key={match.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{getMatchTitle(match, teamsById)}</p>
                <p className="mt-1 text-sm font-bold text-slate-400">{match.homeScore} : {match.awayScore}</p>
              </div>
              <span className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black",
                result === "W" && "bg-emerald-500/20 text-emerald-200",
                result === "D" && "bg-amber-400/20 text-amber-200",
                result === "L" && "bg-rose-500/20 text-rose-200"
              )}>
                {result}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
