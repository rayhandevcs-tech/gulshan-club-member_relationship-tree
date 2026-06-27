'use client';

import { useState, useTransition } from 'react';
import type { Member as DBMember } from '@prisma/client';
import { addMember } from '@/app/dynamic/actions';
import { X } from 'lucide-react';

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
    acNo: '',
    name: '',
    gender: '',
    birthDate: '',
    memberType: 'Permanent',
    joinedDate: '',
    email: '',
    phone: '',
    memberId: '',
    notes: '',
    // structural
    pidAc: '',
    relType: '',
    // bio parents
    fatherAc: '',
    fatherName: '',
    motherAc: '',
    motherName: '',
    spouseAc: '',
    // quota grant
    grantorAc: '',
    grantType: 'A4D',
    slotNo: '',
    articleRef: '',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.acNo.trim() || !form.name.trim()) {
      setError('A/C No and Name are required.');
      return;
    }
    if (members.find(m => m.acNo === form.acNo.trim())) {
      setError(`A/C No "${form.acNo}" already exists.`);
      return;
    }

    startTransition(async () => {
      try {
        await addMember({
          acNo: form.acNo.trim(),
          name: form.name.trim(),
          gender: form.gender || undefined,
          birthDate: form.birthDate || undefined,
          memberType: form.memberType,
          joinedDate: form.joinedDate || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          memberId: form.memberId || undefined,
          notes: form.notes || undefined,
          pidAc: form.pidAc || undefined,
          relType: form.relType || undefined,
          fatherAc: form.fatherAc || undefined,
          fatherName: form.fatherName || undefined,
          motherAc: form.motherAc || undefined,
          motherName: form.motherName || undefined,
          spouseAc: form.spouseAc || undefined,
          grantorAc: form.grantorAc || undefined,
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
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">Add Member</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Basic info */}
          <Section title="Basic Info">
            <Row>
              <Field label="A/C No *" value={form.acNo} onChange={v => set('acNo', v)} placeholder="e.g. LM-11" />
              <Field label="Member ID" value={form.memberId} onChange={v => set('memberId', v)} placeholder="e.g. LM000066" />
            </Row>
            <Field label="Full Name *" value={form.name} onChange={v => set('name', v)} placeholder="Full name" />
            <Row>
              <SelectField label="Type" value={form.memberType} onChange={v => set('memberType', v)} options={MEMBER_TYPES} />
              <SelectField label="Gender" value={form.gender} onChange={v => set('gender', v)} options={['M', 'F']} placeholder="—" />
            </Row>
            <Row>
              <Field label="Joined Date" value={form.joinedDate} onChange={v => set('joinedDate', v)} placeholder="DD/MM/YYYY" />
              <Field label="Birth Date" value={form.birthDate} onChange={v => set('birthDate', v)} placeholder="DD/MM/YYYY" />
            </Row>
            <Row>
              <Field label="Phone" value={form.phone} onChange={v => set('phone', v)} placeholder="+880…" />
              <Field label="Email" value={form.email} onChange={v => set('email', v)} placeholder="email@…" />
            </Row>
            <Field label="Notes" value={form.notes} onChange={v => set('notes', v)} placeholder="Any notes…" multiline />
          </Section>

          {/* Club structure */}
          <Section title="Club Structure (pid/rel)">
            <Row>
              <SelectMember label="Parent A/C (pid)" value={form.pidAc} onChange={v => set('pidAc', v)} members={members} />
              <SelectField label="Relation" value={form.relType} onChange={v => set('relType', v)} options={REL_TYPES} placeholder="—" />
            </Row>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              pid = whose slot this sits under in the club hierarchy. rel = how this member relates to pid.
            </p>
          </Section>

          {/* Bio parents */}
          <Section title="Biological Parents">
            <Row>
              <SelectMember label="Father A/C" value={form.fatherAc} onChange={v => set('fatherAc', v)} members={members} />
              <Field label="Father Name (if not member)" value={form.fatherName} onChange={v => set('fatherName', v)} placeholder="Free text" />
            </Row>
            <Row>
              <SelectMember label="Mother A/C" value={form.motherAc} onChange={v => set('motherAc', v)} members={members} />
              <Field label="Mother Name (if not member)" value={form.motherName} onChange={v => set('motherName', v)} placeholder="Free text" />
            </Row>
            <SelectMember label="Spouse A/C (bio link)" value={form.spouseAc} onChange={v => set('spouseAc', v)} members={members} />
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              These are biological links, separate from club structure above.
            </p>
          </Section>

          {/* Quota grant */}
          <Section title="Quota Grant (if applicable)">
            <SelectMember label="Granted by (grantor A/C)" value={form.grantorAc} onChange={v => set('grantorAc', v)} members={members} />
            <Row>
              <SelectField label="Grant Type" value={form.grantType} onChange={v => set('grantType', v)} options={['A4D', 'Associate']} />
              <Field label="Slot No" value={form.slotNo} onChange={v => set('slotNo', v)} placeholder="1 or 2" />
              <Field label="Article" value={form.articleRef} onChange={v => set('articleRef', v)} placeholder="Article 4" />
            </Row>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              Fill only if this member was granted a specific quota slot.
            </p>
          </Section>

          {error && (
            <div className="text-[11px] text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">{error}</div>
          )}
        </form>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[12px] border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-[12px] bg-blue-500 text-white hover:bg-blue-600 font-medium transition-colors disabled:opacity-50"
          >
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
    <div>
      <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{title}</div>
      <div className="space-y-2 bg-gray-50 dark:bg-gray-800/40 rounded-xl p-3">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2">{children}</div>;
}

function Field({
  label, value, onChange, placeholder, multiline,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean;
}) {
  const cls = "flex-1 min-w-0 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-[12px] bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-blue-300 dark:focus:border-blue-600";
  return (
    <div className="flex-1 min-w-0">
      <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{label}</label>
      {multiline
        ? <textarea rows={2} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls + ' resize-none'} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
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
    <div className="flex-1 min-w-0">
      <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-[12px] bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-300 dark:focus:border-blue-600"
      >
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
    <div className="flex-1 min-w-0">
      <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-[12px] bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-300 dark:focus:border-blue-600"
      >
        <option value="">— none —</option>
        {members.map(m => (
          <option key={m.acNo} value={m.acNo}>{m.acNo} · {m.name}</option>
        ))}
      </select>
    </div>
  );
}
