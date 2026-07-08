'use client';

import { useRef, useState } from 'react';
import { useMemberStore } from '@/store/memberStore';
import { getMember, getInitials, TYPE_CONFIG } from '@/lib/memberUtils';
import { uploadPhoto, deletePhoto, photoStorageKey } from '@/lib/api';
import { Member, Rel, Via } from '@/lib/types';
import { X, Search, Check, User, IdCard, Users, Phone, ArrowRightLeft, Camera, type LucideIcon } from 'lucide-react';
import styles from './MemberForm.module.css';

interface Props {
  onClose: () => void;
  editId?: string;
  defaultPid?: string;
}

// Downscale + compress client-side before it ever leaves the browser — a
// phone photo shouldn't turn into a multi-MB upload. 200px/JPEG-0.75 is
// plenty for an avatar that never renders larger than ~90px. The result is
// uploaded to Supabase Storage (not embedded in the DB row) so /api/members
// stays light no matter how many thousands of members have photos.
function fileToAvatarBlob(file: File, maxSize = 200, quality = 0.75): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          blob => (blob ? resolve(blob) : reject(new Error('Failed to encode image'))),
          'image/jpeg', quality,
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
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
  valueName?: string | null;
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
    photoUrl: editing?.photoUrl ?? undefined,
    note: editing?.note ?? '',
  });

  const set = (k: keyof Member, v: string) =>
    setForm(f => ({ ...f, [k]: v || undefined }));

  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }
    setPhotoBusy(true);
    try {
      const blob = await fileToAvatarBlob(file);
      const { url } = await uploadPhoto(blob);
      const oldKey = photoStorageKey(form.photoUrl);
      setForm(f => ({ ...f, photoUrl: url }));
      if (oldKey) deletePhoto(oldKey).catch(() => {});
    } catch {
      alert('Could not upload that image. Please try another file.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = () => {
    const oldKey = photoStorageKey(form.photoUrl);
    setForm(f => ({ ...f, photoUrl: undefined }));
    if (oldKey) deletePhoto(oldKey).catch(() => {});
  };

  const handleSave = async () => {
    if (photoBusy) {
      alert('Please wait for the photo to finish uploading.');
      return;
    }
    if (!form.id || !form.name) {
      alert('Name and A/C number are required');
      return;
    }

    if (!editing && getMember(members, form.id!)) {
      alert('This A/C number already exists');
      return;
    }

    // `?? null` everywhere a field can be cleared: an `undefined` value gets
    // dropped entirely by JSON.stringify, so PATCH would silently leave the
    // OLD value in place instead of clearing it (bit us for photo removal).
    const member: Member = {
      ...(editing ?? {}),
      id: form.id!,
      name: form.name!,
      type: form.type || 'Permanent',
      via: (form.via as Via) || 'core',
      gender: (form.gender as 'M' | 'F' | undefined) ?? null,
      since: form.since || '',
      email: form.email ?? null,
      phone: form.phone ?? null,
      pid: form.pid || null,
      rel: (form.rel as Rel) || null,
      fatherId: form.fatherId ?? null,
      motherId: form.motherId ?? null,
      fatherName: (form.fatherId ? undefined : form.fatherName) ?? null,
      motherName: (form.motherId ? undefined : form.motherName) ?? null,
      succession: form.succession ?? null,
      photoUrl: form.photoUrl ?? null,
      note: form.note ?? null,
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
          <div className={styles.avatarPreviewOuter}>
            <div
              className={styles.avatarPreview}
              style={{
                backgroundColor: (TYPE_CONFIG[(form.type as keyof typeof TYPE_CONFIG)] ?? TYPE_CONFIG.Permanent).color,
                backgroundImage: form.photoUrl ? `url(${form.photoUrl})` : undefined,
              }}
            >
              {!form.photoUrl && getInitials(form.name || '?')}
              {photoBusy && <div className={styles.avatarPreviewBusy}>…</div>}
            </div>
            <button
              type="button"
              className={styles.avatarUploadBtn}
              onClick={() => fileInputRef.current?.click()}
              title={form.photoUrl ? 'Change photo' : 'Upload photo'}
            >
              <Camera size={13} />
            </button>
            {form.photoUrl && (
              <button
                type="button"
                className={styles.avatarRemoveBtn}
                onClick={handleRemovePhoto}
                title="Remove photo"
              >
                <X size={11} />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.avatarFileInput}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handlePhotoFile(file);
                e.target.value = '';
              }}
            />
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
                value={form.type ?? ''}
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
          <button onClick={handleSave} className={styles.saveBtn} disabled={saving || photoBusy}>
            {photoBusy ? 'Uploading photo…' : saving ? 'Saving…' : editing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
