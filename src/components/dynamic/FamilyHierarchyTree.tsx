'use client';

import type { Member as DBMember, QuotaGrant, SuccessionEvent } from '@prisma/client';
import type { Member } from '@/lib/types';
import { TYPE_CONFIG, getInitials } from '@/lib/memberUtils';
import { ArrowRight } from 'lucide-react';

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

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getRaw = (ac: string): DBMember => rawMembers.find(r => r.acNo === ac) ?? raw;

  const getSpouse = (m: Member): Member | null => {
    if (m.rel === 'spouse' && m.pid) return members.find(x => x.id === m.pid) ?? null;
    return members.find(x => x.pid === m.id && x.rel === 'spouse') ?? null;
  };

  // Only bio/club CHILDREN (A4D & Associates shown beside, not below)
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

  // ── Tree ───────────────────────────────────────────────────────────────────

  const rootData     = getGroupData(member);
  const bioChildren  = getBioChildren(member);

  return (
    <div className="flex flex-col items-center gap-0 min-w-max pb-10">

      {/* ══ Parents ════════════════════════════════════════════════════════ */}
      <GenLabel label="Parents" />
      <MemberGroup
        member={member} raw={raw} data={rootData}
        members={members} getRaw={getRaw} onSelect={onSelect} size="lg"
      />

      {/* ══ Children ═══════════════════════════════════════════════════════ */}
      {bioChildren.length > 0 && (
        <>
          <VLine h={8} />
          <GenLabel label="Children" />
          {bioChildren.length > 1 && <div className="self-stretch border-t border-gray-200 dark:border-gray-700" />}

          <div className="flex items-start gap-6">
            {bioChildren.map(child => {
              const childData  = getGroupData(child);
              const grandChildren = getBioChildren(child);

              return (
                <div key={child.id} className="flex flex-col items-center gap-0">
                  <VLine h={4} />
                  <MemberGroup
                    member={child} raw={getRaw(child.id)} data={childData}
                    members={members} getRaw={getRaw} onSelect={onSelect} size="md"
                  />

                  {/* ══ Grandchildren ════════════════════════════════════ */}
                  {grandChildren.length > 0 && (
                    <>
                      <VLine h={6} />
                      <GenLabel label="Grandchildren" small />
                      {grandChildren.length > 1 && <div className="self-stretch border-t border-gray-200 dark:border-gray-700" />}

                      <div className="flex items-start gap-4">
                        {grandChildren.map(gc => {
                          const gcData = getGroupData(gc);
                          return (
                            <div key={gc.id} className="flex flex-col items-center gap-0">
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

// ─── MemberGroup: member + spouse + A4D (side) + Associate (side) + Succession ──

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
  const { spouse, a4dGiven, assocGiven, succOut, succIn, a4dIn, assocIn } = data;
  const hasExtra = a4dGiven.length > 0 || assocGiven.length > 0 || succOut.length > 0;

  return (
    <div className={`flex items-start gap-0 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden ${
      size === 'lg' ? 'shadow-md' : ''
    }`}>

      {/* ── Core: member + spouse ── */}
      <div className={`flex items-start gap-2 ${size === 'lg' ? 'p-3' : 'p-2'}`}>
        <CoreCard
          member={member} raw={raw} size={size}
          a4dIn={a4dIn} assocIn={assocIn} succIn={succIn}
          members={members} onSelect={onSelect}
        />
        {spouse && (
          <>
            <SpouseConnector size={size} />
            <CoreCard
              member={spouse} raw={getRaw(spouse.id)} size={size}
              a4dIn={data.a4dIn ? null : null}
              assocIn={null} succIn={[]}
              members={members} onSelect={onSelect}
            />
          </>
        )}
      </div>

      {/* ── A4D section ── */}
      {a4dGiven.length > 0 && (
        <div className={`flex items-start gap-2 border-l-2 border-purple-100 dark:border-purple-900 ${size === 'lg' ? 'p-3' : 'p-2'}`}>
          <div className="flex flex-col gap-1.5">
            <div className="text-[7px] font-bold text-purple-400 dark:text-purple-500 uppercase tracking-widest">A4D</div>
            <div className="flex gap-2">
              {a4dGiven.map(g => {
                const grantee = members.find(m => m.id === g.granteeAc);
                return (
                  <SideCard
                    key={g.id}
                    member={grantee ?? null}
                    raw={grantee ? getRaw(grantee.id) : undefined}
                    label={`Slot ${g.slotNo}`}
                    cancelled={g.status !== 'Active'}
                    colorClass="border-purple-200 dark:border-purple-800"
                    labelClass="text-purple-500 dark:text-purple-400"
                    onSelect={grantee ? onSelect : undefined}
                    size={size}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Associate section ── */}
      {assocGiven.length > 0 && (
        <div className={`flex items-start gap-2 border-l-2 border-orange-100 dark:border-orange-900 ${size === 'lg' ? 'p-3' : 'p-2'}`}>
          <div className="flex flex-col gap-1.5">
            <div className="text-[7px] font-bold text-orange-400 dark:text-orange-500 uppercase tracking-widest">Associate</div>
            <div className="flex gap-2">
              {assocGiven.map(g => {
                const grantee = members.find(m => m.id === g.granteeAc);
                return (
                  <SideCard
                    key={g.id}
                    member={grantee ?? null}
                    raw={grantee ? getRaw(grantee.id) : undefined}
                    label="Assoc"
                    cancelled={g.status !== 'Active'}
                    colorClass="border-orange-200 dark:border-orange-800"
                    labelClass="text-orange-500 dark:text-orange-400"
                    onSelect={grantee ? onSelect : undefined}
                    size={size}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Succession out ── */}
      {succOut.map(s => {
        const to = members.find(m => m.id === s.toAc);
        return (
          <div key={s.id} className={`flex items-center gap-1.5 border-l-2 border-red-100 dark:border-red-900 ${size === 'lg' ? 'p-3' : 'p-2'} self-center`}>
            <ArrowRight size={10} className="text-red-300 dark:text-red-700 shrink-0" />
            <div className="flex flex-col gap-1">
              <div className="text-[7px] font-bold text-red-400 uppercase tracking-widest">{succShort(s.eventType)}</div>
              {to && (
                <SideCard
                  member={to}
                  raw={getRaw(to.id)}
                  label="Successor"
                  cancelled={false}
                  colorClass="border-red-200 dark:border-red-800"
                  labelClass="text-red-400"
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

// ─── Core member card (main card in each group) ────────────────────────────────

function CoreCard({
  member, raw, size, a4dIn, assocIn, succIn, members, onSelect,
}: {
  member: Member; raw: DBMember; size: 'lg' | 'md' | 'sm';
  a4dIn: QuotaGrant | null; assocIn: QuotaGrant | null;
  succIn: SuccessionEvent[];
  members: Member[]; onSelect: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent;

  const card = (
    <div className={`flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${
      size === 'lg' ? 'min-w-[120px]' : size === 'md' ? 'min-w-[100px]' : 'min-w-[80px]'
    }`}>
      <div
        className={`rounded-full flex items-center justify-center font-bold text-white ${
          size === 'lg' ? 'w-12 h-12 text-[14px]' : size === 'md' ? 'w-10 h-10 text-[11px]' : 'w-8 h-8 text-[9px]'
        }`}
        style={{ background: cfg.color }}
      >
        {getInitials(member.name)}
      </div>

      <div className={`font-semibold text-gray-800 dark:text-gray-100 text-center leading-tight ${
        size === 'lg' ? 'text-[12px] max-w-[116px]' : size === 'md' ? 'text-[10px] max-w-[96px]' : 'text-[9px] max-w-[76px]'
      }`}>{member.name}</div>

      <div className={`font-mono text-gray-400 dark:text-gray-500 ${size === 'sm' ? 'text-[7px]' : 'text-[8px]'}`}>
        {member.id}
      </div>

      <div className="flex items-center gap-0.5 flex-wrap justify-center">
        <span className={`font-medium px-1.5 py-px rounded-full ${size === 'sm' ? 'text-[7px]' : 'text-[8px]'}`}
          style={{ background: cfg.bg, color: cfg.dark }}>{member.type}</span>
        {raw?.status !== 'Active' && (
          <span className={`px-1 py-px rounded-full ${size === 'sm' ? 'text-[7px]' : 'text-[8px]'} ${
            raw?.status === 'Deceased' ? 'text-gray-500 italic' :
            raw?.status === 'Cancelled' ? 'text-red-400' : 'text-orange-400'
          }`}>{raw?.status}</span>
        )}
      </div>

      {/* Received A4D / Assoc / Succession badges */}
      {(a4dIn || assocIn || succIn.length > 0) && (
        <div className="flex flex-col gap-0.5 items-center w-full border-t border-gray-100 dark:border-gray-800 pt-1 mt-0.5">
          {a4dIn && (
            <div className={`${size === 'sm' ? 'text-[7px]' : 'text-[8px]'} text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-px rounded-full`}>
              A4D Slot {a4dIn.slotNo}{a4dIn.status !== 'Active' ? ' ✕' : ''}
            </div>
          )}
          {assocIn && (
            <div className={`${size === 'sm' ? 'text-[7px]' : 'text-[8px]'} text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-px rounded-full`}>
              Assoc
            </div>
          )}
          {succIn.map((s, i) => {
            const from = members.find(m => m.id === s.fromAc);
            return (
              <button key={i}
                onClick={e => { e.stopPropagation(); from && onSelect(from.id); }}
                className={`${size === 'sm' ? 'text-[7px]' : 'text-[8px]'} text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-px rounded-full hover:underline`}
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

// ─── Small side card (A4D / Associate / Successor) ────────────────────────────

function SideCard({
  member, raw, label, cancelled, colorClass, labelClass, onSelect, size,
}: {
  member: Member | null; raw?: DBMember;
  label: string; cancelled?: boolean;
  colorClass: string; labelClass: string;
  onSelect?: (id: string) => void; size: 'lg' | 'md' | 'sm';
}) {
  const cfg = member ? (TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent) : null;
  const w = size === 'lg' ? 'min-w-[80px]' : 'min-w-[68px]';

  const card = (
    <div className={`flex flex-col items-center gap-0.5 rounded-xl border ${colorClass} px-2 py-1.5 ${w} ${cancelled ? 'opacity-50' : ''} ${onSelect ? 'cursor-pointer hover:opacity-75 transition-opacity' : ''}`}>
      <div className={`text-[7px] font-bold uppercase tracking-wide ${labelClass}`}>{label}</div>
      {member && cfg ? (
        <>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
            style={{ background: cfg.color }}
          >
            {getInitials(member.name)}
          </div>
          <div className="text-[8px] font-medium text-gray-800 dark:text-gray-100 text-center leading-tight max-w-[72px] truncate">{member.name.split(' ')[0]}</div>
          <div className="text-[7px] font-mono text-gray-400 dark:text-gray-500">{member.id}</div>
          {raw?.status !== 'Active' && (
            <div className={`text-[7px] ${raw?.status === 'Deceased' ? 'text-gray-400 italic' : 'text-red-400'}`}>{raw?.status}</div>
          )}
          {cancelled && <div className="text-[7px] text-red-400">Cancelled</div>}
        </>
      ) : (
        <div className="text-[8px] text-gray-400">—</div>
      )}
    </div>
  );

  if (member && onSelect) return <button onClick={() => onSelect(member.id)}>{card}</button>;
  return card;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function succShort(t: string) {
  if (t === 'Death')            return 'Death';
  if (t === 'VoluntaryTransfer') return 'Transfer';
  if (t === 'SeniorUpgrade')    return 'Upgrade';
  if (t === 'FamilyTransfer')   return 'FamilyTx';
  return t;
}

function GenLabel({ label, small }: { label: string; small?: boolean }) {
  return (
    <div className={`uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-500 mb-2 mt-1 ${small ? 'text-[7px]' : 'text-[9px]'}`}>
      {label}
    </div>
  );
}

function VLine({ h }: { h: number }) {
  return <div className="w-px bg-gray-200 dark:bg-gray-700" style={{ height: `${h * 4}px` }} />;
}

function SpouseConnector({ size }: { size: 'lg' | 'md' | 'sm' }) {
  return (
    <div className="flex flex-col items-center self-start gap-0.5" style={{ marginTop: size === 'lg' ? 28 : 20 }}>
      <div className="text-[7px] text-pink-400 font-medium">Spouse</div>
      <div className={`h-px bg-pink-200 dark:bg-pink-800 ${size === 'sm' ? 'w-4' : 'w-6'}`} />
    </div>
  );
}
