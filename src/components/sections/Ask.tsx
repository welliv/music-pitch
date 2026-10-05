import { Cta67 } from "@/components/relume/Cta67";
import { asset } from "@/lib/utils";

const ABSTRACTS = [
  "art/marquee-1.webp",
  "art/marquee-2.webp",
  "art/marquee-3.webp",
  "art/marquee-4.webp",
  "art/marquee-5.webp",
  "art/marquee-6.webp",
];

/** Relume Cta67 marquee CTA — proof-first CTAs, no personal GitHub seek. */
export function Ask() {
  return (
    <Cta67
      id="ask"
      tagline="Explore"
      heading="Explore the path on rails you already own"
      description={
        <>
          A concept to inspect — not a partnership claim or a request to fund a
          separate platform. The demo and commerce skill show how a Music Agent
          could wire agent transactions, Lightning micropayments, and creator-friendly distribution
          into one artist link TIDAL and other apps can pay.
        </>
      }
      disclaimer="Proposed concept — not an official TIDAL or Block product."
      primary={{
        title: "Commerce skill",
        href: "https://github.com/welliv/nostr-commerce-skill",
      }}
      secondary={{
        title: "Play the demo",
        href: "#demo",
        variant: "secondary",
      }}
      images={Array.from({ length: 24 }, (_, i) => ({
        src: asset(ABSTRACTS[i % ABSTRACTS.length]),
        alt: "",
      }))}
    />
  );
}
