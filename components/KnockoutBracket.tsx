"use client";

import { Info, MousePointer2, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import EmptyState from "./EmptyState";
import { cn } from "@/lib/utils";
import type { BracketMatch, Stage } from "@/types/worldcup";

const rounds = ["Vòng 32 đội", "Vòng 16 đội", "Tứ kết", "Bán kết", "Tranh hạng ba", "Chung kết"] as const;
type KnockoutRound = Exclude<Stage, "Vòng bảng">;
type Prediction = { label: string; teamId?: string };
type Predictions = Record<string, Prediction>;

export default function KnockoutBracket({ bracket }: { bracket: BracketMatch[] }) {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [highlightTeamId, setHighlightTeamId] = useState("");
  const [predictions, setPredictions] = useState<Predictions>({});

  const availableTeams = useMemo(() => {
    const teams = new Map<string, string>();
    bracket.forEach((match) => {
      if (match.homeTeamId) teams.set(match.homeTeamId, match.homeLabel);
      if (match.awayTeamId) teams.set(match.awayTeamId, match.awayLabel);
    });
    return Array.from(teams.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [bracket]);

  const selectedMatch = bracket.find((match) => match.id === selectedMatchId) ?? bracket[0];

  function chooseWinner(match: BracketMatch, prediction: Prediction) {
    if (prediction.label === "TBD") return;
    setPredictions((current) => ({ ...current, [match.id]: prediction }));
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-trophy-300">Knockout bracket</p>
          <h2 className="mt-2 text-3xl font-black text-white">Sơ đồ nhánh loại trực tiếp</h2>
          <p className="mt-2 max-w-2xl text-sm font-bold text-slate-400">
            Click một nhánh để xem nguồn đội. Chọn đội trong từng nhánh để lưu dự đoán và highlight đường đi.
          </p>
        </div>
        <div className="min-w-[240px]">
          <label className="mb-2 block text-sm font-black uppercase tracking-wider text-slate-400">Highlight đội</label>
          <select
            value={highlightTeamId}
            onChange={(event) => setHighlightTeamId(event.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm font-bold text-white outline-none"
          >
            <option value="">Không highlight</option>
            {availableTeams.map(([teamId, label]) => (
              <option key={teamId} value={teamId}>
                {label.replace(/^.+?\s/, "")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {bracket.length === 0 ? (
        <EmptyState message="Chưa đủ dữ liệu để tạo sơ đồ nhánh." />
      ) : (
        <>
          {bracket.some((match) => match.isProjected) && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm font-bold text-amber-200">
              Bracket hiện là bản dự kiến vì vòng bảng chưa có kết quả đầy đủ.
            </div>
          )}

          <div className="grid gap-4 overflow-x-auto pb-2 lg:grid-cols-6">
            {rounds.map((round) => (
              <div key={round} className="min-w-[220px] space-y-3">
                <h3 className="rounded-2xl border border-trophy-300/20 bg-trophy-300/10 px-4 py-3 text-center text-sm font-black text-trophy-100">
                  {round}
                </h3>
                {bracket
                  .filter((match) => match.round === round)
                  .map((match) => {
                    const home = getEntrant(match, "home", bracket, predictions);
                    const away = getEntrant(match, "away", bracket, predictions);
                    const predicted = predictions[match.id];
                    const isHighlighted =
                      Boolean(highlightTeamId) &&
                      [home.teamId, away.teamId, predicted?.teamId].includes(highlightTeamId);

                    return (
                      <article
                        key={match.id}
                        onClick={() => setSelectedMatchId(match.id)}
                        className={cn(
                          "rounded-2xl border bg-white/[0.055] p-3 text-sm shadow-glass transition",
                          selectedMatchId === match.id ? "border-trophy-300/70" : "border-white/10 hover:border-trophy-300/35",
                          isHighlighted && "ring-2 ring-amber-400/60"
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2 text-xs font-black uppercase text-slate-500">
                          <span>Nhánh {match.slot}</span>
                          <MousePointer2 className="h-4 w-4 text-trophy-300" />
                        </div>
                        <PredictionButton
                          entrant={home}
                          active={predicted?.label === home.label}
                          onClick={() => chooseWinner(match, home)}
                        />
                        <div className="my-1 text-center text-xs font-black text-trophy-300">VS</div>
                        <PredictionButton
                          entrant={away}
                          active={predicted?.label === away.label}
                          onClick={() => chooseWinner(match, away)}
                        />
                        {predicted && (
                          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-black text-amber-300">
                            <Trophy className="h-4 w-4" />
                            {predicted.label}
                          </div>
                        )}
                      </article>
                    );
                  })}
              </div>
            ))}
          </div>

          {selectedMatch && (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5 shadow-glass">
              <h3 className="inline-flex items-center gap-2 text-lg font-black text-white">
                <Info className="h-5 w-5 text-trophy-300" />
                Nguồn đội nhánh {selectedMatch.slot} • {selectedMatch.round}
              </h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <SourcePanel label={selectedMatch.homeLabel} source={selectedMatch.homeSource} />
                <SourcePanel label={selectedMatch.awayLabel} source={selectedMatch.awaySource} />
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function PredictionButton({
  entrant,
  active,
  onClick
}: {
  entrant: Prediction;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={entrant.label === "TBD"}
      className={cn(
        "w-full rounded-xl px-3 py-2 text-left font-bold transition",
        active ? "tab-active-text bg-rose-700 shadow-glow" : "bg-black/25 text-white hover:bg-white/10",
        entrant.label === "TBD" && "cursor-not-allowed opacity-60"
      )}
    >
      {entrant.label}
    </button>
  );
}

function SourcePanel({ label, source }: { label: string; source?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="font-black text-white">{label}</p>
      <p className="mt-2 text-sm font-bold text-slate-400">{source ?? "Nguồn đội sẽ được cập nhật sau."}</p>
    </div>
  );
}

function getEntrant(
  match: BracketMatch,
  side: "home" | "away",
  bracket: BracketMatch[],
  predictions: Predictions
): Prediction {
  const base = side === "home"
    ? { label: match.homeLabel, teamId: match.homeTeamId }
    : { label: match.awayLabel, teamId: match.awayTeamId };

  if (base.label !== "TBD") return base;

  const source = getSourceMatch(match.round, match.slot, side, bracket);
  return source ? predictions[source.id] ?? base : base;
}

function getSourceMatch(
  round: KnockoutRound,
  slot: number,
  side: "home" | "away",
  bracket: BracketMatch[]
) {
  const previousRound = getPreviousRound(round);
  if (!previousRound) return undefined;

  const sourceSlot = (slot - 1) * 2 + (side === "home" ? 1 : 2);
  return bracket.find((match) => match.round === previousRound && match.slot === sourceSlot);
}

function getPreviousRound(round: KnockoutRound): KnockoutRound | null {
  if (round === "Vòng 16 đội") return "Vòng 32 đội";
  if (round === "Tứ kết") return "Vòng 16 đội";
  if (round === "Bán kết") return "Tứ kết";
  if (round === "Chung kết") return "Bán kết";
  return null;
}
