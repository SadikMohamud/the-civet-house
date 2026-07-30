import Image from "next/image";
import { theme } from "@/lib/theme";

// The brand logo. Size it with a className such as "h-10 w-auto"; the
// intrinsic dimensions come from the theme so the aspect ratio is kept.
export default function Logo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={theme.logo.src}
      alt={theme.logo.alt}
      width={theme.logo.width}
      height={theme.logo.height}
      className={className}
      priority={priority}
    />
  );
}
