import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { useCompiler } from '../store/useCompilerStore';
import DiffViewer from '../components/compiler/DiffViewer';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import styles from './DiffPage.module.css';

function Counter({ to }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const controls = animate(count, to, { duration: 0.4, ease: "easeOut" });
    return controls.stop;
  }, [count, to]);

  return <motion.span>{rounded}</motion.span>;
}

export default function DiffPage() {
  const { state } = useCompiler();
  const navigate  = useNavigate();

  const resultsKey = React.useMemo(() => Date.now(), [state.mutations]);

  if (state.status === 'compiling') {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.loadingLabel}>Applying mutations…</div>
        <div className={styles.skeletonRow}>
          <div className={styles.skeletonPanel}>
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div key={i} className={styles.skeletonLine} initial={{ opacity: 0 }} animate={{ opacity: 1 - i * 0.1 }} />
            ))}
          </div>
          <div className={styles.skeletonPanel}>
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div key={i} className={styles.skeletonLine} initial={{ opacity: 0 }} animate={{ opacity: 1 - i * 0.1 }} />
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
      <motion.div
        className={`${styles.banner} ${mutCount > 0 ? styles.bannerAmber : styles.bannerGray}`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {mutCount > 0 ? (
          <>
            <Counter to={mutCount} /> mutation{mutCount !== 1 ? 's' : ''} applied{state.options.seed ? ` · seed ${state.options.seed}` : ''}
          </>
        ) : (
          'No mutations applied — try a higher intensity'
        )}
      </motion.div>
      <div className={styles.diffWrap}>
        <AnimatePresence mode="wait">
          <motion.div
            key={resultsKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ width: '100%', height: '100%' }}
          >
            <DiffViewer code={state.code} mutations={state.mutations} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
