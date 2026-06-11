import { Trophy } from "lucide-react";

export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[150px] items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center text-slate-300 shadow-glass">
      <div>
        <Trophy className="mx-auto mb-3 h-8 w-8 text-trophy-300" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}
