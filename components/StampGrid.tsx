interface StampGridProps {
  earned: number;
  required: number;
  // When true, the most recently earned stamp pops in. Used at the till
  // right after a stamp lands.
  animateLast?: boolean;
  // "light" for dark/premium surfaces, "dark" for light surfaces.
  tone?: "light" | "dark";
}

// The civet mark (cropped from the logo) rendered as a mask so it can be
// tinted any brand colour.
function civetMask(color: string, size = "78%"): React.CSSProperties {
  return {
    WebkitMaskImage: "url(/civet.png)",
    maskImage: "url(/civet.png)",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: `${size} auto`,
    maskSize: `${size} auto`,
    backgroundColor: color,
  };
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
            className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border transition-colors duration-300 ${
              filled
                ? `border-transparent bg-brand-accent shadow-[0_2px_8px_rgba(0,0,0,0.18)] ${
                    isLast && animateLast ? "animate-stamp-pop" : ""
                  }`
                : `${emptyBorder} ${emptyBg} ${emptyText}`
            }`}
          >
            {filled ? (
              <span
                aria-hidden="true"
                className="h-full w-full"
                style={civetMask("var(--brand-primary)")}
              />
            ) : (
              <span className="text-sm font-medium">{i + 1}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
