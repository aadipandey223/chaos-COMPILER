import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOKENS, TOKEN_DFA_STATE, SOURCE } from '../../../utils/tutorialData';
import { DFAProvider, useDFA } from '../../../store/useDFAStore';
import { generateDFA } from '../../../utils/dfaGenerator';
import { validateDFA } from '../../../utils/dfaValidator';
import DFACanvas from '../../dfa/DFACanvas';
import DFAToolbar from '../../dfa/DFAToolbar';
import DFAFeedbackPanel from '../../dfa/DFAFeedbackPanel';
import styles from './LexerStage.module.css';

const TOKEN_COLORS = {
  KEYWORD: 'var(--accent)',
  IDENT:   'var(--info)',
  NUMBER:  'var(--node-literal)',
  default: 'var(--text-tertiary)',
};

function tokenColor(type) {
  return TOKEN_COLORS[type] || TOKEN_COLORS.default;
}

/* ── Main inner component (needs DFA context) ──────────────────────── */
function LexerStageInner({ step, speed, playing, onStepComplete }) {
  const maxStep = TOKENS.length - 1;
  const currentStep = Math.min(step, maxStep);
  const token = TOKENS[currentStep];
  const activeState = token ? TOKEN_DFA_STATE[token.type] || 'START' : 'START';
  const visibleTokens = TOKENS.slice(0, currentStep + 1);
  const streamRef = useRef(null);

  const { state: dfaState, dispatch: dfaDispatch } = useDFA();
  const { mode, userGraph, autoGraph, validation } = dfaState;

  // Which graph to display
  const displayNodes = mode === 'auto' ? autoGraph.nodes : userGraph.nodes;
  const displayEdges = mode === 'auto' ? autoGraph.edges : userGraph.edges;

  // Auto-play
  useEffect(() => {
    if (!playing || currentStep >= maxStep) return;
    const delay = 800 / speed;
    const t = setTimeout(onStepComplete, delay);
    return () => clearTimeout(t);
  }, [playing, currentStep, speed, onStepComplete, maxStep]);

  // Auto-scroll token stream
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollLeft = streamRef.current.scrollWidth;
    }
  }, [visibleTokens.length]);

  // On mount: auto-generate DFA from tutorial source
  useEffect(() => {
    (async () => {
      try {
        dfaDispatch({ type: 'SET_LOADING', payload: true });
        const result = await generateDFA(SOURCE);
        dfaDispatch({
          type: 'SET_AUTO_GRAPH',
          payload: { nodes: result.states, edges: result.transitions },
        });
      } catch (err) {
        dfaDispatch({ type: 'SET_ERROR', payload: err.message });
      } finally {
        dfaDispatch({ type: 'SET_LOADING', payload: false });
      }
    })();
  }, [dfaDispatch]);

  // Re-validate on every user/auto graph change
  useEffect(() => {
    if (autoGraph.nodes.length > 0) {
      const result = validateDFA(userGraph, autoGraph);
      dfaDispatch({ type: 'SET_VALIDATION', payload: result });
    }
  }, [userGraph, autoGraph, dfaDispatch]);

  // Canvas callbacks
  const handleAddNode = useCallback((x, y, label) => {
    dfaDispatch({
      type: 'ADD_NODE',
      payload: { id: 'n' + Date.now(), label, x, y, isStart: false, isAccept: false },
    });
  }, [dfaDispatch]);

  const handleMoveNode = useCallback((id, x, y) => {
    dfaDispatch({ type: 'UPDATE_NODE', payload: { id, x, y } });
  }, [dfaDispatch]);

  const handleDeleteNode = useCallback((id) => {
    dfaDispatch({ type: 'DELETE_NODE', payload: id });
    dfaDispatch({ type: 'SET_SELECTED_NODE', payload: null });
  }, [dfaDispatch]);

  const handleRenameNode = useCallback((id, label) => {
    dfaDispatch({ type: 'UPDATE_NODE', payload: { id, label } });
  }, [dfaDispatch]);

  const handleUpdateNode = useCallback((id, changes) => {
    dfaDispatch({ type: 'UPDATE_NODE', payload: { id, ...changes } });
  }, [dfaDispatch]);

  const handleAddEdge = useCallback((fromId, toId, label) => {
    dfaDispatch({
      type: 'ADD_EDGE',
      payload: { id: 'e' + Date.now(), from: fromId, to: toId, label },
    });
  }, [dfaDispatch]);

  const handleUpdateEdge = useCallback((edgeId, label) => {
    dfaDispatch({ type: 'UPDATE_EDGE', payload: { id: edgeId, label } });
  }, [dfaDispatch]);

  const handleDeleteEdge = useCallback((id) => {
    dfaDispatch({ type: 'DELETE_EDGE', payload: id });
    dfaDispatch({ type: 'SET_SELECTED_EDGE', payload: null });
  }, [dfaDispatch]);

  const handleSelectNode = useCallback((id) => {
    dfaDispatch({ type: 'SET_SELECTED_NODE', payload: id });
  }, [dfaDispatch]);

  const handleSelectEdge = useCallback((id) => {
    dfaDispatch({ type: 'SET_SELECTED_EDGE', payload: id });
  }, [dfaDispatch]);

  // Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        dfaDispatch({ type: 'UNDO' });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        dfaDispatch({ type: 'REDO' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dfaDispatch]);

  const sourceLines = SOURCE.split('\n');

  return (
    <div className={styles.stage}>
      <div className={styles.panels}>
        {/* Source code panel */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Source code</div>
          <div className={styles.sourceCode}>
            {sourceLines.map((line, li) => {
              const lineNum = li + 1;
              const isActive = token && token.line === lineNum;
              return (
                <div key={li} className={`${styles.sourceLine} ${isActive ? styles.sourceLineActive : ''}`}>
                  <span className={styles.sourceLineNum}>{lineNum}</span>
                  <span className={styles.sourceLineText}>{line || ' '}</span>
                </div>
              );
            })}
          </div>
          {token && (
            <div className={styles.currentChar}>
              Current token: <span style={{ color: tokenColor(token.type), fontFamily: 'var(--font-code)' }}>
                {token.value || 'EOF'}
              </span>
              <span className={styles.tokenTypeBadge} style={{ color: tokenColor(token.type) }}>
                {token.type}
              </span>
            </div>
          )}
        </div>

        {/* DFA Editor panel */}
        <div className={styles.panel} style={{ flex: 2 }}>
          <DFAToolbar />
          <div className={styles.dfaEditorArea}>
            <DFACanvas
              mode={mode}
              nodes={displayNodes}
              edges={displayEdges}
              validation={validation}
              selectedNode={dfaState.selectedNode}
              selectedEdge={dfaState.selectedEdge}
              onAddNode={handleAddNode}
              onMoveNode={handleMoveNode}
              onDeleteNode={handleDeleteNode}
              onRenameNode={handleRenameNode}
              onUpdateNode={handleUpdateNode}
              onAddEdge={handleAddEdge}
              onUpdateEdge={handleUpdateEdge}
              onDeleteEdge={handleDeleteEdge}
              onSelectNode={handleSelectNode}
              onSelectEdge={handleSelectEdge}
            />
            <DFAFeedbackPanel />
          </div>
          <div className={styles.dfaNote}>
            Active state: <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-code)' }}>{activeState}</strong>
            {mode === 'user' && <span className={styles.hint}> · Double-click canvas to add states (use name above) · Shift+drag to draw edges</span>}
          </div>
        </div>
      </div>

      {/* Token stream */}
      <div className={styles.streamWrap}>
        <div className={styles.streamLabel}>Token stream</div>
        <div className={styles.stream} ref={streamRef}>
          <AnimatePresence>
            {visibleTokens.map((t, i) => (
              <motion.span
                key={i}
                className={styles.tokenPill}
                style={{ color: tokenColor(t.type), borderColor: tokenColor(t.type) + '44', background: tokenColor(t.type) + '18' }}
                initial={{ opacity: 0, scale: 0.7, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <span className={styles.pillValue}>{t.value || 'EOF'}</span>
                <span className={styles.pillType}>{t.type}</span>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ── Wrapper with DFAProvider ──────────────────────────────────────── */
export default function LexerStage(props) {
  return (
    <DFAProvider>
      <LexerStageInner {...props} />
    </DFAProvider>
  );
}
