import React from 'react';
import styles from './Badge.module.css';

const MUTATION_COLORS = {
  OPERATOR_MUTATION: 'var(--mut-operator)',
  CONDITION_FLIP:    'var(--mut-condition)',
  LITERAL_SHIFT:     'var(--mut-literal)',
  RETURN_SWAP:       'var(--mut-return)',
  DEAD_CODE_INJECT:  'var(--mut-deadcode)',
};

export default function Badge({ label, color, mutationType }) {
  const resolvedColor = color || (mutationType && MUTATION_COLORS[mutationType]) || 'var(--text-secondary)';
  return (
    <span
      className={styles.badge}
      style={{ color: resolvedColor, borderColor: resolvedColor + '44', background: resolvedColor + '18' }}
    >
      {label || mutationType}
    </span>
  );
}
