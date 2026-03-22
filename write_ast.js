const fs = require('fs');
const content = `import React, { useRef, useEffect, useCallback, useState } from 'react';
import { select, hierarchy, tree, linkVertical, zoom, zoomIdentity, drag } from 'd3';
import styles from './AstTree.module.css';
import { buildReplaySteps } from '../../utils/astAdapter';

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 3) + '...' : str;
}

function nodeColor(type) {
  const map = {
    Program:       { fill: '#1a1a1a', stroke: '#3a3a3a' },
    Block:         { fill: '#1a1a1a', stroke: '#3a3a3a' },
    FuncDecl:      { fill: '#1a2a1a', stroke: '#3a9e6e' },
    VarDecl:       { fill: '#1a1a2a', stroke: '#3a6a9e' },
    Return:        { fill: '#2a1a1a', stroke: '#9e3a3a' },
    If:            { fill: '#2a2a1a', stroke: '#9e8a3a' },
    While:         { fill: '#2a2a1a', stroke: '#9e8a3a' },
    BinaryOp:      { fill: '#2a1a2a', stroke: '#7a3a9e' },
    UnaryOp:       { fill: '#2a1a2a', stroke: '#7a3a9e' },
    Number:        { fill: '#1a2a2a', stroke: '#3a8a8a' },
    StringLiteral: { fill: '#1a2a2a', stroke: '#3a8a8a' },
    Ident:         { fill: '#1a2a2a', stroke: '#3a8a8a' },
    Call:          { fill: '#2a1a1a', stroke: '#e05c3a' },
  };
  return map[type] || { fill: '#1a1a1a', stroke: '#444444' };
}

const NODE_W = 160;
const NODE_H = 90;
const STEP_DURATION = { 0.5: 800, 1: 400, 2: 200 };

const AstTree = ({ data, onNodeClick, search = '', mutatedLines = new Set() }) => {
  const svgRef       = useRef(null);
  const zoomRef      = useRef(null);
  const onClickRef   = useRef(onNodeClick);

  const [replayMode, setReplayMode]   = useState(false);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps]   = useState(0);
  const [speed, setSpeed]             = useState(1);

  const stepsRef        = useRef([]);
  const timerRef        = useRef(null);
  const visibleNodesRef = useRef(new Set());
  const visibleEdgesRef = useRef(new Set());

  useEffect(() => { onClickRef.current = onNodeClick; }, [onNodeClick]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const stopPlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPlaying(false);
  }, []);

  const renderTree = useCallback(() => {
    if (!data || !svgRef.current) return;
    if (replayMode) return;

    const q = search.trim().toLowerCase();
    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svgRef.current.parentElement;
    const W = container.clientWidth;
    // No longer using fixed H = 600 or margins M.

    const g = svg.append('g');

    if (!zoomRef.current) {
      zoomRef.current = zoom()
        .scaleExtent([0.3, 3])
        .on('zoom', (e) => { g.attr('transform', e.transform); });
    }
    svg.call(zoomRef.current);

    const rootNode   = hierarchy(data);
    const treeLayout = tree().nodeSize([NODE_W, NODE_H]);
    treeLayout(rootNode);

    let x0 = Infinity, x1 = -Infinity;
    rootNode.each(d => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
    });

    const treeHeight = rootNode.height * NODE_H + 80;
    const svgHeight  = Math.max(600, treeHeight);
    svg.attr('height', svgHeight);

    const treeWidth = x1 - x0 + NODE_W;
    const translateStr = \`translate(\${(W - treeWidth) / 2 - x0 + NODE_W/2}, 40)\`;
    
    // Set initial transform both on g and in zoom identity
    g.attr('transform', translateStr);
    select(svgRef.current).call(zoomRef.current.transform, zoomIdentity.translate((W - treeWidth)/2 - x0 + NODE_W/2, 40));

    const positions = new Map();
    rootNode.descendants().forEach((d, i) => {
      d._id = i;
      positions.set(i, { x: d.x, y: d.y });
    });

    const links = rootNode.links();
    const linkGen = linkVertical().x(n => n.x).y(n => n.y);

    const linkSel = g.selectAll('.link')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#3a3835')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .attr('d', l => linkGen({
        source: positions.get(l.source._id),
        target: positions.get(l.target._id),
      }));

    function refreshLinks(movedId) {
      linkSel.filter(l => l.source._id === movedId || l.target._id === movedId)
        .attr('d', l => linkGen({
          source: positions.get(l.source._id),
          target: positions.get(l.target._id),
        }));
    }

    const dragBehavior = drag()
      .on('start', function (event) {
        event.sourceEvent.stopPropagation();
        select(this).raise();
        select(this).select('rect').attr('stroke-width', 2);
        select(this).property('_dragged', false);
      })
      .on('drag', function (event, d) {
        const pos = positions.get(d._id);
        pos.x += event.dx;
        pos.y += event.dy;
        select(this).attr('transform', \`translate(\${pos.x},\${pos.y})\`);
        refreshLinks(d._id);
        select(this).property('_dragged', true);
      })
      .on('end', function (event, d) {
        select(this).select('rect').attr('stroke-width', 1);
      });

    const node = g.selectAll('.node')
      .data(rootNode.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => \`translate(\${d.x},\${d.y})\`)
      .style('cursor', 'grab')
      .call(dragBehavior)
      .on('click', (event, d) => {
        if (select(event.currentTarget).property('_dragged')) return;
        onClickRef.current(d.data.meta);
      })
      .on('mouseenter', function () {
        select(this).select('rect').attr('filter', 'brightness(1.4)');
      })
      .on('mouseleave', function () {
        select(this).select('rect').attr('filter', null);
      });

    node.append('rect')
      .attr('width',  140)
      .attr('height',  52)
      .attr('x', -70)
      .attr('y', -26)
      .attr('rx', 8)
      .attr('fill',   d => nodeColor(d.data.meta.type).fill)
      .attr('stroke', d => {
        const meta = d.data.meta;
        const isMutated = meta.line && mutatedLines.has(meta.line);
        const isMatch   = q && (
          meta.type?.toLowerCase().includes(q) ||
          (meta.value && String(meta.value).toLowerCase().includes(q))
        );
        if (isMutated) return '#e05c3a';
        if (isMatch)   return '#3a8aff';
        return nodeColor(meta.type).stroke;
      })
      .attr('stroke-width', d => {
        const meta = d.data.meta;
        const isMutated = meta.line && mutatedLines.has(meta.line);
        const isMatch   = q && (
          meta.type?.toLowerCase().includes(q) ||
          (meta.value && String(meta.value).toLowerCase().includes(q))
        );
        return (isMutated || isMatch) ? 2 : 1;
      })
      .attr('filter', d => {
        const meta = d.data.meta;
        const isMutated = meta.line && mutatedLines.has(meta.line);
        const isMatch   = q && (
          meta.type?.toLowerCase().includes(q) ||
          (meta.value && String(meta.value).toLowerCase().includes(q))
        );
        if (isMutated) return 'drop-shadow(0 0 6px #e05c3a88)';
        if (isMatch)   return 'drop-shadow(0 0 6px #3a8aff88)';
        return null;
      });

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -8)
      .attr('fill', '#e8e6e0')
      .style('font-family', 'IBM Plex Mono, monospace')
      .style('font-size', '11px')
      .style('pointer-events', 'none')
      .text(d => truncate(d.data.name, 16));

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 10)
      .attr('fill', '#888580')
      .style('font-family', 'IBM Plex Sans, sans-serif')
      .style('font-size', '10px')
      .style('pointer-events', 'none')
      .text(d => d.data.meta.line ? \`L\${d.data.meta.line}\` : '');

  }, [data, search, mutatedLines, replayMode]);

  useEffect(() => {
    if (!replayMode) {
      renderTree();
    }
    const handleResize = () => { if (!replayMode) renderTree(); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderTree, replayMode]);

  function renderReplayFrame(visNodesSet, visEdgesSet, cStep) {
    if (!data || !svgRef.current) return;
    const q = search.trim().toLowerCase();
    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const root   = hierarchy(data);
    const layout = tree().nodeSize([NODE_W, NODE_H]);
    layout(root);

    let x0 = Infinity, x1 = -Infinity;
    root.each(d => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
    });

    const treeHeight = root.height * NODE_H + 80;
    const svgHeight  = Math.max(600, treeHeight);
    svg.attr('height', svgHeight);

    const container = svgRef.current.parentElement;
    const W = container.clientWidth;

    const g = svg.append('g');
    const treeWidth = x1 - x0 + NODE_W;
    g.attr('transform', \`translate(\${(W - treeWidth) / 2 - x0 + NODE_W/2}, 40)\`);

    const linkGen = linkVertical().x(d => d.x).y(d => d.y);

    const allLinks = root.links();
    const visLinks = allLinks.filter(l => {
      return visEdgesSet.has(l.target.data.meta && l.target.data.meta.type
        ? l.target.data.meta.type + (l.target.data.meta.line || '0') + l.target.data.name
        : l.target.data.name);
    });

    g.selectAll('.link')
      .data(visLinks)
      .enter().append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#3a3835')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .attr('d', linkGen);

    const allNodes = root.descendants();
    const visNodes = allNodes.filter(n => {
      return visNodesSet.has(n.data.meta && n.data.meta.type
        ? n.data.meta.type + (n.data.meta.line || '0') + n.data.name
        : n.data.name);
    });

    const nodeGroups = g.selectAll('.node')
      .data(visNodes)
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => \`translate(\${d.x},\${d.y})\`);

    nodeGroups.append('rect')
      .attr('width',  140)
      .attr('height',  52)
      .attr('x', -70)
      .attr('y', -26)
      .attr('rx', 8)
      .attr('fill', d => nodeColor(d.data.meta?.type).fill)
      .attr('stroke', d => nodeColor(d.data.meta?.type).stroke)
      .attr('stroke-width', 1);

    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -8)
      .attr('fill', '#e8e6e0')
      .style('font-family', 'IBM Plex Mono, monospace')
      .style('font-size', '11px')
      .style('pointer-events', 'none')
      .text(d => truncate(d.data.name, 16));

    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 10)
      .attr('fill', '#888580')
      .style('font-family', 'IBM Plex Sans, sans-serif')
      .style('font-size', '10px')
      .style('pointer-events', 'none')
      .text(d => d.data.meta?.line ? \`L\${d.data.meta.line}\` : '');

    const lastStep = stepsRef.current[cStep - 1];
    if (lastStep && lastStep.kind === 'node') {
      const lastKey = lastStep.node.data.meta && lastStep.node.data.meta.type
        ? lastStep.node.data.meta.type + (lastStep.node.data.meta.line || '0') + lastStep.node.data.name
        : lastStep.node.data.name;
      g.selectAll('.node').each(function(d) {
        const key = d.data.meta && d.data.meta.type
          ? d.data.meta.type + (d.data.meta.line || '0') + d.data.name
          : d.data.name;
        if (key === lastKey) {
          select(this).select('rect')
            .attr('stroke', '#e05c3a')
            .attr('stroke-width', 2.5);
        }
      });
    }

    g.selectAll('.node').each(function(d) {
      const key = d.data.meta && d.data.meta.type
        ? d.data.meta.type + (d.data.meta.line || '0') + d.data.name
        : d.data.name;
      const isLast = lastStep && lastStep.kind === 'node' &&
        (lastStep.node.data.meta && lastStep.node.data.meta.type
          ? lastStep.node.data.meta.type + (lastStep.node.data.meta.line || '0') + lastStep.node.data.name
          : lastStep.node.data.name) === key;
      if (!isLast) {
        select(this).style('opacity', 0.55);
      }
    });
  }

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

    if (s.kind === 'node') {
      visibleNodesRef.current.add(key);
    } else {
      visibleEdgesRef.current.add(key);
    }

    setCurrentStep(step + 1);
    renderReplayFrame(visibleNodesRef.current, visibleEdgesRef.current, step + 1);
  }

  function startPlay() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= stepsRef.current.length) {
          clearInterval(timerRef.current);
          setIsPlaying(false);
          exitReplay();
          return prev;
        }
        advanceStep(prev);
        return prev + 1;
      });
    }, STEP_DURATION[speed] || 400);
  }

  function enterReplay() {
    if (!data) return;
    const root = hierarchy(data);
    const layout = tree().nodeSize([NODE_W, NODE_H]);
    layout(root);

    const steps = buildReplaySteps(root);
    stepsRef.current = steps;
    visibleNodesRef.current = new Set();
    visibleEdgesRef.current = new Set();
    setTotalSteps(steps.length);
    setCurrentStep(0);
    setReplayMode(true);
    setIsPlaying(false);

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();
    svg.on('.zoom', null); // Disable zoom
  }

  function exitReplay() {
    stopPlay();
    setReplayMode(false);
    setCurrentStep(0);
    visibleNodesRef.current = new Set();
    visibleEdgesRef.current = new Set();
    renderTree();
  }

  useEffect(() => {
    if (replayMode) {
      exitReplay();
    }
  }, [data]);

  const handleResetZoom = () => {
    if (svgRef.current && zoomRef.current && !replayMode) {
      select(svgRef.current)
        .transition()
        .duration(750)
        .call(zoomRef.current.transform, zoomIdentity);
    }
  };

  return (
    <div className={styles.wrapper}>
      <button 
        className={styles.replayTrigger}
        onClick={() => replayMode ? exitReplay() : enterReplay()}
        disabled={!data}
        title={!data ? "Compile first" : ""}
      >
        {replayMode ? 'Exit replay' : '▶ Build replay'}
      </button>

      {!replayMode && (
        <button className={styles.resetBtn} onClick={handleResetZoom}>
          RESET ZOOM
        </button>
      )}

      <svg ref={svgRef} className={styles.svg}></svg>

      {replayMode && (
        <div className={styles.replayControls}>
          <button
            className={styles.ctrlBtn}
            onClick={() => {
              stopPlay();
              if (currentStep > 0) {
                visibleNodesRef.current = new Set();
                visibleEdgesRef.current = new Set();
                for (let i = 0; i < currentStep - 1; i++) {
                  const s = stepsRef.current[i];
                  const key = s.node.data.meta && s.node.data.meta.type
                    ? s.node.data.meta.type + (s.node.data.meta.line || '0') + s.node.data.name
                    : s.node.data.name;
                  if (s.kind === 'node') visibleNodesRef.current.add(key);
                  else visibleEdgesRef.current.add(key);
                }
                setCurrentStep(currentStep - 1);
                renderReplayFrame(visibleNodesRef.current, visibleEdgesRef.current, currentStep - 1);
              }
            }}
            disabled={currentStep === 0}
          >
            ◀ Step
          </button>

          <button
            className={\`\${styles.ctrlBtn} \${styles.playBtn}\`}
            onClick={() => {
              if (isPlaying) {
                stopPlay();
              } else {
                setIsPlaying(true);
                startPlay();
              }
            }}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>

          <button
            className={styles.ctrlBtn}
            onClick={() => {
              stopPlay();
              advanceStep(currentStep);
            }}
            disabled={currentStep >= totalSteps}
          >
            Step ▶
          </button>

          <span className={styles.counter}>
            Node {Math.ceil(currentStep / 2)} of {Math.ceil(totalSteps / 2)}
          </span>

          <div className={styles.speedGroup}>
            <span className={styles.speedLabel}>Speed</span>
            {[0.5, 1, 2].map(s => (
              <button
                key={s}
                className={\`\${styles.speedBtn} \${speed === s ? styles.speedActive : ''}\`}
                onClick={() => {
                  setSpeed(s);
                  if (isPlaying) {
                    stopPlay();
                    setIsPlaying(true);
                    if (timerRef.current) clearInterval(timerRef.current);
                    timerRef.current = setInterval(() => {
                      setCurrentStep(prev => {
                        if (prev >= stepsRef.current.length) {
                          clearInterval(timerRef.current);
                          setIsPlaying(false);
                          exitReplay();
                          return prev;
                        }
                        advanceStep(prev);
                        return prev + 1;
                      });
                    }, STEP_DURATION[s] || 400);
                  }
                }}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: \`\${totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0}%\` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AstTree;
`;
fs.writeFileSync('client/src/components/compiler/AstTree.jsx', content);
