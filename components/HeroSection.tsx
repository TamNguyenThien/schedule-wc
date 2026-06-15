import { CalendarDays, ListChecks, Trophy } from "lucide-react";
import type { ReactNode } from "react";

export default function HeroSection({
  children
}: {
  children: ReactNode;
}) {
  return (
    <section className="relative flex select-none flex-col items-center justify-between gap-4 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/35 p-4 text-slate-100 shadow-glass backdrop-blur md:flex-row md:gap-6 sm:p-7">
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
        <div className="absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
        <div className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-white" />
        <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
      </div>

      <div className="relative z-10 w-full max-w-xl space-y-3 text-left md:space-y-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-3 py-1 text-xs font-black uppercase text-rose-300 sm:tracking-wider">
            <Trophy className="h-4 w-4" />
            FIFA WORLD CUP 2026
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase text-slate-300 sm:tracking-wider">
            <CalendarDays className="h-4 w-4 text-cyan-200" />
            Mỹ • Canada • Mexico
          </span>
        </div>
        <div className="space-y-2 sm:space-y-3">
          <h1 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-4xl">
            Lịch thi đấu World Cup 2026
          </h1>
          <p className="text-sm font-medium leading-relaxed text-slate-300 sm:text-sm">
            Xem nhanh trận sắp tới, lọc theo đội/bảng/ngày và lưu các trận hoặc đội bạn muốn theo dõi.
            <span className="hidden sm:inline"> Dữ liệu được cập nhật định kỳ từ nguồn API đang cấu hình.</span>
          </p>
        </div>
        <div className="inline-flex text-xs font-bold text-slate-300">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2">
            <ListChecks className="h-4 w-4 text-trophy-300" />
            104 trận • lịch, bảng xếp hạng
          </span>
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center gap-4 md:w-auto">{children}</div>
    </section>
  );
}
