"use client";

import Link from "next/link";
import {
  Calendar,
  CalendarDays,
  ChevronDown,
  Clock,
  Download,
  ExternalLink,
  Flame,
  Grid2X2,
  Heart,
  List,
  Radio,
  Search,
  Star,
  Table2,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import EmptyState from "./EmptyState";
import KnockoutBracket from "./KnockoutBracket";
import MatchCard from "./MatchCard";
import ScorePredictionInput from "./ScorePredictionInput";
import TeamFlag from "./TeamFlag";
import { formatMatchLocation, hasKnownMatchLocation } from "@/lib/matchDetails";
import { getTeamSlug } from "@/lib/teamProfiles";
import { cn } from "@/lib/utils";
import {
  getMatchPrediction,
  type MatchPrediction,
} from "@/lib/matchPredictions";
import {
  compareMatchesByDateTime,
  formatMatchTime,
  toCalendarUtcDate,
} from "@/lib/matchTime";
import type { BracketMatch, Match, Team } from "@/types/worldcup";

type ScheduleMode = "all" | "date" | "knockout";
type ViewMode = "table" | "grid";
type UserPrediction = { home: string; away: string };
type UserPredictions = Record<string, UserPrediction>;

const userPredictionsKey = "wc2026.userPredictions";
const fallbackLiveMatchUrl =
  "https://vtvgo.vn/channel/kenh-chinh-thuc-1,13_nb.html";
let hasAutoScrolledToToday = false;

export default function ScheduleBoard({
  matches,
  teams,
  bracket,
  favoriteMatchIds,
  favoriteTeamIds,
  onToggleFavorite,
  autoScrollReady,
}: {
  matches: Match[];
  teams: Team[];
  bracket: BracketMatch[];
  favoriteMatchIds: Set<string>;
  favoriteTeamIds: Set<string>;
  onToggleFavorite: (matchId: string) => void;
  autoScrollReady: boolean;
}) {
  const [mode, setMode] = useState<ScheduleMode>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [venueFilter, setVenueFilter] = useState("");
  const [favoriteTeamsOnly, setFavoriteTeamsOnly] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [userPredictions, setUserPredictions] = useState<UserPredictions>({});

  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );
  const availableDates = useMemo(
    () =>
      Array.from(new Set(matches.map((match) => match.date))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [matches],
  );
  const todayDate = useMemo(() => getTodayVietnamDate(), []);
  const availableGroups = useMemo(
    () =>
      Array.from(
        new Set(
          matches.map((match) => match.group).filter(Boolean) as string[],
        ),
      ).sort(),
    [matches],
  );
  const availableStages = useMemo(
    () =>
      Array.from(new Set(matches.map((match) => match.stage))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [matches],
  );
  const availableVenues = useMemo(
    () =>
      Array.from(
        new Set(
          matches
            .map((match) => match.stadium)
            .filter((venue) => venue !== "TBD"),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [matches],
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

  function updateUserPrediction(
    matchId: string,
    field: keyof UserPrediction,
    value: string,
  ) {
    const normalized = value.replace(/\D/g, "").slice(0, 2);
    setUserPredictions((current) => {
      const nextPrediction = {
        ...(current[matchId] ?? { home: "", away: "" }),
        [field]: normalized,
      };
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
        const matchesSearch =
          normalizedSearch.length === 0 ||
          home?.name.toLowerCase().includes(normalizedSearch) ||
          away?.name.toLowerCase().includes(normalizedSearch) ||
          home?.shortName.toLowerCase().includes(normalizedSearch) ||
          away?.shortName.toLowerCase().includes(normalizedSearch) ||
          match.stadium.toLowerCase().includes(normalizedSearch) ||
          match.city.toLowerCase().includes(normalizedSearch);
        const matchesGroup = !groupFilter || match.group === groupFilter;
        const matchesStage = !stageFilter || match.stage === stageFilter;
        const matchesVenue = !venueFilter || match.stadium === venueFilter;
        const matchesFavoriteTeams =
          !favoriteTeamsOnly ||
          favoriteTeamIds.has(match.homeTeamId ?? "") ||
          favoriteTeamIds.has(match.awayTeamId ?? "");

        return (
          matchesSearch &&
          matchesGroup &&
          matchesStage &&
          matchesVenue &&
          matchesFavoriteTeams
        );
      })
      .sort(compareMatchesByDateTime);
  }, [
    favoriteTeamIds,
    favoriteTeamsOnly,
    groupFilter,
    matches,
    mode,
    search,
    stageFilter,
    teamsById,
    venueFilter,
  ]);

  const effectiveSelectedDate =
    selectedDate ||
    (availableDates.includes(todayDate) ? todayDate : availableDates[0]) ||
    "";
  const dateMatches = useMemo(
    () =>
      filteredMatches.filter((match) => match.date === effectiveSelectedDate),
    [effectiveSelectedDate, filteredMatches],
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
          `DTSTAMP:${new Date()
            .toISOString()
            .replace(/[-:]/g, "")
            .replace(/\.\d{3}/, "")}`,
          `DTSTART:${start}`,
          `DTEND:${end}`,
          `SUMMARY:World Cup 2026 - ${home} vs ${away}`,
          `LOCATION:${hasKnownMatchLocation(match) ? formatMatchLocation(match) : ""}`,
          ...buildIcsAlarms(),
          "END:VEVENT",
        ];
      }),
      "END:VCALENDAR",
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
    <div className="space-y-5 sm:space-y-7">
      <div className="border-b border-slate-200 pb-2 dark:border-white/10 sm:pb-0">
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-8">
          <ScheduleModeButton
            active={mode === "all"}
            onClick={() => setMode("all")}
            icon={Table2}
          >
            Tất cả trận đấu
          </ScheduleModeButton>
          <ScheduleModeButton
            active={mode === "date"}
            onClick={() => setMode("date")}
            icon={Calendar}
          >
            Lịch theo ngày
          </ScheduleModeButton>
          <ScheduleModeButton
            active={mode === "knockout"}
            onClick={() => setMode("knockout")}
            icon={Flame}
          >
            Nhánh Knockout
          </ScheduleModeButton>
        </div>
      </div>

      {mode === "date" ? (
        <div className="relative w-full max-w-[420px]">
          <CalendarDays className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-rose-700 sm:left-5 sm:h-6 sm:w-6" />
          <select
            value={effectiveSelectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-12 pr-10 text-base font-extrabold text-slate-950 shadow-glass outline-none dark:border-white/10 dark:bg-white/5 dark:text-white sm:h-16 sm:rounded-[24px] sm:px-16 sm:pr-12 sm:text-lg"
          >
            {availableDates.map((date) => (
              <option key={date} value={date}>
                Ngày {formatFullDate(date)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-950 dark:text-white sm:right-5 sm:h-6 sm:w-6" />
        </div>
      ) : (
        mode !== "knockout" && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 sm:left-5" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm đội, sân, thành phố..."
              className="h-[52px] w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-rose-700/40 dark:border-white/10 dark:bg-white/5 dark:text-white sm:h-14 sm:px-14"
            />
          </div>
        )
      )}

      {mode !== "knockout" && (
        <div className="grid gap-2.5 md:grid-cols-[1fr_1fr_1fr_auto]">
          <FilterSelect
            label="Bảng đấu"
            value={groupFilter}
            onChange={setGroupFilter}
          >
            <option value="">Tất cả bảng</option>
            {availableGroups.map((group) => (
              <option key={group} value={group}>
                Bảng {group}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Vòng đấu"
            value={stageFilter}
            onChange={setStageFilter}
          >
            <option value="">Tất cả vòng</option>
            {availableStages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Sân vận động"
            value={venueFilter}
            onChange={setVenueFilter}
          >
            <option value="">Tất cả sân</option>
            {availableVenues.map((venue) => (
              <option key={venue} value={venue}>
                {venue}
              </option>
            ))}
          </FilterSelect>
          <label className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-glass dark:border-white/10 dark:bg-white/5 dark:text-white sm:h-[58px]">
            Đội tôi theo dõi
            <input
              type="checkbox"
              checked={favoriteTeamsOnly}
              onChange={(event) => setFavoriteTeamsOnly(event.target.checked)}
              className="h-5 w-5 accent-rose-700"
            />
          </label>
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
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/5">
                <ViewButton
                  active={viewMode === "table"}
                  onClick={() => setViewMode("table")}
                  icon={List}
                >
                  Bảng
                </ViewButton>
                <ViewButton
                  active={viewMode === "grid"}
                  onClick={() => setViewMode("grid")}
                  icon={Grid2X2}
                >
                  Lưới
                </ViewButton>
              </div>
              <button
                onClick={downloadIcs}
                className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-900 transition hover:border-trophy-500/50 dark:border-white/10 dark:bg-white/5 dark:text-white"
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
              todayDate={todayDate}
              autoScrollReady={autoScrollReady}
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
  onSelectMatch,
  todayDate,
  autoScrollReady,
}: {
  matches: Match[];
  teamsById: Map<string, Team>;
  favoriteMatchIds: Set<string>;
  userPredictions: UserPredictions;
  onToggleFavorite: (matchId: string) => void;
  onPredictionChange: (
    matchId: string,
    field: keyof UserPrediction,
    value: string,
  ) => void;
  onSelectMatch: (match: Match) => void;
  todayDate: string;
  autoScrollReady: boolean;
}) {
  const groups = groupMatchesByDate(matches);
  const teams = Array.from(teamsById.values());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileTodayGroupRef = useRef<HTMLElement | null>(null);
  const desktopTodayGroupRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (!autoScrollReady) return;
    if (hasAutoScrolledToToday) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const target = isDesktop
      ? desktopTodayGroupRef.current
      : mobileTodayGroupRef.current;
    if (!target) return;

    const timeoutId = window.setTimeout(() => {
      if (hasAutoScrolledToToday) return;
      hasAutoScrolledToToday = true;

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const container = scrollContainerRef.current;
          if (!container) return;

          const offset = isDesktop ? 16 : 72;
          const top =
            target.getBoundingClientRect().top -
            container.getBoundingClientRect().top +
            container.scrollTop -
            offset;

          container.scrollTo({
            top: Math.max(top, 0),
            behavior: "auto",
          });
        });
      });
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [autoScrollReady, groups.length, todayDate]);

  return (
    <div
      ref={scrollContainerRef}
      className="max-h-[72vh] overflow-y-auto overscroll-contain rounded-[24px] pr-1 md:max-h-[68vh]"
    >
      <div className="grid gap-4 md:hidden">
        {groups.map((group) => (
          <section
            key={group.date}
            ref={group.date === todayDate ? mobileTodayGroupRef : undefined}
            className="scroll-mt-4 space-y-3"
          >
            <div
              className={cn(
                "sticky top-0 z-20 flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-black shadow-glass backdrop-blur",
                group.date === todayDate
                  ? "border-rose-500/30 bg-rose-700 !text-white dark:text-white"
                  : "border-slate-200 bg-white text-slate-950 dark:border-white/10 dark:bg-slate-950/90 dark:text-white",
              )}
            >
              <span>{formatFullDate(group.date)}</span>
              {group.date === todayDate && (
                <span className="rounded-full bg-white/20 px-2 py-1 text-xs">
                  Hôm nay
                </span>
              )}
            </div>
            {group.matches.map((match) => (
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
          </section>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-glass dark:border-white/10 dark:bg-white/5 md:block">
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
                <th className="whitespace-nowrap px-3 py-4 text-center">
                  Tỉ số
                </th>
                <th className="px-4 py-4">Đội 2</th>
                <th className="px-3 py-4 text-center">Mô phỏng</th>
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
                      ref={
                        group.date === todayDate && index === 0
                          ? desktopTodayGroupRef
                          : undefined
                      }
                      onClick={() => onSelectMatch(match)}
                      className={cn(
                        "cursor-pointer border-b border-slate-200 transition last:border-0 hover:bg-rose-50/60 dark:border-white/10 dark:hover:bg-white/5",
                        group.date === todayDate &&
                          "bg-rose-50/70 dark:bg-rose-500/10",
                      )}
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white">
                          {match.matchNumber}
                        </span>
                      </td>
                      {index === 0 && (
                        <td
                          rowSpan={group.matches.length}
                          className="border-r border-slate-200 px-4 py-3 text-center align-middle dark:border-white/10"
                        >
                          <span className="inline-flex rounded-2xl border border-rose-700/20 bg-rose-700/10 px-3 py-2 text-sm font-extrabold leading-none text-rose-700 shadow-glow dark:text-rose-300">
                            {formatShortDate(group.date)}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 font-bold text-slate-950 dark:text-white">
                          <Clock className="h-5 w-5 text-trophy-700 dark:text-trophy-300" />
                          {formatMatchTime(match.time)}
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
                          <span className="text-sm font-bold text-slate-400">
                            TBD
                          </span>
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
                            <Heart
                              className={cn(
                                "h-5 w-5",
                                favoriteMatchIds.has(match.id) &&
                                  "fill-current text-rose-700 dark:text-rose-300",
                              )}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
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
  onSelectMatch,
}: {
  date: string;
  matches: Match[];
  teams: Team[];
  favoriteMatchIds: Set<string>;
  userPredictions: UserPredictions;
  onToggleFavorite: (matchId: string) => void;
  onPredictionChange: (
    matchId: string,
    field: keyof UserPrediction,
    value: string,
  ) => void;
  onSelectMatch: (match: Match) => void;
}) {
  return (
    <div className="space-y-5 sm:space-y-8">
      <div className="border-b border-slate-200 pb-4 dark:border-white/10 sm:pb-5">
        <h2 className="inline-flex items-center gap-2 text-base font-extrabold text-trophy-700 dark:text-trophy-300 sm:gap-3 sm:text-lg">
          <Grid2X2 className="h-5 w-5 sm:h-6 sm:w-6" />
          Danh sách trận ngày {formatFullDate(date)}
        </h2>
      </div>
      {matches.length === 0 ? (
        <EmptyState message="Không có trận đấu trong ngày đã chọn." />
      ) : (
        <div className="grid gap-3 sm:gap-6 lg:grid-cols-2">
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

function TeamCell({
  team,
  align = "left",
}: {
  team?: Team;
  align?: "left" | "right";
}) {
  const content = (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-2 text-base font-bold text-slate-950 dark:text-white",
        align === "right" && "justify-end",
      )}
    >
      {align === "left" && (
        <TeamFlag flag={team?.flag} className="h-6 w-6 shrink-0 text-lg" />
      )}
      <span className="truncate">{team?.name ?? "TBD"}</span>
      {align === "right" && (
        <TeamFlag flag={team?.flag} className="h-6 w-6 shrink-0 text-lg" />
      )}
    </span>
  );

  if (!team) return content;

  return (
    <Link
      href={`/teams/${getTeamSlug(team)}`}
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "block min-w-0 transition hover:opacity-75",
        align === "right" && "text-right",
      )}
    >
      {content}
    </Link>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-black text-slate-950 shadow-glass outline-none transition focus:border-rose-700/40 dark:border-white/10 dark:bg-white/5 dark:text-white sm:h-[58px]"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
    </label>
  );
}

function ScheduleModeButton({
  active,
  onClick,
  icon: Icon,
  children,
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
        "relative inline-flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[11px] font-extrabold leading-tight transition sm:flex-row sm:gap-3 sm:px-4 sm:py-3 sm:text-base",
        active
          ? "tab-active-text bg-rose-700 shadow-glow"
          : "text-slate-900 hover:bg-slate-100 hover:text-rose-700 dark:text-white dark:hover:bg-white/10 dark:hover:text-rose-300",
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="leading-tight">{children}</span>
    </button>
  );
}

function ViewButton({
  active,
  onClick,
  icon: Icon,
  children,
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
        active
          ? "tab-active-text bg-rose-700 shadow-glow"
          : "text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function groupMatchesByDate(matches: Match[]) {
  const map = new Map<string, Match[]>();
  matches.forEach((match) =>
    map.set(match.date, [...(map.get(match.date) ?? []), match]),
  );

  return Array.from(map.entries()).map(([date, groupMatches]) => ({
    date,
    matches: groupMatches,
  }));
}

function formatShortDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(parsed);
}

function getTodayVietnamDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function MatchDetailModal({
  match,
  teamsById,
  onClose,
  isFavorite,
  onToggleFavorite,
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
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto px-3 py-4 backdrop-blur-sm sm:items-center sm:px-4 sm:py-8"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.62)" }}
    >
      <div className="relative my-auto w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-slate-950 sm:rounded-[34px] sm:p-10">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-slate-950 transition hover:bg-slate-100 dark:text-white dark:hover:bg-white/10 sm:right-8 sm:top-8"
          aria-label="Đóng"
        >
          <X className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>

        <div className="mb-5 max-w-[calc(100%-3rem)] rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white sm:mb-8 sm:inline-flex sm:px-5 sm:text-base">
          🏆 {match.stage}
          {match.group ? ` • Bảng ${match.group}` : ""}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-6">
          <ModalTeam team={home} align="center" />
          <div className="rounded-2xl border border-slate-200 bg-slate-100 px-3 py-3 text-center dark:border-white/10 dark:bg-white/5 sm:rounded-[24px] sm:px-10 sm:py-7">
            <div className="text-base font-extrabold tracking-wide text-slate-950 dark:text-white sm:text-lg sm:tracking-[0.35em]">
              {match.homeScore ?? "-"}{" "}
              {match.homeScore === null && match.awayScore === null ? "" : ":"}{" "}
              {match.awayScore ?? "-"}
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-trophy-700 dark:text-trophy-300 sm:mt-3 sm:gap-2 sm:text-base">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              {formatMatchTime(match.time)}
            </div>
          </div>
          <ModalTeam team={away} align="center" />
        </div>

        <div className="my-5 border-t border-slate-200 dark:border-white/10 sm:my-9" />

        {prediction && (
          <CompactPrediction
            prediction={prediction}
            homeLabel={home?.shortName ?? "Đội 1"}
            awayLabel={away?.shortName ?? "Đội 2"}
          />
        )}

        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5 md:grid-cols-2 sm:rounded-[24px] sm:p-6">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-950 dark:text-white">
              Thời gian (Địa phương)
            </h3>
            <p className="mt-2 text-base font-extrabold text-slate-950 dark:text-white sm:text-lg">
              {formatFullDate(match.date)} {formatMatchTime(match.time)}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-950 dark:text-white">
              Trạng thái trận đấu
            </h3>
            <p className="mt-2 inline-flex items-center gap-2 text-base font-extrabold text-slate-950 dark:text-white sm:text-lg">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              {match.status === "finished"
                ? "Đã kết thúc"
                : match.status === "live"
                  ? "Đang diễn ra"
                  : "Chưa diễn ra"}
            </p>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-950 dark:text-white">
              Địa điểm
            </h3>
            <p className="mt-2 text-base font-extrabold text-slate-950 dark:text-white sm:text-lg">
              {formatMatchLocation(match)}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5 sm:mt-6 sm:rounded-[24px] sm:p-6">
          <h3 className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-trophy-700 dark:text-trophy-300">
            <CalendarDays className="h-5 w-5" />
            Đồng bộ lịch thi đấu
          </h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-950 dark:text-white sm:mt-4 sm:text-base sm:leading-7">
            Thêm trận đấu này vào Google Calendar hoặc tải file (.ics) cho Apple
            Calendar, Outlook để nhận nhắc hẹn và không bỏ lỡ trận cầu.
          </p>
          <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
            <Link
              href={`/matches/${match.id}`}
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-extrabold text-amber-700 transition hover:bg-amber-100 sm:h-14 sm:text-base"
            >
              <Trophy className="h-5 w-5" />
              Trang chi tiết
            </Link>
            <button
              onClick={() => openGoogleCalendar(match, teamsById)}
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-extrabold text-blue-700 transition hover:bg-blue-100 sm:h-14 sm:text-base"
            >
              <CalendarDays className="h-5 w-5" />
              Google Calendar
            </button>
            <button
              onClick={() => downloadMatchIcs(match, teamsById)}
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-extrabold text-emerald-700 transition hover:bg-emerald-100 sm:h-14 sm:text-base"
            >
              <Download className="h-5 w-5" />
              Apple / Outlook (.ics)
            </button>
            <button
              onClick={() => onToggleFavorite(match.id)}
              className={cn(
                "inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border px-3 py-2 text-sm font-extrabold transition sm:h-14 sm:text-base",
                isFavorite
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-white text-slate-950 hover:bg-slate-50",
              )}
            >
              <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
              {isFavorite ? "Đã yêu thích" : "Yêu thích"}
            </button>
          </div>
        </div>
        {match.status === "live" && <LiveMatchLink match={match} />}
      </div>
    </div>,
    document.body,
  );
}

function LiveMatchLink({ match }: { match: Match }) {
  const className =
    "mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-black text-white shadow-glow transition hover:bg-red-700 sm:mt-6 sm:min-h-14 sm:text-base";
  const liveMatchUrl = match.matchUrl ?? fallbackLiveMatchUrl;

  return (
    <a
      href={liveMatchUrl}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      <Radio className="h-5 w-5" />
      Mở link trận đấu
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

function CompactPrediction({
  prediction,
  homeLabel,
  awayLabel,
}: {
  prediction: MatchPrediction;
  homeLabel: string;
  awayLabel: string;
}) {
  return (
    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-300/20 dark:bg-amber-300/10 sm:mb-6 sm:rounded-[24px] sm:p-5">
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
        Tỉ số dự kiến {prediction.projectedScore} • Line mô phỏng{" "}
        {prediction.handicap} • Độ tin cậy {prediction.confidence}%
      </p>
    </div>
  );
}

function CompactProbability({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white p-3 dark:bg-black/20">
      <div className="flex items-center justify-between gap-2 text-sm font-black text-slate-950 dark:text-white">
        <span>{label}</span>
        <span className="text-amber-700 dark:text-amber-200">{value}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-amber-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ModalTeam({
  team,
  align = "left",
}: {
  team?: Team;
  align?: "left" | "right" | "center";
}) {
  const content = (
    <div
      className={cn(
        "flex flex-col items-center",
        align === "right"
          ? "md:items-end"
          : align === "center"
            ? "items-center"
            : "md:items-start",
      )}
    >
      <TeamFlag
        flag={team?.flag}
        className="h-12 w-16 rounded-xl text-4xl sm:h-20 sm:w-28 sm:text-6xl"
      />
      <h2 className="mt-2 max-w-full truncate text-center text-sm font-extrabold text-slate-950 dark:text-white md:text-left sm:mt-4 sm:text-lg">
        {team?.name ?? "TBD"}
      </h2>
    </div>
  );

  if (!team) return content;

  return (
    <Link
      href={`/teams/${getTeamSlug(team)}`}
      className="transition hover:opacity-80"
    >
      {content}
    </Link>
  );
}

function openGoogleCalendar(match: Match, teamsById: Map<string, Team>) {
  window.open(
    buildGoogleCalendarUrl(match, teamsById),
    "_blank",
    "noopener,noreferrer",
  );
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
    location: hasKnownMatchLocation(match) ? formatMatchLocation(match) : "",
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
    `DTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}`,
    `DTSTART:${toCalendarUtcDate(match.date, match.time)}`,
    `DTEND:${toCalendarUtcDate(match.date, match.time, 2)}`,
    `SUMMARY:World Cup 2026: ${home} vs ${away}`,
    `DESCRIPTION:${match.stage}${match.group ? ` - Bảng ${match.group}` : ""}`,
    `LOCATION:${hasKnownMatchLocation(match) ? formatMatchLocation(match) : ""}`,
    ...buildIcsAlarms(),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `wc2026-${match.matchNumber}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

function buildIcsAlarms() {
  return [
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:World Cup 2026 bắt đầu sau 1 giờ",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:World Cup 2026 bắt đầu sau 15 phút",
    "END:VALARM",
  ];
}

function formatFullDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}
