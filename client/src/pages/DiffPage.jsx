import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompiler } from '../store/useCompilerStore';
import DiffViewer from '../components/compiler/DiffViewer';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import styles from './DiffPage.module.css';

export default function DiffPage() {
  const { state } = useCompiler();
  const navigate  = useNavigate();

  if (state.status === 'compiling') {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.loadingLabel}>Applying mutations…</div>
        <div className={styles.skeletonRow}>
          <div className={styles.skeletonPanel}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonLine} style={{ opacity: 1 - i * 0.1 }} />
            ))}
          </div>
          <div className={styles.skeletonPanel}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonLine} style={{ opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        </div>
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
        icon="⇄"
        heading="No diff yet"
        description="Write some code and hit Compile."
        action="Go to editor"
        onAction={() => navigate('/app/editor')}
      />
    );
  }

  const mutCount = state.mutations?.length || 0;

  return (
    <div className={styles.page}>
      <div className={`${styles.banner} ${mutCount > 0 ? styles.bannerAmber : styles.bannerGray}`}>
        {mutCount > 0
          ? `${mutCount} mutation${mutCount !== 1 ? 's' : ''} applied${state.options.seed ? ` · seed ${state.options.seed}` : ''}`
          : 'No mutations applied — try a higher intensity'}
      </div>
      <div className={styles.diffWrap}>
        <DiffViewer code={state.code} mutations={state.mutations} />
      </div>
    </div>
  );
}
