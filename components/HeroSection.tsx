import { CalendarDays, ListChecks, Trophy } from "lucide-react";
import type { ReactNode } from "react";

export default function HeroSection({
  children
}: {
  children: ReactNode;
}) {
  return (
    <section className="relative flex select-none flex-col items-center justify-between gap-6 overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/35 p-5 text-slate-100 shadow-glass backdrop-blur md:flex-row sm:p-7">
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
        <div className="absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
        <div className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-white" />
        <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
      </div>
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-rose-500/15 blur-[120px]" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-trophy-300/15 blur-[120px]" />

      <div className="relative z-10 max-w-xl space-y-4 text-left">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-3 py-1 text-sm font-black uppercase tracking-wider text-rose-300 sm:text-xs">
            <Trophy className="h-4 w-4" />
            FIFA WORLD CUP 2026
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-black uppercase tracking-wider text-slate-300 sm:text-xs">
            <CalendarDays className="h-4 w-4 text-cyan-200" />
            Mỹ • Canada • Mexico
          </span>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
            Lịch thi đấu World Cup 2026
          </h1>
          <p className="text-xs font-medium leading-relaxed text-slate-300 sm:text-sm">
            Xem nhanh trận sắp tới, lọc theo đội/bảng/ngày và lưu các trận hoặc đội bạn muốn theo dõi.
            Dữ liệu được cập nhật định kỳ từ nguồn API đang cấu hình.
          </p>
        </div>
        <div className="inline-flex text-xs font-bold text-slate-300">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2">
            <ListChecks className="h-4 w-4 text-trophy-300" />
            104 trận • lịch, bảng xếp hạng, đội yêu thích
          </span>
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center gap-4 md:w-auto">{children}</div>
    </section>
  );
}
