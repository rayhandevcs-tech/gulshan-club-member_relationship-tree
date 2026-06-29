'use client';

import type { Member as DBMember, QuotaGrant, SuccessionEvent } from '@prisma/client';
import type { Member } from '@/lib/types';
import { TYPE_CONFIG, getInitials } from '@/lib/memberUtils';
import { ArrowRight } from 'lucide-react';
import styles from './FamilyHierarchyTree.module.css';

interface Props {
  member: Member;
  raw: DBMember;
  members: Member[];
  rawMembers: DBMember[];
  grants: QuotaGrant[];
  successions: SuccessionEvent[];
  onSelect: (id: string) => void;
}

export default function FamilyHierarchyTree({
  member, raw, members, rawMembers, grants, successions, onSelect,
}: Props) {

  const getRaw = (ac: string): DBMember => rawMembers.find(r => r.acNo === ac) ?? raw;

  const getSpouse = (m: Member): Member | null => {
    if (m.rel === 'spouse' && m.pid) return members.find(x => x.id === m.pid) ?? null;
    return members.find(x => x.pid === m.id && x.rel === 'spouse') ?? null;
  };

  const getBioChildren = (m: Member): Member[] => {
    const ids = new Set([
      ...members.filter(x => x.fatherId === m.id || x.motherId === m.id).map(x => x.id),
      ...members.filter(x => x.pid === m.id && x.rel === 'child').map(x => x.id),
    ]);
    return [...ids].map(id => members.find(x => x.id === id)!).filter(Boolean);
  };

  const getGroupData = (m: Member) => ({
    spouse:     getSpouse(m),
    a4dGiven:   grants.filter(g => g.grantorAc === m.id && g.grantType === 'A4D'),
    assocGiven: grants.filter(g => g.grantorAc === m.id && g.grantType === 'Associate'),
    succOut:    successions.filter(s => s.fromAc === m.id),
    succIn:     successions.filter(s => s.toAc   === m.id),
    a4dIn:      grants.find(g => g.granteeAc === m.id && g.grantType === 'A4D') ?? null,
    assocIn:    grants.find(g => g.granteeAc === m.id && g.grantType === 'Associate') ?? null,
  });

  const rootData    = getGroupData(member);
  const bioChildren = getBioChildren(member);

  return (
    <div className={styles.root}>

      <GenLabel label="Parents" />
      <MemberGroup
        member={member} raw={raw} data={rootData}
        members={members} getRaw={getRaw} onSelect={onSelect} size="lg"
      />

      {bioChildren.length > 0 && (
        <>
          <VLine h={8} />
          <GenLabel label="Children" />
          {bioChildren.length > 1 && <div className={styles.hSeparator} />}

          <div className={styles.childrenRow}>
            {bioChildren.map(child => {
              const childData     = getGroupData(child);
              const grandChildren = getBioChildren(child);

              return (
                <div key={child.id} className={styles.childCol}>
                  <VLine h={4} />
                  <MemberGroup
                    member={child} raw={getRaw(child.id)} data={childData}
                    members={members} getRaw={getRaw} onSelect={onSelect} size="md"
                  />

                  {grandChildren.length > 0 && (
                    <>
                      <VLine h={6} />
                      <GenLabel label="Grandchildren" small />
                      {grandChildren.length > 1 && <div className={styles.hSeparator} />}

                      <div className={styles.grandChildrenRow}>
                        {grandChildren.map(gc => {
                          const gcData = getGroupData(gc);
                          return (
                            <div key={gc.id} className={styles.childCol}>
                              <VLine h={4} />
                              <MemberGroup
                                member={gc} raw={getRaw(gc.id)} data={gcData}
                                members={members} getRaw={getRaw} onSelect={onSelect} size="sm"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── MemberGroup ──────────────────────────────────────────────────────────────

function MemberGroup({
  member, raw, data, members, getRaw, onSelect, size,
}: {
  member: Member; raw: DBMember;
  data: {
    spouse: Member | null;
    a4dGiven: QuotaGrant[]; assocGiven: QuotaGrant[];
    succOut: SuccessionEvent[]; succIn: SuccessionEvent[];
    a4dIn: QuotaGrant | null; assocIn: QuotaGrant | null;
  };
  members: Member[];
  getRaw: (ac: string) => DBMember;
  onSelect: (id: string) => void;
  size: 'lg' | 'md' | 'sm';
}) {
  const { spouse, a4dGiven, assocGiven, succOut, a4dIn, assocIn } = data;

  const coreSectionClass = `${styles.coreSection} ${size === 'lg' ? styles.coreSectionLg : styles.coreSectionMd}`;
  const a4dSectionClass = `${styles.a4dSection} ${size === 'lg' ? styles.a4dSectionLg : styles.a4dSectionMd}`;
  const assocSectionClass = `${styles.assocSection} ${size === 'lg' ? styles.assocSectionLg : styles.assocSectionMd}`;
  const succSectionClass = `${styles.succSection} ${size === 'lg' ? styles.succSectionLg : styles.succSectionMd}`;

  return (
    <div className={`${styles.memberGroup} ${size === 'lg' ? styles.memberGroupLarge : ''}`}>

      <div className={coreSectionClass}>
        <CoreCard
          member={member} raw={raw} size={size}
          a4dIn={a4dIn} assocIn={assocIn} succIn={data.succIn}
          members={members} onSelect={onSelect}
        />
        {spouse && (
          <>
            <SpouseConnector size={size} />
            <CoreCard
              member={spouse} raw={getRaw(spouse.id)} size={size}
              a4dIn={null} assocIn={null} succIn={[]}
              members={members} onSelect={onSelect}
            />
          </>
        )}
      </div>

      {a4dGiven.length > 0 && (
        <div className={a4dSectionClass}>
          <div className={styles.a4dInner}>
            <div className={styles.a4dLabel}>A4D</div>
            <div className={styles.a4dCards}>
              {a4dGiven.map(g => {
                const grantee = members.find(m => m.id === g.granteeAc);
                return (
                  <SideCard
                    key={g.id}
                    member={grantee ?? null}
                    raw={grantee ? getRaw(grantee.id) : undefined}
                    label={`Slot ${g.slotNo}`}
                    cancelled={g.status !== 'Active'}
                    borderColor="#e9d5ff"
                    labelColor="#a855f7"
                    onSelect={grantee ? onSelect : undefined}
                    size={size}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {assocGiven.length > 0 && (
        <div className={assocSectionClass}>
          <div className={styles.assocInner}>
            <div className={styles.assocLabel}>Associate</div>
            <div className={styles.assocCards}>
              {assocGiven.map(g => {
                const grantee = members.find(m => m.id === g.granteeAc);
                return (
                  <SideCard
                    key={g.id}
                    member={grantee ?? null}
                    raw={grantee ? getRaw(grantee.id) : undefined}
                    label="Assoc"
                    cancelled={g.status !== 'Active'}
                    borderColor="#fed7aa"
                    labelColor="#f97316"
                    onSelect={grantee ? onSelect : undefined}
                    size={size}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {succOut.map(s => {
        const to = members.find(m => m.id === s.toAc);
        return (
          <div key={s.id} className={succSectionClass}>
            <ArrowRight size={10} className={styles.succArrow} />
            <div className={styles.succInner}>
              <div className={styles.succLabel}>{succShort(s.eventType)}</div>
              {to && (
                <SideCard
                  member={to}
                  raw={getRaw(to.id)}
                  label="Successor"
                  cancelled={false}
                  borderColor="#fecaca"
                  labelColor="#f87171"
                  onSelect={onSelect}
                  size={size}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── CoreCard ─────────────────────────────────────────────────────────────────

function CoreCard({
  member, raw, size, a4dIn, assocIn, succIn, members, onSelect,
}: {
  member: Member; raw: DBMember; size: 'lg' | 'md' | 'sm';
  a4dIn: QuotaGrant | null; assocIn: QuotaGrant | null;
  succIn: SuccessionEvent[];
  members: Member[]; onSelect: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent;

  const cardClass = `${styles.coreCard} ${
    size === 'lg' ? styles.coreCardLg : size === 'md' ? styles.coreCardMd : styles.coreCardSm
  }`;
  const avatarClass = `${styles.coreAvatar} ${
    size === 'lg' ? styles.coreAvatarLg : size === 'md' ? styles.coreAvatarMd : styles.coreAvatarSm
  }`;
  const nameClass = `${styles.coreName} ${
    size === 'lg' ? styles.coreNameLg : size === 'md' ? styles.coreNameMd : styles.coreNameSm
  }`;
  const idClass = `${styles.coreId} ${size === 'sm' ? styles.coreIdSm : styles.coreIdNormal}`;
  const badgeSizeClass = size === 'sm' ? styles.coreBadgeSm : styles.coreBadgeNormal;

  const card = (
    <div className={cardClass}>
      <div className={avatarClass} style={{ background: cfg.color }}>
        {getInitials(member.name)}
      </div>

      <div className={nameClass}>{member.name}</div>
      <div className={idClass}>{member.id}</div>

      <div className={styles.coreBadges}>
        <span className={`${styles.coreTypeBadge} ${badgeSizeClass}`} style={{ background: cfg.bg, color: cfg.dark }}>
          {member.type}
        </span>
        {raw?.status !== 'Active' && (
          <span className={`${styles.coreStatusBadge} ${
            raw?.status === 'Deceased'
              ? (size === 'sm' ? styles.coreStatusDeceasedSm : styles.coreStatusDeceased)
              : raw?.status === 'Cancelled'
              ? (size === 'sm' ? styles.coreStatusCancelledSm : styles.coreStatusCancelled)
              : (size === 'sm' ? styles.coreStatusOtherSm : styles.coreStatusOther)
          }`}>{raw?.status}</span>
        )}
      </div>

      {(a4dIn || assocIn || succIn.length > 0) && (
        <div className={styles.receivedSection}>
          {a4dIn && (
            <div className={`${styles.receivedBadge} ${size === 'sm' ? styles.receivedA4dSm : styles.receivedA4d}`}>
              A4D Slot {a4dIn.slotNo}{a4dIn.status !== 'Active' ? ' ✕' : ''}
            </div>
          )}
          {assocIn && (
            <div className={`${styles.receivedBadge} ${size === 'sm' ? styles.receivedAssocSm : styles.receivedAssoc}`}>
              Assoc
            </div>
          )}
          {succIn.map((s, i) => {
            const from = members.find(m => m.id === s.fromAc);
            return (
              <button key={i}
                onClick={e => { e.stopPropagation(); from && onSelect(from.id); }}
                className={`${styles.receivedSuccBtn} ${size === 'sm' ? styles.receivedSuccSm : styles.receivedSuccNormal}`}
              >
                ← {succShort(s.eventType)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return <button onClick={() => onSelect(member.id)}>{card}</button>;
}

// ─── SideCard ─────────────────────────────────────────────────────────────────

function SideCard({
  member, raw, label, cancelled, borderColor, labelColor, onSelect, size,
}: {
  member: Member | null; raw?: DBMember;
  label: string; cancelled?: boolean;
  borderColor: string; labelColor: string;
  onSelect?: (id: string) => void; size: 'lg' | 'md' | 'sm';
}) {
  const cfg = member ? (TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent) : null;
  const sizeClass = size === 'lg' ? styles.sideCardLg : styles.sideCardSm;

  const card = (
    <div
      className={`${styles.sideCard} ${sizeClass} ${cancelled ? styles.sideCardCancelled : ''} ${onSelect ? styles.sideCardClickable : ''}`}
      style={{ borderColor }}
    >
      <div className={styles.sideCardLabel} style={{ color: labelColor }}>{label}</div>
      {member && cfg ? (
        <>
          <div className={styles.sideCardAvatar} style={{ background: cfg.color }}>
            {getInitials(member.name)}
          </div>
          <div className={styles.sideCardName}>{member.name.split(' ')[0]}</div>
          <div className={styles.sideCardId}>{member.id}</div>
          {raw?.status !== 'Active' && (
            <div className={`${styles.sideCardStatus} ${raw?.status === 'Deceased' ? styles.sideCardStatusDeceased : styles.sideCardStatusRed}`}>
              {raw?.status}
            </div>
          )}
          {cancelled && <div className={styles.sideCardCancelledLabel}>Cancelled</div>}
        </>
      ) : (
        <div className={styles.sideCardEmpty}>—</div>
      )}
    </div>
  );

  if (member && onSelect) return <button onClick={() => onSelect(member.id)}>{card}</button>;
  return card;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function succShort(t: string) {
  if (t === 'Death')             return 'Death';
  if (t === 'VoluntaryTransfer') return 'Transfer';
  if (t === 'SeniorUpgrade')     return 'Upgrade';
  if (t === 'FamilyTransfer')    return 'FamilyTx';
  return t;
}

function GenLabel({ label, small }: { label: string; small?: boolean }) {
  return (
    <div className={`${styles.genLabel} ${small ? styles.genLabelSmall : styles.genLabelNormal}`}>
      {label}
    </div>
  );
}

function VLine({ h }: { h: number }) {
  return <div className={styles.vline} style={{ height: `${h * 4}px` }} />;
}

function SpouseConnector({ size }: { size: 'lg' | 'md' | 'sm' }) {
  return (
    <div className={styles.spouseConnector} style={{ marginTop: size === 'lg' ? 28 : 20 }}>
      <div className={styles.spouseLabel}>Spouse</div>
      <div className={size === 'sm' ? styles.spouseLineSm : styles.spouseLineLg} />
    </div>
  );
}
