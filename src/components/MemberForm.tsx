'use client';

import { useState } from 'react';
import { useMemberStore } from '@/store/memberStore';
import { getMember, getInitials, TYPE_CONFIG } from '@/lib/memberUtils';
import { Member, Rel, Via } from '@/lib/types';
import { X, Search, Check, User, IdCard, Users, Phone, ArrowRightLeft, type LucideIcon } from 'lucide-react';
import styles from './MemberForm.module.css';

interface Props {
  onClose: () => void;
  editId?: string;
  defaultPid?: string;
}

function Field({
  label,
  type = 'text',
  readOnly,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  readOnly?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        readOnly={readOnly}
        className={styles.input}
        style={readOnly ? { opacity: 0.5 } : {}}
      />
    </div>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className={styles.sectionLabel}>
      <Icon size={11} />
      <span>{children}</span>
    </div>
  );
}

// Father/Mother: link to an existing member if they're already in the system,
// otherwise fall back to a plain name — mirrors how DetailPanel displays them
// (linked member's name takes priority, then the free-text name).
function ParentPicker({
  label,
  members,
  excludeId,
  valueId,
  valueName,
  onSelect,
  onTextChange,
  onClear,
}: {
  label: string;
  members: Member[];
  excludeId?: string;
  valueId?: string | null;
  valueName?: string;
  onSelect: (m: Member) => void;
  onTextChange: (v: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selected = valueId ? members.find(m => m.id === valueId) : null;

  const q = query.trim().toLowerCase();
  const matches = q && !selected
    ? members
        .filter(m => m.id !== excludeId && (m.name + ' ' + m.id).toLowerCase().includes(q))
        .slice(0, 6)
    : [];

  if (selected) {
    return (
      <div className={styles.field}>
        <label className={styles.label}>{label}</label>
        <div className={styles.pickerSelected}>
          <Check size={13} className={styles.pickerCheckIcon} />
          <span className={styles.pickerSelectedName}>{selected.name}</span>
          <span className={styles.pickerSelectedId}>{selected.id}</span>
          <button type="button" onClick={onClear} className={styles.pickerClearBtn}>
            <X size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.field} style={{ position: 'relative' }}>
      <label className={styles.label}>{label}</label>
      <div className={styles.pickerInputWrap}>
        <Search size={12} className={styles.pickerSearchIcon} />
        <input
          className={`${styles.input} ${styles.pickerInput}`}
          value={valueName ?? query}
          placeholder="Name — pick if already a member"
          onChange={e => {
            setQuery(e.target.value);
            onTextChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && matches.length > 0 && (
        <div className={styles.pickerDropdown}>
          {matches.map(m => (
            <div
              key={m.id}
              className={styles.pickerOption}
              onMouseDown={() => {
                onSelect(m);
                setQuery('');
                setOpen(false);
              }}
            >
              <span className={styles.pickerOptionAvatar}>{getInitials(m.name)}</span>
              <span className={styles.pickerOptionName}>{m.name}</span>
              <span className={styles.pickerOptionId}>{m.id}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MemberForm({ onClose, editId, defaultPid }: Props) {
  const { members, addMember, updateMember, deleteMember } = useMemberStore();
  const editing = editId ? getMember(members, editId) : null;
  const parentMember = defaultPid ? getMember(members, defaultPid) : null;

  const [form, setForm] = useState<Partial<Member>>({
    id: editing?.id ?? '',
    name: editing?.name ?? '',
    type: editing?.type ?? 'Permanent',
    via: editing?.via ?? 'core',
    gender: editing?.gender,
    since: editing?.since ?? '',
    email: editing?.email ?? '',
    phone: editing?.phone ?? '',
    pid: editing?.pid ?? defaultPid ?? '',
    rel: editing?.rel ?? null,
    fatherId: editing?.fatherId ?? undefined,
    motherId: editing?.motherId ?? undefined,
    fatherName: editing?.fatherName ?? editing?.father ?? '',
    motherName: editing?.motherName ?? editing?.mother ?? '',
    succession: editing?.succession ?? undefined,
    note: editing?.note ?? '',
  });

  const set = (k: keyof Member, v: string) =>
    setForm(f => ({ ...f, [k]: v || undefined }));

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.id || !form.name) {
      alert('Name and A/C number are required');
      return;
    }

    if (!editing && getMember(members, form.id!)) {
      alert('This A/C number already exists');
      return;
    }

    const member: Member = {
      ...(editing ?? {}),
      id: form.id!,
      name: form.name!,
      type: form.type || 'Permanent',
      via: (form.via as Via) || 'core',
      gender: form.gender as 'M' | 'F' | undefined,
      since: form.since || '',
      email: form.email,
      phone: form.phone,
      pid: form.pid || null,
      rel: (form.rel as Rel) || null,
      fatherId: form.fatherId,
      motherId: form.motherId,
      fatherName: form.fatherId ? undefined : form.fatherName,
      motherName: form.motherId ? undefined : form.motherName,
      succession: form.succession,
      note: form.note,
    };

    setSaving(true);
    try {
      if (editing) await updateMember(editId!, member);
      else await addMember(member);
      onClose();
    } catch {
      alert('Failed to save member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    const ok = confirm(
      `Delete ${editing.name} (${editing.id})? This also deletes everyone under their quota. This cannot be undone.`
    );
    if (!ok) return;

    setSaving(true);
    try {
      await deleteMember(editing.id);
      onClose();
    } catch {
      alert('Failed to delete member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>
            {editing ? 'Edit Member' : 'Add New Member'}
            {editing && <span className={styles.titleId}>{editId}</span>}
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

        <div className={styles.avatarPreviewWrap}>
          <div
            className={styles.avatarPreview}
            style={{ backgroundColor: (TYPE_CONFIG[(form.type as keyof typeof TYPE_CONFIG)] ?? TYPE_CONFIG.Permanent).color }}
          >
            {getInitials(form.name || '?')}
          </div>
        </div>

        <div className={styles.formBody}>
          <SectionLabel icon={User}>Basic Info</SectionLabel>
          <Field
            label="Full Name *"
            value={form.name ?? ''}
            onChange={v => set('name', v)}
          />
          <div className={styles.row2}>
            <Field
              label="A/C Number *"
              value={form.id ?? ''}
              onChange={v => set('id', v)}
              readOnly={!!editing}
            />
            <div className={styles.field}>
              <label className={styles.label}>Gender</label>
              <select
                value={form.gender ?? ''}
                onChange={e => setForm(f => ({ ...f, gender: (e.target.value || undefined) as 'M' | 'F' | undefined }))}
                className={styles.select}
              >
                <option value="">—</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
          </div>

          <SectionLabel icon={IdCard}>Membership</SectionLabel>
          <div className={styles.row2}>
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
                <option value="succession">Received via succession</option>
              </select>
            </div>
          </div>

          <div className={styles.row2}>
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
                <option value="grandchild">Grandchild</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Field
              label="Membership Date"
              value={form.since ?? ''}
              onChange={v => set('since', v)}
            />
          </div>

          {!defaultPid && !editing && (
            <Field
              label="Primary Member A/C, if any"
              value={form.pid ?? ''}
              onChange={v => set('pid', v)}
            />
          )}

          {editing && (
            <>
              <SectionLabel icon={ArrowRightLeft}>Account Transfer</SectionLabel>
              {/* <div className={styles.pickerHint}>
                If this member&apos;s A/C was transferred to someone else (e.g. after passing away), link that member below.
              </div> */}
              <ParentPicker
                label="Transferred To"
                members={members}
                excludeId={form.id}
                valueId={form.succession}
                valueName={undefined}
                onSelect={m => setForm(f => ({ ...f, succession: m.id }))}
                onTextChange={() => {}}
                onClear={() => setForm(f => ({ ...f, succession: undefined }))}
              />
            </>
          )}

          <SectionLabel icon={Users}>Family</SectionLabel>
          <div className={styles.pickerHint}>
            Search links an existing member automatically — otherwise it saves as plain text.
          </div>
          <ParentPicker
            label="Father"
            members={members}
            excludeId={form.id}
            valueId={form.fatherId}
            valueName={form.fatherName}
            onSelect={m => setForm(f => ({ ...f, fatherId: m.id, fatherName: undefined }))}
            onTextChange={v => setForm(f => ({ ...f, fatherName: v || undefined, fatherId: undefined }))}
            onClear={() => setForm(f => ({ ...f, fatherId: undefined, fatherName: undefined }))}
          />
          <ParentPicker
            label="Mother"
            members={members}
            excludeId={form.id}
            valueId={form.motherId}
            valueName={form.motherName}
            onSelect={m => setForm(f => ({ ...f, motherId: m.id, motherName: undefined }))}
            onTextChange={v => setForm(f => ({ ...f, motherName: v || undefined, motherId: undefined }))}
            onClear={() => setForm(f => ({ ...f, motherId: undefined, motherName: undefined }))}
          />

          <SectionLabel icon={Phone}>Contact & Notes</SectionLabel>
          <div className={styles.row2}>
            <Field
              label="Email"
              type="email"
              value={form.email ?? ''}
              onChange={v => set('email', v)}
            />
            <Field
              label="Phone"
              type="tel"
              value={form.phone ?? ''}
              onChange={v => set('phone', v)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Note</label>
            <textarea
              value={form.note ?? ''}
              onChange={e => set('note', e.target.value)}
              className={styles.textarea}
              rows={2}
            />
          </div>
        </div>

        <div className={styles.actions}>
          {editing && (
            <button onClick={handleDelete} className={styles.deleteBtn} disabled={saving}>
              Delete
            </button>
          )}
          <button onClick={onClose} className={styles.cancelBtn} disabled={saving}>Cancel</button>
          <button onClick={handleSave} className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
