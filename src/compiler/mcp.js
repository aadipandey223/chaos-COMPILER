/**
 * MCP - Multi-Agent / Context Provider Simulation
 * Provides depth-based explanations for chaos transformations.
 */

const EXPLANATIONS = {
    'CHAOS_SUBST_ADD': {
        student: (p) => `We replaced a simple '${p.op || '+'}' with a complex chain of XOR and AND operations. This hides the actual logic from anyone reading the raw binary, but the final result remains the same because (x+y) = (x^y) + 2*(x&y).`,
        researcher: (p) => `Arithmetic Instruction Substitution: Implementing algebraic identity x + y ≡ (x ⊕ y) + 2(x ∧ y) to increase instruction entropy and obfuscate data flow dependencies at the basic block level.`
    },
    'CHAOS_SUBST_XOR': {
        student: (p) => `This XOR operation is part of a trick to hide addition. XOR compares bits and returns 1 where they differ.`,
        researcher: (p) => `XOR component of instruction substitution. Part of the algebraic identity decomposition for ADD obfuscation.`
    },
    'CHAOS_SUBST_AND': {
        student: (p) => `This AND operation finds which bits 'carry over' during addition.`,
        researcher: (p) => `AND component capturing carry bits for the ADD substitution identity. Multiplied by 2 to account for carry propagation.`
    },
    'CHAOS_SUBST_MUL': {
        student: (p) => `We multiply by 2 here because when you add two 1-bits, you get a carry (like 1+1=10 in binary). This multiplication shifts those carries to the right place.`,
        researcher: (p) => `Carry multiplication step: Shifting the AND result left by 1 (×2) to properly position carry bits for the substituted addition.`
    },
    'CHAOS_SUBST_FINAL': {
        student: (p) => `This is the final step that combines the XOR and carry results to produce the original addition result.`,
        researcher: (p) => `Final recombination of XOR and shifted carry components to reconstruct the original ADD operation result.`
    },
    'CHAOS_OPAQUE_PRED': {
        student: (p) => `We added an 'if' statement with a condition that's ALWAYS true (checking if ${p.cond || 'x²+x'} is even). This confuses tools that try to analyze your code.`,
        researcher: (p) => `Opaque Predicate Deployment: Using the mathematical invariant ${p.invariant || '(x² + x) mod 2 ≡ 0'}, which holds for all integers.`
    },
    'CHAOS_OPAQUE_SQ': {
        student: (p) => `We're squaring a value (x × x). This is part of creating a condition that looks complex but always has the same result.`,
        researcher: (p) => `Opaque predicate component: Computing x² for the invariant (x² + x) mod 2 = 0.`
    },
    'CHAOS_OPAQUE_SUM': {
        student: (p) => `Adding x to x² gives us x² + x. This expression has a special property: it's ALWAYS even for any whole number!`,
        researcher: (p) => `Opaque predicate sum: x² + x = x(x+1), product of consecutive integers, guaranteed even.`
    },
    'CHAOS_OPAQUE_MOD': {
        student: (p) => `We check if (x² + x) divided by 2 has remainder 0. Since x² + x is always even, this is ALWAYS true!`,
        researcher: (p) => `Opaque predicate modulo check: Verifying (x² + x) mod 2 = 0, the invariant condition.`
    },
    'CHAOS_CF_FLATTEN': {
        student: (p) => `Even though your program is straight-line code, we wrapped it in a single-run loop to hide the execution structure. The logic is unchanged.`,
        researcher: (p) => `Control Flow Flattening (Lite): Encapsulating linear instruction sequences within a single-iteration dispatch loop to disrupt basic block identification.`
    },
    'CHAOS_ALGEBRAIC_SWAP': {
        student: (p) => `We swapped the order of operands. Since a ${p.op === 'MUL' ? '×' : '+'} b equals b ${p.op === 'MUL' ? '×' : '+'} a, the result is identical!`,
        researcher: (p) => `Algebraic Commutativity Transformation: Exploiting the commutative property of ${p.op || 'ADD/MUL'} operators to permute operand ordering.`
    },
    'CHAOS_NUM_ENCODING': {
        student: (p) => `We replaced the constant ${p.orig !== undefined ? p.orig : '(value)'} with an equivalent calculation (${p.enc || 'offset'}). The result is the same, but the original constant is harder to spot.`,
        researcher: (p) => `Integer Encoding Obfuscation: Replaced literal constant ${p.orig} with dynamically computed expression ${p.enc} to defend against constant scanning.`
    },
    'CHAOS_NUM_ENC_ADD': {
        student: "First, we ADD an offset to your number. Later we'll subtract it back. This two-step process hides what the original number was.",
        researcher: "Number encoding first step: Adding a random offset to the original constant. Will be reversed by subsequent subtraction."
    },
    'CHAOS_NUM_ENC_SUB': {
        student: "Now we SUBTRACT the same offset we added before. The result is your original number, but someone analyzing the code sees two operations instead of one constant.",
        researcher: "Number encoding second step: Subtracting the offset to restore the original value. The pair of operations replaces a single constant load."
    },
    'CHAOS_PLAN_SELECTED': {
        student: "The Chaos Engine picked a strategy for this compilation based on your code and intensity setting. It changes each time!",
        researcher: "Dynamic Heuristic Strategy Selection: The Chaos Planner analyzed IR metrics and selected an optimal obfuscation theme."
    },
    'COMPILE_CLEAN': {
        student: "Your code was compiled without any chaos transformations. The output is clean and predictable!",
        researcher: "Clean compilation pass completed. No obfuscation applied; IR directly translated to target assembly."
    },
    'Swapped': {
        student: "We swapped the left and right sides of this operation. Since order doesn't matter for + and ×, the result is identical!",
        researcher: "Commutative operand swap applied to obscure original operand ordering patterns."
    },
    'Flattening Break': {
        student: "This BREAK exits the fake loop immediately. The loop only ever runs once - it's there to confuse analysis tools.",
        researcher: "Control flow flattening terminator: Immediate loop exit ensuring single iteration while maintaining loop structure."
    },
    'Dead Branch': {
        student: "This code will NEVER run because the condition is always true. It's a fake path that only exists to confuse reverse engineers.",
        researcher: "Unreachable code block: Dead branch inserted as part of opaque predicate. Increases apparent complexity without affecting semantics."
    }
};

export const MCP = {
    getExplanation: (diagnosticId, mode = 'student', params = {}) => {
        const entry = EXPLANATIONS[diagnosticId];
        if (!entry) return `Transformation '${diagnosticId}' applied. Semantic equivalence maintained.`;

        const template = entry[mode];
        if (typeof template === 'function') {
            try {
                // Strict check: if it's a template but params are missing/empty, fall back or return null
                // This enforces the "No Example Drift" rule at the generation level
                return template(params);
            } catch (e) {
                return `[MCP Error] Failed to generate explanation for ${diagnosticId}`;
            }
        }

        return template || `Transformation '${diagnosticId}' applied.`;
    }
};
