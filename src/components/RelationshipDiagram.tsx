'use client';

import { useMemberStore } from '@/store/memberStore';
import {
  buildRelationshipDiagram,
  DIAGRAM_BOX_W,
  DIAGRAM_BOX_H,
  TYPE_CONFIG,
} from '@/lib/memberUtils';
import { X } from 'lucide-react';

interface Props {
  rootId: string;
  onClose: () => void;
}

export default function RelationshipDiagram({ rootId, onClose }: Props) {
  const { members, setSelected } = useMemberStore();
  const layout = buildRelationshipDiagram(members, rootId);

  if (!layout) return null;

  const { nodes, edges, refs, width, height } = layout;
  const byId = new Map(nodes.map(n => [n.member.id, n]));

  // Everything is laid out in a coordinate space centered on x=0 — shift
  // it into a positive viewBox with padding.
  const minX = Math.min(...nodes.map(n => n.x)) - 80;
  const padTop = refs.length ? 70 : 20;

  const centerX = (id: string) => (byId.get(id)?.x ?? 0) + DIAGRAM_BOX_W / 2 - minX;
  const topY = (id: string) => (byId.get(id)?.y ?? 0) + padTop;
  const bottomY = (id: string) => topY(id) + DIAGRAM_BOX_H;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-[1400px] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
          <span className="text-[13px] font-semibold text-gray-700">Relationship Diagram</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <svg
            width={width}
            height={height + padTop}
            viewBox={`0 0 ${width} ${height + padTop}`}
            style={{ minWidth: width }}
          >
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#374151" />
              </marker>
            </defs>

            {/* membership transfer / renumbering references */}
            {refs.map((ref, i) => {
              const tx = centerX(ref.targetId);
              const ty = topY(ref.targetId);
              const bx = tx - 220;
              const by = ty - 10;
              return (
                <g key={`ref-${i}`}>
                  <rect x={bx} y={by - 36} width={140} height={44} rx={12} fill="#fff" stroke="#9CA3AF" strokeWidth={1.5} />
                  <text x={bx + 70} y={by - 10} textAnchor="middle" fontSize="13" fontWeight={600} fill="#374151">
                    {ref.label}
                  </text>
                  <path
                    d={`M ${bx + 140} ${by - 14} C ${bx + 180} ${by - 14}, ${tx - 30} ${ty - 14}, ${tx} ${ty}`}
                    fill="none" stroke="#9CA3AF" strokeWidth={1.5} markerEnd="url(#arrow)"
                  />
                  {ref.detail && (
                    <text x={(bx + 140 + tx) / 2} y={by - 22} textAnchor="middle" fontSize="10" fill="#6B7280">
                      [{ref.detail}]
                    </text>
                  )}
                </g>
              );
            })}

            {/* edges */}
            {edges.map((e, i) => {
              const from = byId.get(e.fromId);
              const to = byId.get(e.toId);
              if (!from || !to) return null;

              if (e.kind === 'spouse') {
                const y = topY(e.fromId) + DIAGRAM_BOX_H / 2;
                const x1 = from.x + DIAGRAM_BOX_W - minX;
                const x2 = to.x - minX;
                return (
                  <g key={i}>
                    <line x1={x1} y1={y} x2={x2} y2={y} stroke="#374151" strokeWidth={1.5} />
                    <text x={(x1 + x2) / 2} y={y - 8} textAnchor="middle" fontSize="10" fill="#6B7280">
                      [{e.label}]
                    </text>
                  </g>
                );
              }

              if (e.kind === 'sibling') {
                const y = topY(e.fromId) + DIAGRAM_BOX_H / 2;
                const x1 = from.x + DIAGRAM_BOX_W - minX;
                const x2 = to.x - minX;
                return (
                  <g key={i}>
                    <line x1={x1} y1={y} x2={x2} y2={y} stroke="#9CA3AF" strokeWidth={1.5} />
                    <text x={(x1 + x2) / 2} y={y - 8} textAnchor="middle" fontSize="10" fill="#9CA3AF">
                      [{e.label}]
                    </text>
                  </g>
                );
              }

              // vertical / skip-generation structural edge
              const x1 = centerX(e.fromId);
              const y1 = bottomY(e.fromId);
              const x2 = centerX(e.toId);
              const y2 = topY(e.toId);
              const midY = y1 + (y2 - y1) / 2;
              const path = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2 - 6}`;

              return (
                <g key={i}>
                  <path d={path} fill="none" stroke="#374151" strokeWidth={1.5} markerEnd="url(#arrow)" />
                  {e.label && (
                    <text x={(x1 + x2) / 2} y={midY - 6} textAnchor="middle" fontSize="10" fill="#6B7280">
                      [{e.label}]
                    </text>
                  )}
                </g>
              );
            })}

            {/* nodes */}
            {nodes.map(n => {
              const cfg = TYPE_CONFIG[n.member.type];
              const x = n.x - minX;
              const y = n.y + padTop;
              return (
                <g
                  key={n.member.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelected(n.member.id)}
                >
                  <rect
                    x={x} y={y} width={DIAGRAM_BOX_W} height={DIAGRAM_BOX_H} rx={12}
                    fill="#fff" stroke={cfg.color} strokeWidth={1.5}
                  />
                  <text x={x + 12} y={y + 22} fontSize="13" fontWeight={600} fill="#1F2937">
                    {n.member.name.length > 22 ? n.member.name.slice(0, 21) + '…' : n.member.name}
                  </text>
                  <text x={x + 12} y={y + 40} fontSize="11" fill="#9CA3AF">
                    {n.member.id} · {n.member.type}
                  </text>
                  {n.caption && (
                    <text x={x + 12} y={y + 56} fontSize="10" fontStyle="italic" fill="#9CA3AF">
                      {n.caption}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
