import { Wallet, Link2, Fingerprint, Zap } from "lucide-react";
import { IconSurface } from "@/components/ui/icon-surface";
import type { IconAccent } from "@/components/ui/icon-surface";
import type { LucideIcon } from "lucide-react";

const X402_POST =
  "https://block.xyz/inside/block-joins-the-x402-foundation-to-advance-open-agentic-commerce";

const rails: {
  title: string;
  body: string;
  icon: LucideIcon;
  accent: IconAccent;
}[] = [
  {
    title: "Wallets people already use",
    body: "Cash App and Square put bitcoin and Lightning in everyday commerce — the settlement layer music micropayments need.",
    icon: Wallet,
    accent: "accent",
  },
  {
    title: "Agent-ready payments",
    body: "x402 puts payment into HTTP with the 402 status code. Stores and agents hit a pay link like an API, and Lightning settles it — fans never operate the chain.",
    icon: Link2,
    accent: "accent",
  },
  {
    title: "Nostr in the mission",
    body: "Artist-owned identity and signed catalog align with open protocols Block has already invested in.",
    icon: Fingerprint,
    accent: "nostr",
  },
  {
    title: "Square Lightning (honest facts)",
    body: "Sellers can settle in BTC or USD. 0% fees until Dec 31, 2026, then 1%. Not available in New York.",
    icon: Zap,
    accent: "lightning",
  },
];

export function WhyBlock() {
  return (
    <section className="section-pad border-t border-white/[0.06]">
      <div className="mx-auto max-w-content">
        <div className="mb-14 max-w-2xl md:mb-16">
          <p className="section-label">Why Block</p>
          <h2 className="display-title mb-5 text-[2rem] md:text-h2 lg:text-[3rem]">
            You already have the building blocks
          </h2>
          <p className="body-lg max-w-prose">
            The idea is not to invent a stack. It is to wire bitcoin, Lightning,
            wallets, and agent payments into one artist link TIDAL and other apps
            can pay — with TIDAL bringing distribution to society-scale listeners.
          </p>
        </div>

        <a
          href={X402_POST}
          target="_blank"
          rel="noreferrer"
          className="group mb-3 flex flex-col gap-0 overflow-hidden rounded-3xl border border-accent/25 bg-accent/[0.06] transition-colors duration-calm hover:border-accent/40 md:mb-4 md:flex-row md:items-stretch"
        >
          <div className="relative w-full shrink-0 overflow-hidden md:w-[38%]">
            <IconSurface
              icon={Zap}
              accent="lightning"
              aspect="video"
              className="md:aspect-auto md:h-full md:min-h-[14rem]"
            />
          </div>
          <div className="flex flex-1 flex-col justify-center p-6 md:p-7">
            <p className="text-tiny font-medium uppercase tracking-[0.12em] text-accent">
              September 24, 2026
            </p>
            <h3 className="mt-2 text-h6 text-mist">
              Block joined the x402 Foundation and contributed Bitcoin
              Lightning payments to x402.
            </h3>
            <p className="mt-2 text-small leading-relaxed text-mist-dim">
              x402 is an open standard for agentic payments over HTTP, hosted
              under the Linux Foundation. A 402 pay link per track is the kind
              of everyday, low-value agent payment Lightning on x402 is built
              for.
            </p>
            <span className="mt-4 text-small text-mist underline-offset-4 group-hover:underline">
              Read Block’s post ↗
            </span>
          </div>
        </a>

        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          {rails.map((r) => (
            <div key={r.title} className="surface-card overflow-hidden">
              <IconSurface icon={r.icon} accent={r.accent} aspect="video" />
              <div className="p-6 md:p-7">
                <h3 className="text-h6 text-mist">{r.title}</h3>
                <p className="mt-2.5 text-small leading-relaxed text-mist-dim">
                  {r.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          id="open-protocol-bar"
          className="mt-12 rounded-3xl border border-white/[0.08] bg-ink-soft p-7 md:mt-14 md:p-9"
        >
          <p className="text-tiny font-medium uppercase tracking-[0.12em] text-mist-dim">
            Open-protocol bar
          </p>
          <h3 className="mt-3 text-h5 text-mist md:text-h4">
            On an open protocol, incremental copies of web2 will not cut through
          </h3>
          <div className="mt-4 max-w-prose space-y-4 text-small leading-relaxed text-mist-dim">
            <p>
              Any client can be spun up tomorrow. A new product has to deliver
              roughly ten times more value: new, integrated, and fundamentally
              better in an artist’s or listener’s life — not a clone of an
              existing music app.
            </p>
            <p>
              That is the bar this concept aims for: a Music Agent on Block’s
              existing rails, where agents can license and settle, bitcoin and
              Lightning carry the micropayments, and Nostr holds artist-owned
              identity. TIDAL and other apps become clients of an
              artist-controlled pay link, not owners of a separate platform.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
