import { getGroupsFromTeams } from "@/lib/utils";
import StandingTable from "./StandingTable";
import KnockoutBracket from "./KnockoutBracket";
import type { BracketMatch, Standing, Team } from "@/types/worldcup";

export default function GroupStandings({
  standings,
  teams,
  bestThirdIds,
  bracket
}: {
  standings: Record<string, Standing[]>;
  teams: Team[];
  bestThirdIds: Set<string>;
  bracket: BracketMatch[];
}) {
  return (
    <div className="space-y-8">
      <div>
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-trophy-300">Bảng đấu & xếp hạng</p>
          <h2 className="mt-2 text-3xl font-black text-white">12 bảng World Cup 2026</h2>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          {getGroupsFromTeams(teams).map((group) => (
            <StandingTable
              key={group}
              group={group}
              standings={standings[group] ?? []}
              teams={teams}
              bestThirdIds={bestThirdIds}
            />
          ))}
        </div>
      </div>
      <KnockoutBracket bracket={bracket} />
    </div>
  );
}
