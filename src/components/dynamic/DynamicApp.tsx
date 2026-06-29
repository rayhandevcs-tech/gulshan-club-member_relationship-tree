'use client';

import { useState, useTransition } from 'react';
import type { Member as DBMember, QuotaGrant, SuccessionEvent, Nominee } from '@prisma/client';
import type { Member } from '@/lib/types';
import { TYPE_CONFIG, getInitials } from '@/lib/memberUtils';
import { clearAll, seedCase } from '@/app/dynamic/actions';
import AddMemberModal from './AddMemberModal';
import FamilyHierarchyTree from './FamilyHierarchyTree';
import { Plus, Trash2, Database, ChevronRight, Search, FlaskConical, ChevronDown } from 'lucide-react';
import styles from './DynamicApp.module.css';

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
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <a href="/" className={styles.backLink}>
          <ChevronRight size={11} style={{ transform: 'rotate(180deg)' }} /> Static
        </a>
        <div className={styles.divider} />
        <Database size={13} className={styles.dbIcon} />
        <span className={styles.headerTitle}>Dynamic DB</span>
        <span className={styles.memberCount}>{members.length} members</span>
        <div className={styles.headerActions}>
          <button onClick={() => setAddOpen(true)} className={styles.addBtn}>
            <Plus size={13} /> Add Member
          </button>
          <button onClick={handleClear} disabled={isPending} title="Clear all data" className={styles.clearBtn}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Main */}
      <div className={styles.main}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* Search */}
          <div className={styles.searchWrap}>
            <div className={styles.searchInner}>
              <Search size={11} className={styles.searchIcon} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* Member list */}
          <div className={styles.memberList}>
            {filteredMembers.length === 0 ? (
              <div className={styles.memberListEmpty}>
                {members.length === 0 ? 'Load test data →' : 'No results'}
              </div>
            ) : (
              <div className={styles.memberListInner}>
                {filteredMembers.map(m => {
                  const cfg = TYPE_CONFIG[m.type] ?? TYPE_CONFIG.Permanent;
                  const rawM = rawMembers.find(r => r.acNo === m.id);
                  const isSelected = selectedId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedId(m.id)}
                      className={`${styles.memberItem} ${isSelected ? styles.memberItemSelected : styles.memberItemDefault}`}
                    >
                      <div className={styles.memberAvatar} style={{ background: cfg.color }}>
                        {getInitials(m.name)}
                      </div>
                      <div className={styles.memberItemInfo}>
                        <div className={styles.memberItemNameRow}>
                          <span className={styles.memberItemName}>{m.name}</span>
                          {rawM?.status !== 'Active' && <span className={styles.memberItemInactiveDot}>●</span>}
                        </div>
                        <div className={styles.memberItemMetaRow}>
                          <span className={styles.memberItemId}>{m.id}</span>
                          <span className={styles.memberItemType} style={{ background: cfg.bg, color: cfg.dark }}>{m.type}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Test data section */}
          <div className={styles.testSection}>
            <button onClick={() => setTestOpen(v => !v)} className={styles.testToggle}>
              <span className={styles.testToggleLabel}><FlaskConical size={11} /> Test Data</span>
              <ChevronDown size={11} className={`${styles.chevron} ${testOpen ? styles.chevronOpen : ''}`} />
            </button>
            {testOpen && (
              <div className={styles.testCases}>
                {CASES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSeed(c.id)}
                    disabled={isPending}
                    title={c.desc}
                    className={styles.caseBtn}
                  >
                    <span className={styles.caseBtnLabel}>{c.label}</span>
                    <span className={styles.caseBtnDesc}>{c.desc}</span>
                  </button>
                ))}
                {isPending && <div className={styles.loadingText}>Loading…</div>}
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className={styles.content}>
          {!selected || !selectedRaw ? (
            <div className={styles.emptyState}>
              <Database size={28} className={styles.emptyIcon} />
              <div className={styles.emptyTitle}>Select a member</div>
              <div className={styles.emptyHint}>
                {members.length === 0
                  ? 'Open "Test Data" in the sidebar to load sample data'
                  : `${members.length} members — click one to see their relationships`}
              </div>
            </div>
          ) : (
            <div className={styles.contentPad}>
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
