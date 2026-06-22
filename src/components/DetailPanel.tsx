'use client';

import { useMemberStore } from '@/store/memberStore';
import {
  getMember,
  getInitials,
  TYPE_CONFIG,
  getRelLabel,
  getA4DQuota,
  UPGRADE_PATHS,
} from '@/lib/memberUtils';
import { X, Edit2, Plus, Trash2, ChevronRight, Users } from 'lucide-react';

interface Props {
  onEdit: (id: string) => void;
  onAdd: (pid: string) => void;
}

export default function DetailPanel({ onEdit, onAdd }: Props) {
  const { members, selectedId, setSelected, navigateTo, deleteMember } = useMemberStore();

  if (!selectedId) return null;

  const m = getMember(members, selectedId);

  if (!m) return null;

  const cfg = TYPE_CONFIG[m.type];
  const parent = m.pid ? getMember(members, m.pid) : null;
  const children = members.filter(c => c.pid === m.id);
  const relLabel = getRelLabel(m);
  const upgrades = UPGRADE_PATHS[m.type] ?? [];

  const fatherMember = m.fatherId ? getMember(members, m.fatherId) : null;
  const motherMember = m.motherId ? getMember(members, m.motherId) : null;
  const fatherDisplay = fatherMember?.name ?? m.fatherName ?? m.father;
  const motherDisplay = motherMember?.name ?? m.motherName ?? m.mother;

  const isSponsorType = m.type !== 'A4D' && m.type !== 'Associate';
  const quota = getA4DQuota(members, m.id);

  const handleDelete = () => {
    if (confirm('Delete this member and all related members?')) {
      deleteMember(m.id);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-30 md:hidden"
        onClick={() => setSelected(null)}
      />
    <div className="
      fixed bottom-0 left-0 right-0 z-40 max-h-[70vh] rounded-t-2xl
      md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:max-h-none md:rounded-none
      w-full md:w-80
      border-t md:border-t-0 md:border-l border-gray-200
      bg-white overflow-y-auto flex-shrink-0 p-4
      shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] md:shadow-[-6px_0_16px_-8px_rgba(0,0,0,0.06)]
    ">
      {/* Mobile drag handle */}
      <div className="flex justify-center mb-3 md:hidden">
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
          Member Details
        </span>

        <button
          onClick={() => setSelected(null)}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
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

      <div className="text-[15px] font-semibold text-center text-gray-800 leading-snug">
        {m.name}
      </div>

      <div className="text-[11px] text-gray-400 text-center mb-2.5">
        {m.id}
      </div>

      {/* <div
        className="text-[11px] font-medium px-3.5 py-1 rounded-full mx-auto w-fit mb-2"
        style={{ background: cfg.bg, color: cfg.dark }}
      >
        {m.type}
        {relLabel ? ` · ${relLabel}` : ''}
      </div> */}

      {isSponsorType && (
        <div className="text-[10px] text-gray-400 text-center mb-4">
          A4D Quota: <span className="text-gray-600 font-medium">{quota.used}/{quota.total}</span> used
        </div>
      )}
      {!isSponsorType && <div className="mb-4" />}

      {[
        ['Joined', m.since],
        ['Email', m.email],
        ['Phone', m.phone],
        ['A4D Source', m.quotaNote],
        ['Succession', m.succession],
        ['Membership Ref', m.membershipRef],
        ['Note', m.note],
      ]
        .filter(([, v]) => v)
        .map(([label, val]) => (
          <div
            key={label}
            className="flex gap-2 py-1.5 border-t border-gray-100 text-[12px]"
          >
            <span className="text-gray-400 w-20 flex-shrink-0 text-[11px]">
              {label}
            </span>
            <span className="text-gray-700 break-all leading-snug">
              {val}
            </span>
          </div>
        ))}

      {(parent || children.length > 0) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {parent &&
            (() => {
              const pc = TYPE_CONFIG[parent.type];

              return (
                <>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Primary Member
                  </div>

                  <div
                    className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => navigateTo(parent.id)}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0"
                      style={{ background: pc.bg, color: pc.dark }}
                    >
                      {getInitials(parent.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-gray-800 truncate">
                        {parent.name}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {parent.id}
                      </div>
                    </div>

                    <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                  </div>
                </>
              );
            })()}

          {(fatherDisplay || motherDisplay) && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                <Users size={11} />
                Parents
              </div>

              {fatherDisplay && (
                <div
                  className={`flex items-center gap-2 text-[11px] py-1 ${fatherMember ? 'cursor-pointer hover:text-blue-600' : ''}`}
                  onClick={() => fatherMember && navigateTo(fatherMember.id)}
                >
                  <span className="text-gray-400 w-12 flex-shrink-0">Father</span>
                  <span className="text-gray-700">{fatherDisplay}</span>
                  {fatherMember && <ChevronRight size={12} className="text-gray-300" />}
                </div>
              )}

              {motherDisplay && (
                <div
                  className={`flex items-center gap-2 text-[11px] py-1 ${motherMember ? 'cursor-pointer hover:text-blue-600' : ''}`}
                  onClick={() => motherMember && navigateTo(motherMember.id)}
                >
                  <span className="text-gray-400 w-12 flex-shrink-0">Mother</span>
                  <span className="text-gray-700">{motherDisplay}</span>
                  {motherMember && <ChevronRight size={12} className="text-gray-300" />}
                </div>
              )}
            </div>
          )}

          {children.length > 0 && (
            <>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-3 mb-1.5">
                Family Members ({children.length})
              </div>

              {children.map(ch => {
                const cc = TYPE_CONFIG[ch.type];

                return (
                  <div
                    key={ch.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => navigateTo(ch.id)}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0"
                      style={{ background: cc.bg, color: cc.dark }}
                    >
                      {getInitials(ch.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-gray-800 truncate">
                        {ch.name}
                      </div>

                      <div className="text-[10px] text-gray-400">
                        {ch.id}
                      </div>
                    </div>

                    <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
    </>
  );
}
