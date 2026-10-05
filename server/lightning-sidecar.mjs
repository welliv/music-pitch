/**
 * Local pay sidecar for the TIDAL Music Agent pitch (Real bitcoin + Stripe card).
 *
 * Secrets (env ONLY — never disk, never logs, never dist, never VITE_*):
 *   NWC_CONNECTION_STRING, STRIPE_SECRET_KEY_TEST, STRIPE_SECRET_KEY_LIVE, LIGHTNING_ADDRESS (optional, agent auto-pay)
 *
 * - Binds to 127.0.0.1:4174. Vite proxies /api → here (same-origin).
 * - GitHub Pages has no /api → static build stays address-only / no card checkout.
 *
 * Lightning (primary Real story):
 *   POST /api/l402/challenge   → 402 + real 21-sat BOLT11 (NWC make_invoice)
 *   GET  /api/l402/status      → settle + signed access lease
 *   POST /api/l402/agent-pay   → optional NWC auto-pay
 *
 * Stripe (optional $0.50 card fallback; Stripe Checkout, separate from Lightning/x402):
 *   POST /api/stripe/checkout  → Checkout Session URL (mode=test|live)
 *   GET  /api/stripe/verify    → confirm paid session_id → same-style lease
 *   (No publishable key needed — redirect Checkout uses secret key server-side only.)
 *
 *   GET  /api/song/:id?access= → lease-gated audio
 *   GET  /api/lightning/health → lightning + stripe availability (no secrets)
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";

// NWC speaks Nostr over WebSocket; Node 20 has no global WebSocket.
globalThis.WebSocket ??= WebSocket;
const { NWCClient } = await import("@getalby/sdk");
const { LightningAddress } = await import("@getalby/lightning-tools");

const HOST = process.env.SIDECAR_HOST || "127.0.0.1";
const PORT = Number(process.env.SIDECAR_PORT || 4174);
const PRICE_SATS = 21;
const PRICE_STRIPE_CENTS = 50; // Stripe card minimum — optional card fallback
/** Artist receive for agent auto-pay only. Set LIGHTNING_ADDRESS in env — never baked into the static site. Neutral default (no TIDAL brand). */
const LIGHTNING_ADDRESS = (process.env.LIGHTNING_ADDRESS || "").trim();
const INVOICE_EXPIRY_S = 600;
const LEASE_S = 15 * 60; // pay-per-play / short lease, not a forever unlock
const FEE_RESERVE_SATS = 10;
const MAX_AGENT_PAYS_PER_HOUR = Number(process.env.SIDECAR_MAX_AGENT_PAYS_PER_HOUR || 5);
const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || "http://127.0.0.1:4173").replace(/\/$/, "");
const STRIPE_PRODUCT_NAME = "Music Agent demo · 2025 Flow 3 unlock";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SONGS = {
  "2025-flow-3": { title: "2025 Flow 3", file: path.join(rootDir, "public/songs/2025-flow-3.mp3") },
};
const APPS = new Set(["tidal", "other", "agent"]);

// Per-process signing key for access leases (random, never persisted).
const LEASE_KEY = randomBytes(32);

const secretValue = () => process.env.NWC_CONNECTION_STRING || "";
const configured = () => secretValue().startsWith("nostr+walletconnect://");

let client = null;
function nwc() {
  if (!configured()) throw publicError("Lightning wallet is not configured on this machine.", 503);
  if (!client) client = new NWCClient({ nostrWalletConnectUrl: secretValue() });
  return client;
}
function resetClient() {
  try { client?.close?.(); } catch { /* ignore */ }
  client = null;
}

// ---------- safety helpers ----------
function scrub(text) {
  let s = String(text ?? "");
  const secret = secretValue();
  if (secret) s = s.split(secret).join("[redacted]");
  for (const k of [stripeKey("test"), stripeKey("live")]) {
    if (k) s = s.split(k).join("[redacted]");
  }
  return s
    .replace(/nostr\+walletconnect:\/\/\S+/gi, "[redacted]")
    .replace(/secret=[0-9a-f]+/gi, "secret=[redacted]")
    .replace(/\b(?:sk|rk)_(?:test|live)_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/\b[0-9a-f]{64}\b/gi, "[hex]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}
function publicError(message, status = 502) {
  const e = new Error(message);
  e.publicMessage = message;
  e.status = status;
  return e;
}
function errMessage(err, fallback) {
  if (err?.publicMessage) return err.publicMessage;
  const code = err?.code ? String(err.code) : "";
  if (/INSUFFICIENT_BALANCE/i.test(code) || /insufficient/i.test(err?.message || "")) {
    return "The agent wallet does not have enough sats to pay.";
  }
  if (/QUOTA_EXCEEDED/i.test(code)) return "The agent wallet budget is used up.";
  if (/RATE_LIMITED/i.test(code)) return "The wallet is rate-limiting requests — try again shortly.";
  if (/timeout|timed out/i.test(err?.message || "")) return "The wallet did not answer in time.";
  return fallback;
}
function log(event, extra = "") {
  const t = new Date().toISOString();
  console.log(`[lightning-sidecar] ${t} ${event}${extra ? " " + scrub(extra) : ""}`);
}
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), ms)),
  ]);
}
function preimageMatches(preimage, paymentHash) {
  if (!/^[0-9a-fA-F]{64}$/.test(preimage || "")) return false;
  const h = createHash("sha256").update(Buffer.from(preimage, "hex")).digest("hex");
  return h.toLowerCase() === String(paymentHash).toLowerCase();
}
const b64url = (buf) => Buffer.from(buf).toString("base64url");
function signLease(payload) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac("sha256", LEASE_KEY).update(body).digest());
  return `${body}.${sig}`;
}
function verifyLease(token) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = createHmac("sha256", LEASE_KEY).update(body).digest();
  let given;
  try { given = Buffer.from(sig, "base64url"); } catch { return null; }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!p.exp || p.exp < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch { return null; }
}
function issueLease(paymentHash, app, song) {
  const exp = Math.floor(Date.now() / 1000) + LEASE_S;
  return { access: signLease({ h: paymentHash, app, song, exp }), leaseExpiresAt: exp };
}


// ---------- Stripe (optional $0.50 card fallback) ----------
function stripeKey(mode) {
  if (mode === "live") return process.env.STRIPE_SECRET_KEY_LIVE || "";
  return process.env.STRIPE_SECRET_KEY_TEST || "";
}
function stripeConfigured(mode) {
  const k = stripeKey(mode);
  if (mode === "live") return /^(sk|rk)_live_/.test(k);
  return /^(sk|rk)_test_/.test(k);
}
function pickStripeMode(v) {
  return v === "live" ? "live" : "test";
}
/** sessionId -> { app, song, mode, paid } — only sessions we created */
const stripeSessions = new Map();
function pruneStripeSessions() {
  // Soft prune: keep map small; verify always re-checks Stripe.
  if (stripeSessions.size > 200) {
    const drop = [...stripeSessions.keys()].slice(0, 50);
    for (const id of drop) stripeSessions.delete(id);
  }
}
async function stripeApi(mode, method, path, form = null) {
  const key = stripeKey(mode);
  if (!stripeConfigured(mode)) {
    throw publicError(`Stripe ${mode} is not configured on this machine.`, 503);
  }
  const headers = {
    Authorization: `Bearer ${key}`,
  };
  let body;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(form).toString();
  }
  const res = await withTimeout(
    fetch(`https://api.stripe.com/v1${path}`, { method, headers, body }),
    20_000,
    "stripe",
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = json?.error?.code || json?.error?.type || "";
    const msg = json?.error?.message || "Stripe request failed.";
    // Never echo raw Stripe payloads that might include sensitive bits.
    log("stripe_error", `${mode} ${method} ${path} ${code}`);
    if (res.status === 401 || res.status === 403) {
      throw publicError(`Stripe ${mode} key was rejected (check permissions for Checkout).`, 502);
    }
    throw publicError(scrub(msg) || "Stripe request failed.", res.status >= 400 && res.status < 500 ? 400 : 502);
  }
  return json;
}
async function createStripeCheckout(app, song, mode) {
  const success = `${FRONTEND_ORIGIN}/?stripe_session_id={CHECKOUT_SESSION_ID}&stripe_app=${encodeURIComponent(app)}&stripe_mode=${mode}#demo`;
  const cancel = `${FRONTEND_ORIGIN}/?stripe_cancel=1#demo`;
  const session = await stripeApi(mode, "POST", "/checkout/sessions", {
    mode: "payment",
    success_url: success,
    cancel_url: cancel,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(PRICE_STRIPE_CENTS),
    "line_items[0][price_data][product_data][name]": STRIPE_PRODUCT_NAME,
    "line_items[0][price_data][product_data][description]":
      `Secondary card path ($${ (PRICE_STRIPE_CENTS / 100).toFixed(2) } Stripe minimum). Primary story remains ${PRICE_SATS} sats Lightning.`,
    "metadata[app]": app,
    "metadata[song]": song,
    "metadata[pitch]": "tidal-music-agent",
    "payment_intent_data[metadata][app]": app,
    "payment_intent_data[metadata][song]": song,
  });
  if (!session?.id || !session?.url) {
    throw publicError("Stripe did not return a Checkout Session URL.");
  }
  stripeSessions.set(session.id, { app, song, mode, paid: false });
  pruneStripeSessions();
  log("stripe_checkout_created", `mode=${mode} app=${app}`);
  return {
    sessionId: session.id,
    url: session.url,
    amountCents: PRICE_STRIPE_CENTS,
    currency: "usd",
    mode,
    app,
    song,
  };
}
async function verifyStripeSession(sessionId, fallbackApp) {
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId || "")) {
    throw publicError("Bad Stripe session id.", 400);
  }
  const mode = sessionId.startsWith("cs_live_") ? "live" : "test";
  const session = await stripeApi(mode, "GET", `/checkout/sessions/${encodeURIComponent(sessionId)}`);
  const paid =
    session.payment_status === "paid" ||
    session.status === "complete";
  if (!paid) {
    return { paid: false, mode, status: session.payment_status || session.status || "open" };
  }
  const meta = session.metadata || {};
  const app = pickApp(meta.app || fallbackApp);
  const song = pickSong(meta.song);
  const remembered = stripeSessions.get(sessionId);
  if (remembered) remembered.paid = true;
  // Lease id is the session id (not a lightning payment hash) — still HMAC-signed.
  log("stripe_paid", `mode=${mode} app=${app}`);
  return {
    paid: true,
    mode,
    amountCents: session.amount_total ?? PRICE_STRIPE_CENTS,
    currency: session.currency || "usd",
    ...issueLease(`stripe:${sessionId}`, app, song),
    app,
    song,
  };
}

// ---------- health (cached, no wallet details leave this process) ----------
let healthCache = { at: 0, value: null };
async function health(force = false) {
  if (!force && healthCache.value && Date.now() - healthCache.at < 20_000) return healthCache.value;
  let value;
  if (!configured()) {
    value = { ok: true, live: false, reason: "not_configured" };
  } else {
    try {
      const info = await withTimeout(nwc().getInfo(), 10_000, "get_info");
      const methods = new Set(info.methods || []);
      const canReceive = methods.has("make_invoice") && methods.has("lookup_invoice");
      let canSpend = false;
      if (methods.has("pay_invoice") && methods.has("get_balance")) {
        try {
          const bal = await withTimeout(nwc().getBalance(), 10_000, "get_balance");
          canSpend = Math.floor((bal.balance || 0) / 1000) >= PRICE_SATS + FEE_RESERVE_SATS;
        } catch { canSpend = false; }
      }
      value = { ok: true, live: canReceive || canSpend, canReceive, canSpend, network: info.network || "unknown" };
    } catch (err) {
      resetClient();
      log("health_error", err?.code || "wallet unreachable");
      value = { ok: true, live: false, reason: "wallet_unreachable" };
    }
  }
  value = {
    ...value,
    priceSats: PRICE_SATS,
    // Never echo Lightning address to the browser — public Pages / logs must not see it.
    stripe: {
      test: stripeConfigured("test"),
      live: stripeConfigured("live"),
      amountCents: PRICE_STRIPE_CENTS,
      currency: "usd",
    },
  };
  healthCache = { at: Date.now(), value };
  return value;
}

// ---------- bills ----------
/** paymentHash -> { app, song, expiresAt, paid, preimage, lastCheck } — only hashes we issued */
const bills = new Map();
function pruneBills() {
  const now = Math.floor(Date.now() / 1000);
  for (const [h, b] of bills) if (b.expiresAt + 3600 < now) bills.delete(h);
}

async function createChallenge(app, song) {
  const tx = await withTimeout(
    nwc().makeInvoice({
      amount: PRICE_SATS * 1000,
      description: `TIDAL Music Agent pitch · ${SONGS[song].title} · ${app} · ${PRICE_SATS} sats`,
      expiry: INVOICE_EXPIRY_S,
    }),
    15_000,
    "make_invoice",
  );
  if (!tx?.invoice || !/^[0-9a-f]{64}$/i.test(tx.payment_hash || "")) {
    throw publicError("The wallet did not return a usable invoice.");
  }
  const expiresAt = tx.expires_at || Math.floor(Date.now() / 1000) + INVOICE_EXPIRY_S;
  bills.set(tx.payment_hash, { app, song, expiresAt, paid: false, preimage: null, lastCheck: 0 });
  pruneBills();
  log("challenge_issued", `app=${app}`);
  return { invoice: tx.invoice, paymentHash: tx.payment_hash, amountSats: PRICE_SATS, expiresAt };
}

async function checkBill(paymentHash) {
  const bill = bills.get(paymentHash);
  if (!bill) throw publicError("Unknown invoice.", 404);
  if (bill.paid) return bill;
  if (Date.now() - bill.lastCheck < 1500) return bill; // throttle wallet lookups
  bill.lastCheck = Date.now();
  const tx = await withTimeout(nwc().lookupInvoice({ payment_hash: paymentHash }), 10_000, "lookup_invoice");
  const settled = tx?.state === "settled" || (tx?.settled_at || 0) > 0;
  if (settled && preimageMatches(tx.preimage, paymentHash)) {
    bill.paid = true;
    bill.preimage = tx.preimage;
    log("invoice_settled", `app=${bill.app}`);
  }
  return bill;
}

// ---------- agent auto-pay (spends real sats; rate-limited) ----------
const agentPays = [];
async function agentPay(app, song) {
  const now = Date.now();
  while (agentPays.length && now - agentPays[0] > 3_600_000) agentPays.shift();
  if (agentPays.length >= MAX_AGENT_PAYS_PER_HOUR) {
    throw publicError("Agent auto-pay limit reached for this hour.", 429);
  }
  const h = await health(true);
  if (!h.canSpend) throw publicError("The agent wallet cannot spend right now (top it up to enable auto-pay).", 409);

  if (!LIGHTNING_ADDRESS || !LIGHTNING_ADDRESS.includes("@")) {
    throw publicError("Artist Lightning address is not configured on the sidecar (set LIGHTNING_ADDRESS).", 503);
  }
  const ln = new LightningAddress(LIGHTNING_ADDRESS);
  await withTimeout(ln.fetch(), 10_000, "lnurl");
  const inv = await withTimeout(
    ln.requestInvoice({ satoshi: PRICE_SATS, comment: `TIDAL Music Agent pitch · ${SONGS[song].title}` }),
    10_000,
    "lnurl invoice",
  );
  agentPays.push(now);
  log("agent_pay_start", `app=${app}`);
  const res = await withTimeout(nwc().payInvoice({ invoice: inv.paymentRequest }), 45_000, "pay_invoice");
  if (!inv.validatePreimage(res.preimage)) throw publicError("Payment returned an invalid preimage.");
  healthCache.at = 0; // balance changed
  log("agent_pay_settled", `app=${app}`);
  return { paymentHash: inv.paymentHash, preimage: res.preimage, feesPaidSats: Math.ceil((res.fees_paid || 0) / 1000) };
}

// ---------- http ----------
function send(res, status, body, headers = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...headers,
  });
  res.end(payload);
}
function readJson(req, limit = 4096) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > limit) req.destroy();
    });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); }
    });
    req.on("error", () => resolve({}));
  });
}
function pickApp(v) { return APPS.has(v) ? v : "tidal"; }
function pickSong(v) { return SONGS[v] ? v : "2025-flow-3"; }

function streamSong(req, res, song) {
  const file = SONGS[song].file;
  let stat;
  try { stat = fs.statSync(file); } catch { return send(res, 404, { error: "Track not found." }); }
  const range = req.headers.range;
  const base = { "content-type": "audio/mpeg", "accept-ranges": "bytes", "cache-control": "no-store" };
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m && m[1] ? Number(m[1]) : 0;
    let end = m && m[2] ? Number(m[2]) : stat.size - 1;
    if (m && !m[1] && m[2]) { start = stat.size - Number(m[2]); end = stat.size - 1; }
    if (start >= stat.size || end >= stat.size || start > end) {
      res.writeHead(416, { "content-range": `bytes */${stat.size}` });
      return res.end();
    }
    res.writeHead(206, { ...base, "content-range": `bytes ${start}-${end}/${stat.size}`, "content-length": end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...base, "content-length": stat.size });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  const p = url.pathname;
  try {
    if (req.method === "GET" && p === "/api/lightning/health") {
      return send(res, 200, await health(url.searchParams.get("fresh") === "1"));
    }

    if (req.method === "POST" && p === "/api/l402/challenge") {
      const body = await readJson(req);
      const app = pickApp(body.app);
      const song = pickSong(body.song);
      const c = await createChallenge(app, song);
      // L402-style: 402 with the invoice the client must settle before retrying.
      return send(res, 402, { status: 402, ...c, app, song }, {
        "www-authenticate": `L402 invoice="${c.invoice}"`,
      });
    }

    if (req.method === "GET" && p === "/api/l402/status") {
      const hash = String(url.searchParams.get("paymentHash") || "");
      if (!/^[0-9a-f]{64}$/i.test(hash)) return send(res, 400, { error: "Bad payment hash." });
      const bill = await checkBill(hash);
      const expired = !bill.paid && bill.expiresAt < Math.floor(Date.now() / 1000);
      if (!bill.paid) return send(res, 200, { paid: false, expired });
      return send(res, 200, { paid: true, preimage: bill.preimage, ...issueLease(hash, bill.app, bill.song) });
    }

    if (req.method === "POST" && p === "/api/l402/agent-pay") {
      const body = await readJson(req);
      const app = pickApp(body.app);
      const song = pickSong(body.song);
      const r = await agentPay(app, song);
      return send(res, 200, { paid: true, ...r, ...issueLease(r.paymentHash, app, song) });
    }

    if (req.method === "POST" && p === "/api/stripe/checkout") {
      const body = await readJson(req);
      const app = pickApp(body.app);
      const song = pickSong(body.song);
      const mode = pickStripeMode(body.mode);
      if (!stripeConfigured(mode)) {
        return send(res, 503, { error: `Stripe ${mode} is not configured on this machine.` });
      }
      const c = await createStripeCheckout(app, song, mode);
      return send(res, 200, c);
    }

    if (req.method === "GET" && p === "/api/stripe/verify") {
      const sessionId = String(url.searchParams.get("session_id") || "");
      const fallbackApp = pickApp(url.searchParams.get("app"));
      const result = await verifyStripeSession(sessionId, fallbackApp);
      return send(res, 200, result);
    }

    const songMatch = /^\/api\/song\/([a-z0-9-]+)$/.exec(p);
    if (req.method === "GET" && songMatch) {
      const song = songMatch[1];
      if (!SONGS[song]) return send(res, 404, { error: "Track not found." });
      const lease = verifyLease(url.searchParams.get("access"));
      if (!lease || lease.song !== song) {
        return send(res, 402, { status: 402, error: "Payment required — lease missing or expired." });
      }
      return streamSong(req, res, song);
    }

    return send(res, 404, { error: "Not found." });
  } catch (err) {
    const status = err?.status || 502;
    log("request_error", `${req.method} ${p} ${err?.code || ""} ${err?.publicMessage || "wallet/lnurl error"}`);
    if (!err?.publicMessage && /timeout/i.test(err?.message || "")) resetClient();
    return send(res, status, { error: errMessage(err, "The Lightning wallet request failed.") });
  }
});

server.listen(PORT, HOST, () => {
  log(
    "listening",
    `http://${HOST}:${PORT} wallet=${configured() ? "configured" : "missing"} stripe_test=${stripeConfigured("test") ? "yes" : "no"} stripe_live=${stripeConfigured("live") ? "yes" : "no"}`,
  );
});
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    resetClient();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1000).unref();
  });
}
