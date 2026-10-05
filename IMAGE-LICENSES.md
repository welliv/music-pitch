# Image licenses

Every section image on this pitch site is **original generative art made for
this pitch**. No stock photography (Unsplash/Pexels), no AI-scraped images, no
TIDAL/Block/Cash App/Square logos or wordmarks, no Nostr ostrich mark, no Jack
Dorsey photos, and no album artwork.

The images are rendered procedurally by `scripts/art/` (Python + NumPy +
Pillow): lines, arcs, and dots are drawn as light in a float buffer, given
multi-scale glow, tone-mapped, and finished with vignette and grain.
Re-render everything with:

```bash
python3 scripts/art/build.py          # all assets
python3 scripts/art/build.py hero     # one asset
```

**Ownership:** the artwork and generator code are original work created for
this repo and belong to the repo owner. No third-party image licenses apply.

## Visual language

| Thread | Colour | Motifs |
|---|---|---|
| Bitcoin / Lightning (Block rails) | electric green on black | fractal bolts, channel rails, settlement nodes |
| Nostr identity | violet / magenta | pubkey sigils (SHA-256 bits as arcs), relays, note ripples, zaps |
| Agents / x402 | cool blue → green | meshes, a 402 gate, converging payment streams |
| Music | violet ↔ green | waveforms, audio meter bars, play glyph |

The colours are generic (not exact brand values) and the bolt and sigil
shapes are drawn from scratch.

## Asset map

| Asset | Generator | What it shows |
|---|---|---|
| `art/hero.webp` | `hero` | A lightning strike hits a horizon and becomes a waveform: payment turning into sound |
| `art/rail-bitcoin.webp` | `lightning_rails` | Lightning channels as perspective light rails, packets racing to one point |
| `art/rail-nostr.webp` | `nostr_sigil` | A radial pubkey sigil (hash bits as arcs) with relays and notes in orbit |
| `art/rail-agent.webp` | `agent_mesh` | Agent mesh with lit routes settling into one pay-link hub |
| `art/rail-music.webp` | `silk_wave` | Silk-like waveform ribbon, violet to green |
| `art/how-01-keys.webp` | `nostr_sigil` (close-up) | Artist key sigil |
| `art/how-02-catalog.webp` | `catalog` | Isometric field of encrypted catalog tiles, a few published |
| `art/how-03-paylink.webp` | `pay_link` | Two interlocked links joined by a lightning spark, with a dot-matrix "402" |
| `art/how-04-stores.webp` | `converge` | Many payment streams converging into one settlement node |
| `art/how-05-play.webp` | `play_ripple` | Play glyph of light, waveform and ripples |
| `art/why-wallets.webp` | `wallet_card` | Edge-lit glass card with an etched geometric bolt (not a real card design) |
| `art/why-x402.webp` | `gate_402` | HTTP 402 as a gate: requests enter blue and leave settled green |
| `art/why-x402-lightning.webp` | `gate_bolt` | A lightning bolt standing inside the 402 gate (Block bringing Lightning to x402) |
| `art/why-nostr.webp` | `relay_field` | Relay constellation with a signed note rippling outward |
| `art/why-lightning.webp` | `storm` | Branching green lightning over a reflective horizon |
| `art/inspiration.webp` | `pillars` | Three columns of light: identity, micropayments, connected apps |
| `art/problem.webp` | `silos` | Three locked platform silos; one opens into an artist pay link |
| `art/sandbox.webp` | `sandbox` | Three app panels streaming payments into the same link |
| `art/marquee-1..6.webp` | `zap`, sigil, silk, rails, relay, play variants | Ask strip stills |
| `og-image.png/.webp` | `hero` + title | Social preview. Title set in Instrument Serif (SIL OFL 1.1, bundled in `scripts/art/fonts/`) |

## Brand motif
The sparse Lightning watermark (`brand/lightning-motif.svg`, also inlined as a
CSS data URI) is original geometric art for this pitch. It is not a trademark
of Lightning Labs or Block.
