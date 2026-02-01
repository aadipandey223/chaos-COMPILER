# Reference C Implementations

This directory contains **reference implementations** of the compiler components in C. These files are **not used** in the production JavaScript/React application but serve as:

1. **Educational reference** - Demonstrating how the compiler could be implemented in C
2. **Algorithm documentation** - Showing the core logic in a systems programming language
3. **Future WASM target** - Potential for compilation to WebAssembly for performance

## Files

- `chaos.c` / `chaos.h` - Chaos transformation engine reference
- `lexer.c` / `lexer.h` - Tokenization reference
- `parser.c` / `parser.h` - Parsing reference
- `codegen.c` / `codegen.h` - Code generation reference
- `verifier.c` - Semantic verification reference
- `ir.h` - IR data structures
- `main.c` - Example driver program

## Status

⚠️ **These files are NOT compiled or used in the web application.**

The authoritative implementations are the JavaScript files:
- `src/compiler/lexer.js`
- `src/compiler/parser.js`
- `src/compiler/ir.js`
- `src/compiler/codegen.js`
- `src/compiler/diagnostics.js`

## Future Work

If WASM compilation is added, these C files can serve as the foundation for a high-performance compiler backend. Use Emscripten:

```bash
emcc chaos.c lexer.c parser.c codegen.c -o chaos.wasm -s EXPORTED_FUNCTIONS='["_compile"]'
```

## Maintenance

⚠️ **Risk of drift**: These C files are not automatically synchronized with JS implementations. If core algorithms change, update both or remove C versions.
