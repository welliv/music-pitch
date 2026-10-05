import { Cta67 } from "@/components/relume/Cta67";
import { asset } from "@/lib/utils";

/** Four cinematic stills only — sparse Ask, not wallpaper density. */
const STILLS = [
  "art/marquee-1.webp",
  "art/marquee-2.webp",
  "art/marquee-3.webp",
  "art/marquee-4.webp",
];

/** Relume Cta67 — proof-first CTAs over a short premium still strip. */
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
      images={Array.from({ length: 16 }, (_, i) => ({
        src: asset(STILLS[i % STILLS.length]),
        alt: "",
      }))}
    />
  );
}
