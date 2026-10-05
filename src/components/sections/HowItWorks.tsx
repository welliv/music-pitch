import { KeyRound, Library, Link2, Store, Play } from "lucide-react";
import { Layout506 } from "@/components/relume/Layout506";
import type { IconAccent } from "@/components/ui/icon-surface";

const steps: {
  value: string;
  trigger: string;
  meta: string;
  icon: typeof KeyRound;
  accent: IconAccent;
  title: string;
  body: string;
}[] = [
  {
    value: "step-01",
    trigger: "01 · Open the agent",
    meta: "01",
    icon: KeyRound,
    accent: "nostr",
    title: "Artist opens the agent",
    body: "TIDAL Music Agent creates or manages Nostr keys — identity the artist controls.",
  },
  {
    value: "step-02",
    trigger: "02 · Publish catalog",
    meta: "02",
    icon: Library,
    accent: "accent",
    title: "Publish encrypted catalog",
    body: "Tracks land on a TIDAL Nostr music marketplace, encrypted to the artist’s key.",
  },
  {
    value: "step-03",
    trigger: "03 · Price the link",
    meta: "03",
    icon: Link2,
    accent: "lightning",
    title: "Price a 402 pay link",
    body: "The catalog sits behind an x402 / L402 paywall at a price the artist sets — here, 21 sats.",
  },
  {
    value: "step-04",
    trigger: "04 · Stores & agents pay",
    meta: "04",
    icon: Store,
    accent: "accent",
    title: "Stores and agents pay",
    body: "TIDAL, another app, or an autonomous agent pays the link for each play or short lease.",
  },
  {
    value: "step-05",
    trigger: "05 · Fan hits play",
    meta: "05",
    icon: Play,
    accent: "lightning",
    title: "Fan just hits play",
    body: "No wallet UI, no keys, no file chore — authorized access settles behind the glass.",
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
          accent: step.accent,
          heading: step.title,
          description: step.body,
        },
      }))}
    />
  );
}
