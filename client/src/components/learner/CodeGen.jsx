import React, { useState } from 'react';
import { ClipboardCopy, ChevronDown, ChevronRight, Check } from 'lucide-react';

export default function CodeGen({ intermediateCode = [] }) {
  const [expanded, setExpanded] = useState({});
  const [copied, setCopied]     = useState(false);

  const toggle = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  const copyAll = () => {
    navigator.clipboard.writeText(intermediateCode.map(s => s.instruction).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!intermediateCode.length) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, color:'var(--text-tertiary)' }}>
        <div style={{ fontSize:32, opacity:0.25, fontFamily:'var(--font-code)' }}>t₁ = ?</div>
        <p style={{ fontSize:13 }}>No code generated yet — press <strong style={{color:'var(--accent)'}}>Start Process</strong></p>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <p style={{ fontSize:10, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700 }}>3-Address Instructions</p>
        <button onClick={copyAll}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:7, fontSize:12, fontWeight:700, color:'var(--text-primary)', cursor:'pointer', transition:'background 0.15s' }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--surface-3)'}
          onMouseLeave={e=>e.currentTarget.style.background='var(--surface-2)'}
        >
          {copied ? <Check size={13} color="var(--success)" /> : <ClipboardCopy size={13} />}
          {copied ? 'Copied!' : 'Copy All'}
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
        {intermediateCode.map((step, i) => (
          <div key={i} style={{ borderRadius:10, border:'1px solid var(--border)', overflow:'hidden', background:'var(--surface-0)' }}>
            <div
              onClick={() => toggle(i)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', cursor:'pointer', transition:'background 0.1s' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <span style={{ color:'var(--text-tertiary)', fontFamily:'var(--font-code)', fontSize:11, width:20, textAlign:'right', flexShrink:0 }}>{step.step_num}</span>
              <code style={{ flex:1, fontFamily:'var(--font-code)', fontSize:13, color:'var(--success)' }}>{step.instruction}</code>
              {step.explanation && (expanded[i] ? <ChevronDown size={15} color="var(--text-tertiary)" /> : <ChevronRight size={15} color="var(--text-tertiary)" />)}
            </div>
            {step.explanation && expanded[i] && (
              <div style={{ padding:'10px 16px', background:'var(--surface-2)', borderTop:'1px solid var(--border)', fontSize:12, color:'var(--text-secondary)' }}>
                {step.explanation}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
