import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Bot,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  Link2,
  Zap,
  KeyRound,
  Music2,
  Radio,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type AppId,
  type AppState,
  type LogEntry,
  type LogKind,
  type ScenarioId,
  PAY_LINK,
  PRICE_SATS,
  PRICE_STRIPE_LABEL,
  SONG_CREDIT,
  SONG_ID,
  SONG_TITLE,
  SONG_URL,
} from "./types";
import {
  type SidecarHealth,
  agentPay,
  checkStatus,
  createStripeCheckout,
  fetchSidecarHealth,
  requestChallenge,
  songStreamUrl,
  verifyStripeSession,
} from "@/lib/lightning-sidecar";

type PendingInvoice = {
  app: AppId;
  invoice: string;
  paymentHash: string;
  expiresAt: number;
  qr: string;
};

const SCENARIOS: {
  id: ScenarioId;
  label: string;
  blurb: string;
}[] = [
  {
    id: "artist",
    label: "Artist agent",
    blurb: "Create Nostr keys, set price, publish the song link.",
  },
  {
    id: "tidal",
    label: "TIDAL pays",
    blurb: "Store client hits 402, pays 21 sats, unlocks play.",
  },
  {
    id: "other",
    label: "The other app",
    blurb: "Same link, separate bill — second app must pay too.",
  },
  {
    id: "agent",
    label: "Buyer agent",
    blurb: "Autonomous buyer discovers the link and settles.",
  },
];

function stamp() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function randHex(bytes: number) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

const emptyApp = (): AppState => ({
  paid: false,
  playing: false,
  token: null,
  preimage: null,
  audioSrc: null,
});

/**
 * Real pay (NWC Lightning / Stripe) needs the local sidecar, which GitHub Pages
 * cannot host. The shipped public build is Demo-only (simulated L402).
 * Opt in locally with VITE_ENABLE_REAL=1 (see `npm run preview:real`).
 */
const REAL_ENABLED = import.meta.env.VITE_ENABLE_REAL === "1";

export function Sandbox() {
  const [scenario, setScenario] = useState<ScenarioId>("tidal");
  const [mode, setMode] = useState<"demo" | "real">("demo");
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [apps, setApps] = useState<Record<AppId, AppState>>({
    tidal: emptyApp(),
    other: emptyApp(),
    agent: emptyApp(),
  });
  const [artist, setArtist] = useState({
    published: false,
    pubkey: "",
    price: PRICE_SATS,
  });
  const logId = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const busyRef = useRef(false);
  const unlockLoggedRef = useRef<Set<AppId>>(new Set());
  const [sidecar, setSidecar] = useState<SidecarHealth & { checking: boolean }>({
    live: false,
    checking: REAL_ENABLED,
  });
  const [pending, setPending] = useState<PendingInvoice | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const pollAbortRef = useRef<AbortController | null>(null);

  const refreshSidecar = useCallback(async (fresh = false) => {
    setSidecar((prev) => ({ ...prev, checking: true }));
    const h = await fetchSidecarHealth(fresh);
    setSidecar({ ...h, checking: false });
    return h;
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (REAL_ENABLED) {
      void fetchSidecarHealth().then((h) => {
        if (!cancelled) setSidecar({ ...h, checking: false });
      });
    }
    return () => {
      cancelled = true;
      pollAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, [pending]);

  const pushLog = useCallback((kind: LogKind, text: string, detail?: string) => {
    logId.current += 1;
    // Capture now: React may re-run queued updaters later, after logId moved on.
    const entry = { id: logId.current, time: stamp(), kind, text, detail };
    setLogs((prev) => [
      entry,
      ...prev,
    ].slice(0, 80));
  }, []);

  const logUnlockOnce = useCallback(
    (app: AppId) => {
      if (unlockLoggedRef.current.has(app)) return;
      unlockLoggedRef.current.add(app);
      pushLog("ok", `Paid ✓ — ${labelFor(app)} unlocked ${SONG_TITLE}`);
    },
    [pushLog],
  );

  // Stripe Checkout return: ?stripe_session_id=…#demo → verify → lease unlock
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!REAL_ENABLED) return;
    const sessionId = params.get("stripe_session_id");
    const cancelledPay = params.get("stripe_cancel") === "1";
    if (cancelledPay) {
      pushLog("info", "Stripe Checkout cancelled — nothing charged");
      const url = new URL(window.location.href);
      url.searchParams.delete("stripe_cancel");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash || "#demo"}`);
      return;
    }
    if (!sessionId) return;
    const appParam = (params.get("stripe_app") || "tidal") as AppId;
    const app: AppId = appParam === "other" || appParam === "agent" ? appParam : "tidal";
    let cancelled = false;
    (async () => {
      pushLog("req", "GET /api/stripe/verify", `session=${sessionId.slice(0, 14)}…`);
      try {
        const st = await verifyStripeSession(sessionId, app);
        if (cancelled) return;
        if (!st.paid) {
          pushLog("err", "Stripe session is not paid yet", st.status);
          return;
        }
        pushLog(
          "ok",
          `Card paid · ${PRICE_STRIPE_LABEL} (${st.mode})`,
          `lease ${st.access.slice(0, 10)}…`,
        );
        pushLog("res", "200 OK · audio/mpeg (lease-gated)", SONG_TITLE);
        setApps((prev) => ({
          ...prev,
          [st.app as AppId]: {
            paid: true,
            playing: false,
            token: sessionId,
            preimage: null,
            audioSrc: songStreamUrl(SONG_ID, st.access),
          },
        }));
        logUnlockOnce(st.app as AppId);
        setMode(st.mode === "live" ? "real" : "demo");
        setScenario(st.app === "agent" ? "agent" : st.app === "other" ? "other" : "tidal");
      } catch (e) {
        if (!cancelled) {
          pushLog("err", e instanceof Error ? e.message : "Stripe verify failed.");
        }
      } finally {
        const url = new URL(window.location.href);
        url.searchParams.delete("stripe_session_id");
        url.searchParams.delete("stripe_app");
        url.searchParams.delete("stripe_mode");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash || "#demo"}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pushLog, logUnlockOnce]);

  const activeApp: AppId =
    scenario === "other" ? "other" : scenario === "agent" ? "agent" : "tidal";

  const canPlay = apps[activeApp].paid;
  const realMode = REAL_ENABLED && mode === "real";
  const liveReady = REAL_ENABLED && !!(sidecar.live && sidecar.canReceive);
  const realPayBlocked = realMode && !liveReady;
  const stripeTestReady = REAL_ENABLED && !!sidecar.stripe?.test;
  const stripeLiveReady = REAL_ENABLED && !!sidecar.stripe?.live;
  const stripeReady = realMode ? stripeLiveReady : stripeTestReady;
  const stripeMode: "test" | "live" = realMode ? "live" : "test";
  const showPayScenarios =
    scenario === "tidal" || scenario === "other" || scenario === "agent";

  const runPayFlow = useCallback(
    async (app: AppId) => {
      if (busyRef.current) return;
      if (apps[app].paid || unlockLoggedRef.current.has(app)) {
        pushLog("info", `${labelFor(app)} already paid for this session.`);
        return;
      }
      if (realMode) {
        if (!liveReady) {
          pushLog(
            "err",
            "Live Lightning sidecar is not reachable — Real pay is off on this build.",
            "Switch to Demo for the simulated L402 flow.",
          );
          return;
        }
        busyRef.current = true;
        setBusy(true);
        try {
          pushLog("req", "POST /api/l402/challenge", `app=${app} song=${SONG_ID}`);
          const c = await requestChallenge(app, SONG_ID);
          pushLog(
            "res",
            "402 Payment Required (live)",
            `invoice=${c.invoice.slice(0, 18)}…${c.invoice.slice(-6)} · ${c.amountSats} sats`,
          );
          const qr = await QRCode.toDataURL(`lightning:${c.invoice}`.toUpperCase(), {
            margin: 1,
            width: 320,
            color: { dark: "#0a0a0a", light: "#ffffff" },
          });
          setPending({ app, invoice: c.invoice, paymentHash: c.paymentHash, expiresAt: c.expiresAt, qr });
          setCopied(false);
          setNow(Math.floor(Date.now() / 1000));
          pushLog("pay", `Waiting for ${PRICE_SATS} sats from any Lightning wallet…`, labelFor(app));

          pollAbortRef.current?.abort();
          const ctrl = new AbortController();
          pollAbortRef.current = ctrl;
          let failures = 0;
          while (!ctrl.signal.aborted) {
            await sleep(2000);
            if (ctrl.signal.aborted) break;
            try {
              const st = await checkStatus(c.paymentHash, ctrl.signal);
              failures = 0;
              if (st.paid) {
                pushLog("ok", "Invoice settled · preimage verified", `preimage=${st.preimage.slice(0, 16)}…`);
                pushLog(
                  "req",
                  `GET /api/song/${SONG_ID} (retry)`,
                  `Authorization: L402 lease ${st.access.slice(0, 10)}…`,
                );
                pushLog("res", "200 OK · audio/mpeg (lease-gated)", SONG_TITLE);
                setApps((prev) => ({
                  ...prev,
                  [app]: {
                    paid: true,
                    playing: false,
                    token: c.paymentHash,
                    preimage: st.preimage,
                    audioSrc: songStreamUrl(SONG_ID, st.access),
                  },
                }));
                logUnlockOnce(app);
                setPending(null);
                break;
              }
              if (st.expired) {
                pushLog("err", "Invoice expired — tap Pay again for a fresh one");
                setPending(null);
                break;
              }
            } catch (e) {
              if (ctrl.signal.aborted) break;
              failures += 1;
              if (failures >= 4) {
                pushLog("err", e instanceof Error ? e.message : "Lost the Lightning sidecar.");
                setPending(null);
                void refreshSidecar();
                break;
              }
            }
          }
        } catch (e) {
          pushLog("err", e instanceof Error ? e.message : "Live Lightning request failed.");
          setPending(null);
          void refreshSidecar();
        } finally {
          busyRef.current = false;
          setBusy(false);
        }
        return;
      }

      busyRef.current = true;
      setBusy(true);
      try {
        pushLog("req", `GET ${PAY_LINK}`, `app=${app} song=${SONG_ID}`);
        await sleep(420);
        const token = `L402_${randHex(8)}`;
        pushLog(
          "res",
          "402 Payment Required",
          `WWW-Authenticate: L402 token="${token.slice(0, 12)}…", invoice="lnbc…" · ${PRICE_SATS} sats`,
        );
        await sleep(380);
        pushLog(
          "pay",
          `${labelFor(app)} pays invoice (simulated)`,
          `${PRICE_SATS} sats`,
        );
        await sleep(520);
        const preimage = randHex(16);
        pushLog("ok", "Invoice settled", `preimage=${preimage.slice(0, 16)}…`);
        await sleep(280);
        pushLog(
          "req",
          `GET ${PAY_LINK} (retry)`,
          `Authorization: L402 ${token.slice(0, 10)}…:${preimage.slice(0, 8)}…`,
        );
        await sleep(360);
        pushLog("res", "200 OK · audio/mpeg", SONG_TITLE);
        setApps((prev) => ({
          ...prev,
          [app]: { paid: true, playing: false, token, preimage, audioSrc: null },
        }));
        logUnlockOnce(app);
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [apps, realMode, liveReady, pushLog, logUnlockOnce, refreshSidecar],
  );


  const runStripeCheckout = useCallback(
    async (app: AppId) => {
      if (busyRef.current) return;
      if (apps[app].paid || unlockLoggedRef.current.has(app)) {
        pushLog("info", `${labelFor(app)} already paid for this session.`);
        return;
      }
      if (!stripeReady) {
        pushLog(
          "err",
          realMode
            ? "Stripe live is not configured on this machine — card pay is off."
            : "Stripe test is not configured — card demo is off.",
        );
        return;
      }
      busyRef.current = true;
      setBusy(true);
      try {
        pushLog(
          "req",
          "POST /api/stripe/checkout",
          `app=${app} · ${PRICE_STRIPE_LABEL} · mode=${stripeMode}`,
        );
        const c = await createStripeCheckout(app, SONG_ID, stripeMode);
        pushLog(
          "pay",
          `Redirecting to Stripe Checkout (${c.mode})`,
          `${PRICE_STRIPE_LABEL} Stripe card minimum · separate from Lightning / x402`,
        );
        window.location.assign(c.url);
      } catch (e) {
        pushLog("err", e instanceof Error ? e.message : "Stripe Checkout failed.");
        void refreshSidecar();
        busyRef.current = false;
        setBusy(false);
      }
      // On success we navigate away; no finally unlock needed.
    },
    [apps, stripeReady, stripeMode, realMode, pushLog, refreshSidecar],
  );

  const cancelPending = useCallback(() => {
    pollAbortRef.current?.abort();
    setPending(null);
    pushLog("info", "Invoice dismissed — nothing was charged");
  }, [pushLog]);

  const copyInvoice = useCallback(async () => {
    if (!pending) return;
    try {
      await navigator.clipboard.writeText(pending.invoice);
      setCopied(true);
    } catch {
      pushLog("err", "Clipboard blocked — scan the QR or open in wallet");
    }
  }, [pending, pushLog]);

  const runAgentAutoPay = useCallback(async () => {
    if (busyRef.current || apps.agent.paid) return;
    busyRef.current = true;
    setBusy(true);
    try {
      pushLog("req", "GET LNURL invoice (artist receive)", `${PRICE_SATS} sats`);
      pushLog("pay", "Buyer agent pays via its NWC wallet (live)", `${PRICE_SATS} sats`);
      const r = await agentPay("agent", SONG_ID);
      pushLog(
        "ok",
        "Payment settled · preimage verified",
        `preimage=${r.preimage.slice(0, 16)}… · fee ${r.feesPaidSats} sats`,
      );
      pushLog("res", "200 OK · audio/mpeg (lease-gated)", SONG_TITLE);
      setApps((prev) => ({
        ...prev,
        agent: {
          paid: true,
          playing: false,
          token: r.paymentHash,
          preimage: r.preimage,
          audioSrc: songStreamUrl(SONG_ID, r.access),
        },
      }));
      logUnlockOnce("agent");
    } catch (e) {
      pushLog("err", e instanceof Error ? e.message : "Agent payment failed.");
      void refreshSidecar(true);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [apps.agent.paid, pushLog, logUnlockOnce, refreshSidecar]);

  const publishArtist = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      pushLog("info", "Music Agent: create Nostr identity");
      await sleep(350);
      const pubkey = `npub1${randHex(16)}`;
      pushLog("ok", "Nostr keys ready (demo)", pubkey);
      await sleep(300);
      pushLog("info", "Encrypt track to artist key · publish listing");
      await sleep(400);
      pushLog(
        "ok",
        "Catalog live behind 402 pay link",
        `${PAY_LINK} · ${PRICE_SATS} sats`,
      );
      setArtist({ published: true, pubkey, price: PRICE_SATS });
    } finally {
      setBusy(false);
    }
  }, [busy, pushLog]);

  const playSong = useCallback(
    async (app: AppId) => {
      if (!apps[app].paid) {
        pushLog("err", `${labelFor(app)} must pay before play`);
        return;
      }
      const el = audioRef.current;
      if (!el) return;
      try {
        el.currentTime = 0;
        await el.play();
        setApps((prev) => ({
          ...prev,
          [app]: { ...prev[app], playing: true },
        }));
        pushLog("ok", `Playing · ${SONG_TITLE}`, labelFor(app));
      } catch {
        pushLog("err", "Audio playback blocked by browser — tap Play again");
      }
    },
    [apps, pushLog],
  );

  const resetSession = () => {
    audioRef.current?.pause();
    pollAbortRef.current?.abort();
    setPending(null);
    busyRef.current = false;
    unlockLoggedRef.current.clear();
    setBusy(false);
    setApps({ tidal: emptyApp(), other: emptyApp(), agent: emptyApp() });
    setArtist({ published: false, pubkey: "", price: PRICE_SATS });
    setLogs([]);
    pushLog("info", "Session reset — each app must pay again");
  };

  const statusLine = useMemo(() => {
    const paidCount = (["tidal", "other", "agent"] as AppId[]).filter(
      (a) => apps[a].paid,
    ).length;
    return `${paidCount}/3 payers unlocked · ${PRICE_SATS} sats each`;
  }, [apps]);

  return (
    <section
      id="demo"
      className="section-pad scroll-mt-20 border-t border-white/[0.06]"
    >
      <div className="mx-auto max-w-content">
        <div className="relative mb-10 overflow-hidden rounded-3xl border border-white/[0.08] bg-ink shadow-soft md:mb-12">
          <div className="flex aspect-[24/7] min-h-[5.5rem] items-center justify-center gap-3 bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,rgba(41,151,255,0.12),transparent_70%)] px-4 md:gap-5 md:min-h-[7rem]">
            {[
              { Icon: KeyRound, accent: "text-violet-400", ring: "ring-violet-400/25" },
              { Icon: Link2, accent: "text-accent", ring: "ring-accent/20" },
              { Icon: Zap, accent: "text-emerald-400", ring: "ring-emerald-400/25" },
              { Icon: Music2, accent: "text-mist", ring: "ring-white/10" },
            ].map(({ Icon, accent, ring }, i) => (
              <span
                key={i}
                className={`flex size-10 items-center justify-center rounded-2xl border border-white/[0.08] bg-ink-soft shadow-soft ring-1 ${ring} md:size-14`}
              >
                <Icon className={`size-4 md:size-6 ${accent}`} strokeWidth={1.35} />
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]" />
        </div>
        <div className="mb-12 max-w-2xl md:mb-14">
          <p className="section-label">Interactive sandbox</p>
          <h2 className="display-title mb-5 text-[2rem] md:text-h2 lg:text-[3rem]">
            One song. Separate bills. Same pay link.
          </h2>
          <p className="body-lg max-w-prose">
            Walk the agent publish path, then pay as TIDAL, another app, or a
            buyer agent. This is a <strong className="font-medium text-mist">simulated L402</strong>{" "}
            walkthrough: the 402 challenge, the {PRICE_SATS}-sat pay, the retry and
            the unlock are all shown, but no real sats move on this page.
          </p>
        </div>

        <div className="mb-7 flex flex-wrap items-center gap-3">
          {REAL_ENABLED ? (
          <div className="inline-flex rounded-full border border-white/[0.1] bg-ink-soft p-1 shadow-soft">
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-small font-medium tracking-[-0.01em] transition-all duration-calm ${
                mode === "demo"
                  ? "bg-mist text-ink shadow-sm"
                  : "text-mist-dim hover:text-mist"
              }`}
              onClick={() => setMode("demo")}
            >
              Demo mode
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-small font-medium tracking-[-0.01em] transition-all duration-calm ${
                mode === "real"
                  ? "bg-mist text-ink shadow-sm"
                  : "text-mist-dim hover:text-mist"
              }`}
              onClick={() => {
                setMode("real");
                void refreshSidecar(true);
              }}
            >
              Real (local)
            </button>
          </div>
          ) : (
            <span className="chip">Demo · simulated L402</span>
          )}
          <span className="chip">{statusLine}</span>
          <button
            type="button"
            onClick={resetSession}
            className="ml-auto text-small text-mist-dim underline-offset-4 transition-colors duration-calm hover:text-mist hover:underline"
          >
            Reset session
          </button>
        </div>

        {realMode && (liveReady || stripeLiveReady) && (
          <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] px-5 py-4 text-small leading-relaxed text-mist-dim">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            <strong className="font-medium text-mist">
              {liveReady ? "Live Lightning" : "Live card"}
              {liveReady && stripeLiveReady ? " + card" : ""}.
            </strong>
            <span>
              {liveReady ? (
                <>
                  Primary: real {PRICE_SATS}-sat invoice
                  {sidecar.network && sidecar.network !== "unknown" ? ` on ${sidecar.network}` : ""}.
                  Scan any Lightning wallet — audio unlocks after preimage verify.
                </>
              ) : (
                <>Lightning sidecar is offline for invoices.</>
              )}
              {stripeLiveReady && (
                <>
                  {" "}
                  Card fallback: Pay {PRICE_STRIPE_LABEL} via Stripe — the card
                  minimum, separate from Lightning and x402.
                </>
              )}
            </span>
          </div>
        )}

        {realMode && !liveReady && !stripeLiveReady && (
          <div className="mb-6 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] px-5 py-4 text-small leading-relaxed text-mist-dim">
            <strong className="font-medium text-mist">
              {sidecar.checking
                ? "Checking for local pay sidecar…"
                : "Real pay is not available on this public URL."}
            </strong>{" "}
            {!sidecar.checking && (
              <>
                GitHub Pages is static — no NWC or Stripe secrets, no live
                invoices. Real Lightning and card checkout run only on a local
                build with a pay sidecar.{" "}
                <button
                  type="button"
                  className="text-mist underline underline-offset-4 hover:opacity-90"
                  onClick={() => void refreshSidecar(true)}
                >
                  Retry local sidecar
                </button>{" "}
                ·{" "}
                <button
                  type="button"
                  className="text-accent underline underline-offset-4 hover:opacity-90"
                  onClick={() => setMode("demo")}
                >
                  Switch to Demo
                </button>{" "}
                for the simulated L402 walkthrough.
              </>
            )}
          </div>
        )}

        {mode === "demo" && stripeTestReady && (
          <div className="mb-6 rounded-2xl border border-white/[0.08] bg-ink-soft px-5 py-4 text-small leading-relaxed text-mist-dim">
            <strong className="font-medium text-mist">Demo + Stripe test.</strong>{" "}
            Simulated L402 stays primary. Optional{" "}
            <span className="text-mist">Pay {PRICE_STRIPE_LABEL} (test card)</span> uses
            Stripe test mode — use card{" "}
            <span className="font-mono text-[0.8rem] text-mist">4242…</span> on Checkout.
            Card fallback only; it is separate from Lightning and x402.
          </div>
        )}

        {showPayScenarios && !artist.published && (
          <div className="mb-6 rounded-2xl border border-white/[0.08] bg-ink-soft px-5 py-4 text-small text-mist-dim">
            Run{" "}
            <button
              type="button"
              className="font-medium text-mist underline underline-offset-4"
              onClick={() => setScenario("artist")}
            >
              Artist agent
            </button>{" "}
            first — or continue with the preloaded demo song.
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,220px)_1fr] lg:gap-6">
          <aside className="flex flex-col gap-2">
            {SCENARIOS.map((s) => {
              const active = scenario === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScenario(s.id)}
                  className={`rounded-2xl border px-4 py-3.5 text-left transition-all duration-calm ${
                    active
                      ? "border-white/20 bg-mist text-ink shadow-soft"
                      : "border-white/[0.08] bg-ink-soft text-mist-dim hover:border-white/15 hover:text-mist"
                  }`}
                >
                  <div className="flex items-center gap-2 text-small font-medium tracking-[-0.01em]">
                    <span className={active ? "text-ink" : "text-mist-dim"}>
                      {scenarioIcon(s.id, active)}
                    </span>
                    {s.label}
                  </div>
                  <div
                    className={`mt-1.5 text-tiny leading-snug ${
                      active ? "text-ink/65" : "text-ink-mute"
                    }`}
                  >
                    {s.blurb}
                  </div>
                </button>
              );
            })}
          </aside>

          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-full bg-white/[0.06] text-mist">
                    {scenarioIcon(scenario, false)}
                  </span>
                  {SCENARIOS.find((s) => s.id === scenario)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-small leading-relaxed text-mist-dim">
                {scenario === "artist" && (
                  <>
                    <p>
                      Simulate the Music Agent onboarding path: Nostr
                      identity, encrypt, publish, set {PRICE_SATS} sats on the
                      pay link.
                    </p>
                    <dl className="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-2.5 rounded-xl border border-white/[0.06] bg-black/40 px-4 py-3.5 font-mono text-tiny">
                      <dt className="text-ink-mute">price</dt>
                      <dd className="text-mist">{artist.price} sats</dd>
                      <dt className="text-ink-mute">link</dt>
                      <dd className="truncate text-mist">{PAY_LINK}</dd>
                      <dt className="text-ink-mute">pubkey</dt>
                      <dd className="truncate text-mist">
                        {artist.pubkey || "— not created yet —"}
                      </dd>
                      <dt className="text-ink-mute">status</dt>
                      <dd>
                        {artist.published ? (
                          <span className="chip chip-ok">Published ✓</span>
                        ) : (
                          <span className="chip">Draft</span>
                        )}
                      </dd>
                    </dl>
                    <Button disabled={busy || artist.published} onClick={publishArtist}>
                      {artist.published ? "Published" : "Run artist agent"}
                    </Button>
                  </>
                )}

                {showPayScenarios && (
                  <>
                    <p>
                      {scenario === "tidal" &&
                        "TIDAL hits the artist pay link like an API. Payment is per play / short lease — not a forever unlock."}
                      {scenario === "other" &&
                        "A second music app uses the same link. It does not inherit TIDAL’s payment — separate bill, same song."}
                      {scenario === "agent" &&
                        "A buyer agent discovers the 402 endpoint, pays, and unlocks authorized access for its principal."}
                    </p>

                    {scenario === "tidal" && (
                      <DoorCard
                        title="TIDAL"
                        subtitle="Store client"
                        state={apps.tidal}
                        active
                        busy={busy}
                        payDisabled={realPayBlocked}
                        live={realMode && liveReady}
                        stripeReady={stripeReady}
                        stripeLabel={realMode ? `Pay ${PRICE_STRIPE_LABEL} (card)` : `Pay ${PRICE_STRIPE_LABEL} (test card)`}
                        onPay={() => runPayFlow("tidal")}
                        onStripe={() => runStripeCheckout("tidal")}
                        onPlay={() => playSong("tidal")}
                      />
                    )}

                    {scenario === "other" && (
                      <DoorCard
                        title="The other app"
                        subtitle="Second store"
                        state={apps.other}
                        active
                        busy={busy}
                        payDisabled={realPayBlocked}
                        live={realMode && liveReady}
                        stripeReady={stripeReady}
                        stripeLabel={realMode ? `Pay ${PRICE_STRIPE_LABEL} (card)` : `Pay ${PRICE_STRIPE_LABEL} (test card)`}
                        onPay={() => runPayFlow("other")}
                        onStripe={() => runStripeCheckout("other")}
                        onPlay={() => playSong("other")}
                      />
                    )}

                    {scenario === "agent" && (
                      <DoorCard
                        title="Buyer agent"
                        subtitle="Autonomous payer"
                        state={apps.agent}
                        active
                        busy={busy}
                        payDisabled={realPayBlocked}
                        live={realMode && liveReady}
                        stripeReady={stripeReady}
                        stripeLabel={realMode ? `Pay ${PRICE_STRIPE_LABEL} (card)` : `Pay ${PRICE_STRIPE_LABEL} (test card)`}
                        onPay={() => runPayFlow("agent")}
                        onStripe={() => runStripeCheckout("agent")}
                        onPlay={() => playSong("agent")}
                      />
                    )}

                    {scenario === "agent" && realMode && liveReady && !apps.agent.paid && (
                      <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-small font-medium tracking-[-0.01em] text-mist">
                              Agent auto-pay
                            </div>
                            <div className="mt-0.5 text-tiny text-ink-mute">
                              The agent’s own NWC wallet settles the invoice — no human scan.
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy || !sidecar.canSpend}
                            onClick={runAgentAutoPay}
                            title={sidecar.canSpend ? undefined : "Agent wallet needs a small balance"}
                          >
                            <Zap className="size-3.5" strokeWidth={1.75} />
                            {sidecar.canSpend ? `Auto-pay ${PRICE_SATS} sats` : "Wallet empty"}
                          </Button>
                        </div>
                        {!sidecar.canSpend && (
                          <p className="mt-2.5 text-tiny text-ink-mute">
                            Top up the agent wallet to enable hands-free pay. Scanning
                            the invoice works either way.
                          </p>
                        )}
                      </div>
                    )}

                    {pending && pending.app === activeApp && (
                      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                          <a
                            href={`lightning:${pending.invoice}`}
                            className="mx-auto shrink-0 rounded-xl bg-white p-2 shadow-soft sm:mx-0"
                            aria-label="Open invoice in a Lightning wallet"
                          >
                            <img
                              src={pending.qr}
                              alt={`Lightning invoice QR for ${PRICE_SATS} sats`}
                              className="size-40 [image-rendering:pixelated]"
                            />
                          </a>
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex items-center gap-2 text-mist">
                              <Loader2 className="size-4 animate-spin text-amber-300" strokeWidth={1.75} />
                              <span className="text-small font-medium tracking-[-0.01em]">
                                Waiting for {PRICE_SATS} sats · {labelFor(pending.app)}
                              </span>
                            </div>
                            <p className="break-all rounded-lg border border-white/[0.06] bg-black/40 px-3 py-2 font-mono text-tiny text-ink-mute">
                              {pending.invoice.slice(0, 28)}…{pending.invoice.slice(-10)}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button size="sm" onClick={copyInvoice}>
                                <Copy className="size-3.5" strokeWidth={1.75} />
                                {copied ? "Copied" : "Copy invoice"}
                              </Button>
                              <Button size="sm" variant="secondary" asChild>
                                <a href={`lightning:${pending.invoice}`}>
                                  <ExternalLink className="size-3.5" strokeWidth={1.75} />
                                  Open wallet
                                </a>
                              </Button>
                              <button
                                type="button"
                                onClick={cancelPending}
                                className="px-2 text-tiny text-ink-mute underline-offset-4 hover:text-mist hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                            <p className="text-tiny text-ink-mute">
                              Expires in {formatCountdown(pending.expiresAt - now)} · settles
                              to the artist wallet; the sidecar verifies the preimage
                              before streaming.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {canPlay && (
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
                        <div className="mb-3 flex items-center gap-2 text-mist">
                          <CheckCircle2 className="size-4 text-emerald-400" strokeWidth={1.75} />
                          <span className="text-small font-medium tracking-[-0.01em]">
                            Paid ✓ · {labelFor(activeApp)}
                          </span>
                        </div>
                        <audio
                          ref={audioRef}
                          controls
                          src={apps[activeApp].audioSrc ?? SONG_URL}
                          className="w-full"
                          onEnded={() =>
                            setApps((prev) => ({
                              ...prev,
                              [activeApp]: { ...prev[activeApp], playing: false },
                            }))
                          }
                        />
                        <p className="mt-3 text-tiny leading-relaxed text-ink-mute">
                          {apps[activeApp].audioSrc
                            ? "Live unlock: streamed by the local sidecar after Lightning preimage or Stripe payment verify, on a short lease. Authorized access — not unbreakable DRM."
                            : "Pitch-grade unlock: audio ships in static assets after a confirmed demo pay. Production would stream only with verified payment. Authorized access — not unbreakable DRM."}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="min-h-[320px]">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Under the hood</CardTitle>
                {busy && <span className="chip">Running…</span>}
              </CardHeader>
              <CardContent>
                <div className="h-[340px] overflow-y-auto rounded-xl border border-white/[0.06] bg-black/50 p-4 font-mono text-tiny">
                  {logs.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                      <Sparkles className="size-5 text-ink-faint" strokeWidth={1.4} />
                      <p className="max-w-[14rem] text-ink-mute leading-relaxed">
                        Activity appears here: GET → 402 → pay → retry → 200 →
                        Playing
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3.5">
                      {logs.map((entry) => (
                        <li key={entry.id} className="leading-relaxed">
                          <span className="text-ink-faint">{entry.time}</span>{" "}
                          <span className={kindClass(entry.kind)}>
                            [{entry.kind}]
                          </span>{" "}
                          <span className="text-mist/90">{entry.text}</span>
                          {entry.detail && (
                            <div className="pl-3 pt-0.5 text-ink-mute">
                              {entry.detail}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-tiny text-ink-mute">
          <span className="inline-flex items-center gap-1.5">
            <Wallet className="size-3.5 opacity-70" strokeWidth={1.5} /> Demo =
            simulated L402 · {PRICE_SATS} sats per payer, no real funds move
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Music2 className="size-3.5 opacity-70" strokeWidth={1.5} />{" "}
            {SONG_CREDIT}
          </span>
        </div>
      </div>
    </section>
  );
}

function formatCountdown(seconds: number) {
  const s = Math.max(0, seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function labelFor(app: AppId) {
  if (app === "tidal") return "TIDAL";
  if (app === "other") return "The other app";
  return "Buyer agent";
}

function scenarioIcon(id: ScenarioId, inverted?: boolean) {
  const cls = `size-3.5 ${inverted ? "" : ""}`;
  if (id === "artist") return <KeyRound className={cls} strokeWidth={1.6} />;
  if (id === "tidal") return <Radio className={cls} strokeWidth={1.6} />;
  if (id === "other") return <Music2 className={cls} strokeWidth={1.6} />;
  return <Bot className={cls} strokeWidth={1.6} />;
}

function kindClass(kind: LogKind) {
  switch (kind) {
    case "ok":
      return "text-emerald-400";
    case "err":
      return "text-red-400";
    case "pay":
      return "text-amber-300";
    case "req":
      return "text-sky-300";
    case "res":
      return "text-violet-300";
    default:
      return "text-ink-mute";
  }
}

function DoorCard({
  title,
  subtitle,
  state,
  active,
  busy,
  payDisabled,
  live,
  stripeReady,
  stripeLabel,
  onPay,
  onStripe,
  onPlay,
}: {
  title: string;
  subtitle: string;
  state: AppState;
  active?: boolean;
  busy: boolean;
  payDisabled?: boolean;
  live?: boolean;
  stripeReady?: boolean;
  stripeLabel?: string;
  onPay: () => void;
  onStripe?: () => void;
  onPlay: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-calm ${
        active
          ? "border-white/15 bg-black/55 shadow-soft"
          : "border-white/[0.06] bg-black/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-small font-medium tracking-[-0.01em] text-mist">
            {title}
          </div>
          <div className="mt-0.5 text-tiny text-ink-mute">{subtitle}</div>
        </div>
        {state.paid ? (
          <span className="chip chip-ok">Paid ✓</span>
        ) : (
          <span className="chip">{PRICE_SATS} sats</span>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={busy || state.paid || !!payDisabled}
          onClick={onPay}
          title={
            payDisabled
              ? "Live Lightning sidecar not reachable — use card below or switch to Demo"
              : undefined
          }
        >
          {live && !state.paid && <Zap className="size-3.5" strokeWidth={1.75} />}
          {state.paid
            ? "Paid"
            : payDisabled
              ? "Lightning off"
              : live
                ? `Pay ${PRICE_SATS} sats`
                : "Pay link"}
        </Button>
        {stripeReady && onStripe && !state.paid && (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={onStripe}
            title={`Card fallback via Stripe at the ${PRICE_STRIPE_LABEL} card minimum. Separate from Lightning and x402.`}
          >
            <CreditCard className="size-3.5" strokeWidth={1.75} />
            {stripeLabel || `Pay ${PRICE_STRIPE_LABEL} (card)`}
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          disabled={!state.paid}
          onClick={onPlay}
        >
          Play
        </Button>
      </div>
      {payDisabled && !state.paid && !stripeReady && (
        <p className="mt-2.5 text-tiny text-amber-200/75">
          Switch to Demo to walk the pay flow.
        </p>
      )}
      {stripeReady && !state.paid && (
        <p className="mt-2.5 text-tiny text-ink-mute">
          Card fallback is {PRICE_STRIPE_LABEL} (Stripe minimum). Lightning stays
          the per-play path.
        </p>
      )}
    </div>
  );
}
