/**
 * Browser client for the local pay sidecar (server/lightning-sidecar.mjs).
 * Talks only to same-origin /api (Vite proxies it locally). No secrets here:
 * NWC + Stripe secret keys never leave the sidecar process.
 * On GitHub Pages /api does not exist → health reports offline → Real settle unavailable (Demo only).
 */

export type StripeHealth = {
  test: boolean;
  live: boolean;
  amountCents: number;
  currency: string;
};

export type SidecarHealth = {
  live: boolean;
  canReceive?: boolean;
  canSpend?: boolean;
  network?: string;
  reason?: string;
  stripe?: StripeHealth;
};

export type Challenge = {
  invoice: string;
  paymentHash: string;
  amountSats: number;
  expiresAt: number;
};

export type Lease = { access: string; leaseExpiresAt: number };

export type StatusResult =
  | { paid: false; expired: boolean }
  | ({ paid: true; preimage: string } & Lease);

export type AgentPayResult = {
  paid: true;
  paymentHash: string;
  preimage: string;
  feesPaidSats: number;
} & Lease;

export type StripeCheckout = {
  sessionId: string;
  url: string;
  amountCents: number;
  currency: string;
  mode: "test" | "live";
  app: string;
  song: string;
};

export type StripeVerifyResult =
  | { paid: false; mode: "test" | "live"; status: string }
  | ({
      paid: true;
      mode: "test" | "live";
      amountCents: number;
      currency: string;
      app: string;
      song: string;
    } & Lease);

async function json<T>(res: Response): Promise<T> {
  const type = res.headers.get("content-type") || "";
  if (!type.includes("application/json")) throw new Error("Pay sidecar is not reachable.");
  return (await res.json()) as T;
}

function withTimeout(ms: number, outer?: AbortSignal) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  outer?.addEventListener("abort", () => ctrl.abort(), { once: true });
  return { signal: ctrl.signal, done: () => clearTimeout(t) };
}

export async function fetchSidecarHealth(fresh = false): Promise<SidecarHealth> {
  const { signal, done } = withTimeout(fresh ? 15000 : 4000);
  try {
    const res = await fetch(`/api/lightning/health${fresh ? "?fresh=1" : ""}`, {
      signal,
      cache: "no-store",
    });
    if (!res.ok) return { live: false, reason: "offline" };
    const body = await json<SidecarHealth>(res);
    return {
      live: !!body.live,
      canReceive: !!body.canReceive,
      canSpend: !!body.canSpend,
      network: body.network,
      reason: body.reason,
      stripe: body.stripe
        ? {
            test: !!body.stripe.test,
            live: !!body.stripe.live,
            amountCents: body.stripe.amountCents || 50,
            currency: body.stripe.currency || "usd",
          }
        : undefined,
    };
  } catch {
    return { live: false, reason: "offline" };
  } finally {
    done();
  }
}

export async function requestChallenge(app: string, song: string): Promise<Challenge> {
  const { signal, done } = withTimeout(20000);
  try {
    const res = await fetch("/api/l402/challenge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ app, song }),
      signal,
    });
    const body = await json<Challenge & { error?: string }>(res);
    if (res.status !== 402 || !body.invoice) {
      throw new Error(body.error || "Could not create a Lightning invoice.");
    }
    return body;
  } finally {
    done();
  }
}

export async function checkStatus(paymentHash: string, outer?: AbortSignal): Promise<StatusResult> {
  const { signal, done } = withTimeout(15000, outer);
  try {
    const res = await fetch(`/api/l402/status?paymentHash=${encodeURIComponent(paymentHash)}`, {
      signal,
      cache: "no-store",
    });
    const body = await json<StatusResult & { error?: string }>(res);
    if (!res.ok) throw new Error(body.error || "Status check failed.");
    return body;
  } finally {
    done();
  }
}

export async function agentPay(app: string, song: string): Promise<AgentPayResult> {
  const { signal, done } = withTimeout(60000);
  try {
    const res = await fetch("/api/l402/agent-pay", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ app, song }),
      signal,
    });
    const body = await json<AgentPayResult & { error?: string }>(res);
    if (!res.ok || !body.paid) throw new Error(body.error || "Agent payment failed.");
    return body;
  } finally {
    done();
  }
}

export async function createStripeCheckout(
  app: string,
  song: string,
  mode: "test" | "live",
): Promise<StripeCheckout> {
  const { signal, done } = withTimeout(20000);
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ app, song, mode }),
      signal,
    });
    const body = await json<StripeCheckout & { error?: string }>(res);
    if (!res.ok || !body.url) throw new Error(body.error || "Could not start Stripe Checkout.");
    return body;
  } finally {
    done();
  }
}

export async function verifyStripeSession(
  sessionId: string,
  app?: string,
): Promise<StripeVerifyResult> {
  const { signal, done } = withTimeout(20000);
  try {
    const q = new URLSearchParams({ session_id: sessionId });
    if (app) q.set("app", app);
    const res = await fetch(`/api/stripe/verify?${q}`, { signal, cache: "no-store" });
    const body = await json<StripeVerifyResult & { error?: string }>(res);
    if (!res.ok) throw new Error(body.error || "Stripe verify failed.");
    return body;
  } finally {
    done();
  }
}

export function songStreamUrl(song: string, access: string) {
  return `/api/song/${encodeURIComponent(song)}?access=${encodeURIComponent(access)}`;
}
