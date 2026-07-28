interface StampGridProps {
  earned: number;
  required: number;
  // When true, the most recently earned stamp pops in. Used at the till
  // right after a stamp lands.
  animateLast?: boolean;
  // "light" for dark/premium surfaces, "dark" for light surfaces.
  tone?: "light" | "dark";
}

function CupIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9h11v5a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" fill="currentColor" stroke="none" />
      <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M9 3.5c-.5.8-.5 1.7 0 2.5M12.5 3.5c-.5.8-.5 1.7 0 2.5" />
    </svg>
  );
}

export default function StampGrid({
  earned,
  required,
  animateLast = false,
  tone = "dark",
}: StampGridProps) {
  const emptyBorder =
    tone === "light" ? "border-white/25" : "border-brand-accent/30";
  const emptyText = tone === "light" ? "text-white/45" : "text-brand-accent/50";
  const emptyBg = tone === "light" ? "bg-white/5" : "bg-brand-surface/60";

  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {Array.from({ length: required }, (_, i) => {
        const filled = i < earned;
        const isLast = filled && i === earned - 1;
        return (
          <div
            key={i}
            aria-label={filled ? "Stamp earned" : "Stamp not yet earned"}
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 ${
              filled
                ? `border-transparent bg-brand-accent text-brand shadow-[0_2px_8px_rgba(0,0,0,0.18)] ${
                    isLast && animateLast ? "animate-stamp-pop" : ""
                  }`
                : `${emptyBorder} ${emptyBg} ${emptyText}`
            }`}
          >
            {filled ? (
              <CupIcon />
            ) : (
              <span className="text-sm font-medium">{i + 1}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
