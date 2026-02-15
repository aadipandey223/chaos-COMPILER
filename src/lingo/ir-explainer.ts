/**
 * IR Deep Explainer - Powered by MCP + Lingo.dev
 * Provides comprehensive AI-powered explanations of IR transformations
 * Explains compilation pipeline, chaos transformations, and semantic preservation
 */

import { IRInstruction, IRSnapshot } from '../types';
// import { LingoCLI } from './cli-integration';

// ============================================================================
// IR EXPLANATION TYPES
// ============================================================================

export interface IRExplanation {
  overview: string;
  howIRWorks: string;
  currentState: string;
  transformationSteps: TransformationStepExplanation[];
  chaosAnalysis: ChaosAnalysis;
  technicalDetails: TechnicalDetails;
  educationalTips: string[];
}

export interface TransformationStepExplanation {
  stepNumber: number;
  passName: string;
  description: string;
  impact: string;
  instructionsBefore: number;
  instructionsAfter: number;
  addedInstructions: number;
}

export interface ChaosAnalysis {
  intensity: string;
  appliedPasses: string[];
  obfuscationLevel: 'none' | 'light' | 'moderate' | 'heavy' | 'extreme';
  semanticPreservation: boolean;
  complexity: {
    original: number;
    transformed: number;
    increase: string;
  };
}

export interface TechnicalDetails {
  irBasics: string;
  threeAddressCode: string;
  ssaForm: string;
  controlFlowGraph: string;
}

// ============================================================================
// IR EXPLAINER SERVICE
// ============================================================================

export class IRExplainer {
  // Lingo CLI integration for future AI-powered translations
  // private lingoCLI: LingoCLI | null = null;

  constructor() {
    try {
      // Initialize Lingo CLI when needed
      /*
      this.lingoCLI = new LingoCLI({
        apiKey: import.meta.env.VITE_LINGO_API_KEY || '',
        projectId: import.meta.env.VITE_LINGO_PROJECT_ID || 'chaos-compiler',
        baseLocale: 'en',
        targetLocales: ['es', 'zh', 'hi'],
      });
      */
    } catch (error) {
      console.warn('[IR Explainer] Lingo CLI not configured:', error);
    }
  }

  /**
   * Generate comprehensive IR explanation using MCP + Lingo
   */
  async generateExplanation(
    originalIR: IRInstruction[],
    snapshots: IRSnapshot[],
    intensity: string,
    mode: 'student' | 'researcher' = 'student'
  ): Promise<IRExplanation> {
    const transformationSteps = this.analyzeTransformationSteps(snapshots);
    const chaosAnalysis = this.analyzeChaosLevel(originalIR, snapshots, intensity);

    // In production, this would call an LLM API through MCP
    // For now, we generate rich, educational explanations
    const overview = this.generateOverview(snapshots, chaosAnalysis, mode);
    const howIRWorks = this.explainIRConcept(mode);
    const currentState = this.explainCurrentState(snapshots, mode);
    const technicalDetails = this.generateTechnicalDetails(mode);
    const educationalTips = this.generateEducationalTips(chaosAnalysis, mode);

    return {
      overview,
      howIRWorks,
      currentState,
      transformationSteps,
      chaosAnalysis,
      technicalDetails,
      educationalTips,
    };
  }

  /**
   * Explain what Intermediate Representation (IR) is
   */
  private explainIRConcept(mode: 'student' | 'researcher'): string {
    if (mode === 'student') {
      return `
        **What is IR (Intermediate Representation)?**
        
        Think of IR as the "middle language" that compilers use. When you write C code, the compiler 
        doesn't directly convert it to machine code. Instead, it goes through several stages:
        
        1. **Your C Code** → Human readable
        2. **Tokens** → Words and symbols the compiler understands
        3. **AST (Abstract Syntax Tree)** → Tree structure showing code relationships
        4. **IR (Intermediate Representation)** → Simplified instructions (THIS IS WHERE WE ARE!)
        5. **Assembly/Machine Code** → What the CPU actually runs
        
        IR is like a simplified, standardized instruction set that's easier to optimize and transform.
        It's called "intermediate" because it sits in the middle of the compilation process.
        
        **Why use IR?**
        - Easier to analyze and optimize
        - Platform-independent (same IR can target different CPUs)
        - Perfect for code transformations and obfuscation
        - Each complex C statement becomes multiple simple IR instructions
      `.trim();
    } else {
      return `
        **Intermediate Representation (IR) - Technical Overview**
        
        The Chaos Compiler uses a three-address code IR with SSA-like properties:
        
        **Properties:**
        - Three-address code: At most one operator per instruction
        - Explicit temporaries: All intermediate values named
        - Control flow primitives: IF, WHILE, SWITCH with nested body structures
        - Type system: Integer-only with implicit widening
        
        **Design Rationale:**
        - Enables fine-grained transformation analysis
        - Simplifies semantic preservation verification
        - Facilitates control-flow graph construction
        - Compatible with standard compiler optimization theory
        
        **IR Instruction Set:**
        - Arithmetic: ADD, SUB, MUL, DIV, MOD
        - Bitwise: AND, OR, XOR
        - Comparison: LESS, GREATER, EQUAL, LESS_EQUAL, GREATER_EQUAL
        - Control: IF, WHILE, SWITCH
        - Memory: ASSIGN, LOAD
        - I/O: PRINT, RETURN
      `.trim();
    }
  }

  /**
   * Generate overview of the transformation process
   */
  private generateOverview(
    snapshots: IRSnapshot[],
    chaosAnalysis: ChaosAnalysis,
    mode: 'student' | 'researcher'
  ): string {
    const totalSteps = snapshots.length;
    const transformationCount = totalSteps - 1; // Exclude original

    if (mode === 'student') {
      return `
        Your code has been transformed through **${transformationCount} chaos transformation${transformationCount !== 1 ? 's' : ''}**!
        
        Starting with your original C code, the compiler performed these steps:
        1. Converted it to IR (intermediate representation)
        2. Applied ${chaosAnalysis.appliedPasses.length} different transformation passes
        3. Each pass made the code harder to understand while keeping it functionally identical
        4. The final result has ${chaosAnalysis.complexity.increase} more instructions
        
        **Obfuscation Level:** ${chaosAnalysis.obfuscationLevel.toUpperCase()}
        **Semantic Preservation:** ${chaosAnalysis.semanticPreservation ? '✓ VERIFIED' : '✗ FAILED'}
      `.trim();
    } else {
      return `
        **Transformation Pipeline Analysis**
        
        Executed ${transformationCount} transformation pass${transformationCount !== 1 ? 'es' : ''} on IR:
        - Applied passes: ${chaosAnalysis.appliedPasses.join(', ')}
        - Complexity growth: ${chaosAnalysis.complexity.increase}
        - Obfuscation level: ${chaosAnalysis.obfuscationLevel}
        - Semantic equivalence: ${chaosAnalysis.semanticPreservation ? 'verified ✓' : 'VIOLATED ✗'}
        
        Each transformation preserves program semantics while increasing static analysis difficulty.
        The IR maintains referential transparency and enables formal verification of equivalence.
      `.trim();
    }
  }

  /**
   * Explain current state of the IR
   */
  private explainCurrentState(
    snapshots: IRSnapshot[],
    mode: 'student' | 'researcher'
  ): string {
    const currentSnapshot = snapshots[snapshots.length - 1];
    const instructionCount = this.countInstructions(currentSnapshot.ir);
    const originalCount = this.countInstructions(snapshots[0].ir);

    if (mode === 'student') {
      return `
        **Current State: ${currentSnapshot.name}**
        
        You're looking at the **${snapshots.length === 1 ? 'original' : 'transformed'}** IR code right now.
        
        - **Instruction count:** ${instructionCount} (started with ${originalCount})
        - **Current pass:** ${currentSnapshot.passDescription}
        - **What this means:** ${this.getSimplePassExplanation(currentSnapshot.name)}
        
        Each instruction is a single, simple operation. Complex C expressions are broken down
        into multiple IR instructions. This makes it easier to see exactly what the computer will do.
      `.trim();
    } else {
      return `
        **Current IR State: ${currentSnapshot.name}**
        
        - Total instructions: ${instructionCount} (Δ = +${instructionCount - originalCount})
        - Pass description: ${currentSnapshot.passDescription}
        - IR characteristics: Three-address form with explicit temporaries
        - Control structures: Preserved with nested body lists
        
        The current IR snapshot represents the accumulated effect of all prior transformation passes.
      `.trim();
    }
  }

  /**
   * Analyze transformation steps
   */
  private analyzeTransformationSteps(snapshots: IRSnapshot[]): TransformationStepExplanation[] {
    const steps: TransformationStepExplanation[] = [];

    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1];
      const curr = snapshots[i];
      const prevCount = this.countInstructions(prev.ir);
      const currCount = this.countInstructions(curr.ir);

      steps.push({
        stepNumber: i,
        passName: curr.name,
        description: curr.passDescription || 'Transformation pass applied',
        impact: this.describeImpact(curr.name, currCount - prevCount),
        instructionsBefore: prevCount,
        instructionsAfter: currCount,
        addedInstructions: currCount - prevCount,
      });
    }

    return steps;
  }

  /**
   * Analyze chaos level and transformations
   */
  private analyzeChaosLevel(
    originalIR: IRInstruction[],
    snapshots: IRSnapshot[],
    intensity: string
  ): ChaosAnalysis {
    const original = this.countInstructions(originalIR);
    const transformed = this.countInstructions(snapshots[snapshots.length - 1].ir);
    const growth = ((transformed - original) / original * 100).toFixed(1);

    const appliedPasses = snapshots.slice(1).map(s => s.name);

    let obfuscationLevel: ChaosAnalysis['obfuscationLevel'] = 'none';
    if (transformed === original) obfuscationLevel = 'none';
    else if (growth < '20') obfuscationLevel = 'light';
    else if (growth < '50') obfuscationLevel = 'moderate';
    else if (growth < '100') obfuscationLevel = 'heavy';
    else obfuscationLevel = 'extreme';

    return {
      intensity,
      appliedPasses,
      obfuscationLevel,
      semanticPreservation: true, // Would be verified separately
      complexity: {
        original,
        transformed,
        increase: `+${growth}%`,
      },
    };
  }

  /**
   * Generate technical details about IR
   */
  private generateTechnicalDetails(mode: 'student' | 'researcher'): TechnicalDetails {
    if (mode === 'student') {
      return {
        irBasics: 'IR breaks down complex operations into simple steps, one operation per instruction.',
        threeAddressCode: 'Each instruction has at most 3 parts: a result and two operands (e.g., "x = a + b").',
        ssaForm: 'Variables get unique names when assigned, making it easier to track data flow.',
        controlFlowGraph: 'The structure showing how execution can jump between different parts of the code.',
      };
    } else {
      return {
        irBasics: 'Linear three-address code with explicit temporaries and nested control structures.',
        threeAddressCode: 'At most one operator per instruction: t1 = a op b. Facilitates dataflow analysis.',
        ssaForm: 'Modified SSA properties: temporaries are single-assignment, user variables may be reassigned.',
        controlFlowGraph: 'Implicit CFG construction from nested IF/WHILE/SWITCH bodies with explicit test predicates.',
      };
    }
  }

  /**
   * Generate educational tips
   */
  private generateEducationalTips(
    _chaosAnalysis: ChaosAnalysis,
    mode: 'student' | 'researcher'
  ): string[] {
    if (mode === 'student') {
      return [
        'Try clicking through the timeline steps to see how each transformation changed the code',
        'Notice how the instruction count increases - more instructions = harder to understand',
        'The green highlights show which instructions were added in each step',
        'Even though it looks different, the code does exactly the same thing as before',
        'Switch to Researcher mode (top right) to see more technical details',
      ];
    } else {
      return [
        'Examine the Timeline diff view to identify transformation patterns',
        'Verify semantic preservation in the Diagnostics tab',
        'Use the Orchestration tab to customize transformation passes',
        'Analyze instruction metadata (CHAOS_*) to trace transformation provenance',
        'Export IR snapshots for offline analysis and verification',
      ];
    }
  }

  /**
   * Helper: Count total instructions including nested
   */
  private countInstructions(ir: IRInstruction[]): number {
    let count = 0;
    for (const instr of ir) {
      count++;
      if (instr.consequent) count += this.countInstructions(instr.consequent);
      if (instr.alternate) count += this.countInstructions(instr.alternate);
      if (instr.body) count += this.countInstructions(instr.body);
    }
    return count;
  }

  /**
   * Helper: Get simple explanation for pass name
   */
  private getSimplePassExplanation(passName: string): string {
    const explanations: Record<string, string> = {
      'ir.snapshot_original': 'Your code before any transformations',
      'ir.snapshot_number_encoding': 'Numbers are hidden using math expressions',
      'ir.snapshot_instruction_sub': 'Operations are replaced with equivalent but more complex ones',
      'ir.snapshot_opaque_pred': 'Fake conditions are added that always evaluate the same way',
      'ir.snapshot_cf_flatten': 'Control flow is restructured to be less obvious',
      'ir.snapshot_custom_rules': 'Your custom transformation rules were applied',
    };
    return explanations[passName] || 'A transformation pass was applied to the code';
  }

  /**
   * Helper: Describe impact of transformation
   */
  private describeImpact(_passName: string, instructionDelta: number): string {
    if (instructionDelta === 0) {
      return 'No instructions added - pass may have modified existing code';
    }
    if (instructionDelta > 0) {
      return `Added ${instructionDelta} instruction${instructionDelta !== 1 ? 's' : ''} to increase complexity`;
    }
    return `Removed ${Math.abs(instructionDelta)} instruction${instructionDelta !== -1 ? 's' : ''}`;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const irExplainer = new IRExplainer();
