import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { title: "Play", url: "#demo" },
  { title: "How", url: "#how" },
  { title: "Explore", url: "#ask" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-black/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex min-h-14 max-w-content items-center justify-between px-[5%] lg:min-h-16">
        <a
          href="#top"
          className="text-[0.9375rem] font-medium tracking-[-0.02em] text-mist transition-opacity duration-calm hover:opacity-80"
        >
          Music Agent
        </a>

        <nav className="hidden items-center gap-0.5 md:flex">
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              className="rounded-full px-3.5 py-2 text-[0.875rem] font-normal tracking-[-0.01em] text-mist-dim transition-colors duration-calm hover:text-mist"
            >
              {link.title}
            </a>
          ))}
          <Button
            size="sm"
            className="ml-3"
            onClick={() =>
              document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Play the demo
          </Button>
        </nav>

        <button
          type="button"
          className="flex size-10 flex-col items-center justify-center gap-1.5 rounded-full md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`h-px w-5 bg-mist transition duration-calm ${open ? "translate-y-[7px] rotate-45" : ""}`}
          />
          <span
            className={`h-px w-5 bg-mist transition duration-calm ${open ? "opacity-0" : ""}`}
          />
          <span
            className={`h-px w-5 bg-mist transition duration-calm ${open ? "-translate-y-[7px] -rotate-45" : ""}`}
          />
        </button>
      </div>

      {open && (
        <div className="animate-fade-up border-t border-white/[0.06] px-[5%] py-5 md:hidden">
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              className="block py-3 text-regular text-mist-dim transition-colors hover:text-mist"
              onClick={() => setOpen(false)}
            >
              {link.title}
            </a>
          ))}
          <Button
            className="mt-3 w-full"
            onClick={() => {
              setOpen(false);
              document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Play the demo
          </Button>
        </div>
      )}
    </header>
  );
}
