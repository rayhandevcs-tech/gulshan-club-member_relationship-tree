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
