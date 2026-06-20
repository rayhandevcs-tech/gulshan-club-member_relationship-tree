'use client';
import { useState } from 'react';
import { useMemberStore } from '@/store/memberStore';
import { Member } from '@/lib/types';
import {
  getRoots, getSpouse, getNonSpouseChildren, getAssociates,
  getNominees, getAllDescendants, getQuotaSourceCaption, TYPE_CONFIG
} from '@/lib/memberUtils';
import MemberNode from './MemberNode';
import { FocusedDiagram, WholeMapDiagram } from './RelationshipDiagram';
import { Search, Network, GitBranch } from 'lucide-react';

function AssocGroup({ parentId }: { parentId: string }) {
  const { members, navigateTo } = useMemberStore();
  const assocs = getAssociates(members, parentId);
  const noms   = getNominees(members, parentId);
  const all = [...assocs, ...noms];
  if (!all.length) return null;
  return (
    <div className="flex flex-col items-center">
      <div className="w-[1.5px] h-3 bg-gray-300" />
      <div className="text-[9px] font-medium text-gray-500 mb-1.5">
        {noms.length ? `Nominee (${all.length})` : `Associate (${all.length})`}
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {all.map(a => (
          <div key={a.id} onClick={() => navigateTo(a.id)}>
            <MemberNode member={a} small dashed />
          </div>
        ))}
      </div>
    </div>
  );
}

function FamilySubtree({ member }: { member: Member }) {
  const { members, navigateTo } = useMemberStore();
  const spouse = getSpouse(members, member.id);

  // A couple can each sponsor their own A4D/child slots, so combine
  // both sides — without this, anything sponsored under the spouse's
  // own id (instead of the root member's id) would be invisible here.
  const allKids = [
    ...getNonSpouseChildren(members, member.id),
    ...(spouse ? getNonSpouseChildren(members, spouse.id) : []),
  ].filter(k => k.rel !== 'associate' && k.rel !== 'nominee');

  // Who's structurally sponsoring this level's kids — used to tell
  // whether a kid's biological parent differs from where they're shown.
  const sponsorIds = [member.id, ...(spouse ? [spouse.id] : [])];

  return (
    <div className="flex flex-col items-center">
      {/* couple row */}
      <div className="flex items-start gap-1">
        <div onClick={() => navigateTo(member.id)}>
          <MemberNode member={member} />
        </div>
        {spouse && (
          <>
            <span className="text-pink-400 text-[15px] pt-5 px-1">♥</span>
            <div onClick={() => navigateTo(spouse.id)}>
              <MemberNode member={spouse} showRel />
            </div>
          </>
        )}
      </div>
      <AssocGroup parentId={member.id} />
      {spouse && <AssocGroup parentId={spouse.id} />}
      {allKids.length > 0 && (
        <>
          <div className="w-[1.5px] h-5 bg-gray-300" />
          {allKids.length > 1 && (
            <div className="h-[1.5px] bg-gray-300" style={{ width: Math.min(allKids.length * 108, 460) }} />
          )}
          <div className="flex gap-4 items-start">
            {allKids.map(kid => (
              <div key={kid.id} className="flex flex-col items-center">
                <div className="w-[1.5px] h-5 bg-gray-300" />
                {kid.rel === 'child' ? (
                  // This descendant is themselves a core member with their
                  // own spouse/A4D allocations — nest their subtree
                  // instead of rendering them as a flat leaf.
                  <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/60">
                    <FamilySubtree member={kid} />
                  </div>
                ) : (
                  <>
                    <div onClick={() => navigateTo(kid.id)}>
                      <MemberNode member={kid} showRel />
                    </div>
                    {(() => {
                      const caption = getQuotaSourceCaption(kid, sponsorIds, members);
                      return caption ? (
                        <div className="text-[8px] text-gray-400 text-center max-w-[96px] leading-tight -mt-0.5 mb-0.5 italic">
                          {caption}
                        </div>
                      ) : null;
                    })()}
                    <AssocGroup parentId={kid.id} />
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyPrompt() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 px-6 text-center">
      <Search size={34} className="text-gray-300" />
      <div className="text-[15px] font-medium text-gray-500">Search for a member</div>
      <div className="text-[12px] max-w-[300px] leading-relaxed">
        Type a name or A/C number..
      </div>
    </div>
  );
}

export default function MemberTree() {
  const { members, filterType, activeRootId, focusViewId, view, navigateTo } = useMemberStore();
  const [diagramMode, setDiagramMode] = useState<'focused' | 'whole'>('focused');

  // Category-pill browse mode: show every family that has a member of
  // this type. This is the one case where multiple cards is intentional.
  const categoryMatchIds = filterType
    ? new Set(members.filter(m => m.type === filterType).map(m => m.id))
    : null;

  const categoryRoots = categoryMatchIds
    ? getRoots(members).filter(r => {
        const desc = [r.id, ...getAllDescendants(members, r.id)];
        return desc.some(id => categoryMatchIds.has(id));
      })
    : [];

  // Single-family mode: the person picked a specific result from the
  // search dropdown, so resolve and show only that one root.
  const activeRoot = !filterType && activeRootId
    ? members.find(m => m.id === activeRootId)
    : undefined;

  const hasQuery = !!filterType || !!activeRoot;

  if (!hasQuery) {
    return <EmptyPrompt />;
  }

  if (view === 'grid') {
    const visible = filterType
      ? members.filter(m => categoryMatchIds!.has(m.id))
      : activeRoot
        ? members.filter(
            m => m.id === activeRoot.id || getAllDescendants(members, activeRoot.id).includes(m.id)
          )
        : [];
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 p-6">
        {visible.map(m => {
          const cfg = TYPE_CONFIG[m.type];
          return (
            <div
              key={m.id}
              onClick={() => useMemberStore.getState().navigateTo(m.id)}
              className="border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all flex flex-col items-center gap-1.5 bg-white"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-[13px] font-semibold relative shadow-sm"
                style={{ background: cfg.bg, color: cfg.dark }}>
                {m.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[7px] flex items-center justify-center font-bold text-white border-2 border-white"
                  style={{ background: cfg.color }}>{cfg.short}</div>
              </div>
              <div className="text-[11px] font-medium text-center text-gray-800 leading-tight">{m.name}</div>
              <div className="text-[10px] text-gray-400">{m.id}</div>
              <div className="text-[9px] px-2 py-1 rounded-full font-medium"
                style={{ background: cfg.bg, color: cfg.dark }}>{m.type}</div>
            </div>
          );
        })}
      </div>
    );
  }

  // Category browsing always shows the multi-family card view — there's
  // no single "focus person" to center a relationship diagram on here.
  if (filterType) {
    if (!categoryRoots.length) {
      return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">কোনো সদস্য পাওয়া যায়নি</div>;
    }
    return (
      <div className="flex flex-wrap gap-6 p-8 items-start justify-center">
        {categoryRoots.map(r => {
          const cfg = TYPE_CONFIG[r.type];
          return (
            <div key={r.id} className="inline-flex flex-col items-center border rounded-2xl p-6 bg-white shadow-sm"
              style={{ borderColor: cfg.color + '33' }}>
              <div className="text-[10px] font-medium px-2.5 py-1 rounded-full mb-5"
                style={{ background: cfg.bg, color: cfg.dark }}>
                {r.type} · {r.id}
              </div>
              <FamilySubtree member={r} />
            </div>
          );
        })}
      </div>
    );
  }

  // Single-family mode (search result picked): default to the focused
  // relationship diagram for whoever is currently selected, with a
  // toggle to see the whole family at once.
  if (!activeRoot) return null;
  const focusId = focusViewId ?? activeRoot.id;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mt-4 mb-2">
        <button
          onClick={() => setDiagramMode('focused')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-colors ${
            diagramMode === 'focused' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'
          }`}
        >
          <GitBranch size={12} /> Relationship Diagram
        </button>
        <button
          onClick={() => setDiagramMode('whole')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-colors ${
            diagramMode === 'whole' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'
          }`}
        >
          <Network size={12} /> Whole Family Map
        </button>
      </div>

      <div className="w-full overflow-auto p-3 sm:p-6 flex items-start justify-center">
        {diagramMode === 'focused' ? (
          <FocusedDiagram focusId={focusId} members={members} onPick={navigateTo} />
        ) : (
          <WholeMapDiagram rootId={activeRoot.id} members={members} onPick={navigateTo} />
        )}
      </div>
    </div>
  );
}
