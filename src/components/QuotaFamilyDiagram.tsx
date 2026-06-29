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

function hasOwnQuota(id: string, members: Member[]): boolean {
  return members.some(m => m.pid === id && m.rel === 'a4d');
}

function memberHasData(id: string, members: Member[], forSpouse = false): boolean {
  if (forSpouse) {
    return members.some(x => x.pid === id && (x.rel === 'a4d' || x.rel === 'associate' || x.rel === 'nominee'));
  }
  return members.some(x =>
    x.pid === id &&
    (x.rel === 'a4d' || (x.rel === 'spouse' && !hasOwnQuota(x.id, members)) || x.rel === 'associate' || x.rel === 'nominee')
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
  const cfg = TYPE_CONFIG[m.type] ?? TYPE_CONFIG.Permanent;
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
      {!small && (
        <div>
          <span className={styles.slotTypeBadge} style={{ background: cfg.bg, color: cfg.dark }}>{m.type}</span>
        </div>
      )}
    </button>
  );
}

// ── CoreCard ──────────────────────────────────────────────────────────────────

function CoreCard({ member: m, onPick }: { member: Member; onPick: () => void }) {
  const { border, avatarBg, cardBg } = cardCol(m);
  const name = label(m);
  const cfg = TYPE_CONFIG[m.type] ?? TYPE_CONFIG.Permanent;
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
      <span className={styles.coreTypeBadge} style={{ background: cfg.bg, color: cfg.dark }}>{m.type}</span>
      {dead(m) && <span className={styles.deceasedBadge}>Deceased</span>}
    </button>
  );
}

// ── QuotaSection ──────────────────────────────────────────────────────────────

function QuotaSection({ member: m, coupleIds, members, onPick }: {
  member: Member;
  coupleIds: Set<string>;
  members: Member[];
  onPick: (id: string) => void;
}) {
  const a4dFilled = members.filter(x =>
    x.pid === m.id &&
    (x.rel === 'a4d' || (x.rel === 'spouse' && !hasOwnQuota(x.id, members)))
  );
  const assocFilled = members.filter(x => x.pid === m.id && (x.rel === 'associate' || x.rel === 'nominee'));

  if (a4dFilled.length === 0 && assocFilled.length === 0) return null;

  return (
    <div className={styles.sectionRow}>

      {a4dFilled.length > 0 && (
        <div className={styles.a4dCol}>
          <div className={styles.sectionLabel} style={{ background: '#9333ea18', color: '#7c3aed' }}>A4D</div>
          <div className={styles.slotsRow} style={{ paddingTop: a4dFilled.length > 1 ? 10 : 0 }}>
            {a4dFilled.length > 1 && (
              <div
                className={styles.hbar}
                style={{ position: 'absolute', top: 0, left: '24%', right: '24%' }}
              />
            )}
            {a4dFilled.map(slot => {
              const granteeAssocs = members.filter(x => x.pid === slot.id && (x.rel === 'associate' || x.rel === 'nominee'));
              return (
                <div key={slot.id} className={styles.slotItemCol}>
                  <SlotCard
                    member={slot}
                    members={members}
                    sponsorIds={coupleIds}
                    onPick={() => onPick(slot.id)}
                  />
                  {granteeAssocs.length > 0 && (
                    <div className={styles.subAssocSection}>
                      <div className={styles.vline} style={{ width: 1.5, height: 12 }} />
                      <div className={styles.subAssocLabel}>Assoc</div>
                      <div className={styles.subAssocRow}>
                        {granteeAssocs.map(ga => (
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {assocFilled.map(slot => (
              <SlotCard
                key={slot.id}
                member={slot}
                members={members}
                sponsorIds={coupleIds}
                onPick={() => onPick(slot.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── QuotaTree (recursive) ─────────────────────────────────────────────────────

function QuotaTree({ member: m, members, onPick }: {
  member: Member;
  members: Member[];
  onPick: (id: string) => void;
}) {
  const spouseRaw = members.find(x => x.pid === m.id && x.rel === 'spouse') ?? null;
  const spouseBeside = spouseRaw && hasOwnQuota(spouseRaw.id, members) ? spouseRaw : null;
  const coupleIds = new Set([m.id, ...(spouseBeside ? [spouseBeside.id] : [])]);
  const showDual = !!spouseBeside;

  const succNote = m.succession;
  const isTransferToSpouse = succNote && spouseBeside && succNote === spouseBeside.id;

  const bioChildren = members.filter(x =>
    x.rel === 'child' && (x.pid === m.id || (spouseBeside && x.pid === spouseBeside.id))
  );

  const hasM = memberHasData(m.id, members);
  const hasS = spouseBeside ? memberHasData(spouseBeside.id, members, true) : false;
  const hasAnyQuota = hasM || hasS;

  return (
    <div className={styles.treeCol}>

      {/* Couple row */}
      <div className={styles.coupleRow}>

        {succNote && !isTransferToSpouse && (
          <div className={styles.successionBox}>
            <div className={styles.successionCard}>{succNote}</div>
            <div className={styles.successionArrow}>→</div>
          </div>
        )}

        <CoreCard member={m} onPick={() => onPick(m.id)} />

        {spouseBeside && (
          <>
            <div className={styles.spouseConnector}>
              {isTransferToSpouse && (
                <div className={styles.transferBadge}>A/C transferred →</div>
              )}
              <span className={styles.spouseLabel}>Spouse</span>
              <div className={styles.spouseLine} />
            </div>
            <CoreCard member={spouseBeside} onPick={() => onPick(spouseBeside.id)} />
          </>
        )}
      </div>

      {/* Connector + Quota sections */}
      {hasAnyQuota && (
        <>
          <div className={styles.vline} style={{ width: 1.5, height: 20, marginTop: 8 }} />

          <div className={styles.quotaRow}>
            {showDual && hasM && hasS && (
              <div
                className={styles.hbar}
                style={{ position: 'absolute', top: -1, left: '22%', right: '22%' }}
              />
            )}

            {hasM && (
              <div className={styles.quotaCol}>
                {showDual && (
                  <div
                    className={styles.memberIdBadge}
                    style={{
                      color: (TYPE_CONFIG[m.type] ?? TYPE_CONFIG.Permanent).color,
                      background: (TYPE_CONFIG[m.type] ?? TYPE_CONFIG.Permanent).bg,
                    }}
                  >
                    {m.id}
                  </div>
                )}
                <QuotaSection member={m} coupleIds={coupleIds} members={members} onPick={onPick} />
              </div>
            )}

            {spouseBeside && hasS && (
              <div className={styles.quotaCol}>
                <div
                  className={styles.memberIdBadge}
                  style={{
                    color: (TYPE_CONFIG[spouseBeside.type] ?? TYPE_CONFIG.Permanent).color,
                    background: (TYPE_CONFIG[spouseBeside.type] ?? TYPE_CONFIG.Permanent).bg,
                  }}
                >
                  {spouseBeside.id}
                </div>
                <QuotaSection member={spouseBeside} coupleIds={coupleIds} members={members} onPick={onPick} />
              </div>
            )}
          </div>
        </>
      )}

      {/* Bio children */}
      {bioChildren.length > 0 && (
        <div className={styles.childrenSection}>
          <div className={styles.vline} style={{ width: 1.5, height: 24, marginTop: 20 }} />
          <span className={styles.childrenLabel}>Children</span>
          <div className={styles.vline} style={{ width: 1.5, height: 16 }} />

          <div className={styles.childrenRow}>
            {bioChildren.map((child, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === bioChildren.length - 1;
              const multi = bioChildren.length > 1;
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
                    <QuotaTree member={child} members={members} onPick={onPick} />
                  </div>
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

export function QuotaFamilyDiagram({ rootId, members, onPick }: {
  rootId: string;
  members: Member[];
  onPick: (id: string) => void;
}) {
  const rootMember = members.find(m => m.id === findRoot(rootId, members));
  if (!rootMember) return null;
  return (
    <div className={styles.root}>
      <QuotaTree member={rootMember} members={members} onPick={onPick} />
    </div>
  );
}
