# TIDAL Music Agent on Block’s existing rails

**[Live pitch](https://welliv.github.io/music-pitch/)** · Proposed concept — not an official TIDAL or Block product.

A playable pitch for TIDAL eng and product: one song, three payers (TIDAL / another app / an agent), one pay link. Artists keep identity and catalog; stores and agents settle per play; fans never see wallets.

## What it is

A **Music Agent** concept that sits on rails Block and TIDAL already have or can use:

- **Nostr** for artist-controlled identity and catalog metadata  
- **Encrypted catalog** the artist publishes once  
- **HTTP 402 / L402 pay link** priced by the artist (demo: **21 sats** Lightning)  
- **TIDAL, other apps, or agents** pay that link for a short lease, then unlock playback  

Fans just hit play. No wallet UI, no keys, no file chore.

Inspiration (not an endorsement): Jack Dorsey’s Nostr note [Lists of three. March 20, 2025.](https://damus.io/note1pgt2e5n4qeadre4ggpp8laz78fljx8k9tq70j3qg3fwjxp3v9aqs94dz7n) — use cases around human/agent transaction and creator-friendly distribution, plus differentiators around high-agency identity, micropayments, and a connected app ecosystem.

Block joined the [x402 Foundation](https://block.xyz/inside/block-joins-the-x402-foundation-to-advance-open-agentic-commerce) (Sept 24, 2026) and contributed Bitcoin Lightning payments to x402 — open HTTP 402 for agentic commerce. This pitch uses that pattern for music: pay link in, Lightning settle, lease out. Optional Stripe Checkout at **$0.50** (card minimum) is a separate local fiat fallback, not x402.

## How it works

1. Artist opens the agent → creates or manages **Nostr keys**  
2. Publishes an **encrypted catalog** (artist-owned)  
3. Prices a **402 pay link** (demo: 21 sats)  
4. **TIDAL / apps / agents** hit the link, settle, get a short lease  
5. Fan hits **play** — access already authorized behind the glass  

Same path whether the payer is a store or an autonomous agent.

## What’s on the site

Static Vite + React + TypeScript + Tailwind site with:

- Dark full-bleed pitch (hero, problem, three-rails bento, tabbed how-it-works, Why Block, inspiration, interactive sandbox, soft ask)  
- Section imagery for Bitcoin/Lightning, Nostr, agents, catalog, and pay-link steps  
- Interactive sandbox demo track: **2025 Flow 3** (`public/songs/2025-flow-3.mp3`)  

### Demo (GitHub Pages) vs Real (local)

| Mode | Where | What happens |
|------|--------|----------------|
| **Demo** | [Pages](https://welliv.github.io/music-pitch/) and local | Simulated L402 walkthrough. Safe for a public static host. Optional Stripe **test** $0.50 only if a local sidecar is running with a test secret. |
| **Real** | Local only | Lightning **Pay 21 sats** via NWC (`make_invoice` → QR/BOLT11 → settle → lease). Optional Stripe **live** $0.50 Checkout as a secondary card door. Secrets stay in a pay sidecar on `127.0.0.1` — never in the static build or this repo. |

GitHub Pages cannot hold NWC or Stripe secrets. The public URL is the concept + simulated demo; Real pay needs the sidecar below.

## Run locally

```bash
npm install
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Dev server: `npm run dev`.

### Optional: Real pay sidecar

Secrets in shell env only (never `VITE_*`, never commit):

```bash
# NWC_CONNECTION_STRING=nostr+walletconnect://…
# STRIPE_SECRET_KEY_TEST=…   # Demo optional Pay $0.50 (test card)
# STRIPE_SECRET_KEY_LIVE=…   # Real optional Pay $0.50 (card)
npm run build
npx vite preview --host 0.0.0.0 --port 4173 &
npm run sidecar   # 127.0.0.1:4174 — holds NWC + Stripe secrets
```

Vite proxies `/api/*` → the sidecar. Browser sees invoices, Checkout URLs, status, and a short-lived signed lease — not wallet or Stripe secrets.

Health check: `curl -s http://127.0.0.1:4174/api/lightning/health`

## Deploy

Push to `main` on this public repo. Workflow `.github/workflows/deploy.yml` builds with the correct Pages base path and deploys to **https://welliv.github.io/music-pitch/**.

Local path-aware build:

```bash
BASE_PATH=/music-pitch/ SITE_URL=https://welliv.github.io/music-pitch/ npm run build
```

`.env*`, `NWC*`, and `STRIPE*` are git-ignored.
