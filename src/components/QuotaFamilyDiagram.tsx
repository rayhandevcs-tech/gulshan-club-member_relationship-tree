'use client';

import { TYPE_CONFIG, getInitials } from '@/lib/memberUtils';
import type { Member } from '@/lib/types';
import styles from './QuotaFamilyDiagram.module.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

const dead = (m: Member) => m.name.toLowerCase().startsWith('late ');
const label = (m: Member) => dead(m) ? m.name.replace(/^late\s+/i, '') : m.name;

function cardCol(m: Member): { border: string; avatarBg: string; cardBg: string } {
  if (dead(m)) return { border: '#F59E0B', avatarBg: '#D97706', cardBg: '#FFFBEB' };
  const c = TYPE_CONFIG[m.type] ?? TYPE_CONFIG.Permanent;
  return { border: c.color, avatarBg: c.color, cardBg: '#FFFFFF' };
}

function bioLabel(grantee: Member, sponsorIds: Set<string>, members: Member[]): string | null {
  if (grantee.rel === 'spouse') return 'Spouse';
  const title = grantee.gender === 'M' ? 'Son' : grantee.gender === 'F' ? 'Daughter' : 'Child';
  const f = grantee.fatherId ? members.find(m => m.id === grantee.fatherId) : null;
  const mo = grantee.motherId ? members.find(m => m.id === grantee.motherId) : null;
  if (f && sponsorIds.has(f.id)) return title;
  if (mo && sponsorIds.has(mo.id)) return title;
  if (mo) return `${title} of ${mo.name.split(' ')[0]}`;
  if (f) return `${title} of ${f.name.split(' ')[0]}`;
  if (grantee.motherName) return `${title} of ${grantee.motherName.split(' ')[0]}`;
  if (grantee.fatherName) return `${title} of ${grantee.fatherName.split(' ')[0]}`;
  return null;
}

// Life/Senior/Donor spouses appear BESIDE — independent membership.
// Permanent spouses go in the A4D slot UNLESS they are also the account successor (then beside + transfer badge).
const CORE_TYPES = new Set(['Life', 'Life Senior', 'Senior', 'Donor']);
function showsBeside(spouseId: string, sponsorId: string, members: Member[]): boolean {
  const spouse = members.find(x => x.id === spouseId);
  if (!spouse) return false;
  if (CORE_TYPES.has(spouse.type)) return true;
  const sponsor = members.find(x => x.id === sponsorId);
  return sponsor?.succession === spouseId;
}

function memberHasData(id: string, members: Member[], forSpouse = false, excludeIds?: Set<string>): boolean {
  if (forSpouse) {
    return members.some(x =>
      x.pid === id &&
      (x.rel === 'a4d' || x.rel === 'associate' || x.rel === 'nominee') &&
      (!excludeIds || !excludeIds.has(x.id))
    );
  }
  return members.some(x =>
    x.pid === id &&
    (x.rel === 'a4d' || (x.rel === 'spouse' && !showsBeside(x.id, id, members)) || x.rel === 'associate' || x.rel === 'nominee') &&
    (!excludeIds || !excludeIds.has(x.id))
  );
}

// ── SlotCard ──────────────────────────────────────────────────────────────────

function SlotCard({ member: m, members, sponsorIds, small, onPick }: {
  member: Member;
  members: Member[];
  sponsorIds: Set<string>;
  small?: boolean;
  onPick: () => void;
}) {
  const { border, avatarBg, cardBg } = cardCol(m);
  const name = label(m);
  const bl = bioLabel(m, sponsorIds, members);
  return (
    <button
      className={`${styles.slotCard} ${small ? styles.slotCardSmall : styles.slotCardNormal}`}
      style={{ borderColor: border, background: cardBg }}
      onClick={onPick}
    >
      <div className={styles.slotHeader}>
        <div
          className={`${styles.slotAvatar} ${small ? styles.slotAvatarSmall : styles.slotAvatarNormal}`}
          style={{ background: avatarBg }}
        >
          {getInitials(name)}
        </div>
        <div className={styles.slotInfo}>
          <div className={`${styles.slotName} ${small ? styles.slotNameSmall : styles.slotNameNormal}`}>{name}</div>
          <div className={`${styles.slotId} ${small ? styles.slotIdSmall : styles.slotIdNormal}`}>{m.id}</div>
        </div>
      </div>
      {bl && !small && (
        <div className={styles.slotBioLabel}>{bl}</div>
      )}
    </button>
  );
}

// ── CoreCard ──────────────────────────────────────────────────────────────────

function CoreCard({ member: m, onPick }: { member: Member; onPick: () => void }) {
  const { border, avatarBg, cardBg } = cardCol(m);
  const name = label(m);
  return (
    <button
      className={styles.coreCard}
      style={{ borderColor: border, background: cardBg }}
      onClick={onPick}
    >
      <div className={styles.coreAvatar} style={{ background: avatarBg }}>
        {getInitials(name)}
      </div>
      <div className={styles.coreName}>{name}</div>
      <div className={styles.coreId}>{m.id}</div>
      {dead(m) && <span className={styles.deceasedBadge}>Deceased</span>}
    </button>
  );
}

// ── TransferCard ─────────────────────────────────────────────────────────────

function TransferCard({ member: m, onPick }: { member: Member; onPick: () => void }) {
  const { border, avatarBg } = cardCol(m);
  const name = label(m);
  return (
    <button
      className={styles.transferCard}
      style={{ borderColor: border }}
      onClick={onPick}
    >
      <div className={styles.transferAvatar} style={{ background: avatarBg }}>
        {getInitials(name)}
      </div>
      <div className={styles.transferName}>{name}</div>
      <div className={styles.transferId}>{m.id}</div>
    </button>
  );
}

// ── QuotaSection ──────────────────────────────────────────────────────────────

function QuotaSection({ member: m, coupleIds, members, onPick, bioChildIds }: {
  member: Member;
  coupleIds: Set<string>;
  members: Member[];
  onPick: (id: string) => void;
  bioChildIds?: Set<string>;
}) {
  const a4dFilled = members.filter(x =>
    x.pid === m.id &&
    (x.rel === 'a4d' || (x.rel === 'spouse' && !showsBeside(x.id, m.id, members))) &&
    (!bioChildIds || !bioChildIds.has(x.id))
  );
  const assocFilled = members.filter(x =>
    x.pid === m.id &&
    (x.rel === 'associate' || x.rel === 'nominee') &&
    (!bioChildIds || !bioChildIds.has(x.id))
  );

  if (a4dFilled.length === 0 && assocFilled.length === 0) return null;

  return (
    <div className={styles.sectionRow}>

      {a4dFilled.length > 0 && (
        <div className={styles.a4dCol}>
          <div className={styles.sectionLabel} style={{ background: '#9333ea18', color: '#7c3aed' }}>A4D</div>
          <div style={{ width: 1.5, height: 6, background: '#9CA3AF' }} />
          <div className={styles.slotsRow}>
            {a4dFilled.length > 1 && (
              <div
                className={styles.hbar}
                style={{ position: 'absolute', top: 0, left: '24%', right: '24%' }}
              />
            )}
            {a4dFilled.map(slot => {
              const slotA4D = members.filter(x => x.pid === slot.id && x.rel === 'a4d');
              const slotAssocs = members.filter(x => x.pid === slot.id && (x.rel === 'associate' || x.rel === 'nominee'));
              const hasSubItems = slotA4D.length > 0 || slotAssocs.length > 0;
              return (
                <div key={slot.id} className={styles.slotItemCol}>
                  <div style={{ width: 1.5, height: 10, background: '#9CA3AF' }} />
                  <SlotCard
                    member={slot}
                    members={members}
                    sponsorIds={coupleIds}
                    onPick={() => onPick(slot.id)}
                  />
                  {hasSubItems && (
                    <div className={styles.subAssocSection}>
                      <div className={styles.vline} style={{ width: 1.5, height: 12 }} />
                      {slotA4D.length > 0 && (
                        <>
                          <div className={styles.subAssocLabel}>A4D</div>
                          <div className={styles.subAssocRow}>
                            {slotA4D.map(ga => (
                              <SlotCard
                                key={ga.id}
                                member={ga}
                                members={members}
                                sponsorIds={new Set([slot.id])}
                                small
                                onPick={() => onPick(ga.id)}
                              />
                            ))}
                          </div>
                        </>
                      )}
                      {slotAssocs.length > 0 && (
                        <>
                          <div className={styles.subAssocLabel}>Assoc</div>
                          <div className={styles.subAssocRow}>
                            {slotAssocs.map(ga => (
                              <SlotCard
                                key={ga.id}
                                member={ga}
                                members={members}
                                sponsorIds={new Set([slot.id])}
                                small
                                onPick={() => onPick(ga.id)}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {assocFilled.length > 0 && (
        <div className={styles.assocCol}>
          <div className={styles.sectionLabel} style={{ background: '#ea580c18', color: '#c2410c' }}>Assoc</div>
          <div style={{ width: 1.5, height: 6, background: '#9CA3AF' }} />
          <div className={styles.slotsRow}>
            {assocFilled.length > 1 && (
              <div
                className={styles.hbar}
                style={{ position: 'absolute', top: 0, left: '24%', right: '24%' }}
              />
            )}
            {assocFilled.map(slot => (
              <div key={slot.id} className={styles.slotItemCol}>
                <div style={{ width: 1.5, height: 10, background: '#9CA3AF' }} />
                <SlotCard
                  member={slot}
                  members={members}
                  sponsorIds={coupleIds}
                  onPick={() => onPick(slot.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── QuotaTree (recursive) ─────────────────────────────────────────────────────

function QuotaTree({ member: m, members, onPick, bioMode }: {
  member: Member;
  members: Member[];
  onPick: (id: string) => void;
  bioMode?: boolean;
}) {
  const spouseRaw = members.find(x => x.pid === m.id && x.rel === 'spouse') ?? null;
  const spouseBeside = spouseRaw && showsBeside(spouseRaw.id, m.id, members) ? spouseRaw : null;
  const coupleIds = new Set([m.id, ...(spouseBeside ? [spouseBeside.id] : [])]);

  const succNote = m.succession;
  const isTransferToSpouse = succNote && spouseBeside && succNote === spouseBeside.id;
  const succMember = (succNote && !isTransferToSpouse) ? (members.find(x => x.id === succNote) ?? null) : null;

  // bioMode (Family Relationship): bio children via fatherId/motherId — A4D/Assoc excluded for bio children.
  // non-bioMode (Member Relationship): rel=child members in Children section + A4D/Assoc quota below each.
  const bioChildren = bioMode
    ? members.filter(x => {
        if (coupleIds.has(x.id)) return false;
        const isBio =
          (x.fatherId != null && coupleIds.has(x.fatherId)) ||
          (x.motherId != null && coupleIds.has(x.motherId));
        const isChild = x.rel === 'child' && coupleIds.has(x.pid ?? '');
        return isBio || isChild;
      })
    : members.filter(x =>
        x.rel === 'child' && (x.pid === m.id || (spouseBeside && x.pid === spouseBeside.id))
      );

  const bioChildIds = new Set(bioChildren.map(c => c.id));

  const hasM = memberHasData(m.id, members, false, bioChildIds);
  const hasS = spouseBeside ? memberHasData(spouseBeside.id, members, true, bioChildIds) : false;
  const showBadge = !!spouseBeside && hasM && hasS;
  const LINE = '#9CA3AF';

  const memberCol = (mem: Member, hasQuota: boolean) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <CoreCard member={mem} onPick={() => onPick(mem.id)} />
      {hasQuota && (
        <>
          <div style={{ width: 1.5, height: 20, background: LINE, marginTop: 6 }} />
          {showBadge && (
            <div
              className={styles.memberIdBadge}
              style={{
                color: (TYPE_CONFIG[mem.type] ?? TYPE_CONFIG.Permanent).color,
                background: (TYPE_CONFIG[mem.type] ?? TYPE_CONFIG.Permanent).bg,
              }}
            >
              {mem.id}
            </div>
          )}
          <QuotaSection member={mem} coupleIds={coupleIds} members={members} onPick={onPick} bioChildIds={bioChildIds} />
        </>
      )}
    </div>
  );

  return (
    <div className={styles.treeCol}>

      {/* Couple row — transfer target (left), member, optional beside-spouse */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>

        {/* Membership transfer card — shown to the LEFT of the member, with its own quota */}
        {succMember != null && !isTransferToSpouse && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <TransferCard member={succMember} onPick={() => onPick(succMember!.id)} />
              {memberHasData(succMember.id, members) && (
                <>
                  <div style={{ width: 1.5, height: 20, background: LINE, marginTop: 6 }} />
                  <QuotaSection
                    member={succMember}
                    coupleIds={new Set([succMember.id])}
                    members={members}
                    onPick={onPick}
                  />
                </>
              )}
            </div>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              alignSelf: 'flex-start', paddingTop: 54,
              paddingLeft: 8, paddingRight: 8, flexShrink: 0,
            }}>
              <div className={styles.transferBadge}>← A/C transferred</div>
              <div style={{ width: 32, height: 1.5, background: '#F59E0B' }} />
            </div>
          </>
        )}
        {succNote && !succMember && !isTransferToSpouse && (
          <div style={{
            alignSelf: 'flex-start', paddingTop: 60,
            paddingRight: 6, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <div className={styles.successionCard}>{succNote}</div>
            <div style={{ width: 20, height: 1.5, background: '#F59E0B' }} />
          </div>
        )}

        {memberCol(m, hasM)}

        {spouseBeside && (
          <>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              alignSelf: 'flex-start', paddingTop: 54,
              paddingLeft: 8, paddingRight: 8, flexShrink: 0,
            }}>
              {isTransferToSpouse && (
                <div className={styles.transferBadge}>A/C transferred →</div>
              )}
              <span className={styles.spouseLabel}>Spouse</span>
              <div style={{ width: 28, height: 1.5, background: LINE }} />
            </div>
            {memberCol(spouseBeside, hasS)}
          </>
        )}
      </div>

      {/* Bio children */}
      {bioChildren.length > 0 && (
        <div className={styles.childrenSection}>
          <div style={{ width: 1.5, height: 28, background: LINE, marginTop: 16 }} />
          <span className={styles.childrenLabel}>Children</span>
          <div style={{ width: 1.5, height: 14, background: LINE }} />
          <div className={styles.childrenRow}>
            {bioChildren.map((child, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === bioChildren.length - 1;
              const multi = bioChildren.length > 1;
              const relLabel = bioMode
                ? (child.gender === 'M' ? 'Son' : child.gender === 'F' ? 'Daughter' : 'Child')
                : null;
              return (
                <div key={child.id} className={styles.childWrapper}>
                  {multi && (
                    <div
                      className={
                        isFirst ? styles.siblingBarLeft :
                        isLast ? styles.siblingBarRight :
                        styles.siblingBarBoth
                      }
                    />
                  )}
                  <div className={styles.childStem} />
                  <div className={styles.childCard}>
                    <QuotaTree member={child} members={members} onPick={onPick} bioMode={bioMode} />
                  </div>
                  {relLabel && <div className={styles.bioChildLabel}>{relLabel}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root finder ───────────────────────────────────────────────────────────────

function findRoot(startId: string, members: Member[]): string {
  let cur = startId;
  const seen = new Set<string>();
  while (!seen.has(cur)) {
    seen.add(cur);
    const m = members.find(x => x.id === cur);
    if (!m?.pid) break;
    cur = m.pid;
  }
  return cur;
}

// ── Export ────────────────────────────────────────────────────────────────────

export function QuotaFamilyDiagram({ rootId, members, onPick, bioMode }: {
  rootId: string;
  members: Member[];
  onPick: (id: string) => void;
  bioMode?: boolean;
}) {
  const rootMember = members.find(m => m.id === findRoot(rootId, members));
  if (!rootMember) return null;
  return (
    <div className={styles.root}>
      <QuotaTree member={rootMember} members={members} onPick={onPick} bioMode={bioMode} />
    </div>
  );
}
