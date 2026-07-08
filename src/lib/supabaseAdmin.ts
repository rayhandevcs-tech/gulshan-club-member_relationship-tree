import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Service-role client — server-side only (bypasses RLS). Never import this
// from a client component or expose the key to the browser.
// Built lazily (not at module load) so the build doesn't crash in
// environments where these env vars aren't set yet (e.g. a fresh Vercel
// deploy before the Storage env vars are configured).
let _client: SupabaseClient | undefined;
export const getSupabaseAdmin = (): SupabaseClient => {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
  }
  return _client;
};

export const PHOTOS_BUCKET = 'member-photos';

// Only our own Storage URLs (member-photos bucket) have a deletable key —
// anything else (an old inline base64 photo, an external URL) is left alone.
export const photoKeyFromUrl = (url?: string | null): string | null => {
  if (!url || !url.includes(`/storage/v1/object/public/${PHOTOS_BUCKET}/`)) return null;
  return url.split('/').pop() ?? null;
};
