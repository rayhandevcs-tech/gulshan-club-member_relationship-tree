'use client';
import { useState } from 'react';
import { useMemberStore } from '@/store/memberStore';
import { Member } from '@/lib/types';
import {
  getRoots, getSpouse, getNonSpouseChildren, getAssociates,
  getAllDescendants, getQuotaSourceCaption, TYPE_CONFIG
} from '@/lib/memberUtils';
import { getType, photoOf } from '@/components/Quotatreelayout';
import MemberNode from './MemberNode';
import { FocusedDiagram, WholeMapDiagram, BioFamilyDiagram } from './RelationshipDiagram';
import { Search, GitBranch, Users, ArrowLeft } from 'lucide-react';
import s from './MemberTree.module.css';

function AssocGroup({ parentId }: { parentId: string }) {
  const { members, navigateTo } = useMemberStore();
  const assocs = getAssociates(members, parentId);
  if (!assocs.length) return null;
  return (
    <div className={s.assocGroup}>
      <div className={s.assocLine} />
      <div className={s.assocLabel}>
        Associate ({assocs.length})
      </div>
      <div className={s.assocCards}>
        {assocs.map(a => (
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

  const allKids = [
    ...getNonSpouseChildren(members, member.id),
    ...(spouse ? getNonSpouseChildren(members, spouse.id) : []),
  ].filter(k => k.via !== 'associate');

  const sponsorIds = [member.id, ...(spouse ? [spouse.id] : [])];

  return (
    <div className={s.subtree}>
      <div className={s.subtreeTop}>
        <div onClick={() => navigateTo(member.id)}>
          <MemberNode member={member} />
        </div>
        {spouse && (
          <>
            <span className={s.heartIcon}>♥</span>
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
          <div className={s.subtreeVline} />
          {allKids.length > 1 && (
            <div className={s.subtreeHline} style={{ width: Math.min(allKids.length * 108, 460) }} />
          )}
          <div className={s.subtreeChildren}>
            {allKids.map(kid => (
              <div key={kid.id} className={s.kidCol}>
                <div className={s.subtreeVline} />
                {kid.rel === 'child' && kid.via !== 'a4d' ? (
                  <div className={s.kidBox}>
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
                        <div className={s.quotaCaption}>{caption}</div>
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
    <div className={s.emptyPrompt}>
      <Search size={34} className={s.emptyIcon} />
      <div className={s.emptyTitle}>Search for a member</div>
      <div className={s.emptyHint}>
        Type a name or A/C number..
      </div>
    </div>
  );
}

export default function MemberTree() {

  const { members, filterType, activeRootId, focusViewId, focusHistory, highlightedId, view, navigateTo, goBack } = useMemberStore();
  const [diagramMode, setDiagramMode] = useState<'focused' | 'whole' | 'bio'>('bio');

  const categoryMatchIds = filterType
    ? new Set(members.filter(m => getType(m) === filterType).map(m => m.id))
    : null;

  const categoryRoots = categoryMatchIds
    ? getRoots(members).filter(r => {
        const desc = [r.id, ...getAllDescendants(members, r.id)];
        return desc.some(id => categoryMatchIds.has(id));
      })
    : [];

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
      <div className={s.grid}>
        {visible.map(m => {
          const cfg = TYPE_CONFIG[getType(m) as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.Permanent;
          return (
            <div
              key={m.id}
              onClick={() => useMemberStore.getState().navigateTo(m.id)}
              className={s.gridCard}
            >
              <div
                className={s.gridAvatar}
                style={{
                  background: cfg.bg, color: cfg.dark,
                  backgroundImage: photoOf(m) ? `url(${photoOf(m)})` : undefined,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                }}
              >
                {!photoOf(m) && m.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
              </div>
              <div className={s.gridName}>{m.name}</div>
              <div className={s.gridId}>{m.id}</div>
            </div>
          );
        })}
      </div>
    );
  }

  if (filterType) {
    if (!categoryRoots.length) {
      return <div className={s.noResult}>কোনো সদস্য পাওয়া যায়নি</div>;
    }
    return (
      <div className={s.filterWrap}>
        {categoryRoots.map(r => {
          const type = getType(r);
          const cfg = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.Permanent;
          return (
            <div key={r.id} className={s.filterCard} style={{ borderColor: cfg.color + '33' }}>
              <div className={s.filterCardBadge} style={{ background: cfg.bg, color: cfg.dark }}>
                {type} · {r.id}
              </div>
              <FamilySubtree member={r} />
            </div>
          );
        })}
      </div>
    );
  }

  if (!activeRoot) return null;
  const focusId = focusViewId ?? activeRoot.id;

  return (

    <div className={s.diagramWrap}>

      <div className={s.tabsRow}>

        {diagramMode === 'focused' && focusHistory.length > 0 && (
          <button onClick={goBack} className={s.backBtn}>
            <ArrowLeft size={12} /> Back
          </button>
        )}

        <div className={s.tabs}>

          <button
            onClick={() => setDiagramMode('bio')}
            className={`${s.tab} ${diagramMode === 'bio' ? s.tabActive : ''}`}
          >
            <GitBranch size={12} /> Member Relationship
          </button>

          <button
            onClick={() => setDiagramMode('focused')}
            className={`${s.tab} ${diagramMode === 'focused' ? s.tabActive : ''}`}
          >
            <Users size={12} /> Family Relationship
          </button>

        </div>

      </div>


      <div className={`${s.diagramArea} ${diagramMode === 'bio' ? s.diagramAreaStart : ''}`}>
        {diagramMode === 'focused' && (

          <div className={s.bioWrap}>
            <FocusedDiagram focusId={focusId} members={members} onPick={navigateTo} highlightedId={highlightedId} />
          </div>

        )}

        {diagramMode === 'whole' && (

          <WholeMapDiagram rootId={activeRoot.id} members={members} onPick={navigateTo} />
        )}

        {diagramMode === 'bio' && (

          <div className={s.bioWrap}>
            <BioFamilyDiagram rootId={activeRoot.id} members={members} onPick={navigateTo} highlightedId={highlightedId} />
          </div>
        )}

      </div>

    </div>



  );
}
