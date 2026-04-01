import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompiler } from '../../store/useCompilerStore';
import styles from './DiffViewer.module.css';

const HINTS = {
  OPERATOR_MUTATION: "If tests pass after this, they don't assert on the computed value.",
  CONDITION_FLIP: "Tests pass? Your condition branch is not covered.",
  LITERAL_SHIFT: "Tests pass? The exact literal value is never verified.",
  STATEMENT_DELETION: "High impact — if tests pass, the statement was doing nothing testable.",
  DEAD_CODE_INJECT: "Low impact — dead code never runs. Coverage % may drop.",
  VARIABLE_SWAP: "Operand order not tested — commutative assumption untested.",
  OFF_BY_ONE: "Boundary condition not covered by tests.",
  NULL_INJECTION: "Return value of call is not being checked.",
  BOOLEAN_INVERSION: "Both branches of this condition are not tested.",
  LOOP_BOUND_CHANGE: "Loop termination condition is not asserted."
};

function getHint(type) {
  return HINTS[type] || "Consider how your test suite reacts to this change.";
}

function getImpact(score) {
  return score >= 8 ? 'high' : score >= 5 ? 'medium' : 'low';
}

function getImpactBadgeClass(score) {
  const i = getImpact(score);
  if (i === 'high') return styles.badgeDel;
  if (i === 'medium') return styles.badgeMut;
  return styles.badgeSafe;
}

function applyMutation(orig, m) {
  if (m.type === 'DEAD_CODE_INJECT') return orig; // doesn't mutate in place
  if (m.type === 'STATEMENT_DELETION') return ''; // doesn't mutate in place

  let mutStr = orig;
  if (m.type === 'CONDITION_FLIP') {
    const match = orig.match(/\b(if|while)\s*\(/);
    if (match) {
      const parenStart = orig.indexOf('(', match.index + match[0].length - 1);
      let depth = 0, closeIdx = -1;
      for (let j = parenStart; j < orig.length; j++) {
        if (orig[j] === '(') depth++;
        else if (orig[j] === ')') {
          depth--;
          if (depth === 0) { closeIdx = j; break; }
        }
      }
      if (closeIdx !== -1) {
        const inner = orig.slice(parenStart + 1, closeIdx);
        mutStr = orig.slice(0, parenStart + 1) + '!(' + inner + ')' + orig.slice(closeIdx);
      }
    }
  } else if (m.before && m.after !== undefined) {
    mutStr = orig.replace(m.before, m.after);
  }
  return mutStr;
}

export default function DiffViewer() {
  const { state } = useCompiler();
  const rawCode = state.code || '';
  const rawMutations = state.mutations || [];

  const mutations = useMemo(() => {
    return rawMutations.map((m, i) => ({
      ...m,
      id: m.id || `m${i}`,
      score: typeof m.score === 'number' ? m.score : Math.floor(Math.random() * 5) + 5,
      pass: m.pass !== undefined ? m.pass : true,
      description: m.description || `Applied ${m.type} mutation.`
    }));
  }, [rawMutations]);

  const { leftLines, rightLines } = useMemo(() => {
    const origLines = rawCode.split('\n');
    const left = [];
    const right = [];
    let rLineN = 1;

    const mutByLine = {};
    mutations.forEach(m => {
      if (!mutByLine[m.line]) mutByLine[m.line] = [];
      mutByLine[m.line].push(m);
    });

    for (let i = 0; i < origLines.length; i++) {
      const origN = i + 1;
      const origStr = origLines[i];
      const ms = mutByLine[origN];

      if (!ms || ms.length === 0) {
        left.push({ n: origN, t: 'normal', c: origStr, mid: null });
        right.push({ n: rLineN++, t: 'normal', c: origStr, mid: null });
        continue;
      }

      const m = ms[0];

      if (m.type === 'DEAD_CODE_INJECT') {
        left.push({ n: origN, t: 'normal', c: origStr, mid: null });
        right.push({ n: rLineN++, t: 'normal', c: origStr, mid: null });

        const indent = origStr.match(/^\s*/)[0];
        left.push({ n: '', t: 'empty', c: '', mid: m.id });
        right.push({ n: rLineN++, t: 'ins', c: indent + 'if(0){}', mid: m.id });
      } else if (m.type === 'STATEMENT_DELETION') {
        left.push({ n: origN, t: 'del', c: origStr, mid: m.id });
        right.push({ n: '', t: 'empty', c: '', mid: m.id });
      } else {
        left.push({ n: origN, t: 'del', c: origStr, mid: m.id });
        const mutStr = applyMutation(origStr, m);
        right.push({ n: rLineN++, t: 'mut', c: mutStr, mid: m.id });
      }
    }
    return { leftLines: left, rightLines: right };
  }, [rawCode, mutations]);

  const delCount = leftLines.filter(l => l.t === 'del').length;
  const insCount = rightLines.filter(l => l.t === 'mut' || l.t === 'ins').length;

  const [activeMutId, setActiveMutId] = useState(null);
  const activeMutIdx = activeMutId ? mutations.findIndex(m => m.id === activeMutId) : -1;
  const activeMut = activeMutIdx >= 0 ? mutations[activeMutIdx] : null;

  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const scrollLock = useRef(false);

  const handleScroll = (e, source) => {
    if (scrollLock.current) return;
    scrollLock.current = true;
    
    if (source === 'left' && rightScrollRef.current) {
      rightScrollRef.current.scrollTop = e.target.scrollTop;
    } else if (source === 'right' && leftScrollRef.current) {
      leftScrollRef.current.scrollTop = e.target.scrollTop;
    }
    
    // Release lock on next frame
    requestAnimationFrame(() => {
      scrollLock.current = false;
    });
  };

  const jumpMut = (dir) => {
    if (mutations.length === 0) return;
    let nextIdx = 0;
    if (activeMutIdx !== -1) {
      nextIdx = (activeMutIdx + dir + mutations.length) % mutations.length;
    }
    const mut = mutations[nextIdx];
    showMut(mut.id);
  };

  const showMut = (id) => {
    setActiveMutId(id);
    // Scroll the first line of the active mutation into view gently
    setTimeout(() => {
      const rowEl = document.getElementById(`diff-row-${id}`);
      if (rowEl && leftScrollRef.current) {
        // Find offset relative to scroll container
        const containerTop = leftScrollRef.current.getBoundingClientRect().top;
        const rowTop = rowEl.getBoundingClientRect().top;
        const relativeTop = rowTop - containerTop + leftScrollRef.current.scrollTop;
        
        leftScrollRef.current.scrollTo({
          top: relativeTop - leftScrollRef.current.clientHeight / 2 + 15,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  const closePanel = () => setActiveMutId(null);

  const renderLine = (l, i, side) => {
    const isSelected = !!activeMutId && l.mid === activeMutId;
    const isRight = side === 'right';
    let lineClass = `${styles.line}`;
    if (l.t === 'del') lineClass += ` ${styles.lineDel}`;
    if (l.t === 'ins') lineClass += ` ${styles.lineIns}`;
    if (l.t === 'mut') lineClass += ` ${styles.lineMut}`;
    if (l.t === 'empty') lineClass += ` ${styles.lineEmpty}`;
    if (isSelected) lineClass += ` ${styles.lineSelected}`;

    // Tag goes onto the mutated code (right side) OR if right side is empty, on the left side
    const showTag = l.mid && ( (isRight && l.t !== 'empty') || (!isRight && l.t === 'del' && mutations.find(m => m.id === l.mid)?.type === 'STATEMENT_DELETION') );
    const mutData = showTag ? mutations.find(m => m.id === l.mid) : null;

    return (
      <div key={i} className={lineClass} id={isRight ? undefined : (l.mid ? `diff-row-${l.mid}` : undefined)}>
        <span className={styles.ln}>{l.n}</span>
        <span className={styles.lc}>
          <span className={styles.lcText}>{l.c}</span>
          {showTag && mutData && (
            <span 
              className={styles.mutTag} 
              onClick={(e) => { e.stopPropagation(); showMut(mutData.id); }}
            >
              {mutData.type}
            </span>
          )}
        </span>
      </div>
    );
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.diffHeader}>
        <div className={styles.dhStat}>
          <span className={`${styles.badge} ${styles.badgeMut}`}>{mutations.length} mutations</span>
          <span className={`${styles.badge} ${styles.badgeDel}`}>{delCount} deleted</span>
          <span className={`${styles.badge} ${styles.badgeIns}`}>{insCount} inserted</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span className={styles.hintLabel}>Click any mutation tag to explain it</span>
          <button className={styles.navBtn} onClick={() => jumpMut(1)}>Next mutation</button>
        </div>
      </div>

      <div className={styles.diffCols}>
        <div className={styles.colHead}>Original</div>
        <div className={`${styles.colHead} ${styles.right}`}>Mutated</div>
      </div>

      <div className={styles.diffBody}>
        <div className={styles.colCode} ref={leftScrollRef} onScroll={(e) => handleScroll(e, 'left')} style={{ overflowY: 'auto' }}>
          {leftLines.map((l, i) => renderLine(l, i, 'left'))}
        </div>
        <div className={`${styles.colCode} ${styles.right}`} ref={rightScrollRef} onScroll={(e) => handleScroll(e, 'right')} style={{ overflowY: 'auto' }}>
          {rightLines.map((l, i) => renderLine(l, i, 'right'))}
        </div>
      </div>

      <AnimatePresence>
        {activeMut && (
          <motion.div 
            className={styles.explainPanelWrap}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className={styles.explainPanelInner}>
              <div className={styles.epTitle}>
                <span className={`${styles.badge} ${getImpactBadgeClass(activeMut.score)}`}>
                  {activeMut.type}
                </span>
                <span>line {activeMut.line}</span>
              </div>
              
              <div className={styles.epGrid}>
                <div className={styles.epCard}>
                  <div className={styles.epCardLabel}>Before</div>
                  <div className={styles.epCardVal}>{activeMut.before || '(nothing)'}</div>
                </div>
                <div className={styles.epCard}>
                  <div className={styles.epCardLabel}>After</div>
                  <div className={`${styles.epCardVal} ${styles.danger}`}>{activeMut.after || '(deleted)'}</div>
                </div>
                <div className={styles.epCard}>
                  <div className={styles.epCardLabel}>Impact score</div>
                  <div className={`${styles.epCardVal} ${activeMut.score >= 8 ? styles.danger : (activeMut.score <= 4 ? styles.success : '')}`}>
                    {activeMut.score} / 10
                  </div>
                </div>
                <div className={styles.epCard}>
                  <div className={styles.epCardLabel}>Safe mode</div>
                  <div className={`${styles.epCardVal} ${activeMut.pass !== false ? styles.success : styles.danger}`}>
                    {activeMut.pass !== false ? 'allowed' : 'blocked'}
                  </div>
                </div>
                
                <div className={styles.epDesc}>{activeMut.description}</div>
                <div className={styles.epHint}>{getHint(activeMut.type)}</div>
              </div>
            </div>
            
            <div className={styles.navBar}>
              <button className={styles.navBtn} onClick={() => jumpMut(-1)}>Prev</button>
              <button className={styles.navBtn} onClick={() => jumpMut(1)}>Next</button>
              <span className={styles.navInfo}>
                mutation {activeMutIdx + 1} / {mutations.length}
              </span>
              <button className={styles.navBtn} style={{ marginLeft: '8px' }} onClick={closePanel}>
                Close explanation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}