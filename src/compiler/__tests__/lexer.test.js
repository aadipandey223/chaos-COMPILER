import { describe, it, expect, beforeEach } from 'vitest';
import { Lexer } from '../lexer';

describe('Lexer', () => {
    it('should tokenize simple integer declaration', () => {
        const code = 'int x = 5;';
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        
        expect(tokens.length).toBeGreaterThanOrEqual(5);
        
        // Check for required token types (values may vary)
        expect(tokens.some(t => t.type === 'INT')).toBe(true);
        expect(tokens.some(t => t.type === 'IDENTIFIER' && t.value === 'x')).toBe(true);
        expect(tokens.some(t => t.type === 'ASSIGN')).toBe(true);
        expect(tokens.some(t => t.type === 'NUMBER')).toBe(true);
        expect(tokens.some(t => t.type === 'SEMICOLON')).toBe(true);
    });

    it('should tokenize arithmetic operations', () => {
        const code = 'a + b - c';
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        
        const plusToken = tokens.find(t => t.type === 'PLUS');
        const minusToken = tokens.find(t => t.type === 'MINUS');
        
        expect(plusToken).toBeDefined();
        expect(minusToken).toBeDefined();
    });

    it('should handle multiple operators', () => {
        const code = 'x * y / z';
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        
        const operators = tokens.filter(t => t.type === 'STAR' || t.type === 'SLASH');
        expect(operators).toHaveLength(2);
        expect(operators.map(o => o.type)).toEqual(['STAR', 'SLASH']);
    });

    it('should tokenize function declaration', () => {
        const code = 'int main() {}';
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        
        expect(tokens.some(t => t.type === 'INT')).toBe(true);
        expect(tokens.some(t => t.value === 'main')).toBe(true);
        expect(tokens.some(t => t.type === 'LPAREN')).toBe(true);
        expect(tokens.some(t => t.type === 'RPAREN')).toBe(true);
    });

    it('should handle whitespace correctly', () => {
        const code = '   int   x   =   5   ;   ';
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        
        const nonEofTokens = tokens.filter(t => t.type !== 'EOF');
        expect(nonEofTokens.length).toBeGreaterThanOrEqual(5);
        expect(tokens[0].type).toBe('INT');
    });

    it('should tokenize negative numbers', () => {
        const code = 'int x = -10;';
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        
        const hasMinus = tokens.some(t => t.type === 'MINUS');
        const hasNumber = tokens.some(t => t.type === 'NUMBER' && Math.abs(t.value) === 10);
        
        expect(hasMinus || hasNumber).toBe(true);
    });
});
