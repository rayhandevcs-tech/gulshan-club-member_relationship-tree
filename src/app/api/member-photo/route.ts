// src/app/api/member-photo/route.ts
//
// Same-origin image proxy for member photos.
//
// The club system hands out photo URLs on plain HTTP (see
// src/lib/memberPhoto.ts for the full why). A browser on an HTTPS
// deployment refuses to load those, so instead of pointing <div
// background-image> straight at the club server, every avatar points here:
//
//   /api/member-photo?src=http%3A%2F%2F118.179.152.53%2FmyWeb01%2FImages%2F...
//
// This handler runs on the server — where plain HTTP to the club system is
// fine, exactly like /api/ext-members already does — and re-serves the bytes
// over this app's own origin.
//
// `src` is checked against an allowlist (host + path prefix) so this can't be
// used as an open proxy into arbitrary hosts.

import { isAllowedPhotoUrl } from '@/lib/memberPhoto';

// Reading the query string makes this request-time work regardless, but be
// explicit: every request carries a different `src`.
export const dynamic = 'force-dynamic';

// Photos are static per member; let the browser and the CDN hold on to them.
const CACHE_HEADER = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800';

const UPSTREAM_TIMEOUT_MS = 10_000;

// A miss must NOT return an error page — the avatar is a CSS background, so
// anything that isn't a decodable image just leaves the circle blank. 404
// with an empty body keeps that quiet and keeps failures out of the CDN.
const miss = (status: number) =>
  new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET(request: Request) {
  const src = new URL(request.url).searchParams.get('src');
  if (!src) return miss(400);
  if (!isAllowedPhotoUrl(src)) return miss(400);

  try {
    const upstream = await fetch(src, {
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!upstream.ok) return miss(404);

    const contentType = upstream.headers.get('content-type') ?? '';
    // The club server sometimes answers a missing photo with an HTML error
    // page at 200 — don't pass that off as an image. Fall back to JPEG when
    // it sends no content-type at all, which it also does.
    if (contentType && !contentType.startsWith('image/')) return miss(404);

    const body = await upstream.arrayBuffer();
    if (body.byteLength === 0) return miss(404);

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        'Content-Length': String(body.byteLength),
        'Cache-Control': CACHE_HEADER,
      },
    });
  } catch (err) {
    console.error('[member-photo]', src, err);
    return miss(502);
  }
}
