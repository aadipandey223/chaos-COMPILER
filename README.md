# Chaos Lab — Compiler Transformation Laboratory

**IR-level chaos compiler framework with validation-gated diagnostics.**

<p align="center">
  <img src="./public/screenshots/hero.png" alt="Chaos Lab UI" width="100%">
</p>

## Overview

Chaos Lab is a research-focused compiler front-end and IR-level transformation laboratory. It performs **semantic-preserving transformations** at the Intermediate Representation (IR) level, serving as an engine for studying program obfuscation and polymorphic code generation.

## Why This Project Exists

Most obfuscation tools act as black boxes. Chaos Lab is designed to make obfuscation *visible*, *explainable*, and *verifiable* at the IR level, allowing researchers to study how chaos affects program structure without breaking semantics.

The goal is to demonstrate how compiler-level obfuscation works by making the transformations inspectable and explainable.

**Key Features:**
*   **Structured IR**: Operates on an AST-based intermediate representation.
*   **Semantic Preservation**: Transformations do not alter the program's observable behavior.
*   **Validation Gate**: Integration with **Lingo.dev** to enforce diagnostic schemas and terminology.
*   **Inspectability**: Tools to visualize the difference between original and transformed IR.

---

## Architecture

The system follows a standard pipeline architecture:

```mermaid
graph TD
    A[Source Code (C)] --> B[Parser & IR Generator]
    B --> C[Chaos Engine (Transformations)]
    C --> D[Diagnostic Generator (MCP)]
    D --> E[Lingo.dev Validation]
    E --> F[UI Rendering]
```

### Directory Structure

```
chaos-COMPILER/
├── src/
│   ├── compiler/          # Core compiler components
│   │   ├── lexer.js       # Tokenization
│   │   ├── parser.js      # AST generation
│   │   ├── ir.js          # IR generation & transformations
│   │   ├── codegen.js     # Assembly generation
│   │   ├── diagnostics.js # Diagnostic system
│   │   ├── lingo.js       # Lingo validation
│   │   └── __tests__/     # Test suite
│   ├── components/        # React UI components
│   └── test/              # Test configuration
├── reference-implementations/ # C reference code (not used in production)
├── examples/              # Example C programs
└── public/                # Static assets
```

### Components

*   **Chaos Engine**: Selects and applies obfuscation strategies based on an intensity parameter.
*   **MCP (Model Context Provider)**: Generates human-readable explanations for each transformation. Treated as an untrusted source.
*   **Lingo.dev**: Validates diagnostic objects against a defined schema and glossary. Acts as a build blocker if validation fails.
*   **Explanation Modes**: Student and Researcher modes control how transformations are explained, not how they are executed.

---

## Transformations

The compiler implements the following obfuscation techniques:

### 1. Instruction Substitution
Replaces arithmetic operations with algebraically equivalent bitwise sequences.
*   Example: `a + b` → `(a ^ b) + 2 * (a & b)`

### 2. Opaque Predicates
Injects conditional branches that always evaluate to true but are difficult to determine statically.
*   Invariant: `(x*x + x) % 2 == 0` (always true for integers).

### 3. Control-Flow Flattening
Encapsulates linear code blocks within a dispatcher loop to obscure the execution path.

### 4. Number Encoding
Replaces integer constants with arithmetic expressions.
*   Example: `5` → `(5 + k) - k`

<p align="center">
  <img src="./public/screenshots/ir_diff.png" alt="IR Diff View" width="80%">
  <br>
  <em>IR Diff View</em>
</p>

---

## Integration Details

### Lingo.dev
This project uses Lingo.dev strictly for **validation**. It enforces:
*   **Schema**: Required fields (`id`, `context`, `severity`).
*   **Vocabulary**: Adherence to defined compiler terminology.

If a diagnostic fails validation, the build process flags it, ensuring no unverified information is presented to the user. Lingo.dev acts as a hard validation gate in the pipeline; if validation fails, diagnostics are blocked from rendering. **This project uses Lingo.dev Compiler for validation only; no translation or localization APIs are invoked.**

### MCP (Untrusted Layer)
The MCP layer generates the explanatory text for transformations. To prevent hallucinations or incorrect terminology, all MCP output flows through the Lingo validation gate before rendering.

---

## Scope & Limitations

*   **Browser Environment**: constrained by browser memory and execution limits.
*   **Language Support**: Supports a subset of C suitable for educational demonstrations.
*   **Mocked Features**: `sizeof` is mocked to a fixed width (4 bytes).
*   **Intended Use**: Educational visualization and small-scale obfuscation research.

---

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Build for production
npm build
```

### Using the Application

1.  Open the application in a modern browser.
2.  Try a **Demo Preset**: Click "Arithmetic Chaos", "Control Flow Chaos", or "Heavy Obfuscation"
3.  Paste a small C program into the editor (or use the provided example).
4.  Select a chaos intensity level (Low, Medium, High).
5.  Click **"Apply Chaos"** and inspect:
    - **IR Diff View**: See transformations in real-time
    - **Diagnostics Panel**: AI-generated explanations (validated by Lingo)
    - **Execution Output**: Verify semantic preservation
6.  **Experiment** with custom rules in the Orchestration tab
7.  **Save** your configurations for later use

### Demo Features

- **Quick Presets**: One-click configurations for common obfuscation patterns
- **Save/Load System**: Preserve and share your custom rule configurations
- **Hit Count Tracking**: See exactly how many times each rule was applied
- **Reset Button**: Instantly return to default configuration

### Testing

See [TESTING.md](TESTING.md) for comprehensive testing documentation.

---

## 🔬 Validation Failure Simulation (Testing Mode)

Chaos Lab includes an explicit failure simulation mode to demonstrate the authority of the Lingo.dev Compiler.

When a failure mode is selected (e.g., "Missing Severity"):
1.  **Auditable Injection**: The backend intentionally injects a malformed diagnostic JSON into the diagnostic stream.
2.  **Deterministic Validation**: This malformed diagnostic is passed through the standard Lingo validation pipeline.
3.  **Visible Enforcement**: The UI provides a side-by-side preview of the **Injected Json** vs. the **Lingo Validation Errors**, proving exactly what Lingo is rejecting.
4.  **Hardware-Level Block**: If validation fails, the system marks the build as invalid and suppresses all generative (MCP) content.

This mode proves that AI-generated content is treated as untrusted until verified by Lingo.dev's rule-based authority.

---

## License

MIT
