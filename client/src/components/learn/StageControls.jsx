import React from 'react';
import styles from './StageControls.module.css';

export default function StageControls({
  step, playing, speed, canBack, canNext,
  onBack, onPlay, onStep, onNext, onSpeedChange,
}) {
  return (
    <div className={styles.controls}>
      <button className={styles.btn} onClick={onBack} disabled={!canBack}>
        ← Back
      </button>

      <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onPlay}>
        {playing ? '⏸ Pause' : '▶ Play'}
      </button>

      <button className={styles.btn} onClick={onStep}>
        ⏭ Step
      </button>

      <div className={styles.speed}>
        <span className={styles.speedLabel}>Speed</span>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.5"
          value={speed}
          onChange={e => onSpeedChange(Number(e.target.value))}
          className={styles.slider}
        />
        <span className={styles.speedVal}>{speed}×</span>
      </div>

      <button
        className={`${styles.btn} ${styles.btnPrimary}`}
        onClick={onNext}
        disabled={!canNext}
      >
        Next →
      </button>
    </div>
  );
}
