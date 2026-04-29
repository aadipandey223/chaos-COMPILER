import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Controls,
  Background,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

// Utility: Auto-layout nodes and edges using Dagre
function getLayoutedElements(nodes, edges, direction = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 120,
    ranksep: 100,
    marginx: 60,
    marginy: 60,
  });

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: 80, height: 80 });
  });

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map(node => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 40,
          y: nodeWithPosition.y - 40,
        },
      };
    }),
    edges,
  };
}

function toNode(state, idx) {
  return {
    id: String(state.id),
    data: {
      label: `q${state.id}`,
      isStart: Boolean(state.isStart),
      isAccept: Boolean(state.isFinal ?? state.isAccept),
      isTrace: false,
    },
    position: { x: idx * 120, y: 120 },
    type: 'default',
  };
}

function toEdge(trans, idx) {
  return {
    id: `${trans.from}-${trans.to}-${trans.symbol || trans.label}-${idx}`,
    source: String(trans.from),
    target: String(trans.to),
    label: trans.symbol ?? trans.label ?? '',
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed },
    data: { isTrace: false },
  };
}

function buildAutomatonFromElements(nodes, edges) {
  return {
    states: nodes.map((n) => ({
      id: Number(n.id),
      isStart: Boolean(n.data?.isStart),
      isFinal: Boolean(n.data?.isAccept),
    })),
    transitions: edges.map((e) => ({
      from: Number(e.source),
      to: Number(e.target),
      symbol: String(e.label || ''),
    })),
  };
}

export default function DFAGraph({
  dfa,
  editable = false,
  mode = 'NFA',
  onAutomataChange,
  playbackStep = -1,
  trace = [],
  onSelectionChange,
  selectedElement,
  actionRequest,
  onActionHandled,
}) {
  const graph = dfa && Array.isArray(dfa.states) ? dfa : { states: [], transitions: [] };
  const graphKey = useMemo(() => JSON.stringify(graph), [graph]);
  const initializedFromKey = useRef('');
  const lastActionKey = useRef('');

  // Build trace sets
  const traceStateIds = useMemo(
    () =>
      playbackStep >= 0
        ? (trace[playbackStep] || []).map((id) => `q${id}`)
        : (dfa?.traceStates || []),
    [dfa, playbackStep, trace]
  );
  const traceEdgeIds = useMemo(() => dfa?.traceEdges || [], [dfa]);
  const traceStateSet = useMemo(() => new Set(traceStateIds), [traceStateIds]);
  const traceEdgeSet = useMemo(() => new Set(traceEdgeIds), [traceEdgeIds]);

  // Convert states to React Flow nodes
  const baseNodes = useMemo(
    () =>
      graph.states.map((state, idx) => ({
        ...toNode(state, idx),
        data: {
          label: `q${state.id}`,
          isStart: state.isStart,
          isAccept: state.isFinal ?? state.isAccept,
          isTrace: traceStateSet.has(`q${state.id}`),
        },
      })),
    [graph.states, traceStateSet]
  );

  // Convert transitions to React Flow edges
  const baseEdges = useMemo(
    () =>
      graph.transitions.map((trans, idx) => ({
        ...toEdge(trans, idx),
        data: {
          isTrace: traceEdgeSet.has(`${trans.from}-${trans.to}`),
        },
        animated: traceEdgeSet.has(`${trans.from}-${trans.to}`),
      })),
    [graph.transitions, traceEdgeSet]
  );

  const readonlyGraph = useMemo(() => getLayoutedElements(baseNodes, baseEdges, 'LR'), [baseNodes, baseEdges]);
  const [editorNodes, setEditorNodes] = React.useState([]);
  const [editorEdges, setEditorEdges] = React.useState([]);

  useEffect(() => {
    if (!editable) return;
    if (initializedFromKey.current === graphKey) return;
    initializedFromKey.current = graphKey;
    const laidOut = getLayoutedElements(baseNodes, baseEdges, 'LR');
    setEditorNodes(laidOut.nodes);
    setEditorEdges(laidOut.edges);
  }, [editable, graphKey, baseNodes, baseEdges]);

  const nodes = editable ? editorNodes : readonlyGraph.nodes;
  const edges = editable ? editorEdges : readonlyGraph.edges;

  useEffect(() => {
    if (!editable || !onAutomataChange) return;
    onAutomataChange(buildAutomatonFromElements(nodes, edges));
  }, [editable, edges, nodes, onAutomataChange]);

  useEffect(() => {
    if (!editable || !actionRequest) return;
    const actionKey = `${actionRequest.type}:${actionRequest.at}`;
    if (lastActionKey.current === actionKey) return;
    lastActionKey.current = actionKey;

    if (actionRequest.type === 'add_state') {
      const nextId = editorNodes.length ? Math.max(...editorNodes.map((n) => Number(n.id))) + 1 : 0;
      setEditorNodes((prev) => [...prev, toNode({ id: nextId, isStart: prev.length === 0, isFinal: false }, prev.length)]);
    } else if (actionRequest.type === 'delete_selected' && selectedElement) {
      if (selectedElement.kind === 'node') {
        setEditorNodes((prev) => prev.filter((n) => n.id !== selectedElement.id));
        setEditorEdges((prev) => prev.filter((e) => e.source !== selectedElement.id && e.target !== selectedElement.id));
      } else if (selectedElement.kind === 'edge') {
        setEditorEdges((prev) => prev.filter((e) => e.id !== selectedElement.id));
      }
    } else if (actionRequest.type === 'clear') {
      setEditorNodes([toNode({ id: 0, isStart: true, isFinal: false }, 0)]);
      setEditorEdges([]);
    } else if (actionRequest.type === 'auto_layout') {
      const laidOut = getLayoutedElements(editorNodes, editorEdges, 'LR');
      setEditorNodes(laidOut.nodes);
      setEditorEdges(laidOut.edges);
    }
    if (onActionHandled) onActionHandled(actionKey);
  }, [actionRequest, editable, editorEdges, editorNodes, onActionHandled, selectedElement]);

  // Custom node styles
  const nodeStyle = useCallback(node => {
    const { isStart, isAccept, isTrace } = node.data;
    const baseStyle = {
      width: 80,
      height: 80,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '13px',
      fontFamily: 'monospace',
      cursor: editable ? 'pointer' : 'default',
      border: '2px solid',
      position: 'relative',
      zIndex: isTrace ? 10 : 1,
    };

    if (isTrace) {
      return {
        ...baseStyle,
        background: 'var(--accent-subtle)',
        borderColor: 'var(--accent)',
        color: 'var(--text-primary)',
        boxShadow: '0 0 0 4px rgba(255, 122, 59, 0.15)',
      };
    }

    if (isAccept) {
      return {
        ...baseStyle,
        background: 'var(--surface-2)',
        borderColor: 'var(--accent)',
        color: 'var(--text-primary)',
      };
    }

    return {
      ...baseStyle,
      background: 'var(--surface-2)',
      borderColor: 'var(--border-strong)',
      color: 'var(--text-primary)',
    };
  }, [editable]);

  // Start arrow indicator
  const startMarker = nodes
    .filter(n => n.data.isStart)
    .map(node => (
      <div
        key={`start-${node.id}`}
        style={{
          position: 'absolute',
          left: node.position.x - 30,
          top: node.position.y + 30,
          width: 30,
          height: 2,
          background: 'var(--text-tertiary)',
          pointerEvents: 'none',
        }}
      />
    ));

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 320, position: 'relative' }}>
      {!nodes.length && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          color: 'var(--text-tertiary)',
          zIndex: 5,
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 40, opacity: 0.25 }}>◎</div>
          <p style={{ fontSize: 13 }}>
            No automata yet — press <strong style={{ color: 'var(--accent)' }}>Auto-generate</strong>
          </p>
        </div>
      )}
      <ReactFlow
        nodes={nodes.map(node => ({
          ...node,
          style: nodeStyle(node),
        }))}
        edges={edges.map(edge => ({
          ...edge,
          style: {
            stroke: edge.data?.isTrace ? 'var(--accent)' : 'var(--border-strong)',
            strokeWidth: edge.data?.isTrace ? 2.5 : 1.5,
          },
          markerEnd: {
            type: 'arrowclosed',
            color: edge.data?.isTrace ? 'var(--accent)' : 'var(--border-strong)',
          },
          labelStyle: {
            fill: edge.data?.isTrace ? 'var(--accent)' : 'var(--text-tertiary)',
            fontWeight: 'bold',
            fontSize: '11px',
            background: 'var(--surface-0)',
            padding: '2px 6px',
            borderRadius: '4px',
          },
        }))}
        onNodesChange={(changes) => {
          if (!editable) return;
          setEditorNodes((prev) => applyNodeChanges(changes, prev));
        }}
        onEdgesChange={(changes) => {
          if (!editable) return;
          setEditorEdges((prev) => applyEdgeChanges(changes, prev));
        }}
        onNodeClick={(_, node) => onSelectionChange?.({ kind: 'node', id: node.id })}
        onEdgeClick={(_, edge) => onSelectionChange?.({ kind: 'edge', id: edge.id })}
        onConnect={(connection) => {
          if (!editable) return;
          const symbol = window.prompt('Transition symbol (single char or ε):', 'a');
          if (!symbol) return;
          if (mode === 'DFA' && symbol === 'ε') {
            window.alert('DFA mode does not allow epsilon transitions.');
            return;
          }
          if (mode === 'DFA') {
            const duplicate = edges.some((e) => e.source === connection.source && e.label === symbol);
            if (duplicate) {
              window.alert('DFA mode allows only one transition per symbol per source state.');
              return;
            }
          }
          setEditorEdges((eds) =>
            addEdge(
              {
                ...connection,
                label: symbol,
                markerEnd: { type: MarkerType.ArrowClosed },
                data: { isTrace: false },
              },
              eds
            )
          );
        }}
        onNodeDoubleClick={(_, node) => {
          if (!editable) return;
          const action = window.prompt('Action: start | final | delete', 'final');
          if (!action) return;
          if (action === 'delete') {
            setEditorEdges((prev) => prev.filter((e) => e.source !== node.id && e.target !== node.id));
            setEditorNodes((prev) => prev.filter((n) => n.id !== node.id));
          } else if (action === 'start') {
            setEditorNodes((prev) =>
              prev.map((n) => ({
                ...n,
                data: { ...n.data, isStart: n.id === node.id },
              }))
            );
          } else if (action === 'final') {
            setEditorNodes((prev) =>
              prev.map((n) =>
                n.id === node.id ? { ...n, data: { ...n.data, isAccept: !n.data.isAccept } } : n
              )
            );
          }
        }}
        onEdgeDoubleClick={(_, edge) => {
          if (!editable) return;
          const next = window.prompt('Edit transition symbol (or type delete):', String(edge.label || ''));
          if (!next) return;
          if (next.toLowerCase() === 'delete') {
            setEditorEdges((prev) => prev.filter((e) => e.id !== edge.id));
            return;
          }
          if (mode === 'DFA' && next === 'ε') {
            window.alert('DFA mode does not allow epsilon transitions.');
            return;
          }
          setEditorEdges((prev) => prev.map((e) => (e.id === edge.id ? { ...e, label: next } : e)));
        }}
        nodesConnectable={editable}
        elementsSelectable={editable}
        nodesDraggable={editable}
        fitView
      >
        <Background color="var(--border)" gap={16} size={0.5} />
        <Controls showFitView showZoom showInteractive={editable} />
        {startMarker}
      </ReactFlow>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'var(--surface-0)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 12,
          fontSize: 11,
          color: 'var(--text-secondary)',
          zIndex: 100,
          pointerEvents: 'none',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '2px solid var(--accent)',
              background: 'var(--surface-2)',
            }}
          />
          <span>Accept state</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '2px solid var(--accent)',
              background: 'var(--accent-subtle)',
              boxShadow: '0 0 0 2px rgba(255, 122, 59, 0.15)',
            }}
          />
          <span>Trace active</span>
        </div>
      </div>
    </div>
  );
}
