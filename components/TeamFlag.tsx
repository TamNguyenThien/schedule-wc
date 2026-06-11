import { cn } from "@/lib/utils";

export default function TeamFlag({ flag, className }: { flag?: string; className?: string }) {
  if (flag?.startsWith("http")) {
    return (
      <span
        className={cn(
          "inline-grid place-items-center overflow-hidden rounded-full border border-white/15 bg-white/80",
          className
        )}
      >
        <img src={flag} alt="" className="h-full w-full object-contain p-1" />
      </span>
    );
  }

  return <span className={className}>{flag ?? "🏆"}</span>;
}
