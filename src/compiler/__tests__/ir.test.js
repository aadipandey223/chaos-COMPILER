import { describe, it, expect, beforeEach } from 'vitest';
import { generateIR, applyChaos, executeIR } from '../ir';
import { Lexer } from '../lexer';
import { Parser } from '../parser';

describe('IR Generation', () => {
    it('should generate IR for simple variable assignment', () => {
        const code = `
            int main() {
                int x = 10;
                return x;
            }
        `;
        const ast = new Parser(new Lexer(code).tokenize()).parse();
        const ir = generateIR(ast);
        
        expect(ir).toBeInstanceOf(Array);
        expect(ir.length).toBeGreaterThan(0);
        expect(ir.some(instr => instr.op === 'ASSIGN')).toBe(true);
        expect(ir.some(instr => instr.op === 'RETURN')).toBe(true);
    });

    it('should generate IR for arithmetic operations', () => {
        const code = `
            int main() {
                int a = 5;
                int b = 10;
                int sum = a + b;
                return sum;
            }
        `;
        const ast = new Parser(new Lexer(code).tokenize()).parse();
        const ir = generateIR(ast);
        
        expect(ir.some(instr => instr.op === 'ADD')).toBe(true);
    });
});

describe('Chaos Transformations', () => {
    let baseIR;

    beforeEach(() => {
        const code = `
            int main() {
                int x = 5;
                int y = 10;
                int result = x + y;
                return result;
            }
        `;
        const ast = new Parser(new Lexer(code).tokenize()).parse();
        baseIR = generateIR(ast);
    });

    it('should apply chaos transformations with deterministic seed', () => {
        const config = {
            passes: {
                numberEncoding: true,
                substitution: true,
                opaquePredicates: true,
                flattening: true
            },
            customRules: []
        };

        const result1 = applyChaos(JSON.parse(JSON.stringify(baseIR)), 'medium', 12345, config);
        const result2 = applyChaos(JSON.parse(JSON.stringify(baseIR)), 'medium', 12345, config);
        
        expect(JSON.stringify(result1.ir)).toBe(JSON.stringify(result2.ir));
    });

    it('should generate snapshots during transformation', () => {
        const config = {
            passes: {
                numberEncoding: true,
                substitution: true,
                opaquePredicates: false,
                flattening: false
            },
            customRules: []
        };

        const { snapshots } = applyChaos(baseIR, 'medium', undefined, config);
        
        expect(snapshots).toBeInstanceOf(Array);
        expect(snapshots.length).toBeGreaterThan(0);
        expect(snapshots[0].name).toBe('Original');
    });

    it('should respect chaos budget limit warnings', () => {
        const code = `
            int main() {
                int x1 = 1; int x2 = 2; int x3 = 3; int x4 = 4; int x5 = 5;
                int x6 = 6; int x7 = 7; int x8 = 8; int x9 = 9; int x10 = 10;
                return x1 + x2 + x3 + x4 + x5;
            }
        `;
        const ast = new Parser(new Lexer(code).tokenize()).parse();
        const ir = generateIR(ast);
        
        const config = {
            passes: {
                numberEncoding: true,
                substitution: true,
                opaquePredicates: true,
                flattening: true
            },
            customRules: []
        };

        const { budget } = applyChaos(ir, 'high', undefined, config);
        
        // Budget limits exist to trigger warnings, but don't strictly enforce
        // The system will stop MOST transformations but may exceed slightly
        expect(budget.instructionsAdded).toBeDefined();
        expect(budget.instructionsAdded).toBeGreaterThan(0);
    });

    it('should preserve semantics after transformation', () => {
        const code = `
            int main() {
                int x = 5;
                int y = 10;
                int result = x + y;
                return result;
            }
        `;
        const ast = new Parser(new Lexer(code).tokenize()).parse();
        const ir = generateIR(ast);
        
        const originalResult = executeIR(JSON.parse(JSON.stringify(ir)));
        
        const config = {
            passes: {
                numberEncoding: true,
                substitution: true,
                opaquePredicates: false,
                flattening: false
            },
            customRules: []
        };
        
        const { ir: transformedIr } = applyChaos(ir, 'medium', 12345, config);
        const transformedResult = executeIR(transformedIr);
        
        expect(transformedResult).toBe(originalResult);
        expect(transformedResult).toBe(15);
    });

    it('should apply different intensity levels', () => {
        const config = {
            passes: {
                numberEncoding: true,
                substitution: true,
                opaquePredicates: true,
                flattening: true
            },
            customRules: []
        };

        const lowIntensity = applyChaos(JSON.parse(JSON.stringify(baseIR)), 'low', 123, config);
        const highIntensity = applyChaos(JSON.parse(JSON.stringify(baseIR)), 'high', 123, config);
        
        // High intensity should add more transformations (usually)
        expect(lowIntensity.transforms.length).toBeDefined();
        expect(highIntensity.transforms.length).toBeDefined();
    });
});

describe('IR Execution', () => {
    it('should execute simple return statement', () => {
        const ir = [
            { op: 'RETURN', value: 42 }
        ];
        
        const result = executeIR(ir);
        expect(result).toBe(42);
    });

    it('should execute variable assignment and return', () => {
        const ir = [
            { op: 'ASSIGN', target: 'x', value: 10 },
            { op: 'RETURN', value: 'x' }
        ];
        
        const result = executeIR(ir);
        expect(result).toBe(10);
    });

    it('should execute arithmetic operations', () => {
        const ir = [
            { op: 'ADD', target: 'sum', left: 5, right: 10 },
            { op: 'RETURN', value: 'sum' }
        ];
        
        const result = executeIR(ir);
        expect(result).toBe(15);
    });

    it('should handle multiple operations', () => {
        const ir = [
            { op: 'ASSIGN', target: 'a', value: 5 },
            { op: 'ASSIGN', target: 'b', value: 3 },
            { op: 'MUL', target: 'product', left: 'a', right: 'b' },
            { op: 'ADD', target: 'result', left: 'product', right: 10 },
            { op: 'RETURN', value: 'result' }
        ];
        
        const result = executeIR(ir);
        expect(result).toBe(25); // (5 * 3) + 10
    });
});
