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
import { MCP } from '../mcp';

// ============================================================================
// EXAMPLE CODE
// ============================================================================

export const EXAMPLES = {
  fibonacci: {
    label: 'Fibonacci Recursion',
    icon: '🌀',
    code: `// Recursive Fibonacci
int fib(int n) {
  if (n <= 1) {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}

int main() {
  int result = fib(8);
  return result;
}`,
    description: 'Recursive function calls - Advanced',
  },
  nestedLoops: {
    label: 'Nested Loops',
    icon: '🔄',
    code: `// Matrix Multiplication Pattern
int main() {
  int sum = 0;
  int i = 0;
  int j = 0;
  
  while (i < 5) {
    j = 0;
    while (j < 5) {
      sum = sum + (i * j);
      j = j + 1;
    }
    i = i + 1;
  }
  return sum;
}`,
    description: 'Double nested loops - Advanced',
  },
  complexBranching: {
    label: 'Complex Branching',
    icon: '🔀',
    code: `// Complex Decision Tree
int classify(int score) {
  int grade;
  if (score >= 90) {
    grade = 4;
  } else {
    if (score >= 80) {
      grade = 3;
    } else {
      if (score >= 70) {
        grade = 2;
      } else {
        grade = 1;
      }
    }
  }
  return grade;
}

int main() {
  int result = classify(85);
  return result;
}`,
    description: 'Nested conditionals - Advanced',
  },
  bitwiseOps: {
    label: 'Bitwise Algorithms',
    icon: '⚡',
    code: `// Bitwise Power of Two Check
int isPowerOfTwo(int n) {
  if (n <= 0) {
    return 0;
  }
  return (n & (n - 1)) == 0;
}

int main() {
  int test1 = isPowerOfTwo(16);
  int test2 = isPowerOfTwo(15);
  int result = test1 + test2;
  return result;
}`,
    description: 'Bitwise operations - Expert',
  },
  factorial: {
    label: 'Factorial Loop',
    icon: '📐',
    code: `// Iterative Factorial
int factorial(int n) {
  int result = 1;
  int i = 1;
  while (i <= n) {
    result = result * i;
    i = i + 1;
  }
  return result;
}

int main() {
  int result = factorial(6);
  return result;
}`,
    description: 'Factorial computation - Intermediate',
  },
  primeCheck: {
    label: 'Prime Number',
    icon: '🔢',
    code: `// Prime Number Check
int isPrime(int n) {
  if (n <= 1) {
    return 0;
  }
  int i = 2;
  while (i * i <= n) {
    if (n % i == 0) {
      return 0;
    }
    i = i + 1;
  }
  return 1;
}

int main() {
  int result = isPrime(17);
  return result;
}`,
    description: 'Prime detection algorithm - Expert',
  },
  obfuscation: {
    label: 'Heavy Obfuscation',
    icon: '🔒',
    code: `// Complex Calculation
int compute(int x, int y) {
  int temp1 = (x * 2) + (y * 3);
  int temp2 = (temp1 & 15) | (y << 2);
  int temp3 = temp2 ^ (x + y);
  return temp3;
}

int main() {
  int a = 7;
  int b = 11;
  int result = compute(a, b);
  return result;
}`,
    description: 'Maximum chaos transformations - Expert',
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
      code: EXAMPLES.factorial.code,
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

          // Get all diagnostics and enrich with MCP explanations
          const mode = get().mode;
          let allDiags = diagnostics.getAll().map(d => ({
            ...d,
            explanation: MCP.getExplanation(d.id, mode, d.params)
          }));

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
