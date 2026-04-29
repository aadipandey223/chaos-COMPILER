import React, { useState } from 'react';

/* ── Minimal recursive SVG tree ─────────────────────────── */
const NW = 72, NH = 30, HGAP = 14, VGAP = 56;

function measure(node) {
  if (!node.children?.length) { node._w = NW; return; }
  node.children.forEach(measure);
  const total = node.children.reduce((s, c) => s + c._w, 0) + HGAP * (node.children.length - 1);
  node._w = Math.max(NW, total);
  let x = 0;
  node.children.forEach(c => { c._ox = x + c._w / 2; x += c._w + HGAP; });
}

function position(node, ox, oy) {
  node.px = ox + (node._ox ?? node._w / 2);
  node.py = oy;
  node.children?.forEach(c => position(c, ox + c._ox - node._w/2 + (node.px - ox - (node._ox ?? node._w/2)), oy + VGAP));
}

function flatNodes(n, arr = []) { arr.push(n); n.children?.forEach(c => flatNodes(c, arr)); return arr; }
function flatEdges(n, arr = []) { n.children?.forEach(c => { arr.push({x1:n.px,y1:n.py,x2:c.px,y2:c.py}); flatEdges(c, arr); }); return arr; }

export default function ParseTree({ parseTree }) {
  const [hi, setHi] = useState(null);

  if (!parseTree) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, color:'var(--text-tertiary)' }}>
        <div style={{ fontSize:40, opacity:0.25 }}>🌿</div>
        <p style={{ fontSize:13 }}>No parse tree yet — press <strong style={{color:'var(--accent)'}}>Start Process</strong></p>
      </div>
    );
  }

  const root = JSON.parse(JSON.stringify(parseTree));
  measure(root);
  position(root, 0, 36);
  const nodes = flatNodes(root);
  const edges = flatEdges(root);

  const xs = nodes.map(n => n.px), ys = nodes.map(n => n.py);
  const minX = Math.min(...xs) - NW, maxX = Math.max(...xs) + NW;
  const maxY = Math.max(...ys) + NH + 24;
  const VW = maxX - minX;

  return (
    <div style={{ overflow:'auto', height:'100%', width:'100%' }}>
      <p style={{ fontSize:10, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700, marginBottom:12 }}>Click any node to highlight it</p>
      <svg viewBox={`${minX} 0 ${VW} ${maxY}`} style={{ width:'100%', minHeight: maxY, display:'block' }}>
        {edges.map((e,i) => (
          <line key={i} x1={e.x1} y1={e.y1+NH/2} x2={e.x2} y2={e.y2-NH/2} stroke="var(--border-strong)" strokeWidth="1.5" />
        ))}
        {nodes.map((n, i) => {
          const isLeaf = !n.children?.length;
          const isHi   = hi === `${n.px}-${n.py}`;
          return (
            <g key={i} style={{ cursor:'pointer' }} onClick={() => setHi(isHi ? null : `${n.px}-${n.py}`)}>
              <rect
                x={n.px - NW/2} y={n.py - NH/2} width={NW} height={NH} rx="7"
                fill={isHi ? 'var(--accent-subtle)' : isLeaf ? 'var(--info-light)' : 'var(--surface-2)'}
                stroke={isHi ? 'var(--accent)' : isLeaf ? 'var(--info)' : 'var(--border-strong)'}
                strokeWidth={isHi ? 2 : 1.5}
              />
              <text x={n.px} y={n.py} textAnchor="middle" dominantBaseline="central"
                fill={isLeaf ? 'var(--info)' : 'var(--text-primary)'}
                fontSize="11" fontFamily="monospace" fontWeight="bold">
                {n.value}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display:'flex', gap:20, marginTop:16, fontSize:11, color:'var(--text-tertiary)' }}>
        <span>🔵 Terminal (leaf)</span>
        <span>⬜ Non-terminal</span>
        <span>🟠 Selected</span>
      </div>
    </div>
  );
}
