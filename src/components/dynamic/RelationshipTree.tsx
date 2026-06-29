'use client';

import type { Member as DBMember, QuotaGrant, SuccessionEvent, Nominee } from '@prisma/client';
import type { Member } from '@/lib/types';
import { TYPE_CONFIG, getInitials } from '@/lib/memberUtils';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import s from './RelationshipTree.module.css';

// ─── Label color map ──────────────────────────────────────────────────────────

const GROUP_COLORS: Record<string, string> = {
  gray:   '#9ca3af',
  purple: '#c084fc',
  orange: '#fb923c',
};

// ─── Main export ──────────────────────────────────────────────────────────────

export default function RelationshipTree({
  member, raw, members, rawMembers, grants, successions, nominees, onSelect,
}: {
  member: Member;
  raw: DBMember;
  members: Member[];
  rawMembers: DBMember[];
  grants: QuotaGrant[];
  successions: SuccessionEvent[];
  nominees: Nominee[];
  onSelect: (id: string) => void;
}) {
  // ── Data lookups ──
  const fatherM = member.fatherId ? members.find(m => m.id === member.fatherId) ?? null : null;
  const motherM = member.motherId ? members.find(m => m.id === member.motherId) ?? null : null;
  const spouseM = (() => {
    if (member.rel === 'spouse' && member.pid) return members.find(m => m.id === member.pid) ?? null;
    return members.find(m => m.pid === member.id && m.rel === 'spouse') ?? null;
  })();

  const myGrant     = grants.find(g => g.granteeAc === member.id) ?? null;
  const grantorM    = myGrant ? members.find(m => m.id === myGrant.grantorAc) ?? null : null;
  const clubParentM = (!myGrant && member.pid && member.rel !== 'spouse')
    ? members.find(m => m.id === member.pid) ?? null : null;

  const bioChildIds = new Set(
    members.filter(m => m.fatherId === member.id || m.motherId === member.id).map(m => m.id)
  );
  const clubChildIds = new Set(
    members.filter(m => m.pid === member.id && m.rel === 'child').map(m => m.id)
  );
  const allChildIds = new Set([...bioChildIds, ...clubChildIds]);
  const allChildren = [...allChildIds].map(id => members.find(m => m.id === id)!).filter(Boolean);

  const a4dGranted   = grants.filter(g => g.grantorAc === member.id && g.grantType === 'A4D');
  const assocGranted = grants.filter(g => g.grantorAc === member.id && g.grantType === 'Associate');
  const assocMembers = members.filter(m => m.pid === member.id && m.rel === 'associate'
    && !assocGranted.find(g => g.granteeAc === m.id));

  const succIn  = successions.filter(sc => sc.toAc === member.id);
  const succOut = successions.filter(sc => sc.fromAc === member.id);
  const myNoms  = nominees.filter(n => n.memberAc === member.id).sort((a, b) => a.priority - b.priority);

  const hasBioParents = fatherM || motherM || member.fatherName || member.motherName;
  const hasBelow      = allChildren.length > 0 || a4dGranted.length > 0 || assocGranted.length > 0 || assocMembers.length > 0;
  const hasInfoPanels = succIn.length > 0 || succOut.length > 0 || myNoms.length > 0;

  const totalGroups = [allChildren.length > 0, a4dGranted.length > 0, (assocGranted.length + assocMembers.length) > 0]
    .filter(Boolean).length;

  return (
    <div className={s.container}>

      {/* ── Bio parents row ── */}
      {hasBioParents && (
        <>
          <div className={s.parentsRow}>
            {(fatherM || member.fatherName) && (
              <div className={s.parentCol}>
                <NodeCard
                  member={fatherM}
                  freeName={!fatherM ? (member.fatherName ?? '') : undefined}
                  freeType="Father"
                  raw={fatherM ? rawMembers.find(r => r.acNo === fatherM.id) : undefined}
                  role="Father"
                  onSelect={fatherM ? onSelect : undefined}
                />
                <div className={s.vlineSm} />
              </div>
            )}
            {(fatherM || member.fatherName) && (motherM || member.motherName) && (
              <div className={s.parentHline} />
            )}
            {(motherM || member.motherName) && (
              <div className={s.parentCol}>
                <NodeCard
                  member={motherM}
                  freeName={!motherM ? (member.motherName ?? '') : undefined}
                  freeType="Mother"
                  raw={motherM ? rawMembers.find(r => r.acNo === motherM.id) : undefined}
                  role="Mother"
                  onSelect={motherM ? onSelect : undefined}
                />
                <div className={s.vlineSm} />
              </div>
            )}
          </div>
          <div className={s.vlineZero} />
        </>
      )}

      {/* ── Center row: Grantor → Member ← Spouse ── */}
      <div className={s.centerRow}>
        {(grantorM || clubParentM) && (() => {
          const src   = grantorM ?? clubParentM!;
          const label = grantorM
            ? `Quota grantor (${myGrant?.grantType} #${myGrant?.slotNo})`
            : `Club parent (${member.rel})`;
          return (
            <>
              <div className={s.grantorCol}>
                <NodeCard
                  member={src}
                  raw={rawMembers.find(r => r.acNo === src.id)}
                  role={label}
                  onSelect={onSelect}
                />
              </div>
              <ArrowRight size={14} className={s.arrowGray} />
            </>
          );
        })()}

        <FocusCard member={member} raw={raw} />

        {spouseM && (
          <>
            <div className={s.spouseConnector}>
              <div className={s.spouseLabel}>Spouse</div>
              <div className={s.spouseLine} />
            </div>
            <NodeCard
              member={spouseM}
              raw={rawMembers.find(r => r.acNo === spouseM.id)}
              role="Spouse"
              onSelect={onSelect}
            />
          </>
        )}
      </div>

      {/* ── Vertical line down ── */}
      {hasBelow && <div className={s.vlineMd} />}

      {/* ── Groups below ── */}
      {hasBelow && (
        <div className={s.belowWrapper}>
          {totalGroups > 1 && <div className={s.spreadLine} />}
          <div className={s.groupsRow}>
            {allChildren.length > 0 && (
              <ChildGroup label="Children" labelColor="gray">
                {allChildren.map(child => {
                  const childBio  = bioChildIds.has(child.id);
                  const childClub = clubChildIds.has(child.id);
                  const tag = childBio && childClub ? 'bio + club' : childBio ? 'bio' : 'club';
                  return (
                    <ChildColumn key={child.id} lineColor="#e5e7eb">
                      <NodeCard
                        member={child}
                        raw={rawMembers.find(r => r.acNo === child.id)}
                        role={tag}
                        onSelect={onSelect}
                        extraInfo={getMemberExtras(child, members, grants)}
                      />
                    </ChildColumn>
                  );
                })}
              </ChildGroup>
            )}

            {a4dGranted.length > 0 && (
              <ChildGroup label="A4D Quota Given" labelColor="purple">
                {a4dGranted.map(g => {
                  const grantee = members.find(m => m.id === g.granteeAc) ?? null;
                  return (
                    <ChildColumn key={g.id} lineColor="#e9d5ff">
                      <NodeCard
                        member={grantee}
                        freeName={!grantee ? g.granteeAc : undefined}
                        raw={grantee ? rawMembers.find(r => r.acNo === g.granteeAc) : undefined}
                        role={`Slot #${g.slotNo}`}
                        roleColor="#a855f7"
                        cancelled={g.status !== 'Active' ? g.status : undefined}
                        articleRef={g.articleRef ?? undefined}
                        onSelect={grantee ? onSelect : undefined}
                        extraInfo={grantee ? getMemberExtras(grantee, members, grants) : undefined}
                      />
                    </ChildColumn>
                  );
                })}
              </ChildGroup>
            )}

            {(assocGranted.length + assocMembers.length) > 0 && (
              <ChildGroup label="Associates" labelColor="orange">
                {assocGranted.map(g => {
                  const assoc = members.find(m => m.id === g.granteeAc) ?? null;
                  return (
                    <ChildColumn key={g.id} lineColor="#fed7aa">
                      <NodeCard
                        member={assoc}
                        freeName={!assoc ? g.granteeAc : undefined}
                        raw={assoc ? rawMembers.find(r => r.acNo === g.granteeAc) : undefined}
                        role="Associate"
                        roleColor="#fb923c"
                        cancelled={g.status !== 'Active' ? g.status : undefined}
                        onSelect={assoc ? onSelect : undefined}
                      />
                    </ChildColumn>
                  );
                })}
                {assocMembers.map(a => (
                  <ChildColumn key={a.id} lineColor="#fed7aa">
                    <NodeCard
                      member={a}
                      raw={rawMembers.find(r => r.acNo === a.id)}
                      role="Associate"
                      roleColor="#fb923c"
                      onSelect={onSelect}
                    />
                  </ChildColumn>
                ))}
              </ChildGroup>
            )}
          </div>
        </div>
      )}

      {/* ── Info panels: Succession + Nominees ── */}
      {hasInfoPanels && (
        <div className={s.infoSection}>
          {(succIn.length > 0 || succOut.length > 0) && (
            <InfoPanel title="Succession / Transfer">
              {succIn.map(sc => {
                const from = members.find(m => m.id === sc.fromAc);
                return (
                  <div key={sc.id} className={s.succRow}>
                    <ArrowLeft size={12} style={{ color: '#60a5fa', flexShrink: 0 }} />
                    <span className={s.succLabel}>Received from</span>
                    {from
                      ? <button onClick={() => onSelect(from.id)} className={s.succMemberBtnBlue}>{from.name} ({from.id})</button>
                      : <span className={s.succFallback}>{sc.fromAc}</span>}
                    <span className={s.succBadgeBlue}>{sc.eventType}</span>
                    {sc.eventDate && <span className={s.succMeta}>{sc.eventDate}</span>}
                    {sc.articleRef && <span className={s.succMeta}>{sc.articleRef}</span>}
                    {sc.remarks && <span className={s.succRemarks}>· {sc.remarks}</span>}
                  </div>
                );
              })}
              {succOut.map(sc => {
                const to = members.find(m => m.id === sc.toAc);
                return (
                  <div key={sc.id} className={s.succRow}>
                    <ArrowRight size={12} style={{ color: '#fb923c', flexShrink: 0 }} />
                    <span className={s.succLabel}>Transferred to</span>
                    {to
                      ? <button onClick={() => onSelect(to.id)} className={s.succMemberBtnOrange}>{to.name} ({to.id})</button>
                      : <span className={s.succFallback}>{sc.toAc}</span>}
                    <span className={s.succBadgeOrange}>{sc.eventType}</span>
                    {sc.eventDate && <span className={s.succMeta}>{sc.eventDate}</span>}
                    {sc.remarks && <span className={s.succRemarks}>· {sc.remarks}</span>}
                  </div>
                );
              })}
            </InfoPanel>
          )}

          {myNoms.length > 0 && (
            <InfoPanel title="Nominees">
              <div className={s.nomineesList}>
                {myNoms.map(n => (
                  <div key={n.id} className={s.nomineeRow}>
                    <div className={s.nomineePriority}>{n.priority}</div>
                    <span className={s.nomineeName}>{n.nomineeName}</span>
                    {n.relToMember && <span className={s.nomineeRel}>({n.relToMember})</span>}
                    <span className={`${s.nomineeBadge} ${
                      n.status === 'Active' ? s.nomineeBadgeActive
                      : n.status === 'Used' ? s.nomineeBadgeUsed
                      : s.nomineeBadgeRevoked
                    }`}>{n.status}</span>
                  </div>
                ))}
              </div>
            </InfoPanel>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helper: compute short extras for a member node ───────────────────────────

function getMemberExtras(member: Member, members: Member[], grants: QuotaGrant[]): string[] {
  const extras: string[] = [];
  const myA4D   = grants.filter(g => g.grantorAc === member.id && g.grantType === 'A4D' && g.status === 'Active');
  const myAssoc = grants.filter(g => g.grantorAc === member.id && g.grantType === 'Associate' && g.status === 'Active');
  const spouse  = members.find(m => m.pid === member.id && m.rel === 'spouse');
  if (myA4D.length)   extras.push(`A4D: ${myA4D.length}`);
  if (myAssoc.length) extras.push(`Assoc: ${myAssoc.length}`);
  if (spouse)         extras.push(`Spouse: ${spouse.name.split(' ')[0]}`);
  return extras;
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function ChildGroup({ label, labelColor, children }: {
  label: string;
  labelColor: 'gray' | 'purple' | 'orange';
  children: React.ReactNode;
}) {
  return (
    <div className={s.childGroup}>
      <div className={s.childGroupLine} />
      <div className={s.childGroupLabel} style={{ color: GROUP_COLORS[labelColor] }}>{label}</div>
      <div className={s.childGroupItems}>{children}</div>
    </div>
  );
}

function ChildColumn({ lineColor, children }: { lineColor: string; children: React.ReactNode }) {
  return (
    <div className={s.childColumn}>
      <div className={s.childColumnLine} style={{ backgroundColor: lineColor }} />
      {children}
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={s.infoPanel}>
      <div className={s.infoPanelTitle}>{title}</div>
      <div className={s.infoPanelBody}>{children}</div>
    </div>
  );
}

// ─── Focus card (the selected member — larger) ────────────────────────────────

function FocusCard({ member, raw }: { member: Member; raw: DBMember }) {
  const cfg = TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent;
  return (
    <div className={s.focusCard}>
      <div className={s.focusAvatar} style={{ background: cfg.color }}>
        {getInitials(member.name)}
      </div>
      <div className={s.focusName}>{member.name}</div>
      <div className={s.focusId}>{member.id}</div>
      <div className={s.focusBadgeRow}>
        <span className={s.focusTypeBadge} style={{ background: cfg.bg, color: cfg.dark }}>{member.type}</span>
        {raw.status !== 'Active' && (
          <span className={s.focusStatusBadge}>{raw.status}</span>
        )}
      </div>
      {member.since && <div className={s.focusSince}>Since {member.since}</div>}
    </div>
  );
}

// ─── Regular node card ────────────────────────────────────────────────────────

function NodeCard({
  member, freeName, freeType, raw, role, roleColor, cancelled, articleRef, onSelect, extraInfo,
}: {
  member?: Member | null;
  freeName?: string;
  freeType?: string;
  raw?: DBMember;
  role?: string;
  roleColor?: string;
  cancelled?: string;
  articleRef?: string;
  onSelect?: (id: string) => void;
  extraInfo?: string[];
}) {
  const cfg = member ? (TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent) : null;

  const card = (
    <div className={[
      s.nodeCard,
      cancelled ? s.nodeCardCancelled : '',
      onSelect ? s.nodeCardClickable : '',
    ].filter(Boolean).join(' ')}>
      {role && (
        <div className={s.nodeRole} style={{ color: roleColor ?? '#9ca3af' }}>{role}</div>
      )}
      {member && cfg ? (
        <>
          <div className={s.nodeAvatar} style={{ background: cfg.color }}>
            {getInitials(member.name)}
          </div>
          <div className={s.nodeName}>{member.name}</div>
          <div className={s.nodeId}>{member.id}</div>
          <div className={s.nodeBadgeRow}>
            <span className={s.nodeTypeBadge} style={{ background: cfg.bg, color: cfg.dark }}>{member.type}</span>
            {raw?.status === 'Deceased' && <span className={s.nodeDeceased}>Deceased</span>}
            {raw?.status === 'Cancelled' && <span className={s.nodeCancelled}>Cancelled</span>}
          </div>
          {articleRef && <div className={s.nodeArticle}>{articleRef}</div>}
          {extraInfo && extraInfo.length > 0 && (
            <div className={s.nodeExtras}>
              {extraInfo.map((e, i) => (
                <div key={i} className={s.nodeExtraItem}>{e}</div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className={s.nodeFreeName}>{freeName}</div>
      )}
      {freeType && !member && <div className={s.nodeFreeType}>{freeType}</div>}
      {cancelled && <div className={s.nodeCancelledBadge}>{cancelled}</div>}
    </div>
  );

  if (member && onSelect) {
    return <button onClick={() => onSelect(member.id)}>{card}</button>;
  }
  return card;
}
