/** Uploaded photos are served only by the Lovable-hosted app (it holds the private storage key). */
const MEDIA_ORIGIN = "https://chorui.lovable.app";

function onLovableHost(): boolean {
  if (typeof window === "undefined") {
    // Server render: Vercel sets VERCEL=1; elsewhere keep relative paths.
    const env = typeof process !== "undefined" ? process.env : undefined;
    return !env?.VERCEL;
  }
  const host = window.location.hostname;
  return host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com") || host === "localhost";
}

export function resolveMediaUrl(src: string): string {
  if (!src || !(src.startsWith("/api/public/media/") || src.startsWith("/__l5e/"))) return src;
  return onLovableHost() ? src : MEDIA_ORIGIN + src;
}
