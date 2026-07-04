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
// memberUtils-এ move করে থাকলে উপরের import-এ যোগ করো, নাহলে layout module থেকে:
import { getType, getRef } from '@/components/Quotatreelayout';
import { Member } from '@/lib/types';
import { X, ChevronRight, Users, ArrowRight } from 'lucide-react';
import s from './DetailPanel.module.css';

// এক জায়গায় safe color lookup — কোথাও আর সরাসরি TYPE_CONFIG[...] নয়
function cfgOf(m: Member) {
  return TYPE_CONFIG[getType(m)] ?? TYPE_CONFIG.Permanent;
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

  const spouseMember =
    member.rel === 'spouse' && member.pid
      ? getMember(members, member.pid)
      : (members.find(c => c.pid === member.id && c.rel === 'spouse') ?? null);

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
            <div className={s.previewAvatar} style={{ backgroundColor: cfg.bg, color: cfg.dark, backgroundImage: member.photoUrl ? `url(${member.photoUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              {!member.photoUrl && getInitials(member.name)}
            </div>
            <div className={s.previewName}>{member.name}</div>
            <div className={s.previewId} style={{ background: cfg.bg, color: cfg.dark }}>{member.id}</div>
            <div className={s.previewTypeBadge} style={{ background: cfg.bg, color: cfg.dark }}>
              {getType(member)}                     {/* ← derived type */}
              {member.via === 'a4d' && ' · 4(d)'}   {/* quota-access hint */}
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

          {spouseMember && (
            <div className={s.previewSectionRow}>
              <span className={s.previewFieldLabel}>Spouse</span>
              <span className={s.previewSpouseName}>{spouseMember.name}</span>
              <span className={s.previewSpouseId}>{spouseMember.id}</span>
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
}: {
  member: Member;
  onPreview: (id: string) => void;
}) {
  const cfg = cfgOf(member);                       // ← getType + fallback
  return (
    <div className={s.memberRow} onClick={() => onPreview(member.id)}>
      <div className={s.memberRowAvatar} style={{ backgroundColor: cfg.bg, color: cfg.dark, backgroundImage: member.photoUrl ? `url(${member.photoUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {!member.photoUrl && getInitials(member.name)}
      </div>
      <div className={s.memberRowInfo}>
        <div className={s.memberRowName}>{member.name}</div>
        <div className={s.memberRowId} style={{ background: cfg.bg, color: cfg.dark }}>{member.id}</div>
      </div>
      <ChevronRight size={14} className={s.memberRowChevron} />
    </div>
  );
}

export default function DetailPanel() {
  const { members, selectedId, setSelected, navigateTo } = useMemberStore();
  const [previewId, setPreviewId] = useState<string | null>(null);

  if (!selectedId) return null;

  const m = getMember(members, selectedId);
  if (!m) return null;

  const cfg = cfgOf(m);                            // ← crash-এর লাইন fixed
  const parent = m.pid ? getMember(members, m.pid) : null;
  const children = members.filter(c => c.pid === m.id);

  const fatherMember = m.fatherId ? getMember(members, m.fatherId) : null;
  const motherMember = m.motherId ? getMember(members, m.motherId) : null;
  const fatherDisplay = fatherMember?.name ?? m.fatherName ?? m.father;
  const motherDisplay = motherMember?.name ?? m.motherName ?? m.mother;

  // quota দিতে পারে = নিজের membership (via core)। type নয় — কেউ Permanent
  // হয়েও a4d route-এ থাকতে পারে, সে quota holder নয়।
  const isSponsorType = m.via !== 'a4d';
  const quota = getA4DQuota(members, m.id);

  const spouseMember = m.rel === 'spouse' && parent
    ? parent
    : (members.find(c => c.pid === m.id && c.rel === 'spouse') ?? null);

  // Primary Member (quota holder) দেখাই শুধু a4d slot-দের জন্য; a4d spouse-এর
  // ক্ষেত্রে pid-ওয়ালা মানুষটা এমনিতেই Spouse section-এ আছে — দুইবার নয়।
  const showPrimary = !!parent && m.via === 'a4d' && m.rel !== 'spouse';

  const bioChildren = members.filter(c => c.fatherId === m.id || c.motherId === m.id);

  // নতুন model: slot মানে via === 'a4d' (rel spouse/child যাই হোক)
  const a4dMembers = children.filter(
    c => c.via === 'a4d' && c.rel !== 'associate' && c.rel !== 'nominee',
  );
  const associateMembers = children.filter(
    c => c.rel === 'associate' || c.rel === 'nominee',
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
          <button onClick={() => setSelected(null)} className={s.closeBtn}>
            <X size={16} />
          </button>
        </div>

        <div className={s.panelAvatar} style={{ backgroundColor: cfg.bg, color: cfg.dark, backgroundImage: m.photoUrl ? `url(${m.photoUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {!m.photoUrl && getInitials(m.name)}
        </div>

        <div className={s.panelName}>{m.name}</div>
        <div className={s.panelId} style={{ background: cfg.bg, color: cfg.dark }}>{m.id}</div>

        {isSponsorType ? (
          <div className={s.panelQuota}>
            A4D Quota: <span className={s.panelQuotaValue}>{quota.used}/{quota.total}</span> used
          </div>
        ) : (
          <div className={s.panelQuotaSpacer} />
        )}

        {[
          ['Member ID',      m.memberId],
          ['Type',           getType(m)],
          ['Access',         m.via === 'a4d' ? 'via 4(d) quota' : 'Own membership'],
          ['Joined',         m.since],
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

        {(showPrimary || spouseMember || fatherDisplay || motherDisplay || siblings.length > 0 || bioChildren.length > 0 || a4dMembers.length > 0 || associateMembers.length > 0) && (
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
              <>
                <div className={s.panelSectionLabel}>Primary Member</div>
                <MemberRow member={parent} onPreview={setPreviewId} />
              </>
            )}

            {spouseMember && (
              <>
                <div className={s.panelSectionLabel}>Spouse</div>
                <MemberRow member={spouseMember} onPreview={setPreviewId} />
              </>
            )}

            {siblings.length > 0 && (
              <>
                <div className={s.panelSectionLabel}>Siblings ({siblings.length})</div>
                {siblings.map(sib => (
                  <MemberRow key={sib.id} member={sib} onPreview={setPreviewId} />
                ))}
              </>
            )}

            {bioChildren.length > 0 && (
              <>
                <div className={s.panelSectionLabel}>Children ({bioChildren.length})</div>
                {bioChildren.map(ch => (
                  <MemberRow key={ch.id} member={ch} onPreview={setPreviewId} />
                ))}
              </>
            )}

            {a4dMembers.length > 0 && (
              <>
                <div className={s.panelSectionLabel}>A4D Members ({a4dMembers.length})</div>
                {a4dMembers.map(ch => (
                  <MemberRow key={ch.id} member={ch} onPreview={setPreviewId} />
                ))}
              </>
            )}

            {associateMembers.length > 0 && (
              <>
                <div className={s.panelSectionLabel}>Associate Members ({associateMembers.length})</div>
                {associateMembers.map(ch => (
                  <MemberRow key={ch.id} member={ch} onPreview={setPreviewId} />
                ))}
              </>
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