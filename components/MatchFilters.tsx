import type { Stage } from "@/types/worldcup";

const stages: Array<Stage | "Tất cả"> = [
  "Tất cả",
  "Vòng bảng",
  "Vòng 32 đội",
  "Vòng 16 đội",
  "Tứ kết",
  "Bán kết",
  "Tranh hạng ba",
  "Chung kết"
];

export default function MatchFilters({
  groups,
  stage,
  group,
  search,
  onStageChange,
  onGroupChange,
  onSearchChange
}: {
  groups: string[];
  stage: Stage | "Tất cả";
  group: string;
  search: string;
  onStageChange: (stage: Stage | "Tất cả") => void;
  onGroupChange: (group: string) => void;
  onSearchChange: (search: string) => void;
}) {
  return (
    <div className="grid gap-3 rounded-[28px] border border-white/10 bg-white/[0.045] p-4 shadow-glass md:grid-cols-[1fr_180px_1fr]">
      <select
        value={stage}
        onChange={(event) => onStageChange(event.target.value as Stage | "Tất cả")}
        className="h-12 rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm font-bold text-white outline-none"
      >
        {stages.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <select
        value={group}
        onChange={(event) => onGroupChange(event.target.value)}
        className="h-12 rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm font-bold text-white outline-none"
      >
        <option value="Tất cả">Tất cả bảng</option>
        {groups.map((item) => (
          <option key={item} value={item}>
            Group {item}
          </option>
        ))}
      </select>
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Tìm đội bóng..."
        className="h-12 rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm font-semibold text-white outline-none placeholder:text-slate-500"
      />
    </div>
  );
}
