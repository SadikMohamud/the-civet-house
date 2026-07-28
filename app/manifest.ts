import type { MetadataRoute } from "next";
import { theme } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: theme.shopName,
    short_name: theme.shopName,
    description: `${theme.shopName} loyalty card. Collect stamps, earn rewards.`,
    start_url: "/",
    display: "standalone",
    background_color: theme.colours.background,
    theme_color: theme.colours.background,
    icons: [
      {
        src: theme.pwaIcon,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
