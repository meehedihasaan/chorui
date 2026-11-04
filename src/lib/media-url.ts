/**
 * Uploaded photos are served only by the Lovable-hosted app (it holds the private storage key).
 * Always point at the live site so server and browser render the same address on every host
 * (Lovable, Vercel, localhost) — a host check here caused hydration to keep a broken relative src.
 */
const MEDIA_ORIGIN = "https://chorui.lovable.app";

const MEDIA_PREFIXES = ["/api/public/media/", "/api/public/link-image", "/__l5e/"];

export function resolveMediaUrl(src: string): string {
  if (!src || !MEDIA_PREFIXES.some((p) => src.startsWith(p))) return src;
  return MEDIA_ORIGIN + src;
}
