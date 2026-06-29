'use client';

import { useState, useTransition } from 'react';
import type { Member as DBMember } from '@prisma/client';
import { addMember } from '@/app/dynamic/actions';
import { X } from 'lucide-react';
import styles from './AddMemberModal.module.css';

const MEMBER_TYPES = ['Life', 'Permanent', 'Donor', 'Senior', 'A4D', 'Associate', 'Corporate', 'Honorary', 'Foreign'];
const REL_TYPES = ['child', 'spouse', 'a4d', 'associate', 'nominee'];

export default function AddMemberModal({
  members,
  onClose,
}: {
  members: DBMember[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    acNo: '', name: '', gender: '', birthDate: '', memberType: 'Permanent',
    joinedDate: '', email: '', phone: '', memberId: '', notes: '',
    pidAc: '', relType: '', fatherAc: '', fatherName: '', motherAc: '',
    motherName: '', spouseAc: '', grantorAc: '', grantType: 'A4D', slotNo: '', articleRef: '',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.acNo.trim() || !form.name.trim()) { setError('A/C No and Name are required.'); return; }
    if (members.find(m => m.acNo === form.acNo.trim())) { setError(`A/C No "${form.acNo}" already exists.`); return; }

    startTransition(async () => {
      try {
        await addMember({
          acNo: form.acNo.trim(), name: form.name.trim(),
          gender: form.gender || undefined, birthDate: form.birthDate || undefined,
          memberType: form.memberType, joinedDate: form.joinedDate || undefined,
          email: form.email || undefined, phone: form.phone || undefined,
          memberId: form.memberId || undefined, notes: form.notes || undefined,
          pidAc: form.pidAc || undefined, relType: form.relType || undefined,
          fatherAc: form.fatherAc || undefined, fatherName: form.fatherName || undefined,
          motherAc: form.motherAc || undefined, motherName: form.motherName || undefined,
          spouseAc: form.spouseAc || undefined, grantorAc: form.grantorAc || undefined,
          grantType: form.grantType || undefined,
          slotNo: form.slotNo ? parseInt(form.slotNo) : undefined,
          articleRef: form.articleRef || undefined,
        });
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add Member</h2>
          <button onClick={onClose} className={styles.closeBtn}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Section title="Basic Info">
            <div className={styles.row}>
              <Field label="A/C No *" value={form.acNo} onChange={v => set('acNo', v)} placeholder="e.g. LM-11" />
              <Field label="Member ID" value={form.memberId} onChange={v => set('memberId', v)} placeholder="e.g. LM000066" />
            </div>
            <Field label="Full Name *" value={form.name} onChange={v => set('name', v)} placeholder="Full name" />
            <div className={styles.row}>
              <SelectField label="Type" value={form.memberType} onChange={v => set('memberType', v)} options={MEMBER_TYPES} />
              <SelectField label="Gender" value={form.gender} onChange={v => set('gender', v)} options={['M', 'F']} placeholder="—" />
            </div>
            <div className={styles.row}>
              <Field label="Joined Date" value={form.joinedDate} onChange={v => set('joinedDate', v)} placeholder="DD/MM/YYYY" />
              <Field label="Birth Date" value={form.birthDate} onChange={v => set('birthDate', v)} placeholder="DD/MM/YYYY" />
            </div>
            <div className={styles.row}>
              <Field label="Phone" value={form.phone} onChange={v => set('phone', v)} placeholder="+880…" />
              <Field label="Email" value={form.email} onChange={v => set('email', v)} placeholder="email@…" />
            </div>
            <Field label="Notes" value={form.notes} onChange={v => set('notes', v)} placeholder="Any notes…" multiline />
          </Section>

          <Section title="Club Structure (pid/rel)">
            <div className={styles.row}>
              <SelectMember label="Parent A/C (pid)" value={form.pidAc} onChange={v => set('pidAc', v)} members={members} />
              <SelectField label="Relation" value={form.relType} onChange={v => set('relType', v)} options={REL_TYPES} placeholder="—" />
            </div>
            <p className={styles.hint}>pid = whose slot this sits under in the club hierarchy. rel = how this member relates to pid.</p>
          </Section>

          <Section title="Biological Parents">
            <div className={styles.row}>
              <SelectMember label="Father A/C" value={form.fatherAc} onChange={v => set('fatherAc', v)} members={members} />
              <Field label="Father Name (if not member)" value={form.fatherName} onChange={v => set('fatherName', v)} placeholder="Free text" />
            </div>
            <div className={styles.row}>
              <SelectMember label="Mother A/C" value={form.motherAc} onChange={v => set('motherAc', v)} members={members} />
              <Field label="Mother Name (if not member)" value={form.motherName} onChange={v => set('motherName', v)} placeholder="Free text" />
            </div>
            <SelectMember label="Spouse A/C (bio link)" value={form.spouseAc} onChange={v => set('spouseAc', v)} members={members} />
            <p className={styles.hint}>These are biological links, separate from club structure above.</p>
          </Section>

          <Section title="Quota Grant (if applicable)">
            <SelectMember label="Granted by (grantor A/C)" value={form.grantorAc} onChange={v => set('grantorAc', v)} members={members} />
            <div className={styles.row}>
              <SelectField label="Grant Type" value={form.grantType} onChange={v => set('grantType', v)} options={['A4D', 'Associate']} />
              <Field label="Slot No" value={form.slotNo} onChange={v => set('slotNo', v)} placeholder="1 or 2" />
              <Field label="Article" value={form.articleRef} onChange={v => set('articleRef', v)} placeholder="Article 4" />
            </div>
            <p className={styles.hint}>Fill only if this member was granted a specific quota slot.</p>
          </Section>

          {error && <div className={styles.error}>{error}</div>}
        </form>

        <div className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={isPending} className={styles.saveBtn}>
            {isPending ? 'Saving…' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Form helpers ──────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, multiline,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {multiline
        ? <textarea rows={2} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={styles.textarea} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={styles.input} />
      }
    </div>
  );
}

function SelectField({
  label, value, onChange, options, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={styles.select}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SelectMember({
  label, value, onChange, members,
}: {
  label: string; value: string; onChange: (v: string) => void; members: DBMember[];
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={styles.select}>
        <option value="">— none —</option>
        {members.map(m => (
          <option key={m.acNo} value={m.acNo}>{m.acNo} · {m.name}</option>
        ))}
      </select>
    </div>
  );
}
