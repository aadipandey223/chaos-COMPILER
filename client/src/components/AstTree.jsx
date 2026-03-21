import React, { useRef, useEffect, useCallback } from 'react';
import {
  select,
  hierarchy,
  tree,
  linkVertical,
  zoom,
  zoomIdentity,
  drag
} from 'd3';
import styles from './AstTree.module.css';

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

const AstTree = ({ data, onNodeClick, search = '', mutatedLines = new Set() }) => {
  const svgRef       = useRef(null);
  const zoomRef      = useRef(null);
  const onClickRef   = useRef(onNodeClick); // stable ref — never triggers re-render

  // Keep the ref current without re-running the effect
  useEffect(() => { onClickRef.current = onNodeClick; }, [onNodeClick]);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const q = search.trim().toLowerCase();

    const renderTree = () => {
      const svg = select(svgRef.current);
      svg.selectAll('*').remove();

      const container = svgRef.current.parentElement;
      const W = container.clientWidth;
      const H = 600;
      const M = 60;

      svg.attr('width', W).attr('height', H);

      const g = svg.append('g');

      // ── zoom ──────────────────────────────────────────────────────────────
      if (!zoomRef.current) {
        zoomRef.current = zoom()
          .scaleExtent([0.3, 3])
          .on('zoom', (e) => { g.attr('transform', e.transform); });
      }
      svg.call(zoomRef.current);

      // ── layout ───────────────────────────────────────────────────────────
      const rootNode   = hierarchy(data);
      const treeLayout = tree().size([W - 2 * M, H - 2 * M]);
      treeLayout(rootNode);

      // Assign stable ids and mutable position store
      const positions = new Map();
      rootNode.descendants().forEach((d, i) => {
        d._id = i;
        positions.set(i, { x: d.x, y: d.y });
      });

      // Assign ids to links (source._id → target._id)
      const links = rootNode.links();

      // Initial group offset
      g.attr('transform', `translate(${M}, ${M})`);

      // ── link generator ────────────────────────────────────────────────────
      const linkGen = linkVertical().x(n => n.x).y(n => n.y);

      const linkSel = g.selectAll('.link')
        .data(links)
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', '#2a2a2a')
        .attr('stroke-width', 1.5)
        .attr('d', l => linkGen({
          source: positions.get(l.source._id),
          target: positions.get(l.target._id),
        }));

      // ── function to update links for a moved node ─────────────────────────
      function refreshLinks(movedId) {
        linkSel.filter(l => l.source._id === movedId || l.target._id === movedId)
          .attr('d', l => linkGen({
            source: positions.get(l.source._id),
            target: positions.get(l.target._id),
          }));
      }

      // ── drag behavior ─────────────────────────────────────────────────────
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
          select(this).attr('transform', `translate(${pos.x},${pos.y})`);
          refreshLinks(d._id);
          select(this).property('_dragged', true);
        })
        .on('end', function (event, d) {
          select(this).select('rect').attr('stroke-width', 1);
        });

      // ── nodes ─────────────────────────────────────────────────────────────
      const node = g.selectAll('.node')
        .data(rootNode.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .style('cursor', 'grab')
        .call(dragBehavior)
        .on('click', (event, d) => {
          // Suppress click if the node was dragged
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
        .attr('width',  130)
        .attr('height',  44)
        .attr('x', -65)
        .attr('y', -22)
        .attr('rx', 6)
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
        .attr('y', -6)
        .attr('fill', '#e8e6e0')
        .style('font-family', 'IBM Plex Mono, monospace')
        .style('font-size', '11px')
        .style('pointer-events', 'none')
        .text(d => truncate(d.data.name, 16));

      node.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 9)
        .attr('fill', '#888580')
        .style('font-family', 'IBM Plex Sans, sans-serif')
        .style('font-size', '10px')
        .style('pointer-events', 'none')
        .text(d => d.data.meta.line ? `L${d.data.meta.line}` : '');
    };

    renderTree();
    window.addEventListener('resize', renderTree);
    return () => window.removeEventListener('resize', renderTree);
  }, [data, search, mutatedLines]);

  const handleResetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current)
        .transition()
        .duration(750)
        .call(zoomRef.current.transform, zoomIdentity);
    }
  };

  return (
    <div className={styles.wrapper}>
      <button className={styles.resetBtn} onClick={handleResetZoom}>
        RESET ZOOM
      </button>
      <svg ref={svgRef} className={styles.svg}></svg>
    </div>
  );
};

export default AstTree;
