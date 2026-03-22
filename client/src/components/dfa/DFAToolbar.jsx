import React from 'react';
import { useDFA } from '../../store/useDFAStore';
import { generateDFA } from '../../utils/dfaGenerator';
import styles from './DFAToolbar.module.css';
import { SOURCE } from '../../utils/tutorialData';

const DFAToolbar = ({ svgRef }) => {
  const { state, dispatch } = useDFA();
  const { mode, userGraph, validation, isLoading } = state;

  const handleAutoGenerate = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await generateDFA(SOURCE);
      dispatch({ type: 'SET_AUTO_GRAPH', payload: { nodes: result.states, edges: result.transitions } });
    } catch (err) {
      console.error(err);
      alert('Failed to generate DFA ' + err.message);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userGraph, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "dfa.json");
    dl.click();
  };

  const scoreColor = validation.score >= 80 ? 'green' : validation.score >= 50 ? 'amber' : 'red';

  return (
    <div className={styles.toolbar}>
      <div className={styles.modeToggle}>
        <button className={`${styles.modeBtn} ${mode === 'user' ? styles.active : ''}`} onClick={() => dispatch({ type: 'SET_MODE', payload: 'user' })}>My DFA</button>
        <button className={`${styles.modeBtn} ${mode === 'auto' ? styles.active : ''}`} onClick={() => dispatch({ type: 'SET_MODE', payload: 'auto' })}>Auto DFA</button>
        <button className={`${styles.modeBtn} ${mode === 'compare' ? styles.active : ''}`} onClick={() => dispatch({ type: 'SET_MODE', payload: 'compare' })}>Compare</button>
      </div>

      <div className={styles.centerActions}>
        <button className={styles.actionBtn} disabled={mode !== 'user'} onClick={() => {
          dispatch({ type: 'ADD_NODE', payload: { id: 'n'+Date.now(), label: 'New', x: 200, y: 200, isStart: false, isAccept: false }});
        }}>+ State</button>
        <button className={styles.actionBtn} disabled={mode !== 'user'} onClick={() => {
          // crude auto layout horizontally
          const g = { ...userGraph };
          g.nodes.forEach((n, i) => { n.x = 100 + i*150; n.y = 200; });
          // triggers update
          g.nodes.forEach(n => dispatch({ type: 'UPDATE_NODE', payload: n }));
        }}>↺ Auto layout</button>
        <button className={styles.actionBtn} disabled={mode !== 'user'} onClick={() => {
          if (window.confirm("Clear DFA?")) dispatch({ type: 'CLEAR_USER_GRAPH' });
        }}>Clear</button>
        <button className={styles.actionBtn} disabled={mode !== 'user'} onClick={() => dispatch({ type: 'UNDO' })}>Undo ↺</button>
        <button className={styles.actionBtn} disabled={mode !== 'user'} onClick={() => dispatch({ type: 'REDO' })}>Redo ↻</button>
      </div>

      <div className={styles.rightSide}>
        {mode === 'compare' && (
          <div className={`${styles.scorePill} ${styles[scoreColor]}`}>
            Score: {validation.score}/100
          </div>
        )}
        <button className={styles.actionBtn} onClick={handleAutoGenerate} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Auto-generate DFA'}
        </button>
        <button className={styles.actionBtn} onClick={handleExportJSON}>Export JSON</button>
      </div>
    </div>
  );
};

export default DFAToolbar;