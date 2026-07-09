'use client';

import { useState } from 'react';
import { useMemberStore } from '@/store/memberStore';
import {
  getMember,
  getInitials,
  TYPE_CONFIG,
  getA4DQuota,
  getSiblings,
} from '@/lib/memberUtils';
// getType: prefix থেকে type derive করে (P→Permanent, AFD→A4D, D→Donor, L→Life)
import { getType, getRef, photoOf } from '@/components/Quotatreelayout';
import { Member } from '@/lib/types';
import { X, ChevronRight, Users, ArrowRight, Pencil } from 'lucide-react';
import s from './DetailPanel.module.css';

// এক জায়গায় safe color lookup — কোথাও আর সরাসরি TYPE_CONFIG[...] নয়
function cfgOf(m: Member) {
  return TYPE_CONFIG[getType(m) as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.Permanent;
}

// ── photo system ──────────────────────────────────────────────────────────────
// photoOf layout module থেকে আসে: নিজের photoUrl থাকলে সেটাই, না থাকলে undefined
// (initials fallback)। সব component এক জায়গা থেকে নেয়, তাই পরে বদলাতে হলে এক লাইন।
function avatarStyle(m: Member, cfg: { bg: string; dark: string; color?: string }) {
  const url = photoOf(m);
  return {
    backgroundColor: cfg.bg,
    color: cfg.dark,
    backgroundImage: url ? `url(${url})` : undefined,
    backgroundSize: 'cover' as const,
    backgroundPosition: 'center 22%' as const,
    border: `2px solid ${cfg.color ?? cfg.dark}`,
    boxSizing: 'border-box' as const,
  };
}

function MemberPreviewModal({
  member,
  members,
  onClose,
  onNavigate,
}: {
  member: Member;
  members: Member[];
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const cfg = cfgOf(member);                       // ← getType + fallback

  const fatherMember = member.fatherId ? getMember(members, member.fatherId) : null;
  const motherMember = member.motherId ? getMember(members, member.motherId) : null;
  const fatherDisplay = fatherMember?.name ?? member.fatherName ?? member.father;
  const motherDisplay = motherMember?.name ?? member.motherName ?? member.mother;

  const spouseMembers: Member[] =
    member.rel === 'spouse' && member.pid
      ? [getMember(members, member.pid)].filter((x): x is Member => !!x)
      : members.filter(c => c.pid === member.id && c.rel === 'spouse');

  const bioChildren = members.filter(c => c.fatherId === member.id || c.motherId === member.id);

  return (
    <>
      <div className={s.backdrop} onClick={onClose} />

      <div className={s.previewModal}>
        <div className={s.previewModalHeader}>
          <span className={s.previewModalLabel}>Quick Preview</span>
          <button onClick={onClose} className={s.closeBtn}>
            <X size={15} />
          </button>
        </div>

        <div className={s.previewModalBody}>
          <div className={s.previewAvatarWrap}>
            <div className={s.previewAvatar} style={avatarStyle(member, cfg)}>
              {!photoOf(member) && getInitials(member.name)}
            </div>
            <div className={s.previewName}>{member.name}</div>
            <div className={s.previewId} style={{ background: cfg.bg, color: '#000000' }}>{member.id}</div>
            <div className={s.previewTypeBadge} style={{ background: cfg.bg, color: cfg.dark }}>
              {getType(member)}                             {/* ← derived type */}
              {member.via === 'a4d' && ' · 4(d)'}           {/* access hints */}
              {member.via === 'associate' && ' · Assoc'}
              {member.via === 'succession' && ' · Succession'}
            </div>
          </div>

          <div className={s.previewFields}>
            {[
              ['Joined', member.since],
              ['Email',  member.email],
              ['Phone',  member.phone],
            ]
              .filter(([, v]) => v)
              .map(([label, val]) => (
                <div key={label} className={s.previewFieldRow}>
                  <span className={s.previewFieldLabel}>{label}</span>
                  <span className={s.previewFieldValue}>{val}</span>
                </div>
              ))}
          </div>

          {(fatherDisplay || motherDisplay) && (
            <div className={s.previewParentsBox}>
              <div className={s.previewParentsLabel}>
                <Users size={10} /> Parents
              </div>
              {fatherDisplay && (
                <div className={s.previewParentRow}>
                  <span className={s.previewParentLabelCell}>Father</span>
                  <span className={s.previewParentValue}>{fatherDisplay}</span>
                </div>
              )}
              {motherDisplay && (
                <div className={s.previewParentRow}>
                  <span className={s.previewParentLabelCell}>Mother</span>
                  <span className={s.previewParentValue}>{motherDisplay}</span>
                </div>
              )}
            </div>
          )}

          {spouseMembers.length > 0 && (
            <div className={s.previewSectionRow}>
              <span className={s.previewFieldLabel}>{spouseMembers.length > 1 ? 'Spouses' : 'Spouse'}</span>
              <span className={s.previewParentValue}>
                {spouseMembers.map(sp => `${sp.name} (${sp.id})`).join(', ')}
              </span>
            </div>
          )}

          {bioChildren.length > 0 && (
            <div className={s.previewSectionRow}>
              <span className={s.previewFieldLabel}>Children</span>
              <span className={s.previewParentValue}>{bioChildren.map(c => c.name).join(', ')}</span>
            </div>
          )}

          <button
            onClick={() => { onNavigate(member.id); onClose(); }}
            className={s.previewNavBtn}
          >
            Go to member <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </>
  );
}

function MemberRow({
  member,
  onPreview,
  subtitle,
  badges,
}: {
  member: Member;
  onPreview: (id: string) => void;
  subtitle?: string;                 // e.g. "Spouse of PA-41" / "Son of PW-6"
  badges?: { text: string; color: string; bg: string }[];
}) {
  const cfg = cfgOf(member);                       // ← getType + fallback
  return (
    <div className={s.memberRow} onClick={() => onPreview(member.id)}>
      <div className={s.memberRowAvatar} style={avatarStyle(member, cfg)}>
        {!photoOf(member) && getInitials(member.name)}
      </div>
      <div className={s.memberRowInfo}>
        <div className={s.memberRowName}>
          {member.name}
          {badges?.map(b => (
            <span
              key={b.text}
              style={{
                marginLeft: 6, fontSize: 8.5, fontWeight: 700, verticalAlign: 'middle',
                color: b.color, background: b.bg, padding: '1px 6px', borderRadius: 999,
                whiteSpace: 'nowrap',
              }}
            >
              {b.text}
            </span>
          ))}
        </div>
        <div className={s.memberRowId} style={{ background: cfg.bg, color: '#000000' }}>{member.id}</div>
        {subtitle && (
          <div style={{ fontSize: 10, color: '#6B7280', fontStyle: 'italic', marginTop: 2, lineHeight: 1.3 }}>
            {subtitle}
          </div>
        )}
      </div>
      <ChevronRight size={14} className={s.memberRowChevron} />
    </div>
  );
}

// slot list-এর badge গুলো এক জায়গায়
function slotBadges(c: Member): { text: string; color: string; bg: string }[] {
  const out: { text: string; color: string; bg: string }[] = [];
  const t = getType(c);
  out.push(
    c.via === 'a4d'
      ? { text: 'A4D',   color: '#7c3aed', bg: '#f3e8ff' }
      : { text: 'Assoc', color: '#c2410c', bg: '#ffedd5' },
  );
  // pending = কোনো joining date-ই নেই; AFD prefix মানেই pending না —
  // since থাকলে সে active A4D-access member
  if (t === 'A4D' && !c.since) out.push({ text: 'Pending A/C', color: '#92400e', bg: '#fef3c7' });
  return out;
}

// spouse rows আগে, তারপর children — নাম অনুযায়ী
function sortSlots(list: Member[]): Member[] {
  return [...list].sort(
    (a, b) =>
      (a.rel === 'spouse' ? 0 : 1) - (b.rel === 'spouse' ? 0 : 1) ||
      a.name.localeCompare(b.name),
  );
}

export default function DetailPanel({ onEdit }: { onEdit?: (id: string) => void }) {
  const { members, selectedId, setSelected, navigateTo } = useMemberStore();
  const [previewId, setPreviewId] = useState<string | null>(null);

  if (!selectedId) return null;

  const m = getMember(members, selectedId);
  if (!m) return null;

  const cfg = cfgOf(m);                            // ← crash-এর লাইন fixed
  const parent = m.pid ? getMember(members, m.pid) : null;

  const fatherMember = m.fatherId ? getMember(members, m.fatherId) : null;
  const motherMember = m.motherId ? getMember(members, m.motherId) : null;
  const fatherDisplay = fatherMember?.name ?? m.fatherName ?? m.father;
  const motherDisplay = motherMember?.name ?? m.motherName ?? m.mother;

  // quota দিতে পারে = নিজের membership (via core/succession)। type নয় — কেউ
  // Permanent হয়েও a4d/associate route-এ থাকতে পারে, সে quota holder নয়।
  const isSponsorType = m.via === 'core' || m.via === 'succession';
  const quota = getA4DQuota(members, m.id);

  const spouseMembers: Member[] = m.rel === 'spouse' && parent
    ? [parent]
    : members.filter(c => c.pid === m.id && c.rel === 'spouse');
  const spouseIds = new Set(spouseMembers.map(sp => sp.id));

  // A4D/Associate dependents can hang off EITHER partner's own quota — a
  // spouse's own A4D grants were being dropped entirely since this only
  // ever looked at m.id's own dependents.
  const dependentOwnerIds = new Set([m.id, ...spouseIds]);
  const children = members.filter(c => c.pid != null && dependentOwnerIds.has(c.pid));

  // Primary Member (quota holder) দেখাই dependent slot-দের জন্য; dependent
  // spouse-এর ক্ষেত্রে pid-ওয়ালা মানুষটা এমনিতেই Spouse section-এ আছে।
  const showPrimary = !!parent && m.via !== 'core' && m.via !== 'succession' && m.rel !== 'spouse';

  const bioChildren = members.filter(c => c.fatherId === m.id || c.motherId === m.id);

  // access route (via) দিয়ে ভাগ — rel এখন খাঁটি সম্পর্ক (spouse/child); dependent
  // spouse-রা (via a4d/associate কিন্তু rel spouse) এখানে না, Spouse section-এই থাকবে
  const a4dMembers = sortSlots(children.filter(c => c.via === 'a4d' && !spouseIds.has(c.id)));
  const associateMembers = sortSlots(
    children.filter(c => c.via === 'associate' && !spouseIds.has(c.id)),
  );
  const siblings = getSiblings(members, m);

  const previewMember = previewId ? getMember(members, previewId) : null;

  return (
    <>
      <div className={s.mobileBackdrop} onClick={() => setSelected(null)} />

      <div className={s.panel}>
        <div className={s.dragHandleWrap}>
          <div className={s.dragHandle} />
        </div>

        <div className={s.panelHeader}>
          <span className={s.panelHeaderLabel}>Member Details</span>
          <div className={s.panelHeaderActions}>
            {onEdit && (
              <button onClick={() => onEdit(m.id)} className={s.editBtn} title="Edit member">
                <Pencil size={12} /> Edit
              </button>
            )}
            <button onClick={() => setSelected(null)} className={s.closeBtn}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className={s.panelAvatar} style={avatarStyle(m, cfg)}>
          {!photoOf(m) && getInitials(m.name)}
        </div>

        <div className={s.panelName}>{m.name}</div>
        <div className={s.panelId} style={{ background: cfg.bg, color: '#000000' }}>{m.id}</div>

        {/* {isSponsorType ? (
          // <div className={s.panelQuota}>
          //   A4D Quota: <span className={s.panelQuotaValue}>{quota.used}/{quota.total}</span> used
          // </div>
        ) : (
          // <div className={s.panelQuotaSpacer} />
        )} */}

        {[
          ['Joined',         m.since],
          ['Access',         m.via === 'core' ? 'Own membership'
                             : m.via === 'a4d' ? 'via 4(d) quota'
                             : m.via === 'succession' ? 'Received via succession'
                             : 'Associate access'],
          ['Member ID',      m.memberId],
          ['Birth Date',     m.birthDate],
          ['Email',          m.email],
          ['Phone',          m.phone ?? m.phoneRes ?? m.phoneOff],
          ['A4D Source',     m.quotaNote],
          ['Succession',     m.succession],
          ['Membership Ref', m.membershipRef],
          ['Note',           m.note],
        ]
          .filter(([, v]) => v)
          .map(([label, val]) => (
            <div key={label} className={s.panelFieldRow}>
              <span className={s.panelFieldLabel}>{label}</span>
              <span className={s.panelFieldValue}>{val}</span>
            </div>
          ))}

        {(showPrimary || spouseMembers.length > 0 || fatherDisplay || motherDisplay || siblings.length > 0 || bioChildren.length > 0 || a4dMembers.length > 0 || associateMembers.length > 0) && (
          <div className={s.panelRelSection}>

            {(fatherDisplay || motherDisplay) && (
              <div className={s.panelParentsBox}>
                <div className={s.panelParentsLabel}>
                  <Users size={11} /> Parents
                </div>
                {fatherDisplay && (
                  <div
                    className={`${s.panelParentRow} ${fatherMember ? s.panelParentRowClickable : ''}`}
                    onClick={() => fatherMember && setPreviewId(fatherMember.id)}
                  >
                    <span className={s.panelParentLabelCell}>Father</span>
                    <span className={s.panelParentValue}>{fatherDisplay}</span>
                    {fatherMember && <span className={s.panelParentAcNo}>{fatherMember.id}</span>}
                    {fatherMember && <ChevronRight size={12} className={s.panelChevronSm} />}
                  </div>
                )}
                {motherDisplay && (
                  <div
                    className={`${s.panelParentRow} ${motherMember ? s.panelParentRowClickable : ''}`}
                    onClick={() => motherMember && setPreviewId(motherMember.id)}
                  >
                    <span className={s.panelParentLabelCell}>Mother</span>
                    <span className={s.panelParentValue}>{motherDisplay}</span>
                    {motherMember && <span className={s.panelParentAcNo}>{motherMember.id}</span>}
                    {motherMember && <ChevronRight size={12} className={s.panelChevronSm} />}
                  </div>
                )}
              </div>
            )}

            {showPrimary && parent && (
              <div className={s.sectionBlock}>
                <div className={s.panelSectionLabel}>Primary Member</div>
                <MemberRow member={parent} onPreview={setPreviewId} />
              </div>
            )}

            {spouseMembers.length > 0 && (
              <div className={s.sectionBlock}>
                <div className={s.panelSectionLabel}>
                  {spouseMembers.length > 1 ? `Spouses (${spouseMembers.length})` : 'Spouse'}
                </div>
                {spouseMembers.map(sp => (
                  <MemberRow key={sp.id} member={sp} onPreview={setPreviewId} />
                ))}
              </div>
            )}

            {siblings.length > 0 && (
              <div className={s.sectionBlock}>
                <div className={s.panelSectionLabel}>Siblings ({siblings.length})</div>
                {siblings.map(sib => (
                  <MemberRow key={sib.id} member={sib} onPreview={setPreviewId} />
                ))}
              </div>
            )}

            {bioChildren.length > 0 && (
              <div className={s.sectionBlock}>
                <div className={s.panelSectionLabel}>Children ({bioChildren.length})</div>
                {bioChildren.map(ch => (
                  <MemberRow key={ch.id} member={ch} onPreview={setPreviewId} />
                ))}
              </div>
            )}

            {a4dMembers.length > 0 && (
              <div className={s.sectionBlock}>
                <div className={s.panelSectionLabel}>A4D Members ({a4dMembers.length})</div>
                {a4dMembers.map(ch => (
                  <MemberRow
                    key={ch.id}
                    member={ch}
                    onPreview={setPreviewId}
                    subtitle={getRef(ch, m)}
                    badges={slotBadges(ch)}
                  />
                ))}
              </div>
            )}

            {associateMembers.length > 0 && (
              <div className={s.sectionBlock}>
                <div className={s.panelSectionLabel}>Associate Members ({associateMembers.length})</div>
                {associateMembers.map(ch => (
                  <MemberRow
                    key={ch.id}
                    member={ch}
                    onPreview={setPreviewId}
                    subtitle={getRef(ch, m)}
                    badges={slotBadges(ch)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {previewMember && (
        <MemberPreviewModal
          member={previewMember}
          members={members}
          onClose={() => setPreviewId(null)}
          onNavigate={navigateTo}
        />
      )}
    </>
  );
}