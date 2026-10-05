import { asset } from "@/lib/utils";

export type ScenarioId = "artist" | "tidal" | "other" | "agent";

export type AppId = "tidal" | "other" | "agent";

export type LogKind = "req" | "res" | "info" | "ok" | "err" | "pay";

export type LogEntry = {
  id: number;
  time: string;
  kind: LogKind;
  text: string;
  detail?: string;
};

export type AppState = {
  paid: boolean;
  playing: boolean;
  token: string | null;
  preimage: string | null;
  /** Real mode: lease-gated stream URL from the local sidecar. Demo uses SONG_URL. */
  audioSrc: string | null;
};

export const PRICE_SATS = 21;
/** Stripe card minimum — optional card path, separate from Lightning. */
export const PRICE_STRIPE_CENTS = 50;
export const PRICE_STRIPE_LABEL = "$0.50";
export const SONG_ID = "soul-hymn";
export const SONG_TITLE = "Soul Hymn";
export const SONG_URL = asset("songs/soul-hymn.mp3");
/** Receive address for the local sidecar (agent auto-pay). Not shown on the public build. */
export const LIGHTNING_ADDRESS = "tidalagent@getalby.com";
export const PAY_LINK = "https://music.example/x402/soul-hymn";
