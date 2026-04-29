import React, { useState } from 'react';

const API_BASE = '/api';

export default function Grammar({ sourceCode = '' }) {
  const [view, setView] = useState('home'); // home | auto | manual
  const [text,    setText]    = useState('E -> E + T | T\nT -> T * F | F\nF -> ( E ) | id');
  const [autoText, setAutoText] = useState('E -> E + T | T\nT -> T * F | F\nF -> ( E ) | id');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/grammar/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grammar: text }),
      });
      setResults(await res.json());
    } catch {
      setResults({ rules: [], issues: [{ type: 'error', rule: '*', message: 'Backend unreachable.' }] });
    } finally {
      setLoading(false);
    }
  };

  const autoGenerate = () => {
    const hasMul = sourceCode.includes('*');
    const hasAdd = sourceCode.includes('+');
    const hasParen = sourceCode.includes('(') && sourceCode.includes(')');
    const rules = [
      `E -> ${hasAdd ? 'E + T | ' : ''}T`,
      `T -> ${hasMul ? 'T * F | ' : ''}F`,
      `F -> ${hasParen ? '( E ) | ' : ''}id`,
    ];
    const generated = rules.join('\n');
    setAutoText(generated);
    setText(generated);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:16 }}>
      <div style={{ padding:16, background:'var(--surface-0)', borderRadius:10, border:'1px solid var(--border)', flexShrink:0 }}>
        {view === 'home' && (
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => { autoGenerate(); setView('auto'); }} style={{ padding:'8px 18px', background:'var(--surface-2)', color:'var(--text-primary)', border:'1px solid var(--border)', borderRadius:7, fontWeight:700, fontSize:13, cursor:'pointer' }}>
              Show Grammar
            </button>
            <button onClick={() => setView('manual')} style={{ padding:'8px 18px', background:'var(--accent)', color:'var(--text-inverse)', border:'none', borderRadius:7, fontWeight:700, fontSize:13, cursor:'pointer' }}>
              Manual Check
            </button>
          </div>
        )}
        {view === 'auto' && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <p style={{ fontSize:10, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700 }}>Auto Grammar</p>
              <button onClick={() => setView('home')} style={{ padding:'6px 12px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:7, fontSize:12, color:'var(--text-primary)', cursor:'pointer' }}>Back</button>
            </div>
            <textarea value={autoText} readOnly rows={5} spellCheck={false} style={{ width:'100%', background:'var(--surface-2)', color:'var(--text-primary)', fontFamily:'var(--font-code)', fontSize:13, padding:'10px 14px', borderRadius:7, border:'1px solid var(--border)', outline:'none', resize:'none', boxSizing:'border-box' }} />
          </>
        )}
        {view === 'manual' && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <p style={{ fontSize:10, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700 }}>Manual Grammar</p>
              <button onClick={() => setView('home')} style={{ padding:'6px 12px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:7, fontSize:12, color:'var(--text-primary)', cursor:'pointer' }}>Back</button>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={5}
              spellCheck={false}
              style={{ width:'100%', background:'var(--surface-2)', color:'var(--text-primary)', fontFamily:'var(--font-code)', fontSize:13, padding:'10px 14px', borderRadius:7, border:'1px solid var(--border)', outline:'none', resize:'none', boxSizing:'border-box' }}
              placeholder="E -> E + T | T"
            />
            <button onClick={check} disabled={loading}
              style={{ marginTop:10, padding:'8px 18px', background: loading ? 'var(--surface-3)' : 'var(--accent)', color:'var(--text-inverse)', border:'none', borderRadius:7, fontWeight:700, fontSize:13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Analyzing…' : 'Check Grammar'}
            </button>
          </>
        )}
      </div>

      {results && (
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:12 }}>
          {results.rules?.length > 0 && (
            <div>
              <p style={{ fontSize:10, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700, marginBottom:8 }}>Valid Rules</p>
              {results.rules.map((r, i) => (
                <div key={i} style={{ padding:'9px 14px', marginBottom:6, borderRadius:7, border:'1px solid var(--success)', background:'var(--success-light)', fontFamily:'var(--font-code)', fontSize:13, color:'var(--success)' }}>{r}</div>
              ))}
            </div>
          )}
          {results.issues?.length > 0 ? (
            <div>
              <p style={{ fontSize:10, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700, marginBottom:8 }}>Issues</p>
              {results.issues.map((issue, i) => (
                <div key={i} style={{ padding:'10px 14px', marginBottom:8, borderRadius:7, border:'1px solid var(--error)', background:'var(--error-light)' }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', color:'var(--error)', background:'rgba(194,59,42,0.15)', padding:'1px 7px', borderRadius:4 }}>{issue.type}</span>
                    <span style={{ fontFamily:'var(--font-code)', fontSize:11, color:'var(--text-secondary)' }}>{issue.rule}</span>
                  </div>
                  <p style={{ fontSize:12, color:'var(--text-secondary)' }}>{issue.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding:'16px', borderRadius:10, border:'1px solid var(--success)', background:'var(--success-light)', textAlign:'center', fontWeight:700, color:'var(--success)', fontSize:13 }}>
              ✓ Grammar is clean — no issues detected!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
