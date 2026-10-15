import { cn } from "@/shared/lib/cn";

const AVATAR_COLORS = ["bg-[#3182f6]", "bg-[#f04452]", "bg-[#00c471]", "bg-[#ff9f0a]", "bg-[#8b5cf6]", "bg-[#14b8a6]"];

export function StockAvatar({ symbol, name, size = "md" }: { symbol: string; name: string; size?: "md" | "lg" }) {
  const colorIndex = [...symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length;

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        AVATAR_COLORS[colorIndex],
        size === "lg" ? "h-12 w-12 text-lg" : "h-10 w-10 text-sm",
      )}
    >
      {name.slice(0, 1)}
    </span>
  );
}
