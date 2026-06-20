'use client';

import { useState } from 'react';
import { useMemberStore } from '@/store/memberStore';
import { getMember, TYPE_CONFIG } from '@/lib/memberUtils';
import { Member, MemberType, RelationType } from '@/lib/types';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
  editId?: string;
  defaultPid?: string;
}

export default function MemberForm({ onClose, editId, defaultPid }: Props) {
  const { members, addMember, updateMember } = useMemberStore();
  const editing = editId ? getMember(members, editId) : null;
  const parentMember = defaultPid ? getMember(members, defaultPid) : null;

  const [form, setForm] = useState<Partial<Member>>({
    id: editing?.id ?? '',
    name: editing?.name ?? '',
    type: editing?.type ?? 'Permanent',
    since: editing?.since ?? '',
    email: editing?.email ?? '',
    phone: editing?.phone ?? '',
    pid: editing?.pid ?? defaultPid ?? '',
    rel: editing?.rel ?? null,
    father: editing?.father ?? '',
    mother: editing?.mother ?? '',
    note: editing?.note ?? '',
  });

  const set = (k: keyof Member, v: string) =>
    setForm(f => ({ ...f, [k]: v || undefined }));

  const handleSave = () => {
    if (!form.id || !form.name) {
      alert('Name and A/C number are required');
      return;
    }

    if (!editing && getMember(members, form.id!)) {
      alert('This A/C number already exists');
      return;
    }

    const member: Member = {
      id: form.id!,
      name: form.name!,
      type: (form.type as MemberType) || 'Permanent',
      since: form.since || '',
      email: form.email,
      phone: form.phone,
      pid: form.pid || null,
      rel: (form.rel as RelationType) || null,
      father: form.father,
      mother: form.mother,
      note: form.note,
    };

    if (editing) updateMember(editId!, member);
    else addMember(member);

    onClose();
  };

  const Field = ({
    label,
    id,
    type = 'text',
    readOnly,
  }: {
    label: string;
    id: keyof Member;
    type?: string;
    readOnly?: boolean;
  }) => (
    <div className="mb-2">
      <label className="block text-[10px] text-gray-400 mb-0.5">
        {label}
      </label>
      <input
        type={type}
        value={(form[id] as string) ?? ''}
        onChange={e => set(id, e.target.value)}
        readOnly={readOnly}
        className="w-full px-2 py-1.5 text-[12px] border border-gray-200 rounded-lg bg-white text-gray-800 focus:outline-none focus:border-blue-300 disabled:opacity-50"
        style={readOnly ? { opacity: 0.5 } : {}}
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-gray-200 w-[calc(100vw-2rem)] max-w-xs max-h-[90vh] overflow-y-auto p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="text-[13px] font-medium text-gray-800">
            {editing ? `Edit · ${editId}` : 'Add New Member'}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        {parentMember && (
          <div className="text-[10px] text-gray-400 bg-gray-50 rounded-lg px-2 py-1.5 mb-3">
            Primary: {parentMember.name} ({parentMember.id})
          </div>
        )}

        <Field label="Full Name *" id="name" />
        <Field label="A/C Number *" id="id" readOnly={!!editing} />

        <div className="mb-2">
          <label className="block text-[10px] text-gray-400 mb-0.5">
            Membership Type
          </label>
          <select
            value={form.type}
            onChange={e =>
              setForm(f => ({ ...f, type: e.target.value as MemberType }))
            }
            className="w-full px-2 py-1.5 text-[12px] border border-gray-200 rounded-lg bg-white text-gray-800"
          >
            {Object.keys(TYPE_CONFIG).map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="mb-2">
          <label className="block text-[10px] text-gray-400 mb-0.5">
            Relationship
          </label>
          <select
            value={form.rel ?? ''}
            onChange={e =>
              setForm(f => ({
                ...f,
                rel: (e.target.value as RelationType) || null,
              }))
            }
            className="w-full px-2 py-1.5 text-[12px] border border-gray-200 rounded-lg bg-white text-gray-800"
          >
            <option value="">Primary Member</option>
            <option value="spouse">Spouse</option>
            <option value="a4d">A4D Child</option>
            <option value="associate">Associate</option>
            <option value="nominee">Nominee Corporate</option>
          </select>
        </div>

        {!defaultPid && !editing && (
          <Field label="Primary Member A/C, if any" id="pid" />
        )}

        <Field label="Membership Date (DD/MM/YYYY)" id="since" />
        <Field label="Father's Name" id="father" />
        <Field label="Mother's Name" id="mother" />
        <Field label="Email" id="email" type="email" />
        <Field label="Phone" id="phone" type="tel" />
        <Field label="Note" id="note" />

        <div className="flex gap-2 mt-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-[11px] border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 text-[11px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            {editing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}