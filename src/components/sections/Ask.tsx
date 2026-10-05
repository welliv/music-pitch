import { Zap, Fingerprint, Bot, Music2, Link2, Wallet } from "lucide-react";
import { Cta67 } from "@/components/relume/Cta67";

/** Sparse Explore CTA — thematic lucide marks instead of image marquee. */
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
      icons={[
        { icon: Zap, accent: "lightning", label: "Lightning" },
        { icon: Fingerprint, accent: "nostr", label: "Nostr" },
        { icon: Link2, accent: "accent", label: "x402" },
        { icon: Bot, accent: "accent", label: "Agents" },
        { icon: Wallet, accent: "mist", label: "Wallets" },
        { icon: Music2, accent: "mist", label: "Music" },
      ]}
    />
  );
}
