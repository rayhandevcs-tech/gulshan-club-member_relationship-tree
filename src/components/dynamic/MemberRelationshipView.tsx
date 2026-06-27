'use client';

import type { Member as DBMember, QuotaGrant, SuccessionEvent, Nominee } from '@prisma/client';
import type { Member } from '@/lib/types';
import { TYPE_CONFIG, getInitials } from '@/lib/memberUtils';
import {
  Heart, GitBranch, Users, ArrowRight, ArrowLeft, User,
  UserCheck, AlertCircle, CheckCircle,
} from 'lucide-react';

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

  // Spouse: either this member IS the spouse (rel=spouse, pid = partner) or partner has rel=spouse pointing to this
  const spouseMember = ((): Member | null => {
    if (member.rel === 'spouse' && member.pid) return members.find(m => m.id === member.pid) ?? null;
    return members.find(m => m.pid === member.id && m.rel === 'spouse') ?? null;
  })();

  const bioChildren = members.filter(m => m.fatherId === member.id || m.motherId === member.id);

  // ── Club structure ──
  const myGrant = grants.find(g => g.granteeAc === member.id) ?? null;
  const grantorMember = myGrant ? members.find(m => m.id === myGrant.grantorAc) ?? null : null;

  // Structural parent (pid) when not covered by grant
  const clubParentMember = (member.pid && !myGrant)
    ? members.find(m => m.id === member.pid) ?? null
    : null;

  const clubChildren = members.filter(m => m.pid === member.id && m.rel === 'child');

  // ── A4D & Associates granted ──
  const a4dGranted = grants.filter(g => g.grantorAc === member.id && g.grantType === 'A4D');
  const assocGranted = grants.filter(g => g.grantorAc === member.id && g.grantType === 'Associate');

  // Structural associates (pid = this, rel = associate) not already in assocGranted
  const structAssociates = members.filter(m =>
    m.pid === member.id && m.rel === 'associate' && !assocGranted.find(g => g.granteeAc === m.id)
  );

  // ── Succession ──
  const succIn  = successions.filter(s => s.toAc === member.id);
  const succOut = successions.filter(s => s.fromAc === member.id);

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
    <div className="space-y-3 max-w-2xl">

      {/* ── Member header card ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-start gap-4 shadow-sm">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-[15px] font-bold text-white shrink-0"
          style={{ background: cfg.color }}
        >
          {getInitials(member.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[16px] font-semibold text-gray-800 dark:text-gray-100">{member.name}</span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.dark }}
            >
              {member.type}
            </span>
            <StatusBadge status={raw.status} />
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500">{member.id}</span>
            {member.memberId && <span className="text-[11px] text-gray-400 dark:text-gray-500">{member.memberId}</span>}
            {member.since && <span className="text-[11px] text-gray-400 dark:text-gray-500">Since {member.since}</span>}
            {member.birthDate && <span className="text-[11px] text-gray-400 dark:text-gray-500">b. {member.birthDate}</span>}
          </div>
          {(member.phone || member.email) && (
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {member.phone && <span className="text-[11px] text-gray-500 dark:text-gray-400">{member.phone}</span>}
              {member.email && <span className="text-[11px] text-gray-500 dark:text-gray-400">{member.email}</span>}
            </div>
          )}
          {raw.notes && <div className="text-[11px] text-gray-400 dark:text-gray-500 italic mt-1">{raw.notes}</div>}
        </div>
      </div>

      {/* ── Bio Family ── */}
      {(hasBioParents || hasSpouse || hasBioChildren) && (
        <Section title="Biological Family" icon={<Heart size={12} />} accent="pink">
          <div className="space-y-3">

            {/* Parents row */}
            {hasBioParents && (
              <div>
                <RowLabel>Parents</RowLabel>
                <div className="flex gap-2 flex-wrap mt-1">
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

            {/* Spouse row */}
            {hasSpouse && (
              <div>
                <RowLabel>Spouse</RowLabel>
                <div className="mt-1">
                  <MiniCard
                    label="Spouse"
                    member={spouseMember}
                    onSelect={onSelectMember}
                  />
                </div>
              </div>
            )}

            {/* Bio children */}
            {hasBioChildren && (
              <div>
                <RowLabel>Children (biological)</RowLabel>
                <div className="flex gap-2 flex-wrap mt-1">
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
            <div className="flex items-center gap-2 flex-wrap">
              <ArrowLeft size={12} className="text-blue-400 shrink-0" />
              <span className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0">Received quota from</span>
              <MiniCard member={grantorMember} onSelect={onSelectMember} />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                  {myGrant.grantType} Slot #{myGrant.slotNo}
                </span>
                {myGrant.articleRef && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{myGrant.articleRef}</span>
                )}
                {myGrant.grantedDate && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{myGrant.grantedDate}</span>
                )}
                {myGrant.status !== 'Active' && (
                  <span className="text-[10px] text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                    {myGrant.status}: {myGrant.cancelReason}
                  </span>
                )}
              </div>
            </div>
          )}
          {hasClubParent && clubParentMember && (
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <GitBranch size={12} className="text-gray-400 shrink-0" />
              <span className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0">Club parent</span>
              <MiniCard member={clubParentMember} onSelect={onSelectMember} />
              <span className="text-[10px] text-gray-400 dark:text-gray-500">({member.rel})</span>
            </div>
          )}
        </Section>
      )}

      {/* ── Club children (next generation members) ── */}
      {hasClubChildren && (
        <Section title="Children (Club Members)" icon={<Users size={12} />} accent="green">
          <RowLabel>These members joined the club as {member.name}&apos;s children (separate quotas)</RowLabel>
          <div className="flex gap-2 flex-wrap mt-2">
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
          <div className="flex gap-3 flex-wrap mt-2">
            {a4dGranted.map(g => {
              const grantee = members.find(m => m.id === g.granteeAc) ?? null;
              const rawGrantee = rawMembers.find(m => m.acNo === g.granteeAc);
              // Sub-grantees under this A4D member
              const theirA4D = grants.filter(sg => sg.grantorAc === g.granteeAc && sg.grantType === 'A4D');
              const theirAssoc = grants.filter(sg => sg.grantorAc === g.granteeAc && sg.grantType === 'Associate');
              return (
                <div key={g.id} className="flex flex-col items-center gap-1">
                  {/* Connecting line */}
                  <div className="w-px h-3 bg-purple-200 dark:bg-purple-800" />
                  <div className={`border rounded-xl p-2.5 min-w-28 ${
                    g.status === 'Active'
                      ? 'border-purple-100 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-900/10'
                      : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 opacity-60'
                  }`}>
                    {grantee ? (
                      <button
                        onClick={() => onSelectMember(grantee.id)}
                        className="flex flex-col items-center gap-0.5 w-full text-center hover:opacity-80 transition-opacity"
                      >
                        <Avatar member={grantee} size="sm" />
                        <span className="text-[10px] font-medium text-gray-800 dark:text-gray-100 leading-tight mt-0.5 max-w-24 truncate">{grantee.name}</span>
                        <span className="text-[9px] font-mono text-gray-400 dark:text-gray-500">{grantee.id}</span>
                      </button>
                    ) : (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{g.granteeAc}</div>
                    )}
                    <div className="mt-1.5 flex flex-col gap-0.5 items-center">
                      <span className="text-[9px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-px rounded-full font-medium">
                        Slot #{g.slotNo}
                      </span>
                      {g.articleRef && <span className="text-[9px] text-gray-400 dark:text-gray-500">{g.articleRef}</span>}
                      {g.status !== 'Active' && (
                        <span className="text-[9px] text-red-400">{g.status}</span>
                      )}
                      {rawGrantee?.status === 'Deceased' && (
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 italic">Deceased</span>
                      )}
                    </div>
                    {/* Their own A4D / Associates */}
                    {(theirA4D.length > 0 || theirAssoc.length > 0) && (
                      <div className="mt-2 pt-1.5 border-t border-purple-100 dark:border-purple-900/30 flex flex-col gap-0.5">
                        {theirA4D.map(sg => {
                          const sgm = members.find(m => m.id === sg.granteeAc);
                          return (
                            <button
                              key={sg.id}
                              onClick={() => onSelectMember(sg.granteeAc)}
                              className="text-[9px] text-purple-500 dark:text-purple-400 hover:underline text-left truncate max-w-full"
                            >
                              ↳ A4D: {sgm?.name ?? sg.granteeAc}
                            </button>
                          );
                        })}
                        {theirAssoc.map(sg => {
                          const sgm = members.find(m => m.id === sg.granteeAc);
                          return (
                            <button
                              key={sg.id}
                              onClick={() => onSelectMember(sg.granteeAc)}
                              className="text-[9px] text-orange-400 hover:underline text-left truncate max-w-full"
                            >
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
          <div className="flex gap-2 flex-wrap mt-2">
            {assocGranted.map(g => {
              const assoc = members.find(m => m.id === g.granteeAc) ?? null;
              return (
                <div key={g.id} className={`flex flex-col gap-0.5 ${g.status !== 'Active' ? 'opacity-50' : ''}`}>
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
          <div className="space-y-2">
            {succIn.map(s => {
              const from = members.find(m => m.id === s.fromAc) ?? null;
              return (
                <div key={s.id} className="flex items-start gap-2 flex-wrap">
                  <ArrowLeft size={13} className="text-blue-400 shrink-0 mt-0.5" />
                  <div className="flex items-center gap-2 flex-wrap flex-1">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0">Received from</span>
                    {from ? (
                      <MiniCard member={from} onSelect={onSelectMember} />
                    ) : (
                      <span className="text-[11px] font-mono text-gray-400">{s.fromAc}</span>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-gray-400 dark:text-gray-500">
                      <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-px rounded-full">{s.eventType}</span>
                      {s.eventDate && <span>{s.eventDate}</span>}
                      {s.articleRef && <span>{s.articleRef}</span>}
                      {s.successorRel && <span>· {s.successorRel}</span>}
                    </div>
                  </div>
                  {s.remarks && <div className="text-[10px] text-gray-400 dark:text-gray-500 italic w-full pl-5">{s.remarks}</div>}
                </div>
              );
            })}
            {succOut.map(s => {
              const to = members.find(m => m.id === s.toAc) ?? null;
              return (
                <div key={s.id} className="flex items-start gap-2 flex-wrap">
                  <ArrowRight size={13} className="text-orange-400 shrink-0 mt-0.5" />
                  <div className="flex items-center gap-2 flex-wrap flex-1">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0">Transferred to</span>
                    {to ? (
                      <MiniCard member={to} onSelect={onSelectMember} />
                    ) : (
                      <span className="text-[11px] font-mono text-gray-400">{s.toAc}</span>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-gray-400 dark:text-gray-500">
                      <span className="bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 px-1.5 py-px rounded-full">{s.eventType}</span>
                      {s.eventDate && <span>{s.eventDate}</span>}
                      {s.articleRef && <span>{s.articleRef}</span>}
                      {s.successorRel && <span>· {s.successorRel}</span>}
                    </div>
                  </div>
                  {s.remarks && <div className="text-[10px] text-gray-400 dark:text-gray-500 italic w-full pl-5">{s.remarks}</div>}
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
          <div className="mt-2 space-y-1.5">
            {myNominees.map(n => (
              <div key={n.id} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[9px] font-bold text-gray-500 dark:text-gray-400 shrink-0">
                  {n.priority}
                </div>
                <span className="text-[12px] font-medium text-gray-800 dark:text-gray-100">{n.nomineeName}</span>
                {n.relToMember && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">({n.relToMember})</span>
                )}
                {n.nominatedDate && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">{n.nominatedDate}</span>
                )}
                <NomineeBadge status={n.status} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Empty state */}
      {!hasBioParents && !hasSpouse && !hasBioChildren && !hasGrant && !hasClubParent &&
       !hasClubChildren && !hasA4D && !hasAssociates && !hasSuccession && !hasNominees && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 text-center">
          <div className="text-[12px] text-gray-400 dark:text-gray-500">No relationships recorded for this member yet.</div>
          <div className="text-[11px] text-gray-300 dark:text-gray-600 mt-1">Use Add Member to define relationships.</div>
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
  const colors = {
    pink:   'border-pink-100 dark:border-pink-900/30',
    blue:   'border-blue-100 dark:border-blue-900/30',
    green:  'border-green-100 dark:border-green-900/30',
    purple: 'border-purple-100 dark:border-purple-900/30',
    orange: 'border-orange-100 dark:border-orange-900/30',
    amber:  'border-amber-100 dark:border-amber-900/30',
    gray:   'border-gray-100 dark:border-gray-800',
  };
  const iconColors = {
    pink:   'text-pink-400',
    blue:   'text-blue-400',
    green:  'text-green-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
    amber:  'text-amber-400',
    gray:   'text-gray-400',
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border ${colors[accent]} p-4 shadow-sm`}>
      <div className={`flex items-center gap-1.5 mb-3 ${iconColors[accent]}`}>
        {icon}
        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] text-gray-400 dark:text-gray-500 italic">{children}</div>;
}

function Avatar({ member, size = 'md' }: { member: Member; size?: 'sm' | 'md' }) {
  const cfg = TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent;
  const dim = size === 'sm' ? 'w-7 h-7 text-[9px]' : 'w-9 h-9 text-[11px]';
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
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
    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
      {member && cfg ? (
        <>
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0"
            style={{ background: cfg.color }}
          >
            {getInitials(member.name)}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-gray-800 dark:text-gray-100 truncate max-w-28">{member.name}</div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-gray-400 dark:text-gray-500">{member.id}</span>
              <span className="text-[8px] font-medium px-1 py-px rounded-full" style={{ background: cfg.bg, color: cfg.dark }}>{member.type}</span>
              {label && <span className="text-[8px] text-orange-400">{label}</span>}
            </div>
          </div>
        </>
      ) : (
        <div className="text-[11px] text-gray-500 dark:text-gray-400">{freeName}</div>
      )}
    </div>
  );

  if (member && onSelect) {
    return (
      <button onClick={() => onSelect(member.id)} className="hover:opacity-80 transition-opacity">
        {inner}
      </button>
    );
  }
  return inner;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Active') return (
    <span className="flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400">
      <CheckCircle size={10} /> Active
    </span>
  );
  if (status === 'Deceased') return (
    <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-px rounded-full">Deceased</span>
  );
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-orange-500 dark:text-orange-400">
      <AlertCircle size={10} /> {status}
    </span>
  );
}

function NomineeBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active:  'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    Used:    'bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400',
    Revoked: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
  };
  return (
    <span className={`ml-auto text-[9px] px-1.5 py-px rounded-full ${styles[status] ?? styles.Revoked}`}>
      {status}
    </span>
  );
}
