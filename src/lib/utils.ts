import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve a file in `public/` against Vite's base URL, so the same build works
 * at a custom domain (`/`) and at project Pages (`/music-pitch/`).
 */
export function asset(p: string) {
  return `${import.meta.env.BASE_URL}${p.replace(/^\//, "")}`;
}
