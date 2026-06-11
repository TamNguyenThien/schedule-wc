import { Calendar, Heart, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type MainTab = "schedule" | "standings" | "favoriteMatches" | "favoriteTeams";

const tabs = [
  { id: "schedule", label: "Lịch thi đấu", icon: Calendar },
  { id: "standings", label: "Bảng đấu & Xếp hạng", icon: Trophy },
  { id: "favoriteMatches", label: "Trận yêu thích", icon: Heart },
  { id: "favoriteTeams", label: "Đội yêu thích", icon: Users }
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
    <div className="flex w-full gap-2 overflow-x-auto rounded-[16px] border border-slate-200 bg-slate-50/90 p-1.5 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/5">
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
              "flex min-h-8 flex-1 items-center justify-center gap-3 whitespace-nowrap rounded-[16px] px-3 py-3 text-base font-black transition sm:text-base",
              active === tab.id
                ? "tab-active-text bg-rose-700 shadow-glow"
                : "text-slate-950 hover:bg-white dark:text-white dark:hover:bg-white/5"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
