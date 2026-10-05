import * as React from "react";
/**
 * Relume CTA 67 (slug: section_cta67) — dark Apple-token adaptation.
 * Dual marquee of abstract media + CTAs. No partner logos.
 * Marquee is clipped (no document horizontal scroll); CTAs stack above images.
 */
import { Button } from "@/components/ui/button";
import { asset, cn } from "@/lib/utils";

type ImageProps = {
  src: string;
  alt?: string;
};

type LinkButton = {
  title: string;
  href: string;
  variant?: "default" | "secondary";
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
  images: ImageProps[];
  className?: string;
};

export type Cta67Props = React.ComponentPropsWithoutRef<"section"> & Partial<Props>;

function ImageItem({ image }: { image: ImageProps }) {
  return (
    <div className="relative w-[70vw] pt-[68%] sm:w-[20rem] md:w-[28rem] lg:w-[32rem]">
      <img
        className="absolute inset-0 size-full rounded-image object-cover opacity-90"
        src={image.src}
        alt={image.alt ?? ""}
      />
      <div className="pointer-events-none absolute inset-0 rounded-image ring-1 ring-inset ring-white/[0.06]" />
    </div>
  );
}

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
    images,
    className,
    id,
    ...rest
  } = {
    ...Cta67Defaults,
    ...props,
  };

  const rowA = images.slice(0, 6);
  const rowADup = images.slice(6, 12);
  const rowB = images.slice(12, 18);
  const rowBDup = images.slice(18, 24);

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

      {/* CTAs stack clearly above the marquee — no sticky overlay on image cards */}
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
            <Button variant="secondary" asChild className="min-h-12 px-8 text-[1rem]">
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

      {/* Marquee: full-bleed visually, clipped so it never creates page x-scroll */}
      <div className="overflow-hidden pb-20 pt-2 md:pb-28 md:pt-4 lg:pb-32">
        <div className="flex w-full justify-start">
          <div className="mb-0 grid shrink-0 grid-cols-1 gap-y-4">
            <div className="grid w-max max-w-none animate-marquee-top auto-cols-fr grid-cols-2 gap-4 self-center">
              <div className="grid w-max grid-flow-col gap-4">
                {rowA.map((image, index) => (
                  <ImageItem key={`a-${index}`} image={image} />
                ))}
              </div>
              <div className="grid w-max grid-flow-col gap-4">
                {rowADup.map((image, index) => (
                  <ImageItem key={`ad-${index}`} image={image} />
                ))}
              </div>
            </div>
            <div className="grid w-max max-w-none animate-marquee-bottom grid-cols-2 gap-4 self-center">
              <div className="grid w-max grid-flow-col gap-4">
                {rowB.map((image, index) => (
                  <ImageItem key={`b-${index}`} image={image} />
                ))}
              </div>
              <div className="grid w-max grid-flow-col gap-4">
                {rowBDup.map((image, index) => (
                  <ImageItem key={`bd-${index}`} image={image} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const ABSTRACTS = [
  "art/marquee-1.webp",
  "art/marquee-2.webp",
  "art/marquee-3.webp",
  "art/marquee-4.webp",
  "art/marquee-5.webp",
  "art/marquee-6.webp",
];

export const Cta67Defaults: Props = {
  heading: "Medium length heading goes here",
  description: "Description",
  primary: { title: "Commerce skill", href: "https://github.com/welliv/nostr-commerce-skill" },
  images: Array.from({ length: 24 }, (_, i) => ({
    src: asset(ABSTRACTS[i % ABSTRACTS.length]),
    alt: "",
  })),
};
