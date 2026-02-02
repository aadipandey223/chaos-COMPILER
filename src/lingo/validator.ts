import { Diagnostic, LingoValidationReport, DiagnosticSeverity } from '../types';
import glossary from './glossary.json';

// ============================================================================
// LINGO.DEV VALIDATOR
// Validates diagnostic objects against schema and glossary
// Acts as a build blocker for invalid diagnostics
// ============================================================================

const VALID_ID_PREFIXES = ['CHAOS_', 'LINGO_', 'IR_', 'PARSE_', 'CODEGEN_'];
const VALID_SEVERITIES: DiagnosticSeverity[] = ['info', 'warning', 'error'];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a single diagnostic against the Lingo schema
 */
export function validateDiagnostic(diag: Partial<Diagnostic>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!diag.id) {
    errors.push("Missing required field 'id'");
  } else {
    // Validate ID prefix
    const hasValidPrefix = VALID_ID_PREFIXES.some(prefix => 
      diag.id!.startsWith(prefix)
    );
    if (!hasValidPrefix) {
      errors.push(`Invalid ID prefix: '${diag.id}'. Must start with one of: ${VALID_ID_PREFIXES.join(', ')}`);
    }

    // Validate ID format (uppercase with underscores)
    if (!/^[A-Z_0-9]+$/.test(diag.id)) {
      warnings.push(`ID '${diag.id}' should use UPPER_SNAKE_CASE format`);
    }
  }

  if (diag.context === undefined || diag.context === null) {
    errors.push("Missing required field 'context'");
  } else if (diag.context.trim().length === 0) {
    errors.push("Field 'context' cannot be empty");
  }

  if (!diag.severity) {
    errors.push("Missing required field 'severity'");
  } else if (!VALID_SEVERITIES.includes(diag.severity)) {
    errors.push(`Invalid severity '${diag.severity}'. Must be one of: ${VALID_SEVERITIES.join(', ')}`);
  }

  // Validate params against glossary
  if (diag.params) {
    for (const key of Object.keys(diag.params)) {
      const normalizedKey = key.toLowerCase().replace(/_/g, '');
      const inGlossary = glossary.some(term => 
        normalizedKey.includes(term) || term.includes(normalizedKey)
      );
      
      if (!inGlossary) {
        warnings.push(`Parameter key '${key}' not found in glossary`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate multiple diagnostics and generate a report
 */
export function generateValidationReport(diagnostics: Diagnostic[]): LingoValidationReport {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  let validCount = 0;
  let invalidCount = 0;

  for (const diag of diagnostics) {
    const result = validateDiagnostic(diag);
    
    if (result.valid) {
      validCount++;
    } else {
      invalidCount++;
      result.errors.forEach(err => {
        allErrors.push(`[${diag.id || 'UNKNOWN'}] ${err}`);
      });
    }

    result.warnings.forEach(warn => {
      allWarnings.push(`[${diag.id || 'UNKNOWN'}] ${warn}`);
    });
  }

  return {
    valid: invalidCount === 0,
    errors: allErrors,
    warnings: allWarnings,
    diagnosticCount: diagnostics.length,
    validCount,
    invalidCount,
  };
}
