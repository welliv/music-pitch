"""Render every section image for the pitch site.

    python3 scripts/art/build.py            # all
    python3 scripts/art/build.py hero rail-nostr

All art is procedural and original (see IMAGE-LICENSES.md).
"""
import os
import sys
from multiprocessing import Pool
from PIL import Image, ImageDraw
import pieces as P
from engine import GREEN, BLUE, VIOLET, MAGENTA, CYAN, font

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ART = os.path.join(ROOT, "public", "art")

JOBS = {
    # name: (factory, exposure)
    "hero": (lambda: P.hero(), 1.25),
    "rail-bitcoin": (lambda: P.lightning_rails(), 1.2),
    "rail-nostr": (lambda: P.nostr_sigil(text="npub:artist:rail"), 1.2),
    "rail-agent": (lambda: P.agent_mesh(), 1.2),
    "rail-music": (lambda: P.silk_wave(), 1.2),
    "how-01-keys": (lambda: P.nostr_sigil(1600, 1067, seed=33, cx=0.5, cy=0.5, scale=1.55, text="npub:artist:keys",
                                          relays=False), 1.2),
    "how-02-catalog": (lambda: P.catalog(), 1.2),
    "how-03-paylink": (lambda: P.pay_link(), 1.2),
    "how-04-stores": (lambda: P.converge(), 1.2),
    "how-05-play": (lambda: P.play_ripple(), 1.2),
    "why-wallets": (lambda: P.wallet_card(), 1.2),
    "why-x402": (lambda: P.gate_402(), 1.2),
    "why-x402-lightning": (lambda: P.gate_bolt(), 1.2),
    "why-nostr": (lambda: P.relay_field(), 1.2),
    "why-lightning": (lambda: P.storm(), 1.2),
    "inspiration": (lambda: P.pillars(), 1.2),
    "problem": (lambda: P.silos(), 1.2),
    "sandbox": (lambda: P.sandbox(), 1.2),
    "marquee-1": (lambda: P.zap(), 1.2),
    "marquee-2": (lambda: P.nostr_sigil(1400, 1050, seed=37, cx=0.62, cy=0.55, scale=1.25, text="npub:fan",
                                        relays=True, c0=CYAN, c1=GREEN), 1.2),
    "marquee-3": (lambda: P.silk_wave(1400, 1050, seed=53, c0=BLUE, c1=MAGENTA, lines=80, amp=0.22, twist=1.8), 1.2),
    "marquee-4": (lambda: P.lightning_rails(1400, 1050, seed=23, color=VIOLET, accent=MAGENTA, vp=(0.62, 0.45)), 1.2),
    "marquee-5": (lambda: P.relay_field(1400, 1050, seed=125, c0=GREEN, c1=CYAN, origin=(0.6, 0.45)), 1.2),
    "marquee-6": (lambda: P.play_ripple(1400, 1050, seed=95, c0=MAGENTA, c1=BLUE, cx=0.42), 1.2),
    "og": (lambda: P.hero(2400, 1260, seed=11, bx=0.74), 1.3),
}


def run(name):
    factory, exposure = JOBS[name]
    c = factory()
    if name == "og":
        img = c.finish("/tmp/og-base.webp", exposure=exposure, size=(1200, 630))
        d = ImageDraw.Draw(img)
        serif = font([os.path.join(os.path.dirname(__file__), "fonts", "InstrumentSerif-Regular.ttf"),
                      "/usr/share/fonts/truetype/sand-box/google/Noto Serif Display/NotoSerifDisplay-VariableFont_wdth,wght.ttf"], 64)
        sans = font(["/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf"], 20)
        d.text((72, 150), "Music Agent", font=serif, fill=(245, 245, 247))
        d.text((72, 222), "on Block\u2019s existing rails", font=serif, fill=(245, 245, 247))
        d.text((74, 318), "A PITCH CONCEPT  \u00b7  NOSTR KEYS  \u00b7  402 PAY LINK  \u00b7  LIGHTNING", font=sans,
               fill=(150, 255, 190))
        d.text((74, 560), "Proposed concept \u2014 not an official TIDAL or Block product.", font=sans,
               fill=(150, 150, 158))
        img.save(os.path.join(ROOT, "public", "og-image.png"), "PNG", optimize=True)
        img.save(os.path.join(ROOT, "public", "og-image.webp"), "WEBP", quality=88, method=6)
    else:
        c.finish(os.path.join(ART, f"{name}.webp"), exposure=exposure, quality=86)
    return name


if __name__ == "__main__":
    names = sys.argv[1:] or list(JOBS)
    with Pool(min(6, len(names))) as p:
        for n in p.imap_unordered(run, names):
            print("rendered", n, flush=True)
