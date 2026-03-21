import React from 'react';
import styles from './Divider.module.css';

export default function Divider({ label }) {
  return (
    <div className={styles.divider}>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
