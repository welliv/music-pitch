import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type IconAccent = "accent" | "lightning" | "nostr" | "mist";

const accentGlow: Record<IconAccent, string> = {
  accent: "from-accent/[0.18] via-accent/[0.04] to-transparent",
  lightning: "from-emerald-400/[0.2] via-emerald-400/[0.05] to-transparent",
  nostr: "from-violet-400/[0.2] via-violet-400/[0.05] to-transparent",
  mist: "from-white/[0.1] via-white/[0.03] to-transparent",
};

const accentIcon: Record<IconAccent, string> = {
  accent: "text-accent",
  lightning: "text-emerald-400",
  nostr: "text-violet-400",
  mist: "text-mist",
};

const accentRing: Record<IconAccent, string> = {
  accent: "ring-accent/20",
  lightning: "ring-emerald-400/25",
  nostr: "ring-violet-400/25",
  mist: "ring-white/10",
};

type Aspect = "video" | "wide" | "square" | "portrait" | "banner" | "auto";

const aspectClass: Record<Aspect, string> = {
  video: "aspect-[16/9]",
  wide: "aspect-[16/10]",
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  banner: "aspect-[24/7]",
  auto: "",
};

type Props = {
  icon: LucideIcon;
  accent?: IconAccent;
  aspect?: Aspect;
  /** Icon glyph size in Tailwind units (default scales with aspect). */
  iconClassName?: string;
  className?: string;
  label?: string;
  /** Smaller nested tile for dense cards */
  compact?: boolean;
};

/**
 * Sparse monoline icon panel — dark Apple-ish surface with a soft accent glow.
 * Replaces decorative section photography.
 */
export function IconSurface({
  icon: Icon,
  accent = "accent",
  aspect = "video",
  iconClassName,
  className,
  label,
  compact = false,
}: Props) {
  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden bg-ink",
        aspectClass[aspect],
        className,
      )}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_50%_42%,var(--tw-gradient-stops))]",
          accentGlow[accent],
        )}
      />
      <div
        className={cn(
          "relative flex items-center justify-center rounded-2xl border border-white/[0.08] bg-ink-soft/80 shadow-soft backdrop-blur-sm",
          compact ? "size-14 md:size-16" : "size-20 md:size-24",
          "ring-1",
          accentRing[accent],
        )}
      >
        <Icon
          className={cn(
            compact ? "size-6 md:size-7" : "size-8 md:size-10",
            accentIcon[accent],
            iconClassName,
          )}
          strokeWidth={1.35}
        />
      </div>
      {label ? (
        <p className="absolute bottom-4 left-4 right-4 text-center text-tiny font-medium uppercase tracking-[0.14em] text-mist-dim md:bottom-5">
          {label}
        </p>
      ) : null}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]" />
    </div>
  );
}

/** Compact icon-in-tile used in headings / lists (no full panel). */
export function IconTile({
  icon: Icon,
  accent = "mist",
  className,
}: {
  icon: LucideIcon;
  accent?: IconAccent;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-ink shadow-soft md:size-11",
        className,
      )}
    >
      <Icon
        className={cn("size-5", accentIcon[accent])}
        strokeWidth={1.4}
      />
    </span>
  );
}
