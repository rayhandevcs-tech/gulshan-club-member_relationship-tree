'use client';
import { useMemberStore } from '@/store/memberStore';
import { Member } from '@/lib/types';
import {
  getRoots, getSpouse, getNonSpouseChildren, getAssociates,
  getNominees, getAllDescendants, TYPE_CONFIG
} from '@/lib/memberUtils';
import MemberNode from './MemberNode';
import { Search } from 'lucide-react';

function AssocGroup({ parentId }: { parentId: string }) {
  const { members } = useMemberStore();
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
        {all.map(a => <MemberNode key={a.id} member={a} small dashed />)}
      </div>
    </div>
  );
}

function FamilySubtree({ member }: { member: Member }) {
  const { members } = useMemberStore();
  const spouse = getSpouse(members, member.id);
  const kids   = getNonSpouseChildren(members, member.id)
    .filter(k => k.rel !== 'associate' && k.rel !== 'nominee');

  return (
    <div className="flex flex-col items-center">
      {/* couple row */}
      <div className="flex items-start gap-1">
        <MemberNode member={member} />
        {spouse && (
          <>
            <span className="text-pink-400 text-[15px] pt-5 px-1">♥</span>
            <MemberNode member={spouse} showRel />
          </>
        )}
      </div>
      <AssocGroup parentId={member.id} />
      {kids.length > 0 && (
        <>
          <div className="w-[1.5px] h-5 bg-gray-300" />
          {kids.length > 1 && (
            <div className="h-[1.5px] bg-gray-300" style={{ width: Math.min(kids.length * 108, 460) }} />
          )}
          <div className="flex gap-4 items-start">
            {kids.map(kid => (
              <div key={kid.id} className="flex flex-col items-center">
                <div className="w-[1.5px] h-5 bg-gray-300" />
                <MemberNode member={kid} showRel />
                <AssocGroup parentId={kid.id} />
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
        Type a name or A/C number in the search box..
      </div>
    </div>
  );
}

export default function MemberTree() {
  const { members, filterType, activeRootId, view } = useMemberStore();

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
              onClick={() => useMemberStore.getState().setSelected(m.id)}
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

  const roots = filterType ? categoryRoots : activeRoot ? [activeRoot] : [];

  if (!roots.length) {
    return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">কোনো সদস্য পাওয়া যায়নি</div>;
  }

  return (
    <div className="flex flex-wrap gap-6 p-8 items-start justify-center">
      {roots.map(r => {
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
