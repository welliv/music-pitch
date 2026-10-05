# TIDAL Music Agent on Block’s existing rails

Static pitch site (Vite + React + TypeScript + Tailwind) for GitHub Pages.

**Proposed concept — not an official TIDAL or Block product.**

> **Audio rights:** `public/songs/soul-hymn.mp3` is used by the demo. Confirm you own it or hold a
> license for public distribution before making this repo or its Pages site public. If not, replace it
> with a track you own (or a CC0 / CC-BY track, credited here).

## Hosting

The build works at a custom domain (`/`) and at project Pages (`https://welliv.github.io/music-pitch/`)
without code changes:

- Files in `public/` are referenced through `asset()` (`src/lib/utils.ts`), which prefixes Vite's `BASE_URL`.
- `.github/workflows/deploy.yml` runs `actions/configure-pages` first and builds with
  `--base "<base_path>/"` (`/music-pitch/` for project Pages, `/` for a custom domain).
- Open Graph / Twitter tags in `index.html` use absolute URLs from `SITE_URL` (CI sets it from
  configure-pages; local builds fall back to `https://welliv.github.io/music-pitch/`). Preview image:
  `public/og-image.png` (1200×630).

To deploy: push to `main` on a public repo → Settings → Pages → Source: **GitHub Actions**.

Local builds for a specific path:

```bash
BASE_PATH=/music-pitch/ SITE_URL=https://welliv.github.io/music-pitch/ npm run build
```

## Develop

```bash
npm install
npm run dev
```

## Build & preview

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

## Real pay mode (local only)

GitHub Pages serves static files only, so the public build never talks to a wallet or Stripe: **Demo** is a
simulated L402 walkthrough and **Real bitcoin** shows that live pay needs a local build with a pay server.

Locally, Real mode goes live when the pay sidecar (`server/lightning-sidecar.mjs`) is reachable:

```bash
# Secrets must already be in your shell env (password manager / secure card). Never VITE_*, never commit.
#   NWC_CONNECTION_STRING
#   STRIPE_SECRET_KEY_TEST   → Demo optional "Pay $0.50 (test card)"
#   STRIPE_SECRET_KEY_LIVE   → Real optional "Pay $0.50 (card)"
npm run build
npx vite preview --host 0.0.0.0 --port 4173 &   # static site — no secrets in that process
npm run sidecar                                   # 127.0.0.1:4174 — holds NWC + Stripe secrets
```

- Vite (dev and preview) proxies same-origin `/api/*` → `127.0.0.1:4174`. The browser only sees invoices,
  Checkout URLs, payment status, and a short-lived signed lease — never wallet or Stripe secrets.
- **Pay 21 sats (Lightning):** NWC `make_invoice` → QR / BOLT11 → pay → `lookup_invoice` + preimage verify →
  15-min lease → `/api/song/soul-hymn?access=…`.
- **Pay $0.50 (card fallback):** Stripe Checkout Session at **50¢**, the Stripe card minimum. This is plain
  Stripe Checkout — separate from Lightning and from x402. Demo uses the **test** key; Real uses the **live**
  key. The return URL carries `session_id`; the sidecar verifies it was paid → same lease.
  **Publishable keys are not required** for redirect Checkout (secret key only, server-side).
- **Buyer agent → Auto-pay** (optional Lightning): the sidecar's NWC wallet pays the demo receive address.
  Needs ≥ 31 sats; capped (`SIDECAR_MAX_AGENT_PAYS_PER_HOUR`).
- Health: `curl -s http://127.0.0.1:4174/api/lightning/health` → `{ live, canReceive, canSpend, stripe:{test,live}, … }`.
- If the sidecar is down, Real mode explains that live pay is local-only; Demo still works.
- `@getalby/sdk` prefers Node 22+; on Node 20 the sidecar polyfills `WebSocket` with `ws`.

## Notes

- Demo mode simulates L402 on the client (Pages-safe). Optional Stripe **test** card when the test secret is
  in the sidecar.
- `.env*`, `NWC*`, and `STRIPE*` are git-ignored — secrets only in process env.
- Relume shells used (rethemed): Header23, Layout381, Layout506, Content 7, Cta67; navbar/footer simplified
  from Navbar1 / Footer15 patterns. See `src/components/relume/USED.md`.
- Block’s x402 announcement referenced on the site:
  <https://block.xyz/inside/block-joins-the-x402-foundation-to-advance-open-agentic-commerce> (Sept 24, 2026).
