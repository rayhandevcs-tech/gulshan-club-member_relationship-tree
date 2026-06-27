'use client';

import type { Member as DBMember, QuotaGrant, SuccessionEvent } from '@prisma/client';
import type { Member } from '@/lib/types';
import { TYPE_CONFIG, getInitials } from '@/lib/memberUtils';

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

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getSpouse = (m: Member): Member | null => {
    if (m.rel === 'spouse' && m.pid) return members.find(x => x.id === m.pid) ?? null;
    return members.find(x => x.pid === m.id && x.rel === 'spouse') ?? null;
  };

  const getChildren = (m: Member): Member[] => {
    const ids = new Set([
      ...members.filter(x => x.fatherId === m.id || x.motherId === m.id).map(x => x.id),
      ...members.filter(x => x.pid === m.id && x.rel === 'child').map(x => x.id),
    ]);
    return [...ids].map(id => members.find(x => x.id === id)!).filter(Boolean);
  };

  const getRaw = (ac: string): DBMember => rawMembers.find(r => r.acNo === ac) ?? raw;

  const getGrants = (ac: string) => ({
    a4d:   grants.filter(g => g.grantorAc === ac && g.grantType === 'A4D'),
    assoc: grants.filter(g => g.grantorAc === ac && g.grantType === 'Associate'),
  });

  const getSuccs = (ac: string) => ({
    in:  successions.filter(s => s.toAc === ac),
    out: successions.filter(s => s.fromAc === ac),
  });

  // ── Data ──────────────────────────────────────────────────────────────────

  const rootSpouse  = getSpouse(member);
  const children    = getChildren(member);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-0 min-w-max pb-8">

      {/* ══ Layer 0 — Parents ══════════════════════════════════════════════ */}
      <GenLabel label="Parents" />
      <FamilyUnit
        member={member}
        raw={raw}
        spouse={rootSpouse}
        spouseRaw={rootSpouse ? getRaw(rootSpouse.id) : undefined}
        grants={getGrants(member.id)}
        succs={getSuccs(member.id)}
        spouseGrants={rootSpouse ? getGrants(rootSpouse.id) : undefined}
        spouseSuccs={rootSpouse ? getSuccs(rootSpouse.id) : undefined}
        members={members}
        onSelect={onSelect}
        size="lg"
      />

      {/* ══ Layer 1 — Children ════════════════════════════════════════════ */}
      {children.length > 0 && (
        <>
          <VLine h={8} />
          <GenLabel label="Children" />

          {/* horizontal bar across children */}
          {children.length > 1 && <div className="self-stretch border-t border-gray-200 dark:border-gray-700" />}

          <div className="flex items-start gap-8">
            {children.map(child => {
              const cSpouse      = getSpouse(child);
              const grandchildren = getChildren(child);
              const cRaw         = getRaw(child.id);

              return (
                <div key={child.id} className="flex flex-col items-center gap-0">
                  <VLine h={4} />

                  <FamilyUnit
                    member={child}
                    raw={cRaw}
                    spouse={cSpouse}
                    spouseRaw={cSpouse ? getRaw(cSpouse.id) : undefined}
                    grants={getGrants(child.id)}
                    succs={getSuccs(child.id)}
                    spouseGrants={cSpouse ? getGrants(cSpouse.id) : undefined}
                    spouseSuccs={cSpouse ? getSuccs(cSpouse.id) : undefined}
                    members={members}
                    onSelect={onSelect}
                    size="md"
                  />

                  {/* ══ Layer 2 — Grandchildren ══════════════════════════ */}
                  {grandchildren.length > 0 && (
                    <>
                      <VLine h={6} />
                      <GenLabel label="Grandchildren" small />

                      {grandchildren.length > 1 && (
                        <div className="self-stretch border-t border-gray-200 dark:border-gray-700" />
                      )}

                      <div className="flex items-start gap-4">
                        {grandchildren.map(gc => {
                          const gcSpouse = getSpouse(gc);
                          const gcRaw    = getRaw(gc.id);
                          return (
                            <div key={gc.id} className="flex flex-col items-center gap-0">
                              <VLine h={4} />
                              <FamilyUnit
                                member={gc}
                                raw={gcRaw}
                                spouse={gcSpouse}
                                spouseRaw={gcSpouse ? getRaw(gcSpouse.id) : undefined}
                                grants={getGrants(gc.id)}
                                succs={getSuccs(gc.id)}
                                spouseGrants={gcSpouse ? getGrants(gcSpouse.id) : undefined}
                                spouseSuccs={gcSpouse ? getSuccs(gcSpouse.id) : undefined}
                                members={members}
                                onSelect={onSelect}
                                size="sm"
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

// ─── FamilyUnit: member + spouse side-by-side, non-family info below ──────────

function FamilyUnit({
  member, raw, spouse, spouseRaw,
  grants, succs, spouseGrants, spouseSuccs,
  members, onSelect, size,
}: {
  member: Member; raw: DBMember;
  spouse?: Member | null; spouseRaw?: DBMember;
  grants: { a4d: QuotaGrant[]; assoc: QuotaGrant[] };
  succs:  { in: SuccessionEvent[]; out: SuccessionEvent[] };
  spouseGrants?: { a4d: QuotaGrant[]; assoc: QuotaGrant[] };
  spouseSuccs?:  { in: SuccessionEvent[]; out: SuccessionEvent[] };
  members: Member[]; onSelect: (id: string) => void;
  size: 'lg' | 'md' | 'sm';
}) {
  return (
    <div className="flex items-start gap-2">
      {/* Main member column */}
      <div className="flex flex-col items-center gap-1">
        <MemberCard member={member} raw={raw} size={size} onSelect={onSelect} />
        <NonFamilyInfo grants={grants} succs={succs} members={members} onSelect={onSelect} size={size} />
      </div>

      {/* Spouse */}
      {spouse && spouseRaw && (
        <>
          <SpouseBar size={size} />
          <div className="flex flex-col items-center gap-1">
            <MemberCard member={spouse} raw={spouseRaw} size={size} onSelect={onSelect} />
            {spouseGrants && spouseSuccs && (
              <NonFamilyInfo grants={spouseGrants} succs={spouseSuccs} members={members} onSelect={onSelect} size={size} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Non-family relationship tags ─────────────────────────────────────────────

function NonFamilyInfo({
  grants, succs, members, onSelect, size,
}: {
  grants: { a4d: QuotaGrant[]; assoc: QuotaGrant[] };
  succs:  { in: SuccessionEvent[]; out: SuccessionEvent[] };
  members: Member[]; onSelect: (id: string) => void;
  size: 'lg' | 'md' | 'sm';
}) {
  const hasAny = grants.a4d.length || grants.assoc.length || succs.in.length || succs.out.length;
  if (!hasAny || size === 'sm') return null;

  const w = size === 'lg' ? 'w-[140px]' : 'w-[116px]';

  return (
    <div className={`flex flex-col gap-0.5 ${w}`}>
      {grants.a4d.map(g => {
        const grantee = members.find(m => m.id === g.granteeAc);
        const active  = g.status === 'Active';
        return (
          <button
            key={g.id}
            onClick={() => grantee && onSelect(grantee.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] w-full text-left ${
              active
                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}
          >
            <span className="font-bold shrink-0">A4D#{g.slotNo}</span>
            <span className="shrink-0">→</span>
            <span className={`font-medium truncate flex-1 ${active ? '' : 'line-through'}`}>
              {grantee?.name.split(' ')[0] ?? g.granteeAc}
            </span>
            {!active && <span className="text-red-400 shrink-0 text-[8px]">✕</span>}
          </button>
        );
      })}

      {grants.assoc.map(g => {
        const grantee = members.find(m => m.id === g.granteeAc);
        const active  = g.status === 'Active';
        return (
          <button
            key={g.id}
            onClick={() => grantee && onSelect(grantee.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] w-full text-left ${
              active
                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}
          >
            <span className="font-bold shrink-0">Assoc</span>
            <span className="shrink-0">→</span>
            <span className={`font-medium truncate flex-1 ${active ? '' : 'line-through'}`}>
              {grantee?.name.split(' ')[0] ?? g.granteeAc}
            </span>
          </button>
        );
      })}

      {succs.in.map(s => {
        const from = members.find(m => m.id === s.fromAc);
        return (
          <button
            key={s.id}
            onClick={() => from && onSelect(from.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[9px] w-full text-left"
          >
            <span className="shrink-0">←</span>
            <span className="font-bold shrink-0 text-[8px]">{succLabel(s.eventType)}</span>
            <span className="truncate flex-1">
              {from?.name.split(' ')[0] ?? s.fromAc}
            </span>
          </button>
        );
      })}

      {succs.out.map(s => {
        const to = members.find(m => m.id === s.toAc);
        return (
          <button
            key={s.id}
            onClick={() => to && onSelect(to.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 text-[9px] w-full text-left"
          >
            <span className="shrink-0">→</span>
            <span className="font-bold shrink-0 text-[8px]">{succLabel(s.eventType)}</span>
            <span className="truncate flex-1">
              {to?.name.split(' ')[0] ?? s.toAc}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function succLabel(t: string) {
  if (t === 'Death') return 'Death→';
  if (t === 'VoluntaryTransfer') return 'Transfer→';
  if (t === 'SeniorUpgrade') return 'Upgrade→';
  if (t === 'FamilyTransfer') return 'FamilyTx→';
  return t;
}

// ─── Member card ──────────────────────────────────────────────────────────────

function MemberCard({
  member, raw, size, onSelect,
}: {
  member: Member; raw: DBMember; size: 'lg' | 'md' | 'sm';
  onSelect: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent;

  const card = (
    <div className={`flex flex-col items-center gap-1 bg-white dark:bg-gray-900 rounded-xl border transition-all ${
      size === 'lg'
        ? 'border-blue-200 dark:border-blue-800 shadow-md px-4 py-3 min-w-[140px]'
        : size === 'md'
        ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm px-3 py-2 min-w-[116px]'
        : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm px-2 py-1.5 min-w-[90px]'
    } cursor-pointer`}>
      {/* Avatar */}
      <div
        className={`rounded-full flex items-center justify-center font-bold text-white ${
          size === 'lg' ? 'w-11 h-11 text-[13px]'
          : size === 'md' ? 'w-9 h-9 text-[11px]'
          : 'w-7 h-7 text-[9px]'
        }`}
        style={{ background: cfg.color }}
      >
        {getInitials(member.name)}
      </div>

      {/* Name */}
      <div className={`font-semibold text-gray-800 dark:text-gray-100 text-center leading-tight ${
        size === 'lg' ? 'text-[12px] max-w-[132px]'
        : size === 'md' ? 'text-[10px] max-w-[108px]'
        : 'text-[9px] max-w-[86px]'
      }`}>{member.name}</div>

      {/* ID */}
      <div className={`font-mono text-gray-400 dark:text-gray-500 ${size === 'sm' ? 'text-[7px]' : 'text-[8px]'}`}>
        {member.id}
      </div>

      {/* Type + Status */}
      <div className="flex items-center gap-0.5 flex-wrap justify-center">
        <span
          className={`font-medium px-1.5 py-px rounded-full ${size === 'sm' ? 'text-[7px]' : 'text-[8px]'}`}
          style={{ background: cfg.bg, color: cfg.dark }}
        >
          {member.type}
        </span>
        {raw?.status !== 'Active' && (
          <span className={`px-1 py-px rounded-full ${size === 'sm' ? 'text-[7px]' : 'text-[8px]'} ${
            raw?.status === 'Deceased'
              ? 'text-gray-500 dark:text-gray-400 italic'
              : raw?.status === 'Cancelled'
              ? 'bg-red-50 dark:bg-red-900/20 text-red-400'
              : 'bg-orange-50 dark:bg-orange-900/20 text-orange-400'
          }`}>{raw?.status}</span>
        )}
      </div>

      {/* Joined date */}
      {member.since && size !== 'sm' && (
        <div className="text-[8px] text-gray-400 dark:text-gray-600">{member.since}</div>
      )}
    </div>
  );

  return <button onClick={() => onSelect(member.id)}>{card}</button>;
}

// ─── Layout helpers ────────────────────────────────────────────────────────────

function GenLabel({ label, small }: { label: string; small?: boolean }) {
  return (
    <div className={`text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold mb-2 mt-1 ${
      small ? 'text-[7px]' : 'text-[9px]'
    }`}>
      {label}
    </div>
  );
}

function VLine({ h }: { h: number }) {
  return <div className="w-px bg-gray-200 dark:bg-gray-700" style={{ height: `${h * 4}px` }} />;
}

function SpouseBar({ size }: { size: 'lg' | 'md' | 'sm' }) {
  return (
    <div className="flex flex-col items-center self-start gap-0.5 mt-8">
      <div className="text-[7px] text-pink-400 dark:text-pink-600 font-medium">Spouse</div>
      <div className={`h-px bg-pink-200 dark:bg-pink-800 ${size === 'lg' ? 'w-8' : 'w-5'}`} />
    </div>
  );
}
