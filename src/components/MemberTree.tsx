'use client';
import { useState } from 'react';
import { useMemberStore } from '@/store/memberStore';
import { Member } from '@/lib/types';
import { getAllDescendants, TYPE_CONFIG, typeBg, typeText, typeBgHover } from '@/lib/memberUtils';
import { getType, photoOf, displayAcno } from '@/lib/quotaTreeLayout';
import { FamilyRelationshipDiagram } from './FamilyRelationshipDiagram';
import { MemberRelationshipTree } from './MemberRelationshipTree';
import { Search, GitBranch, Users, ArrowLeft } from 'lucide-react';
import s from './styles/MemberTree.module.css';

function GridCard({ member: m }: { member: Member }) {
  const [hovered, setHovered] = useState(false);
  const theme = useMemberStore(state => state.theme);
  const cfg = TYPE_CONFIG[getType(m) as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.Permanent;

  return (
    
    <div
      onClick={() => useMemberStore.getState().navigateTo(m.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={s.gridCard}
      style={{ background: hovered ? typeBgHover(cfg, theme) : typeBg(cfg, theme) }}
    >
      <div
        className={s.gridAvatar}
        style={{
          background: typeBg(cfg, theme), color: typeText(cfg, theme),
          backgroundImage: photoOf(m) ? `url("${photoOf(m)}")` : undefined,
          backgroundSize: 'cover', backgroundPosition: 'center 22%',
        }}
      >
        {!photoOf(m) && m.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
      </div>
      <div className={s.gridName}>{m.name}</div>
      <div className={s.gridId}>{displayAcno(m.id)}</div>
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

  const { members, activeRootId, focusViewId, focusHistory, highlightedId, view, setSelected, goBack } = useMemberStore();
  const [diagramMode, setDiagramMode] = useState<'focused' | 'bio'>('bio');

  const activeRoot = activeRootId
    ? members.find(m => m.id === activeRootId)
    : undefined;

  if (!activeRoot) {
    return <EmptyPrompt />;
  }

  if (view === 'grid') {
    const visible = members.filter(
      m => m.id === activeRoot.id || getAllDescendants(members, activeRoot.id).includes(m.id)
    );
    return (
      <div className={s.grid}>
        {visible.map(m => <GridCard key={m.id} member={m} />)}
      </div>
    );
  }

  const focusId = focusViewId ?? activeRoot.id;

  // The two tabs answer different questions, so a searched DEPENDENT lands
  // in a different place in each.
  //
  // The member view is about quota: a 4(d) dependent holds none, so there is
  // no tree to draw from them — it stays on the member whose quota they sit
  // in, with their card highlighted inside it.
  //
  // The family view is about blood, and resolves anybody through the shared
  // index. Sending it to the sponsor instead showed the sponsor's family
  // with the searched person nowhere on the canvas — searching somebody and
  // being shown somebody else's relatives. It follows the search itself.
  const searched = highlightedId && members.some(m => m.id === highlightedId) ? highlightedId : null;
  const familyFocusId = searched ?? focusId;

  return (

    <div className={s.diagramWrap}>

      <div className={s.tabsRow}>

        {focusHistory.length > 0 && (
          <button onClick={goBack} className={s.backBtn}>
            <ArrowLeft size={13} /> Back
          </button>
        )}

        <div className={s.tabs}>

          <button
            onClick={() => setDiagramMode('bio')}
            className={`${s.tab} ${diagramMode === 'bio' ? s.tabActive : ''}`}
          >
            <GitBranch size={14} /> Member Relationship
          </button>

          <button
            onClick={() => setDiagramMode('focused')}
            className={`${s.tab} ${diagramMode === 'focused' ? s.tabActive : ''}`}
          >
            <Users size={14} /> Family Relationship
          </button>

        </div>

      </div>


      <div className={`${s.diagramArea} ${diagramMode === 'bio' ? s.diagramAreaStart : ''}`}>
        {diagramMode === 'focused' && (

          <div className={s.bioWrap}>
            <FamilyRelationshipDiagram focusId={familyFocusId} members={members} onPick={setSelected} highlightedId={highlightedId} />
          </div>

        )}

        {diagramMode === 'bio' && (

          <div className={s.bioWrap}>
            <MemberRelationshipTree rootId={focusId} members={members} onPick={setSelected} highlightedId={highlightedId} />
          </div>
        )}

      </div>

    </div>



  );
}
