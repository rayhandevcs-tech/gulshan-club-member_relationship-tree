'use client';

import { TYPE_CONFIG, getInitials } from '@/lib/memberUtils';
import type { Member } from '@/lib/types';

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

// Spouse shows BESIDE only when they have their own A4D grantees (not just associates)
function hasOwnQuota(id: string, members: Member[]): boolean {
  return members.some(m => m.pid === id && m.rel === 'a4d');
}

// Whether a member has any real data to show in their quota section
function memberHasData(id: string, members: Member[], forSpouse = false): boolean {
  if (forSpouse) {
    return members.some(x => x.pid === id && (x.rel === 'a4d' || x.rel === 'associate' || x.rel === 'nominee'));
  }
  return members.some(x =>
    x.pid === id &&
    (x.rel === 'a4d' || (x.rel === 'spouse' && !hasOwnQuota(x.id, members)) || x.rel === 'associate' || x.rel === 'nominee')
  );
}

// Dark visible line class
const LN = 'bg-gray-400 dark:bg-gray-500';

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
      className={`border-2 rounded-xl text-left transition-opacity hover:opacity-80 cursor-pointer ${small ? 'px-1.5 py-1 w-24' : 'px-2 py-1.5 w-32'}`}
      style={{ borderColor: border, background: cardBg }}
      onClick={onPick}
    >
      <div className="flex items-center gap-1.5">
        <div
          className={`rounded-full flex items-center justify-center font-bold text-white shrink-0 ${small ? 'w-4 h-4 text-[6px]' : 'w-5 h-5 text-[7px]'}`}
          style={{ background: avatarBg }}
        >
          {getInitials(name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`font-semibold text-gray-800 dark:text-gray-100 leading-tight line-clamp-2 ${small ? 'text-[7px]' : 'text-[8px]'}`}>{name}</div>
          <div className={`text-gray-400 font-mono ${small ? 'text-[6px]' : 'text-[7px]'}`}>{m.id}</div>
        </div>
      </div>
      {bl && !small && (
        <div className="text-[6px] text-gray-500 italic mt-0.5 pl-0.5">{bl}</div>
      )}
      {!small && (
        <div className="mt-0.5">
          <span className="text-[6px] font-medium px-1 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.dark }}>{m.type}</span>
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
      className="border-2 rounded-2xl px-4 py-3.5 flex flex-col items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
      style={{ borderColor: border, background: cardBg }}
      onClick={onPick}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-[16px] font-bold text-white shadow-sm"
        style={{ background: avatarBg }}
      >
        {getInitials(name)}
      </div>
      <div className="text-[12px] font-semibold text-gray-800 dark:text-gray-100 text-center leading-tight max-w-[108px]">{name}</div>
      <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{m.id}</div>
      <span className="text-[8px] font-medium px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.dark }}>{m.type}</span>
      {dead(m) && (
        <span className="text-[8px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Deceased</span>
      )}
    </button>
  );
}

// ── QuotaSection ──────────────────────────────────────────────────────────────
// Only renders filled slots — returns null when a member has no grantees

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
    <div className="flex gap-3 items-start">

      {/* A4D column */}
      {a4dFilled.length > 0 && (
        <div className="flex flex-col items-center">
          <div
            className="text-[7px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5"
            style={{ background: '#9333ea18', color: '#7c3aed' }}
          >
            A4D
          </div>
          {/* Relative wrapper for optional connecting bar above multiple slots */}
          <div className="relative flex gap-2 items-start" style={{ paddingTop: a4dFilled.length > 1 ? 10 : 0 }}>
            {a4dFilled.length > 1 && (
              <div
                className={`absolute h-[1.5px] ${LN}`}
                style={{ top: 0, left: '24%', right: '24%' }}
              />
            )}
            {a4dFilled.map(slot => {
              const granteeAssocs = members.filter(x => x.pid === slot.id && (x.rel === 'associate' || x.rel === 'nominee'));
              return (
                <div key={slot.id} className="flex flex-col items-center">
                  <SlotCard
                    member={slot}
                    members={members}
                    sponsorIds={coupleIds}
                    onPick={() => onPick(slot.id)}
                  />
                  {/* Sub-associates of this A4D grantee — only when they exist */}
                  {granteeAssocs.length > 0 && (
                    <div className="flex flex-col items-center mt-1">
                      <div className={`w-[1.5px] h-3 ${LN}`} />
                      <div className="text-[6px] text-gray-400 uppercase tracking-wide mb-0.5">Assoc</div>
                      <div className="flex gap-1">
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

      {/* Associate column */}
      {assocFilled.length > 0 && (
        <div className="flex flex-col items-center">
          <div
            className="text-[7px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5"
            style={{ background: '#ea580c18', color: '#c2410c' }}
          >
            Assoc
          </div>
          <div className="flex gap-2">
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
    <div className="flex flex-col items-center">

      {/* ── Couple row ── */}
      <div className="flex items-end gap-0">

        {succNote && !isTransferToSpouse && (
          <div className="flex items-center gap-2 mr-4 self-center">
            <div className="px-2.5 py-1.5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 text-[9px] text-red-600 dark:text-red-400 font-semibold text-center leading-snug max-w-[72px]">
              {succNote}
            </div>
            <div className="text-[11px] font-semibold text-red-400">→</div>
          </div>
        )}

        <CoreCard member={m} onPick={() => onPick(m.id)} />

        {spouseBeside && (
          <>
            <div className="flex flex-col items-center px-3 pb-5 self-end">
              {isTransferToSpouse && (
                <div className="text-[7px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-full px-2 py-0.5 mb-1.5 whitespace-nowrap">
                  A/C transferred →
                </div>
              )}
              <span className="text-[8px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5 mb-1.5 whitespace-nowrap">
                Spouse
              </span>
              <div className={`w-8 h-[1.5px] ${LN}`} />
            </div>
            <CoreCard member={spouseBeside} onPick={() => onPick(spouseBeside.id)} />
          </>
        )}
      </div>

      {/* ── Connector + Quota sections (only rendered when there is real data) ── */}
      {hasAnyQuota && (
        <>
          <div className={`w-[1.5px] h-5 ${LN} mt-2`} />

          <div className="flex gap-8 items-start relative">
            {/* Horizontal bar connecting the two quota sections when both have data */}
            {showDual && hasM && hasS && (
              <div
                className={`absolute h-[1.5px] ${LN}`}
                style={{ top: -1, left: '22%', right: '22%' }}
              />
            )}

            {hasM && (
              <div className="flex flex-col items-center">
                {showDual && (
                  <div
                    className="text-[7px] font-bold font-mono mb-2 px-2 py-0.5 rounded-full"
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
              <div className="flex flex-col items-center">
                <div
                  className="text-[7px] font-bold font-mono mb-2 px-2 py-0.5 rounded-full"
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

      {/* ── Bio children who are independent core members ── */}
      {bioChildren.length > 0 && (
        <>
          <div className={`w-[1.5px] h-6 ${LN} mt-5`} />
          <span className="text-[9px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-0.5 mb-1.5">
            Children
          </span>
          <div className={`w-[1.5px] h-4 ${LN}`} />

          <div className="flex gap-6 items-start">
            {bioChildren.map((child, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === bioChildren.length - 1;
              const multi = bioChildren.length > 1;
              return (
                <div
                  key={child.id}
                  className="relative flex flex-col items-center"
                  style={{ paddingTop: 24 }}
                >
                  {/* Horizontal sibling connector */}
                  {multi && (
                    <div
                      className={`absolute h-[1.5px] ${LN}`}
                      style={{ top: 0, left: isFirst ? '50%' : -12, right: isLast ? '50%' : -12 }}
                    />
                  )}
                  {/* Vertical stem down to this child */}
                  <div
                    className={`absolute w-[1.5px] ${LN}`}
                    style={{ top: 0, height: 24, left: '50%', transform: 'translateX(-50%)' }}
                  />
                  <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-gray-900 shadow-sm">
                    <QuotaTree member={child} members={members} onPick={onPick} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
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
    <div className="inline-flex flex-col items-center border border-gray-100 dark:border-gray-800 rounded-2xl p-5 sm:p-8 bg-white dark:bg-gray-900 shadow-sm">
      <QuotaTree member={rootMember} members={members} onPick={onPick} />
    </div>
  );
}
