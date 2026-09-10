import Image from "next/image";
import { cn } from "@/lib/utils";

const MARKS = {
  dark: { src: "/ieducare-logo-navy.svg", width: 86, height: 102 },
  light: { src: "/ieducare-logo-white.svg", width: 67, height: 81 },
} as const;

const SIZES = {
  sm: { markHeight: 28, text: "text-lg" },
  md: { markHeight: 36, text: "text-xl" },
  lg: { markHeight: 44, text: "text-2xl" },
} as const;

interface LogoProps {
  /** `dark` renders the navy mark for light surfaces; `light` renders the white mark for dark/brand surfaces. */
  variant?: "dark" | "light";
  size?: keyof typeof SIZES;
  showWordmark?: boolean;
  /** Only the single above-the-fold logo instance on a page (if any) should set this. */
  priority?: boolean;
  className?: string;
}

export function Logo({
  variant = "dark",
  size = "md",
  showWordmark = true,
  priority = false,
  className,
}: LogoProps) {
  const mark = MARKS[variant];
  const { markHeight, text } = SIZES[size];
  const markWidth = Math.round((mark.width / mark.height) * markHeight);

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className="relative block shrink-0"
        style={{ width: markWidth, height: markHeight }}
      >
        <Image
          src={mark.src}
          alt="TEduCare"
          fill
          sizes={`${markWidth}px`}
          priority={priority}
          className="object-contain"
        />
      </span>
      {showWordmark && (
        <span
          className={cn(
            "font-semibold tracking-tight",
            text,
            variant === "light" ? "text-white" : "text-primary",
          )}
        >
          TEduCare
        </span>
      )}
    </div>
  );
}
