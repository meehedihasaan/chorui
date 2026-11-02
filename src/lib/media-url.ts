/** Uploaded photos are served only by the Lovable-hosted app (it holds the private storage key). */
const MEDIA_ORIGIN = "https://chorui.lovable.app";

export function resolveMediaUrl(src: string): string {
  if (!src || !src.startsWith("/api/public/media/")) return src;
  if (typeof window === "undefined") return src;
  const host = window.location.hostname;
  const onLovable = host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com") || host === "localhost";
  return onLovable ? src : MEDIA_ORIGIN + src;
}
