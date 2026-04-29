import { create } from 'zustand';

const useCompilerStore = create((set) => ({
  code: 'int main() {\n    return 0;\n}',
  tokens: [],
  dfa: null,
  parseSteps: [],
  parseTree: null,
  semantic: {},
  intermediateCode: [],
  setCode: (code) => set({ code }),
  setCompilationResults: (results) => set({ ...results }),
}));

export default useCompilerStore;
