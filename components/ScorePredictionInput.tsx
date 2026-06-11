import { cn } from "@/lib/utils";

export type ScorePredictionValue = {
  home: string;
  away: string;
};

type ScorePredictionInputProps = {
  matchId: string;
  value?: ScorePredictionValue;
  onChange: (matchId: string, field: keyof ScorePredictionValue, value: string) => void;
  tone?: "light" | "dark";
};

export default function ScorePredictionInput({
  matchId,
  value,
  onChange,
  tone = "light"
}: ScorePredictionInputProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-xl  px-2 py-1.5 ",
        tone === "light"
          ? " bg-white dark:border-white/10 dark:bg-black/20"
          : " bg-black/20"
      )}
      onClick={(event) => event.stopPropagation()}
    >
      <PredictionNumberInput
        label="Dự đoán đội 1"
        value={value?.home ?? ""}
        tone={tone}
        onChange={(nextValue) => onChange(matchId, "home", nextValue)}
      />
      <span className="text-sm font-black text-slate-400">:</span>
      <PredictionNumberInput
        label="Dự đoán đội 2"
        value={value?.away ?? ""}
        tone={tone}
        onChange={(nextValue) => onChange(matchId, "away", nextValue)}
      />
    </div>
  );
}

function PredictionNumberInput({
  label,
  value,
  tone,
  onChange
}: {
  label: string;
  value: string;
  tone: "light" | "dark";
  onChange: (value: string) => void;
}) {
  return (
    <input
      aria-label={label}
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 2))}
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "h-8 w-9 rounded-lg border text-center text-sm font-black outline-none transition",
        tone === "light"
          ? "border-slate-200 bg-slate-50 text-slate-950 focus:border-rose-700/50 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
          : "border-white/10 bg-white/5 text-white focus:border-amber-400/50"
      )}
      placeholder="-"
    />
  );
}
