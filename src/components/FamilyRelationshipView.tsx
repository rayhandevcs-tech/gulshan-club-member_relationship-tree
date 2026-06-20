'use client';

import { getMember, getInitials, TYPE_CONFIG, REL_LABELS } from '@/lib/memberUtils';
import { useMemberStore } from '@/store/memberStore';

interface Props {
  memberId: string;
}

export default function FamilyRelationshipView({ memberId }: Props) {
  const { members, setSelected } = useMemberStore();

  const member = getMember(members, memberId);
  if (!member) return null;

  const cfg = TYPE_CONFIG[member.type];

  const father = member.father;
  const mother = member.mother;

  const spouse = members.find(m => m.pid === member.id && m.rel === 'spouse');
  const children = members.filter(m => m.pid === member.id && m.rel === 'a4d');
  const associates = members.filter(m => m.pid === member.id && m.rel === 'associate');
  const nominees = members.filter(m => m.pid === member.id && m.rel === 'nominee');

  const Box = ({
    title,
    name,
    id,
    color = '#3B82F6',
    bg = '#EFF6FF',
    onClick,
  }: {
    title: string;
    name: string;
    id?: string;
    color?: string;
    bg?: string;
    onClick?: () => void;
  }) => (
    <div
      onClick={onClick}
      className={`min-w-[120px] md:min-w-[150px] rounded-xl border p-3 text-center shadow-sm ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
      style={{ borderColor: color, background: bg }}
    >
      <div className="text-[11px] font-medium mb-2" style={{ color }}>
        {title}
      </div>
      <div
        className="w-10 h-10 md:w-12 md:h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-semibold"
        style={{ background: '#fff', color }}
      >
        {getInitials(name)}
      </div>
      <div className="text-[11px] md:text-[12px] font-semibold text-gray-800 leading-snug">
        {name}
      </div>
      {id && <div className="text-[10px] text-gray-500 mt-1">{id}</div>}
    </div>
  );

  return (
    <div className="min-h-full p-4 md:p-8 overflow-auto">
      <div className="flex flex-col items-center gap-6 md:gap-8">

        {(father || mother) && (
          <div className="flex gap-4 md:gap-24 flex-wrap justify-center">
            {father && (
              <Box title="Father" name={father} color="#84CC16" bg="#F7FEE7" />
            )}
            {mother && (
              <Box title="Mother" name={mother} color="#84CC16" bg="#F7FEE7" />
            )}
          </div>
        )}

        <div className="flex items-center gap-6 md:gap-16 flex-wrap justify-center">
          <Box
            title={`Member · ${member.type}`}
            name={member.name}
            id={member.id}
            color={cfg.color}
            bg={cfg.bg}
            onClick={() => setSelected(member.id)}
          />
          {spouse && (
            <Box
              title="Spouse"
              name={spouse.name}
              id={spouse.id}
              color="#EAB308"
              bg="#FEFCE8"
              onClick={() => setSelected(spouse.id)}
            />
          )}
        </div>

        {children.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-[11px] uppercase tracking-wide text-gray-400">
              A4D / Children
            </div>
            <div className="flex gap-4 md:gap-10 flex-wrap justify-center">
              {children.map(child => {
                const cc = TYPE_CONFIG[child.type];
                return (
                  <Box
                    key={child.id}
                    title={REL_LABELS[child.rel ?? ''] ?? 'Child'}
                    name={child.name}
                    id={child.id}
                    color={cc.color}
                    bg={cc.bg}
                    onClick={() => setSelected(child.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {associates.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-[11px] uppercase tracking-wide text-gray-400">
              Associates
            </div>
            <div className="flex gap-3 md:gap-6 flex-wrap justify-center">
              {associates.map(a => {
                const ac = TYPE_CONFIG[a.type];
                return (
                  <Box
                    key={a.id}
                    title="Associate"
                    name={a.name}
                    id={a.id}
                    color={ac.color}
                    bg={ac.bg}
                    onClick={() => setSelected(a.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {nominees.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-[11px] uppercase tracking-wide text-gray-400">
              Nominees
            </div>
            <div className="flex gap-3 md:gap-6 flex-wrap justify-center">
              {nominees.map(n => {
                const nc = TYPE_CONFIG[n.type];
                return (
                  <Box
                    key={n.id}
                    title="Nominee"
                    name={n.name}
                    id={n.id}
                    color={nc.color}
                    bg={nc.bg}
                    onClick={() => setSelected(n.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
