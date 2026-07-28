interface StampGridProps {
  earned: number;
  required: number;
}

export default function StampGrid({ earned, required }: StampGridProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {Array.from({ length: required }, (_, i) => {
        const filled = i < earned;
        return (
          <div
            key={i}
            aria-label={filled ? "Stamp earned" : "Stamp empty"}
            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors ${
              filled
                ? "border-brand-accent bg-brand-accent text-brand-on-primary"
                : "border-brand-accent/40 bg-brand-surface text-brand-accent/40"
            }`}
          >
            {filled ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <span className="text-sm font-medium">{i + 1}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
