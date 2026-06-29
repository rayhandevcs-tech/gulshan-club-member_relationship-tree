'use client';

import type { Member as DBMember, QuotaGrant, SuccessionEvent, Nominee } from '@prisma/client';
import type { Member } from '@/lib/types';
import { TYPE_CONFIG, getInitials } from '@/lib/memberUtils';
import {
  Heart, GitBranch, Users, ArrowRight, ArrowLeft, User,
  UserCheck, AlertCircle, CheckCircle,
} from 'lucide-react';
import s from './MemberRelationshipView.module.css';

// ─── Accent color maps ────────────────────────────────────────────────────────

const ACCENT_BORDER: Record<string, string> = {
  pink:   '#fce7f3',
  blue:   '#dbeafe',
  green:  '#dcfce7',
  purple: '#f3e8ff',
  orange: '#ffedd5',
  amber:  '#fef3c7',
  gray:   '#f3f4f6',
};

const ACCENT_ICON: Record<string, string> = {
  pink:   '#f472b6',
  blue:   '#60a5fa',
  green:  '#4ade80',
  purple: '#c084fc',
  orange: '#fb923c',
  amber:  '#fbbf24',
  gray:   '#9ca3af',
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function MemberRelationshipView({
  member,
  raw,
  members,
  rawMembers,
  grants,
  successions,
  nominees,
  onSelectMember,
}: {
  member: Member;
  raw: DBMember;
  members: Member[];
  rawMembers: DBMember[];
  grants: QuotaGrant[];
  successions: SuccessionEvent[];
  nominees: Nominee[];
  onSelectMember: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent;

  // ── Bio family ──
  const fatherMember = member.fatherId ? members.find(m => m.id === member.fatherId) ?? null : null;
  const motherMember = member.motherId ? members.find(m => m.id === member.motherId) ?? null : null;

  const spouseMember = ((): Member | null => {
    if (member.rel === 'spouse' && member.pid) return members.find(m => m.id === member.pid) ?? null;
    return members.find(m => m.pid === member.id && m.rel === 'spouse') ?? null;
  })();

  const bioChildren = members.filter(m => m.fatherId === member.id || m.motherId === member.id);

  // ── Club structure ──
  const myGrant = grants.find(g => g.granteeAc === member.id) ?? null;
  const grantorMember = myGrant ? members.find(m => m.id === myGrant.grantorAc) ?? null : null;

  const clubParentMember = (member.pid && !myGrant)
    ? members.find(m => m.id === member.pid) ?? null
    : null;

  const clubChildren = members.filter(m => m.pid === member.id && m.rel === 'child');

  // ── A4D & Associates granted ──
  const a4dGranted = grants.filter(g => g.grantorAc === member.id && g.grantType === 'A4D');
  const assocGranted = grants.filter(g => g.grantorAc === member.id && g.grantType === 'Associate');

  const structAssociates = members.filter(m =>
    m.pid === member.id && m.rel === 'associate' && !assocGranted.find(g => g.granteeAc === m.id)
  );

  // ── Succession ──
  const succIn  = successions.filter(sc => sc.toAc === member.id);
  const succOut = successions.filter(sc => sc.fromAc === member.id);

  // ── Nominees ──
  const myNominees = nominees.filter(n => n.memberAc === member.id)
    .sort((a, b) => a.priority - b.priority);

  // ── Show flags ──
  const hasBioParents   = fatherMember || motherMember || member.fatherName || member.motherName;
  const hasBioChildren  = bioChildren.length > 0;
  const hasSpouse       = !!spouseMember;
  const hasGrant        = !!myGrant && !!grantorMember;
  const hasClubParent   = !!clubParentMember;
  const hasClubChildren = clubChildren.length > 0;
  const hasA4D          = a4dGranted.length > 0;
  const hasAssociates   = assocGranted.length > 0 || structAssociates.length > 0;
  const hasSuccession   = succIn.length > 0 || succOut.length > 0;
  const hasNominees     = myNominees.length > 0;

  return (
    <div className={s.container}>

      {/* ── Member header card ── */}
      <div className={s.headerCard}>
        <div className={s.headerAvatar} style={{ background: cfg.color }}>
          {getInitials(member.name)}
        </div>
        <div className={s.headerInfo}>
          <div className={s.headerNameRow}>
            <span className={s.headerName}>{member.name}</span>
            <span className={s.headerTypeBadge} style={{ background: cfg.bg, color: cfg.dark }}>
              {member.type}
            </span>
            <StatusBadge status={raw.status} />
          </div>
          <div className={s.headerMetaRow}>
            <span className={s.headerMeta}>{member.id}</span>
            {member.memberId && <span className={s.headerMeta}>{member.memberId}</span>}
            {member.since && <span className={s.headerMeta}>Since {member.since}</span>}
            {member.birthDate && <span className={s.headerMeta}>b. {member.birthDate}</span>}
          </div>
          {(member.phone || member.email) && (
            <div className={s.headerContactRow}>
              {member.phone && <span className={s.headerContact}>{member.phone}</span>}
              {member.email && <span className={s.headerContact}>{member.email}</span>}
            </div>
          )}
          {raw.notes && <div className={s.headerNotes}>{raw.notes}</div>}
        </div>
      </div>

      {/* ── Bio Family ── */}
      {(hasBioParents || hasSpouse || hasBioChildren) && (
        <Section title="Biological Family" icon={<Heart size={12} />} accent="pink">
          <div className={s.sectionBody}>
            {hasBioParents && (
              <div className={s.dataRow}>
                <RowLabel>Parents</RowLabel>
                <div className={s.miniCardRow}>
                  {(fatherMember || member.fatherName) && (
                    <MiniCard
                      label="Father"
                      member={fatherMember}
                      freeName={!fatherMember ? (member.fatherName ?? '') : undefined}
                      onSelect={fatherMember ? onSelectMember : undefined}
                    />
                  )}
                  {(motherMember || member.motherName) && (
                    <MiniCard
                      label="Mother"
                      member={motherMember}
                      freeName={!motherMember ? (member.motherName ?? '') : undefined}
                      onSelect={motherMember ? onSelectMember : undefined}
                    />
                  )}
                </div>
              </div>
            )}

            {hasSpouse && (
              <div className={s.dataRow}>
                <RowLabel>Spouse</RowLabel>
                <div className={s.miniCardRow}>
                  <MiniCard label="Spouse" member={spouseMember} onSelect={onSelectMember} />
                </div>
              </div>
            )}

            {hasBioChildren && (
              <div className={s.dataRow}>
                <RowLabel>Children (biological)</RowLabel>
                <div className={s.miniCardRow}>
                  {bioChildren.map(c => (
                    <MiniCard key={c.id} member={c} onSelect={onSelectMember} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Received quota / Club parent ── */}
      {(hasGrant || hasClubParent) && (
        <Section title="Membership Origin" icon={<GitBranch size={12} />} accent="blue">
          {hasGrant && myGrant && grantorMember && (
            <div className={s.originRow}>
              <ArrowLeft size={12} style={{ color: '#60a5fa', flexShrink: 0 }} />
              <span className={s.originLabel}>Received quota from</span>
              <MiniCard member={grantorMember} onSelect={onSelectMember} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                <span className={s.originBadge}>
                  {myGrant.grantType} Slot #{myGrant.slotNo}
                </span>
                {myGrant.articleRef && <span className={s.originMeta}>{myGrant.articleRef}</span>}
                {myGrant.grantedDate && <span className={s.originMeta}>{myGrant.grantedDate}</span>}
                {myGrant.status !== 'Active' && (
                  <span className={s.originBadgeRed}>
                    {myGrant.status}: {myGrant.cancelReason}
                  </span>
                )}
              </div>
            </div>
          )}
          {hasClubParent && clubParentMember && (
            <div className={s.originRow} style={{ marginTop: hasGrant ? '0.25rem' : 0 }}>
              <GitBranch size={12} style={{ color: '#9ca3af', flexShrink: 0 }} />
              <span className={s.originLabel}>Club parent</span>
              <MiniCard member={clubParentMember} onSelect={onSelectMember} />
              <span className={s.originMeta}>({member.rel})</span>
            </div>
          )}
        </Section>
      )}

      {/* ── Club children ── */}
      {hasClubChildren && (
        <Section title="Children (Club Members)" icon={<Users size={12} />} accent="green">
          <RowLabel>These members joined the club as {member.name}&apos;s children (separate quotas)</RowLabel>
          <div className={s.miniCardRow} style={{ marginTop: '0.5rem' }}>
            {clubChildren.map(c => (
              <MiniCard key={c.id} member={c} onSelect={onSelectMember} />
            ))}
          </div>
        </Section>
      )}

      {/* ── A4D Quota Granted ── */}
      {hasA4D && (
        <Section title="A4D Quota Granted" icon={<UserCheck size={12} />} accent="purple">
          <RowLabel>{member.name} has given A4D quota slots to the following members</RowLabel>
          <div className={s.a4dSlotsRow}>
            {a4dGranted.map(g => {
              const grantee = members.find(m => m.id === g.granteeAc) ?? null;
              const rawGrantee = rawMembers.find(m => m.acNo === g.granteeAc);
              const theirA4D   = grants.filter(sg => sg.grantorAc === g.granteeAc && sg.grantType === 'A4D');
              const theirAssoc = grants.filter(sg => sg.grantorAc === g.granteeAc && sg.grantType === 'Associate');
              return (
                <div key={g.id} className={s.a4dSlotCol}>
                  <div className={s.a4dConnector} />
                  <div className={`${s.a4dCard} ${g.status === 'Active' ? s.a4dCardActive : s.a4dCardInactive}`}>
                    {grantee ? (
                      <button onClick={() => onSelectMember(grantee.id)} className={s.a4dMemberBtn}>
                        <Avatar member={grantee} size="sm" />
                        <span className={s.a4dMemberName}>{grantee.name}</span>
                        <span className={s.a4dMemberId}>{grantee.id}</span>
                      </button>
                    ) : (
                      <div className={s.a4dMemberFallback}>{g.granteeAc}</div>
                    )}
                    <div className={s.a4dBadges}>
                      <span className={s.a4dSlotBadge}>Slot #{g.slotNo}</span>
                      {g.articleRef && <span className={s.a4dArticle}>{g.articleRef}</span>}
                      {g.status !== 'Active' && <span className={s.a4dStatus}>{g.status}</span>}
                      {rawGrantee?.status === 'Deceased' && <span className={s.a4dDeceased}>Deceased</span>}
                    </div>
                    {(theirA4D.length > 0 || theirAssoc.length > 0) && (
                      <div className={s.a4dSubGrants}>
                        {theirA4D.map(sg => {
                          const sgm = members.find(m => m.id === sg.granteeAc);
                          return (
                            <button key={sg.id} onClick={() => onSelectMember(sg.granteeAc)} className={s.a4dSubBtn}>
                              ↳ A4D: {sgm?.name ?? sg.granteeAc}
                            </button>
                          );
                        })}
                        {theirAssoc.map(sg => {
                          const sgm = members.find(m => m.id === sg.granteeAc);
                          return (
                            <button key={sg.id} onClick={() => onSelectMember(sg.granteeAc)} className={s.a4dSubBtnOrange}>
                              ↳ Assoc: {sgm?.name ?? sg.granteeAc}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── Associates ── */}
      {hasAssociates && (
        <Section title="Associates" icon={<Users size={12} />} accent="orange">
          <RowLabel>Associate memberships granted by {member.name}</RowLabel>
          <div className={s.miniCardRow} style={{ marginTop: '0.5rem' }}>
            {assocGranted.map(g => {
              const assoc = members.find(m => m.id === g.granteeAc) ?? null;
              return (
                <div key={g.id} style={{ opacity: g.status !== 'Active' ? 0.5 : 1 }}>
                  <MiniCard
                    member={assoc}
                    freeName={!assoc ? g.granteeAc : undefined}
                    label={g.status !== 'Active' ? g.status : undefined}
                    onSelect={assoc ? onSelectMember : undefined}
                  />
                </div>
              );
            })}
            {structAssociates.map(a => (
              <MiniCard key={a.id} member={a} onSelect={onSelectMember} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Succession / Transfer ── */}
      {hasSuccession && (
        <Section title="Succession & Transfer History" icon={<ArrowRight size={12} />} accent="amber">
          <div className={s.sectionBody}>
            {succIn.map(sc => {
              const from = members.find(m => m.id === sc.fromAc) ?? null;
              return (
                <div key={sc.id} className={s.succRow}>
                  <ArrowLeft size={13} className={`${s.succIcon} ${s.succIconBlue}`} />
                  <div className={s.succContent}>
                    <span className={s.succLabel}>Received from</span>
                    {from ? (
                      <MiniCard member={from} onSelect={onSelectMember} />
                    ) : (
                      <span className={s.succMemberFallback}>{sc.fromAc}</span>
                    )}
                    <div className={s.succMetaRow}>
                      <span className={s.succTypeBadgeBlue}>{sc.eventType}</span>
                      {sc.eventDate && <span>{sc.eventDate}</span>}
                      {sc.articleRef && <span>{sc.articleRef}</span>}
                      {sc.successorRel && <span>· {sc.successorRel}</span>}
                    </div>
                  </div>
                  {sc.remarks && <div className={s.succRemarks}>{sc.remarks}</div>}
                </div>
              );
            })}
            {succOut.map(sc => {
              const to = members.find(m => m.id === sc.toAc) ?? null;
              return (
                <div key={sc.id} className={s.succRow}>
                  <ArrowRight size={13} className={`${s.succIcon} ${s.succIconOrange}`} />
                  <div className={s.succContent}>
                    <span className={s.succLabel}>Transferred to</span>
                    {to ? (
                      <MiniCard member={to} onSelect={onSelectMember} />
                    ) : (
                      <span className={s.succMemberFallback}>{sc.toAc}</span>
                    )}
                    <div className={s.succMetaRow}>
                      <span className={s.succTypeBadgeOrange}>{sc.eventType}</span>
                      {sc.eventDate && <span>{sc.eventDate}</span>}
                      {sc.articleRef && <span>{sc.articleRef}</span>}
                      {sc.successorRel && <span>· {sc.successorRel}</span>}
                    </div>
                  </div>
                  {sc.remarks && <div className={s.succRemarks}>{sc.remarks}</div>}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── Nominees ── */}
      {hasNominees && (
        <Section title="Nominees" icon={<User size={12} />} accent="gray">
          <RowLabel>Who will inherit this membership if it becomes vacant</RowLabel>
          <div className={s.sectionBody} style={{ marginTop: '0.5rem', gap: '0.375rem' }}>
            {myNominees.map(n => (
              <div key={n.id} className={s.nomineeRow}>
                <div className={s.nomineePriorityBadge}>{n.priority}</div>
                <span className={s.nomineeName}>{n.nomineeName}</span>
                {n.relToMember && <span className={s.nomineeRel}>({n.relToMember})</span>}
                {n.nominatedDate && <span className={s.nomineeDate}>{n.nominatedDate}</span>}
                <NomineeBadge status={n.status} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Empty state */}
      {!hasBioParents && !hasSpouse && !hasBioChildren && !hasGrant && !hasClubParent &&
       !hasClubChildren && !hasA4D && !hasAssociates && !hasSuccession && !hasNominees && (
        <div className={s.emptyState}>
          <div className={s.emptyTitle}>No relationships recorded for this member yet.</div>
          <div className={s.emptyHint}>Use Add Member to define relationships.</div>
        </div>
      )}
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function Section({
  title, icon, accent, children,
}: {
  title: string;
  icon: React.ReactNode;
  accent: 'pink' | 'blue' | 'green' | 'purple' | 'orange' | 'amber' | 'gray';
  children: React.ReactNode;
}) {
  return (
    <div className={s.section} style={{ borderColor: ACCENT_BORDER[accent] }}>
      <div className={s.sectionHeader} style={{ color: ACCENT_ICON[accent] }}>
        {icon}
        <span className={s.sectionTitle}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return <div className={s.rowLabel}>{children}</div>;
}

function Avatar({ member, size = 'md' }: { member: Member; size?: 'sm' | 'md' }) {
  const cfg = TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent;
  return (
    <div
      className={`${s.avatar} ${size === 'sm' ? s.avatarSm : s.avatarMd}`}
      style={{ background: cfg.color }}
    >
      {getInitials(member.name)}
    </div>
  );
}

function MiniCard({
  member, freeName, label, onSelect,
}: {
  member: Member | null;
  freeName?: string;
  label?: string;
  onSelect?: (id: string) => void;
}) {
  if (!member && !freeName) return null;

  const cfg = member ? (TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent) : null;

  const inner = (
    <div className={s.miniCard}>
      {member && cfg ? (
        <>
          <div className={s.miniAvatar} style={{ background: cfg.color }}>
            {getInitials(member.name)}
          </div>
          <div className={s.miniInfo}>
            <div className={s.miniName}>{member.name}</div>
            <div className={s.miniMeta}>
              <span className={s.miniId}>{member.id}</span>
              <span className={s.miniType} style={{ background: cfg.bg, color: cfg.dark }}>{member.type}</span>
              {label && <span className={s.miniLabel}>{label}</span>}
            </div>
          </div>
        </>
      ) : (
        <div className={s.miniFreeName}>{freeName}</div>
      )}
    </div>
  );

  if (member && onSelect) {
    return (
      <button onClick={() => onSelect(member.id)} className={s.miniCardBtn}>
        {inner}
      </button>
    );
  }
  return inner;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Active') return (
    <span className={s.statusActive}>
      <CheckCircle size={10} /> Active
    </span>
  );
  if (status === 'Deceased') return (
    <span className={s.statusDeceased}>Deceased</span>
  );
  return (
    <span className={s.statusOther}>
      <AlertCircle size={10} /> {status}
    </span>
  );
}

function NomineeBadge({ status }: { status: string }) {
  const badgeClass = s[
    status === 'Active' ? 'nomineeBadgeActive'
    : status === 'Used' ? 'nomineeBadgeUsed'
    : 'nomineeBadgeRevoked'
  ] ?? s.nomineeBadgeRevoked;
  return (
    <span className={`${s.nomineeBadge} ${badgeClass}`}>{status}</span>
  );
}
