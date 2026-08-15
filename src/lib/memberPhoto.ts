// src/lib/memberPhoto.ts
//
// The club's membership system serves member photos over PLAIN HTTP, e.g.
//   http://118.179.152.53/myWeb01/Images/068/Member/PA-79.JPG
// (that's the literal `img` value coming back from /coremember and
// /mtreedata — see convertApiData.ts, which stores it as Member.photoUrl).
//
// That works while the app itself is served over http://localhost, but the
// moment it's deployed behind HTTPS (Vercel) every browser treats those
// images as MIXED CONTENT: Chrome/Edge silently auto-upgrade the request to
// https://118.179.152.53/... — which that server doesn't speak — and then
// drop it; Firefox/Safari just block it. Result: names and cards render
// fine (the JSON is fetched server-side by /api/ext-members, so it never
// hits the mixed-content rule) but every avatar comes up blank.
//
// Fix: don't let the browser talk to the club server at all. Rewrite each
// photo URL to our own same-origin /api/member-photo route (see
// src/app/api/member-photo/route.ts), which fetches the image server-side
// over HTTP and re-serves it over the page's own HTTPS origin.

export const PHOTO_PROXY_PATH = '/api/member-photo';

// Only these upstream origins may be proxied — an open image proxy would let
// anyone use this deployment to fetch arbitrary internal URLs (SSRF).
export const ALLOWED_PHOTO_HOSTS: readonly string[] = ['118.179.152.53'];

// ...and only from the membership system's image folder.
const ALLOWED_PATH_PREFIX = '/myweb01/images/';

/** Is `raw` an upstream club photo URL we're willing to fetch server-side? */
export function isAllowedPhotoUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  if (!ALLOWED_PHOTO_HOSTS.includes(u.hostname)) return false;
  // The API is inconsistent about casing ("myweb01" in endpoint paths vs
  // "myWeb01" in img values), so match case-insensitively.
  return u.pathname.toLowerCase().startsWith(ALLOWED_PATH_PREFIX);
}

/**
 * Browser-safe URL for a raw `img` value off the club API.
 *
 * - a club photo URL (http or https) → same-origin proxy path
 * - anything already local/relative or a data: URI → returned untouched
 * - empty / unusable → undefined, so callers fall back to initials
 */
export function toProxiedPhotoUrl(raw: string | null | undefined): string | undefined {
  const src = (raw ?? '').trim();
  if (!src) return undefined;

  if (isAllowedPhotoUrl(src)) {
    return `${PHOTO_PROXY_PATH}?src=${encodeURIComponent(src)}`;
  }

  // Relative paths ("/uploads/x.jpg"), inline data: URIs and third-party
  // HTTPS URLs already load fine from a secure page — nothing to proxy.
  if (src.startsWith('/') || src.startsWith('data:') || src.startsWith('https://')) return src;

  // Everything else — an off-allowlist http:// URL (same mixed-content wall,
  // but not something we're willing to fetch server-side), or junk that isn't
  // a URL at all — is dropped, so the initials fallback takes over instead of
  // rendering a permanently broken box.
  return undefined;
}
