// Re-export compiler modules
export { Lexer, tokenize } from './lexer';
export { Parser, parse } from './parser';
export { IRGenerator, generateIR } from './ir-generator';
export { executeIR, verifySemanticPreservation, cloneIR } from './ir-executor';
export { applyChaos, CHAOS_PRESETS, setSeed, seededRandom } from './chaos-engine';
export { diagnostics, DiagnosticIds } from './diagnostics';
export { CodeGen } from './codegen'; // Export CodeGen

// Re-export types
export type {
  Token,
  TokenType,
  ASTNode,
  Program,
  IRInstruction,
  IRSnapshot,
  ChaosConfig,
  ChaosResult,
  Diagnostic,
} from '../types';
