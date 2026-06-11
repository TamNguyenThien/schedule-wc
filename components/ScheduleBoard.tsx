"use client";

import Link from "next/link";
import { Calendar, CalendarDays, ChevronDown, Clock, Download, Flame, Grid2X2, Heart, List, Search, Star, Table2, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import EmptyState from "./EmptyState";
import KnockoutBracket from "./KnockoutBracket";
import MatchCard from "./MatchCard";
import ScorePredictionInput from "./ScorePredictionInput";
import TeamFlag from "./TeamFlag";
import { formatMatchLocation, hasKnownMatchLocation } from "@/lib/matchDetails";
import { getTeamSlug } from "@/lib/teamProfiles";
import { cn } from "@/lib/utils";
import { getMatchPrediction, type MatchPrediction } from "@/lib/matchPredictions";
import type { BracketMatch, Match, Team } from "@/types/worldcup";

type ScheduleMode = "all" | "date" | "knockout";
type ViewMode = "table" | "grid";
type UserPrediction = { home: string; away: string };
type UserPredictions = Record<string, UserPrediction>;

const userPredictionsKey = "wc2026.userPredictions";

export default function ScheduleBoard({
  matches,
  teams,
  bracket,
  favoriteMatchIds,
  onToggleFavorite
}: {
  matches: Match[];
  teams: Team[];
  bracket: BracketMatch[];
  favoriteMatchIds: Set<string>;
  onToggleFavorite: (matchId: string) => void;
}) {
  const [mode, setMode] = useState<ScheduleMode>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [userPredictions, setUserPredictions] = useState<UserPredictions>({});

  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const availableDates = useMemo(
    () => Array.from(new Set(matches.map((match) => match.date))).sort((a, b) => a.localeCompare(b)),
    [matches]
  );
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    try {
      const value = window.localStorage.getItem(userPredictionsKey);
      if (value) setUserPredictions(JSON.parse(value) as UserPredictions);
    } catch {
      setUserPredictions({});
    }
  }, []);

  function updateUserPrediction(matchId: string, field: keyof UserPrediction, value: string) {
    const normalized = value.replace(/\D/g, "").slice(0, 2);
    setUserPredictions((current) => {
      const nextPrediction = { ...(current[matchId] ?? { home: "", away: "" }), [field]: normalized };
      const next = { ...current, [matchId]: nextPrediction };

      if (!nextPrediction.home && !nextPrediction.away) delete next[matchId];
      window.localStorage.setItem(userPredictionsKey, JSON.stringify(next));

      return next;
    });
  }

  const filteredMatches = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...matches]
      .filter((match) => {
        if (mode === "knockout") return match.stage !== "Vòng bảng";
        const home = teamsById.get(match.homeTeamId ?? "");
        const away = teamsById.get(match.awayTeamId ?? "");
        return (
          normalizedSearch.length === 0 ||
          home?.name.toLowerCase().includes(normalizedSearch) ||
          away?.name.toLowerCase().includes(normalizedSearch) ||
          home?.shortName.toLowerCase().includes(normalizedSearch) ||
          away?.shortName.toLowerCase().includes(normalizedSearch) ||
          match.stadium.toLowerCase().includes(normalizedSearch) ||
          match.city.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`) || a.matchNumber - b.matchNumber);
  }, [matches, mode, search, teamsById]);

  const effectiveSelectedDate = selectedDate || availableDates[0] || "";
  const dateMatches = useMemo(
    () => filteredMatches.filter((match) => match.date === effectiveSelectedDate),
    [effectiveSelectedDate, filteredMatches]
  );

  function downloadIcs() {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//WC2026 Dashboard//Schedule//VI",
      ...filteredMatches.flatMap((match) => {
        const home = teamsById.get(match.homeTeamId ?? "")?.name ?? "TBD";
        const away = teamsById.get(match.awayTeamId ?? "")?.name ?? "TBD";
        const start = toCalendarUtcDate(match.date, match.time);
        const end = toCalendarUtcDate(match.date, match.time, 2);
        return [
          "BEGIN:VEVENT",
          `UID:${match.id}@wc2026.local`,
          `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
          `DTSTART:${start}`,
          `DTEND:${end}`,
          `SUMMARY:World Cup 2026 - ${home} vs ${away}`,
          `LOCATION:${match.stadium}, ${match.city}, ${match.country}`,
          "END:VEVENT"
        ];
      }),
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "world-cup-2026.ics";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-7">
      <div className="border-b border-slate-200 pb-0 dark:border-white/10">
        <div className="flex flex-wrap gap-8">
          <ScheduleModeButton active={mode === "all"} onClick={() => setMode("all")} icon={Table2}>
            Tất cả trận đấu
          </ScheduleModeButton>
          <ScheduleModeButton active={mode === "date"} onClick={() => setMode("date")} icon={Calendar}>
            Lịch theo ngày
          </ScheduleModeButton>
          <ScheduleModeButton active={mode === "knockout"} onClick={() => setMode("knockout")} icon={Flame}>
            Nhánh Knockout
          </ScheduleModeButton>
        </div>
      </div>

      {mode === "date" ? (
        <div className="relative w-full max-w-[420px]">
          <CalendarDays className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-rose-700" />
          <select
            value={effectiveSelectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="h-16 w-full appearance-none rounded-[24px] border border-slate-200 bg-white px-16 pr-12 text-lg font-extrabold text-slate-950 shadow-glass outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            {availableDates.map((date) => (
              <option key={date} value={date}>
                Ngày {formatFullDate(date)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-950 dark:text-white" />
        </div>
      ) : mode !== "knockout" && (
        <div className="relative">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm kiếm quốc gia, SVĐ..."
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-14 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-rose-700/40 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>
      )}

      {mode === "knockout" ? (
        <KnockoutBracket bracket={bracket} />
      ) : mode === "date" ? (
        <DailySchedule
          date={effectiveSelectedDate}
          matches={dateMatches}
          teams={teams}
          favoriteMatchIds={favoriteMatchIds}
          userPredictions={userPredictions}
          onToggleFavorite={onToggleFavorite}
          onPredictionChange={updateUserPrediction}
          onSelectMatch={setSelectedMatch}
        />
      ) : (
        <>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
            <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-trophy-700 dark:text-trophy-300">
              <Table2 className="h-5 w-5" />
              Tất Cả Trận Đấu ({filteredMatches.length} trận)
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/5">
                <ViewButton active={viewMode === "table"} onClick={() => setViewMode("table")} icon={List}>
                  Bảng
                </ViewButton>
                <ViewButton active={viewMode === "grid"} onClick={() => setViewMode("grid")} icon={Grid2X2}>
                  Lưới
                </ViewButton>
              </div>
              <button
                onClick={downloadIcs}
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-extrabold text-slate-900 transition hover:border-trophy-500/50 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <CalendarDays className="h-4 w-4 text-trophy-700 dark:text-trophy-300" />
                Tải lịch thi đấu (.ics)
                <Download className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          {filteredMatches.length === 0 ? (
            <EmptyState message="Không tìm thấy trận đấu phù hợp." />
          ) : viewMode === "table" ? (
            <ScheduleTable
              matches={filteredMatches}
              teamsById={teamsById}
              favoriteMatchIds={favoriteMatchIds}
              userPredictions={userPredictions}
              onToggleFavorite={onToggleFavorite}
              onPredictionChange={updateUserPrediction}
              onSelectMatch={setSelectedMatch}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  teams={teams}
                  isFavorite={favoriteMatchIds.has(match.id)}
                  userPrediction={userPredictions[match.id]}
                  onToggleFavorite={onToggleFavorite}
                  onPredictionChange={updateUserPrediction}
                  onSelectMatch={setSelectedMatch}
                />
              ))}
            </div>
          )}
        </>
      )}
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

function ScheduleTable({
  matches,
  teamsById,
  favoriteMatchIds,
  userPredictions,
  onToggleFavorite,
  onPredictionChange,
  onSelectMatch
}: {
  matches: Match[];
  teamsById: Map<string, Team>;
  favoriteMatchIds: Set<string>;
  userPredictions: UserPredictions;
  onToggleFavorite: (matchId: string) => void;
  onPredictionChange: (matchId: string, field: keyof UserPrediction, value: string) => void;
  onSelectMatch: (match: Match) => void;
}) {
  const groups = groupMatchesByDate(matches);

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-glass dark:border-white/10 dark:bg-white/5">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1290px] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[64px]" />
            <col className="w-[105px]" />
            <col className="w-[105px]" />
            <col className="w-[170px]" />
            <col className="w-[195px]" />
            <col className="w-[72px]" />
            <col className="w-[195px]" />
            <col className="w-[110px]" />
            <col className="w-[130px]" />
            <col className="w-[90px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
              <th className="px-4 py-4">ID</th>
              <th className="px-4 py-4">Ngày</th>
              <th className="px-4 py-4">Giờ</th>
              <th className="px-4 py-4">Vòng đấu</th>
              <th className="px-4 py-4 text-right">Đội 1</th>
              <th className="whitespace-nowrap px-3 py-4 text-center">Tỉ số</th>
              <th className="px-4 py-4">Đội 2</th>
              <th className="px-3 py-4 text-center">Kèo chấp</th>
              <th className="px-3 py-4 text-center">Dự đoán</th>
              <th className="px-3 py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) =>
              group.matches.map((match, index) => {
                const home = teamsById.get(match.homeTeamId ?? "");
                const away = teamsById.get(match.awayTeamId ?? "");
                const prediction = getMatchPrediction(match, teamsById);

                return (
                  <tr
                    key={match.id}
                    onClick={() => onSelectMatch(match)}
                    className="cursor-pointer border-b border-slate-200 transition last:border-0 hover:bg-rose-50/60 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white">
                        {match.matchNumber}
                      </span>
                    </td>
                    {index === 0 && (
                      <td rowSpan={group.matches.length} className="border-r border-slate-200 px-4 py-3 text-center align-middle dark:border-white/10">
                        <span className="inline-flex rounded-2xl border border-rose-700/20 bg-rose-700/10 px-3 py-2 text-sm font-extrabold leading-none text-rose-700 shadow-glow dark:text-rose-300">
                          {formatShortDate(group.date)}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 font-bold text-slate-950 dark:text-white">
                        <Clock className="h-5 w-5 text-trophy-700 dark:text-trophy-300" />
                        {match.time}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex whitespace-nowrap rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-900 dark:bg-white/10 dark:text-white">
                        {match.stage}
                        {match.group ? ` • ${match.group}` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <TeamCell team={home} align="right" />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-center font-bold text-slate-950 dark:text-white">
                      {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <TeamCell team={away} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      {prediction ? (
                        <span className="inline-flex whitespace-nowrap rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-black text-amber-700 dark:text-amber-200">
                          {prediction.handicap}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-slate-400">TBD</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <ScorePredictionInput
                        matchId={match.id}
                        value={userPredictions[match.id]}
                        onChange={onPredictionChange}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-3 text-slate-900 dark:text-white">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            openGoogleCalendar(match, teamsById);
                          }}
                          aria-label="Thêm vào Google Calendar"
                          className="transition hover:text-blue-600"
                        >
                          <CalendarDays className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleFavorite(match.id);
                          }}
                          aria-label="Yêu thích trận đấu"
                          className="transition hover:text-rose-700 dark:hover:text-rose-300"
                        >
                          <Heart className={cn("h-5 w-5", favoriteMatchIds.has(match.id) && "fill-current text-rose-700 dark:text-rose-300")} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DailySchedule({
  date,
  matches,
  teams,
  favoriteMatchIds,
  userPredictions,
  onToggleFavorite,
  onPredictionChange,
  onSelectMatch
}: {
  date: string;
  matches: Match[];
  teams: Team[];
  favoriteMatchIds: Set<string>;
  userPredictions: UserPredictions;
  onToggleFavorite: (matchId: string) => void;
  onPredictionChange: (matchId: string, field: keyof UserPrediction, value: string) => void;
  onSelectMatch: (match: Match) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-5 dark:border-white/10">
        <h2 className="inline-flex items-center gap-3 text-lg font-extrabold text-trophy-700 dark:text-trophy-300">
          <Grid2X2 className="h-6 w-6" />
          Danh sách trận ngày {formatFullDate(date)}
        </h2>
      </div>
      {matches.length === 0 ? (
        <EmptyState message="Không có trận đấu trong ngày đã chọn." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              teams={teams}
              isFavorite={favoriteMatchIds.has(match.id)}
              userPrediction={userPredictions[match.id]}
              onToggleFavorite={onToggleFavorite}
              onPredictionChange={onPredictionChange}
              onSelectMatch={onSelectMatch}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCell({ team, align = "left" }: { team?: Team; align?: "left" | "right" }) {
  const content = (
    <span className={cn("inline-flex min-w-0 items-center gap-2 text-base font-bold text-slate-950 dark:text-white", align === "right" && "justify-end")}>
      {align === "left" && <TeamFlag flag={team?.flag} className="h-6 w-6 shrink-0 text-lg" />}
      <span className="truncate">{team?.name ?? "TBD"}</span>
      {align === "right" && <TeamFlag flag={team?.flag} className="h-6 w-6 shrink-0 text-lg" />}
    </span>
  );

  if (!team) return content;

  return (
    <Link
      href={`/teams/${getTeamSlug(team)}`}
      onClick={(event) => event.stopPropagation()}
      className={cn("block min-w-0 transition hover:opacity-75", align === "right" && "text-right")}
    >
      {content}
    </Link>
  );
}

function ScheduleModeButton({
  active,
  onClick,
  icon: Icon,
  children
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Table2;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-extrabold transition",
        active ? "tab-active-text bg-rose-700 shadow-glow" : "text-slate-900 hover:bg-slate-100 hover:text-rose-700 dark:text-white dark:hover:bg-white/10 dark:hover:text-rose-300"
      )}
    >
      <Icon className="h-5 w-5" />
      {children}
    </button>
  );
}

function ViewButton({
  active,
  onClick,
  icon: Icon,
  children
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof List;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-extrabold transition",
        active ? "tab-active-text bg-rose-700 shadow-glow" : "text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function groupMatchesByDate(matches: Match[]) {
  const map = new Map<string, Match[]>();
  matches.forEach((match) => map.set(match.date, [...(map.get(match.date) ?? []), match]));

  return Array.from(map.entries()).map(([date, groupMatches]) => ({
    date,
    matches: groupMatches
  }));
}

function formatShortDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit"
  }).format(parsed);
}

export function MatchDetailModal({
  match,
  teamsById,
  onClose,
  isFavorite,
  onToggleFavorite
}: {
  match: Match;
  teamsById: Map<string, Team>;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (matchId: string) => void;
}) {
  const home = teamsById.get(match.homeTeamId ?? "");
  const away = teamsById.get(match.awayTeamId ?? "");
  const prediction = getMatchPrediction(match, teamsById);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-8 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.62)" }}
    >
      <div className="relative my-auto w-full max-w-2xl rounded-[34px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-950 sm:p-10">
        <button
          onClick={onClose}
          className="absolute right-8 top-8 grid h-10 w-10 place-items-center rounded-full text-slate-950 transition hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
          aria-label="Đóng"
        >
          <X className="h-7 w-7" />
        </button>

        <div className="mb-8 inline-flex rounded-full border border-slate-200 bg-slate-100 px-5 py-2 text-base font-extrabold uppercase tracking-wide text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
          🏆 {match.stage}
          {match.group ? ` • Bảng ${match.group}` : ""}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
          <ModalTeam team={home} align="center" />
          <div className="rounded-[24px] border border-slate-200 bg-slate-100 px-10 py-7 text-center dark:border-white/10 dark:bg-white/5">
            <div className="text-lg font-extrabold tracking-[0.35em] text-slate-950 dark:text-white">
              {match.homeScore ?? "-"} {match.homeScore === null && match.awayScore === null ? "" : ":"} {match.awayScore ?? "-"}
            </div>
            <div className="mt-3 inline-flex items-center gap-2 text-base font-bold text-trophy-700 dark:text-trophy-300">
              <Clock className="h-5 w-5" />
              {match.time}
            </div>
          </div>
          <ModalTeam team={away} align="center" />
        </div>

        <div className="my-9 border-t border-slate-200 dark:border-white/10" />

        {prediction && (
          <CompactPrediction prediction={prediction} homeLabel={home?.shortName ?? "Đội 1"} awayLabel={away?.shortName ?? "Đội 2"} />
        )}

        <div className="grid gap-5 rounded-[24px] border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-white/5 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-950 dark:text-white">
              Thời gian (Địa phương)
            </h3>
            <p className="mt-2 text-lg font-extrabold text-slate-950 dark:text-white">
              {formatFullDate(match.date)} {match.time}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-950 dark:text-white">
              Trạng thái trận đấu
            </h3>
            <p className="mt-2 inline-flex items-center gap-2 text-lg font-extrabold text-slate-950 dark:text-white">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              {match.status === "finished" ? "Đã kết thúc" : match.status === "live" ? "Đang diễn ra" : "Chưa diễn ra"}
            </p>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-950 dark:text-white">
              Địa điểm
            </h3>
            <p className="mt-2 text-lg font-extrabold text-slate-950 dark:text-white">
              {formatMatchLocation(match)}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-white/5">
          <h3 className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-trophy-700 dark:text-trophy-300">
            <CalendarDays className="h-5 w-5" />
            Đồng bộ lịch thi đấu
          </h3>
          <p className="mt-4 text-base font-semibold leading-7 text-slate-950 dark:text-white">
            Thêm trận đấu này vào Google Calendar hoặc tải file (.ics) cho Apple Calendar, Outlook để
            nhận nhắc hẹn và không bỏ lỡ trận cầu.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Link
              href={`/matches/${match.id}`}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 text-base font-extrabold text-amber-700 transition hover:bg-amber-100"
            >
              <Trophy className="h-5 w-5" />
              Trang chi tiết
            </Link>
            <button
              onClick={() => openGoogleCalendar(match, teamsById)}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 text-base font-extrabold text-blue-700 transition hover:bg-blue-100"
            >
              <CalendarDays className="h-5 w-5" />
              Google Calendar
            </button>
            <button
              onClick={() => downloadMatchIcs(match, teamsById)}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-base font-extrabold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Download className="h-5 w-5" />
              Apple / Outlook (.ics)
            </button>
            <button
              onClick={() => onToggleFavorite(match.id)}
              className={cn(
                "inline-flex h-14 items-center justify-center gap-3 rounded-2xl border text-base font-extrabold transition",
                isFavorite
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-white text-slate-950 hover:bg-slate-50"
              )}
            >
              <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
              {isFavorite ? "Đã yêu thích" : "Yêu thích"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CompactPrediction({
  prediction,
  homeLabel,
  awayLabel
}: {
  prediction: MatchPrediction;
  homeLabel: string;
  awayLabel: string;
}) {
  return (
    <div className="mb-6 rounded-[24px] border border-amber-200 bg-amber-50 p-5 dark:border-amber-300/20 dark:bg-amber-300/10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-200">
          <Trophy className="h-5 w-5" />
          Dự đoán mock
        </h3>
        <span className="text-sm font-black text-slate-950 dark:text-white">
          Lợi thế: {prediction.favoriteLabel}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <CompactProbability label={homeLabel} value={prediction.homeWin} />
        <CompactProbability label="Hòa" value={prediction.draw} />
        <CompactProbability label={awayLabel} value={prediction.awayWin} />
      </div>
      <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">
        Tỉ số dự kiến {prediction.projectedScore} • Kèo chấp {prediction.handicap} • Độ tin cậy {prediction.confidence}%
      </p>
    </div>
  );
}

function CompactProbability({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-3 dark:bg-black/20">
      <div className="flex items-center justify-between gap-2 text-sm font-black text-slate-950 dark:text-white">
        <span>{label}</span>
        <span className="text-amber-700 dark:text-amber-200">{value}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div className="h-full rounded-full bg-amber-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ModalTeam({ team, align = "left" }: { team?: Team; align?: "left" | "right" | "center" }) {
  const content = (
    <div className={cn("flex flex-col items-center", align === "right" ? "md:items-end" : align === "center" ? "items-center" : "md:items-start")}>
      <TeamFlag flag={team?.flag} className="h-20 w-28 rounded-xl text-6xl" />
      <h2 className="mt-4 text-center text-lg font-extrabold text-slate-950 dark:text-white md:text-left">
        {team?.name ?? "TBD"}
      </h2>
    </div>
  );

  if (!team) return content;

  return (
    <Link href={`/teams/${getTeamSlug(team)}`} className="transition hover:opacity-80">
      {content}
    </Link>
  );
}

function openGoogleCalendar(match: Match, teamsById: Map<string, Team>) {
  window.open(buildGoogleCalendarUrl(match, teamsById), "_blank", "noopener,noreferrer");
}

function buildGoogleCalendarUrl(match: Match, teamsById: Map<string, Team>) {
  const home = teamsById.get(match.homeTeamId ?? "")?.name ?? "TBD";
  const away = teamsById.get(match.awayTeamId ?? "")?.name ?? "TBD";
  const start = toCalendarUtcDate(match.date, match.time);
  const end = toCalendarUtcDate(match.date, match.time, 2);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `World Cup 2026: ${home} vs ${away}`,
    dates: `${start}/${end}`,
    details: `${match.stage}${match.group ? ` - Bảng ${match.group}` : ""}`,
    location: hasKnownMatchLocation(match) ? formatMatchLocation(match) : ""
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadMatchIcs(match: Match, teamsById: Map<string, Team>) {
  const home = teamsById.get(match.homeTeamId ?? "")?.name ?? "TBD";
  const away = teamsById.get(match.awayTeamId ?? "")?.name ?? "TBD";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WC2026 Dashboard//Match Reminder//VI",
    "BEGIN:VEVENT",
    `UID:${match.id}@wc2026.local`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART:${toCalendarUtcDate(match.date, match.time)}`,
    `DTEND:${toCalendarUtcDate(match.date, match.time, 2)}`,
    `SUMMARY:World Cup 2026: ${home} vs ${away}`,
    `DESCRIPTION:${match.stage}${match.group ? ` - Bảng ${match.group}` : ""}`,
    `LOCATION:${hasKnownMatchLocation(match) ? formatMatchLocation(match) : ""}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `wc2026-${match.matchNumber}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

function toCalendarUtcDate(date: string, time: string, plusHours = 0) {
  const utcTime = new Date(`${date}T${time}:00+07:00`);
  utcTime.setHours(utcTime.getHours() + plusHours);
  return utcTime.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function formatFullDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}
