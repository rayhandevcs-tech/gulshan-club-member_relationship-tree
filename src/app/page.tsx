'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMemberStore } from '@/store/memberStore';
import { fetchMembers } from '@/lib/api';
import MemberTree from '@/components/MemberTree';
import DetailPanel from '@/components/DetailPanel';
import MemberForm from '@/components/MemberForm';
import SearchBar from '@/components/SearchBar';
import { Plus, LayoutGrid, Network } from 'lucide-react';
import s from './page.module.css';

export default function Home() {
  const { view, setView, selectedId, setMembers } = useMemberStore();

  const { data, isLoading, isError } = useQuery({ queryKey: ['members'], queryFn: fetchMembers });

  useEffect(() => {
    if (data) setMembers(data);
  }, [data, setMembers]);

  const [formState, setFormState] = useState<{
    open: boolean;
    editId?: string;
    pid?: string;
  }>({ open: false });

  if (isLoading) {
    return <div className={s.root} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9ca3af' }}>Loading members…</div>;
  }

  if (isError) {
    return <div className={s.root} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#dc2626' }}>Failed to load members. Please refresh.</div>;
  }

  return (
    <div className={s.root}>
      {/* Header */}
      <div className={s.header}>
        {/* Row 1: Title + mobile action buttons */}
        <div className={s.titleRow}>
          <div className={s.brand}>
            <div className={s.logo}>GC</div>
            <div>
              <div className={s.title}>Gulshan Club Limited</div>
              <div className={s.subtitle}>Membership Relationship Tree</div>
            </div>
          </div>

          {/* Mobile-only: view toggle + new member */}
          <div className={s.mobileActions}>
            <div className={s.tabGroup}>
              <button
                onClick={() => setView('tree')}
                className={`${s.tabBtnSm} ${view === 'tree' ? s.tabBtnSmActive : ''}`}
              >
                <Network size={12} />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`${s.tabBtnSm} ${view === 'grid' ? s.tabBtnSmActive : ''}`}
              >
                <LayoutGrid size={12} />
              </button>
            </div>
            <button
              onClick={() => setFormState({ open: true })}
              className={s.newBtnMobile}
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Row 2: SearchBar */}
        <SearchBar />

        {/* Desktop-only: view toggle + new member */}
        <div className={s.desktopActions}>
          <div className={s.tabGroup}>
            <button
              onClick={() => setView('tree')}
              className={`${s.tabBtnLg} ${view === 'tree' ? s.tabBtnLgActive : ''}`}
            >
              <Network size={13} /> Tree
            </button>
            <button
              onClick={() => setView('grid')}
              className={`${s.tabBtnLg} ${view === 'grid' ? s.tabBtnLgActive : ''}`}
            >
              <LayoutGrid size={13} /> Grid
            </button>
          </div>
          <button
            onClick={() => setFormState({ open: true })}
            className={s.newBtnDesktop}
          >
            <Plus size={14} /> New Member
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={s.main}>
        <div className={s.treeArea}>
          <MemberTree />
        </div>
        {selectedId && (
          <DetailPanel onEdit={id => setFormState({ open: true, editId: id })} />
        )}
      </div>

      {/* Add / Edit Modal */}
      {formState.open && (
        <MemberForm
          onClose={() => setFormState({ open: false })}
          editId={formState.editId}
          defaultPid={formState.pid}
        />
      )}
    </div>
  );
}
