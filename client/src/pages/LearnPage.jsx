import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Loader2, ArrowLeft, Wand2, Sparkles } from 'lucide-react';

import Tokens     from '../components/learner/Tokens';
import DFAGraph   from '../components/learner/DFAGraph';
import ParseSteps from '../components/learner/ParseSteps';
import Grammar    from '../components/learner/Grammar';
import ParseTree  from '../components/learner/ParseTree';
import Semantic   from '../components/learner/Semantic';
import CodeGen    from '../components/learner/CodeGen';

/* ── Tab definitions ─────────────────────────────────────── */
const TABS = [
  { id: 'Tokens',     label: 'Tokens',     icon: '[ ]', Component: Tokens },
  { id: 'Automata',   label: 'Automata',   icon: '◎',   Component: DFAGraph },
  { id: 'Parser',     label: 'Parser',     icon: '⊢',   Component: ParseSteps },
  { id: 'Grammar',    label: 'Grammar',    icon: 'G',   Component: Grammar },
  { id: 'ParseTree',  label: 'Parse Tree', icon: '🌿',  Component: ParseTree },
  { id: 'Semantic',   label: 'Semantic',   icon: 'Σ',   Component: Semantic },
  { id: 'CodeGen',    label: 'Code Gen',   icon: 't₁',  Component: CodeGen },
];

/* ── Default editor code (valid for both lexer and expression parser) ── */
const DEFAULT_CODE = `a + b * (c + d)`;

const API_BASE = '/api';

/* ── LearnPage ───────────────────────────────────────────── */
export default function LearnPage() {
  const [code,   setCode]   = useState(DEFAULT_CODE);
  const [active, setActive] = useState('Tokens');
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState(null);

  /* Pipeline results */
  const [tokens,   setTokens]   = useState([]);
  const [automata, setAutomata] = useState(null);
  const [steps,    setSteps]    = useState([]);
  const [tree,     setTree]     = useState(null);
  const [semantic, setSemantic] = useState(null);
  const [ir,       setIr]       = useState([]);
  const [dfaMode, setDfaMode] = useState(null); // 'show' | 'custom'
  const [automataView, setAutomataView] = useState('DFA'); // 'DFA' | 'NFA'
  const [automataHint, setAutomataHint] = useState(null);
  const [customAutomata, setCustomAutomata] = useState({
    states: [{ id: 0, isStart: true, isFinal: false }],
    transitions: [],
  });
  const [trace, setTrace] = useState([]);
  const [playStep, setPlayStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAutomataElement, setSelectedAutomataElement] = useState(null);
  const [automataAction, setAutomataAction] = useState(null);
  const [automataValidation, setAutomataValidation] = useState([]);
  const [pipelineWarning, setPipelineWarning] = useState(null);

  useEffect(() => {
    if (!isPlaying || playStep < 0 || playStep >= trace.length - 1) {
      if (playStep >= trace.length - 1 && trace.length > 0) setIsPlaying(false);
      return undefined;
    }
    const id = setTimeout(() => setPlayStep((prev) => prev + 1), 500);
    return () => clearTimeout(id);
  }, [isPlaying, playStep, trace.length]);

  const handleShowAutomata = async () => {
    setDfaMode('show');
    setAutomataView('DFA');
    if (!tokens.length) {
      setAutomataHint('Run Start Process first.');
      return;
    }
    const preferred = tokens.find((t) => t?.type && !['ERROR', 'PUNCTUATION'].includes(String(t.type).toUpperCase()));
    const tok = preferred || tokens[0];
    try {
      const res = await fetch(`${API_BASE}/automata/trace`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tokenType: tok.type, tokenValue: tok.value }),
      });
      if (res.ok) {
        const data = await res.json();
        setAutomata(data);
        setTrace(data.trace || []);
        setPlayStep(data.trace?.length ? 0 : -1);
        setIsPlaying(Boolean(data.trace?.length));
        setAutomataHint(`Auto-generated from ${tok.type}: "${tok.value}"`);
      }
    } catch (e) {
      console.warn('Automata trace failed', e);
    }
  };

  const handleRun = async () => {
    setBusy(true);
    setError(null);
    try {
      setPipelineWarning(null);
      const res = await fetch(`${API_BASE}/compile`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setTokens(data.tokens           ?? []);
      let learnerLoaded = false;
      try {
        const learnerRes = await fetch(`${API_BASE}/learner/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: code }),
        });
        if (learnerRes.ok) {
          const learner = await learnerRes.json();
          setSteps(learner.parse_steps ?? []);
          setTree(learner.parse_tree ?? null);
          setSemantic(learner.semantic ?? null);
          setIr(learner.intermediate_code ?? []);
          learnerLoaded = true;
        }
      } catch (_) {}
      if (!learnerLoaded) {
        setPipelineWarning('Parser/parse-tree/semantic/codegen could not be refreshed. Showing previous successful results.');
      }
      setAutomata(null);
      setDfaMode(null);
      setAutomataView('DFA');
      setAutomataHint(null);
      setTrace([]);
      setPlayStep(-1);
      setIsPlaying(false);
      setSelectedAutomataElement(null);
      setAutomataAction(null);
      setAutomataValidation([]);
    } catch (err) {
      setError(`Backend unreachable — make sure the backend is running (dev server or /api proxy). (${err.message})`);
    } finally {
      setBusy(false);
    }
  };

  /* Pass the right data to each tab */
  const handleRunSimulation = async (input) => {
    const validity = validateAutomata(customAutomata, automataView);
    setAutomataValidation(validity);
    if (validity.length) throw new Error(validity[0]);

    const payload = {
      mode: automataView,
      input,
      automaton: customAutomata,
    };
    const res = await fetch(`${API_BASE}/automata/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.errors?.join(', ') || data?.error || 'Simulation failed.');
    setAutomata({ [automataView.toLowerCase()]: data, trace: data.trace });
    setTrace(data.trace || []);
    setPlayStep(data.trace?.length ? 0 : -1);
    setIsPlaying(Boolean(data.trace?.length));
  };

  const panelProps = { tokens, automata, steps, tree, semantic, ir, dfaMode, onShowDfa: handleShowAutomata, onPickDfaMode: setDfaMode, automataView, onPickAutomataView: setAutomataView, automataHint, customAutomata, onCustomAutomataChange: setCustomAutomata, onRunSimulation: handleRunSimulation, trace, playStep, onPlayStep: setPlayStep, isPlaying, onTogglePlaying: setIsPlaying, code, selectedAutomataElement, onSelectAutomataElement: setSelectedAutomataElement, automataAction, onAutomataAction: setAutomataAction, onAutomataActionHandled: () => setAutomataAction(null), automataValidation };

  return (
    /* Absolute-fill so this works inside AppShell's overflow:hidden <main> */
    <div style={{
      position:  'absolute',
      inset:     0,
      display:   'flex',
      overflow:  'hidden',
      background: 'var(--surface-1)',
    }}>

      {/* ── LEFT: Editor pane ──────────────────── */}
      <div style={{
        width:        '42%',
        display:      'flex',
        flexDirection:'column',
        borderRight:  '1px solid var(--code-border)',
        background:   'var(--code-bg)',
        overflow:     'hidden',
        flexShrink:   0,
      }}>
        {/* Toolbar */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '12px 16px',
          borderBottom:   '1px solid var(--code-border)',
          background:     'var(--code-surface)',
          flexShrink:     0,
        }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--code-text)' }}>
              Learner Workspace
            </p>
            <p style={{ fontSize: 11, color: 'var(--code-muted)', marginTop: 2 }}>
              Write code → click <strong>Start Process</strong>
            </p>
          </div>

          <button
            onClick={handleRun}
            disabled={busy}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          6,
              padding:      '8px 18px',
              background:   busy ? 'var(--surface-3)' : 'var(--accent)',
              color:        'var(--text-inverse)',
              borderRadius: 8,
              fontFamily:   'var(--font-body)',
              fontWeight:   700,
              fontSize:     13,
              cursor:       busy ? 'not-allowed' : 'pointer',
              opacity:      busy ? 0.7 : 1,
              transition:   'background 0.15s',
              border:       'none',
            }}
          >
            {busy
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
              : <><Play size={14} style={{ fill: 'currentColor' }} /> Start Process</>
            }
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            padding:     '8px 16px',
            fontSize:    12,
            fontWeight:  500,
            background:  'var(--error-light)',
            color:       'var(--error)',
            borderBottom:'1px solid var(--error)',
            flexShrink:  0,
          }}>
            {error}
          </div>
        )}
        {pipelineWarning && (
          <div style={{ padding: '8px 16px', fontSize: 12, background: 'var(--warning-light)', color: 'var(--warning)', borderBottom: '1px solid var(--warning)', flexShrink: 0 }}>
            {pipelineWarning}
          </div>
        )}

        {/* Monaco */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <Editor
            height="100%"
            defaultLanguage="c"
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v || '')}
            options={{
              minimap:            { enabled: false },
              fontSize:           14,
              fontFamily:         'JetBrains Mono, monospace',
              padding:            { top: 16, bottom: 16 },
              lineNumbers:        'on',
              scrollBeyondLastLine: false,
              smoothScrolling:    true,
            }}
          />
        </div>
      </div>

      {/* ── RIGHT: Pipeline pane ───────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--surface-0)' }}>

        {/* Tab strip */}
        <div style={{
          display:      'flex',
          alignItems:   'flex-end',
          padding:      '12px 12px 0',
          gap:          4,
          borderBottom: '1px solid var(--border)',
          background:   'var(--surface-0)',
          overflowX:    'auto',
          flexShrink:   0,
        }}>
          {TABS.map((tab, idx) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                id={`learn-tab-${tab.id.toLowerCase()}`}
                onClick={() => setActive(tab.id)}
                style={{
                  display:     'flex',
                  alignItems:  'center',
                  gap:         6,
                  padding:     '8px 14px',
                  borderRadius:'8px 8px 0 0',
                  background:  isActive ? 'var(--surface-1)' : 'transparent',
                  color:       isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontFamily:  'var(--font-body)',
                  fontWeight:  isActive ? 700 : 500,
                  fontSize:    13,
                  borderTop:   isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  borderLeft:  'none',
                  borderRight: 'none',
                  borderBottom:'none',
                  cursor:      'pointer',
                  whiteSpace:  'nowrap',
                  marginBottom: isActive ? -1 : 0,
                  transition:  'color 0.15s, background 0.15s',
                }}
              >
                <span style={{ fontSize: 11, opacity: 0.6 }}>{tab.icon}</span>
                {tab.label}
                <span style={{
                  fontSize:   10,
                  fontWeight: 900,
                  padding:    '1px 5px',
                  borderRadius: 4,
                  background: isActive ? 'var(--accent-subtle)' : 'transparent',
                  color:      isActive ? 'var(--accent)' : 'transparent',
                }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Panel viewport */}
        <div style={{
          flex:     1,
          padding:  20,
          overflow: 'hidden',
          minHeight: 0,
          display:  'flex',
          flexDirection: 'column',
          background: 'var(--surface-1)',
        }}>
          <ActivePanel tab={active} props={panelProps} />
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* Renders the correct panel for the active tab */
function ActivePanel({ tab, props }) {
  const found = TABS.find((t) => t.id === tab);
  if (!found) return null;
  const { Component } = found;
  const { tokens, dfa, steps, tree, semantic, ir } = props;

  // Each component now receives data via props directly (no store)
  switch (tab) {
    case 'Tokens':    return <Tokens tokens={tokens} />;
    case 'Automata':  return <AutomataPanel automata={props.automata} dfaMode={props.dfaMode} onShowDfa={props.onShowDfa} onPickDfaMode={props.onPickDfaMode} view={props.automataView} onPickView={props.onPickAutomataView} hint={props.automataHint} customAutomata={props.customAutomata} onCustomAutomataChange={props.onCustomAutomataChange} onRunSimulation={props.onRunSimulation} trace={props.trace} playStep={props.playStep} onPlayStep={props.onPlayStep} isPlaying={props.isPlaying} onTogglePlaying={props.onTogglePlaying} selectedAutomataElement={props.selectedAutomataElement} onSelectAutomataElement={props.onSelectAutomataElement} automataAction={props.automataAction} onAutomataActionHandled={props.onAutomataActionHandled} onAutomataAction={props.onAutomataAction} automataValidation={props.automataValidation} />;
    case 'Parser':    return <ParseSteps parseSteps={steps} />;
    case 'Grammar':   return <Grammar sourceCode={props.code} />;
    case 'ParseTree': return <ParseTree parseTree={tree} />;
    case 'Semantic':  return <Semantic semantic={semantic} />;
    case 'CodeGen':   return <CodeGen intermediateCode={ir} />;
    default:          return null;
  }
}

function AutomataPanel({ automata, dfaMode, onShowDfa, onPickDfaMode, view, onPickView, hint, customAutomata, onCustomAutomataChange, onRunSimulation, trace = [], playStep = -1, onPlayStep = () => {}, isPlaying = false, onTogglePlaying = () => {}, selectedAutomataElement, onSelectAutomataElement, automataAction, onAutomataActionHandled, onAutomataAction, automataValidation = [] }) {
  if (!dfaMode) {
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:18 }}>
        <div style={{
          padding:18,
          background:'linear-gradient(120deg, rgba(255,122,59,0.12), rgba(255,122,59,0.02))',
          borderRadius:12,
          border:'1px solid rgba(255,122,59,0.35)'
        }}>
          <p style={{ fontSize:10, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700, marginBottom:8 }}>Automata Workspace</p>
          <p style={{ fontSize:14, color:'var(--text-primary)', fontWeight:700 }}>
            Choose your automata mode
          </p>
          <p style={{ marginTop:6, fontSize:13, color:'var(--text-secondary)' }}>
            Build one by hand, or visualize the NFA + DFA generated from your current code.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, flex:1 }}>
          <button
            onClick={() => onPickDfaMode('custom')}
            style={{
              padding:'20px', borderRadius:14, border:'1px solid var(--border-strong)', background:'var(--surface-0)',
              textAlign:'left', cursor:'pointer', position:'relative', overflow:'hidden',
              boxShadow:'0 10px 30px rgba(0,0,0,0.18)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(120deg, rgba(58,132,255,0.18), rgba(58,132,255,0))' }} />
            <div style={{ position:'relative' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(58,132,255,0.2)', border:'1px solid rgba(58,132,255,0.4)' }}>
                  <Wand2 size={18} color="var(--text-primary)" />
                </div>
                <p style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:800, color:'var(--text-tertiary)' }}>Make Your Own Automata</p>
              </div>
              <p style={{ marginTop:8, fontSize:14, color:'var(--text-primary)', fontWeight:700 }}>
                Manual builder
              </p>
          <p style={{ marginTop:6, fontSize:13, color:'var(--text-secondary)' }}>
                Define NFA/DFA states and transitions manually.
              </p>
            </div>
          </button>

          <button
            onClick={() => { onPickDfaMode('show'); onShowDfa(); }}
            style={{
              padding:'20px', borderRadius:14, border:'1px solid rgba(255,122,59,0.6)', background:'var(--surface-0)',
              textAlign:'left', cursor:'pointer', position:'relative', overflow:'hidden',
              boxShadow:'0 10px 30px rgba(255,122,59,0.16)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(120deg, rgba(255,122,59,0.2), rgba(255,122,59,0.02))' }} />
            <div style={{ position:'relative' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,122,59,0.2)', border:'1px solid rgba(255,122,59,0.5)' }}>
                  <Sparkles size={18} color="var(--text-primary)" />
                </div>
                <p style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:800, color:'var(--text-tertiary)' }}>Show Automata</p>
              </div>
              <p style={{ marginTop:8, fontSize:14, color:'var(--text-primary)', fontWeight:700 }}>
                Auto-generate from tokens
              </p>
              <p style={{ marginTop:6, fontSize:13, color:'var(--text-secondary)' }}>
                Generate NFA + DFA for a token and visualize the trace.
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (dfaMode === 'custom') {
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0, gap:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button
            onClick={() => onPickDfaMode(null)}
            style={{
              display:'flex', alignItems:'center', gap:8, padding:'6px 10px',
              borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-0)',
              fontSize:12, color:'var(--text-secondary)', cursor:'pointer'
            }}
          >
            <ArrowLeft size={14} /> Back to options
          </button>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <button
            onClick={() => onPickView(view === 'DFA' ? 'NFA' : 'DFA')}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', borderRadius:999, border:'1px solid var(--border)', background:'var(--surface-0)', fontSize:12, color:'var(--text-secondary)', cursor:'pointer' }}
          >
            {view === 'DFA' ? 'NFA Mode' : 'DFA Mode'}
          </button>
          <button
            onClick={() => onAutomataAction({ type: 'add_state', at: Date.now() })}
            style={{ padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-0)', color:'var(--text-primary)', fontSize:12, cursor:'pointer' }}
          >
            Add State
          </button>
          <button
            onClick={() => onAutomataAction({ type: 'delete_selected', at: Date.now() })}
            style={{ padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-0)', color:'var(--text-primary)', fontSize:12, cursor:'pointer' }}
          >
            Delete Selected
          </button>
          <button
            onClick={() => onAutomataAction({ type: 'auto_layout', at: Date.now() })}
            style={{ padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-0)', color:'var(--text-primary)', fontSize:12, cursor:'pointer' }}
          >
            Auto Layout
          </button>
          <button
            onClick={() => onAutomataAction({ type: 'clear', at: Date.now() })}
            style={{ padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-0)', color:'var(--text-primary)', fontSize:12, cursor:'pointer' }}
          >
            Clear
          </button>
          <button
            onClick={async () => {
              const input = window.prompt('Input string for simulation:', 'ab');
              if (input === null) return;
              try {
                await onRunSimulation(input);
              } catch (e) {
                window.alert(e.message);
              }
            }}
            style={{ padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--accent)', color:'var(--text-inverse)', fontSize:12, cursor:'pointer' }}
          >
            Run Simulation
          </button>
          {trace.length > 0 && (
            <>
              <button
                onClick={() => onTogglePlaying(!isPlaying)}
                style={{ padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-0)', color:'var(--text-primary)', fontSize:12, cursor:'pointer' }}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <input
                type="range"
                min="0"
                max={Math.max(trace.length - 1, 0)}
                value={Math.max(playStep, 0)}
                onChange={(e) => onPlayStep(Number(e.target.value))}
              />
            </>
          )}
        </div>
        {selectedAutomataElement && (
          <p style={{ margin:0, fontSize:12, color:'var(--text-tertiary)' }}>
            Selected: {selectedAutomataElement.kind} `{selectedAutomataElement.id}`
          </p>
        )}
        {automataValidation.length > 0 && (
          <div style={{ border:'1px solid var(--error)', background:'var(--error-light)', borderRadius:8, padding:'8px 10px', fontSize:12, color:'var(--error)' }}>
            {automataValidation[0]}
          </div>
        )}
        <div style={{ flex:1, minHeight:0 }}>
          <DFAGraph
            dfa={automata?.[view.toLowerCase()] || customAutomata}
            editable
            mode={view}
            onAutomataChange={onCustomAutomataChange}
            trace={trace}
            playbackStep={playStep}
            onSelectionChange={onSelectAutomataElement}
            selectedElement={selectedAutomataElement}
            actionRequest={automataAction}
            onActionHandled={onAutomataActionHandled}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0, gap:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button
          onClick={() => onPickDfaMode(null)}
          style={{
            display:'flex', alignItems:'center', gap:8, padding:'6px 10px',
            borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-0)',
            fontSize:12, color:'var(--text-secondary)', cursor:'pointer'
          }}
        >
          <ArrowLeft size={14} /> Back to options
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {hint && (
            <span style={{ fontSize:12, color:'var(--text-tertiary)' }}>{hint}</span>
          )}
          <button
            onClick={() => onPickView(view === 'DFA' ? 'NFA' : 'DFA')}
            style={{
              display:'flex', alignItems:'center', gap:6, padding:'6px 10px',
              borderRadius:999, border:'1px solid var(--border)', background:'var(--surface-0)',
              fontSize:12, color:'var(--text-secondary)', cursor:'pointer'
            }}
          >
            {view === 'DFA' ? 'Switch to NFA' : 'Switch to DFA'}
          </button>
        </div>
      </div>

      {!automata ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10, color:'var(--text-tertiary)' }}>
          <div style={{ fontSize:36, opacity:0.25 }}>◎</div>
          <p style={{ fontSize:13 }}>Click Auto-generate from tokens.</p>
        </div>
      ) : (
        <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
          <p style={{ fontSize:10, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700, marginBottom:8 }}>{view}</p>
          <div style={{ flex:1, minHeight:0, height:'100%' }}>
            <DFAGraph dfa={view === 'DFA' ? automata?.dfa : automata?.nfa} trace={automata?.trace || []} playbackStep={playStep} />
          </div>
        </div>
      )}
    </div>
  );
}

function validateAutomata(automata, mode) {
  const errors = [];
  if (!automata?.states?.length) errors.push('Add at least one state.');
  const startStates = (automata?.states || []).filter((s) => s.isStart);
  if (startStates.length !== 1) errors.push('Automata must have exactly one start state.');
  const ids = new Set((automata?.states || []).map((s) => s.id));
  for (const t of automata?.transitions || []) {
    if (!ids.has(t.from) || !ids.has(t.to)) errors.push(`Transition ${t.from} -> ${t.to} uses unknown states.`);
    if (!t.symbol) errors.push('Transition symbol cannot be empty.');
    if (mode === 'DFA' && t.symbol === 'ε') errors.push('DFA mode does not allow epsilon transitions.');
  }
  if (mode === 'DFA') {
    const seen = new Set();
    for (const t of automata?.transitions || []) {
      const key = `${t.from}:${t.symbol}`;
      if (seen.has(key)) errors.push(`DFA has duplicate symbol "${t.symbol}" from state ${t.from}.`);
      seen.add(key);
    }
  }
  return errors;
}
