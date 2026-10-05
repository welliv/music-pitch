const JACK_URL =
  "https://damus.io/note1pgt2e5n4qeadre4ggpp8laz78fljx8k9tq70j3qg3fwjxp3v9aqs94dz7n";

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-[5%] py-12 md:py-14">
      <div className="mx-auto flex max-w-content flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-small font-medium tracking-[-0.015em] text-mist">
            Music Agent
          </p>
          <p className="mt-2.5 max-w-md text-tiny leading-relaxed text-ink-mute">
            Pitch site — static demo for GitHub Pages. Implementation backbone:{" "}
            <a
              className="text-mist-dim underline-offset-4 transition-colors hover:text-mist hover:underline"
              href="https://github.com/welliv/nostr-commerce-skill"
              target="_blank"
              rel="noreferrer"
            >
              nostr-commerce-skill
            </a>
            . Inspiration:{" "}
            <a
              className="text-mist-dim underline-offset-4 transition-colors hover:text-mist hover:underline"
              href={JACK_URL}
              target="_blank"
              rel="noreferrer"
            >
              Lists of three. March 20, 2025.
            </a>
          </p>
        </div>
        <div className="text-tiny text-ink-mute md:text-right">
          <p>© {YEAR} · Pitch draft</p>
        </div>
      </div>
    </footer>
  );
}
