import {
  IRInstruction,
  IRSnapshot,
  ChaosConfig,
  ChaosResult,
  RuleHits,
  ChaosBudget,
  CHAOS_LIMITS,
} from '../types';
import { cloneIR } from './ir-executor';
import {
  emitNumberEncodingDiagnostic,
  emitSubstitutionDiagnostic,
  emitOpaquePredDiagnostic,
  emitFlatteningDiagnostic,
} from './diagnostics';

// ============================================================================
// SEEDED RANDOM NUMBER GENERATOR (Lehmer LCG for determinism)
// ============================================================================

let currentSeed = 1;

export function seededRandom(): number {
  currentSeed = (currentSeed * 16807) % 2147483647;
  return (currentSeed - 1) / 2147483646;
}

export function setSeed(seed: number): void {
  currentSeed = seed % 2147483647;
  if (currentSeed <= 0) currentSeed += 2147483646;
}

function randomInt(min: number, max: number): number {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

// ============================================================================
// BUDGET MANAGER
// ============================================================================

function createBudget(): ChaosBudget {
  return {
    instructionsAdded: 0,
    controlDepth: 0,
    encodingOps: 0,
  };
}

function checkBudget(
  budget: ChaosBudget,
  type: keyof ChaosBudget,
  cost: number
): boolean {
  const limitKey = type === 'instructionsAdded' ? 'maxNewInstructions' :
    type === 'controlDepth' ? 'maxControlDepth' : 'maxEncodingOps';
  return budget[type] + cost <= CHAOS_LIMITS[limitKey];
}

function consumeBudget(
  budget: ChaosBudget,
  type: keyof ChaosBudget,
  cost: number
): void {
  budget[type] += cost;
}

// ============================================================================
// TEMP VARIABLE GENERATORS
// ============================================================================

let tempCounter = 0;

function resetTempCounter(): void {
  tempCounter = 1000; // Start high to avoid collisions with IR generator
}

function genTemp(prefix: string = 'enc'): string {
  return `${prefix}_${tempCounter++}`;
}

// ============================================================================
// PASS 1: NUMBER ENCODING
// Replace constant assignments with encoded arithmetic
// Example: x = 5 → t1 = 5 + 7; x = t1 - 7
// ============================================================================

function applyNumberEncoding(
  ir: IRInstruction[],
  budget: ChaosBudget,
  probability: number
): IRInstruction[] {
  const result: IRInstruction[] = [];

  for (const instr of ir) {
    // Handle nested structures
    if (instr.consequent) {
      instr.consequent = applyNumberEncoding(instr.consequent, budget, probability);
    }
    if (instr.alternate) {
      instr.alternate = applyNumberEncoding(instr.alternate, budget, probability);
    }
    if (instr.body) {
      instr.body = applyNumberEncoding(instr.body, budget, probability);
    }

    // Encode numeric values in assignments, prints, and returns
    if (
      (instr.op === 'ASSIGN' || instr.op === 'PRINT' || instr.op === 'RETURN') &&
      typeof instr.value === 'number' &&
      seededRandom() < probability
    ) {
      if (!checkBudget(budget, 'encodingOps', 1) || !checkBudget(budget, 'instructionsAdded', 2)) {
        result.push(instr);
        continue;
      }

      const offset = randomInt(1, 15);
      const tempAdd = genTemp('enc_add');
      const tempVal = (instr.op === 'ASSIGN' && instr.target) ? instr.target : genTemp('enc_recover');

      result.push({
        op: 'ADD',
        target: tempAdd,
        left: instr.value,
        right: offset,
        meta: 'CHAOS_NUMBER_ENCODING',
      });

      result.push({
        op: 'SUB',
        target: tempVal,
        left: tempAdd,
        right: offset,
        meta: 'CHAOS_NUMBER_ENCODING',
      });

      // For PRINT and RETURN, we still need to emit the original op using the recovered value
      if (instr.op !== 'ASSIGN') {
        result.push({
          op: instr.op,
          value: tempVal,
          meta: 'CHAOS_NUMBER_ENCODING',
        });
      }

      consumeBudget(budget, 'encodingOps', 1);
      consumeBudget(budget, 'instructionsAdded', 2);

      // Emit diagnostic
      emitNumberEncodingDiagnostic(instr.value, `${instr.value} + ${offset} - ${offset}`, offset);
    } else {
      result.push(instr);
    }
  }

  return result;
}

// ============================================================================
// PASS 2: INSTRUCTION SUBSTITUTION
// Replace ADD with bitwise equivalent: a + b = (a ^ b) + 2 * (a & b)
// ============================================================================

function applyInstructionSubstitution(
  ir: IRInstruction[],
  budget: ChaosBudget,
  probability: number
): IRInstruction[] {
  const result: IRInstruction[] = [];

  for (const instr of ir) {
    // Handle nested structures
    if (instr.consequent) {
      instr.consequent = applyInstructionSubstitution(instr.consequent, budget, probability);
    }
    if (instr.alternate) {
      instr.alternate = applyInstructionSubstitution(instr.alternate, budget, probability);
    }
    if (instr.body) {
      instr.body = applyInstructionSubstitution(instr.body, budget, probability);
    }

    // Only substitute ADD operations
    if (
      instr.op === 'ADD' &&
      instr.meta !== 'CHAOS_NUMBER_ENCODING' && // Don't substitute our own encoding
      seededRandom() < probability
    ) {
      if (!checkBudget(budget, 'instructionsAdded', 4)) {
        result.push(instr);
        continue;
      }

      const xorTemp = genTemp('xor');
      const andTemp = genTemp('and');
      const mulTemp = genTemp('mul');

      // a + b = (a ^ b) + 2 * (a & b)
      result.push({
        op: 'XOR',
        target: xorTemp,
        left: instr.left,
        right: instr.right,
        meta: 'CHAOS_SUBSTITUTION',
      });

      result.push({
        op: 'AND',
        target: andTemp,
        left: instr.left,
        right: instr.right,
        meta: 'CHAOS_SUBSTITUTION',
      });

      result.push({
        op: 'MUL',
        target: mulTemp,
        left: andTemp,
        right: 2,
        meta: 'CHAOS_SUBSTITUTION',
      });

      result.push({
        op: 'ADD',
        target: instr.target,
        left: xorTemp,
        right: mulTemp,
        meta: 'CHAOS_SUBSTITUTION',
      });

      consumeBudget(budget, 'instructionsAdded', 4);

      // Emit diagnostic
      emitSubstitutionDiagnostic('ADD', ['XOR', 'AND', 'MUL', 'ADD']);
    } else {
      result.push(instr);
    }
  }

  return result;
}

// ============================================================================
// PASS 3: OPAQUE PREDICATES
// Inject always-true conditions: (x*x + x) % 2 == 0
// ============================================================================

function applyOpaquePredicates(
  ir: IRInstruction[],
  budget: ChaosBudget,
  probability: number
): IRInstruction[] {
  const result: IRInstruction[] = [];
  const variables = extractVariables(ir);

  for (const instr of ir) {
    // Handle nested structures
    if (instr.consequent) {
      instr.consequent = applyOpaquePredicates(instr.consequent, budget, probability);
    }
    if (instr.alternate) {
      instr.alternate = applyOpaquePredicates(instr.alternate, budget, probability);
    }
    if (instr.body) {
      instr.body = applyOpaquePredicates(instr.body, budget, probability);
    }

    // Inject opaque predicate for ASSIGN instructions
    if (
      instr.op === 'ASSIGN' &&
      instr.meta === 'USER_CODE' &&
      variables.length > 0 &&
      seededRandom() < probability
    ) {
      if (!checkBudget(budget, 'controlDepth', 1) || !checkBudget(budget, 'instructionsAdded', 5)) {
        result.push(instr);
        continue;
      }

      // Select a random variable for the opaque predicate
      const varName = variables[randomInt(0, variables.length - 1)];

      // Build opaque predicate: (x*x + x) % 2 == 0
      const mulTemp = genTemp('op_mul');
      const addTemp = genTemp('op_add');
      const modTemp = genTemp('op_mod');
      const eqTemp = genTemp('op_eq');

      const predicateIR: IRInstruction[] = [
        { op: 'MUL', target: mulTemp, left: varName, right: varName, meta: 'CHAOS_OPAQUE' },
        { op: 'ADD', target: addTemp, left: mulTemp, right: varName, meta: 'CHAOS_OPAQUE' },
        { op: 'MOD', target: modTemp, left: addTemp, right: 2, meta: 'CHAOS_OPAQUE' },
        { op: 'EQUAL', target: eqTemp, left: modTemp, right: 0, meta: 'CHAOS_OPAQUE' },
      ];

      result.push(...predicateIR);

      // Wrap the instruction in an IF that always evaluates to true
      result.push({
        op: 'IF',
        test: { op: 'LOAD', value: eqTemp },
        consequent: [{ ...instr, meta: 'CHAOS_OPAQUE_WRAPPED' }],
        alternate: [],
        meta: 'CHAOS_OPAQUE',
      });

      consumeBudget(budget, 'controlDepth', 1);
      consumeBudget(budget, 'instructionsAdded', 5);

      // Emit diagnostic
      emitOpaquePredDiagnostic(varName);
    } else {
      result.push(instr);
    }
  }

  return result;
}

function extractVariables(ir: IRInstruction[]): string[] {
  const vars = new Set<string>();

  for (const instr of ir) {
    if (instr.op === 'ASSIGN' && instr.target && !instr.target.startsWith('t')) {
      vars.add(instr.target);
    }
    if (instr.consequent) {
      extractVariables(instr.consequent).forEach(v => vars.add(v));
    }
    if (instr.alternate) {
      extractVariables(instr.alternate).forEach(v => vars.add(v));
    }
    if (instr.body) {
      extractVariables(instr.body).forEach(v => vars.add(v));
    }
  }

  return Array.from(vars);
}

// ============================================================================
// PASS 4: CONTROL FLOW FLATTENING
// Convert linear code to dispatcher-based switch inside while loop
// ============================================================================

function applyControlFlowFlattening(
  ir: IRInstruction[],
  budget: ChaosBudget,
  probability: number
): IRInstruction[] {
  // Only apply if we have enough instructions and probability hits
  if (ir.length < 3 || seededRandom() > probability) {
    return ir;
  }

  if (!checkBudget(budget, 'controlDepth', 1) || !checkBudget(budget, 'instructionsAdded', 5)) {
    return ir;
  }

  // Find the first contiguous block of flattenable instructions
  const flattenableInstrs: IRInstruction[] = [];
  const remainingInstrs: IRInstruction[] = [];
  let foundControlFlow = false;

  for (const instr of ir) {
    if (!foundControlFlow &&
      instr.op !== 'IF' &&
      instr.op !== 'WHILE' &&
      instr.op !== 'RETURN' &&
      instr.op !== 'SWITCH') {
      flattenableInstrs.push(instr);
    } else {
      foundControlFlow = true;
      remainingInstrs.push(instr);
    }
  }

  if (flattenableInstrs.length < 2) {
    return ir;
  }

  // Create dispatcher
  const stateVar = genTemp('state');
  const result: IRInstruction[] = [];

  // Initialize state variable
  result.push({
    op: 'ASSIGN',
    target: stateVar,
    value: 0,
    meta: 'CHAOS_FLATTENING',
  });

  // Build switch cases
  const cases = flattenableInstrs.map((instr, idx) => ({
    caseValue: idx,
    body: [
      { ...instr, meta: 'CHAOS_FLATTENED' },
      { op: 'ASSIGN' as const, target: stateVar, value: idx + 1, meta: 'CHAOS_FLATTENING' },
    ],
  }));

  // Add exit case
  cases.push({
    caseValue: flattenableInstrs.length,
    body: [{ op: 'ASSIGN' as const, target: stateVar, value: -1, meta: 'CHAOS_FLATTENING' }],
  });

  // Create the dispatcher loop
  const loopTestTemp = genTemp('flat_test');

  result.push({
    op: 'WHILE',
    consequent: [
      { op: 'GREATER_EQUAL' as const, target: loopTestTemp, left: stateVar, right: 0, meta: 'CHAOS_FLATTENING' },
    ],
    test: { op: 'LOAD' as const, value: loopTestTemp },
    body: [
      {
        op: 'SWITCH',
        value: stateVar,
        cases,
        meta: 'CHAOS_FLATTENING',
      },
    ],
    meta: 'CHAOS_FLATTENING',
  });

  // Add remaining instructions (preserving their order relative to the flattened block)
  result.push(...remainingInstrs);

  consumeBudget(budget, 'controlDepth', 1);
  consumeBudget(budget, 'instructionsAdded', 5);

  // Emit diagnostic
  emitFlatteningDiagnostic(flattenableInstrs.length);

  return result;
}

// ============================================================================
// CUSTOM RULE APPLICATION
// ============================================================================

function applyCustomRules(
  ir: IRInstruction[],
  customRules: ChaosConfig['customRules'],
  ruleHits: RuleHits,
  budget: ChaosBudget
): IRInstruction[] {
  if (customRules.length === 0) return ir;

  const result: IRInstruction[] = [];

  for (const instr of ir) {
    // Handle nested structures
    if (instr.consequent) {
      instr.consequent = applyCustomRules(instr.consequent, customRules, ruleHits, budget);
    }
    if (instr.alternate) {
      instr.alternate = applyCustomRules(instr.alternate, customRules, ruleHits, budget);
    }
    if (instr.body) {
      instr.body = applyCustomRules(instr.body, customRules, ruleHits, budget);
    }

    let matched = false;

    for (const rule of customRules) {
      if (instr.op === rule.source.toUpperCase() && !matched) {
        const targetOps = rule.target.split(',').map(s => s.trim().toUpperCase());

        if (!checkBudget(budget, 'instructionsAdded', targetOps.length)) {
          continue;
        }

        // Track hit
        ruleHits[rule.id] = (ruleHits[rule.id] || 0) + 1;
        matched = true;

        // Generate expanded instructions
        let lastResult = instr.left;

        for (let i = 0; i < targetOps.length; i++) {
          const op = targetOps[i] as IRInstruction['op'];
          const isLast = i === targetOps.length - 1;
          const target = isLast ? instr.target! : genTemp('custom');

          result.push({
            op,
            target,
            left: lastResult,
            right: instr.right,
            meta: 'CHAOS_CUSTOM_RULE',
          });

          lastResult = target;
        }

        consumeBudget(budget, 'instructionsAdded', targetOps.length);
      }
    }

    if (!matched) {
      result.push(instr);
    }
  }

  return result;
}

// ============================================================================
// INTENSITY CONFIGURATION
// ============================================================================

interface IntensityConfig {
  numberEncoding: number;
  substitution: number;
  opaquePredicates: number;
  flattening: number;
}

function getIntensityConfig(intensity: 'none' | 'low' | 'medium' | 'high'): IntensityConfig {
  switch (intensity) {
    case 'none':
      return {
        numberEncoding: 0,
        substitution: 0,
        opaquePredicates: 0,
        flattening: 0,
      };
    case 'low':
      return {
        numberEncoding: 0.4,
        substitution: 0,
        opaquePredicates: 0,
        flattening: 0,
      };
    case 'medium':
      return {
        numberEncoding: 0.6,
        substitution: 0.5,
        opaquePredicates: 0.2,
        flattening: 0,
      };
    case 'high':
      return {
        numberEncoding: 0.8,
        substitution: 0.7,
        opaquePredicates: 0.4,
        flattening: 0.3,
      };
  }
}

// ============================================================================
// MAIN CHAOS ENGINE
// ============================================================================

export function applyChaos(
  originalIR: IRInstruction[],
  intensity: 'none' | 'low' | 'medium' | 'high' = 'medium',
  seed?: number,
  config?: Partial<ChaosConfig>
): ChaosResult {
  // Initialize seed
  if (seed !== undefined) {
    setSeed(seed);
  } else {
    setSeed(Date.now());
  }

  resetTempCounter();

  // Deep clone IR
  let ir = cloneIR(originalIR);

  // Setup
  const budget = createBudget();
  const ruleHits: RuleHits = {};
  const snapshots: IRSnapshot[] = [];
  const appliedPasses: string[] = [];

  // Get intensity configuration
  const intensityConfig = getIntensityConfig(intensity);

  // Merge with custom config
  const passes = config?.passes ?? {
    numberEncoding: true,
    substitution: intensity !== 'low',
    opaquePredicates: intensity === 'high',
    flattening: intensity === 'high',
  };

  const customRules = config?.customRules ?? [];

  // Capture original snapshot
  snapshots.push({
    name: 'ir.snapshot_original',
    ir: cloneIR(ir),
    passDescription: 'ir.desc_original',
  });

  // Apply custom rules first (highest priority)
  if (customRules.length > 0) {
    ir = applyCustomRules(ir, customRules, ruleHits, budget);
    if (Object.keys(ruleHits).length > 0) {
      appliedPasses.push('customRules');
      snapshots.push({
        name: 'ir.snapshot_custom_rules',
        ir: cloneIR(ir),
        passDescription: 'ir.desc_custom_rules',
      });
    }
  }

  // Pass 1: Number Encoding
  if (passes.numberEncoding) {
    const prevLength = ir.length;
    ir = applyNumberEncoding(ir, budget, intensityConfig.numberEncoding);
    if (ir.length !== prevLength) {
      appliedPasses.push('numberEncoding');
    }
    snapshots.push({
      name: 'ir.snapshot_number_encoding',
      ir: cloneIR(ir),
      passDescription: 'ir.desc_number_encoding',
    });
  }

  // Pass 2: Instruction Substitution
  if (passes.substitution && intensityConfig.substitution > 0) {
    const prevLength = ir.length;
    ir = applyInstructionSubstitution(ir, budget, intensityConfig.substitution);
    if (ir.length !== prevLength) {
      appliedPasses.push('substitution');
    }
    snapshots.push({
      name: 'ir.snapshot_instruction_sub',
      ir: cloneIR(ir),
      passDescription: 'ir.desc_instruction_sub',
    });
  }

  // Pass 3: Opaque Predicates
  if (passes.opaquePredicates && intensityConfig.opaquePredicates > 0) {
    const prevLength = ir.length;
    ir = applyOpaquePredicates(ir, budget, intensityConfig.opaquePredicates);
    if (ir.length !== prevLength) {
      appliedPasses.push('opaquePredicates');
    }
    snapshots.push({
      name: 'ir.snapshot_opaque_pred',
      ir: cloneIR(ir),
      passDescription: 'ir.desc_opaque_pred',
    });
  }

  // Pass 4: Control Flow Flattening
  if (passes.flattening && intensityConfig.flattening > 0) {
    const prevLength = ir.length;
    ir = applyControlFlowFlattening(ir, budget, intensityConfig.flattening);
    if (ir.length !== prevLength) {
      appliedPasses.push('flattening');
    }
    snapshots.push({
      name: 'ir.snapshot_cf_flatten',
      ir: cloneIR(ir),
      passDescription: 'ir.desc_cf_flatten',
    });
  }

  return {
    ir,
    snapshots,
    ruleHits,
    budget,
    appliedPasses,
  };
}

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

export const CHAOS_PRESETS = {
  arithmeticChaos: {
    passes: {
      numberEncoding: true,
      substitution: true,
      opaquePredicates: false,
      flattening: false,
    },
    // Built-in substitution pass implements correct algebraic identities
    // Custom rules are better suited for simple sequential transforms
    customRules: [],
    seed: 12345,
  },
  controlFlowChaos: {
    passes: {
      numberEncoding: false,
      substitution: false,
      opaquePredicates: true,
      flattening: true,
    },
    customRules: [],
    seed: 54321,
  },
  heavyObfuscation: {
    passes: {
      numberEncoding: true,
      substitution: true,
      opaquePredicates: true,
      flattening: true,
    },
    // Built-in passes handle all transformations with correct semantics
    customRules: [],
    seed: 99999,
  },
  stealthMode: {
    passes: {
      numberEncoding: true,
      substitution: false,
      opaquePredicates: true,
      flattening: false,
    },
    customRules: [],
    seed: 77777,
  },
  maximumChaos: {
    passes: {
      numberEncoding: true,
      substitution: true,
      opaquePredicates: true,
      flattening: true,
    },
    customRules: [],
    seed: 13579,
  },
} as const;

export type ChaosPreset = keyof typeof CHAOS_PRESETS;
