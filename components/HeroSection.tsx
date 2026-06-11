import { CalendarDays, Sparkles, Trophy } from "lucide-react";
import type { ReactNode } from "react";

export default function HeroSection({
  children
}: {
  children: ReactNode;
}) {
  return (
    <section className="relative flex select-none flex-col items-center justify-between gap-8 overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/35 p-6 text-slate-100 shadow-glass backdrop-blur md:flex-row sm:p-10">
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
        <div className="absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
        <div className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-white" />
        <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
      </div>
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-rose-500/15 blur-[120px]" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-trophy-300/15 blur-[120px]" />

      <div className="relative z-10 max-w-xl space-y-6 text-left">
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
          <h1 className="text-3xl font-black uppercase leading-none tracking-tight text-white sm:text-5xl">
            Hành Trình <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-rose-400 via-amber-400 to-trophy-300 bg-clip-text text-transparent">
              Chinh Phục Cúp Vàng
            </span>
          </h1>
          <p className="text-xs font-medium leading-relaxed text-slate-300 sm:text-sm">
            Trải nghiệm lịch thi đấu bóng đá World Cup 2026 đẳng cấp. Theo dõi sát sao 104 trận cầu
            đỉnh cao từ vòng bảng đến chung kết loại trực tiếp được đồng bộ tự động trực tiếp.
          </p>
        </div>
        <div className="inline-flex text-xs font-bold text-slate-300">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2">
            <Sparkles className="h-4 w-4 text-trophy-300" />
            104 trận đấu • 48 đội tuyển • 12 bảng
          </span>
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center gap-4 md:w-auto">{children}</div>
    </section>
  );
}
