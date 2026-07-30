// ================================================================
// THE CIVET HOUSE BRAND THEME
//
// Single source of truth for branding. Every colour, name and logo
// reference in the app reads from this file.
//
// PLACEHOLDER VALUES: swap the colours below for the real brand
// palette and replace the files in public/icons/ with real assets.
// ================================================================

export const theme = {
  shopName: "The Civet House",
  tagline: "Coffee worth coming back for",

  colours: {
    // PLACEHOLDER: dark roast brown
    primary: "#3E2C23",
    // PLACEHOLDER: caramel
    accent: "#C89B6B",
    // PLACEHOLDER: warm cream page background
    background: "#FAF6F1",
    // PLACEHOLDER: card surfaces
    surface: "#FFFFFF",
    // PLACEHOLDER: secondary text
    muted: "#8A7A6E",
    // PLACEHOLDER: success states (reward unlocked)
    success: "#3E7C4F",
    // PLACEHOLDER: text on primary backgrounds
    onPrimary: "#FAF6F1",
  },

  logo: {
    // Real brand logo, transparent background. Intrinsic size is used by
    // next/image; render it with a Tailwind class like "h-10 w-auto".
    src: "/logo.png",
    alt: "The Civet House",
    width: 1536,
    height: 659,
  },

  // Square app icons used by the PWA manifest, generated from the logo.
  pwaIcon: "/icons/icon-512.png",
} as const;
