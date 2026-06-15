import { Calendar, Heart, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type MainTab = "schedule" | "standings" | "favoriteMatches" | "favoriteTeams";

const tabs = [
  { id: "schedule", label: "Lịch thi đấu", mobileLabel: "Lịch", icon: Calendar },
  { id: "standings", label: "Bảng đấu & Xếp hạng", mobileLabel: "Bảng", icon: Trophy },
  { id: "favoriteMatches", label: "Trận yêu thích", mobileLabel: "Trận", icon: Heart },
  { id: "favoriteTeams", label: "Đội yêu thích", mobileLabel: "Đội", icon: Users }
] as const;

export default function MainTabs({
  active,
  onChange,
  favoriteMatchesCount,
  favoriteTeamsCount
}: {
  active: MainTab;
  onChange: (tab: MainTab) => void;
  favoriteMatchesCount: number;
  favoriteTeamsCount: number;
}) {
  return (
    <div className="grid w-full grid-cols-4 gap-1 rounded-2xl border border-slate-200 bg-slate-50/90 p-1 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/5 sm:flex sm:gap-2 sm:overflow-x-auto sm:p-1.5">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const label =
          tab.id === "favoriteMatches"
            ? `${tab.label} (${favoriteMatchesCount})`
            : tab.id === "favoriteTeams"
              ? `${tab.label} (${favoriteTeamsCount})`
              : tab.label;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 whitespace-nowrap rounded-xl px-1.5 py-2 text-xs font-black transition sm:min-h-8 sm:flex-row sm:gap-3 sm:rounded-[16px] sm:px-3 sm:py-3 sm:text-base",
              active === tab.id
                ? "tab-active-text bg-rose-700 shadow-glow"
                : "text-slate-950 hover:bg-white dark:text-white dark:hover:bg-white/5"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="sm:hidden">
              {tab.id === "favoriteMatches"
                ? `${tab.mobileLabel} ${favoriteMatchesCount}`
                : tab.id === "favoriteTeams"
                  ? `${tab.mobileLabel} ${favoriteTeamsCount}`
                  : tab.mobileLabel}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
