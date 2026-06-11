import { ArrowRight, Heart, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getTeamSlug } from "@/lib/teamProfiles";
import type { Team } from "@/types/worldcup";
import TeamFlag from "./TeamFlag";

export default function TeamCard({
  team,
  isFavorite,
  onToggleFavorite
}: {
  team: Team;
  isFavorite: boolean;
  onToggleFavorite: (teamId: string) => void;
}) {
  return (
    <article
      className={cn(
        "rounded-[24px] border bg-white/[0.05] p-4 shadow-glass transition",
        isFavorite ? "border-trophy-300/70 ring-1 ring-trophy-300/25" : "border-white/10 hover:border-trophy-300/35"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Link href={`/teams/${getTeamSlug(team)}`} className="min-w-0 flex-1">
          <TeamFlag flag={team.flag} className="h-12 w-12 text-4xl" />
          <h3 className="mt-3 truncate text-lg font-black text-white">{team.name}</h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            {team.shortName} • Group {team.group}
          </p>
          {team.confederation === "TBD" ? (
            <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-extrabold text-trophy-700 transition group-hover:gap-2 dark:text-trophy-300">
              Xem hồ sơ
              <ArrowRight className="h-4 w-4" />
            </span>
          ) : (
            <p className="mt-2 text-sm font-semibold text-cyan-100">{team.confederation}</p>
          )}
        </Link>
        <button
          aria-label="Yêu thích đội"
          onClick={() => onToggleFavorite(team.id)}
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center transition",
            isFavorite ? "text-slate-950" : "border-white/10 bg-white/5 text-slate-300"
          )}
        >
          {isFavorite ? <Heart className="h-5 w-5 fill-current text-rose-700" /> : <Heart className="h-5 w-5" />}
        </button>
      </div>
    </article>
  );
}
