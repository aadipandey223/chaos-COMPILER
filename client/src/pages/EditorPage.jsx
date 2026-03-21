import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { useNavigate } from 'react-router-dom';
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

export default function EditorPage() {
  const { state, dispatch } = useCompiler();
  const navigate = useNavigate();

  const handleCodeChange = (val) => dispatch({ type: 'SET_CODE', payload: val });

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

  return (
    <div className={styles.container}>
      {/* Editor */}
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

      {/* Settings panel */}
      <aside className={styles.panel}>
        <div className={styles.panelSection}>
          <div className={styles.sectionTitle}>Chaos settings</div>

          <div className={styles.field}>
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
          </div>

          <div className={styles.field}>
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
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.panelSection}>
          <div className={styles.sectionTitle}>Mutation types</div>
          <div className={styles.toggles}>
            {MUTATION_TYPES.map(({ key, label, color }) => {
              const active = enabledMutations.includes(key);
              return (
                <button
                  key={key}
                  className={`${styles.toggle} ${active ? styles.toggleActive : ''}`}
                  style={active ? { borderColor: color, color, background: color + '18' } : {}}
                  onClick={() => toggleMutationType(key)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Last result card */}
        {state.status === 'success' && state.mutations?.length > 0 && (
          <>
            <div className={styles.divider} />
            <div className={styles.panelSection}>
              <div className={styles.sectionTitle}>Last compile</div>
              <div className={styles.resultCard}>
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
              </div>
            </div>
          </>
        )}

        {/* Error display */}
        {state.status === 'error' && state.error && (
          <>
            <div className={styles.divider} />
            <div className={styles.panelSection}>
              <div className={styles.errorBox}>
                <div className={styles.errorTitle}>Compilation error</div>
                <pre className={styles.errorMsg}>{state.error}</pre>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
