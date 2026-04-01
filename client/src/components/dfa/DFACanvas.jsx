import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import styles from './DFACanvas.module.css';

const DFACanvas = ({
  mode,
  nodes,
  edges,
  validation,
  onAddNode,
  onMoveNode,
  onDeleteNode,
  onRenameNode,
  onUpdateNode,
  onAddEdge,
  onUpdateEdge,
  onDeleteEdge,
  onSelectNode,
  onSelectEdge,
  selectedNode,
  selectedEdge
}) => {
  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const transformRef = useRef(d3.zoomIdentity);
  const gRef = useRef(null);
  
  const [inlineInput, setInlineInput] = useState(null);
  const [drawingEdge, setDrawingEdge] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Keybindings
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) onDeleteNode(selectedNode);
        if (selectedEdge) onDeleteEdge(selectedEdge);
      }
      if (e.key === 'Escape') {
        onSelectNode(null);
        onSelectEdge(null);
        setInlineInput(null);
        setDrawingEdge(null);
        setContextMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedEdge, onDeleteNode, onDeleteEdge, onSelectNode, onSelectEdge]);

  // Click outside to close context menu
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleDoubleClick = (e) => {
    if (mode !== 'user') return;
    if (e.target.tagName !== 'svg' && e.target.tagName !== 'rect') return;
    
    const [x, y] = d3.pointer(e, gRef.current);
    setInlineInput({
      type: 'addNode',
      x, y,
      value: 'State'
    });
  };

  const commitInlineInput = () => {
    if (!inlineInput) return;
    if (inlineInput.type === 'addNode' && inlineInput.value.trim()) {
      onAddNode(inlineInput.x, inlineInput.y, inlineInput.value);
    } else if (inlineInput.type === 'renameNode' && inlineInput.value.trim()) {
      onRenameNode(inlineInput.nodeId, inlineInput.value);
    } else if (inlineInput.type === 'addEdge' && inlineInput.value.trim()) {
      onAddEdge(inlineInput.fromId, inlineInput.toId, inlineInput.value);
    } else if (inlineInput.type === 'editEdge' && inlineInput.value.trim()) {
      onUpdateEdge(inlineInput.edgeId, inlineInput.value);
    }
    setInlineInput(null);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      commitInlineInput();
    } else if (e.key === 'Escape') {
      setInlineInput(null);
    }
  };

  const getNodeColor = (nodeId) => {
    if (mode === 'user') return { fill: '#1a1a1a', stroke: '#2a2825' };
    if (mode === 'auto') return { fill: '#1a2a1a', stroke: '#3a9e6e' };
    if (mode === 'compare') {
      if (validation.missingNodes?.includes(nodes.find(n => n.id === nodeId)?.label)) {
        return { fill: '#2a1a1a', stroke: '#c23b2a', strokeDasharray: '4,4' };
      }
      if (validation.correct?.length > 0 || validation.score >= 0) {
        // Just general style for present nodes
        return { fill: '#1a2a1a', stroke: '#2d7a4f' };
      }
    }
    return { fill: '#1a1a1a', stroke: '#2a2825' };
  };

  const getEdgeStyle = (edge) => {
    if (mode === 'user') return { stroke: '#3a3835', dash: null, width: 1.5 };
    if (mode === 'auto') return { stroke: '#3a9e6e', dash: null, width: 1.5 };
    if (mode === 'compare') {
      if (validation.correct?.includes(edge.id)) return { stroke: '#2d7a4f', dash: null, width: 2 };
      if (validation.wrong?.find(w => w.edgeId === edge.id)) return { stroke: '#c23b2a', dash: null, width: 2 };
      if (validation.extra?.includes(edge.id)) return { stroke: '#7a3a9e', dash: '5,5', width: 2 };
      // "missing" edges from validation are ghost rendered separately
    }
    return { stroke: '#3a3835', dash: null, width: 1.5 };
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // clear canvas

    // Defs for arrowheads
    const defs = svg.append('defs');
    ['#3a3835', '#3a9e6e', '#2d7a4f', '#c23b2a', '#7a3a9e', '#a06020'].forEach(color => {
      const id = 'arrow-' + color.replace('#', '');
      defs.append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 28) // offset from center of node
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
    });

    const bgRect = svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'transparent')
      .on('dblclick', handleDoubleClick)
      .on('click', () => {
        onSelectNode(null);
        onSelectEdge(null);
      });

    if (!zoomRef.current) {
      zoomRef.current = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (e) => {
          g.attr('transform', e.transform);
          transformRef.current = e.transform;
        });
    }
    svg.call(zoomRef.current);

    const g = svg.append('g').attr('class', 'zoom-g');
    gRef.current = g.node();
    g.attr('transform', transformRef.current);

    const posMap = new Map(nodes.map(n => [n.id, { x: n.x, y: n.y }]));

    const drawPath = (from, to) => {
      if (!from || !to) return '';
      if (from.x === to.x && from.y === to.y) {
        // self loop arc
        return `M ${from.x - 10} ${from.y - 30} C ${from.x - 40} ${from.y - 100}, ${from.x + 40} ${from.y - 100}, ${from.x + 10} ${from.y - 30}`;
      }
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dr = Math.sqrt(dx * dx + dy * dy);
      return `M ${from.x} ${from.y} Q ${from.x + dx/2 - dy/4} ${from.y + dy/2 + dx/4} ${to.x} ${to.y}`;
    };

    // Draw Missing Edges (Compare Mode)
    if (mode === 'compare' && validation.missing?.length > 0) {
      const missingEdges = validation.missing.map(m => {
        const fromNode = nodes.find(n => n.label.toLowerCase() === m.from.toLowerCase());
        const toNode = nodes.find(n => n.label.toLowerCase() === m.to.toLowerCase());
        return { ...m, fromNode, toNode };
      }).filter(m => m.fromNode && m.toNode);

      const mGroups = g.selectAll('.missing-edge')
        .data(missingEdges)
        .enter()
        .append('g')
        .attr('class', 'missing-edge');

      mGroups.append('path')
        .attr('fill', 'none')
        .attr('stroke', '#a06020')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('marker-end', `url(#arrow-a06020)`)
        .attr('d', d => drawPath(d.fromNode, d.toNode));

      mGroups.append('text')
        .attr('x', d => (d.fromNode.x + d.toNode.x)/2)
        .attr('y', d => (d.fromNode.y + d.toNode.y)/2)
        .attr('fill', '#a06020')
        .attr('font-size', 10)
        .attr('font-family', 'IBM Plex Mono')
        .attr('text-anchor', 'middle')
        .text(d => d.label);
    }

    // Draw regular edges
    const edgeGroups = g.selectAll('.edge')
      .data(edges)
      .enter()
      .append('g')
      .attr('class', 'edge');

    edgeGroups.append('path')
      .attr('fill', 'none')
      .attr('stroke', d => getEdgeStyle(d).stroke)
      .attr('stroke-width', d => getEdgeStyle(d).width + (selectedEdge === d.id ? 1 : 0))
      .attr('stroke-dasharray', d => getEdgeStyle(d).dash)
      .attr('marker-end', d => `url(#arrow-${getEdgeStyle(d).stroke.replace('#', '')})`)
      .attr('d', d => drawPath(posMap.get(d.from), posMap.get(d.to)))
      .style('cursor', mode === 'user' ? 'pointer' : 'default')
      .on('click', (e, d) => {
        if (mode !== 'user') return;
        e.stopPropagation();
        onSelectEdge(d.id);
        onSelectNode(null);
      })
      .on('dblclick', (e, d) => {
        if (mode !== 'user') return;
        e.stopPropagation();
        setInlineInput({
          type: 'editEdge',
          edgeId: d.id,
          x: (posMap.get(d.from).x + posMap.get(d.to).x) / 2,
          y: (posMap.get(d.from).y + posMap.get(d.to).y) / 2,
          value: d.label
        });
      });

    // edge labels
    edgeGroups.append('rect')
      .attr('fill', '#1a1917')
      .attr('rx', 2)
      .attr('x', d => {
        const from = posMap.get(d.from);
        const to = posMap.get(d.to);
        const mdpx = from.x === to.x && from.y === to.y ? from.x : (from.x + to.x) / 2;
        return mdpx - d.label.length * 3 - 4;
      })
      .attr('y', d => {
        const from = posMap.get(d.from);
        const to = posMap.get(d.to);
        const mdpy = from.x === to.x && from.y === to.y ? from.y - 120 : (from.y + to.y) / 2;
        return mdpy - 8;
      })
      .attr('width', d => d.label.length * 6 + 8)
      .attr('height', 16);

    edgeGroups.append('text')
      .attr('x', d => {
        const from = posMap.get(d.from);
        const to = posMap.get(d.to);
        return from.x === to.x && from.y === to.y ? from.x : (from.x + to.x) / 2;
      })
      .attr('y', d => {
        const from = posMap.get(d.from);
        const to = posMap.get(d.to);
        return from.x === to.x && from.y === to.y ? from.y - 120 : (from.y + to.y) / 2;
      })
      .attr('dy', 3)
      .attr('text-anchor', 'middle')
      .attr('fill', d => {
        if (mode === 'compare' && validation.wrong?.find(w => w.edgeId === d.id)) return '#c23b2a';
        return '#e8e4dd';
      })
      .attr('font-size', 10)
      .attr('font-family', 'IBM Plex Mono')
      .text(d => {
        if (mode === 'compare') {
          const wrong = validation.wrong?.find(w => w.edgeId === d.id);
          if (wrong) return `${d.label} ✗`;
        }
        return d.label;
      });

    // Draw active drawing line
    if (drawingEdge) {
      g.append('path')
        .attr('fill', 'none')
        .attr('stroke', '#d4522a')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('d', `M ${drawingEdge.fromX} ${drawingEdge.fromY} L ${drawingEdge.toX} ${drawingEdge.toY}`);
    }

    // Nodes
    const dragBehavior = d3.drag()
      .on('start', function (e, d) {
        if (mode !== 'user') return;
        if (e.sourceEvent.shiftKey) {
          setDrawingEdge({ fromId: d.id, fromX: d.x, fromY: d.y, toX: d.x, toY: d.y });
        } else {
          d3.select(this).raise();
        }
      })
      .on('drag', function (e, d) {
        if (mode !== 'user') return;
        if (e.sourceEvent.shiftKey && drawingEdge) {
          setDrawingEdge(prev => prev ? { ...prev, toX: e.x, toY: e.y } : null);
        } else if (!e.sourceEvent.shiftKey) {
          onMoveNode(d.id, e.x, e.y);
        }
      })
      .on('end', function (e, d) {
        if (mode !== 'user') return;
        if (drawingEdge) {
          // find target node
          const hitNode = nodes.find(n => {
            const dx = n.x - e.x;
            const dy = n.y - e.y;
            return Math.sqrt(dx*dx + dy*dy) < 36;
          });
          if (hitNode) {
            setInlineInput({
              type: 'addEdge',
              fromId: d.id,
              toId: hitNode.id,
              x: (d.x + hitNode.x)/2,
              y: (d.y + hitNode.y)/2,
              value: ''
            });
          }
          setDrawingEdge(null);
        }
      });

    const nodeG = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .call(dragBehavior)
      .on('click', (e, d) => {
        if (mode !== 'user') return;
        e.stopPropagation();
        onSelectNode(d.id);
        onSelectEdge(null);
      })
      .on('dblclick', (e, d) => {
        if (mode !== 'user') return;
        e.stopPropagation();
        setInlineInput({
          type: 'renameNode',
          nodeId: d.id,
          x: d.x,
          y: d.y,
          value: d.label
        });
      })
      .on('contextmenu', (e, d) => {
        if (mode !== 'user') return;
        e.preventDefault();
        setContextMenu({
          nodeId: d.id,
          x: e.pageX,
          y: e.pageY,
          isStart: d.isStart,
          isAccept: d.isAccept
        });
      });

    nodeG.append('circle')
      .attr('r', 36)
      .attr('fill', d => getNodeColor(d.id).fill)
      .attr('stroke', d => selectedNode === d.id ? '#d4522a' : getNodeColor(d.id).stroke)
      .attr('stroke-width', d => selectedNode === d.id ? 3 : 2)
      .attr('stroke-dasharray', d => getNodeColor(d.id).strokeDasharray || null);

    // Accept state inner ring
    nodeG.filter(d => d.isAccept)
      .append('circle')
      .attr('r', 30)
      .attr('fill', 'none')
      .attr('stroke', d => selectedNode === d.id ? '#d4522a' : getNodeColor(d.id).stroke)
      .attr('stroke-width', 2);

    // Start state arrow
    nodeG.filter(d => d.isStart)
      .append('path')
      .attr('d', 'M -60 0 L -40 0 M -45 -5 L -40 0 L -45 5')
      .attr('fill', 'none')
      .attr('stroke', '#e8e4dd')
      .attr('stroke-width', 2);

    nodeG.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#e8e4dd')
      .attr('font-size', 12)
      .attr('font-family', 'IBM Plex Mono')
      .text(d => d.label);

  }, [nodes, edges, mode, validation, drawingEdge, selectedNode, selectedEdge, onMoveNode, onAddNode, onSelectNode, onSelectEdge]);

  return (
    <div className={styles.canvasWrapper}>
      <svg ref={svgRef} className={styles.svg}></svg>
      
      {inlineInput && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <svg style={{ width: '100%', height: '100%' }}>
            <g transform={transformRef.current.toString()}>
              <foreignObject x={inlineInput.x - 80} y={inlineInput.y - 18} width={160} height={36} style={{ pointerEvents: 'auto' }}>
                <input
                  autoFocus
                  className={styles.inlineInput}
                  value={inlineInput.value}
                  onChange={e => setInlineInput({...inlineInput, value: e.target.value})}
                  onKeyDown={handleInputKeyDown}
                  onBlur={commitInlineInput}
                />
              </foreignObject>
            </g>
          </svg>
        </div>
      )}

      {contextMenu && (
        <div className={styles.contextMenu} style={{ left: contextMenu.x, top: contextMenu.y }} onClick={e => e.stopPropagation()}>
          <button className={styles.menuItem} onClick={() => {
            onUpdateNode(contextMenu.nodeId, { isStart: !contextMenu.isStart });
            setContextMenu(null);
          }}>{contextMenu.isStart ? '✓ ' : ''}Toggle Start</button>
          <button className={styles.menuItem} onClick={() => {
            onUpdateNode(contextMenu.nodeId, { isAccept: !contextMenu.isAccept });
            setContextMenu(null);
          }}>{contextMenu.isAccept ? '✓ ' : ''}Toggle Accept</button>
          <button className={`${styles.menuItem} ${styles.danger}`} onClick={() => {
            onDeleteNode(contextMenu.nodeId);
            setContextMenu(null);
          }}>Delete Node</button>
        </div>
      )}
    </div>
  );
};

export default DFACanvas;