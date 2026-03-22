import React, { useRef, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Badge from '../ui/Badge';
import styles from './DiffViewer.module.css';

/**
 * Reconstruct mutated source lines from the original code + mutation log.
 * We apply each mutation to its target line using simple string replacement.
 */
function buildMutatedLines(originalLines, mutations) {
  // Clone lines
  const mutated = [...originalLines];

  (mutations || []).forEach(m => {
    if (!m.line || m.line < 1 || m.line > mutated.length) return;
    const idx  = m.line - 1;
    const line = mutated[idx];

    switch (m.type) {
      case 'OPERATOR_MUTATION':
      case 'LITERAL_SHIFT': {
        // Replace first occurrence of `before` with `after` on this line
        if (m.before && m.after !== undefined) {
          const pos = line.indexOf(m.before);
          if (pos !== -1) {
            mutated[idx] = line.slice(0, pos) + m.after + line.slice(pos + m.before.length);
          }
        }
        break;
      }
      case 'CONDITION_FLIP': {
        // Wrap the condition in !(...) — find the `(` after if/while
        const match = line.match(/\b(if|while)\s*\(/);
        if (match) {
          const parenStart = line.indexOf('(', match.index + match[0].length - 1);
          // Find matching close paren
          let depth = 0, closeIdx = -1;
          for (let i = parenStart; i < line.length; i++) {
            if (line[i] === '(') depth++;
            else if (line[i] === ')') { depth--; if (depth === 0) { closeIdx = i; break; } }
          }
          if (closeIdx !== -1) {
            const inner = line.slice(parenStart + 1, closeIdx);
            mutated[idx] =
              line.slice(0, parenStart + 1) + '!(' + inner + ')' + line.slice(closeIdx);
          }
        }
        break;
      }
      case 'RETURN_SWAP': {
        if (m.before && m.after !== undefined) {
          const pos = line.indexOf(m.before);
          if (pos !== -1) {
            mutated[idx] = line.slice(0, pos) + m.after + line.slice(pos + m.before.length);
          }
        }
        break;
      }
      case 'DEAD_CODE_INJECT': {
        // Insert `if(0){}` as a new line after the mutation line
        mutated.splice(idx + 1, 0, line.replace(/\S.*/, '').replace(/^(\s*).*/, '$1') + 'if(0){}');
        break;
      }
      default:
        break;
    }
  });

  return mutated;
}

const DiffViewer = ({ code, mutations }) => {
  const leftRef  = useRef(null);
  const rightRef = useRef(null);
  
  const [scrollPastTop, setScrollPastTop] = useState(false);

  const originalLines = useMemo(() => (code || '').split('\n'), [code]);
  const mutatedLines  = useMemo(
    () => buildMutatedLines(originalLines, mutations),
    [originalLines, mutations]
  );

  // Build a map of mutated line numbers (1-indexed) to mutation object for highlighting
  const mutationsMap = useMemo(() => {
    const map = new Map();
    (mutations || []).forEach(m => { if (m.line) map.set(m.line, m); });
    return map;
  }, [mutations]);

  const hasMutations = mutations && mutations.length > 0;

  const handleLeftScroll  = (e) => { 
    setScrollPastTop(e.target.scrollTop > 5);
    if (rightRef.current) rightRef.current.scrollTop = e.target.scrollTop; 
  };
  const handleRightScroll = (e) => { 
    setScrollPastTop(e.target.scrollTop > 5);
    if (leftRef.current)  leftRef.current.scrollTop  = e.target.scrollTop; 
  };

  const headerClass = `${styles.panelHeader} ${scrollPastTop ? styles.panelHeaderShadow : ''}`;

  return (
    <div className={styles.wrapper}>
      {/* ── LEFT: Original ─────────────────────────────────────────── */}
      <motion.div 
        className={styles.panel} 
        ref={leftRef} 
        onScroll={handleLeftScroll}
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className={headerClass}>ORIGINAL</div>

        {!hasMutations && (
          <div className={styles.banner}>
            No mutations applied — chaos intensity may be too low,
            or no mutable nodes were found.
          </div>
        )}

        {originalLines.map((line, idx) => {
          const lineNum   = idx + 1;
          const mutation  = mutationsMap.get(lineNum);
          const isMutated = !!mutation;
          return (
            <div
              key={idx}
              className={`${styles.line} ${isMutated ? styles.mutatedOrig : ''}`}
            >
              <span className={styles.lineNum}>{lineNum}</span>
              <span className={styles.lineContent}>
                {line || ' '}
                {isMutated && (
                  <div className={styles.centerBadge}>
                    <Badge mutationType={mutation.type} />
                  </div>
                )}
              </span>
            </div>
          );
        })}
      </motion.div>

      {/* ── RIGHT: Mutated ─────────────────────────────────────────── */}
      <motion.div 
        className={styles.panel} 
        ref={rightRef} 
        onScroll={handleRightScroll}
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className={headerClass}>MUTATED</div>

        {!hasMutations && (
          <div className={styles.banner}>
            No mutations applied — chaos intensity may be too low,
            or no mutable nodes were found.
          </div>
        )}

        {mutatedLines.map((line, idx) => {
          const lineNum   = idx + 1;
          // A line is "new" if it doesn't exist in original (injected dead code)
          const isInjected = idx >= originalLines.length;
          const isMutated  = mutationsMap.has(lineNum) || isInjected;
          return (
            <div
              key={idx}
              className={`${styles.line} ${isMutated ? styles.mutatedNew : ''}`}
            >
              <span className={styles.lineNum}>{lineNum}</span>
              <span className={styles.lineContent}>{line || ' '}</span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default DiffViewer;
