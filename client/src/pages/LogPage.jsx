import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCompiler } from '../store/useCompilerStore';
import MutationLog from '../components/compiler/MutationLog';
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <EmptyState
          icon="≡"
          heading="No mutations yet"
          description="Write some code and hit Compile."
          action="Go to editor"
          onAction={() => navigate('/app/editor')}
        />
      </motion.div>
    );
  }

  const titleText = "Mutation log";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {titleText.split('').map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02, duration: 0.3 }}
              style={{ display: 'inline-block', whiteSpace: 'pre' }}
            >
              {char}
            </motion.span>
          ))}
        </h2>
        <motion.p
           className={styles.subtitle}
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.3 }}
        >
          Every change the chaos engine made to your AST
        </motion.p>
      </div>
      <div className={styles.tableWrapContainer} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div className={styles.tableWrap} style={{ flex: 1 }}>
          <MutationLog />
        </div>
        {/* Right context panel */}
        <motion.div 
           className={styles.contextPanel}
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.4 }}
           style={{ width: '250px', borderLeft: '1px solid var(--surface-3)', padding: 'var(--space-5)', background: 'var(--surface-1)' }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
            CHAOS SCORE
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--surface-3)', borderRadius: '4px', overflow: 'hidden' }}>
            <motion.div 
               initial={{ width: 0 }} 
               animate={{ width: `${Math.min((state.mutations?.length || 0) * 10, 100)}%` }} 
               transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
               style={{ height: '100%', background: 'var(--accent)' }} 
            />
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {state.mutations?.length || 0} hits on your AST structures.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
