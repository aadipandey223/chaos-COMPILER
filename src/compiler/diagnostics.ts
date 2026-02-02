import { Diagnostic, DiagnosticSeverity } from '../types';

// ============================================================================
// DIAGNOSTICS SERVICE
// Emits and manages compiler diagnostics
// ============================================================================

class DiagnosticsService {
  private diagnostics: Diagnostic[] = [];

  /**
   * Emit a new diagnostic
   */
  emit(
    id: string,
    context: string,
    severity: DiagnosticSeverity,
    params?: Record<string, unknown>,
    explanation?: string
  ): void {
    this.diagnostics.push({
      id,
      context,
      severity,
      params,
      explanation,
      timestamp: Date.now(),
    });
  }

  /**
   * Get all diagnostics
   */
  getAll(): Diagnostic[] {
    return [...this.diagnostics];
  }

  /**
   * Get diagnostics by severity
   */
  getBySeverity(severity: DiagnosticSeverity): Diagnostic[] {
    return this.diagnostics.filter(d => d.severity === severity);
  }

  /**
   * Get diagnostics by ID prefix
   */
  getByPrefix(prefix: string): Diagnostic[] {
    return this.diagnostics.filter(d => d.id.startsWith(prefix));
  }

  /**
   * Clear all diagnostics
   */
  clear(): void {
    this.diagnostics = [];
  }

  /**
   * Get count by severity
   */
  getCounts(): Record<DiagnosticSeverity, number> {
    const counts: Record<DiagnosticSeverity, number> = {
      info: 0,
      warning: 0,
      error: 0,
    };

    for (const diag of this.diagnostics) {
      counts[diag.severity]++;
    }

    return counts;
  }
}

// Singleton instance
export const diagnostics = new DiagnosticsService();

// ============================================================================
// PREDEFINED DIAGNOSTIC IDS
// ============================================================================

export const DiagnosticIds = {
  // Chaos Engine
  CHAOS_NUM_ENCODING: 'CHAOS_NUM_ENCODING',
  CHAOS_SUBSTITUTION: 'CHAOS_SUBSTITUTION',
  CHAOS_OPAQUE_PREDICATE: 'CHAOS_OPAQUE_PREDICATE',
  CHAOS_FLATTENING: 'CHAOS_FLATTENING',
  CHAOS_CUSTOM_RULE: 'CHAOS_CUSTOM_RULE',
  CHAOS_BUDGET_EXHAUSTED: 'CHAOS_BUDGET_EXHAUSTED',
  CHAOS_SEMANTIC_PRESERVED: 'CHAOS_SEMANTIC_PRESERVED',
  CHAOS_SEMANTIC_FAILED: 'CHAOS_SEMANTIC_FAILED',

  // IR
  IR_GENERATED: 'IR_GENERATED',
  IR_INSTRUCTION: 'IR_INSTRUCTION',
  IR_TRANSFORM: 'IR_TRANSFORM',

  // Parser
  PARSE_SUCCESS: 'PARSE_SUCCESS',
  PARSE_ERROR: 'PARSE_ERROR',
  PARSE_WARNING: 'PARSE_WARNING',

  // CodeGen
  CODEGEN_START: 'CODEGEN_START',
  CODEGEN_COMPLETE: 'CODEGEN_COMPLETE',

  // Lingo
  LINGO_VALIDATION_PASS: 'LINGO_VALIDATION_PASS',
  LINGO_VALIDATION_FAIL: 'LINGO_VALIDATION_FAIL',
} as const;

// ============================================================================
// DIAGNOSTIC FORMATTERS
// ============================================================================

export function formatDiagnostic(diag: Diagnostic): string {
  const severityIcon = {
    info: 'ℹ',
    warning: '⚠',
    error: '✗',
  }[diag.severity];

  const paramsStr = diag.params 
    ? ` ${JSON.stringify(diag.params)}`
    : '';

  return `${severityIcon} [${diag.id}] ${diag.context}${paramsStr}`;
}

export function formatDiagnostics(diags: Diagnostic[]): string {
  return diags.map(formatDiagnostic).join('\n');
}

// ============================================================================
// CHAOS TRANSFORMATION DIAGNOSTICS
// ============================================================================

export function emitNumberEncodingDiagnostic(
  original: number,
  encoded: string,
  offset: number
): void {
  diagnostics.emit(
    DiagnosticIds.CHAOS_NUM_ENCODING,
    'chaos.transform.encoding',
    'info',
    { original, encoding: encoded, offset },
    `Encoded constant ${original} as ${encoded} with offset ${offset}`
  );
}

export function emitSubstitutionDiagnostic(
  sourceOp: string,
  targetSequence: string[]
): void {
  diagnostics.emit(
    DiagnosticIds.CHAOS_SUBSTITUTION,
    'chaos.transform.substitution',
    'info',
    { source: sourceOp, target: targetSequence.join(', ') },
    `Substituted ${sourceOp} with bitwise sequence: ${targetSequence.join(' → ')}`
  );
}

export function emitOpaquePredDiagnostic(
  variable: string
): void {
  diagnostics.emit(
    DiagnosticIds.CHAOS_OPAQUE_PREDICATE,
    'chaos.transform.opaque',
    'info',
    { variable, predicate: '(x*x + x) % 2 == 0' },
    `Injected opaque predicate using variable '${variable}'`
  );
}

export function emitFlatteningDiagnostic(
  instructionCount: number
): void {
  diagnostics.emit(
    DiagnosticIds.CHAOS_FLATTENING,
    'chaos.transform.flattening',
    'info',
    { instruction: instructionCount },
    `Flattened ${instructionCount} instructions into dispatcher-based control flow`
  );
}

export function emitBudgetExhaustedDiagnostic(
  type: string,
  limit: number
): void {
  diagnostics.emit(
    DiagnosticIds.CHAOS_BUDGET_EXHAUSTED,
    'chaos.budget',
    'warning',
    { budget: type, value: limit },
    `Chaos budget exhausted: ${type} limit of ${limit} reached`
  );
}

export function emitSemanticVerificationDiagnostic(
  original: number,
  transformed: number,
  passed: boolean
): void {
  diagnostics.emit(
    passed ? DiagnosticIds.CHAOS_SEMANTIC_PRESERVED : DiagnosticIds.CHAOS_SEMANTIC_FAILED,
    'chaos.verification',
    passed ? 'info' : 'error',
    { original, result: transformed, preserved: passed },
    passed 
      ? `Semantic preservation verified: original=${original}, transformed=${transformed}`
      : `SEMANTIC MISMATCH: original=${original} ≠ transformed=${transformed}`
  );
}
