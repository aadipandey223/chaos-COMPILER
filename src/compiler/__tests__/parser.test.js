import { describe, it, expect } from 'vitest';
import { Lexer } from '../lexer';
import { Parser } from '../parser';

describe('Parser', () => {
    it('should parse simple variable declaration', () => {
        const code = 'int x = 5;';
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        
        expect(ast).toBeDefined();
        expect(ast.type).toBe('Program');
        expect(ast.body).toHaveLength(1);
        expect(ast.body[0].type).toBe('VariableDeclaration');
    });

    it('should parse function declaration with return statement', () => {
        const code = `
            int main() {
                int x = 10;
                return x;
            }
        `;
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        
        expect(ast.body).toHaveLength(1);
        expect(ast.body[0].type).toBe('FunctionDeclaration');
        expect(ast.body[0].name).toBe('main');
        expect(ast.body[0].body).toHaveLength(2);
    });

    it('should parse arithmetic expressions', () => {
        const code = 'int result = a + b;';
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        
        const decl = ast.body[0].declarations[0];
        expect(decl.init.type).toBe('BinaryExpression');
        expect(decl.init.operator).toBe('+');
    });

    it('should parse nested expressions with correct precedence', () => {
        const code = 'int result = a + b * c;';
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        
        const expr = ast.body[0].declarations[0].init;
        expect(expr.type).toBe('BinaryExpression');
        expect(expr.operator).toBe('+');
        expect(expr.right.type).toBe('BinaryExpression');
        expect(expr.right.operator).toBe('*');
    });

    it('should handle empty main function', () => {
        const code = 'int main() {}';
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        
        expect(ast.body[0].body).toHaveLength(0);
    });

    it('should parse multiple variable declarations', () => {
        const code = `
            int main() {
                int a = 1;
                int b = 2;
                int c = 3;
            }
        `;
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        
        expect(ast.body[0].body).toHaveLength(3);
        expect(ast.body[0].body.every(stmt => stmt.type === 'VariableDeclaration')).toBe(true);
    });
});
