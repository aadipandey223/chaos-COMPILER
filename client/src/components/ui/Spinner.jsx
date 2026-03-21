import React from 'react';
import styles from './Spinner.module.css';

export default function Spinner({ size = 16 }) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}
