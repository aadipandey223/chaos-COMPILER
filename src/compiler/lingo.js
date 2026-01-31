/**
 * Lingo.dev Compiler Utility
 * Enforces glossary, validates placeholders, and ensures terminology consistency.
 */

// Controlled vocabularies
const GLOSSARY = ['block', 'ir', 'ssa', 'chaos', 'predicate', 'operator', 'instruction', 'transformation', 'strategy', 'intensity', 'original', 'value', 'budget', 'safety', 'seed'];
const REQUIRED_FIELDS = ['id', 'context', 'severity'];
const VALID_SEVERITIES = ['info', 'warning', 'error', 'low', 'medium', 'high'];
const VALID_ID_PREFIXES = ['CHAOS_', 'LINGO_', 'IR_', 'PARSE_', 'CODEGEN_'];

export const LingoCompiler = {
    validate: (diagnostics) => {
        const errors = [];
        const warnings = [];

        diagnostics.forEach((d, idx) => {
            // 1. Structural Schema Validation (REQUIRED)
            REQUIRED_FIELDS.forEach(field => {
                if (!d[field]) {
                    errors.push(`[Lingo] Missing required field '${field}' in diagnostic #${idx}`);
                }
            });

            // 2. Severity Vocabulary Check
            if (d.severity && !VALID_SEVERITIES.includes(d.severity.toLowerCase())) {
                errors.push(`[Lingo] Invalid severity '${d.severity}' in ${d.id}. Must be one of: ${VALID_SEVERITIES.join(', ')}`);
            }

            // 3. ID Prefix Validation
            if (d.id) {
                const hasValidPrefix = VALID_ID_PREFIXES.some(prefix => d.id.startsWith(prefix));
                if (!hasValidPrefix) {
                    warnings.push(`[Lingo] Non-standard ID prefix in '${d.id}'. Expected: ${VALID_ID_PREFIXES.join(', ')}`);
                }
            }

            // 4. Context Non-Empty Check
            if (d.context && d.context.trim().length === 0) {
                errors.push(`[Lingo] Empty context string in ${d.id}`);
            }

            // 5. Parameter Terminology Check (existing but enhanced)
            if (d.params && typeof d.params === 'object') {
                Object.keys(d.params).forEach(key => {
                    const normalized = key.toLowerCase();
                    const isGlossaryTerm = GLOSSARY.includes(normalized);
                    const isCommonKey = ['instr', 'op', 'cond', 'type', 'id', 'orig', 'reason', 'target', 'left', 'right', 'seed'].includes(normalized);

                    if (!isGlossaryTerm && !isCommonKey) {
                        warnings.push(`[Lingo] Glossary Warning: '${key}' in ${d.id} is not standard terminology.`);
                    }
                });
            }

            // 6. Chaos-specific context validation
            if (d.id && d.id.startsWith('CHAOS_') && d.context && !d.context.toLowerCase().includes('chaos')) {
                warnings.push(`[Lingo] Metadata Mismatch: ${d.id} should have chaos-related context.`);
            }

            // 7. NO EXAMPLE DRIFT RULE (Strict Validation)
            // If the diagnostic has params, the explanation (if present) MUST reference them.
            if (d.explanation && d.params && typeof d.params === 'object') {
                // Clean the explanation of HTML tags or markdown for checking
                const cleanExplanation = d.explanation.toString().toLowerCase();

                // Critical parameters that MUST be in the explanation
                const criticalKeys = ['orig', 'enc', 'op', 'invariant', 'expression', 'left', 'right', 'cond'];

                Object.keys(d.params).forEach(key => {
                    if (criticalKeys.includes(key) && d.params[key] !== undefined) {
                        const val = String(d.params[key]).toLowerCase();
                        // Loose check: is the value (e.g. "5" or "x*x") present in the text?
                        // We skip very short values (length < 2) to avoid false positives on 'x', 'i', '1'
                        if (val.length >= 2 && !cleanExplanation.includes(val)) {
                            // SPECIAL CASE: 'enc' param might be a complex expression that gets formatted differently.
                            // We allow fuzzy matching or skip strict check for complex math expressions if individual numbers are found.
                            // For now, strict:
                            warnings.push(`[Lingo] Explanation Drift: Explanation for ${d.id} is missing reference to '${key}' value '${val}'.`);
                        }
                    }
                });
            }
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            stats: {
                total: diagnostics.length,
                errorsCount: errors.length,
                warningsCount: warnings.length
            }
        };
    },

    generateReport: (diagnostics) => {
        const validation = LingoCompiler.validate(diagnostics);
        return {
            summary: `${diagnostics.length} diagnostics validated by Lingo.dev Compiler`,
            ...validation
        };
    },

    /**
     * Simulation metadata for auditable testing
     */
    TEST_FAILURE_MODES: {
        'MISSING_SEVERITY': {
            id: 'LINGO_TEST_001',
            context: 'Missing severity field violation',
            // severity: 'high' // Intentionally omitted
            __reason: 'Demonstrating Lingo schema enforcement (required fields)'
        },
        'EMPTY_CONTEXT': {
            id: 'LINGO_TEST_002',
            context: '', // Intentionally empty
            severity: 'medium',
            __reason: 'Demonstrating Lingo content validation (non-empty strings)'
        },
        'INVALID_ID_FORMAT': {
            id: 'bad_id_123', // Does not follow LINGO_ prefix convention
            context: 'Invalid ID format violation',
            severity: 'low',
            __reason: 'Demonstrating Lingo glossary enforcement'
        },
        'UNKNOWN_TERM': {
            id: 'LINGO_TEST_003',
            context: 'Uses non-glossary term in params',
            params: { magic_spells: true },
            severity: 'high',
            __reason: 'Demonstrating vocabulary control'
        }
    },

    /**
     * Injects an auditable failure mode for demonstration purposes
     */
    injectTestFailure: (diagnostics, mode) => {
        if (!mode || !LingoCompiler.TEST_FAILURE_MODES[mode]) return diagnostics;
        return [...diagnostics, LingoCompiler.TEST_FAILURE_MODES[mode]];
    }
};
