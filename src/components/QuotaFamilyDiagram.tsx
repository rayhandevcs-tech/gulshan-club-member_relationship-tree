
import { useMemo, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  NodeTypes,
  NodeMouseHandler,
} from 'reactflow';
import { TYPE_CONFIG, getInitials } from '@/lib/memberUtils';
import type { Member } from '@/lib/types';
import {
  buildGraph, applyLayout, findRoot,
  getType, isDead, dispName, photoOf,
  CARD_W, SLOT_W, CONN_COLOR,
} from './Quotatreelayout';

// type drives ONLY colors/badges — placement is via/rel (see layout module)
function cardColors(m: Member) {
  if (isDead(m)) return { border: '#F59E0B', avatarBg: '#D97706', cardBg: '#FFFBEB' };
  const c = TYPE_CONFIG[getType(m)] ?? TYPE_CONFIG.Permanent;
  return { border: c.color, avatarBg: c.color, cardBg: '#FFFFFF' };
}

const handleStyle = { background: CONN_COLOR, width: 8, height: 8, border: 'none' } as const;

// ── Member card ───────────────────────────────────────────────────────────────

interface MemberNodeData {
  member: Member;
  isSuccessor?: boolean;
  onPick: (id: string) => void;
}

function MemberNodeComp({ data }: { data: MemberNodeData }) {
  const { member: m, isSuccessor, onPick } = data;
  const [hovered, setHovered] = useState(false);
  const { border, avatarBg, cardBg } = cardColors(m);
  const name = dispName(m);
  const type = getType(m);
  const bg   = isSuccessor ? '#fffbeb' : cardBg;

  return (
    // no fixed node width: the container hugs the card, so the left/right
    // handle dots sit ON the card border instead of floating in space
    <div style={{ position: 'relative' }}>
      <Handle id="top"       type="target" position={Position.Top}    isConnectable={false} style={handleStyle} />
      <Handle id="top-out"   type="source" position={Position.Top}    isConnectable={false} style={handleStyle} />
      <Handle id="left-in"   type="target" position={Position.Left}   isConnectable={false} style={handleStyle} />
      <Handle id="right-in"  type="target" position={Position.Right}  isConnectable={false} style={handleStyle} />
      <Handle id="bottom"    type="source" position={Position.Bottom} isConnectable={false} style={handleStyle} />
      <Handle id="left-out"  type="source" position={Position.Left}   isConnectable={false} style={handleStyle} />
      <Handle id="right-out" type="source" position={Position.Right}  isConnectable={false} style={handleStyle} />

      <button
        onClick={e => { e.stopPropagation(); onPick(m.id); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          border: `2px solid ${border}`, borderRadius: 16, background: bg,
          padding: '13px 16px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
          cursor: 'pointer', width: CARD_W,
          boxShadow: hovered ? '0 6px 16px rgba(0,0,0,0.16)' : '0 2px 6px rgba(0,0,0,0.08)',
          transform: hovered ? 'translateY(-2px)' : 'none',
          transition: 'box-shadow 150ms ease, transform 150ms ease, border-color 150ms ease',
          opacity: isSuccessor ? 0.92 : 1,
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: '50%', backgroundColor: avatarBg,
          backgroundImage: photoOf(m) ? `url(${photoOf(m)})` : undefined,
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {!photoOf(m) && getInitials(name)}
        </div>
        <div style={{
          fontSize: 11.5, fontWeight: 600, color: '#111827', textAlign: 'center',
          lineHeight: 1.3, width: CARD_W - 28, overflowWrap: 'break-word',
        }}>
          {name}
        </div>
        <div style={{
          fontSize: 9.5, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.02em',
          color: border, background: `${border}1a`, padding: '1px 7px', borderRadius: 999,
        }}>{m.id}</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: 7.5, fontWeight: 600, color: '#6B7280', background: '#F3F4F6', padding: '1px 7px', borderRadius: 999 }}>
            {type}
          </span>
          {isDead(m) && (
            <span style={{ fontSize: 7.5, fontWeight: 600, color: '#92400e', background: '#fef3c7', padding: '1px 7px', borderRadius: 999 }}>
              Deceased
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

// ── Slot card (single size; nested = visually muted, not resized) ─────────────

interface SlotNodeData {
  member: Member;
  role: 'A4D' | 'Assoc';
  nested?: boolean;
  reference?: string;
  onPick: (id: string) => void;
}

function SlotNodeComp({ data }: { data: SlotNodeData }) {
  const { member: m, role, nested, reference, onPick } = data;
  const [hovered, setHovered] = useState(false);
  const { border, avatarBg, cardBg } = cardColors(m);
  const name      = dispName(m);
  const type      = getType(m);
  const roleColor = role === 'A4D' ? '#7c3aed' : '#c2410c';
  const roleBg    = role === 'A4D' ? '#f3e8ff' : '#ffedd5';
  const slotHandleStyle = { background: CONN_COLOR, width: 7, height: 7, border: 'none' } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '3px 0', opacity: nested ? 0.85 : 1 }}>
      <Handle id="top"       type="target" position={Position.Top}    isConnectable={false} style={slotHandleStyle} />
      <Handle id="bottom"    type="source" position={Position.Bottom} isConnectable={false} style={slotHandleStyle} />
      <Handle id="top-out"   type="source" position={Position.Top}    isConnectable={false} style={slotHandleStyle} />
      <Handle id="bottom-in" type="target" position={Position.Bottom} isConnectable={false} style={slotHandleStyle} />

      <div style={{
        fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
        padding: '2px 8px', borderRadius: 999, background: roleBg, color: roleColor,
      }}>
        {role}
      </div>

      <button
        onClick={e => { e.stopPropagation(); onPick(m.id); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          border: `${nested ? 1.5 : 2}px solid ${border}`, borderRadius: 11, background: cardBg,
          padding: '7px 10px',
          display: 'flex', flexDirection: 'column', gap: 4,
          cursor: 'pointer', width: SLOT_W, textAlign: 'left',
          boxShadow: hovered ? '0 4px 10px rgba(0,0,0,0.14)' : '0 1px 3px rgba(0,0,0,0.06)',
          transform: hovered ? 'translateY(-1px)' : 'none',
          transition: 'box-shadow 150ms ease, transform 150ms ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', backgroundColor: avatarBg,
            backgroundImage: photoOf(m) ? `url(${photoOf(m)})` : undefined,
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {!photoOf(m) && getInitials(name)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#111827', lineHeight: 1.3, overflowWrap: 'break-word' }}>
              {name}
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 1, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 7.5, fontWeight: 700, fontFamily: 'monospace',
                color: border, background: `${border}1a`, padding: '0 5px', borderRadius: 999,
              }}>{m.id}</span>
              <span style={{ fontSize: 6.5, fontWeight: 600, color: '#6B7280' }}>{type}</span>
            </div>
          </div>
        </div>
        {reference && (
          <div style={{ fontSize: 7.5, color: '#6B7280', fontStyle: 'italic', paddingLeft: 33, lineHeight: 1.3 }}>
            {reference}
          </div>
        )}
      </button>
    </div>
  );
}

// ── Union anchor (invisible midpoint of the root spousal line) ────────────────

function UnionNodeComp({ data }: { data: { labelOffsetY?: number } }) {
  return (
    <div style={{ width: 1, height: 1, position: 'relative' }}>
      <Handle id="bottom" type="source" position={Position.Bottom} isConnectable={false} style={{ width: 1, height: 1, opacity: 0 }} />
      <span style={{
        position: 'absolute', top: data.labelOffsetY ?? 40, left: 8, whiteSpace: 'nowrap',
        fontSize: 8.5, fontWeight: 500, color: '#9CA3AF',
        background: '#fff', padding: '1px 5px', borderRadius: 4,
      }}>
        Children
      </span>
    </div>
  );
}

const nodeTypes: NodeTypes = { member: MemberNodeComp, slot: SlotNodeComp, union: UnionNodeComp };

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  rootId:   string;
  members:  Member[];
  onPick:   (id: string) => void;
  bioMode?: boolean;
}

function FlowInner({ rootId, members, onPick, bioMode }: Props) {
  const rootMember = useMemo(
    () => members.find(m => m.id === findRoot(rootId, members)),
    [rootId, members],
  );

  const { nodes, edges } = useMemo(() => {
    if (!rootMember) return { nodes: [], edges: [] };
    const raw = buildGraph(rootMember, members, onPick, bioMode ?? false);
    return applyLayout(raw.nodes, raw.edges);
  }, [rootMember, members, onPick, bioMode]);

  if (!rootMember) return null;

  const handleNodeClick: NodeMouseHandler = (_evt, node) => {
    const d = node.data as { member?: Member };
    if (d?.member?.id) onPick(d.member.id);
  };

  return (
    <div style={{ width: '100%', height: 620 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={handleNodeClick}
        panOnScroll
        fitView
        fitViewOptions={{ padding: 0.18, minZoom: 0.12, maxZoom: 1.6 }}
        minZoom={0.1}
        maxZoom={2.5}
      >
        <Background color="#E2E8F0" gap={22} size={1} />
        <Controls
          showInteractive={false}
          style={{ bottom: 10, right: 10, left: 'auto', top: 'auto' }}
        />
      </ReactFlow>
    </div>
  );
}

export function QuotaFamilyDiagram(props: Props) {
  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  );
}