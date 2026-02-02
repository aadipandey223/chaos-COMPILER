import { describe, it, expect } from 'vitest';
import {
  validateDiagnostic,
  generateValidationReport,
} from '../lingo/validator';
import type { Diagnostic } from '../types';

describe('Lingo Validator', () => {
  describe('validateDiagnostic', () => {
    it('validates correct diagnostic', () => {
      const diagnostic: Diagnostic = {
        id: 'CHAOS_NUM_ENCODING',
        severity: 'info',
        context: 'Applied number encoding transformation',
      };
      
      const result = validateDiagnostic(diagnostic);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects missing id', () => {
      const diagnostic = {
        severity: 'info',
        context: 'Some context',
      } as Partial<Diagnostic>;
      
      const result = validateDiagnostic(diagnostic);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Missing required field 'id'"))).toBe(true);
    });

    it('rejects missing severity', () => {
      const diagnostic = {
        id: 'CHAOS_TEST',
        context: 'Some context',
      } as Partial<Diagnostic>;
      
      const result = validateDiagnostic(diagnostic);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Missing required field 'severity'"))).toBe(true);
    });

    it('rejects empty context', () => {
      const diagnostic: Partial<Diagnostic> = {
        id: 'CHAOS_TEST',
        severity: 'info',
        context: '',
      };
      
      const result = validateDiagnostic(diagnostic);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("cannot be empty"))).toBe(true);
    });

    it('rejects invalid id format', () => {
      const diagnostic: Partial<Diagnostic> = {
        id: 'invalid_format_123',
        severity: 'info',
        context: 'Valid context',
      };
      
      const result = validateDiagnostic(diagnostic);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Invalid ID prefix"))).toBe(true);
    });

    it('validates id prefixes', () => {
      const validPrefixes = ['CHAOS_', 'LINGO_', 'IR_', 'PARSE_', 'CODEGEN_'];
      
      validPrefixes.forEach(prefix => {
        const diagnostic: Partial<Diagnostic> = {
          id: `${prefix}TEST`,
          severity: 'info',
          context: 'Valid context with approved terms',
        };
        
        const result = validateDiagnostic(diagnostic);
        expect(result.errors.some(e => e.includes("Invalid ID prefix"))).toBe(false);
      });
    });

    it('warns about unknown terms in params', () => {
      const diagnostic: Partial<Diagnostic> = {
        id: 'CHAOS_TEST',
        severity: 'info',
        context: 'Valid context',
        params: { unknownfoobarterm: 'test' },
      };
      
      const result = validateDiagnostic(diagnostic);
      // Unknown terms add warnings but don't fail validation
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('generateValidationReport', () => {
    it('generates report for multiple diagnostics', () => {
      const diagnostics: Diagnostic[] = [
        {
          id: 'CHAOS_NUM_ENCODING',
          severity: 'info',
          context: 'Applied number encoding',
        },
        {
          id: 'CHAOS_SUBSTITUTION',
          severity: 'info',
          context: 'Applied instruction substitution',
        },
      ];
      
      const report = generateValidationReport(diagnostics);
      expect(report.valid).toBe(true);
      expect(report.invalidCount).toBe(0);
      expect(report.validCount).toBe(2);
    });

    it('aggregates errors from multiple diagnostics', () => {
      const diagnostics: Diagnostic[] = [
        {
          id: 'CHAOS_VALID',
          severity: 'info',
          context: 'Valid context',
        },
        {
          id: 'invalid_format',
          severity: 'info',
          context: '',
        } as Diagnostic,
      ];
      
      const report = generateValidationReport(diagnostics);
      expect(report.valid).toBe(false);
      expect(report.invalidCount).toBeGreaterThan(0);
    });
  });
});

describe('Glossary Enforcement', () => {
  const approvedTerms = [
    'block', 'ir', 'ssa', 'chaos', 'predicate', 'instruction',
    'transformation', 'encoding', 'semantics', 'token', 'parse',
    'lexer', 'ast', 'cfg', 'phi', 'operand', 'opcode',
  ];

  it('accepts diagnostics with approved terms', () => {
    approvedTerms.forEach(term => {
      const diagnostic: Partial<Diagnostic> = {
        id: 'CHAOS_TEST',
        severity: 'info',
        context: `Testing the ${term} feature`,
      };
      
      const result = validateDiagnostic(diagnostic);
      // Should not have errors
      expect(result.valid).toBe(true);
    });
  });
});
