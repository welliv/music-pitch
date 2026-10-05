import * as React from "react";
/**
 * Relume Layout 381 (slug: section_layout381) — dark Apple-token adaptation.
 * Asymmetric bento: featured big card + small card + feature cards.
 * Decorative slots use lucide IconSurface panels (no photography).
 */
import type { LucideIcon } from "lucide-react";
import { Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { IconSurface, type IconAccent } from "@/components/ui/icon-surface";
import { cn } from "@/lib/utils";

type FeatureSection = {
  heading: string;
  description: string;
  icon: LucideIcon;
  accent?: IconAccent;
};

type BaseCard = {
  tagline: string;
  heading: string;
  description: string;
  icon: LucideIcon;
  accent?: IconAccent;
};

type Props = {
  tagline: string;
  heading: string;
  description: string;
  bigCard: BaseCard;
  smallCard: BaseCard;
  featureSections: FeatureSection[];
  footerNote?: React.ReactNode;
  className?: string;
};

export type Layout381Props = React.ComponentPropsWithoutRef<"section"> &
  Partial<Props>;

export function Layout381(props: Layout381Props) {
  const {
    tagline,
    heading,
    description,
    smallCard,
    bigCard,
    featureSections = [],
    footerNote,
    className,
    ...rest
  } = {
    ...Layout381Defaults,
    ...props,
  };

  return (
    <section
      className={cn("section-pad border-t border-white/[0.06]", className)}
      {...rest}
    >
      <div className="mx-auto max-w-content">
        <div className="mb-12 max-w-2xl md:mb-18 lg:mb-20">
          <p className="section-label">{tagline}</p>
          <h2 className="display-title mb-6 text-[2rem] md:text-h2 lg:text-[3rem]">
            {heading}
          </h2>
          <p className="body-lg max-w-prose">{description}</p>
        </div>

        <div className="grid auto-cols-fr grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2">
          <div className="grid auto-cols-fr grid-cols-1 gap-6 md:gap-8">
            <BigCard {...bigCard} />
            <SmallCard {...smallCard} />
          </div>
          <div className="grid auto-cols-fr grid-cols-1 gap-6 md:gap-8">
            {featureSections.map((feature) => (
              <FeatureSectionCard key={feature.heading} {...feature} />
            ))}
          </div>
        </div>

        {footerNote ? <div className="mt-16 md:mt-20">{footerNote}</div> : null}
      </div>
    </section>
  );
}

function BigCard(card: BaseCard) {
  const Icon = card.icon;
  const accent = card.accent ?? "lightning";
  return (
    <Card className="flex flex-col overflow-hidden">
      <IconSurface icon={Icon} accent={accent} aspect="video" />
      <div className="flex flex-1 flex-col justify-center p-6 md:p-8 lg:p-10">
        <p className="mb-2 text-micro font-medium uppercase tracking-[0.14em] text-ink-mute">
          {card.tagline}
        </p>
        <div className="mb-3 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl border border-white/[0.08] bg-ink shadow-soft">
            <Icon className="size-5 text-mist" strokeWidth={1.4} />
          </span>
          <h3 className="display-title text-h4 text-mist md:text-h3">
            {card.heading}
          </h3>
        </div>
        <p className="body-md text-[1.025rem] leading-relaxed">
          {card.description}
        </p>
      </div>
    </Card>
  );
}

function SmallCard(card: BaseCard) {
  const Icon = card.icon;
  const accent = card.accent ?? "nostr";
  return (
    <Card className="flex flex-col overflow-hidden sm:grid sm:auto-cols-fr sm:grid-cols-2">
      <IconSurface
        icon={Icon}
        accent={accent}
        aspect="auto"
        compact
        className="aspect-[4/3] sm:aspect-auto sm:min-h-[11rem]"
      />
      <div className="flex flex-col justify-center p-6 md:p-7">
        <p className="mb-2 text-micro font-medium uppercase tracking-[0.14em] text-ink-mute">
          {card.tagline}
        </p>
        <div className="mb-2 flex items-center gap-2.5">
          <Icon className="size-4 text-mist" strokeWidth={1.4} />
          <h3 className="text-h5 text-mist">{card.heading}</h3>
        </div>
        <p className="body-md text-[1.025rem] leading-relaxed">
          {card.description}
        </p>
      </div>
    </Card>
  );
}

function FeatureSectionCard(feature: FeatureSection) {
  const Icon = feature.icon;
  const accent = feature.accent ?? "accent";
  return (
    <Card className="flex flex-col overflow-hidden">
      <IconSurface icon={Icon} accent={accent} aspect="wide" />
      <div className="flex flex-1 flex-col justify-center p-6 md:p-8 lg:p-8">
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-ink shadow-soft">
          <Icon className="size-5 text-mist" strokeWidth={1.4} />
        </div>
        <h3 className="mb-3 text-h5 text-mist">{feature.heading}</h3>
        <p className="body-md text-[1.025rem] leading-relaxed">
          {feature.description}
        </p>
      </div>
    </Card>
  );
}

export const Layout381Defaults: Props = {
  tagline: "Tagline",
  heading: "Short heading goes here",
  description: "Description",
  smallCard: {
    tagline: "Tagline",
    heading: "Heading",
    description: "Description",
    icon: Zap,
  },
  bigCard: {
    tagline: "Tagline",
    heading: "Heading",
    description: "Description",
    icon: Zap,
  },
  featureSections: [],
};
