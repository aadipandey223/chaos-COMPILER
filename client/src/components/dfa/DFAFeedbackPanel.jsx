import React from 'react';
import { useDFA } from '../../store/useDFAStore';
import styles from './DFAFeedbackPanel.module.css';

const DFAFeedbackPanel = () => {
  const { state } = useDFA();
  const { mode, validation } = state;

  if (mode !== 'compare') return null;

  const { score, correct, missing, wrong, extra, missingNodes, feedback } = validation;
  const isPerfect = score === 100 && missing.length === 0 && wrong.length === 0 && extra.length === 0 && missingNodes.length === 0;

  const scoreColor = score >= 80 ? '#3a9e6e' : score >= 50 ? '#a06020' : '#c23b2a';

  return (
    <div className={styles.feedbackPanel}>
      <h3 className={styles.title}>DFA Validation</h3>

      {/* Score bar */}
      <div className={styles.scoreRow}>
        <span className={styles.scoreLabel}>Score</span>
        <span className={styles.scoreValue} style={{ color: scoreColor }}>{score}/100</span>
      </div>
      <div className={styles.scoreBar}>
        <div className={styles.scoreFill} style={{ width: `${score}%`, background: scoreColor }} />
      </div>

      {/* Counts */}
      <div className={styles.countsRow}>
        <div className={styles.countItem}>
          <span className={styles.countNum} style={{ color: '#3a9e6e' }}>{correct.length}</span>
          <span className={styles.countLabel}>Correct</span>
        </div>
        <div className={styles.countItem}>
          <span className={styles.countNum} style={{ color: '#c23b2a' }}>{wrong.length}</span>
          <span className={styles.countLabel}>Wrong</span>
        </div>
        <div className={styles.countItem}>
          <span className={styles.countNum} style={{ color: '#a06020' }}>{missing.length}</span>
          <span className={styles.countLabel}>Missing</span>
        </div>
        <div className={styles.countItem}>
          <span className={styles.countNum} style={{ color: '#7a3a9e' }}>{extra.length}</span>
          <span className={styles.countLabel}>Extra</span>
        </div>
      </div>

      {isPerfect ? (
        <div className={styles.successState}>
          <div className={styles.successIcon}>🏆</div>
          <p>Perfect Match! Your DFA matches the canonical DFA.</p>
        </div>
      ) : (
        <div className={styles.details}>
          {/* Feedback list */}
          {feedback.map((msg, i) => (
            <div key={i} className={styles.feedbackItem}>
              <span className={styles.feedbackDot} style={{
                background: msg.startsWith('Missing') ? '#a06020' :
                             msg.startsWith('Wrong')   ? '#c23b2a' :
                             msg.startsWith('Extra')   ? '#7a3a9e' : '#6b6760'
              }} />
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DFAFeedbackPanel;