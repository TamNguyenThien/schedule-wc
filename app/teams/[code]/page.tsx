"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  Calendar,
  Clock,
  Globe,
  Heart,
  Info,
  Shield,
  Sparkles,
  Trophy,
  Users
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import MatchCard from "@/components/MatchCard";
import TeamFlag from "@/components/TeamFlag";
import ThemeToggle from "@/components/ThemeToggle";
import { fetchWorldCupData } from "@/lib/clientApi";
import { favoritesStorage } from "@/lib/favoritesStorage";
import { getTeamMatches, resolveTeamProfile } from "@/lib/teamProfiles";
import { cn } from "@/lib/utils";
import type { Match, Team, TeamProfile } from "@/types/worldcup";

type TeamTab = "overview" | "squad" | "fixtures";

export default function TeamDetailPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [favoriteTeamIds, setFavoriteTeamIds] = useState<Set<string>>(new Set());
  const [favoriteMatchIds, setFavoriteMatchIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TeamTab>("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const data = await fetchWorldCupData();
        if (!mounted) return;
        setTeams(data.teams);
        setMatches(data.matches);
        setFavoriteTeamIds(favoritesStorage.readTeams());
        setFavoriteMatchIds(favoritesStorage.readMatches());
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const resolved = useMemo(() => resolveTeamProfile(params.code, teams), [params.code, teams]);
  const teamMatches = useMemo(
    () => (resolved ? getTeamMatches(resolved.team.id, matches) : []),
    [matches, resolved]
  );

  function toggleFavoriteTeam(teamId: string) {
    setFavoriteTeamIds((current) => {
      const next = new Set(current);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      favoritesStorage.writeTeams(next);
      return next;
    });
  }

  function toggleFavoriteMatch(matchId: string) {
    setFavoriteMatchIds((current) => {
      const next = new Set(current);
      if (next.has(matchId)) next.delete(matchId);
      else next.add(matchId);
      favoritesStorage.writeMatches(next);
      return next;
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen py-6">
        <div className="app-container">
          <LoadingState />
        </div>
      </main>
    );
  }

  if (!resolved) {
    return (
      <main className="min-h-screen py-6">
        <div className="app-container space-y-6">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại Lịch thi đấu
          </button>
          <EmptyState message="Không tìm thấy hồ sơ đội tuyển." />
        </div>
      </main>
    );
  }

  const { team, profile } = resolved;
  const isFavorite = favoriteTeamIds.has(team.id);

  return (
    <main className="relative min-h-screen py-6 text-foreground">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[20%] top-[10%] h-[30vw] w-[30vw] rounded-full bg-rose-500/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] h-[40vw] w-[40vw] rounded-full bg-trophy-300/5 blur-[150px]" />
      </div>
      <div className="app-container space-y-8">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại Lịch thi đấu
          </button>
          <button
            onClick={() => toggleFavoriteTeam(team.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-black transition",
              isFavorite
                ? "border-rose-500/30 bg-rose-500/15 text-rose-300"
                : "border-white/10 bg-white/5 text-white hover:border-rose-500/30 hover:text-rose-300"
            )}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
            <span className="hidden sm:inline">{isFavorite ? "Đội tuyển tôi yêu" : "Đặt làm Đội tuyển tôi yêu"}</span>
          </button>
        </div>

        <TeamHero team={team} profile={profile} />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-2 shadow-glass backdrop-blur">
          <div className="flex flex-wrap gap-1 border-b border-white/10 pb-1">
            <TeamTabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={Info}>
              Tổng quan & Wiki
            </TeamTabButton>
            <TeamTabButton active={activeTab === "squad"} onClick={() => setActiveTab("squad")} icon={Users}>
              Đội hình tuyển thủ
            </TeamTabButton>
            <TeamTabButton active={activeTab === "fixtures"} onClick={() => setActiveTab("fixtures")} icon={Calendar}>
              Lịch đấu giải đấu
            </TeamTabButton>
          </div>
        </div>

        {activeTab === "overview" && <OverviewTab profile={profile} team={team} />}
        {activeTab === "squad" && <SquadTab profile={profile} team={team} />}
        {activeTab === "fixtures" && (
          <FixturesTab
            matches={teamMatches}
            teams={teams}
            favoriteMatchIds={favoriteMatchIds}
            onToggleFavorite={toggleFavoriteMatch}
          />
        )}
      </div>
      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle />
      </div>
    </main>
  );
}

function TeamHero({ team, profile }: { team: Team; profile: TeamProfile }) {
  return (
    <section className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glass backdrop-blur md:flex-row sm:p-8">
      <Trophy className="absolute right-4 top-4 h-44 w-44 text-trophy-300 opacity-10" />
      <div className="relative flex h-24 w-36 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-glass">
        <TeamFlag flag={profile.flagUrl ?? team.flag} className="h-full w-full text-6xl" />
      </div>
      <div className="relative z-10 flex-1 space-y-2.5 text-center md:text-left">
        <div className="flex flex-col justify-center gap-2 md:flex-row md:items-center md:justify-start md:gap-3">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl">
            Đội tuyển {profile.localName}
          </h1>
          <span className="self-center rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-black text-rose-300 md:self-auto">
            Mã Quốc gia: #{profile.code.toUpperCase()}
          </span>
        </div>
        <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-400">
          Hồ sơ thông tin chi tiết, lịch sử cúp thế giới và danh sách cầu thủ chính thức được đăng ký
          cho chiến dịch FIFA World Cup 2026.
        </p>
      </div>
    </section>
  );
}

function TeamTabButton({
  active,
  onClick,
  icon: Icon,
  children
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Info;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-black transition sm:text-sm",
        active ? "tab-active-text bg-rose-700 shadow-glow" : "text-slate-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function OverviewTab({ profile, team }: { profile: TeamProfile; team: Team }) {
  const coach = team.coach?.name ?? profile.coach;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6">
        <InfoCard title="Huấn luyện viên trưởng" icon={Users}>
          <div className="flex items-center gap-4 pt-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-lg font-black text-rose-300">
              {(coach ?? "TBD").charAt(0)}
            </div>
            <div>
              <h4 className="text-base font-black text-white">{coach ?? "Đang cập nhật"}</h4>
              <p className="text-xs font-bold text-slate-500">
                {team.coach?.dateOfBirth ? `Sinh ngày ${formatDate(team.coach.dateOfBirth)}` : "Thuyền trưởng chính thức"}
              </p>
            </div>
          </div>
          <p className="mt-4 border-t border-white/10 pt-3 text-xs font-bold leading-relaxed text-slate-400">
            Chịu trách nhiệm xây dựng lối chơi, sơ đồ chiến thuật và tuyển chọn danh sách cầu thủ
            tham gia chiến dịch World Cup 2026.
          </p>
        </InfoCard>

        <InfoCard title="Thông số Wiki Đội tuyển" icon={Shield}>
          <div className="space-y-3.5 py-2 text-xs">
            <WikiRow icon={Globe} label="Liên đoàn" value={profile.federation ?? team.confederation} />
            <WikiRow icon={Award} label="Thứ hạng FIFA" value={profile.fifaRanking ? `#${profile.fifaRanking}` : "Đang cập nhật"} />
            <WikiRow icon={Trophy} label="Thành tích tốt nhất" value={profile.bestResult ?? "Đang cập nhật"} highlight />
          </div>
        </InfoCard>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <InfoCard title="Tổng quan về Đội bóng" icon={Sparkles}>
          <p className="pt-3 text-sm font-bold leading-relaxed text-slate-300">{profile.overview}</p>
        </InfoCard>

        <InfoCard title="Lịch sử & Thành tích qua các kỳ World Cup" icon={Clock}>
          {profile.history.length === 0 ? (
            <p className="pt-3 text-sm font-bold text-slate-400">Lịch sử thành tích đang được cập nhật.</p>
          ) : (
            <div className="relative ml-2.5 space-y-6 border-l-2 border-rose-500/20 py-2 pl-6">
              {profile.history.map((item) => (
                <div key={`${item.year}-${item.result}`} className="relative">
                  <span className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-rose-500 bg-slate-950 shadow-glow" />
                  <div className="space-y-1.5">
                    <span className="inline-block rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-sm font-black text-rose-300">
                      Năm {item.year}
                    </span>
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                      <h4 className="text-sm font-black text-white">Chủ nhà: {item.host}</h4>
                      <span className="inline-flex items-center gap-1 text-xs font-black text-trophy-300">
                        <Trophy className="h-3 w-3" />
                        {item.result}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </InfoCard>
      </div>
    </div>
  );
}

function SquadTab({ profile, team }: { profile: TeamProfile; team: Team }) {
  const squad = team.squad ?? [];
  const players = profile.keyPlayers ?? [];

  if (squad.length > 0) {
    const grouped = groupSquadByPosition(squad);

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glass">
          <h3 className="text-sm font-black uppercase tracking-wider text-trophy-300">
            Danh sách {squad.length} tuyển thủ từ football-data.org
          </h3>
          <p className="mt-2 text-sm font-bold text-slate-400">
            Dữ liệu gồm tên cầu thủ, vị trí, ngày sinh và quốc tịch. Nguồn hiện không cung cấp ảnh cầu thủ.
          </p>
        </div>

        {grouped.map((group) => (
          <section key={group.position} className="space-y-3">
            <h3 className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white">
              {translatePosition(group.position)} ({group.players.length})
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.players.map((player) => (
                <div key={`${player.id ?? player.name}`} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glass">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-sm font-black text-rose-300">
                      {getInitials(player.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-black text-white">{player.name}</h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">{translatePosition(player.position)}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs">
                    <WikiRow icon={Calendar} label="Ngày sinh" value={player.dateOfBirth ? formatDate(player.dateOfBirth) : "Đang cập nhật"} />
                    <WikiRow icon={Globe} label="Quốc tịch" value={player.nationality ?? "Đang cập nhật"} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (players.length === 0) {
    return <EmptyState message="Đội hình chính thức chưa được công bố." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {players.map((player, index) => (
        <div key={player} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glass">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-rose-500/10 text-sm font-black text-rose-300">
              {index + 1}
            </div>
            <div>
              <h3 className="font-black text-white">{player}</h3>
              <p className="text-xs font-bold text-slate-500">Cầu thủ nổi bật</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function groupSquadByPosition(players: NonNullable<Team["squad"]>) {
  const order = ["Goalkeeper", "Defence", "Midfield", "Offence"];
  const groups = new Map<string, typeof players>();

  players.forEach((player) => {
    const position = player.position ?? "Other";
    groups.set(position, [...(groups.get(position) ?? []), player]);
  });

  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    })
    .map(([position, groupPlayers]) => ({ position, players: groupPlayers }));
}

function translatePosition(position?: string | null) {
  if (position === "Goalkeeper") return "Thủ môn";
  if (position === "Defence") return "Hậu vệ";
  if (position === "Midfield") return "Tiền vệ";
  if (position === "Offence") return "Tiền đạo";
  return "Vị trí khác";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

function FixturesTab({
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
  if (matches.length === 0) {
    return <EmptyState message="Chưa có lịch đấu cho đội tuyển này." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          teams={teams}
          isFavorite={favoriteMatchIds.has(match.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

function InfoCard({
  title,
  icon: Icon,
  children
}: {
  title: string;
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur sm:p-6">
      <h3 className="flex items-center gap-2 border-b border-white/10 pb-3 text-xs font-black uppercase tracking-wider text-trophy-300">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function WikiRow({
  icon: Icon,
  label,
  value,
  highlight = false
}: {
  icon: typeof Globe;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/10 pb-2 last:border-0">
      <span className="inline-flex items-center gap-1.5 font-bold text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className={cn("text-right font-black", highlight ? "text-rose-300" : "text-white")}>{value}</span>
    </div>
  );
}
