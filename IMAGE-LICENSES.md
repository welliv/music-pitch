# Visual licenses

## Pitch UI icons (live site)

Section visuals on the pitch site use **[lucide-react](https://lucide.dev)**
monoline icons (ISC license) inside custom `IconSurface` panels — not stock
photography and not generative webp stills.

Accent threads (generic, not brand marks):

| Thread | Colour | Lucide marks |
|---|---|---|
| Lightning / settlement | emerald (`emerald-400`) | `Zap` |
| Nostr identity | violet (`violet-400`) | `Fingerprint`, `KeyRound` |
| Agents / x402 / Apple accent | `#2997ff` | `Bot`, `Link2`, `Unlock`, `Wallet` |
| Music / neutral | mist white | `Music2`, `Play`, `Store`, `Library`, `Share2` |

No Block/TIDAL/Cash App/Square logos or wordmarks, no Nostr ostrich mark, no
Jack Dorsey photos, no album artwork, and no crypto clichés.

### Icon map (live sections)

| Section | Icons |
|---|---|
| Hero | `Zap`, `Fingerprint`, `Music2` |
| Three → one | `Zap`, `Fingerprint`, `Bot`, `Music2` |
| Problem | `Unlock` |
| How it works | `KeyRound`, `Library`, `Link2`, `Store`, `Play` |
| Sandbox header | `KeyRound`, `Link2`, `Zap`, `Music2` |
| Why Block | `Zap` (x402 feature), `Wallet`, `Link2`, `Fingerprint`, `Zap` |
| Inspiration | `Fingerprint`, `Zap`, `Share2` |
| Ask | `Zap`, `Fingerprint`, `Link2`, `Bot`, `Wallet`, `Music2` |

## Social preview (`og-image`)

`og-image.png` / `og-image.webp` remain original generative stills produced by
`scripts/art/` (Python + NumPy + Pillow) for link previews only. Title type
uses Instrument Serif (SIL OFL 1.1, bundled in `scripts/art/fonts/`).

```bash
python3 scripts/art/build.py hero   # regenerates hero frame used for OG
```

**Ownership:** OG artwork and generator code are original work for this repo.
No third-party image licenses apply to those assets.

## Brand motif

The sparse Lightning watermark (`brand/lightning-motif.svg`, also inlined as a
CSS data URI) is original geometric art for this pitch. It is not a trademark
of Lightning Labs or Block.

## Unused / archive

`scripts/art/` can still render the older section webp set for archival
experiments. Those files are **not** shipped in `public/` or the Pages build.
