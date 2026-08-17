// src/lib/membersCache.ts
//
// Browser-side copy of the last roster this device successfully loaded.
//
// Assembling the roster costs the server one upstream call per member (see
// src/app/api/ext-members/cache.ts). Even with that cached server-side, a
// returning visitor still waits on the download + parse before anything is
// drawn. Keeping the payload here lets the app paint the tree from the
// previous visit immediately and swap in fresh data when it lands.
//
// Deliberately best-effort: storage can be full, disabled, or holding a
// payload from an older shape. Every failure path just means "no cache" —
// the app then behaves exactly as it did before this existed.

import { useSyncExternalStore } from 'react';
import type { Member } from './types';

const KEY = 'gulshan-club-members-v1';

// Older than this and we'd rather show nothing than something misleading.
const MAX_AGE_MS = 24 * 60 * 60_000;

// localStorage tops out around 5MB in most browsers; anything near that is
// not worth the main-thread cost of serialising it either.
const MAX_BYTES = 4_000_000;

type Envelope = { at: number; members: Member[] };

export function readCachedMembers(): Member[] | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return undefined;

    const parsed = JSON.parse(raw) as Envelope;
    if (!parsed?.at || !Array.isArray(parsed.members) || parsed.members.length === 0) return undefined;
    if (Date.now() - parsed.at > MAX_AGE_MS) {
      window.localStorage.removeItem(KEY);
      return undefined;
    }
    return parsed.members;
  } catch {
    return undefined;
  }
}

// Read at most once per page load, and never during the server render — the
// server has no localStorage, so it must report "nothing cached" and let the
// client swap in the real answer right after hydration (which is exactly what
// useSyncExternalStore's server-snapshot argument is for).
const UNSET = Symbol('unset');
let snapshot: Member[] | undefined | typeof UNSET = UNSET;

const subscribe = () => () => {};              // stable: never changes after load
const serverSnapshot = () => undefined;

function clientSnapshot(): Member[] | undefined {
  if (snapshot === UNSET) snapshot = readCachedMembers();
  return snapshot;
}

/** The previous visit's roster, or undefined (always undefined on the server). */
export function useCachedMembers(): Member[] | undefined {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}

export function writeCachedMembers(members: Member[]): void {
  if (typeof window === 'undefined' || !Array.isArray(members) || members.length === 0) return;

  // Serialising a few MB is slow enough to be worth keeping off the critical
  // path — this runs when the browser is next idle, not during the render
  // that just received the data.
  const run = () => {
    try {
      const raw = JSON.stringify({ at: Date.now(), members } satisfies Envelope);
      if (raw.length > MAX_BYTES) return;
      window.localStorage.setItem(KEY, raw);
    } catch {
      // quota exceeded / private mode / storage disabled — nothing to do
      try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
    }
  };

  const idle = (window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  }).requestIdleCallback;

  if (idle) idle(run, { timeout: 4000 });
  else window.setTimeout(run, 1200);
}
