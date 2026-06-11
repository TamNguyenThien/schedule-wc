import { cn } from "@/lib/utils";
import type { Standing, Team } from "@/types/worldcup";
import TeamFlag from "./TeamFlag";

export default function StandingTable({
  group,
  standings,
  teams,
  bestThirdIds
}: {
  group: string;
  standings: Standing[];
  teams: Team[];
  bestThirdIds: Set<string>;
}) {
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] shadow-glass">
      <div className="border-b border-white/10 bg-black/20 px-5 py-4">
        <h3 className="text-lg font-black text-white">Group {group}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-xs uppercase tracking-[0.16em] text-slate-400">
            <tr className="border-b border-white/10">
              {["#", "Đội", "Trận", "Thắng", "Hòa", "Thua", "BT", "BB", "HS", "Điểm"].map((head) => (
                <th key={head} className="px-3 py-3 text-left first:pl-5 last:pr-5">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((standing, index) => {
              const team = teamsById.get(standing.teamId);
              const isTopTwo = index < 2;
              const isBestThird = index === 2 && bestThirdIds.has(standing.teamId);

              return (
                <tr
                  key={standing.teamId}
                  className={cn(
                    "border-b border-white/5 last:border-0",
                    isTopTwo && "bg-emerald-400/10",
                    isBestThird && "bg-trophy-300/10"
                  )}
                >
                  <td className="px-3 py-3 pl-5 font-black text-slate-300">{index + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <TeamFlag flag={team?.flag} className="h-7 w-7 text-xl" />
                      <span>{team?.name}</span>
                    </div>
                  </td>
                  <NumberCell value={standing.played} />
                  <NumberCell value={standing.won} />
                  <NumberCell value={standing.drawn} />
                  <NumberCell value={standing.lost} />
                  <NumberCell value={standing.goalsFor} />
                  <NumberCell value={standing.goalsAgainst} />
                  <NumberCell value={standing.goalDifference} />
                  <td className="px-3 py-3 pr-5 font-black text-trophy-100">{standing.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NumberCell({ value }: { value: number }) {
  return <td className="px-3 py-3 font-semibold text-slate-300">{value}</td>;
}
