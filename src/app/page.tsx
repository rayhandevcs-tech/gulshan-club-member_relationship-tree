'use client';

import { useState } from 'react';
import { useMemberStore } from '@/store/memberStore';
import { TYPE_CONFIG } from '@/lib/memberUtils';
import MemberTree from '@/components/MemberTree';
import DetailPanel from '@/components/DetailPanel';
import MemberForm from '@/components/MemberForm';
import SearchBar from '@/components/SearchBar';
import { Plus, LayoutGrid, Network } from 'lucide-react';

export default function Home() {
  const {
    members,
    filterType,
    view,
    setFilterType,
    setView,
    selectedId,
  } = useMemberStore();

  const [formState, setFormState] = useState<{
    open: boolean;
    editId?: string;
    pid?: string;
  }>({
    open: false,
  });

  const counts: Record<string, number> = {};

  members.forEach(m => {
    counts[m.type] = (counts[m.type] || 0) + 1;
  });

  const primaryCount = members.filter(
    m => ['Donor', 'Life', 'Permanent'].includes(m.type) && !m.pid
  ).length;

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:gap-4 md:px-5 md:py-4">
        {/* Row 1: Title + mobile action buttons */}
        <div className="flex items-center justify-between md:block">
          <div>
            <div className="text-[15px] md:text-[17px] font-semibold text-gray-800">
              Gulshan Club Limited
            </div>
            <div className="text-[10px] md:text-[11px] text-gray-400">
              Membership Relationship Tree
            </div>
          </div>

          {/* Mobile-only: view toggle + new member */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('tree')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors ${
                  view === 'tree' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'
                }`}
              >
                <Network size={12} />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors ${
                  view === 'grid' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'
                }`}
              >
                <LayoutGrid size={12} />
              </button>
            </div>
            <button
              onClick={() => setFormState({ open: true })}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] hover:bg-blue-600 font-medium transition-colors"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Row 2: SearchBar (full width on mobile) */}
        <SearchBar />

        {/* Desktop-only: view toggle + new member */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-colors ${
                view === 'tree' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'
              }`}
            >
              <Network size={13} /> Tree
            </button>
            <button
              onClick={() => setView('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-colors ${
                view === 'grid' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'
              }`}
            >
              <LayoutGrid size={13} /> Grid
            </button>
          </div>
          <button
            onClick={() => setFormState({ open: true })}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-lg text-[12px] hover:bg-blue-600 font-medium transition-colors"
          >
            <Plus size={14} /> New Member
          </button>
        </div>
      </div>

      {/* Legend / Filter Bar */}
      {/* <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-1 flex-wrap">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
          <button
            key={type}
            onClick={() =>
              setFilterType(filterType === type ? null : type)
            }
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] transition-colors ${
              filterType === type
                ? 'font-medium'
                : 'text-gray-400'
            }`}
            style={
              filterType === type
                ? { background: cfg.bg, color: cfg.dark }
                : {}
            }
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: cfg.color }}
            />

            {type}

            <span className="opacity-50">
              {counts[type] || 0}
            </span>
          </button>
        ))}

        <div className="ml-auto flex gap-3 text-[10px] text-gray-400">
          <span>
            Total{' '}
            <strong className="text-gray-700">
              {members.length}
            </strong>
          </span>

          <span>
            Primary{' '}
            <strong className="text-gray-700">
              {primaryCount}
            </strong>
          </span>

          <span>
            Families{' '}
            <strong className="text-gray-700">
              {members.filter(m => !m.pid).length}
            </strong>
          </span>
        </div>

      </div> */}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 overflow-auto">
          <MemberTree />
        </div>

        {selectedId && (
          <DetailPanel
            onEdit={id =>
              setFormState({
                open: true,
                editId: id,
              })
            }
            onAdd={pid =>
              setFormState({
                open: true,
                pid,
              })
            }
          />
        )}
      </div>

      {/* Add / Edit Modal */}
      {formState.open && (
        <MemberForm
          onClose={() =>
            setFormState({
              open: false,
            })
          }
          editId={formState.editId}
          defaultPid={formState.pid}
        />
      )}
    </div>
  );
}