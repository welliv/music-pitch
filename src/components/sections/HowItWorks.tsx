import { KeyRound, Library, Link2, Store, Play } from "lucide-react";
import { Layout506 } from "@/components/relume/Layout506";
import { asset } from "@/lib/utils";

const steps = [
  {
    value: "step-01",
    trigger: "01 · Open the agent",
    meta: "01",
    icon: KeyRound,
    title: "Artist opens the agent",
    body: "TIDAL Music Agent creates or manages Nostr keys — identity the artist controls.",
    image: {
      src: asset("art/how-01-keys.webp"),
      alt: "Radial key sigil drawn from a hash — artist-owned Nostr identity",
    },
  },
  {
    value: "step-02",
    trigger: "02 · Publish catalog",
    meta: "02",
    icon: Library,
    title: "Publish encrypted catalog",
    body: "Tracks land on a TIDAL Nostr music marketplace, encrypted to the artist’s key.",
    image: {
      src: asset("art/how-02-catalog.webp"),
      alt: "Isometric field of encrypted catalog tiles, a few published",
    },
  },
  {
    value: "step-03",
    trigger: "03 · Price the link",
    meta: "03",
    icon: Link2,
    title: "Price a 402 pay link",
    body: "The catalog sits behind an x402 / L402 paywall at a price the artist sets — here, 21 sats.",
    image: {
      src: asset("art/how-03-paylink.webp"),
      alt: "Two interlocked links joined by a lightning spark — the 402 pay link",
    },
  },
  {
    value: "step-04",
    trigger: "04 · Stores & agents pay",
    meta: "04",
    icon: Store,
    title: "Stores and agents pay",
    body: "TIDAL, another app, or an autonomous agent pays the link for each play or short lease.",
    image: {
      src: asset("art/how-04-stores.webp"),
      alt: "Many payment streams converging into one settlement node",
    },
  },
  {
    value: "step-05",
    trigger: "05 · Fan hits play",
    meta: "05",
    icon: Play,
    title: "Fan just hits play",
    body: "No wallet UI, no keys, no file chore — authorized access settles behind the glass.",
    image: {
      src: asset("art/how-05-play.webp"),
      alt: "Play glyph of light with a waveform and ripples",
    },
  },
];

/** Relume Layout506 uncommon vertical tabs — five how-it-works steps */
export function HowItWorks() {
  return (
    <Layout506
      id="how"
      tagline="How it works"
      heading="Agent → keys → catalog → pay link → play"
      defaultTabValue="step-01"
      tabs={steps.map((step) => ({
        value: step.value,
        trigger: step.trigger,
        content: {
          meta: step.meta,
          icon: step.icon,
          heading: step.title,
          description: step.body,
          image: step.image,
        },
      }))}
    />
  );
}
