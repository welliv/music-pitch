import { Button } from "@/components/ui/button";
import { asset } from "@/lib/utils";

/** Full-viewport cinematic hero — sparse copy over a single still (terafab pattern). */
export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate flex min-h-[88vh] items-center overflow-hidden px-[5%] pb-28 pt-32 md:min-h-[92vh] md:pb-36 md:pt-40 lg:pb-44"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <img
          src={asset("art/hero.webp")}
          alt=""
          className="size-full object-cover object-[center_35%] opacity-95"
        />
        {/* Dissolve into black — terafab / cinematic-media pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/55 to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-black/70 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-black/70 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_20%,rgba(41,151,255,0.10),transparent_55%)]" />
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
