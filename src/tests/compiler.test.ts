import { describe, it, expect, beforeEach } from 'vitest';
import { Lexer } from '../compiler/lexer';
import { Parser } from '../compiler/parser';
import { IRGenerator } from '../compiler/ir-generator';
import { executeIR, verifySemanticPreservation, cloneIR } from '../compiler/ir-executor';
import { applyChaos, setSeed, CHAOS_PRESETS } from '../compiler/chaos-engine';

describe('Lexer', () => {
  it('tokenizes simple expression', () => {
    const lexer = new Lexer('int x = 5;');
    const tokens = lexer.tokenize();
    
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0].type).toBe('INT');
    expect(tokens[0].value).toBe('int');
    expect(tokens[1].type).toBe('IDENTIFIER');
    expect(tokens[1].value).toBe('x');
  });

  it('tokenizes operators correctly', () => {
    const lexer = new Lexer('a + b * c');
    const tokens = lexer.tokenize().filter(t => t.type !== 'EOF');
    
    expect(tokens.map(t => t.type)).toEqual([
      'IDENTIFIER', 'PLUS', 'IDENTIFIER', 'STAR', 'IDENTIFIER'
    ]);
  });

  it('handles comments', () => {
    const lexer = new Lexer('int x; // comment\nint y;');
    const tokens = lexer.tokenize();
    
    const identifiers = tokens.filter(t => t.type === 'IDENTIFIER');
    expect(identifiers.map(t => t.value)).toEqual(['x', 'y']);
  });

  it('tracks line and column numbers', () => {
    const lexer = new Lexer('int x;\nint y;');
    const tokens = lexer.tokenize();
    
    const xToken = tokens.find(t => t.value === 'x');
    const yToken = tokens.find(t => t.value === 'y');
    
    expect(xToken?.line).toBe(1);
    expect(yToken?.line).toBe(2);
  });
});

describe('Parser', () => {
  it('parses function declaration', () => {
    const source = 'int main() { return 0; }';
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    
    expect(ast.type).toBe('Program');
    expect(ast.functions!.length).toBe(1);
    expect(ast.functions![0].name).toBe('main');
  });

  it('parses variable declaration with initialization', () => {
    const source = 'int main() { int x = 5; return x; }';
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    
    const body = ast.functions![0].body;
    expect(body[0].type).toBe('VariableDeclaration');
  });

  it('parses binary expressions with precedence', () => {
    const source = 'int main() { return 1 + 2 * 3; }';
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    
    const returnStatement = ast.functions![0].body[0];
    expect(returnStatement.type).toBe('ReturnStatement');
    // The expression should be parsed as 1 + (2 * 3)
    const expr = (returnStatement as any).argument;
    expect(expr.type).toBe('BinaryExpression');
    expect(expr.operator).toBe('+');
  });

  it('parses if statements', () => {
    const source = 'int main() { if (x > 0) { return 1; } return 0; }';
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    
    const body = ast.functions![0].body;
    expect(body[0].type).toBe('IfStatement');
  });

  it('parses while loops', () => {
    const source = 'int main() { int i = 0; while (i < 10) { i = i + 1; } return i; }';
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    
    const body = ast.functions![0].body;
    expect(body[1].type).toBe('WhileStatement');
  });
});

describe('IR Generator', () => {
  it('generates IR for simple return', () => {
    const source = 'int main() { return 42; }';
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    const irGen = new IRGenerator();
    const ir = irGen.generate(ast);
    
    expect(ir.length).toBeGreaterThan(0);
    const returnInstr = ir.find(i => i.op === 'RETURN');
    expect(returnInstr).toBeDefined();
  });

  it('generates IR for binary expression', () => {
    const source = 'int main() { int x = 1 + 2; return x; }';
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    const irGen = new IRGenerator();
    const ir = irGen.generate(ast);
    
    const addInstr = ir.find(i => i.op === 'ADD');
    expect(addInstr).toBeDefined();
  });

  it('generates unique temp variables', () => {
    const source = 'int main() { int a = 1 + 2; int b = 3 + 4; return a + b; }';
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    const irGen = new IRGenerator();
    const ir = irGen.generate(ast);
    
    const temps = ir.filter(i => i.target?.startsWith('t')).map(i => i.target);
    const uniqueTemps = [...new Set(temps)];
    expect(temps.length).toBe(uniqueTemps.length);
  });
});

describe('IR Executor', () => {
  it('executes simple program', () => {
    const source = 'int main() { return 42; }';
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    const irGen = new IRGenerator();
    const ir = irGen.generate(ast);
    
    const result = executeIR(ir);
    expect(result).toBe(42);
  });

  it('executes arithmetic', () => {
    const source = 'int main() { int x = 5 + 3 * 2; return x; }';
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    const irGen = new IRGenerator();
    const ir = irGen.generate(ast);
    
    const result = executeIR(ir);
    expect(result).toBe(11);
  });

  it('executes loops', () => {
    const source = `
      int main() {
        int sum = 0;
        int i = 1;
        while (i <= 5) {
          sum = sum + i;
          i = i + 1;
        }
        return sum;
      }
    `;
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    const irGen = new IRGenerator();
    const ir = irGen.generate(ast);
    
    const result = executeIR(ir);
    expect(result).toBe(15); // 1+2+3+4+5
  });
});

describe('Chaos Engine', () => {
  beforeEach(() => {
    setSeed(12345);
  });

  it('is deterministic with same seed', () => {
    const source = 'int main() { int x = 5; return x; }';
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    const irGen = new IRGenerator();
    const ir = irGen.generate(ast);
    
    setSeed(12345);
    const result1 = applyChaos(cloneIR(ir), 'medium', 12345);
    
    setSeed(12345);
    const result2 = applyChaos(cloneIR(ir), 'medium', 12345);
    
    expect(JSON.stringify(result1.ir)).toBe(JSON.stringify(result2.ir));
  });

  it('increases instruction count', () => {
    const source = 'int main() { int x = 5; return x; }';
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    const irGen = new IRGenerator();
    const ir = irGen.generate(ast);
    
    const originalLength = ir.length;
    const result = applyChaos(cloneIR(ir), 'medium', 12345);
    
    expect(result.ir.length).toBeGreaterThan(originalLength);
  });

  it('preserves semantics', () => {
    const source = 'int main() { int x = 10; int y = x * 2; return y; }';
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    const irGen = new IRGenerator();
    const ir = irGen.generate(ast);
    
    const result = applyChaos(cloneIR(ir), 'medium', 12345);
    
    const verification = verifySemanticPreservation(ir, result.ir);
    expect(verification.match).toBe(true);
  });

  it('applies number encoding', () => {
    const source = 'int main() { int x = 42; return x; }';
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    const irGen = new IRGenerator();
    const ir = irGen.generate(ast);
    
    const result = applyChaos(cloneIR(ir), 'low', 12345, {
      passes: {
        numberEncoding: true,
        substitution: false,
        opaquePredicates: false,
        flattening: false,
      },
    });
    
    // Number 42 should be encoded (replaced with offset arithmetic)
    expect(result.ir.length).toBeGreaterThan(ir.length);
  });

  it('respects presets', () => {
    const source = 'int main() { return 5 + 3; }';
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();
    const irGen = new IRGenerator();
    const ir = irGen.generate(ast);
    
    setSeed(12345);
    const arithmeticResult = applyChaos(cloneIR(ir), 'medium', 12345, {
      passes: { ...CHAOS_PRESETS.arithmeticChaos.passes },
      customRules: [...CHAOS_PRESETS.arithmeticChaos.customRules],
      seed: CHAOS_PRESETS.arithmeticChaos.seed,
    });
    
    setSeed(54321);
    const controlFlowResult = applyChaos(cloneIR(ir), 'high', 54321, {
      passes: { ...CHAOS_PRESETS.controlFlowChaos.passes },
      customRules: [...CHAOS_PRESETS.controlFlowChaos.customRules],
      seed: CHAOS_PRESETS.controlFlowChaos.seed,
    });
    
    // Both should preserve semantics
    expect(verifySemanticPreservation(ir, arithmeticResult.ir).match).toBe(true);
    expect(verifySemanticPreservation(ir, controlFlowResult.ir).match).toBe(true);
  });
});

describe('Semantic Preservation', () => {
  const testCases = [
    {
      name: 'simple return',
      source: 'int main() { return 100; }',
      expected: 100,
    },
    {
      name: 'arithmetic',
      source: 'int main() { int x = 10 + 20 * 3; return x; }',
      expected: 70,
    },
    {
      name: 'nested expressions',
      source: 'int main() { int a = 5; int b = a * 2 + 3; return b; }',
      expected: 13,
    },
    {
      name: 'conditional',
      source: 'int main() { int x = 10; if (x > 5) { return 1; } return 0; }',
      expected: 1,
    },
    {
      name: 'loop accumulator',
      source: `
        int main() {
          int sum = 0;
          int i = 1;
          while (i <= 4) {
            sum = sum + i;
            i = i + 1;
          }
          return sum;
        }
      `,
      expected: 10,
    },
  ];

  testCases.forEach(({ name, source, expected }) => {
    it(`preserves semantics: ${name}`, () => {
      const lexer = new Lexer(source);
      const parser = new Parser(lexer.tokenize());
      const ast = parser.parse();
      const irGen = new IRGenerator();
      const ir = irGen.generate(ast);
      
      setSeed(99999);
      const originalResult = executeIR(ir);
      expect(originalResult).toBe(expected);
      
      const chaosResult = applyChaos(cloneIR(ir), 'high', 99999);
      const transformedResult = executeIR(chaosResult.ir);
      
      expect(transformedResult).toBe(expected);
    });
  });
});
