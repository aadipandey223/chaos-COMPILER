import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { select, hierarchy, tree, zoom, zoomIdentity, drag } from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AstTree.module.css';
import { buildReplaySteps } from '../../utils/astAdapter';

const TYPE_COLOR = {
  program: { fill:'#1e2d4a', stroke:'#4b6b9e', text:'#a8c0e8' },
  stmt:    { fill:'#1a2e26', stroke:'#3a7a5e', text:'#8acfb0' },
  expr:    { fill:'#261d3a', stroke:'#7a5e9a', text:'#c0a8e8' },
  literal: { fill:'#2e2214', stroke:'#8a6a3a', text:'#d4b07a' },
};
const MUT_COLOR = { fill:'#3a1508', stroke:'#d4522a', text:'#f0845a' };

function getNodeCategory(type) {
  if (!type) return 'stmt';
  if (type.includes('Program') || type.includes('TranslationUnit')) return 'program';
  if (['Block', 'FuncDecl', 'VarDecl', 'Return', 'If', 'While'].includes(type) || type.includes('Stmt') || type.includes('Decl')) return 'stmt';
  if (type.includes('Op') || type.includes('Expr') || type.includes('Call')) return 'expr';
  if (type.includes('Literal') || type.includes('Number') || type.includes('Ident')) return 'literal';
  return 'stmt';
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 3) + '...' : str;
}

const W = 116;
const H = 50;
const H_SEP = 140;
const V_SEP = 90;
const STEP_DURATION = { 0.5: 800, 1: 400, 2: 200 };

const AstTree = ({ data, onNodeClick, search = '', mutatedLines = new Set() }) => {
  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const containerRef = useRef(null);

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' or 'mutated'
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // Replay State
  const [replayMode, setReplayMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [speed, setSpeed] = useState(1);

  const stepsRef = useRef([]);
  const timerRef = useRef(null);
  const visibleNodesRef = useRef(new Set());
  const visibleEdgesRef = useRef(new Set());

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const stopPlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPlaying(false);
  }, []);

  const renderTreeCore = useCallback((isReplayRender = false, limitNodes = null, limitEdges = null, cStep = 0) => {
    if (!data || !svgRef.current) return;

    const svg = select(svgRef.current);
    
    let bgRect = svg.select('.bg-event-catcher');
    if (bgRect.empty()) {
      bgRect = svg.append('rect')
        .attr('class', 'bg-event-catcher')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('fill', 'transparent')
        .style('pointer-events', 'all')
        .on('click', () => setSelectedNode(null));
    }

    let g = svg.select('.tree-container');
    if (g.empty()) {
      g = svg.append('g').attr('class', 'tree-container');
    } else {
      g.selectAll('*').remove();
    }

    if (!zoomRef.current) {
      zoomRef.current = zoom()
        .scaleExtent([0.1, 5])
        .on('zoom', (e) => { 
          svg.select('.tree-container').attr('transform', e.transform); 
        });
      svg.call(zoomRef.current);
    }

    const rootNode = hierarchy(data, d => {
        if (isCollapsed && !isReplayRender) {
            const type = d.meta?.type || d.name || '';
            // Properly collapse large subtrees like blocks or condition branches
            if ((type.includes('Block') || type.includes('If') || type.includes('While') || type.includes('Function')) && type !== 'Program' && type !== 'TranslationUnit') {
                return null;
            }
        }
        return d.children || d._children;
    });

    const treeLayout = tree().nodeSize([H_SEP, V_SEP]);
    treeLayout(rootNode);

    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    rootNode.each(d => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
      if (d.y > y1) y1 = d.y;
      if (d.y < y0) y0 = d.y;
    });

    const cx = (x0 + x1) / 2;
    // Safe width retrieval
    let viewW = containerRef.current ? containerRef.current.clientWidth : 800;
    
    // Ensure initial framing centers the root correctly
    const initialTranslate = zoomIdentity.translate(viewW/2 - cx, 40);
    
    // ONLY set this initially, otherwise if it's purely a filter change it will reset zoom
    // We only reset zoom gracefully if it's the very first render or we explicitly call reset
    if (!svg.node().__zoomInitialized) {
      svg.call(zoomRef.current.transform, initialTranslate);
      svg.node().__zoomInitialized = true;
    }

    const positions = new Map();
    const nodeMap = new Map();
    rootNode.descendants().forEach((d, i) => {
      d._id = i;
      positions.set(i, { x: d.x, y: d.y });
      const key = d.data.meta && d.data.meta.type
        ? d.data.meta.type + (d.data.meta.line || '0') + d.data.name
        : d.data.name;
      nodeMap.set(d._id, { key, mutated: mutatedLines.has(d.data.meta?.line) });
    });

    const mutatedNodeIds = new Set();
    if (activeFilter === 'mutated') {
       rootNode.descendants().forEach(d => {
           if (nodeMap.get(d._id).mutated) {
               let curr = d;
               while(curr) {
                   mutatedNodeIds.add(curr._id);
                   curr = curr.parent;
               }
           }
       });
    }

    const links = rootNode.links();

    const linkSel = g.selectAll('.edge')
      .data(links)
      .enter()
      .append('path')
      .attr('d', l => {
         const sx = l.source.x;
         const sy = l.source.y + H/2;
         const tx = l.target.x;
         const ty = l.target.y - H/2;
         const midY = (sy + ty) / 2;
         return `M${sx},${sy} C${sx},${midY} ${tx},${midY} ${tx},${ty}`;
      })
      .attr('fill', 'none')
      .attr('stroke', l => nodeMap.get(l.target._id).mutated ? '#d4522a' : '#3a3835')
      .attr('stroke-width', l => nodeMap.get(l.target._id).mutated ? 1.5 : 1)
      .attr('stroke-dasharray', l => nodeMap.get(l.target._id).mutated ? '4 3' : 'none');

    const nodeSel = g.selectAll('.ast-node')
      .data(rootNode.descendants(), d => d.data.name + Math.random())
      .enter()
      .append('g')
      .attr('class', 'ast-node')
      .attr('transform', d => `translate(${d.x - W/2}, ${d.y - H/2})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
         event.stopPropagation();
         setSelectedNode({
             label: d.data.meta?.type || d.data.name,
             type: getNodeCategory(d.data.meta?.type),
             line: d.data.meta?.line,
             sub: truncate(d.data.name, 20),
             mutated: nodeMap.get(d._id).mutated,
             info: d.data.meta?.detail || 'No detailed info available.'
         });
         if (onNodeClick) onNodeClick(d.data.meta);
      });

    nodeSel.each(function(d) {
        const nMap = nodeMap.get(d._id);
        const type = getNodeCategory(d.data.meta?.type);
        const c = nMap.mutated ? MUT_COLOR : TYPE_COLOR[type];
        
        const gNode = select(this);
        gNode.append('rect')
           .attr('width', W)
           .attr('height', H)
           .attr('rx', 8)
           .attr('fill', c.fill)
           .attr('stroke', c.stroke)
           .attr('stroke-width', nMap.mutated ? 1.5 : 0.5)
           .on('mouseenter', function() { select(this).attr('filter', 'brightness(1.1)'); })
           .on('mouseleave', function() { select(this).attr('filter', null); });

        if (nMap.mutated) {
            gNode.append('rect')
               .attr('x', W - 18)
               .attr('y', -6)
               .attr('width', 20)
               .attr('height', 12)
               .attr('rx', 3)
               .attr('fill', '#d4522a');
            gNode.append('text')
               .attr('x', W - 8)
               .attr('y', 2)
               .attr('text-anchor', 'middle')
               .attr('font-size', '7')
               .attr('font-family', 'var(--font-code, monospace)')
               .attr('fill', '#fff')
               .attr('font-weight', '700')
               .style('pointer-events', 'none')
               .text('MUT');
        }

        const cxInner = W/2;
        gNode.append('text')
            .attr('x', cxInner)
            .attr('y', 17)
            .attr('text-anchor', 'middle')
            .attr('fill', c.text)
            .attr('font-size', '11')
            .attr('font-weight', '600')
            .attr('font-family', 'var(--font-code, monospace)')
            .style('pointer-events', 'none')
            .text(d.data.meta?.type || d.data.name);

        gNode.append('text')
            .attr('x', cxInner)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .attr('fill', c.text)
            .attr('font-size', '10')
            .attr('opacity', 0.75)
            .attr('font-family', 'var(--font-code, monospace)')
            .style('pointer-events', 'none')
            .text(truncate(d.data.name, 18));

        gNode.append('text')
            .attr('x', cxInner)
            .attr('y', 43)
            .attr('text-anchor', 'middle')
            .attr('fill', c.text)
            .attr('font-size', '9')
            .attr('opacity', 0.55)
            .attr('font-family', 'var(--font-code, monospace)')
            .style('pointer-events', 'none')
            .text(d.data.meta?.line ? `L${d.data.meta.line}` : (d.data.meta?.type === 'Program' ? 'root' : ''));
    });

    if (isReplayRender) {
         nodeSel.style('opacity', d => limitNodes.has(nodeMap.get(d._id).key) ? 1 : 0);
         linkSel.style('opacity', l => limitEdges.has(nodeMap.get(l.target._id).key) ? 1 : 0);
         
         const lastStep = stepsRef.current[cStep - 1];
         if (lastStep && lastStep.kind === 'node') {
             const lKey = lastStep.node.data.meta && lastStep.node.data.meta.type
                ? lastStep.node.data.meta.type + (lastStep.node.data.meta.line || '0') + lastStep.node.data.name
                : lastStep.node.data.name;
             nodeSel.each(function(d) {
                 if (nodeMap.get(d._id).key === lKey) {
                     select(this).select('rect').attr('stroke-width', 2).attr('stroke', '#e05c3a');
                 } else {
                     select(this).style('opacity', 0.6);
                 }
             });
         }
    } else {
         if (activeFilter === 'mutated') {
             nodeSel.style('opacity', d => mutatedNodeIds.has(d._id) ? 1 : 0)
                    .style('pointer-events', d => mutatedNodeIds.has(d._id) ? 'all' : 'none');
             linkSel.style('opacity', l => mutatedNodeIds.has(l.target._id) && mutatedNodeIds.has(l.source._id) ? 1 : 0);
         } else {
             nodeSel.style('opacity', 0).transition().duration(250).delay(d => d.depth * 25).style('opacity', 1);
             linkSel.style('opacity', 0).transition().duration(250).delay(l => l.target.depth * 25).style('opacity', 1);
         }
    }
  }, [data, isCollapsed, activeFilter, mutatedLines]);

  useEffect(() => {
    if (!replayMode) {
        renderTreeCore();
    }
  }, [renderTreeCore, replayMode]);

  useEffect(() => {
    if (!replayMode || !isPlaying) return;
    // Re-arm the replay interval so speed changes apply instantly.
    startPlay();
  }, [speed, replayMode, isPlaying]);

  // Zoom helpers
  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
        select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
    }
  };
  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
        select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.75);
    }
  };
  const handleResetZoom = () => {
    if (svgRef.current && zoomRef.current && containerRef.current) {
      const viewW = containerRef.current.clientWidth;
      select(svgRef.current)
        .transition()
        .duration(750)
        .call(zoomRef.current.transform, zoomIdentity.translate(viewW/2 - W/2, 40));
    }
  };

  function advanceStep(step) {
    if (step >= stepsRef.current.length) {
      setIsPlaying(false);
      exitReplay();
      return;
    }
    const s = stepsRef.current[step];
    const key = s.node.data.meta && s.node.data.meta.type
      ? s.node.data.meta.type + (s.node.data.meta.line || '0') + s.node.data.name
      : s.node.data.name;

    if (s.kind === 'node') visibleNodesRef.current.add(key);
    else visibleEdgesRef.current.add(key);

    setCurrentStep(step + 1);
    
    // Instead of completely recreating the AST tree:
    const svg = select(svgRef.current);
    const tDur = STEP_DURATION[speed] ? STEP_DURATION[speed] * 0.7 : 300;

    // Reset previous node's highlight if needed
    const lastStep = step > 0 ? stepsRef.current[step - 1] : null;
    if (lastStep && lastStep.kind === 'node') {
         const prevKey = lastStep.node.data.meta && lastStep.node.data.meta.type
           ? lastStep.node.data.meta.type + (lastStep.node.data.meta.line || '0') + lastStep.node.data.name
           : lastStep.node.data.name;
         
         svg.selectAll('.ast-node').filter(d => {
              const dkey = d.data.meta && d.data.meta.type ? d.data.meta.type + (d.data.meta.line || '0') + d.data.name : d.data.name;
              return dkey === prevKey;
         }).select('rect')
           .transition().duration(200)
           .attr('stroke', d => mutatedLines?.has(d.data.meta?.line) ? '#d4522a' : 'transparent')
           .attr('stroke-width', d => mutatedLines?.has(d.data.meta?.line) ? 1.5 : 1);
    }

    // Now correctly fade in the new node sequentially
    if (s.kind === 'node') {
        const tgt = svg.selectAll('.ast-node').filter(d => {
             const dkey = d.data.meta && d.data.meta.type ? d.data.meta.type + (d.data.meta.line || '0') + d.data.name : d.data.name;
             return dkey === key;
        });
        
        tgt.transition().duration(tDur).style('opacity', 1);
        tgt.select('rect').transition().duration(tDur)
          .attr('stroke-width', 2.5).attr('stroke', '#ffcc00');
    } else {
        svg.selectAll('.edge').filter(l => {
             const trg = l.target.data;
             const dkey = trg.meta && trg.meta.type ? trg.meta.type + (trg.meta.line || '0') + trg.name : trg.name;
             return dkey === key;
        })
        .transition().duration(tDur)
        .style('opacity', l => mutatedLines?.has(l.target.data.meta?.line) ? 0.7 : 1);
    }
  }

  function startPlay() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next - 1 >= stepsRef.current.length) {
          clearInterval(timerRef.current);
          setIsPlaying(false);
          setTimeout(() => exitReplay(), 0);
          return prev;
        }
        setTimeout(() => advanceStep(next - 1), 0);
        return next;
      });
    }, STEP_DURATION[speed] || 400);
  }

  function enterReplay() {
    if (!data) return;
    const root = hierarchy(data);
    const steps = buildReplaySteps(root);
    stepsRef.current = steps;
    visibleNodesRef.current = new Set();
    visibleEdgesRef.current = new Set();
    setTotalSteps(steps.length);
    setCurrentStep(0);
    setReplayMode(true);
    setIsPlaying(false);
    renderTreeCore(true, new Set(), new Set(), 0);
  }

  function exitReplay() {
    stopPlay();
    setReplayMode(false);
    setCurrentStep(0);
    visibleNodesRef.current = new Set();
    visibleEdgesRef.current = new Set();
  }

  return (
    <div className={styles.wrapper} ref={containerRef}>
      {!replayMode ? (
        <div className={styles.controls}>
          <button className={activeFilter === 'all' ? styles.active : ''} onClick={() => setActiveFilter('all')}>All nodes</button>
          <button className={activeFilter === 'mutated' ? styles.active : ''} onClick={() => setActiveFilter('mutated')}>Mutated only</button>
          <button className={isCollapsed ? styles.active : ''} onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? 'Expand all' : 'Collapse subtrees'}
          </button>
          <div style={{ flex: 1 }}></div>
          <div className={styles.legend}>
            <div className={styles.leg}><div className={styles.legDot} style={{background: '#4b6b9e'}}></div> Program</div>
            <div className={styles.leg}><div className={styles.legDot} style={{background: '#3a7a5e'}}></div> Statement</div>
            <div className={styles.leg}><div className={styles.legDot} style={{background: '#7a5e9a'}}></div> Expression</div>
            <div className={styles.leg}><div className={styles.legDot} style={{background: '#8a6a3a'}}></div> Literal</div>
            <div className={styles.leg}><div className={styles.legDot} style={{background: '#d4522a'}}></div> Mutated</div>
          </div>
          <button className={styles.replayTrigger} onClick={enterReplay} disabled={!data}>▶ Replay</button>
        </div>
      ) : (
        <div className={styles.replayControls}>
          <button className={styles.ctrlBtn} onClick={exitReplay}>Exit replay</button>
          <button className={`${styles.ctrlBtn} ${styles.playBtn}`} onClick={() => { if (isPlaying) stopPlay(); else { setIsPlaying(true); startPlay(); } }}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button className={styles.ctrlBtn} onClick={() => advanceStep(currentStep)} disabled={currentStep >= totalSteps}>Step ▶</button>
          <span className={styles.counter}>Node {Math.ceil(currentStep / 2)} of {Math.ceil(totalSteps / 2)}</span>
          <div className={styles.speedGroup}>
            <span className={styles.speedLabel}>Speed</span>
            {[0.5, 1, 2].map(s => (
              <button key={s} className={`${styles.speedBtn} ${speed === s ? styles.speedActive : ''}`} onClick={() => setSpeed(s)}>{s}x</button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.svgWrap}>
        <svg ref={svgRef} data-ast-tree="true" className={styles.svg} xmlns="http://www.w3.org/2000/svg"></svg>
        {!replayMode && (
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: '6px', zIndex: 10 }}>
            <button className={styles.ctrlBtn} onClick={handleZoomIn} title="Zoom In">＋</button>
            <button className={styles.ctrlBtn} onClick={handleZoomOut} title="Zoom Out">－</button>
            <button className={styles.ctrlBtn} onClick={handleResetZoom}>Reset Zoom</button>
          </div>
        )}
      </div>

      {replayMode && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0}%` }} />
        </div>
      )}

      {!replayMode && (
        <div className={styles.detailPanel}>
          {selectedNode ? (
            <>
              <div className={styles.dpTitle} style={{ color: selectedNode.mutated ? '#d4522a' : TYPE_COLOR[selectedNode.type]?.stroke }}>
                {selectedNode.label}
                <span className={`${styles.badge} ${selectedNode.mutated ? styles.badgeMut : styles.badgeSafe}`}>
                  {selectedNode.mutated ? 'MUTATED' : 'CLEAN'}
                </span>
              </div>
              <div className={styles.dpGrid}>
                <div className={styles.dpKey}>Node type</div><div className={styles.dpVal}>{selectedNode.label}</div>
                <div className={styles.dpKey}>Category</div><div className={styles.dpVal}>{selectedNode.type}</div>
                {selectedNode.line && <><div className={styles.dpKey}>Source line</div><div className={styles.dpVal}>L{selectedNode.line}</div></>}
                {selectedNode.sub && <><div className={styles.dpKey}>Value / sig</div><div className={styles.dpVal}>{selectedNode.sub}</div></>}
              </div>
              <div className={styles.dpHint}>{selectedNode.info}</div>
            </>
          ) : (
             <div className={styles.dpTitleHint}>Click any node to inspect it</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AstTree;
