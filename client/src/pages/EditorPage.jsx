import React, { useRef, useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompiler } from '../store/useCompilerStore';
import Badge from '../components/ui/Badge';
import styles from './EditorPage.module.css';

const MUTATION_TYPES = [
  { key: 'OPERATOR_MUTATION', label: 'Operator',   color: 'var(--mut-operator)'  },
  { key: 'CONDITION_FLIP',    label: 'Condition',  color: 'var(--mut-condition)' },
  { key: 'LITERAL_SHIFT',     label: 'Literal',    color: 'var(--mut-literal)'   },
  { key: 'RETURN_SWAP',       label: 'Return',     color: 'var(--mut-return)'    },
  { key: 'DEAD_CODE_INJECT',  label: 'Dead code',  color: 'var(--mut-deadcode)'  },
];

const SAMPLES = {
  custom: '',
  basic: `int add(int a, int b) {
    return a + b;
}

int main() {
    int x = 10;
    int y = 20;
    if (x < y) {
        x = x + 1;
    }
    return add(x, y);
}`,
  loop: `int factorial(int n) {
    int result = 1;
    for (int i = 1; i <= n; i = i + 1) {
        result = result * i;
    }
    return result;
}

int main() {
    return factorial(5);
}`,
  logic: `int max(int a, int b) {
    if (a > b) {
        return a;
    } else {
        return b;
    }
}

int main() {
    int x = max(10, 20);
    int y = max(30, 5);
    return max(x, y);
}`
};

export default function EditorPage() {
  const { state, dispatch } = useCompiler();
  const navigate = useNavigate();
  const [selectedSample, setSelectedSample] = useState('custom');

  // We need a unique key for the results card to trigger the slot machine animation on each success
  const resultsKey = React.useMemo(() => Date.now(), [state.mutations]);

  const handleCodeChange = (val) => {
    dispatch({ type: 'SET_CODE', payload: val });
    setSelectedSample('custom');
  };

  const handleSampleChange = (e) => {
    const val = e.target.value;
    setSelectedSample(val);
    if (val !== 'custom') {
      dispatch({ type: 'SET_CODE', payload: SAMPLES[val] });
    }
  };

  const handleOptions = (e) => {
    const { name, value } = e.target;
    dispatch({ type: 'SET_OPTIONS', payload: { [name]: value } });
  };

  const toggleMutationType = (key) => {
    const current = state.options.enabledMutations || MUTATION_TYPES.map(m => m.key);
    const next = current.includes(key)
      ? current.filter(k => k !== key)
      : [...current, key];
    dispatch({ type: 'SET_OPTIONS', payload: { enabledMutations: next } });
  };

  const enabledMutations = state.options.enabledMutations || MUTATION_TYPES.map(m => m.key);

  const getProgressAnims = () => {
    if (state.status === 'compiling') {
      return { width: ['0%', '80%', '90%'], backgroundColor: 'var(--accent)', opacity: 1, x: 0 };
    }
    if (state.status === 'success') {
      return { width: '100%', backgroundColor: ['var(--success)', 'var(--success)', 'var(--success-light)'], opacity: [1, 1, 0], x: 0 };
    }
    if (state.status === 'error') {
      return { width: '100%', backgroundColor: 'var(--error)', opacity: [1, 1, 0], x: [0, -4, 4, -2, 2, 0] };
    }
    return { width: '0%', opacity: 0 };
  };

  return (
    <div className={styles.container}>
      {/* Editor */}
      <motion.div
        className={styles.editorPaneWrap}
        initial={{ y: 20, opacity: 0 }}
        animate={{
          y: 0, opacity: 1,
          boxShadow: state.status === 'compiling'
            ? ['inset 0 0 0 0px var(--accent)', 'inset 0 0 0 1px var(--accent)', 'inset 0 0 0 0px var(--accent)']
            : 'inset 0 0 0 0px transparent'
        }}
        transition={{
          y: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.35 },
          boxShadow: { duration: 0.6 }
        }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}
      >
        <motion.div
          className={styles.progressLine}
          animate={getProgressAnims()}
          transition={{ duration: state.status === 'compiling' ? 2 : 0.4 }}
        />
        <div className={styles.editorPane}>
          <CodeMirror
            value={state.code}
            height="100%"
            extensions={[cpp()]}
            theme={oneDark}
            onChange={handleCodeChange}
            className={styles.codemirror}
            basicSetup={{ lineNumbers: true, foldGutter: false }}
          />
        </div>
      </motion.div>

      {/* Settings panel */}
      <motion.aside
        className={styles.panel}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
      >
        <div className={styles.panelSection}>
          <motion.div
            className={styles.sectionTitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Chaos settings
          </motion.div>

          <motion.div
            className={styles.field}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.04 }}
          >
            <label className={styles.label} htmlFor="sample-select">Load sample</label>
            <select
              id="sample-select"
              value={selectedSample}
              onChange={handleSampleChange}
              className={styles.select}
            >
              <option value="custom">Custom code</option>
              <option value="basic">Basic Arithmetic</option>
              <option value="loop">Factorial (Loop)</option>
              <option value="logic">Max (Logic / If-Else)</option>
            </select>
          </motion.div>

          <motion.div
            className={styles.field}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.08 }}
          >
            <label className={styles.label} htmlFor="seed-input">Random seed</label>
            <input
              id="seed-input"
              name="seed"
              type="text"
              placeholder="leave blank for random"
              value={state.options.seed}
              onChange={handleOptions}
              className={styles.input}
            />
          </motion.div>

          <motion.div
            className={styles.field}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.16 }}
          >
            <label className={styles.label} htmlFor="intensity-select">Intensity</label>
            <select
              id="intensity-select"
              name="intensity"
              value={state.options.intensity}
              onChange={handleOptions}
              className={styles.select}
            >
              <option value="low">Low — 1–2 mutations</option>
              <option value="medium">Medium — 3–5 mutations</option>
              <option value="high">High — aggressive</option>
            </select>
          </motion.div>
        </div>

        <div className={styles.divider} />

        <div className={styles.panelSection}>
          <div className={styles.sectionTitle}>Mutation types</div>
          <div className={styles.toggles}>
            {MUTATION_TYPES.map(({ key, label, color }, i) => {
              const active = enabledMutations.includes(key);
              return (
                <motion.button
                  key={key}
                  className={`${styles.toggle} ${active ? styles.toggleActive : ''}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={active ? { scale: [1.08, 1], opacity: 1, borderColor: color, color, backgroundColor: color + '18' } : { scale: 0.95, opacity: 1, borderColor: 'var(--surface-3)', color: 'var(--text-tertiary)', backgroundColor: 'transparent' }}
                  whileHover={{ scale: 1.05, boxShadow: `0 0 8px ${color}40` }}
                  transition={{ delay: 0.24 + i * 0.03, duration: 0.2 }}
                  onClick={() => toggleMutationType(key)}
                  layout
                >
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Last result card */}
        <AnimatePresence mode="popLayout">
          {state.status === 'success' && state.mutations?.length > 0 && (
            <motion.div
              key="results-wrap"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className={styles.divider} />
              <div className={styles.panelSection}>
                <div className={styles.sectionTitle}>Last compile</div>
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={resultsKey}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={styles.resultCard}
                  >
                    <div className={styles.resultMeta}>
                      {state.mutations.length} mutation{state.mutations.length !== 1 ? 's' : ''}
                      {state.options.seed ? ` · seed ${state.options.seed}` : ''}
                    </div>
                    {state.mutations.slice(0, 5).map((m, i) => (
                      <button
                        key={i}
                        className={styles.resultRow}
                        onClick={() => navigate('/app/log')}
                      >
                        <Badge mutationType={m.type} />
                        <span className={styles.resultLine}>line {m.line}</span>
                      </button>
                    ))}
                    {state.mutations.length > 5 && (
                      <div className={styles.resultMore}>
                        +{state.mutations.length - 5} more
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error display */}
        <AnimatePresence mode="popLayout">
          {state.status === 'error' && state.error && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className={styles.divider} />
              <div className={styles.panelSection}>
                <div className={styles.errorBox}>
                  <div className={styles.errorTitle}>Compilation error</div>
                  <pre className={styles.errorMsg}>{state.error}</pre>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </div>
  );
}
