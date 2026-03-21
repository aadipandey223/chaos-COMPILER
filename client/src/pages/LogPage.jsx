import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompiler } from '../store/useCompilerStore';
import MutationTable from '../components/compiler/MutationTable';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import styles from './LogPage.module.css';

export default function LogPage() {
  const { state } = useCompiler();
  const navigate  = useNavigate();

  if (state.status === 'compiling') {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.loadingLabel}>Running chaos engine…</div>
        <LoadingSkeleton variant="table" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <EmptyState
        icon="✕"
        heading="Compilation failed"
        description={state.error}
        action="Back to editor"
        onAction={() => navigate('/app/editor')}
      />
    );
  }

  if (!state.ast) {
    return (
      <EmptyState
        icon="≡"
        heading="No mutations yet"
        description="Write some code and hit Compile."
        action="Go to editor"
        onAction={() => navigate('/app/editor')}
      />
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Mutation log</h2>
        <p className={styles.subtitle}>Every change the chaos engine made to your AST</p>
      </div>
      <div className={styles.tableWrap}>
        <MutationTable mutations={state.mutations} />
      </div>
    </div>
  );
}
