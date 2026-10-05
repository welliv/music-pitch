import { Button } from "@/components/ui/button";
import { asset } from "@/lib/utils";

/** Relume Header23 shell — cinematic dark hero (terafab-style full-bleed art) */
export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden px-[5%] pb-24 pt-28 md:pb-32 md:pt-36 lg:pb-40 lg:pt-40"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <img
          src={asset("art/hero.webp")}
          alt=""
          className="size-full object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/70 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(41,151,255,0.14),transparent_55%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-narrow text-center animate-fade-up">
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
