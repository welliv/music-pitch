import { Zap, Fingerprint, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Typography-first hero — sparse lucide marks instead of full-bleed art. */
export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate flex min-h-[88vh] items-center overflow-hidden px-[5%] pb-28 pt-32 md:min-h-[92vh] md:pb-36 md:pt-40 lg:pb-44"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_40%_at_50%_30%,rgba(41,151,255,0.08),transparent_70%)]"
      />

      <div className="relative mx-auto w-full max-w-narrow text-center animate-fade-up">
        <div className="mb-8 flex items-center justify-center gap-2.5 md:mb-10">
          {[
            { Icon: Zap, accent: "text-emerald-400", ring: "ring-emerald-400/25" },
            { Icon: Fingerprint, accent: "text-violet-400", ring: "ring-violet-400/25" },
            { Icon: Music2, accent: "text-accent", ring: "ring-accent/20" },
          ].map(({ Icon, accent, ring }, i) => (
            <span
              key={i}
              className={`flex size-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-ink-soft shadow-soft ring-1 ${ring} md:size-12`}
            >
              <Icon className={`size-5 ${accent}`} strokeWidth={1.35} />
            </span>
          ))}
        </div>
        <p className="section-label mb-5">A pitch concept for Block + TIDAL</p>
        <h1 className="display-title mb-7 text-[2.75rem] leading-[1.05] sm:text-[3.5rem] md:text-[4rem] lg:text-[4.25rem]">
          TIDAL Music Agent on Block’s existing rails
        </h1>
        <p className="mx-auto max-w-prose body-lg">
          An artist uses a TIDAL Music Agent to get a Nostr identity, publish
          music encrypted to their key, and put the catalog behind a 402 pay
          link. TIDAL, other apps, and agents pay that link — fans never see a
          wallet or a key.
        </p>
        <p className="mx-auto mt-5 max-w-prose text-small text-ink-mute">
          Proposed concept — not an official TIDAL or Block product.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 md:mt-12">
          <Button
            onClick={() =>
              document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Play the demo
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            How it works
          </Button>
        </div>
      </div>
    </section>
  );
}
