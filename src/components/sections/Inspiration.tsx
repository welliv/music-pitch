import { Button } from "@/components/ui/button";

const JACK_URL =
  "https://damus.io/note1pgt2e5n4qeadre4ggpp8laz78fljx8k9tq70j3qg3fwjxp3v9aqs94dz7n";

/** Inspiration section: long-form copy (Relume Content 7 pattern) + CTAs. */
export function Inspiration() {
  return (
    <section
      id="inspiration"
      className="scroll-mt-20 border-t border-white/[0.06] bg-ink-soft px-[5%] py-20 md:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-narrow">
        <p className="section-label">Inspiration</p>
        <h2 className="display-title mb-8 text-[2rem] md:text-h2 lg:text-[3rem]">
          A Music Agent worth switching for
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
            This concept takes two of those use cases literally, agent
            transaction and creator-friendly distribution, and builds on all
            three differentiators. The note is inspiration only, not an
            endorsement of this pitch.
          </p>
        </div>

        <div className="mt-12 border-t border-white/[0.08] pt-10 md:mt-14 md:pt-12">
          <p className="mb-4 text-small font-medium tracking-[-0.01em] text-mist">
            The bar for an open protocol
          </p>
          <div className="space-y-5 body-lg">
            <p>
              On an open protocol, any client can be spun up tomorrow.
              Incremental copies of web2 music products will not cut through
              existing network effects. A new product has to deliver roughly
              ten times more value: new, integrated, and fundamentally better in
              an artist’s or listener’s life.
            </p>
            <p>
              That is the bar this concept aims for. A Music Agent on Block’s
              existing rails, where agents can license and settle, bitcoin and
              Lightning carry the micropayments, and Nostr holds artist-owned
              identity. TIDAL and other apps become clients of an
              artist-controlled pay link, not owners of a separate platform.
            </p>
          </div>
        </div>

        <p className="mt-8 text-small text-ink-mute">
          Proposed concept — not an official TIDAL or Block product.
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
    </section>
  );
}
