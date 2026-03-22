const fs = require('fs');

let indexJs = fs.readFileSync('server/index.js', 'utf8');
if (!indexJs.includes('./routes/dfa')) {
  indexJs = indexJs.replace(""app.use('/api', compileRouter);"", ""app.use('/api', compileRouter);\napp.use('/api/dfa', require('./routes/dfa'));"");
  fs.writeFileSync('server/index.js', indexJs);
}

fs.mkdirSync('server/routes', { recursive: true });
fs.writeFileSync('server/routes/dfa.js', const express = require('express');
const router = express.Router();

const CANONICAL_STATES = [
  { id: 'START',  label: 'Start',  isStart: true,  isAccept: false, x: 100, y: 200 },
  { id: 'IDENT',  label: 'Ident',  isStart: false, isAccept: true,  x: 300, y: 100 },
  { id: 'NUMBER', label: 'Number', isStart: false, isAccept: true,  x: 300, y: 300 },
  { id: 'OP',     label: 'Op',     isStart: false, isAccept: true,  x: 500, y: 200 },
  { id: 'ACCEPT', label: 'Accept', isStart: false, isAccept: true,  x: 700, y: 200 },
];

const CANONICAL_TRANSITIONS = [
  { id: 't1', from: 'START', to: 'IDENT',  label: 'a-z A-Z _'  },
  { id: 't2', from: 'START', to: 'NUMBER', label: '0-9'         },
  { id: 't3', from: 'START', to: 'OP',     label: '+ - * / < >' },
  { id: 't4', from: 'IDENT', to: 'IDENT',  label: 'a-z 0-9 _'  },
  { id: 't5', from: 'IDENT', to: 'ACCEPT', label: 'other'       },
  { id: 't6', from: 'NUMBER',to: 'NUMBER', label: '0-9'         },
  { id: 't7', from: 'NUMBER',to: 'ACCEPT', label: 'other'       },
  { id: 't8', from: 'OP',    to: 'OP',     label: '= >'         },
  { id: 't9', from: 'OP',    to: 'ACCEPT', label: 'other'       },
];

router.post('/extract', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'No code' });

  const hasIdent  = /\\b[a-zA-Z_]\\w*\\b/.test(code);
  const hasNumber = /\\b\\d+\\b/.test(code);
  const hasOp     = /[+\\-*\\/<>=!&|]/.test(code);

  const relevantStates = new Set(['START', 'ACCEPT']);
  if (hasIdent)  relevantStates.add('IDENT');
  if (hasNumber) relevantStates.add('NUMBER');
  if (hasOp)     relevantStates.add('OP');

  const states = CANONICAL_STATES.filter(s => relevantStates.has(s.id));
  const transitions = CANONICAL_TRANSITIONS.filter(
    t => relevantStates.has(t.from) && relevantStates.has(t.to)
  );

  res.json({
    ok:            true,
    states,
    transitions,
    relevantTypes: [...relevantStates],
    totalStates:   states.length,
    totalEdges:    transitions.length,
  });
});

module.exports = router;);

// ensure client dirs exist
fs.mkdirSync('client/src/store', { recursive: true });
fs.mkdirSync('client/src/utils', { recursive: true });
fs.mkdirSync('client/src/components/dfa', { recursive: true });

// store/useDFAStore.js
fs.writeFileSync('client/src/store/useDFAStore.js', import React, { createContext, useContext, useReducer } from 'react';

const initialState = {
  mode: 'user',
  userGraph: { nodes: [], edges: [] },
  autoGraph: { nodes: [], edges: [] },
  validation: { score: 0, correct: [], missing: [], wrong: [], extra: [], missingNodes: [], feedback: [] },
  history: [],
  historyIndex: -1,
  selectedNode: null,
  selectedEdge: null,
  isLoading: false,
  error: null,
};

function copyGraph(graph) {
  return {
    nodes: graph.nodes.map(n => ({...n})),
    edges: graph.edges.map(e => ({...e}))
  };
}

function pushHistory(state, newGraph) {
  const nextHistory = state.history.slice(0, state.historyIndex + 1);
  nextHistory.push(copyGraph(state.userGraph));
  if (nextHistory.length > 50) nextHistory.shift();
  return {
    ...state,
    userGraph: newGraph,
    history: nextHistory,
    historyIndex: nextHistory.length - 1,
  };
}

function dfaReducer(state, action) {
  switch (action.type) {
    case 'SET_MODE': return { ...state, mode: action.payload };
    case 'SET_AUTO_GRAPH': return { ...state, autoGraph: action.payload };
    case 'SET_VALIDATION': return { ...state, validation: action.payload };
    case 'SET_SELECTED_NODE': return { ...state, selectedNode: action.payload };
    case 'SET_SELECTED_EDGE': return { ...state, selectedEdge: action.payload };
    
    case 'ADD_NODE': {
      const g = copyGraph(state.userGraph);
      g.nodes.push(action.payload);
      return pushHistory(state, g);
    }
    case 'UPDATE_NODE': {
      const g = copyGraph(state.userGraph);
      const idx = g.nodes.findIndex(n => n.id === action.payload.id);
      if (idx !== -1) g.nodes[idx] = { ...g.nodes[idx], ...action.payload };
      return pushHistory(state, g);
    }
    case 'DELETE_NODE': {
      const g = copyGraph(state.userGraph);
      g.nodes = g.nodes.filter(n => n.id !== action.payload);
      g.edges = g.edges.filter(e => e.from !== action.payload && e.to !== action.payload);
      return pushHistory(state, g);
    }
    case 'ADD_EDGE': {
      const g = copyGraph(state.userGraph);
      g.edges.push(action.payload);
      return pushHistory(state, g);
    }
    case 'UPDATE_EDGE': {
      const g = copyGraph(state.userGraph);
      const idx = g.edges.findIndex(e => e.id === action.payload.id);
      if (idx !== -1) g.edges[idx] = { ...g.edges[idx], ...action.payload };
      return pushHistory(state, g);
    }
    case 'DELETE_EDGE': {
      const g = copyGraph(state.userGraph);
      g.edges = g.edges.filter(e => e.id !== action.payload);
      return pushHistory(state, g);
    }
    
    case 'UNDO': {
      if (state.historyIndex < 0) return state;
      const prevGraph = state.history[state.historyIndex];
      // if it's the last undo step, we should also save the current graph if not saved so we can redo.
      // Wait, standard undo logic:
      return {
        ...state,
        userGraph: prevGraph,
        historyIndex: state.historyIndex - 1,
      };
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 2) return state;
      return {
        ...state,
        userGraph: state.history[state.historyIndex + 2], // skip the current state saved in history
        historyIndex: state.historyIndex + 1,
      };
    }
    case 'CLEAR_USER_GRAPH': {
      return pushHistory(state, { nodes: [], edges: [] });
    }
    
    case 'SET_LOADING': return { ...state, isLoading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    default: return state;
  }
}

const DFAContext = createContext(null);

export function DFAProvider({ children }) {
  const [state, dispatch] = useReducer(dfaReducer, initialState);
  return (
    <DFAContext.Provider value={{ state, dispatch }}>
      {children}
    </DFAContext.Provider>
  );
}

export function useDFA() {
  const context = useContext(DFAContext);
  if (!context) throw new Error('useDFA must be used within DFAProvider');
  return context;
}
);

// utils/dfaGenerator.js
fs.writeFileSync('client/src/utils/dfaGenerator.js', export async function generateDFA(code) {
  const res = await fetch('/api/dfa/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error('DFA generation failed');
  return res.json();
}
);

// utils/dfaValidator.js
fs.writeFileSync('client/src/utils/dfaValidator.js', export function validateDFA(userGraph, autoGraph) {
  const result = {
    score:        0,
    correct:      [],
    missing:      [],
    wrong:        [],
    extra:        [],
    missingNodes: [],
    feedback:     [],
  };

  if (!autoGraph.edges.length) return result;

  for (const autoNode of autoGraph.nodes) {
    const found = userGraph.nodes.find(
      n => n.label.trim().toLowerCase() === autoNode.label.trim().toLowerCase()
    );
    if (!found) {
      result.missingNodes.push(autoNode.label);
      result.feedback.push(\Missing state: "\"\);
    }
  }

  for (const autoEdge of autoGraph.edges) {
    const autoFrom = autoGraph.nodes.find(n => n.id === autoEdge.from)?.label || autoEdge.from;
    const autoTo = autoGraph.nodes.find(n => n.id === autoEdge.to)?.label || autoEdge.to;

    const userFromNode = userGraph.nodes.find(n => n.label.trim().toLowerCase() === autoFrom.trim().toLowerCase());
    const userToNode = userGraph.nodes.find(n => n.label.trim().toLowerCase() === autoTo.trim().toLowerCase());

    if (!userFromNode || !userToNode) {
      result.missing.push({ from: autoFrom, to: autoTo, label: autoEdge.label, expected: autoEdge.label });
      result.feedback.push(\Missing transition: \ ? \ on "\"\);
      continue;
    }

    const userEdge = userGraph.edges.find(e => e.from === userFromNode.id && e.to === userToNode.id);

    if (!userEdge) {
      result.missing.push({ from: autoFrom, to: autoTo, label: autoEdge.label, expected: autoEdge.label });
      result.feedback.push(\Missing transition: \ ? \ on "\"\);
    } else if (userEdge.label.trim().toLowerCase() !== autoEdge.label.trim().toLowerCase()) {
      result.wrong.push({ edgeId: userEdge.id, expected: autoEdge.label, actual: userEdge.label });
      result.feedback.push(\Wrong label on \ ? \: you wrote "\", expected "\"\);
    } else {
      result.correct.push(userEdge.id);
    }
  }

  for (const userEdge of userGraph.edges) {
    const isCorrect = result.correct.includes(userEdge.id);
    const isWrong   = result.wrong.some(w => w.edgeId === userEdge.id);
    if (!isCorrect && !isWrong) {
      result.extra.push(userEdge.id);
      const fromLabel = userGraph.nodes.find(n => n.id === userEdge.from)?.label || '?';
      const toLabel = userGraph.nodes.find(n => n.id === userEdge.to)?.label || '?';
      result.feedback.push(\Extra transition: \ ? \ on "\" (not in auto DFA)\);
    }
  }

  const totalExpected = autoGraph.edges.length;
  const correctCount  = result.correct.length;
  result.score = totalExpected > 0 ? Math.round((correctCount / totalExpected) * 100) : 0;

  return result;
}
);

console.log("Done generating utils and store and api endpoints.");
