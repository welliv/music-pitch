import { Unlock } from "lucide-react";
import { IconSurface } from "@/components/ui/icon-surface";

export function Problem() {
  return (
    <section className="border-t border-white/[0.06] bg-ink-soft px-[5%] py-20 md:py-28">
      <div className="mx-auto max-w-narrow text-center">
        <p className="section-label">Problem</p>
        <h2 className="display-title text-[1.85rem] leading-[1.15] md:text-h3 lg:text-[2.5rem]">
          Catalogs stay locked inside platforms. Agents can&apos;t license a
          track. Fans should never have to operate Lightning.
        </h2>
        <p className="mx-auto mt-7 max-w-prose body-lg">
          Move access to an artist-controlled pay link. Apps and agents become
          clients of that link. Listeners stay in a normal music app.
        </p>
        <div className="relative mx-auto mt-12 max-w-3xl overflow-hidden rounded-3xl border border-white/[0.08] shadow-soft">
          <IconSurface
            icon={Unlock}
            accent="accent"
            aspect="wide"
            label="Unlock → artist pay link"
            className="min-h-[10rem] md:min-h-[12rem]"
          />
        </div>
        <p className="mx-auto mt-8 max-w-prose text-small text-ink-mute">
          This model applies where the artist (or rights holder) controls the
          recording — not a claim to rewrite every label deal overnight.
        </p>
        <p className="mx-auto mt-3 max-w-prose text-small text-ink-mute">
          Encryption sells authorized access, not unbreakable DRM — a paid play
          still can be recorded by the listener.
        </p>
      </div>
    </section>
  );
}
