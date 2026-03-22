import React, { createContext, useContext, useReducer } from 'react';

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
        userGraph: state.history[state.historyIndex + 2],
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