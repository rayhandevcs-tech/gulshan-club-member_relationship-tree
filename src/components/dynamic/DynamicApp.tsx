'use client';

import { useState, useTransition } from 'react';
import type { Member as DBMember, QuotaGrant, SuccessionEvent, Nominee } from '@prisma/client';
import type { Member } from '@/lib/types';
import { TYPE_CONFIG, getInitials } from '@/lib/memberUtils';
import { clearAll, seedCase } from '@/app/dynamic/actions';
import AddMemberModal from './AddMemberModal';
import FamilyHierarchyTree from './FamilyHierarchyTree';
import { Plus, Trash2, Database, ChevronRight, Search, FlaskConical, ChevronDown } from 'lucide-react';

export default function DynamicApp({
  members,
  rawMembers,
  grants,
  successions,
  nominees,
}: {
  members: Member[];
  rawMembers: DBMember[];
  grants: QuotaGrant[];
  successions: SuccessionEvent[];
  nominees: Nominee[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [testOpen, setTestOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selected = selectedId ? (members.find(m => m.id === selectedId) ?? null) : null;
  const selectedRaw = selectedId ? (rawMembers.find(m => m.acNo === selectedId) ?? null) : null;

  const handleClear = () => {
    if (!confirm('Delete ALL data? This cannot be undone.')) return;
    startTransition(() => clearAll());
    setSelectedId(null);
  };

  const handleSeed = (caseId: string) => {
    startTransition(() => seedCase(caseId));
    setSelectedId(null);
    setTestOpen(false);
  };

  const CASES = [
    { id: 'case1', label: 'Case 1', desc: 'Standard A4D — LM-11 family (Life + 2 children)' },
    { id: 'case2', label: 'Case 2', desc: 'Spouse A4D — PT-7 gives quota to husband + daughter' },
    { id: 'case3', label: 'Case 3', desc: 'Full demo — PK-49, LS-8 quotas, all families' },
    { id: 'case4', label: 'Case 4', desc: 'Donor death → Associates cancelled + succession' },
    { id: 'case5', label: 'Case 5', desc: 'Senior upgrade after 15+ years' },
  ];

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase()) ||
    (m.memberId ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-2.5 flex items-center gap-3 shrink-0">
        <a href="/" className="text-[11px] text-blue-500 hover:text-blue-600 flex items-center gap-0.5 shrink-0">
          <ChevronRight size={11} className="rotate-180" /> Static
        </a>
        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 shrink-0" />
        <Database size={13} className="text-blue-500 shrink-0" />
        <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">Dynamic DB</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
          {members.length} members
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] hover:bg-blue-600 font-medium transition-colors"
          >
            <Plus size={13} /> Add Member
          </button>
          <button
            onClick={handleClear}
            disabled={isPending}
            title="Clear all data"
            className="p-1.5 border border-red-200 dark:border-red-800 text-red-400 dark:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 shrink-0 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-2.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full pl-7 pr-3 py-1.5 text-[12px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-blue-300 dark:focus:border-blue-600"
              />
            </div>
          </div>

          {/* Member list */}
          <div className="flex-1 overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <div className="p-5 text-center text-[11px] text-gray-300 dark:text-gray-600">
                {members.length === 0 ? 'Load test data →' : 'No results'}
              </div>
            ) : (
              <div className="py-1">
                {filteredMembers.map(m => {
                  const cfg = TYPE_CONFIG[m.type] ?? TYPE_CONFIG.Permanent;
                  const rawM = rawMembers.find(r => r.acNo === m.id);
                  const isSelected = selectedId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedId(m.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors border-l-2 ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400'
                          : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/40'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                        style={{ background: cfg.color }}
                      >
                        {getInitials(m.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-medium text-gray-800 dark:text-gray-100 truncate">{m.name}</span>
                          {rawM?.status !== 'Active' && <span className="text-[8px] text-orange-400 shrink-0">●</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-mono text-gray-400 dark:text-gray-500">{m.id}</span>
                          <span className="text-[8px] px-1 py-px rounded-full font-medium" style={{ background: cfg.bg, color: cfg.dark }}>{m.type}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Test data section */}
          <div className="border-t border-gray-100 dark:border-gray-800 shrink-0">
            <button
              onClick={() => setTestOpen(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
            >
              <span className="flex items-center gap-1.5"><FlaskConical size={11} /> Test Data</span>
              <ChevronDown size={11} className={`transition-transform ${testOpen ? 'rotate-180' : ''}`} />
            </button>
            {testOpen && (
              <div className="px-2 pb-2 space-y-1">
                {CASES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSeed(c.id)}
                    disabled={isPending}
                    title={c.desc}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] transition-colors disabled:opacity-50"
                  >
                    <span className="font-medium">{c.label}</span>
                    <span className="text-gray-400 dark:text-gray-500 ml-1.5 text-[10px]">{c.desc}</span>
                  </button>
                ))}
                {isPending && <div className="text-[10px] text-blue-400 text-center py-1 animate-pulse">Loading…</div>}
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
          {!selected || !selectedRaw ? (
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <Database size={28} className="text-gray-200 dark:text-gray-700" />
              <div className="text-[13px] text-gray-400 dark:text-gray-500 font-medium">Select a member</div>
              <div className="text-[11px] text-gray-300 dark:text-gray-600">
                {members.length === 0
                  ? 'Open "Test Data" in the sidebar to load sample data'
                  : `${members.length} members — click one to see their relationships`}
              </div>
            </div>
          ) : (
            <div className="p-6 flex justify-center">
              <FamilyHierarchyTree
                member={selected}
                raw={selectedRaw}
                members={members}
                rawMembers={rawMembers}
                grants={grants}
                successions={successions}
                onSelect={setSelectedId}
              />
            </div>
          )}
        </div>
      </div>

      {addOpen && (
        <AddMemberModal
          members={rawMembers}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}
