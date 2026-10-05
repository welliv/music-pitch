import * as React from "react";
/**
 * Relume CTA 67 (slug: section_cta67) — dark Apple-token adaptation.
 * Sparse icon row instead of heavy image marquee. No partner logos.
 */
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type IconAccent } from "@/components/ui/icon-surface";
import { cn } from "@/lib/utils";

type LinkButton = {
  title: string;
  href: string;
  variant?: "default" | "secondary";
};

type IconMark = {
  icon: LucideIcon;
  accent?: IconAccent;
  label: string;
};

type Props = {
  tagline?: string;
  heading: string;
  description: React.ReactNode;
  disclaimer?: React.ReactNode;
  inspiration?: React.ReactNode;
  primary: LinkButton;
  secondary?: LinkButton;
  footnote?: string;
  icons?: IconMark[];
  className?: string;
};

export type Cta67Props = React.ComponentPropsWithoutRef<"section"> &
  Partial<Props>;

const accentIcon: Record<IconAccent, string> = {
  accent: "text-accent",
  lightning: "text-emerald-400",
  nostr: "text-violet-400",
  mist: "text-mist",
};

export function Cta67(props: Cta67Props) {
  const {
    tagline,
    heading,
    description,
    disclaimer,
    inspiration,
    primary,
    secondary,
    footnote,
    icons = [],
    className,
    id,
    ...rest
  } = {
    ...Cta67Defaults,
    ...props,
  };

  return (
    <section
      id={id}
      className={cn(
        "relative overflow-x-hidden scroll-mt-20 border-t border-white/[0.06] bg-ink-soft",
        className,
      )}
      {...rest}
    >
      <div className="flex items-end justify-center px-[5%] pb-4 pt-20 md:pb-6 md:pt-28 lg:pt-32">
        <div className="mx-auto max-w-narrow text-center">
          {tagline ? <p className="section-label">{tagline}</p> : null}
          <h2 className="display-title mb-6 text-[2rem] md:text-h2 lg:text-[3rem]">
            {heading}
          </h2>
          <div className="body-lg">{description}</div>
          {disclaimer ? (
            <p className="mt-5 text-small text-ink-mute">{disclaimer}</p>
          ) : null}
          {inspiration ? (
            <p className="mt-4 text-small text-mist-dim">{inspiration}</p>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-3 px-[5%] pb-10 pt-6 md:pb-12 md:pt-8">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="min-h-12 px-8 text-[1rem]">
            <a
              href={primary.href}
              {...(primary.href.startsWith("http")
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
            >
              {primary.title}
            </a>
          </Button>
          {secondary ? (
            <Button
              variant="secondary"
              asChild
              className="min-h-12 px-8 text-[1rem]"
            >
              <a
                href={secondary.href}
                {...(secondary.href.startsWith("http")
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              >
                {secondary.title}
              </a>
            </Button>
          ) : null}
        </div>
        {footnote ? (
          <p className="text-tiny text-ink-mute">{footnote}</p>
        ) : null}
      </div>

      {icons.length > 0 ? (
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-center gap-3 px-[5%] pb-20 md:gap-4 md:pb-28 lg:pb-32">
          {icons.map((mark) => {
            const Icon = mark.icon;
            const accent = mark.accent ?? "mist";
            return (
              <div
                key={mark.label}
                className="flex min-w-[6.5rem] flex-col items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-ink/60 px-4 py-4 shadow-soft md:min-w-[7.5rem] md:px-5 md:py-5"
              >
                <span className="flex size-11 items-center justify-center rounded-xl border border-white/[0.08] bg-ink-soft">
                  <Icon
                    className={cn("size-5", accentIcon[accent])}
                    strokeWidth={1.4}
                  />
                </span>
                <span className="text-center text-micro font-medium uppercase tracking-[0.12em] text-mist-dim">
                  {mark.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="pb-16 md:pb-20" />
      )}
    </section>
  );
}

export const Cta67Defaults: Props = {
  heading: "Medium length heading goes here",
  description: "Description",
  primary: {
    title: "Commerce skill",
    href: "https://github.com/welliv/nostr-commerce-skill",
  },
  icons: [],
};
