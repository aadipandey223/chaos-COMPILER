import { IRInstruction } from '../types';

// ============================================================================
// IR EXECUTOR - Stack-based VM for executing IR instructions
// Ensures semantic preservation verification
// ============================================================================

export interface ExecutionContext {
  variables: Map<string, number>;
  temps: Map<string, number>;
  stdout: string[];
  returnValue: number | null;
  halted: boolean;
  stepCount: number;
  maxSteps: number;
}

export function createExecutionContext(maxSteps: number = 10000): ExecutionContext {
  return {
    variables: new Map(),
    temps: new Map(),
    stdout: [],
    returnValue: null,
    halted: false,
    stepCount: 0,
    maxSteps,
  };
}

export function executeIR(
  ir: IRInstruction[],
  initialState?: Map<string, number>,
  stdout?: string[]
): number {
  const ctx = createExecutionContext();
  
  if (initialState) {
    for (const [key, value] of initialState) {
      ctx.variables.set(key, value);
    }
  }
  
  if (stdout) {
    ctx.stdout = stdout;
  }

  executeBlock(ir, ctx);

  return ctx.returnValue ?? 0;
}

function executeBlock(instructions: IRInstruction[], ctx: ExecutionContext): void {
  for (const instr of instructions) {
    if (ctx.halted) return;
    if (ctx.stepCount++ > ctx.maxSteps) {
      throw new Error('Execution exceeded maximum step count (possible infinite loop)');
    }
    executeInstruction(instr, ctx);
  }
}

function getValue(
  value: string | number | boolean | undefined,
  ctx: ExecutionContext
): number {
  if (value === undefined) return 0;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value;
  
  // Check temps first, then variables
  if (ctx.temps.has(value)) {
    return ctx.temps.get(value)!;
  }
  if (ctx.variables.has(value)) {
    return ctx.variables.get(value)!;
  }
  
  return 0;
}

function setValue(target: string, value: number, ctx: ExecutionContext): void {
  // Temps start with 't' followed by digits
  if (/^t\d+$/.test(target) || target.startsWith('enc_') || target.startsWith('xor_') || 
      target.startsWith('and_') || target.startsWith('mul_') || target.startsWith('op_') ||
      target.startsWith('state_') || target.startsWith('flat_')) {
    ctx.temps.set(target, value);
  } else {
    ctx.variables.set(target, value);
  }
}

function executeInstruction(instr: IRInstruction, ctx: ExecutionContext): void {
  switch (instr.op) {
    case 'ASSIGN': {
      const value = getValue(instr.value, ctx);
      if (instr.target) {
        setValue(instr.target, value, ctx);
      }
      break;
    }

    case 'ADD': {
      const left = getValue(instr.left, ctx);
      const right = getValue(instr.right, ctx);
      if (instr.target) {
        setValue(instr.target, left + right, ctx);
      }
      break;
    }

    case 'SUB': {
      const left = getValue(instr.left, ctx);
      const right = getValue(instr.right, ctx);
      if (instr.target) {
        setValue(instr.target, left - right, ctx);
      }
      break;
    }

    case 'MUL': {
      const left = getValue(instr.left, ctx);
      const right = getValue(instr.right, ctx);
      if (instr.target) {
        setValue(instr.target, left * right, ctx);
      }
      break;
    }

    case 'DIV': {
      const left = getValue(instr.left, ctx);
      const right = getValue(instr.right, ctx);
      if (instr.target) {
        if (right === 0) {
          throw new Error('Division by zero');
        }
        setValue(instr.target, Math.floor(left / right), ctx);
      }
      break;
    }

    case 'MOD': {
      const left = getValue(instr.left, ctx);
      const right = getValue(instr.right, ctx);
      if (instr.target) {
        if (right === 0) {
          throw new Error('Modulo by zero');
        }
        setValue(instr.target, left % right, ctx);
      }
      break;
    }

    case 'AND': {
      const left = getValue(instr.left, ctx);
      const right = getValue(instr.right, ctx);
      if (instr.target) {
        setValue(instr.target, left & right, ctx);
      }
      break;
    }

    case 'OR': {
      const left = getValue(instr.left, ctx);
      const right = getValue(instr.right, ctx);
      if (instr.target) {
        setValue(instr.target, left | right, ctx);
      }
      break;
    }

    case 'XOR': {
      const left = getValue(instr.left, ctx);
      const right = getValue(instr.right, ctx);
      if (instr.target) {
        setValue(instr.target, left ^ right, ctx);
      }
      break;
    }

    case 'NOT': {
      const value = getValue(instr.value, ctx);
      if (instr.target) {
        setValue(instr.target, value === 0 ? 1 : 0, ctx);
      }
      break;
    }

    case 'NEG': {
      const value = getValue(instr.value, ctx);
      if (instr.target) {
        setValue(instr.target, -value, ctx);
      }
      break;
    }

    case 'LESS': {
      const left = getValue(instr.left, ctx);
      const right = getValue(instr.right, ctx);
      if (instr.target) {
        setValue(instr.target, left < right ? 1 : 0, ctx);
      }
      break;
    }

    case 'GREATER': {
      const left = getValue(instr.left, ctx);
      const right = getValue(instr.right, ctx);
      if (instr.target) {
        setValue(instr.target, left > right ? 1 : 0, ctx);
      }
      break;
    }

    case 'LESS_EQUAL': {
      const left = getValue(instr.left, ctx);
      const right = getValue(instr.right, ctx);
      if (instr.target) {
        setValue(instr.target, left <= right ? 1 : 0, ctx);
      }
      break;
    }

    case 'GREATER_EQUAL': {
      const left = getValue(instr.left, ctx);
      const right = getValue(instr.right, ctx);
      if (instr.target) {
        setValue(instr.target, left >= right ? 1 : 0, ctx);
      }
      break;
    }

    case 'EQUAL': {
      const left = getValue(instr.left, ctx);
      const right = getValue(instr.right, ctx);
      if (instr.target) {
        setValue(instr.target, left === right ? 1 : 0, ctx);
      }
      break;
    }

    case 'NOT_EQUAL': {
      const left = getValue(instr.left, ctx);
      const right = getValue(instr.right, ctx);
      if (instr.target) {
        setValue(instr.target, left !== right ? 1 : 0, ctx);
      }
      break;
    }

    case 'LOAD': {
      const value = getValue(instr.value, ctx);
      if (instr.target) {
        setValue(instr.target, value, ctx);
      }
      break;
    }

    case 'STORE': {
      const value = getValue(instr.value, ctx);
      if (instr.target) {
        setValue(instr.target, value, ctx);
      }
      break;
    }

    case 'RETURN': {
      ctx.returnValue = getValue(instr.value, ctx);
      ctx.halted = true;
      break;
    }

    case 'IF': {
      let testValue: number;
      if (instr.test && typeof instr.test === 'object' && 'value' in instr.test) {
        testValue = getValue(instr.test.value, ctx);
      } else {
        testValue = 0;
      }

      if (testValue !== 0) {
        if (instr.consequent) {
          executeBlock(instr.consequent, ctx);
        }
      } else {
        if (instr.alternate) {
          executeBlock(instr.alternate, ctx);
        }
      }
      break;
    }

    case 'WHILE': {
      const maxIterations = 10000;
      let iterations = 0;

      while (!ctx.halted && iterations < maxIterations) {
        iterations++;

        // Execute test IR instructions first (stored in consequent)
        if (instr.consequent) {
          executeBlock(instr.consequent, ctx);
        }

        // Evaluate test result
        let testValue: number = 1;
        if (instr.test && typeof instr.test === 'object' && 'value' in instr.test) {
          testValue = getValue(instr.test.value, ctx);
        }

        if (testValue === 0) break;

        // Execute loop body
        if (instr.body) {
          executeBlock(instr.body, ctx);
        }
      }

      if (iterations >= maxIterations) {
        throw new Error('While loop exceeded maximum iterations');
      }
      break;
    }

    case 'SWITCH': {
      const discriminant = getValue(instr.value, ctx);
      
      if (instr.cases) {
        for (const caseItem of instr.cases) {
          if (caseItem.caseValue === discriminant) {
            executeBlock(caseItem.body, ctx);
            break;
          }
        }
      }
      break;
    }

    case 'CALL': {
      // Function calls - for now, just return 0
      // In a full implementation, this would look up the function and execute it
      if (instr.target) {
        setValue(instr.target, 0, ctx);
      }
      break;
    }

    case 'PRINT': {
      const value = getValue(instr.value, ctx);
      ctx.stdout.push(String(value));
      break;
    }

    case 'NOP':
    case 'LABEL':
    case 'GOTO':
    case 'CASE':
      // No-op instructions
      break;

    default:
      // Unknown instruction - ignore
      break;
  }
}

// Deep copy IR for safe mutation
export function cloneIR(ir: IRInstruction[]): IRInstruction[] {
  return JSON.parse(JSON.stringify(ir));
}

// Execute and compare original vs transformed IR
export function verifySemanticPreservation(
  originalIR: IRInstruction[],
  transformedIR: IRInstruction[]
): {
  original: number;
  transformed: number;
  match: boolean;
  stdout: string[];
} {
  const originalStdout: string[] = [];
  const transformedStdout: string[] = [];

  const originalResult = executeIR(cloneIR(originalIR), undefined, originalStdout);
  const transformedResult = executeIR(cloneIR(transformedIR), undefined, transformedStdout);

  return {
    original: originalResult,
    transformed: transformedResult,
    match: originalResult === transformedResult,
    stdout: transformedStdout,
  };
}
