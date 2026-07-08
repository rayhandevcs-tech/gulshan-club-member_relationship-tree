import { Member } from './types';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export const fetchMembers = (): Promise<Member[]> =>
  fetch('/api/members').then(handle<Member[]>);

export const createMemberApi = (member: Member): Promise<Member> =>
  fetch('/api/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(member),
  }).then(handle<Member>);

export const updateMemberApi = (id: string, data: Partial<Member>): Promise<Member> =>
  fetch(`/api/members/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handle<Member>);

export const deleteMemberApi = (id: string): Promise<{ deletedIds: string[] }> =>
  fetch(`/api/members/${id}`, { method: 'DELETE' }).then(handle<{ deletedIds: string[] }>);

export const uploadPhoto = (blob: Blob): Promise<{ url: string; key: string }> => {
  const formData = new FormData();
  formData.append('file', blob, 'photo.jpg');
  return fetch('/api/upload', { method: 'POST', body: formData }).then(handle<{ url: string; key: string }>);
};

// Only our own Storage URLs (member-photos bucket) have a deletable key —
// anything else (an old inline base64 photo, an external URL) is left alone.
export const photoStorageKey = (url?: string | null): string | null => {
  if (!url || !url.includes('/storage/v1/object/public/member-photos/')) return null;
  return url.split('/').pop() ?? null;
};

export const deletePhoto = (key: string): Promise<{ ok: true }> =>
  fetch(`/api/upload?key=${encodeURIComponent(key)}`, { method: 'DELETE' }).then(handle<{ ok: true }>);
