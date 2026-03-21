import React from 'react';
import styles from './CodeBlock.module.css';

export default function CodeBlock({ children, language }) {
  const lines = String(children).split('\n');
  return (
    <div className={styles.wrapper}>
      {language && <div className={styles.lang}>{language}</div>}
      <pre className={styles.pre}>
        {lines.map((line, i) => (
          <div key={i} className={styles.line}>
            <span className={styles.lineNum}>{i + 1}</span>
            <span className={styles.lineContent}>{line}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}
