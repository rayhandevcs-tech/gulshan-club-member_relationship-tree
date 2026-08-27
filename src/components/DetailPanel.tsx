'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useMemberStore } from '@/store/memberStore';
import {
  getMember,
  getInitials,
  TYPE_CONFIG,
  getA4DQuota,
  typeBg,
  typeText,
  type TypeConfigEntry,
} from '@/lib/memberUtils';
// getType: prefix থেকে type derive করে (P→Permanent, AFD→A4D, D→Donor, L→Life)
import { getType, getRef, photoOf, displayAcno, isPendingAcno, showsClosedAcno } from '@/lib/quotaTreeLayout';
import {
  getFamilyIndex, familyParents, familyChildren, familySiblings,
  parentCaption, sortParents,
} from '@/lib/familyIndex';
import { Member } from '@/lib/types';
import type { Theme } from '@/store/memberStore';
import { X, ChevronRight, Users, ArrowRight } from 'lucide-react';
import s from './styles/DetailPanel.module.css';

// এক জায়গায় safe color lookup — কোথাও আর সরাসরি TYPE_CONFIG[...] নয়
function cfgOf(m: Member) {
  return TYPE_CONFIG[getType(m) as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.Permanent;
}

// ── photo system ──────────────────────────────────────────────────────────────
// photoOf layout module থেকে আসে: নিজের photoUrl থাকলে সেটাই, না থাকলে undefined
// (initials fallback)। সব component এক জায়গা থেকে নেয়, তাই পরে বদলাতে হলে এক লাইন।
function avatarStyle(m: Member, cfg: TypeConfigEntry, theme: Theme) {
  const url = photoOf(m);
  return {
    backgroundColor: typeBg(cfg, theme),
    color: typeText(cfg, theme),
    backgroundImage: url ? `url("${url}")` : undefined,
    backgroundSize: 'cover' as const,
    backgroundPosition: 'center 22%' as const,
    border: `2px solid ${cfg.color}`,
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
  const theme = useMemberStore(state => state.theme);

  const fatherMember = member.fatherId ? getMember(members, member.fatherId) : null;
  const motherMember = member.motherId ? getMember(members, member.motherId) : null;
  const fatherDisplay = fatherMember?.name ?? member.fatherName;
  const motherDisplay = motherMember?.name ?? member.motherName;

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
            <div className={s.previewAvatar} style={avatarStyle(member, cfg, theme)}>
              {!photoOf(member) && getInitials(member.name)}
            </div>
            <div className={s.previewName}>{member.name}</div>
            <div className={s.previewId} style={{ background: typeBg(cfg, theme), color: 'var(--text-strong)' }}>{displayAcno(member.id)}</div>
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
  subtitle?: ReactNode;               // e.g. "Son" / "Associate" or "Son of PW-6" (cross-ref bolded)
  badges?: { text: string; color: string; bg: string }[];
}) {
  const cfg = cfgOf(member);                       // ← getType + fallback
  const theme = useMemberStore(state => state.theme);
  return (
    <div className={s.memberRow} onClick={() => onPreview(member.id)}>
      <div className={s.memberRowAvatar} style={avatarStyle(member, cfg, theme)}>
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
        <div className={s.memberRowId} style={{ background: typeBg(cfg, theme), color: 'var(--text-strong)' }}>{displayAcno(member.id)}</div>
        {subtitle && (
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', fontStyle: 'italic', marginTop: 2, lineHeight: 1.3 }}>
            {subtitle}
          </div>
        )}
      </div>
      <ChevronRight size={14} className={s.memberRowChevron} />
    </div>
  );
}

// slot list-এর badge গুলো এক জায়গায়
function slotBadges(c: Member, theme: Theme): { text: string; color: string; bg: string }[] {
  const out: { text: string; color: string; bg: string }[] = [];
  const dark = theme === 'dark';
  out.push(
    c.via === 'a4d'
      ? { text: 'A4D',   color: dark ? '#c4a4f7' : '#7c3aed', bg: dark ? '#2b2143' : '#f3e8ff' }
      : { text: 'Assoc', color: dark ? '#f0a878' : '#c2410c', bg: dark ? '#3a2413' : '#ffedd5' },
  );
  // pending = no real club A/C yet (synthetic placeholder id) — NOT "no
  // since date", which the external-API integration never provides at all
  // for otherwise perfectly real, active accounts.
  if (isPendingAcno(c.id)) out.push({ text: 'Pending A/C', color: dark ? '#f0c975' : '#92400e', bg: dark ? '#3a2e12' : '#fef3c7' });
  if (showsClosedAcno(c)) out.push({ text: 'Inactive', color: dark ? '#B9B099' : '#6A624F', bg: dark ? '#26231A' : '#EDE8DA' });
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

export default function DetailPanel() {
  const { members, selectedId, setSelected, navigateTo, theme } = useMemberStore();
  const [previewId, setPreviewId] = useState<string | null>(null);

  if (!selectedId) return null;

  const m = getMember(members, selectedId);
  if (!m) return null;

  const cfg = cfgOf(m);                            // ← crash-এর লাইন fixed
  const parent = m.pid ? getMember(members, m.pid) : null;

  const index = getFamilyIndex(members);

  // Parents come from the shared family index (same source as the Family
  // Relationship tab), so a parent known only through someone else's record
  // still shows up. A parent with no club A/C has a placeholder id — show
  // their name and nothing else: "PENDING-DA-27-father" is an internal
  // bookkeeping string, not something to put in front of a member.
  const parentRows = sortParents(familyParents(index, m.id), m).map(entry => ({
    id: entry.member.id,
    name: entry.name || entry.member.name,
    label: parentCaption(entry, m),
    // null = no real account behind this name → no A/C chip, not clickable
    member: isPendingAcno(entry.member.id) ? null : entry.member,
  }));

  // Nothing indexed but the raw names are on the record (static demo path)
  if (parentRows.length === 0) {
    if (m.fatherName) parentRows.push({ id: 'father-name', name: m.fatherName, label: 'Father', member: null });
    if (m.motherName) parentRows.push({ id: 'mother-name', name: m.motherName, label: 'Mother', member: null });
  }

  // quota দিতে পারে = নিজের membership (via core/succession)। type নয় — কেউ
  // Permanent হয়েও a4d/associate route-এ থাকতে পারে, সে quota holder নয়।
  const isSponsorType = m.via === 'core' || m.via === 'succession';
  const quota = getA4DQuota(members, m.id);

  const spouseMembers: Member[] = m.rel === 'spouse' && parent
    ? [parent]
    : members.filter(c => c.pid === m.id && c.rel === 'spouse');
  const spouseIds = new Set(spouseMembers.map(sp => sp.id));

  const children = members.filter(c => c.pid === m.id);

  // Primary Member (quota holder) দেখাই dependent slot-দের জন্য; dependent
  // spouse-এর ক্ষেত্রে pid-ওয়ালা মানুষটা এমনিতেই Spouse section-এ আছে।
  const showPrimary = !!parent && m.via !== 'core' && m.via !== 'succession' && m.rel !== 'spouse';

  // Every biological child of this member AND their spouse(s), from wherever
  // in the data each one was mentioned — identical to what the Family
  // Relationship tab draws, so the two can't disagree.
  const bioChildren = familyChildren(index, m.id).map(entry => entry.member);

  // A dependent spouse who is herself via a4d/associate (not via='core')
  // shows in BOTH the Spouse section (who she is) and here (how her own
  // account was granted) — she was being filtered out of this list
  // entirely before, so a member's A4D-registered spouse never showed up.
  const a4dMembers = sortSlots(children.filter(c => c.via === 'a4d'));
  const associateMembers = sortSlots(children.filter(c => c.via === 'associate'));
  // Same source as the Family Relationship tab's sibling row.
  const siblings = familySiblings(index, m.id).map(entry => entry.member);

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
            <button onClick={() => setSelected(null)} className={s.closeBtn}>
              <X size={16} />
            </button>
          </div>
        </div>


        <div className={s.panelAvatar} style={avatarStyle(m, cfg, theme)}>
          {!photoOf(m) && getInitials(m.name)}
        </div>

        <div className={s.panelName}>{m.name}</div>
        <div className={s.panelId} style={{ background: typeBg(cfg, theme), color: 'var(--text-strong)' }}>{displayAcno(m.id)}</div>

        {/* {isSponsorType ? (
          // <div className={s.panelQuota}>
          //   A4D Quota: <span className={s.panelQuotaValue}>{quota.used}/{quota.total}</span> used
          // </div>
        ) : (
          // <div className={s.panelQuotaSpacer} />
        )} */}

        {[
          ['Joined',         m.since],
          // only worth a row when it's NOT the normal case — most records
          // don't state a status at all yet
          ['Status',         showsClosedAcno(m) ? 'Inactive account' : null],
          // Access answers "how did this person become an account holder" —
          // so it's left blank for someone who holds no account at all
          // (a placeholder id: a parent or spouse known only by name).
          ['Access',         isPendingAcno(m.id) ? null
                             : m.via === 'core' ? 'Own membership'
                             : m.via === 'a4d' ? 'via 4(d) quota'
                             : m.via === 'succession' ? 'Received via succession'
                             : 'Associate access'],
          ['Email',          m.email],
          ['Phone',          m.phone],
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

        {(showPrimary || spouseMembers.length > 0 || parentRows.length > 0 || siblings.length > 0 || bioChildren.length > 0 || a4dMembers.length > 0 || associateMembers.length > 0) && (
          <div className={s.panelRelSection}>

            {parentRows.length > 0 && (
              <div className={s.panelParentsBox}>
                <div className={s.panelParentsLabel}>
                  <Users size={11} /> Parents
                </div>
                {parentRows.map(row => (
                  <div
                    key={row.id}
                    className={`${s.panelParentRow} ${row.member ? s.panelParentRowClickable : ''}`}
                    onClick={() => row.member && setPreviewId(row.member.id)}
                  >
                    <span className={s.panelParentLabelCell}>{row.label}</span>
                    <span className={s.panelParentValue}>{row.name}</span>
                    {row.member && <span className={s.panelParentAcNo}>{row.member.id}</span>}
                    {row.member && <ChevronRight size={12} className={s.panelChevronSm} />}
                  </div>
                ))}
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
                    badges={slotBadges(ch, theme)}
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
                    badges={slotBadges(ch, theme)}
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