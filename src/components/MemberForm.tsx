'use client';

import { useState } from 'react';
import { useMemberStore } from '@/store/memberStore';
import { getMember, TYPE_CONFIG } from '@/lib/memberUtils';
import { Member, Rel, Via } from '@/lib/types';
import { X } from 'lucide-react';
import styles from './MemberForm.module.css';

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
    via: editing?.via ?? 'core',
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
      type: form.type || 'Permanent',
      via: (form.via as Via) || 'core',
      since: form.since || '',
      email: form.email,
      phone: form.phone,
      pid: form.pid || null,
      rel: (form.rel as Rel) || null,
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
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input
        type={type}
        value={(form[id] as string) ?? ''}
        onChange={e => set(id, e.target.value)}
        readOnly={readOnly}
        className={styles.input}
        style={readOnly ? { opacity: 0.5 } : {}}
      />
    </div>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>
            {editing ? `Edit · ${editId}` : 'Add New Member'}
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={16} />
          </button>
        </div>

        {parentMember && (
          <div className={styles.parentBadge}>
            Primary: {parentMember.name} ({parentMember.id})
          </div>
        )}

        <Field label="Full Name *" id="name" />
        <Field label="A/C Number *" id="id" readOnly={!!editing} />

        <div className={styles.field}>
          <label className={styles.label}>Membership Type</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className={styles.select}
          >
            {Object.keys(TYPE_CONFIG).map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Access</label>
          <select
            value={form.via ?? 'core'}
            onChange={e => setForm(f => ({ ...f, via: e.target.value as Via }))}
            className={styles.select}
          >
            <option value="core">Own membership</option>
            <option value="a4d">Via 4(d) quota</option>
            <option value="associate">Associate</option>
            <option value="nominee">Nominee Corporate</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Relationship</label>
          <select
            value={form.rel ?? ''}
            onChange={e => setForm(f => ({ ...f, rel: (e.target.value as Rel) || null }))}
            className={styles.select}
          >
            <option value="">Primary Member</option>
            <option value="spouse">Spouse</option>
            <option value="child">Child</option>
            <option value="other">Other</option>
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

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSave} className={styles.saveBtn}>
            {editing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
