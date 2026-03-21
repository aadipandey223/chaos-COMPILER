import React, { createContext, useContext, useReducer } from 'react';

const initialState = {
  code: `int add(int a, int b) {
    return a + b;
}

int main() {
    int x = 10;
    int y = 20;
    if (x < y) {
        x = x + 1;
    }
    return add(x, y);
}`,
  status: 'idle', // 'idle' | 'compiling' | 'success' | 'error'
  ast: null,
  mutations: [],
  warnings: null,
  error: null,
  options: {
    seed: '',
    intensity: 'low', // 'low' | 'medium' | 'high'
    enabledMutations: ['OPERATOR_MUTATION', 'CONDITION_FLIP', 'LITERAL_SHIFT', 'RETURN_SWAP', 'DEAD_CODE_INJECT'],
  }
};

const CompilerContext = createContext();

function compilerReducer(state, action) {
  switch (action.type) {
    case 'SET_CODE':
      return { ...state, code: action.payload };
    case 'SET_OPTIONS':
      return { ...state, options: { ...state.options, ...action.payload } };
    case 'COMPILE_START':
      return { ...state, status: 'compiling', error: null, warnings: null };
    case 'COMPILE_SUCCESS':
      return {
        ...state,
        status: 'success',
        ast: action.payload.ast,
        mutations: action.payload.mutations || [],
        warnings: action.payload.warnings || null,
        error: null
      };
    case 'COMPILE_ERROR':
      return { ...state, status: 'error', error: action.payload };
    default:
      return state;
  }
}

export function CompilerProvider({ children }) {
  const [state, dispatch] = useReducer(compilerReducer, initialState);
  return (
    <CompilerContext.Provider value={{ state, dispatch }}>
      {children}
    </CompilerContext.Provider>
  );
}

export function useCompiler() {
  const context = useContext(CompilerContext);
  if (!context) {
    throw new Error('useCompiler must be used within a CompilerProvider');
  }
  return context;
}
