'use client';

import type { Member as DBMember, QuotaGrant, SuccessionEvent, Nominee } from '@prisma/client';
import type { Member } from '@/lib/types';
import { TYPE_CONFIG, getInitials } from '@/lib/memberUtils';
import { ArrowRight, ArrowLeft } from 'lucide-react';

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
  const fatherM  = member.fatherId ? members.find(m => m.id === member.fatherId) ?? null : null;
  const motherM  = member.motherId ? members.find(m => m.id === member.motherId) ?? null : null;
  const spouseM  = (() => {
    if (member.rel === 'spouse' && member.pid) return members.find(m => m.id === member.pid) ?? null;
    return members.find(m => m.pid === member.id && m.rel === 'spouse') ?? null;
  })();

  const myGrant     = grants.find(g => g.granteeAc === member.id) ?? null;
  const grantorM    = myGrant ? members.find(m => m.id === myGrant.grantorAc) ?? null : null;
  const clubParentM = (!myGrant && member.pid && member.rel !== 'spouse')
    ? members.find(m => m.id === member.pid) ?? null : null;

  // Merge bio children + club children, deduplicated
  const bioChildIds = new Set(
    members.filter(m => m.fatherId === member.id || m.motherId === member.id).map(m => m.id)
  );
  const clubChildIds = new Set(
    members.filter(m => m.pid === member.id && m.rel === 'child').map(m => m.id)
  );
  const allChildIds  = new Set([...bioChildIds, ...clubChildIds]);
  const allChildren  = [...allChildIds].map(id => members.find(m => m.id === id)!).filter(Boolean);

  const a4dGranted   = grants.filter(g => g.grantorAc === member.id && g.grantType === 'A4D');
  const assocGranted = grants.filter(g => g.grantorAc === member.id && g.grantType === 'Associate');
  const assocMembers = members.filter(m => m.pid === member.id && m.rel === 'associate'
    && !assocGranted.find(g => g.granteeAc === m.id));

  const succIn  = successions.filter(s => s.toAc === member.id);
  const succOut = successions.filter(s => s.fromAc === member.id);
  const myNoms  = nominees.filter(n => n.memberAc === member.id).sort((a, b) => a.priority - b.priority);

  const hasBioParents  = fatherM || motherM || member.fatherName || member.motherName;
  const hasBelow       = allChildren.length > 0 || a4dGranted.length > 0 || assocGranted.length > 0 || assocMembers.length > 0;
  const hasInfoPanels  = succIn.length > 0 || succOut.length > 0 || myNoms.length > 0;

  return (
    <div className="inline-flex flex-col items-center gap-0 min-w-0">

      {/* ── Bio parents row ── */}
      {hasBioParents && (
        <>
          <div className="flex items-end gap-0">
            {(fatherM || member.fatherName) && (
              <div className="flex flex-col items-center">
                <NodeCard
                  member={fatherM}
                  freeName={!fatherM ? (member.fatherName ?? '') : undefined}
                  freeType="Father"
                  raw={fatherM ? rawMembers.find(r => r.acNo === fatherM.id) : undefined}
                  role="Father"
                  onSelect={fatherM ? onSelect : undefined}
                />
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
              </div>
            )}
            {(fatherM || member.fatherName) && (motherM || member.motherName) && (
              <div className="h-px w-12 bg-gray-200 dark:bg-gray-700 self-center mb-4" />
            )}
            {(motherM || member.motherName) && (
              <div className="flex flex-col items-center">
                <NodeCard
                  member={motherM}
                  freeName={!motherM ? (member.motherName ?? '') : undefined}
                  freeType="Mother"
                  raw={motherM ? rawMembers.find(r => r.acNo === motherM.id) : undefined}
                  role="Mother"
                  onSelect={motherM ? onSelect : undefined}
                />
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
              </div>
            )}
          </div>
          {/* Join line down to member */}
          <div className="w-px h-0 bg-gray-200 dark:bg-gray-700" />
        </>
      )}

      {/* ── Center row: Grantor → Member ← Spouse ── */}
      <div className="flex items-center gap-2">
        {(grantorM || clubParentM) && (() => {
          const src = grantorM ?? clubParentM!;
          const label = grantorM ? `Quota grantor (${myGrant?.grantType} #${myGrant?.slotNo})` : `Club parent (${member.rel})`;
          return (
            <>
              <div className="flex flex-col items-end gap-1">
                <NodeCard
                  member={src}
                  raw={rawMembers.find(r => r.acNo === src.id)}
                  role={label}
                  onSelect={onSelect}
                />
              </div>
              <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 shrink-0" />
            </>
          );
        })()}

        {/* Focus member — larger card */}
        <FocusCard member={member} raw={raw} />

        {spouseM && (
          <>
            <div className="flex flex-col items-center gap-0.5">
              <div className="text-[8px] text-pink-400 font-medium tracking-wider">Spouse</div>
              <div className="h-px w-8 bg-pink-200 dark:bg-pink-800" />
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
      {hasBelow && <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />}

      {/* ── Groups below ── */}
      {hasBelow && (
        <div className="flex flex-col items-center gap-0">
          {/* Horizontal spread line */}
          {(() => {
            const totalGroups = [allChildren.length > 0, a4dGranted.length > 0, (assocGranted.length + assocMembers.length) > 0]
              .filter(Boolean).length;
            return totalGroups > 1 ? <div className="h-px w-80 bg-gray-200 dark:bg-gray-700" /> : null;
          })()}

          <div className="flex items-start gap-8">
            {/* Children */}
            {allChildren.length > 0 && (
              <ChildGroup
                label="Children"
                labelColor="text-gray-400 dark:text-gray-500"
                lineColor="bg-gray-200 dark:bg-gray-700"
              >
                {allChildren.map(child => {
                  const childBio = bioChildIds.has(child.id);
                  const childClub = clubChildIds.has(child.id);
                  const tag = childBio && childClub ? 'bio + club' : childBio ? 'bio' : 'club';
                  return (
                    <ChildColumn key={child.id} lineColor="bg-gray-200 dark:bg-gray-700">
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

            {/* A4D granted */}
            {a4dGranted.length > 0 && (
              <ChildGroup
                label="A4D Quota Given"
                labelColor="text-purple-400 dark:text-purple-500"
                lineColor="bg-purple-200 dark:bg-purple-800"
              >
                {a4dGranted.map(g => {
                  const grantee = members.find(m => m.id === g.granteeAc) ?? null;
                  return (
                    <ChildColumn key={g.id} lineColor="bg-purple-200 dark:bg-purple-800">
                      <NodeCard
                        member={grantee}
                        freeName={!grantee ? g.granteeAc : undefined}
                        raw={grantee ? rawMembers.find(r => r.acNo === g.granteeAc) : undefined}
                        role={`Slot #${g.slotNo}`}
                        roleColor="text-purple-500 dark:text-purple-400"
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

            {/* Associates */}
            {(assocGranted.length + assocMembers.length) > 0 && (
              <ChildGroup
                label="Associates"
                labelColor="text-orange-400 dark:text-orange-500"
                lineColor="bg-orange-200 dark:bg-orange-800"
              >
                {assocGranted.map(g => {
                  const assoc = members.find(m => m.id === g.granteeAc) ?? null;
                  return (
                    <ChildColumn key={g.id} lineColor="bg-orange-200 dark:bg-orange-800">
                      <NodeCard
                        member={assoc}
                        freeName={!assoc ? g.granteeAc : undefined}
                        raw={assoc ? rawMembers.find(r => r.acNo === g.granteeAc) : undefined}
                        role="Associate"
                        roleColor="text-orange-400"
                        cancelled={g.status !== 'Active' ? g.status : undefined}
                        onSelect={assoc ? onSelect : undefined}
                      />
                    </ChildColumn>
                  );
                })}
                {assocMembers.map(a => (
                  <ChildColumn key={a.id} lineColor="bg-orange-200 dark:bg-orange-800">
                    <NodeCard
                      member={a}
                      raw={rawMembers.find(r => r.acNo === a.id)}
                      role="Associate"
                      roleColor="text-orange-400"
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
        <div className="mt-6 w-full max-w-xl space-y-2">
          {(succIn.length > 0 || succOut.length > 0) && (
            <InfoPanel title="Succession / Transfer">
              {succIn.map(s => {
                const from = members.find(m => m.id === s.fromAc);
                return (
                  <div key={s.id} className="flex items-center gap-2 flex-wrap">
                    <ArrowLeft size={12} className="text-blue-400 shrink-0" />
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">Received from</span>
                    {from
                      ? <button onClick={() => onSelect(from.id)} className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline">{from.name} ({from.id})</button>
                      : <span className="text-[11px] font-mono text-gray-400">{s.fromAc}</span>}
                    <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 px-1.5 py-px rounded-full">{s.eventType}</span>
                    {s.eventDate && <span className="text-[10px] text-gray-400 dark:text-gray-500">{s.eventDate}</span>}
                    {s.articleRef && <span className="text-[10px] text-gray-400 dark:text-gray-500">{s.articleRef}</span>}
                    {s.remarks && <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">· {s.remarks}</span>}
                  </div>
                );
              })}
              {succOut.map(s => {
                const to = members.find(m => m.id === s.toAc);
                return (
                  <div key={s.id} className="flex items-center gap-2 flex-wrap">
                    <ArrowRight size={12} className="text-orange-400 shrink-0" />
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">Transferred to</span>
                    {to
                      ? <button onClick={() => onSelect(to.id)} className="text-[11px] font-medium text-orange-500 dark:text-orange-400 hover:underline">{to.name} ({to.id})</button>
                      : <span className="text-[11px] font-mono text-gray-400">{s.toAc}</span>}
                    <span className="text-[10px] bg-orange-50 dark:bg-orange-900/20 text-orange-400 dark:text-orange-400 px-1.5 py-px rounded-full">{s.eventType}</span>
                    {s.eventDate && <span className="text-[10px] text-gray-400 dark:text-gray-500">{s.eventDate}</span>}
                    {s.remarks && <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">· {s.remarks}</span>}
                  </div>
                );
              })}
            </InfoPanel>
          )}

          {myNoms.length > 0 && (
            <InfoPanel title="Nominees">
              <div className="flex gap-4 flex-wrap">
                {myNoms.map(n => (
                  <div key={n.id} className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[8px] font-bold text-gray-500 dark:text-gray-400">
                      {n.priority}
                    </div>
                    <span className="text-[11px] font-medium text-gray-800 dark:text-gray-100">{n.nomineeName}</span>
                    {n.relToMember && <span className="text-[10px] text-gray-400 dark:text-gray-500">({n.relToMember})</span>}
                    <span className={`text-[9px] px-1.5 py-px rounded-full ${
                      n.status === 'Active' ? 'bg-green-50 dark:bg-green-900/20 text-green-500 dark:text-green-400' :
                      n.status === 'Used'   ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-400' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
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
  const myA4D  = grants.filter(g => g.grantorAc === member.id && g.grantType === 'A4D' && g.status === 'Active');
  const myAssoc = grants.filter(g => g.grantorAc === member.id && g.grantType === 'Associate' && g.status === 'Active');
  const spouse  = members.find(m => m.pid === member.id && m.rel === 'spouse');
  if (myA4D.length)   extras.push(`A4D: ${myA4D.length}`);
  if (myAssoc.length) extras.push(`Assoc: ${myAssoc.length}`);
  if (spouse)         extras.push(`Spouse: ${spouse.name.split(' ')[0]}`);
  return extras;
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function ChildGroup({ label, labelColor, lineColor, children }: {
  label: string; labelColor: string; lineColor: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-0">
      <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
      <div className={`text-[9px] font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>{label}</div>
      <div className="flex items-start gap-4">
        {children}
      </div>
    </div>
  );
}

function ChildColumn({ lineColor, children }: { lineColor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0">
      <div className={`w-px h-4 ${lineColor}`} />
      {children}
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3">
      <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

// ─── Focus card (the selected member — larger) ────────────────────────────────

function FocusCard({ member, raw }: { member: Member; raw: DBMember }) {
  const cfg = TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-md px-4 py-3 flex flex-col items-center gap-1.5 min-w-36">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-[13px] font-bold text-white"
        style={{ background: cfg.color }}
      >
        {getInitials(member.name)}
      </div>
      <div className="text-[12px] font-semibold text-gray-800 dark:text-gray-100 text-center leading-tight max-w-36">{member.name}</div>
      <div className="text-[9px] font-mono text-gray-400 dark:text-gray-500">{member.id}</div>
      <div className="flex items-center gap-1 flex-wrap justify-center">
        <span className="text-[9px] font-medium px-1.5 py-px rounded-full" style={{ background: cfg.bg, color: cfg.dark }}>{member.type}</span>
        {raw.status !== 'Active' && (
          <span className="text-[9px] px-1.5 py-px rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-400">{raw.status}</span>
        )}
      </div>
      {member.since && <div className="text-[9px] text-gray-400 dark:text-gray-500">Since {member.since}</div>}
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
    <div className={`bg-white dark:bg-gray-900 rounded-xl border px-3 py-2 flex flex-col items-center gap-1 min-w-24 max-w-32 ${
      cancelled ? 'border-gray-100 dark:border-gray-800 opacity-60' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
    } ${onSelect ? 'cursor-pointer transition-all hover:shadow-sm' : ''}`}>
      {role && (
        <div className={`text-[8px] font-medium mb-0.5 ${roleColor ?? 'text-gray-400 dark:text-gray-500'}`}>{role}</div>
      )}
      {member && cfg ? (
        <>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: cfg.color }}
          >
            {getInitials(member.name)}
          </div>
          <div className="text-[10px] font-medium text-gray-800 dark:text-gray-100 text-center leading-tight max-w-28 truncate">{member.name}</div>
          <div className="text-[8px] font-mono text-gray-400 dark:text-gray-500">{member.id}</div>
          <div className="flex items-center gap-0.5 flex-wrap justify-center">
            <span className="text-[8px] font-medium px-1 py-px rounded-full" style={{ background: cfg.bg, color: cfg.dark }}>{member.type}</span>
            {raw?.status === 'Deceased' && <span className="text-[8px] text-gray-400 dark:text-gray-500 italic">Deceased</span>}
            {raw?.status === 'Cancelled' && <span className="text-[8px] text-red-400">Cancelled</span>}
          </div>
          {articleRef && <div className="text-[8px] text-gray-400 dark:text-gray-500">{articleRef}</div>}
          {extraInfo && extraInfo.length > 0 && (
            <div className="mt-0.5 flex flex-col gap-0.5 items-center w-full">
              {extraInfo.map((e, i) => (
                <div key={i} className="text-[8px] text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-px rounded-full w-full text-center truncate">{e}</div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center">{freeName}</div>
      )}
      {freeType && !member && (
        <div className="text-[8px] text-gray-300 dark:text-gray-600">{freeType}</div>
      )}
      {cancelled && (
        <div className="text-[8px] text-red-400 bg-red-50 dark:bg-red-900/20 px-1 py-px rounded-full">{cancelled}</div>
      )}
    </div>
  );

  if (member && onSelect) {
    return <button onClick={() => onSelect(member.id)}>{card}</button>;
  }
  return card;
}
