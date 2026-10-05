import { Bitcoin, Fingerprint, Bot, Music2 } from "lucide-react";
import { Layout381 } from "@/components/relume/Layout381";
import { asset } from "@/lib/utils";

/** Relume Layout381 uncommon bento — three breakthroughs → one agent */
export function ThreeToOne() {
  return (
    <Layout381
      tagline="Three → one"
      heading="Not three products. One agent on rails you already own."
      description="Block has bitcoin, Lightning, and wallets — and in September 2026 it brought Lightning to x402, the open standard for agent payments. TIDAL has artists and listeners. The TIDAL Music Agent is the glue that turns those pieces into artist-controlled catalog access."
      bigCard={{
        tagline: "Rail 01",
        image: {
          src: asset("art/rail-bitcoin.webp"),
          alt: "Lightning channels as perspective light rails racing to one settlement point",
        },
        icon: Bitcoin,
        heading: "Bitcoin & Lightning",
        description:
          "Tiny per-play bills that settle fast — the payment layer Block already ships across wallets and merchants.",
      }}
      smallCard={{
        tagline: "Rail 02",
        image: {
          src: asset("art/rail-nostr.webp"),
          alt: "Pubkey sigil with relays orbiting — artist-owned Nostr identity",
        },
        icon: Fingerprint,
        heading: "Nostr identity",
        description:
          "Artist-owned keys and signed catalog — high-agency identity without locking the recording inside one store.",
      }}
      featureSections={[
        {
          icon: Bot,
          heading: "Agent payments",
          description:
            "Machines that can discover a pay link, settle x402 over Lightning, and unlock access — the same path a music store uses.",
          image: {
            src: asset("art/rail-agent.webp"),
            alt: "Agent mesh with lit routes settling into one pay link",
          },
        },
        {
          icon: Music2,
          heading: "One agent",
          description:
            "Publish once, price the link, let stores and agents pay per play — on rails Block already owns.",
          image: {
            src: asset("art/rail-music.webp"),
            alt: "Silk-like waveform ribbon shifting from violet to green",
          },
        },
      ]}
      footerNote={
        <p className="max-w-2xl border-l-2 border-accent/40 pl-6 text-regular text-mist-dim">
          Today: <span className="text-mist">TIDAL Music Agent</span> — publish
          once, price the link, let stores and agents pay per play.
        </p>
      }
    />
  );
}
