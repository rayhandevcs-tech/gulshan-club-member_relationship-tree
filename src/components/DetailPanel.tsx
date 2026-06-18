'use client';

import { useState } from 'react';
import { useMemberStore } from '@/store/memberStore';
import {
  getMember,
  getInitials,
  TYPE_CONFIG,
  getRelLabel,
  getA4DQuota,
  getRootMember,
  UPGRADE_PATHS,
} from '@/lib/memberUtils';
import { X, Edit2, Plus, Trash2, ChevronRight, Users, GitBranch } from 'lucide-react';
import RelationshipDiagram from './RelationshipDiagram';

interface Props {
  onEdit: (id: string) => void;
  onAdd: (pid: string) => void;
}

export default function DetailPanel({ onEdit, onAdd }: Props) {
  const { members, selectedId, setSelected, deleteMember } = useMemberStore();
  const [showDiagram, setShowDiagram] = useState(false);

  if (!selectedId) return null;

  const m = getMember(members, selectedId);

  if (!m) return null;

  const cfg = TYPE_CONFIG[m.type];
  const parent = m.pid ? getMember(members, m.pid) : null;
  const children = members.filter(c => c.pid === m.id);
  const relLabel = getRelLabel(m);
  const upgrades = UPGRADE_PATHS[m.type] ?? [];

  // True biological parents — prefer a linked Member (clickable),
  // fall back to a free-text name, then to the legacy field.
  const fatherMember = m.fatherId ? getMember(members, m.fatherId) : null;
  const motherMember = m.motherId ? getMember(members, m.motherId) : null;
  const fatherDisplay = fatherMember?.name ?? m.fatherName ?? m.father;
  const motherDisplay = motherMember?.name ?? m.motherName ?? m.mother;

  // Core members (anyone who isn't themselves an A4D/Associate slot)
  // get their own A4D quota — show how much of it is in use.
  const isSponsorType = m.type !== 'A4D' && m.type !== 'Associate';
  const quota = getA4DQuota(members, m.id);

  const handleDelete = () => {
    if (confirm('Delete this member and all related members?')) {
      deleteMember(m.id);
    }
  };

  return (

    <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0 p-4 shadow-[-6px_0_16px_-8px_rgba(0,0,0,0.06)]">
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

      <div
        className="text-[11px] font-medium px-3.5 py-1 rounded-full mx-auto w-fit mb-2"
        style={{ background: cfg.bg, color: cfg.dark }}
      >
        {m.type}
        {relLabel ? ` · ${relLabel}` : ''}
      </div>

      {isSponsorType && (
        <div className="text-[10px] text-gray-400 text-center mb-2">
          A4D Quota: <span className="text-gray-600 font-medium">{quota.used}/{quota.total}</span> used
        </div>
      )}
      {!isSponsorType && <div className="mb-2" />}

      <button
        onClick={() => setShowDiagram(true)}
        className="w-full flex items-center justify-center gap-1.5 text-[11px] text-gray-600 border border-gray-200 rounded-lg py-1.5 mb-4 hover:bg-gray-50 transition-colors"
      >
        <GitBranch size={12} /> View Relationship Diagram
      </button>

      {showDiagram && (
        <RelationshipDiagram
          rootId={getRootMember(members, m.id)?.id ?? m.id}
          onClose={() => setShowDiagram(false)}
        />
      )}

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
                    onClick={() => setSelected(parent.id)}
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
                        {parent.id} · {parent.type}
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
                  onClick={() => fatherMember && setSelected(fatherMember.id)}
                >
                  <span className="text-gray-400 w-12 flex-shrink-0">Father</span>
                  <span className="text-gray-700">{fatherDisplay}</span>
                  {fatherMember && <ChevronRight size={12} className="text-gray-300" />}
                </div>
              )}

              {motherDisplay && (
                <div
                  className={`flex items-center gap-2 text-[11px] py-1 ${motherMember ? 'cursor-pointer hover:text-blue-600' : ''}`}
                  onClick={() => motherMember && setSelected(motherMember.id)}
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
                const chRelLabel = getRelLabel(ch);

                return (
                  <div
                    key={ch.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelected(ch.id)}
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
                        {ch.id}{chRelLabel ? ` · ${chRelLabel}` : ` · ${ch.type}`}
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



      {/* {upgrades.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-1">
            Upgrade Path
          </div>

          {upgrades.map(u => (
            <div key={u} className="text-[10px] text-gray-500 py-0.5">
              → {u}
            </div>
          ))}
        </div>
      )} */}

      {/* <div className="mt-3 flex gap-1.5">
        <button
          onClick={() => onEdit(m.id)}
          className="flex-1 flex items-center justify-center gap-1 text-[10px] border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50"
        >
          <Edit2 size={11} /> Edit
        </button>

        <button
          onClick={() => onAdd(m.id)}
          className="flex-1 flex items-center justify-center gap-1 text-[10px] bg-blue-500 text-white rounded-lg py-1.5 hover:bg-blue-600"
        >
          <Plus size={11} /> Add
        </button>
      </div> */}

      {/* <button
        onClick={handleDelete}
        className="w-full mt-1.5 flex items-center justify-center gap-1 text-[10px] text-red-500 border border-red-100 rounded-lg py-1.5 hover:bg-red-50"
      >
        <Trash2 size={11} /> Delete
      </button> */}
    </div>
  );
}
