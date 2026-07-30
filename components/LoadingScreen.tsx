"use client";

import { useEffect, useRef, useState } from "react";
import { theme } from "@/lib/theme";

// Branded splash: the logo resolves from a turbulent, displaced blur into
// focus (the Awwwards SVG-filter technique: feTurbulence + feGaussianBlur +
// feDisplacementMap), then the overlay fades away. Plays on each fresh load.
export default function LoadingScreen() {
  const [hidden, setHidden] = useState(false);
  const [fading, setFading] = useState(false);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);

  useEffect(() => {
    const START_BLUR = 26;
    const START_SCALE = 90;
    const DURATION = 1500;
    const easeOut = (p: number) => 1 - Math.pow(2, -10 * p);
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min((now - start) / DURATION, 1);
      const e = easeOut(p);
      blurRef.current?.setAttribute("stdDeviation", String(START_BLUR * (1 - e)));
      dispRef.current?.setAttribute("scale", String(START_SCALE * (1 - e)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setFading(true);
        setTimeout(() => setHidden(true), 500);
      }
    };
    raf = requestAnimationFrame(tick);

    // Safety net: never trap the user behind the splash.
    const failsafe = setTimeout(() => {
      setFading(true);
      setTimeout(() => setHidden(true), 500);
    }, 4000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(failsafe);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[60] flex items-center justify-center transition-opacity duration-500"
      style={{
        background: theme.colours.background,
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <svg
        viewBox="0 0 1536 659"
        className="w-64 max-w-[70%]"
        role="img"
        aria-label={theme.shopName}
      >
        <defs>
          <filter id="civet-load" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.018"
              numOctaves={2}
              result="noise"
            />
            <feGaussianBlur
              ref={blurRef}
              in="SourceGraphic"
              stdDeviation="26"
              result="blur"
            />
            <feDisplacementMap
              ref={dispRef}
              in="blur"
              in2="noise"
              scale="90"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        <image
          href="/logo.png"
          width="1536"
          height="659"
          filter="url(#civet-load)"
        />
      </svg>
    </div>
  );
}
