import React from 'react';
import styles from './LoadingSkeleton.module.css';

export default function LoadingSkeleton({ variant = 'tree' }) {
  if (variant === 'tree') {
    return (
      <div className={styles.treeWrapper}>
        {/* Fake nodes at different depths */}
        {[
          { top: 40,  left: '50%',  w: 130 },
          { top: 130, left: '30%',  w: 110 },
          { top: 130, left: '70%',  w: 110 },
          { top: 220, left: '20%',  w: 100 },
          { top: 220, left: '40%',  w: 100 },
          { top: 220, left: '60%',  w: 100 },
          { top: 220, left: '80%',  w: 100 },
          { top: 310, left: '15%',  w: 90  },
          { top: 310, left: '35%',  w: 90  },
          { top: 310, left: '65%',  w: 90  },
        ].map((n, i) => (
          <div
            key={i}
            className={styles.node}
            style={{ top: n.top, left: n.left, width: n.w, transform: 'translateX(-50%)' }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={styles.tableWrapper}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.row} style={{ opacity: 1 - i * 0.12 }} />
        ))}
      </div>
    );
  }

  return null;
}
