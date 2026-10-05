import { Fingerprint, Zap, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const JACK_URL =
  "https://damus.io/note1pgt2e5n4qeadre4ggpp8laz78fljx8k9tq70j3qg3fwjxp3v9aqs94dz7n";

const pillars = [
  { icon: Fingerprint, label: "Identity", accent: "text-violet-400", ring: "ring-violet-400/25" },
  { icon: Zap, label: "Micropayments", accent: "text-emerald-400", ring: "ring-emerald-400/25" },
  { icon: Share2, label: "Connected apps", accent: "text-accent", ring: "ring-accent/20" },
] as const;

/** Inspiration: Jack's note themes only — strategy/leapfrog lives in Why Block. */
export function Inspiration() {
  return (
    <section
      id="inspiration"
      className="scroll-mt-20 border-t border-white/[0.06] bg-ink-soft px-[5%] py-20 md:py-28 lg:py-32"
    >
      <div className="mx-auto grid max-w-content gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-16">
        <div>
          <p className="section-label">Inspiration</p>
          <h2 className="display-title mb-8 text-[2rem] md:text-h2 lg:text-[3rem]">
            Themes from lists of three
          </h2>

          <div className="space-y-5 body-lg">
            <p>
              Jack Dorsey’s note on Nostr —{" "}
              <a
                href={JACK_URL}
                target="_blank"
                rel="noreferrer"
                className="text-accent underline-offset-4 transition-opacity duration-calm hover:underline hover:opacity-90"
              >
                Lists of three. March 20, 2025.
              </a>{" "}
              — names three use cases to solve real problems in: human and agent
              interaction and transaction, private and public micro-communities,
              and creator-friendly distribution. It pairs them with three
              differentiators to maximize: high-agency identity, built-in
              micropayments, and a highly connected app ecosystem.
            </p>
            <p>
              This concept takes two of those use cases literally — agent
              transaction and creator-friendly distribution — and builds on all
              three differentiators. The note is inspiration only, not an
              endorsement of this pitch.
            </p>
          </div>

          <p className="mt-8 text-small text-ink-mute">
            Proposed concept — not an official TIDAL or Block product. Strategy
            for open-protocol products is covered separately under Why Block.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3 md:mt-12">
            <Button
              onClick={() =>
                document
                  .getElementById("demo")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Play the demo
            </Button>
            <Button variant="secondary" asChild>
              <a href={JACK_URL} target="_blank" rel="noreferrer">
                Lists of three. March 20, 2025.
              </a>
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-ink shadow-soft lg:sticky lg:top-28">
          <div className="flex min-h-[22rem] flex-col items-center justify-center gap-6 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(41,151,255,0.1),transparent_70%)] px-6 py-10 md:min-h-[26rem]">
            <div className="flex w-full max-w-xs flex-col gap-3">
              {pillars.map(({ icon: Icon, label, accent, ring }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-ink-soft/90 px-4 py-3.5 shadow-soft"
                >
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-ink ring-1 ${ring}`}
                  >
                    <Icon className={`size-5 ${accent}`} strokeWidth={1.35} />
                  </span>
                  <span className="text-small font-medium tracking-[-0.01em] text-mist">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-tiny font-medium uppercase tracking-[0.14em] text-mist-dim">
              Identity · micropayments · connected apps
            </p>
          </div>
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]" />
        </div>
      </div>
    </section>
  );
}
