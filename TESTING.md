# Testing Guide

## Running Tests

Chaos Lab includes a comprehensive test suite using Vitest.

### Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Structure

Tests are organized by compiler component:

- `src/compiler/__tests__/lexer.test.js` - Tokenization tests
- `src/compiler/__tests__/parser.test.js` - AST generation tests
- `src/compiler/__tests__/ir.test.js` - IR generation, transformation, and execution tests
- `src/compiler/__tests__/lingo.test.js` - Lingo validation tests

### What's Tested

#### Lexer (6 tests)
- Integer declarations
- Arithmetic operations
- Multiple operators
- Function declarations
- Whitespace handling
- Negative numbers

#### Parser (6 tests)
- Variable declarations
- Function declarations with returns
- Arithmetic expressions
- Expression precedence
- Empty functions
- Multiple statements

#### IR & Chaos Engine (11 tests)
- IR generation from AST
- Deterministic transformations (seeded RNG)
- Snapshot generation
- Budget limit warnings
- Semantic preservation
- Intensity levels
- IR execution correctness

#### Lingo Validation (10 tests)
- Schema validation
- Missing required fields
- Invalid severity values
- ID prefix conventions
- Empty context detection
- Non-glossary parameter warnings
- Report generation
- Test failure mode injection

### Writing New Tests

1. Create test file in `src/compiler/__tests__/`
2. Import from vitest: `import { describe, it, expect } from 'vitest';`
3. Import component under test
4. Follow existing patterns

Example:
```javascript
import { describe, it, expect } from 'vitest';
import { MyComponent } from '../myComponent';

describe('MyComponent', () => {
    it('should do something', () => {
        const result = MyComponent.doSomething();
        expect(result).toBe('expected');
    });
});
```

### Coverage

Run `npm run test:coverage` to generate a coverage report in `coverage/index.html`.

### CI/CD

Tests should be run in CI before merging:

```yaml
- name: Run tests
  run: npm test
```
