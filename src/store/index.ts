import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Mode,
  Program,
  IRInstruction,
  IRSnapshot,
  Diagnostic,
  LingoValidationReport,
  ExecutionResult,
  ChaosConfig,
  RuleHits,
} from '../types';
import { Lexer } from '../compiler/lexer';
import { Parser } from '../compiler/parser';
import { generateIR } from '../compiler/ir-generator';
import { verifySemanticPreservation } from '../compiler/ir-executor';
import { applyChaos, CHAOS_PRESETS, ChaosPreset } from '../compiler/chaos-engine';
import { diagnostics, emitSemanticVerificationDiagnostic } from '../compiler/diagnostics';
import { generateValidationReport } from '../lingo/validator';

// ============================================================================
// EXAMPLE CODE
// ============================================================================

export const EXAMPLES = {
  arithmetic: {
    label: 'Arithmetic',
    icon: '🔢',
    code: `// Arithmetic Example
int main() {
  int a = 10;
  int b = 20;
  int result = a + b;
  return result;
}`,
    description: 'Basic math operations with addition',
  },
  loops: {
    label: 'Loops',
    icon: '🔄',
    code: `// Loop Example
int main() {
  int sum = 0;
  int i = 1;
  while (i <= 5) {
    sum = sum + i;
    i = i + 1;
  }
  return sum;
}`,
    description: 'Iteration and accumulation',
  },
  branching: {
    label: 'Branching',
    icon: '🔀',
    code: `// Branching Example
int main() {
  int x = 15;
  int result;
  if (x > 10) {
    result = x * 2;
  } else {
    result = x + 5;
  }
  return result;
}`,
    description: 'Conditional logic with if/else',
  },
  obfuscation: {
    label: 'Obfuscation Demo',
    icon: '🔒',
    code: `// Obfuscation Demo
int main() {
  int a = 5;
  int b = 3;
  int c = (a + b) * 2;
  int result = c - a;
  return result;
}`,
    description: 'Complex transformations showcase',
  },
} as const;

export type ExampleKey = keyof typeof EXAMPLES;

// ============================================================================
// COMPILER STATE STORE
// ============================================================================

interface CompilerStore {
  // Mode
  mode: Mode;
  setMode: (mode: Mode) => void;

  // Source Code
  code: string;
  setCode: (code: string) => void;
  loadExample: (key: ExampleKey) => void;

  // Compilation State
  isCompiling: boolean;
  isCompiled: boolean;
  compilationError: string | null;

  // AST & IR
  ast: Program | null;
  originalIR: IRInstruction[];
  chaoticIR: IRInstruction[];
  snapshots: IRSnapshot[];

  // Diagnostics
  allDiagnostics: Diagnostic[];
  lingoReport: LingoValidationReport;

  // Execution
  executionResult: ExecutionResult | null;

  // Chaos Configuration
  chaosConfig: ChaosConfig;
  setChaosConfig: (config: Partial<ChaosConfig>) => void;
  applyPreset: (preset: ChaosPreset) => void;
  resetConfig: () => void;
  ruleHits: RuleHits;

  // Intensity
  intensity: 'none' | 'low' | 'medium' | 'high';
  setIntensity: (intensity: 'none' | 'low' | 'medium' | 'high') => void;

  // Actions
  compile: () => Promise<void>;
  reset: () => void;


}

const DEFAULT_CHAOS_CONFIG: ChaosConfig = {
  passes: {
    numberEncoding: true,
    substitution: true,
    opaquePredicates: false,
    flattening: false,
  },
  customRules: [],
  seed: 12345,
};

export const useCompilerStore = create<CompilerStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      mode: 'student',
      code: EXAMPLES.arithmetic.code,
      isCompiling: false,
      isCompiled: false,
      compilationError: null,
      ast: null,
      originalIR: [],
      chaoticIR: [],
      snapshots: [],
      allDiagnostics: [],
      lingoReport: {
        valid: true,
        errors: [],
        warnings: [],
        diagnosticCount: 0,
        validCount: 0,
        invalidCount: 0,
      },
      executionResult: null,
      chaosConfig: { ...DEFAULT_CHAOS_CONFIG },
      ruleHits: {},
      intensity: 'medium',


      // Actions
      setMode: (mode) => set({ mode }),

      setCode: (code) => set({ code }),

      loadExample: (key) => {
        const example = EXAMPLES[key];
        if (example) {
          set({ code: example.code, isCompiled: false, compilationError: null });
        }
      },

      setIntensity: (intensity) => set({ intensity }),

      setChaosConfig: (config) =>
        set((state) => ({
          chaosConfig: { ...state.chaosConfig, ...config },
        })),

      applyPreset: (preset) => {
        const presetConfig = CHAOS_PRESETS[preset];
        if (presetConfig) {
          // Create a mutable copy
          set({ 
            chaosConfig: { 
              passes: { ...presetConfig.passes },
              customRules: [...presetConfig.customRules],
              seed: presetConfig.seed,
            } 
          });
        }
      },

      resetConfig: () => set({ chaosConfig: { ...DEFAULT_CHAOS_CONFIG } }),



      compile: async () => {
        const { code, intensity, chaosConfig } = get();

        set({
          isCompiling: true,
          compilationError: null,
          isCompiled: false,
        });

        try {
          // Clear previous diagnostics
          diagnostics.clear();

          // Lexical Analysis
          const lexer = new Lexer(code);
          const tokens = lexer.tokenize();

          // Parsing
          const parser = new Parser(tokens);
          const ast = parser.parse();

          // IR Generation
          const originalIR = generateIR(ast);

          // Apply Chaos Transformations
          const chaosResult = applyChaos(
            originalIR,
            intensity,
            chaosConfig.seed,
            chaosConfig
          );

          // Execute transformed IR
          const verification = verifySemanticPreservation(
            originalIR,
            chaosResult.ir
          );

          // Emit semantic verification diagnostic
          emitSemanticVerificationDiagnostic(
            verification.original,
            verification.transformed,
            verification.match
          );

          // Get all diagnostics
          let allDiags = diagnostics.getAll();



          // Validate with Lingo
          const lingoReport = generateValidationReport(allDiags);

          set({
            ast,
            originalIR,
            chaoticIR: chaosResult.ir,
            snapshots: chaosResult.snapshots,
            ruleHits: chaosResult.ruleHits,
            allDiagnostics: allDiags,
            lingoReport,
            executionResult: {
              original: verification.original,
              transformed: verification.transformed,
              match: verification.match,
              stdout: verification.stdout,
            },
            isCompiling: false,
            isCompiled: true,
            compilationError: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({
            isCompiling: false,
            isCompiled: false,
            compilationError: errorMessage,
          });
        }
      },

      reset: () =>
        set({
          isCompiled: false,
          compilationError: null,
          ast: null,
          originalIR: [],
          chaoticIR: [],
          snapshots: [],
          allDiagnostics: [],
          lingoReport: {
            valid: true,
            errors: [],
            warnings: [],
            diagnosticCount: 0,
            validCount: 0,
            invalidCount: 0,
          },
          executionResult: null,
          ruleHits: {},
        }),
    }),
    { name: 'compiler-store' }
  )
);

// ============================================================================
// UI STATE STORE
// ============================================================================

interface UIStore {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedSnapshotIndex: number;
  setSelectedSnapshotIndex: (index: number) => void;
  showGuidedTour: boolean;
  setShowGuidedTour: (show: boolean) => void;
  guidedTourStep: number;
  setGuidedTourStep: (step: number) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      activeTab: 'editor',
      setActiveTab: (tab) => set({ activeTab: tab }),
      selectedSnapshotIndex: 0,
      setSelectedSnapshotIndex: (index) => set({ selectedSnapshotIndex: index }),
      showGuidedTour: true,
      setShowGuidedTour: (show) => set({ showGuidedTour: show }),
      guidedTourStep: 0,
      setGuidedTourStep: (step) => set({ guidedTourStep: step }),
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        showGuidedTour: state.showGuidedTour,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
