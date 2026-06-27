'use client';

import { useState } from 'react';
import { useMemberStore } from '@/store/memberStore';
import {
  getMember,
  getInitials,
  TYPE_CONFIG,
  getA4DQuota,
} from '@/lib/memberUtils';
import { Member } from '@/lib/types';
import { X, ChevronRight, Users, ArrowRight } from 'lucide-react';

function MemberPreviewModal({
  member,
  members,
  onClose,
  onNavigate,
}: {
  member: Member;
  members: Member[];
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent;

  const fatherMember = member.fatherId ? getMember(members, member.fatherId) : null;
  const motherMember = member.motherId ? getMember(members, member.motherId) : null;
  const fatherDisplay = fatherMember?.name ?? member.fatherName ?? member.father;
  const motherDisplay = motherMember?.name ?? member.motherName ?? member.mother;

  const spouseMember =
    member.rel === 'spouse' && member.pid
      ? getMember(members, member.pid)
      : (members.find(c => c.pid === member.id && c.rel === 'spouse') ?? null);

  const bioChildren = members.filter(c => c.fatherId === member.id || c.motherId === member.id);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-50"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(340px,calc(100vw-32px))] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header band */}
        <div className="flex items-center justify-between px-4 pt-4 pb-0">
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Quick Preview</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pt-4 pb-5">
          {/* Avatar + name */}
          <div className="flex flex-col items-center mb-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold shadow-sm mb-2"
              style={{ background: cfg.bg, color: cfg.dark }}
            >
              {getInitials(member.name)}
            </div>
            <div className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 text-center leading-snug">{member.name}</div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{member.id}</div>
            <div
              className="text-[10px] font-medium px-2.5 py-0.5 rounded-full mt-1.5"
              style={{ background: cfg.bg, color: cfg.dark }}
            >
              {member.type}
            </div>
          </div>

          {/* Key fields */}
          <div className="space-y-1 mb-3">
            {[
              ['Joined', member.since],
              ['Email', member.email],
              ['Phone', member.phone],
            ]
              .filter(([, v]) => v)
              .map(([label, val]) => (
                <div key={label} className="flex gap-2 text-[11px] py-1 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-400 w-14 shrink-0">{label}</span>
                  <span className="text-gray-700 break-all">{val}</span>
                </div>
              ))}
          </div>

          {/* Parents */}
          {(fatherDisplay || motherDisplay) && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 mb-3">
              <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">
                <Users size={10} /> Parents
              </div>
              {fatherDisplay && (
                <div className="text-[11px] py-0.5 flex gap-2">
                  <span className="text-gray-400 dark:text-gray-500 w-12 shrink-0">Father</span>
                  <span className="text-gray-700 dark:text-gray-200">{fatherDisplay}</span>
                </div>
              )}
              {motherDisplay && (
                <div className="text-[11px] py-0.5 flex gap-2">
                  <span className="text-gray-400 dark:text-gray-500 w-12 shrink-0">Mother</span>
                  <span className="text-gray-700 dark:text-gray-200">{motherDisplay}</span>
                </div>
              )}
            </div>
          )}

          {/* Spouse */}
          {spouseMember && (
            <div className="text-[11px] py-1.5 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <span className="text-gray-400 w-14 shrink-0">Spouse</span>
              <span className="text-gray-700 font-medium">{spouseMember.name}</span>
              <span className="text-gray-400">{spouseMember.id}</span>
            </div>
          )}

          {/* Children count */}
          {bioChildren.length > 0 && (
            <div className="text-[11px] py-1.5 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <span className="text-gray-400 w-14 shrink-0">Children</span>
              <span className="text-gray-700">{bioChildren.map(c => c.name).join(', ')}</span>
            </div>
          )}

          {/* Go to member */}
          <button
            onClick={() => { onNavigate(member.id); onClose(); }}
            className="mt-4 w-full flex items-center justify-center gap-1.5 bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white text-[12px] font-medium py-2.5 rounded-xl transition-colors"
          >
            Go to member <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </>
  );
}

function MemberRow({
  member,
  onPreview,
}: {
  member: Member;
  onPreview: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[member.type] ?? TYPE_CONFIG.Permanent;
  return (
    <div
      className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      onClick={() => onPreview(member.id)}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0"
        style={{ background: cfg.bg, color: cfg.dark }}
      >
        {getInitials(member.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-gray-800 dark:text-gray-100 truncate">{member.name}</div>
        <div className="text-[10px] text-gray-400 dark:text-gray-500">{member.id}</div>
      </div>
      <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 shrink-0" />
    </div>
  );
}

export default function DetailPanel() {
  const { members, selectedId, setSelected, navigateTo } = useMemberStore();
  const [previewId, setPreviewId] = useState<string | null>(null);

  if (!selectedId) return null;

  const m = getMember(members, selectedId);
  if (!m) return null;

  const cfg = TYPE_CONFIG[m.type];
  const parent = m.pid ? getMember(members, m.pid) : null;
  const children = members.filter(c => c.pid === m.id);

  const fatherMember = m.fatherId ? getMember(members, m.fatherId) : null;
  const motherMember = m.motherId ? getMember(members, m.motherId) : null;
  const fatherDisplay = fatherMember?.name ?? m.fatherName ?? m.father;
  const motherDisplay = motherMember?.name ?? m.motherName ?? m.mother;

  const isSponsorType = m.type !== 'A4D' && m.type !== 'Associate';
  const quota = getA4DQuota(members, m.id);

  const spouseMember = m.rel === 'spouse' && parent
    ? parent
    : (members.find(c => c.pid === m.id && c.rel === 'spouse') ?? null);
  const showPrimary = !!parent && (m.rel === 'a4d' || m.rel === 'associate' || m.rel === 'nominee');
  const bioChildren = members.filter(c => c.fatherId === m.id || c.motherId === m.id);
  // Life/Senior/Donor/Honorary members are independent — their spouse row should NOT appear in the A4D Members list.
  // Permanent/A4D/Associate spouses do consume a quota slot, so they should appear.
  const isDependentType = (type: string) => type === 'A4D' || type === 'Associate' || type === 'Permanent';
  const dependents = children.filter(c =>
    c.rel !== 'child' && c.rel !== null &&
    (c.rel !== 'spouse' || isDependentType(c.type))
  );

  const previewMember = previewId ? getMember(members, previewId) : null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-30 md:hidden"
        onClick={() => setSelected(null)}
      />

      <div className="
        fixed bottom-3 left-3 right-3 z-40 max-h-[62vh] rounded-2xl
        md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:max-h-none md:rounded-none
        md:w-80
        border md:border-t-0 md:border-l md:border-r-0 md:border-b-0 border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-900 overflow-y-auto shrink-0 p-4
        shadow-[0_4px_24px_-4px_rgba(0,0,0,0.18)] md:shadow-[-6px_0_16px_-8px_rgba(0,0,0,0.06)]
      ">
        {/* Mobile drag handle */}
        <div className="flex justify-center mb-3 md:hidden">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Member Details
          </span>
          <button
            onClick={() => setSelected(null)}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-semibold mx-auto mb-3 shadow-sm"
          style={{ background: cfg.bg, color: cfg.dark }}
        >
          {getInitials(m.name)}
        </div>

        <div className="text-[15px] font-semibold text-center text-gray-800 dark:text-gray-100 leading-snug">
          {m.name}
        </div>

        <div className="text-[11px] text-gray-400 dark:text-gray-500 text-center mb-2.5">
          {m.id}
        </div>

        {isSponsorType && (
          <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center mb-4">
            A4D Quota: <span className="text-gray-600 dark:text-gray-300 font-medium">{quota.used}/{quota.total}</span> used
          </div>
        )}
        {!isSponsorType && <div className="mb-4" />}

        {[
          ['Member ID',     m.memberId],
          ['Joined',        m.since],
          ['Birth Date',    m.birthDate],
          ['Email',         m.email],
          ['Phone',         m.phone ?? m.phoneRes ?? m.phoneOff],
          ['A4D Source',    m.quotaNote],
          ['Succession',    m.succession],
          ['Membership Ref',m.membershipRef],
          ['Note',          m.note],
        ]
          .filter(([, v]) => v)
          .map(([label, val]) => (
            <div
              key={label}
              className="flex gap-2 py-1.5 border-t border-gray-100 dark:border-gray-700 text-[12px]"
            >
              <span className="text-gray-400 dark:text-gray-500 w-20 shrink-0 text-[11px]">
                {label}
              </span>
              <span className="text-gray-700 dark:text-gray-200 break-all leading-snug">
                {val}
              </span>
            </div>
          ))}

        {(showPrimary || spouseMember || fatherDisplay || motherDisplay || bioChildren.length > 0 || dependents.length > 0) && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">

            {(fatherDisplay || motherDisplay) && (
              <div className="mt-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">
                  <Users size={11} />
                  Parents
                </div>

                {fatherDisplay && (
                  <div
                    className={`flex items-center gap-2 text-[11px] py-1 ${fatherMember ? 'cursor-pointer hover:text-blue-600' : ''}`}
                    onClick={() => fatherMember && setPreviewId(fatherMember.id)}
                  >
                    <span className="text-gray-400 dark:text-gray-500 w-12 shrink-0">Father</span>
                    <span className="text-gray-700 dark:text-gray-200">{fatherDisplay}</span>
                    {fatherMember && <ChevronRight size={12} className="text-gray-300" />}
                  </div>
                )}

                {motherDisplay && (
                  <div
                    className={`flex items-center gap-2 text-[11px] py-1 ${motherMember ? 'cursor-pointer hover:text-blue-600' : ''}`}
                    onClick={() => motherMember && setPreviewId(motherMember.id)}
                  >
                    <span className="text-gray-400 dark:text-gray-500 w-12 shrink-0">Mother</span>
                    <span className="text-gray-700 dark:text-gray-200">{motherDisplay}</span>
                    {motherMember && <ChevronRight size={12} className="text-gray-300" />}
                  </div>
                )}
              </div>
            )}

            {showPrimary && parent && (
              <>
                <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5 mt-3">
                  Primary Member
                </div>
                <MemberRow member={parent} onPreview={setPreviewId} />
              </>
            )}

            {spouseMember && (
              <>
                <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5 mt-3">
                  Spouse
                </div>
                <MemberRow member={spouseMember} onPreview={setPreviewId} />
              </>
            )}

            {bioChildren.length > 0 && (
              <>
                <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-3 mb-1.5">
                  Children ({bioChildren.length})
                </div>
                {bioChildren.map(ch => (
                  <MemberRow key={ch.id} member={ch} onPreview={setPreviewId} />
                ))}
              </>
            )}

            {dependents.length > 0 && (
              <>
                <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-3 mb-1.5">
                  A4D Members ({dependents.length})
                </div>
                {dependents.map(ch => (
                  <MemberRow key={ch.id} member={ch} onPreview={setPreviewId} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewMember && (
        <MemberPreviewModal
          member={previewMember}
          members={members}
          onClose={() => setPreviewId(null)}
          onNavigate={navigateTo}
        />
      )}
    </>
  );
}
