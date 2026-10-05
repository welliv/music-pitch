const X402_POST =
  "https://block.xyz/inside/block-joins-the-x402-foundation-to-advance-open-agentic-commerce";

const rails = [
  {
    title: "Wallets people already use",
    body: "Cash App and Square put bitcoin and Lightning in everyday commerce — the settlement layer music micropayments need.",
  },
  {
    title: "Agent-ready payments",
    body: "x402 puts payment into HTTP with the 402 status code. Stores and agents hit a pay link like an API, and Lightning settles it — fans never operate the chain.",
  },
  {
    title: "Nostr in the mission",
    body: "Artist-owned identity and signed catalog align with open protocols Block has already invested in.",
  },
  {
    title: "Square Lightning (honest facts)",
    body: "Sellers can settle in BTC or USD. 0% fees until Dec 31, 2026, then 1%. Not available in New York.",
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
          className="group mb-3 flex flex-col gap-4 rounded-3xl border border-accent/25 bg-accent/[0.06] p-6 transition-colors duration-calm hover:border-accent/40 md:mb-4 md:flex-row md:items-center md:justify-between md:p-7"
        >
          <div className="max-w-2xl">
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
          </div>
          <span className="shrink-0 text-small text-mist underline-offset-4 group-hover:underline">
            Read Block’s post ↗
          </span>
        </a>

        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          {rails.map((r) => (
            <div key={r.title} className="surface-card p-6 md:p-7">
              <h3 className="text-h6 text-mist">{r.title}</h3>
              <p className="mt-2.5 text-small leading-relaxed text-mist-dim">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
